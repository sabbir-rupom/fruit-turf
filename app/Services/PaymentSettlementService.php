<?php

namespace App\Services;

use App\Models\Order;
use App\Contracts\PaymentStrategy;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentSettlementService
{
    public function settle(Order $order, string $gatewayReference, PaymentStrategy $strategy): Order
    {
        return DB::transaction(function () use ($order, $gatewayReference, $strategy): Order {
            $order = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($order->payment_method !== $strategy->method()) {
                throw ValidationException::withMessages([
                    'payment' => 'The payment method does not match this order.',
                ]);
            }

            if ($order->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'payment' => 'A cancelled order cannot be settled.',
                ]);
            }

            if ($order->payment_status === Order::PAYMENT_PAID) {
                $alreadySettled = $order->transactions()
                    ->where('provider', $strategy->method())
                    ->where('gateway_reference', $gatewayReference)
                    ->where('status', 'paid')
                    ->exists();
                if ($alreadySettled) {
                    return $order;
                }

                throw ValidationException::withMessages([
                    'payment' => 'This order has already been settled.',
                ]);
            }

            $strategy->settle($order, $gatewayReference);
            $order->update(['payment_status' => Order::PAYMENT_PAID]);

            return $order->refresh();
        }, 3);
    }
}
