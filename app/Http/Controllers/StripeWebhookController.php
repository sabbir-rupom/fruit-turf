<?php

namespace App\Http\Controllers;

use App\Services\PaymentConfiguration;
use App\Services\StripePaymentService;
use App\ValueObjects\StripeCheckoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Stripe\Checkout\Session;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        PaymentConfiguration $configuration,
        StripePaymentService $payments,
    ): JsonResponse {
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                (string) $request->header('Stripe-Signature', ''),
                $configuration->stripeWebhookSecret(),
            );
        } catch (SignatureVerificationException|UnexpectedValueException $exception) {
            Log::warning('Rejected Stripe webhook with an invalid signature or payload.', [
                'exception' => $exception::class,
            ]);

            return response()->json(['message' => 'Invalid Stripe webhook signature.'], 400);
        } catch (ValidationException) {
            Log::error('Stripe webhook received without a configured signing secret.');

            return response()->json(['message' => 'Stripe webhook is not configured.'], 503);
        }

        if (! $event->data->object instanceof Session) {
            return response()->json(['received' => true]);
        }

        $session = StripeCheckoutSession::fromStripe($event->data->object);

        match ($event->type) {
            'checkout.session.completed', 'checkout.session.async_payment_succeeded'
                => $payments->handleCompletedSession($session),
            'checkout.session.expired', 'checkout.session.async_payment_failed'
                => $payments->handleFailedSession($session, 'Stripe Checkout was not completed.'),
            default => null,
        };

        return response()->json(['received' => true]);
    }
}
