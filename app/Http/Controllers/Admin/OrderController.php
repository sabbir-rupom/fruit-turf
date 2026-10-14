<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessRefundRequest;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Orders/Index', [
            'orders' => Order::query()->with(['items', 'transactions'])->latest('placed_at')->paginate(20),
        ]);
    }

    public function update(Request $request, Order $order, OrderStatusService $statuses): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', 'in:pending,processing,shipped,delivered,cancelled']]);
        $statuses->update($order, $data['status'], $request->user()->id);

        return back()->with('success', "Order {$order->invoice_number} updated.");
    }
}
