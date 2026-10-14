<?php

namespace App\Http\Controllers;

use App\Contracts\OrderRepository;
use App\Http\Requests\RefundRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Order;
use App\Models\Transaction;
use App\Services\RefundService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(OrderRepository $orders): Response
    {
        $user = request()->user();

        return Inertia::render('Account/Dashboard', [
            'orders' => $orders->paginateForCustomer($user->id),
            'stats' => [
                'orders' => $user->orders()->count(),
                'pending' => $user->orders()->whereIn('status', ['pending', 'processing', 'shipped'])->count(),
                'spent' => (float) Transaction::query()
                    ->where('status', 'paid')
                    ->whereHas('order', fn ($order) => $order->where('user_id', $user->id))
                    ->selectRaw("COALESCE(SUM(CASE WHEN type = 'refund' THEN -amount ELSE amount END), 0) as net_spend")
                    ->value('net_spend'),
            ],
        ]);
    }

    public function profile(): Response
    {
        return Inertia::render('Account/Profile', ['customer' => request()->user()->only('name', 'email', 'phone')]);
    }

    public function updateProfile(UpdateProfileRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('success', 'Your profile has been updated.');
    }

    public function showOrder(Order $order): Response
    {
        abort_unless($order->user_id === request()->user()->id, 404);

        return Inertia::render('Account/Order', [
            'order' => $order->load(['items.product:id,slug,featured_image', 'refunds.items']),
        ]);
    }

    public function requestRefund(RefundRequest $request, Order $order, RefundService $refunds): RedirectResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $refunds->request(
            $order,
            $request->user()->id,
            $request->validated('reason'),
            $request->validated('items'),
        );

        return back()->with('success', 'Your refund request has been submitted for review.');
    }
}
