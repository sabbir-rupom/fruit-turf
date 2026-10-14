<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Customers/Index', [
            'customers' => User::query()
                ->where('role', 'customer')
                ->withCount('orders')
                ->selectSub(
                    Transaction::query()
                        ->selectRaw("COALESCE(SUM(CASE WHEN type = 'refund' THEN -amount ELSE amount END), 0)")
                        ->where('status', 'paid')
                        ->whereHas('order', fn ($order) => $order->whereColumn('orders.user_id', 'users.id')),
                    'lifetime_value',
                )
                ->latest()
                ->paginate(20),
        ]);
    }

    public function toggleStatus(User $customer): RedirectResponse
    {
        abort_unless($customer->role === 'customer', 404);
        $customer->update(['is_active' => ! $customer->is_active]);

        return back()->with('success', 'Customer account status updated.');
    }
}
