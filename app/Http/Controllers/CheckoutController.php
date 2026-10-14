<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\Category;
use App\Models\Order;
use App\Services\CheckoutService;
use App\Services\PaymentConfiguration;
use App\Services\StripePaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CheckoutController extends Controller
{
    public function create(PaymentConfiguration $payments): Response
    {
        $user = Auth::user();

        return Inertia::render('Shop/Checkout', [
            'categories' => Category::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
            'customer' => $user ? [
                ...$user->only('name', 'email', 'phone'),
                'default_address' => $user->defaultAddress()->value('address'),
            ] : null,
            'paymentMethods' => [
                'cash_on_delivery' => $payments->cashOnDeliveryEnabled(),
                'stripe' => $payments->stripeAvailableForCheckout(),
            ],
        ]);
    }

    public function store(
        CheckoutRequest $request,
        CheckoutService $checkout,
        StripePaymentService $stripe,
    ): SymfonyResponse
    {
        $order = $checkout->placeOrder($request->validated(), $request->user());

        if (! $request->user() && $order->customer) {
            Auth::login($order->customer);
            $request->session()->regenerate();
        }

        $request->session()->put('last_order_id', $order->id);

        if ($order->payment_method === PaymentConfiguration::METHOD_STRIPE) {
            return Inertia::location($stripe->startCheckout($order));
        }

        return to_route('orders.confirmation', ['order' => $order->invoice_number]);
    }

    public function confirmation(Request $request, Order $order): Response
    {
        $user = $request->user();
        abort_unless(
            ($user && $order->user_id === $user->id)
            || $request->session()->get('last_order_id') === $order->id,
            404,
        );

        return Inertia::render('Shop/Confirmation', [
            'order' => $order->load('items'),
        ]);
    }
}
