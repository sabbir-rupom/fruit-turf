<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\Category;
use App\Models\Order;
use App\Services\CheckoutService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function create(): Response
    {
        $user = Auth::user();

        return Inertia::render('Shop/Checkout', [
            'categories' => Category::query()->where('is_active', true)->orderBy('sort_order')->get(['id', 'name', 'slug']),
            'customer' => $user ? [
                ...$user->only('name', 'email', 'phone'),
                'default_address' => $user->defaultAddress()->value('address'),
            ] : null,
        ]);
    }

    public function store(CheckoutRequest $request, CheckoutService $checkout): RedirectResponse
    {
        $order = $checkout->placeOrder($request->validated(), $request->user());

        if (! $request->user() && $order->customer) {
            Auth::login($order->customer);
            $request->session()->regenerate();
        }

        $request->session()->put('last_order_id', $order->id);

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
