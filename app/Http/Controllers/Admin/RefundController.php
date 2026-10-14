<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessRefundRequest;
use App\Models\Refund;
use App\Services\RefundService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RefundController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Refunds/Index', [
            'refunds' => Refund::query()
                ->with(['order:id,invoice_number,buyer_name,buyer_email,currency', 'items.orderItem:id,product_title,unit,quantity'])
                ->latest()
                ->paginate(20),
        ]);
    }

    public function process(ProcessRefundRequest $request, Refund $refund, RefundService $refunds): RedirectResponse
    {
        $refunds->process($refund, $request->user()->id, $request->validated('gateway_reference'));

        return back()->with('success', "Refund #{$refund->id} recorded as paid and applicable stock restocked.");
    }

    public function reject(Refund $refund, RefundService $refunds): RedirectResponse
    {
        $refunds->reject($refund, request()->user()->id);

        return back()->with('success', "Refund #{$refund->id} rejected.");
    }
}
