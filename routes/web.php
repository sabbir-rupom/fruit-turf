<?php

use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Admin\PaymentSettingsController as AdminPaymentSettingsController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\RefundController as AdminRefundController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\StripePaymentController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('shop.index');
Route::get('/products/{product:slug}', [StorefrontController::class, 'show'])->name('shop.show');
Route::get('/checkout', [CheckoutController::class, 'create'])->middleware('active')->name('checkout.create');
Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('active')->name('checkout.store');
Route::get('/orders/{order:invoice_number}/confirmation', [CheckoutController::class, 'confirmation'])->name('orders.confirmation');
Route::get('/payments/stripe/return/{order:invoice_number}', [StripePaymentController::class, 'returned'])->name('payments.stripe.return');
Route::get('/payments/stripe/cancelled/{order:invoice_number}', [StripePaymentController::class, 'cancelled'])->name('payments.stripe.cancelled');
Route::post('/stripe/webhook', StripeWebhookController::class)
    ->middleware('throttle:60,1')
    ->name('stripe.webhook');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');
});
Route::post('/logout', [AuthController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'active'])->prefix('account')->name('account.')->group(function () {
    Route::get('/', [CustomerController::class, 'index'])->name('dashboard');
    Route::get('/profile', [CustomerController::class, 'profile'])->name('profile');
    Route::put('/profile', [CustomerController::class, 'updateProfile'])->name('profile.update');
    Route::get('/addresses', [AddressController::class, 'index'])->name('addresses.index');
    Route::post('/addresses', [AddressController::class, 'store'])->name('addresses.store');
    Route::put('/addresses/{address}', [AddressController::class, 'update'])->name('addresses.update');
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy'])->name('addresses.destroy');
    Route::get('/orders/{order}', [CustomerController::class, 'showOrder'])->name('orders.show');
    Route::post('/orders/{order}/refunds', [CustomerController::class, 'requestRefund'])->name('orders.refunds.store');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', AdminDashboardController::class)->name('dashboard');
    Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
    Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
    Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
    Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
    Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
    Route::post('/categories', [AdminCategoryController::class, 'store'])->name('categories.store');
    Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::patch('/orders/{order}', [AdminOrderController::class, 'update'])->name('orders.update');
    Route::post('/orders/{order}/settle', [AdminPaymentController::class, 'settle'])->name('orders.settle');
    Route::get('/transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
    Route::get('/refunds', [AdminRefundController::class, 'index'])->name('refunds.index');
    Route::post('/refunds/{refund}/process', [AdminRefundController::class, 'process'])->name('refunds.process');
    Route::post('/refunds/{refund}/reject', [AdminRefundController::class, 'reject'])->name('refunds.reject');
    Route::get('/customers', [AdminCustomerController::class, 'index'])->name('customers.index');
    Route::patch('/customers/{customer}/status', [AdminCustomerController::class, 'toggleStatus'])->name('customers.status');
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [AdminReportController::class, 'export'])->name('reports.export');
    Route::get('/reports/purchases/export', [AdminReportController::class, 'purchases'])->name('reports.purchases');
    Route::get('/settings/payments', [AdminPaymentSettingsController::class, 'edit'])->name('settings.payments.edit');
    Route::put('/settings/payments', [AdminPaymentSettingsController::class, 'update'])->name('settings.payments.update');
});
