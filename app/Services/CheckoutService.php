<?php

namespace App\Services;

use App\Contracts\OrderRepository;
use App\Contracts\ProductRepository;
use App\Events\OrderStatusChanged;
use App\Factories\OrderFactory;
use App\Jobs\SendOrderConfirmation;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private readonly ProductRepository $products,
        private readonly OrderRepository $orders,
        private readonly OrderFactory $orderFactory,
    ) {}

    /**
     * Create the order, reserve stock, and record its payment intent atomically.
     *
     * @param array<string, mixed> $data
     */
    public function placeOrder(array $data, ?User $authenticatedCustomer = null): Order
    {
        return DB::transaction(function () use ($data, $authenticatedCustomer): Order {
            $quantities = collect($data['items'])
                ->mapWithKeys(fn (array $item): array => [(int) $item['product_id'] => (float) $item['quantity']]);
            $products = $this->products->lockForCheckout($quantities->keys()->all())->keyBy('id');

            if ($products->count() !== $quantities->count()) {
                throw ValidationException::withMessages([
                    'items' => 'One or more selected fruits are no longer available.',
                ]);
            }

            foreach ($quantities as $productId => $quantity) {
                $product = $products->get($productId);

                if (! $product->is_active || (float) $product->stock_quantity < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->title} does not have enough stock for this order.",
                    ]);
                }
            }

            $customer = $authenticatedCustomer;
            if (! $customer && ($data['create_account'] ?? false)) {
                $customer = User::query()->create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'password' => $data['password'],
                ]);
            }

            $lineItems = [];
            $subtotal = 0.0;

            foreach ($quantities as $productId => $quantity) {
                $product = $products->get($productId);
                $lineTotal = round((float) $product->price * $quantity, 2);
                $subtotal += $lineTotal;
                $lineItems[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                ];
            }

            $order = $this->orders->save($this->orderFactory->make($data, $customer, $subtotal));
            event(new OrderStatusChanged($order, null, Order::STATUS_PENDING, null, 'Order placed'));

            foreach ($lineItems as $lineItem) {
                $product = $lineItem['product'];
                $quantity = $lineItem['quantity'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_title' => $product->title,
                    'unit' => $product->unit,
                    'unit_price' => $product->price,
                    'quantity' => $quantity,
                    'line_total' => $lineItem['line_total'],
                ]);

                $product->decrement('stock_quantity', $quantity);
                InventoryMovement::query()->create([
                    'product_id' => $product->id,
                    'order_id' => $order->id,
                    'type' => 'sale',
                    'quantity_delta' => -$quantity,
                    'reason' => "Stock reserved for {$order->invoice_number}",
                ]);
            }

            $order->transactions()->create([
                'type' => 'payment',
                'status' => 'pending',
                'amount' => $subtotal,
                'provider' => 'cash_on_delivery',
            ]);

            $order->load('customer');
            SendOrderConfirmation::dispatch($order);

            return $order;
        }, 3);
    }
}
