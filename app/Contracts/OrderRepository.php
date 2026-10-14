<?php

namespace App\Contracts;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OrderRepository
{
    public function save(Order $order): Order;

    /**
     * @return LengthAwarePaginator<int, Order>
     */
    public function paginateForCustomer(int $userId): LengthAwarePaginator;
}
