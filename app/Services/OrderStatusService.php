<?php

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Services\PaymentConfiguration;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    /**
     * @var array<string, array<int, string>>
     */
    private const TRANSITIONS = [
        'pending' => ['processing', 'cancelled'],
        'processing' => ['shipped', 'cancelled'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
    ];

    public function update(Order $order, string $status, ?int $adminId, ?string $note = null): Order
    {
        return DB::transaction(function () use ($order, $status, $adminId, $note): Order {
            $order = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            $allowed = self::TRANSITIONS[$order->status] ?? [];

            if (! in_array($status, $allowed, true)) {
                throw ValidationException::withMessages([
                    'status' => "An order cannot transition from {$order->status} to {$status}.",
                ]);
            }

            if ($status === Order::STATUS_CANCELLED && $order->payment_status === Order::PAYMENT_PAID) {
                throw ValidationException::withMessages([
                    'status' => 'A paid order must be refunded before it can be cancelled.',
                ]);
            }

            if ($status === Order::STATUS_CANCELLED
                && $order->payment_method === PaymentConfiguration::METHOD_STRIPE
                && $order->payment_status === Order::PAYMENT_PENDING) {
                throw ValidationException::withMessages([
                    'status' => 'Wait for Stripe to expire this payment session before cancelling the order.',
                ]);
            }

            if ($order->payment_method === PaymentConfiguration::METHOD_STRIPE
                && $order->payment_status !== Order::PAYMENT_PAID
                && in_array($status, [Order::STATUS_PROCESSING, Order::STATUS_SHIPPED, Order::STATUS_DELIVERED], true)) {
                throw ValidationException::withMessages([
                    'status' => 'A Stripe order can only be fulfilled after payment is confirmed.',
                ]);
            }

            if ($status === Order::STATUS_CANCELLED) {
                $items = $order->items()->with('product')->get();
                $productIds = $items->pluck('product_id')->filter()->unique()->sort()->values();
                $lockedProducts = \App\Models\Product::withTrashed()
                    ->whereIn('id', $productIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                foreach ($items as $item) {
                    $product = $lockedProducts->get($item->product_id);
                    if (! $product) {
                        continue;
                    }

                    $quantity = (float) $item->quantity;
                    $product->increment('stock_quantity', $quantity);
                    InventoryMovement::query()->create([
                        'product_id' => $product->id,
                        'order_id' => $order->id,
                        'user_id' => $adminId,
                        'type' => 'cancellation',
                        'quantity_delta' => $quantity,
                        'reason' => $note ?? "Stock restored for cancelled order {$order->invoice_number}",
                    ]);
                }
            }

            $previousStatus = $order->status;
            $order->update(['status' => $status]);
            event(new OrderStatusChanged($order, $previousStatus, $status, $adminId, $note));

            return $order->refresh();
        }, 3);
    }
}
