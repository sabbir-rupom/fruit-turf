<?php

namespace App\Services;

use App\Contracts\PaymentStrategy;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Validation\ValidationException;

class StripePaymentStrategy implements PaymentStrategy
{
    public function method(): string
    {
        return PaymentConfiguration::METHOD_STRIPE;
    }

    public function settle(Order $order, string $gatewayReference): Transaction
    {
        if ($order->payment_method !== $this->method()) {
            throw ValidationException::withMessages([
                'payment' => 'Only Stripe orders can be settled through Stripe.',
            ]);
        }

        $transaction = $order->transactions()
            ->where('type', 'payment')
            ->where('provider', $this->method())
            ->where('gateway_reference', $gatewayReference)
            ->where('status', 'pending')
            ->lockForUpdate()
            ->first();

        if (! $transaction) {
            throw ValidationException::withMessages([
                'payment' => 'This Stripe Checkout session is not awaiting payment for the selected order.',
            ]);
        }

        $transaction->update([
            'status' => 'paid',
            'processed_at' => now(),
        ]);

        return $transaction->refresh();
    }
}
