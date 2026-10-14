<?php

namespace App\Services;

use App\Contracts\PaymentStrategy;
use App\Models\Order;
use App\Models\Transaction;

class ManualPaymentStrategy implements PaymentStrategy
{
    public function settle(Order $order, string $gatewayReference): Transaction
    {
        $transaction = $order->transactions()
            ->where('type', 'payment')
            ->where('status', 'pending')
            ->oldest()
            ->first();

        if ($transaction) {
            $transaction->update([
                'status' => 'paid',
                'provider' => 'manual',
                'gateway_reference' => $gatewayReference,
                'processed_at' => now(),
            ]);

            return $transaction->refresh();
        }

        return $order->transactions()->create([
            'type' => 'payment',
            'status' => 'paid',
            'amount' => $order->total,
            'provider' => 'manual',
            'gateway_reference' => $gatewayReference,
            'processed_at' => now(),
        ]);
    }
}
