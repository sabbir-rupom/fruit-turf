<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SettlePaymentRequest;
use App\Models\Order;
use App\Services\ManualPaymentStrategy;
use App\Services\PaymentSettlementService;
use Illuminate\Http\RedirectResponse;

class PaymentController extends Controller
{
    public function settle(
        SettlePaymentRequest $request,
        Order $order,
        PaymentSettlementService $payments,
        ManualPaymentStrategy $strategy,
    ): RedirectResponse
    {
        $payments->settle($order, $request->validated('gateway_reference'), $strategy);

        return back()->with('success', "Payment for order {$order->invoice_number} recorded.");
    }
}
