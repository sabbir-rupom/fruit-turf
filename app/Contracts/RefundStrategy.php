<?php

namespace App\Contracts;

use App\Models\Refund;
use App\Models\Transaction;

interface RefundStrategy
{
    public function settle(Refund $refund, string $gatewayReference): Transaction;
}
