<?php

namespace App\ValueObjects;

use Stripe\Checkout\Session;

final readonly class StripeCheckoutSession
{
    public function __construct(
        public string $id,
        public ?string $url,
        public ?string $status,
        public ?string $paymentStatus,
        public ?int $amountTotal,
        public ?string $currency,
        public ?string $orderId,
        public ?string $paymentIntentId,
    ) {}

    public static function fromStripe(Session $session): self
    {
        $metadata = $session->metadata;
        $paymentIntentId = is_string($session->payment_intent)
            ? $session->payment_intent
            : ($session->payment_intent?->id ?? null);

        return new self(
            id: $session->id,
            url: $session->url,
            status: $session->status,
            paymentStatus: $session->payment_status,
            amountTotal: $session->amount_total,
            currency: $session->currency,
            orderId: isset($metadata->order_id) ? (string) $metadata->order_id : null,
            paymentIntentId: $paymentIntentId,
        );
    }
}
