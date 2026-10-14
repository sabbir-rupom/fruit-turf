<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePaymentSettingsRequest;
use App\Services\PaymentConfiguration;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaymentSettingsController extends Controller
{
    public function edit(PaymentConfiguration $configuration): Response
    {
        return Inertia::render('Admin/Settings/Payments', [
            'settings' => $configuration->adminSettings(),
        ]);
    }

    public function update(
        UpdatePaymentSettingsRequest $request,
        PaymentConfiguration $configuration,
    ): RedirectResponse {
        $configuration->update($request->validated());

        return back()->with('success', 'Payment settings updated. Stripe credentials are encrypted at rest.');
    }
}
