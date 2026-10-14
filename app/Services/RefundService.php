<?php

namespace App\Services;

use App\Contracts\RefundStrategy;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\Refund;
use App\Models\RefundItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RefundService
{
    public function __construct(private readonly RefundStrategy $strategy) {}

    /**
     * @param array<int, array{order_item_id: int, quantity: int|float|string, restock?: bool}> $items
     */
    public function request(Order $order, int $userId, string $reason, array $items): Refund
    {
        return DB::transaction(function () use ($order, $userId, $reason, $items): Refund {
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->status !== Order::STATUS_DELIVERED || $lockedOrder->payment_status !== Order::PAYMENT_PAID) {
                throw ValidationException::withMessages([
                    'order' => 'Refunds can only be requested for delivered, paid orders.',
                ]);
            }

            $orderItems = $lockedOrder->items()->get()->keyBy('id');
            $refundItems = collect($items);
            $requestedAmount = 0.0;

            foreach ($refundItems as $refundItem) {
                $item = $orderItems->get((int) $refundItem['order_item_id']);
                if (! $item) {
                    throw ValidationException::withMessages([
                        'items' => 'The selected item does not belong to this order.',
                    ]);
                }

                $alreadyRefunded = (float) RefundItem::query()
                    ->where('order_item_id', $item->id)
                    ->whereHas('refund', fn ($query) => $query->whereNot('status', 'rejected'))
                    ->sum('quantity');
                $quantity = (float) $refundItem['quantity'];

                if ($quantity <= 0 || $alreadyRefunded + $quantity > (float) $item->quantity) {
                    throw ValidationException::withMessages([
                        'items' => "The requested quantity for {$item->product_title} exceeds the refundable amount.",
                    ]);
                }

                $requestedAmount += round((float) $item->unit_price * $quantity, 2);
            }

            if ($requestedAmount <= 0 || $requestedAmount > (float) $lockedOrder->total) {
                throw ValidationException::withMessages([
                    'items' => 'The refund amount must be greater than zero and no more than the order total.',
                ]);
            }

            $refund = $lockedOrder->refunds()->create([
                'requested_by' => $userId,
                'amount' => $requestedAmount,
                'reason' => $reason,
                'status' => 'pending',
            ]);

            foreach ($refundItems as $refundItem) {
                $item = $orderItems->get((int) $refundItem['order_item_id']);
                $quantity = (float) $refundItem['quantity'];
                $refund->items()->create([
                    'order_item_id' => $item->id,
                    'quantity' => $quantity,
                    'amount' => round((float) $item->unit_price * $quantity, 2),
                    'restock' => (bool) ($refundItem['restock'] ?? false),
                ]);
            }

            return $refund->load(['order', 'items.orderItem']);
        }, 3);
    }

    public function process(Refund $refund, int $adminId, string $gatewayReference): Refund
    {
        return DB::transaction(function () use ($refund, $adminId, $gatewayReference): Refund {
            $refund = Refund::query()
                ->whereKey($refund->id)
                ->lockForUpdate()
                ->with(['order', 'items.orderItem'])
                ->firstOrFail();

            if ($refund->status !== 'pending') {
                throw ValidationException::withMessages([
                    'refund' => 'Only pending refunds can be processed.',
                ]);
            }

            $refund->update([
                'status' => 'processed',
                'processed_by' => $adminId,
                'gateway_reference' => $gatewayReference,
                'processed_at' => now(),
            ]);
            $this->strategy->settle($refund, $gatewayReference);

            $productIds = $refund->items
                ->where('restock', true)
                ->map(fn (RefundItem $item) => $item->orderItem?->product_id)
                ->filter()
                ->unique()
                ->sort()
                ->values();
            $products = Product::withTrashed()
                ->whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($refund->items->where('restock', true) as $refundItem) {
                $product = $products->get($refundItem->orderItem?->product_id);
                if (! $product) {
                    continue;
                }

                $quantity = (float) $refundItem->quantity;
                $product->increment('stock_quantity', $quantity);
                InventoryMovement::query()->create([
                    'product_id' => $product->id,
                    'order_id' => $refund->order_id,
                    'refund_id' => $refund->id,
                    'user_id' => $adminId,
                    'type' => 'refund_restock',
                    'quantity_delta' => $quantity,
                    'reason' => "Restock for refund #{$refund->id}",
                ]);
            }

            return $refund->refresh()->load(['order', 'items.orderItem', 'transactions']);
        }, 3);
    }

    public function reject(Refund $refund, int $adminId): Refund
    {
        return DB::transaction(function () use ($refund, $adminId): Refund {
            $refund = Refund::query()->whereKey($refund->id)->lockForUpdate()->firstOrFail();
            if ($refund->status !== 'pending') {
                throw ValidationException::withMessages([
                    'refund' => 'Only pending refunds can be rejected.',
                ]);
            }

            $refund->update(['status' => 'rejected', 'processed_by' => $adminId]);

            return $refund->refresh();
        }, 3);
    }
}
