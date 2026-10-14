<?php

namespace App\Services;

use App\Models\PaymentSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentConfiguration
{
    public const METHOD_CASH_ON_DELIVERY = 'cash_on_delivery';

    public const METHOD_STRIPE = 'stripe';

    public function cashOnDeliveryEnabled(): bool
    {
        return $this->boolean('cash_on_delivery_enabled', true);
    }

    public function stripeEnabled(): bool
    {
        return $this->boolean('stripe_enabled', false);
    }

    public function stripeAvailableForCheckout(): bool
    {
        return $this->stripeEnabled()
            && strtoupper((string) config('fruit-turf.currency', 'USD')) === 'USD'
            && $this->value('stripe_publishable_key') !== null
            && $this->value('stripe_secret_key') !== null
            && $this->value('stripe_webhook_secret') !== null;
    }

    public function stripePublishableKey(): ?string
    {
        return $this->value('stripe_publishable_key');
    }

    public function stripeSecretKey(): string
    {
        return $this->requiredSecret('stripe_secret_key');
    }

    public function stripeWebhookSecret(): string
    {
        return $this->requiredSecret('stripe_webhook_secret');
    }

    /**
     * @return array{
     *     currency:string,
     *     cash_on_delivery_enabled:bool,
     *     stripe_enabled:bool,
     *     stripe_publishable_key:?string,
     *     stripe_secret_key_configured:bool,
     *     stripe_webhook_secret_configured:bool
     * }
     */
    public function adminSettings(): array
    {
        return [
            'currency' => strtoupper((string) config('fruit-turf.currency', 'USD')),
            'cash_on_delivery_enabled' => $this->cashOnDeliveryEnabled(),
            'stripe_enabled' => $this->stripeEnabled(),
            'stripe_available' => strtoupper((string) config('fruit-turf.currency', 'USD')) === 'USD',
            'stripe_publishable_key' => $this->stripePublishableKey(),
            'stripe_secret_key_configured' => $this->value('stripe_secret_key') !== null,
            'stripe_webhook_secret_configured' => $this->value('stripe_webhook_secret') !== null,
        ];
    }

    /**
     * @param array{
     *     cash_on_delivery_enabled:bool,
     *     stripe_enabled:bool,
     *     stripe_publishable_key?:string|null,
     *     stripe_secret_key?:string|null,
     *     stripe_webhook_secret?:string|null
     * } $data
     */
    public function update(array $data): void
    {
        $existing = [
            'stripe_publishable_key' => $this->value('stripe_publishable_key'),
            'stripe_secret_key' => $this->value('stripe_secret_key'),
            'stripe_webhook_secret' => $this->value('stripe_webhook_secret'),
        ];
        $next = [];

        foreach ($existing as $key => $current) {
            $replacement = trim((string) ($data[$key] ?? ''));
            $next[$key] = $replacement !== '' ? $replacement : $current;
        }

        if (! $data['cash_on_delivery_enabled'] && ! $data['stripe_enabled']) {
            throw ValidationException::withMessages([
                'cash_on_delivery_enabled' => 'At least one payment method must remain enabled.',
            ]);
        }

        if ($data['stripe_enabled']) {
            if (strtoupper((string) config('fruit-turf.currency', 'USD')) !== 'USD') {
                throw ValidationException::withMessages([
                    'stripe_enabled' => 'Set FRUIT_TURF_CURRENCY=USD in the application environment before enabling Stripe.',
                ]);
            }

            foreach ($next as $key => $value) {
                if (! $value) {
                    throw ValidationException::withMessages([
                        $key => 'Enter all three Stripe keys before enabling Stripe.',
                    ]);
                }
            }

            $publishableMode = str_starts_with((string) $next['stripe_publishable_key'], 'pk_live_');
            $secretMode = str_starts_with((string) $next['stripe_secret_key'], 'sk_live_');
            if ($publishableMode !== $secretMode) {
                throw ValidationException::withMessages([
                    'stripe_secret_key' => 'Use a publishable key and secret key from the same Stripe mode.',
                ]);
            }
        }

        DB::transaction(function () use ($data, $next): void {
            $values = [
                'cash_on_delivery_enabled' => $data['cash_on_delivery_enabled'] ? '1' : '0',
                'stripe_enabled' => $data['stripe_enabled'] ? '1' : '0',
                ...$next,
            ];

            foreach ($values as $key => $value) {
                PaymentSetting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
            }
        });
    }

    /**
     * @return array<int, string>
     */
    public function enabledMethods(): array
    {
        $methods = [];
        if ($this->cashOnDeliveryEnabled()) {
            $methods[] = self::METHOD_CASH_ON_DELIVERY;
        }
        if ($this->stripeAvailableForCheckout()) {
            $methods[] = self::METHOD_STRIPE;
        }

        return $methods;
    }

    private function boolean(string $key, bool $default): bool
    {
        $value = $this->value($key);

        return $value === null ? $default : $value === '1';
    }

    private function value(string $key): ?string
    {
        return PaymentSetting::query()->where('key', $key)->first()?->value;
    }

    private function requiredSecret(string $key): string
    {
        $value = $this->value($key);
        if (! $value) {
            throw ValidationException::withMessages([
                'payment_method' => 'Stripe is not fully configured. Contact the store administrator.',
            ]);
        }

        return $value;
    }
}
