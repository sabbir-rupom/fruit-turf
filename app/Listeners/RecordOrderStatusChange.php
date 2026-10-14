<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\OrderStatusHistory;

class RecordOrderStatusChange
{
    public function handle(OrderStatusChanged $event): void
    {
        OrderStatusHistory::query()->create([
            'order_id' => $event->order->id,
            'user_id' => $event->userId,
            'from_status' => $event->fromStatus,
            'to_status' => $event->toStatus,
            'note' => $event->note,
        ]);
    }
}
