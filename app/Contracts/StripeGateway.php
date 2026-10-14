<?php

namespace App\Contracts;

use App\Models\Order;
use App\ValueObjects\StripeCheckoutSession;

interface StripeGateway
{
    public function createCheckoutSession(Order $order): StripeCheckoutSession;

    public function retrieveCheckoutSession(string $sessionId): StripeCheckoutSession;

    public function expireCheckoutSession(string $sessionId): StripeCheckoutSession;
}
