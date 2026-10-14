<?php

namespace App\Services;

use App\Contracts\PaymentStrategy;
use App\Models\Order;
use App\Models\Transaction;

class ManualPaymentStrategy implements PaymentStrategy
{
    public function method(): string
    {
        return PaymentConfiguration::METHOD_CASH_ON_DELIVERY;
    }

    public function settle(Order $order, string $gatewayReference): Transaction
    {
        if ($order->payment_method !== $this->method()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'payment' => 'Only cash-on-delivery orders can be manually settled.',
            ]);
        }

        $transaction = $order->transactions()
            ->where('type', 'payment')
            ->where('provider', $this->method())
            ->where('status', 'pending')
            ->oldest()
            ->first();

        if ($transaction) {
            $transaction->update([
                'status' => 'paid',
                'provider' => $this->method(),
                'gateway_reference' => $gatewayReference,
                'processed_at' => now(),
            ]);

            return $transaction->refresh();
        }

        return $order->transactions()->create([
            'type' => 'payment',
            'status' => 'paid',
            'amount' => $order->total,
            'provider' => $this->method(),
            'gateway_reference' => $gatewayReference,
            'processed_at' => now(),
        ]);
    }
}
