<?php

namespace App\Services;

use App\Contracts\StripeGateway;
use App\Models\Order;
use App\ValueObjects\StripeCheckoutSession;
use Stripe\StripeClient;

class StripeSdkGateway implements StripeGateway
{
    public function __construct(private readonly PaymentConfiguration $configuration) {}

    public function createCheckoutSession(Order $order): StripeCheckoutSession
    {
        $stripe = new StripeClient($this->configuration->stripeSecretKey());
        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'customer_email' => $order->buyer_email,
            'client_reference_id' => $order->invoice_number,
            'metadata' => [
                'order_id' => (string) $order->id,
                'invoice_number' => $order->invoice_number,
            ],
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($order->currency),
                    'unit_amount' => (int) round((float) $order->total * 100),
                    'product_data' => [
                        'name' => "Fruit Turf order {$order->invoice_number}",
                        'description' => 'Fresh fruit delivery',
                    ],
                ],
            ]],
            'success_url' => route('payments.stripe.return', ['order' => $order->invoice_number]).'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('payments.stripe.cancelled', ['order' => $order->invoice_number]),
            'expires_at' => now()->addHour()->timestamp,
        ], [
            'idempotency_key' => "fruit-turf-checkout-{$order->id}",
        ]);

        return StripeCheckoutSession::fromStripe($session);
    }

    public function retrieveCheckoutSession(string $sessionId): StripeCheckoutSession
    {
        $stripe = new StripeClient($this->configuration->stripeSecretKey());

        return StripeCheckoutSession::fromStripe($stripe->checkout->sessions->retrieve($sessionId));
    }

    public function expireCheckoutSession(string $sessionId): StripeCheckoutSession
    {
        $stripe = new StripeClient($this->configuration->stripeSecretKey());
        $session = $stripe->checkout->sessions->retrieve($sessionId);

        if ($session->status === 'open') {
            $session = $stripe->checkout->sessions->expire($sessionId);
        }

        return StripeCheckoutSession::fromStripe($session);
    }
}
