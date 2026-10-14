<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        [$from, $to] = $this->dateRange($request);
        $grouping = $request->validate(['grouping' => ['nullable', 'in:day,week,month']])['grouping'] ?? 'day';
        $transactions = $this->paidTransactions($from, $to);
        $daily = (clone $transactions)
            ->selectRaw("DATE(processed_at) as day, SUM(CASE WHEN type = 'refund' THEN -amount ELSE amount END) as revenue")
            ->groupByRaw('DATE(processed_at)')
            ->orderByRaw('DATE(processed_at)')
            ->get();
        $breakdown = $daily
            ->groupBy(function ($row) use ($grouping): string {
                $date = CarbonImmutable::parse($row->day);

                return match ($grouping) {
                    'week' => $date->format('o-\WW'),
                    'month' => $date->format('Y-m'),
                    default => $date->toDateString(),
                };
            })
            ->map(fn ($rows, string $period): array => [
                'period' => $period,
                'revenue' => (float) $rows->sum(fn ($row) => (float) $row->revenue),
            ])
            ->values();

        return Inertia::render('Admin/Reports/Index', [
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'grouping' => $grouping],
            'summary' => [
                'gross_sales' => (float) (clone $transactions)->where('type', 'payment')->sum('amount'),
                'refunds' => (float) (clone $transactions)->where('type', 'refund')->sum('amount'),
                'net_revenue' => (float) (clone $transactions)
                    ->selectRaw("SUM(CASE WHEN type = 'refund' THEN -amount ELSE amount END) as net_revenue")
                    ->value('net_revenue'),
                'payments' => (clone $transactions)->where('type', 'payment')->count(),
            ],
            'breakdown' => $breakdown,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);

        return response()->streamDownload(function () use ($from, $to): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                throw new \RuntimeException('Unable to open the report output stream.');
            }

            fputcsv($stream, ['Processed at', 'Invoice', 'Customer', 'Type', 'Status', 'Amount', 'Currency', 'Reference']);

            $this->paidTransactions($from, $to)
                ->with('order:id,invoice_number,buyer_name,currency')
                ->orderBy('processed_at')
                ->chunk(500, function ($transactions) use ($stream): void {
                    foreach ($transactions as $transaction) {
                        fputcsv($stream, [
                            $transaction->processed_at?->toDateTimeString(),
                            $this->safeCsv($transaction->order?->invoice_number),
                            $this->safeCsv($transaction->order?->buyer_name),
                            $transaction->type,
                            $transaction->status,
                            $transaction->amount,
                            $transaction->order?->currency,
                            $this->safeCsv($transaction->gateway_reference),
                        ]);
                    }
                });

            fclose($stream);
        }, "fruit-turf-financial-report-{$from->toDateString()}-{$to->toDateString()}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function purchases(Request $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);

        return response()->streamDownload(function () use ($from, $to): void {
            $stream = fopen('php://output', 'w');
            if ($stream === false) {
                throw new \RuntimeException('Unable to open the purchase report output stream.');
            }

            fputcsv($stream, ['Placed at', 'Invoice', 'Customer', 'Email', 'Order status', 'Payment status', 'Product', 'Quantity', 'Unit', 'Unit price', 'Line total', 'Currency']);
            \App\Models\Order::query()
                ->whereBetween('placed_at', [$from, $to])
                ->with('items')
                ->orderBy('placed_at')
                ->chunk(200, function ($orders) use ($stream): void {
                    foreach ($orders as $order) {
                        foreach ($order->items as $item) {
                            fputcsv($stream, [
                                $order->placed_at?->toDateTimeString(),
                                $this->safeCsv($order->invoice_number),
                                $this->safeCsv($order->buyer_name),
                                $this->safeCsv($order->buyer_email),
                                $order->status,
                                $order->payment_status,
                                $this->safeCsv($item->product_title),
                                $item->quantity,
                                $item->unit,
                                $item->unit_price,
                                $item->line_total,
                                $order->currency,
                            ]);
                        }
                    }
                });

            fclose($stream);
        }, "fruit-turf-purchases-{$from->toDateString()}-{$to->toDateString()}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function dateRange(Request $request): array
    {
        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);
        $to = CarbonImmutable::parse($data['to'] ?? now()->toDateString())->endOfDay();
        $from = CarbonImmutable::parse($data['from'] ?? $to->subDays(29)->toDateString())->startOfDay();

        if ($from->diffInDays($to) > 366) {
            throw ValidationException::withMessages([
                'from' => 'Choose a reporting period of one year or less.',
            ]);
        }

        return [$from, $to];
    }

    private function paidTransactions(CarbonImmutable $from, CarbonImmutable $to): Builder
    {
        return Transaction::query()
            ->where('status', 'paid')
            ->whereBetween('processed_at', [$from, $to]);
    }

    private function safeCsv(?string $value): string
    {
        return $value && preg_match('/^[=+\-@]/', $value) ? "'{$value}" : ($value ?? '');
    }
}
