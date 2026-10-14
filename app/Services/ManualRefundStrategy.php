<?php

namespace App\Services;

use App\Contracts\RefundStrategy;
use App\Models\Refund;
use App\Models\Transaction;

class ManualRefundStrategy implements RefundStrategy
{
    public function settle(Refund $refund, string $gatewayReference): Transaction
    {
        return $refund->order->transactions()->create([
            'refund_id' => $refund->id,
            'type' => 'refund',
            'status' => 'paid',
            'amount' => $refund->amount,
            'provider' => $refund->order->payment_method === PaymentConfiguration::METHOD_STRIPE
                ? PaymentConfiguration::METHOD_STRIPE
                : 'manual',
            'gateway_reference' => $gatewayReference,
            'processed_at' => now(),
        ]);
    }
}
