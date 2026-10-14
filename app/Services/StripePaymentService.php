<?php

namespace App\Services;

use App\Contracts\StripeGateway;
use App\Models\Order;
use App\Models\Transaction;
use App\ValueObjects\StripeCheckoutSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Stripe\Exception\ApiErrorException;

class StripePaymentService
{
    public function __construct(
        private readonly StripeGateway $gateway,
        private readonly PaymentConfiguration $configuration,
        private readonly PaymentSettlementService $settlement,
        private readonly StripePaymentStrategy $strategy,
        private readonly OrderStatusService $statuses,
    ) {}

    public function startCheckout(Order $order): string
    {
        if (! $this->configuration->stripeAvailableForCheckout()) {
            $this->failCheckoutOrder($order);

            throw ValidationException::withMessages([
                'payment_method' => 'Stripe is not configured for this store. Choose cash on delivery or contact the store administrator.',
            ]);
        }

        try {
            $session = $this->gateway->createCheckoutSession($order);
            $host = parse_url((string) $session->url, PHP_URL_HOST);
            if (! $session->id
                || $session->status !== 'open'
                || $session->orderId !== (string) $order->id
                || $session->amountTotal !== (int) round((float) $order->total * 100)
                || strtolower((string) $session->currency) !== strtolower($order->currency)
                || ! $session->url
                || parse_url($session->url, PHP_URL_SCHEME) !== 'https'
                || ! is_string($host) || ! str_ends_with($host, '.stripe.com')) {
                throw new RuntimeException('Stripe returned an invalid or mismatched Checkout session.');
            }

            DB::transaction(function () use ($order, $session): void {
                $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
                if ($lockedOrder->payment_status !== Order::PAYMENT_PENDING
                    || $lockedOrder->status === Order::STATUS_CANCELLED) {
                    throw ValidationException::withMessages([
                        'payment_method' => 'This order is no longer eligible for Stripe Checkout.',
                    ]);
                }

                $transaction = $lockedOrder->transactions()
                    ->where('type', 'payment')
                    ->where('provider', PaymentConfiguration::METHOD_STRIPE)
                    ->where('status', 'pending')
                    ->whereNull('gateway_reference')
                    ->lockForUpdate()
                    ->firstOrFail();

                $transaction->update(['gateway_reference' => $session->id]);
            }, 3);

            return $session->url;
        } catch (ApiErrorException|RuntimeException|ValidationException $exception) {
            Log::error('Stripe Checkout session creation failed.', [
                'order_id' => $order->id,
                'exception' => $exception::class,
            ]);
            $this->failCheckoutOrder($order);

            throw ValidationException::withMessages([
                'payment_method' => 'Stripe could not start a secure checkout. Your basket stock has been released; please try again.',
            ]);
        }
    }

    public function confirmReturn(Order $order, string $sessionId): Order
    {
        $transaction = $this->pendingStripeTransaction($order, $sessionId);
        $session = $this->gateway->retrieveCheckoutSession($sessionId);
        $this->assertSessionMatchesOrder($order, $transaction, $session);

        if ($session->status === 'complete' && $session->paymentStatus === 'paid') {
            $this->storePaymentIntent($transaction, $session);

            return $this->settlement->settle($order, $sessionId, $this->strategy);
        }

        return $order->refresh();
    }

    public function handleCompletedSession(StripeCheckoutSession $session): void
    {
        if (! $session->orderId || ! $session->id) {
            throw ValidationException::withMessages([
                'payment' => 'The Stripe event is missing its order reference.',
            ]);
        }

        $order = Order::query()->findOrFail($session->orderId);
        $transaction = $this->pendingStripeTransaction($order, $session->id);
        $this->assertSessionMatchesOrder($order, $transaction, $session);

        if ($session->status === 'complete' && $session->paymentStatus === 'paid') {
            $this->storePaymentIntent($transaction, $session);
            $this->settlement->settle($order, $session->id, $this->strategy);
        }
    }

    public function handleFailedSession(StripeCheckoutSession $session, string $reason): void
    {
        if (! $session->orderId || ! $session->id) {
            throw ValidationException::withMessages([
                'payment' => 'The Stripe event is missing its order reference.',
            ]);
        }

        DB::transaction(function () use ($session, $reason): void {
            $order = Order::query()->whereKey($session->orderId)->lockForUpdate()->firstOrFail();
            $transaction = $this->pendingStripeTransaction($order, $session->id, lock: true);
            $this->assertSessionMatchesOrder($order, $transaction, $session);

            if ($order->payment_status === Order::PAYMENT_PAID || $order->status === Order::STATUS_CANCELLED) {
                return;
            }

            $transaction->update(['status' => 'failed', 'processed_at' => now()]);
            $order->update(['payment_status' => Order::PAYMENT_FAILED]);
            $this->statuses->update($order, Order::STATUS_CANCELLED, null, $reason);
        }, 3);
    }

    public function expireCheckout(Order $order): Order
    {
        $transaction = $order->transactions()
            ->where('type', 'payment')
            ->where('provider', PaymentConfiguration::METHOD_STRIPE)
            ->latest('id')
            ->firstOrFail();

        if (! $transaction->gateway_reference) {
            throw ValidationException::withMessages([
                'payment' => 'The Stripe Checkout session is not available to cancel yet.',
            ]);
        }

        $session = $this->gateway->expireCheckoutSession($transaction->gateway_reference);
        $this->assertSessionMatchesOrder($order, $transaction, $session);

        if ($session->status === 'complete' && $session->paymentStatus === 'paid') {
            return $this->settlement->settle($order, $session->id, $this->strategy);
        }

        if ($session->status === 'expired') {
            $this->handleFailedSession($session, 'Stripe Checkout was cancelled by the customer.');
        }

        return $order->refresh();
    }

    private function failCheckoutOrder(Order $order): void
    {
        DB::transaction(function () use ($order): void {
            $order = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($order->payment_status === Order::PAYMENT_PAID || $order->status === Order::STATUS_CANCELLED) {
                return;
            }

            $order->transactions()
                ->where('type', 'payment')
                ->where('provider', PaymentConfiguration::METHOD_STRIPE)
                ->where('status', 'pending')
                ->update(['status' => 'failed', 'processed_at' => now()]);
            $order->update(['payment_status' => Order::PAYMENT_FAILED]);
            $this->statuses->update($order, Order::STATUS_CANCELLED, null, 'Stripe Checkout session creation failed.');
        }, 3);
    }

    private function pendingStripeTransaction(Order $order, string $sessionId, bool $lock = false): Transaction
    {
        $query = $order->transactions()
            ->where('type', 'payment')
            ->where('provider', PaymentConfiguration::METHOD_STRIPE)
            ->where('gateway_reference', $sessionId);

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    private function assertSessionMatchesOrder(Order $order, Transaction $transaction, StripeCheckoutSession $session): void
    {
        $expectedAmount = (int) round((float) $order->total * 100);

        if ($order->payment_method !== PaymentConfiguration::METHOD_STRIPE
            || $transaction->gateway_reference !== $session->id
            || $session->orderId !== (string) $order->id
            || $session->amountTotal !== $expectedAmount
            || strtolower((string) $session->currency) !== strtolower($order->currency)) {
            throw ValidationException::withMessages([
                'payment' => 'Stripe session details do not match this order.',
            ]);
        }
    }

    private function storePaymentIntent(Transaction $transaction, StripeCheckoutSession $session): void
    {
        if (! $session->paymentIntentId) {
            return;
        }

        $transaction->update([
            'metadata' => [...($transaction->metadata ?? []), 'payment_intent' => $session->paymentIntentId],
        ]);
    }
}
