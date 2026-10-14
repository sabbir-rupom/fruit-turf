<?php

namespace App\Services;

use App\Contracts\PaymentStrategy;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentSettlementService
{
    public function __construct(private readonly PaymentStrategy $strategy) {}

    public function settle(Order $order, string $gatewayReference): Order
    {
        return DB::transaction(function () use ($order, $gatewayReference): Order {
            $order = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($order->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'payment' => 'A cancelled order cannot be settled.',
                ]);
            }

            if ($order->payment_status === Order::PAYMENT_PAID) {
                throw ValidationException::withMessages([
                    'payment' => 'This order has already been settled.',
                ]);
            }

            $this->strategy->settle($order, $gatewayReference);
            $order->update(['payment_status' => Order::PAYMENT_PAID]);

            return $order->refresh();
        }, 3);
    }
}
