<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\StripePaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;

class StripePaymentController extends Controller
{
    public function returned(Request $request, Order $order, StripePaymentService $payments): RedirectResponse
    {
        $this->authorizeOrder($request, $order);
        $data = $request->validate([
            'session_id' => ['required', 'string', 'regex:/^cs_(test|live)_[A-Za-z0-9]+$/'],
        ]);

        try {
            $payments->confirmReturn($order, $data['session_id']);
        } catch (ApiErrorException $exception) {
            Log::warning('Stripe checkout return could not be verified; awaiting webhook.', [
                'order_id' => $order->id,
                'exception' => $exception::class,
            ]);

            return to_route('orders.confirmation', ['order' => $order->invoice_number])
                ->with('error', 'Your payment is being verified. This page will update when Stripe confirms it.');
        }

        return to_route('orders.confirmation', ['order' => $order->invoice_number]);
    }

    public function cancelled(Request $request, Order $order, StripePaymentService $payments): RedirectResponse
    {
        $this->authorizeOrder($request, $order);

        try {
            $updatedOrder = $payments->expireCheckout($order);
        } catch (ApiErrorException $exception) {
            Log::warning('Stripe checkout cancellation could not be verified; awaiting webhook.', [
                'order_id' => $order->id,
                'exception' => $exception::class,
            ]);

            return to_route('orders.confirmation', ['order' => $order->invoice_number])
                ->with('error', 'We could not confirm cancellation yet. Your payment status will update when Stripe responds.');
        }

        if ($updatedOrder->payment_status === Order::PAYMENT_PAID) {
            return to_route('orders.confirmation', ['order' => $order->invoice_number])
                ->with('success', 'Your Stripe payment was received.');
        }

        return to_route('orders.confirmation', ['order' => $order->invoice_number])
            ->with('success', $updatedOrder->status === Order::STATUS_CANCELLED
                ? 'Payment cancelled. The reserved fruit has been returned to stock.'
                : 'Payment is still processing. We will update your order when Stripe confirms it.');
    }

    private function authorizeOrder(Request $request, Order $order): void
    {
        abort_unless(
            ($request->user() && $order->user_id === $request->user()->id)
            || $request->session()->get('last_order_id') === $order->id,
            404,
        );
    }
}
