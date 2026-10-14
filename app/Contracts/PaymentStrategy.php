<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Transaction;

interface PaymentStrategy
{
    public function settle(Order $order, string $gatewayReference): Transaction;
}
