<?php

namespace App\Events;

use App\Models\Order;

class OrderStatusChanged
{
    public function __construct(
        public Order $order,
        public ?string $fromStatus,
        public string $toStatus,
        public ?int $userId = null,
        public ?string $note = null,
    ) {}
}
