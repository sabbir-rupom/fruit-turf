<?php

namespace App\Providers;

use App\Contracts\OrderRepository;
use App\Contracts\ProductRepository;
use App\Contracts\RefundStrategy;
use App\Contracts\StripeGateway;
use App\Events\OrderStatusChanged;
use App\Listeners\RecordOrderStatusChange;
use App\Repositories\EloquentOrderRepository;
use App\Repositories\EloquentProductRepository;
use App\Services\ManualRefundStrategy;
use App\Services\StripeSdkGateway;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ProductRepository::class, EloquentProductRepository::class);
        $this->app->bind(OrderRepository::class, EloquentOrderRepository::class);
        $this->app->bind(RefundStrategy::class, ManualRefundStrategy::class);
        $this->app->bind(StripeGateway::class, StripeSdkGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(OrderStatusChanged::class, RecordOrderStatusChange::class);
    }
}
