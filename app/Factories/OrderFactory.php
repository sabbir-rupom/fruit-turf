<?php

namespace App\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Str;

class OrderFactory
{
    /**
     * Build an order from validated checkout details; the repository persists it.
     *
     * @param array<string, mixed> $buyer
     */
    public function make(array $buyer, ?User $customer, float $subtotal): Order
    {
        return new Order([
            'invoice_number' => 'FT-'.now()->format('ymd').'-'.Str::upper(Str::random(8)),
            'user_id' => $customer?->id,
            'buyer_name' => $buyer['name'],
            'buyer_email' => $buyer['email'],
            'buyer_phone' => $buyer['phone'] ?? null,
            'delivery_address' => $buyer['delivery_address'],
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'payment_method' => 'cash_on_delivery',
            'currency' => config('fruit-turf.currency', 'BDT'),
            'subtotal' => $subtotal,
            'total' => $subtotal,
            'customer_note' => $buyer['customer_note'] ?? null,
            'placed_at' => now(),
        ]);
    }
}
