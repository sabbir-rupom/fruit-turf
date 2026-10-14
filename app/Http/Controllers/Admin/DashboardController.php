<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $dailyRevenue = Transaction::query()
            ->where('status', 'paid')
            ->whereNotNull('processed_at')
            ->where('processed_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw("DATE(processed_at) as day, SUM(CASE WHEN type = 'refund' THEN -amount ELSE amount END) as revenue")
            ->groupByRaw('DATE(processed_at)')
            ->orderByRaw('DATE(processed_at)')
            ->get()
            ->keyBy('day');

        $days = collect(range(6, 0))->map(function (int $offset) use ($dailyRevenue): array {
            $day = now()->subDays($offset)->toDateString();

            return [
                'date' => $day,
                'label' => now()->subDays($offset)->format('D'),
                'revenue' => (float) ($dailyRevenue->get($day)?->revenue ?? 0),
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'revenue' => (float) Transaction::query()
                    ->where('status', 'paid')
                    ->selectRaw("SUM(CASE WHEN type = 'refund' THEN -amount ELSE amount END) as net_revenue")
                    ->value('net_revenue') ?? 0,
                'orders' => Order::query()->count(),
                'customers' => User::query()->where('role', 'customer')->where('is_active', true)->count(),
                'pending_deliveries' => Order::query()->whereIn('status', ['pending', 'processing', 'shipped'])->count(),
                'low_stock' => Product::query()
                    ->where('is_active', true)
                    ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                    ->count(),
            ],
            'revenue' => $days,
            'recentOrders' => Order::query()
                ->with('items')
                ->latest('placed_at')
                ->limit(6)
                ->get(),
            'lowStockProducts' => Product::query()
                ->with('category:id,name')
                ->where('is_active', true)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                ->orderBy('stock_quantity')
                ->limit(6)
                ->get(['id', 'category_id', 'title', 'slug', 'stock_quantity', 'low_stock_threshold', 'unit']),
        ]);
    }
}
