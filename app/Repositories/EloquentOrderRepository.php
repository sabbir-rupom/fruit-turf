<?php

namespace App\Repositories;

use App\Contracts\OrderRepository;
use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentOrderRepository implements OrderRepository
{
    public function save(Order $order): Order
    {
        $order->save();

        return $order;
    }

    public function paginateForCustomer(int $userId): LengthAwarePaginator
    {
        return Order::query()
            ->where('user_id', $userId)
            ->with(['items.product:id,slug,featured_image', 'transactions'])
            ->latest('placed_at')
            ->paginate(10);
    }
}
