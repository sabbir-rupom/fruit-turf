<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\Refund;
use App\Models\CustomerAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CommerceFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_storefront_renders_active_fruit_and_categories(): void
    {
        $product = $this->createProduct();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Shop/Index')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $product->slug)
                ->has('categories', 1));
    }

    public function test_guest_can_place_an_order_with_required_delivery_details(): void
    {
        $product = $this->createProduct(stock: 4);

        $response = $this->post('/checkout', [
            'name' => 'Amina Rahman',
            'email' => 'amina@example.test',
            'phone' => '01700000000',
            'delivery_address' => 'House 12, Lake Road, Dhaka',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $order = Order::query()->firstOrFail();
        $response->assertRedirect(route('orders.confirmation', ['order' => $order->invoice_number]));
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'user_id' => null,
            'buyer_email' => 'amina@example.test',
            'total' => '500.00',
        ]);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_title' => $product->title,
            'quantity' => '2.000',
        ]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_quantity' => '2.000']);
        $this->assertDatabaseHas('transactions', ['order_id' => $order->id, 'status' => 'pending', 'type' => 'payment']);
        $this->assertDatabaseHas('inventory_movements', ['order_id' => $order->id, 'type' => 'sale']);
        $this->assertDatabaseHas('order_status_histories', ['order_id' => $order->id, 'from_status' => null, 'to_status' => 'pending']);

        $this->get(route('orders.confirmation', ['order' => $order->invoice_number]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Shop/Confirmation')->where('order.invoice_number', $order->invoice_number));
    }

    public function test_checkout_rejects_insufficient_stock_without_creating_an_order(): void
    {
        $product = $this->createProduct(stock: 1);

        $this->from('/checkout')->post('/checkout', [
            'name' => 'Amina Rahman',
            'email' => 'amina@example.test',
            'delivery_address' => 'House 12, Lake Road, Dhaka',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertSessionHasErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_quantity' => '1.000']);
    }

    public function test_checkout_can_create_and_sign_in_a_customer_account(): void
    {
        $product = $this->createProduct(stock: 3);

        $this->post('/checkout', [
            'name' => 'Amina Rahman',
            'email' => 'amina@example.test',
            'delivery_address' => 'House 12, Lake Road, Dhaka',
            'create_account' => true,
            'password' => 'freshfruit123',
            'password_confirmation' => 'freshfruit123',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertRedirect();

        $customer = User::query()->where('email', 'amina@example.test')->firstOrFail();
        $this->assertAuthenticatedAs($customer);
        $this->assertDatabaseHas('orders', ['user_id' => $customer->id, 'buyer_email' => $customer->email]);
    }

    public function test_admin_settlement_and_refund_are_audited_and_restock_only_requested_items(): void
    {
        $product = $this->createProduct(stock: 1);
        $customer = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $order = Order::query()->create([
            'invoice_number' => 'FT-TEST-REFUND',
            'user_id' => $customer->id,
            'buyer_name' => $customer->name,
            'buyer_email' => $customer->email,
            'delivery_address' => 'Delivery address',
            'status' => 'delivered',
            'payment_status' => 'pending',
            'payment_method' => 'cash_on_delivery',
            'currency' => 'BDT',
            'subtotal' => 250,
            'total' => 250,
            'placed_at' => now(),
        ]);
        $item = $order->items()->create([
            'product_id' => $product->id,
            'product_title' => $product->title,
            'unit' => $product->unit,
            'unit_price' => 250,
            'quantity' => 1,
            'line_total' => 250,
        ]);
        $order->transactions()->create([
            'type' => 'payment',
            'status' => 'pending',
            'amount' => 250,
            'provider' => 'cash_on_delivery',
        ]);

        $this->actingAs($admin)->post("/admin/orders/{$order->id}/settle", [
            'gateway_reference' => 'CASH-RECEIPT-1',
        ])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('transactions', ['order_id' => $order->id, 'gateway_reference' => 'CASH-RECEIPT-1', 'status' => 'paid']);

        $this->actingAs($customer)->post("/account/orders/{$order->id}/refunds", [
            'reason' => 'Fruit arrived damaged.',
            'items' => [['order_item_id' => $item->id, 'quantity' => 1, 'restock' => true]],
        ])->assertSessionHasNoErrors();
        $refund = Refund::query()->firstOrFail();
        $this->assertSame('pending', $refund->status);

        $this->actingAs($admin)->post("/admin/refunds/{$refund->id}/process", [
            'gateway_reference' => 'REFUND-RECEIPT-1',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('refunds', ['id' => $refund->id, 'status' => 'processed']);
        $this->assertDatabaseHas('transactions', ['refund_id' => $refund->id, 'type' => 'refund', 'status' => 'paid']);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock_quantity' => '2.000']);
        $this->assertSame(1, InventoryMovement::query()->where('refund_id', $refund->id)->where('type', 'refund_restock')->count());
    }

    public function test_admin_pages_are_forbidden_to_customers(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)->get('/admin')->assertForbidden();
    }

    public function test_disabled_customer_sessions_are_ended_before_account_or_checkout_access(): void
    {
        $customer = User::factory()->create(['is_active' => false]);

        $this->actingAs($customer)->get('/account')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_customers_can_manage_private_delivery_addresses_and_checkout_uses_default(): void
    {
        $customer = User::factory()->create();
        $this->actingAs($customer)->post('/account/addresses', [
            'label' => 'Home',
            'recipient_name' => 'Amina Rahman',
            'phone' => '01700000000',
            'address' => 'House 1, Green Road, Dhaka',
            'is_default' => true,
        ])->assertSessionHasNoErrors();
        $this->post('/account/addresses', [
            'label' => 'Office',
            'recipient_name' => 'Amina Rahman',
            'phone' => '01700000000',
            'address' => 'Office 4, Lake Road, Dhaka',
            'is_default' => true,
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, CustomerAddress::query()->where('user_id', $customer->id)->where('is_default', true)->count());
        $this->get('/checkout')->assertInertia(fn (Assert $page) => $page
            ->component('Shop/Checkout')
            ->where('customer.default_address', 'Office 4, Lake Road, Dhaka'));
    }

    public function test_paid_order_cannot_be_cancelled_without_a_refund(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $customer = User::factory()->create();
        $order = Order::query()->create([
            'invoice_number' => 'FT-TEST-PAID',
            'user_id' => $customer->id,
            'buyer_name' => $customer->name,
            'buyer_email' => $customer->email,
            'delivery_address' => 'Delivery address',
            'status' => 'processing',
            'payment_status' => 'paid',
            'payment_method' => 'cash_on_delivery',
            'currency' => 'BDT',
            'subtotal' => 250,
            'total' => 250,
            'placed_at' => now(),
        ]);

        $this->actingAs($admin)->from('/admin/orders')->patch("/admin/orders/{$order->id}", [
            'status' => 'cancelled',
        ])->assertSessionHasErrors('status');

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'processing']);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    public function test_admin_can_view_period_breakdowns_and_download_financial_and_purchase_reports(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        $today = now()->toDateString();
        $order = Order::query()->create([
            'invoice_number' => 'FT-TEST-REPORT',
            'user_id' => $customer->id,
            'buyer_name' => 'Amina Rahman',
            'buyer_email' => 'amina@example.test',
            'delivery_address' => 'Delivery address',
            'status' => 'delivered',
            'payment_status' => 'paid',
            'payment_method' => 'cash_on_delivery',
            'currency' => 'BDT',
            'subtotal' => 250,
            'total' => 250,
            'placed_at' => now(),
        ]);
        $order->items()->create([
            'product_title' => '=Formula-safe mangoes',
            'unit' => 'per kg',
            'unit_price' => 250,
            'quantity' => 1,
            'line_total' => 250,
        ]);
        $order->transactions()->create([
            'type' => 'payment',
            'status' => 'paid',
            'amount' => 250,
            'provider' => 'manual',
            'gateway_reference' => 'REPORT-RECEIPT-1',
            'processed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get("/admin/reports?from={$today}&to={$today}&grouping=week")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('filters.grouping', 'week')
                ->has('breakdown', 1));
        $this->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));
        $this->get('/admin/customers')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Customers/Index')->has('customers.data', 1));

        $this->get("/admin/reports/export?from={$today}&to={$today}")
            ->assertDownload("fruit-turf-financial-report-{$today}-{$today}.csv");
        $this->get("/admin/reports/purchases/export?from={$today}&to={$today}")
            ->assertDownload("fruit-turf-purchases-{$today}-{$today}.csv");
    }

    private function createProduct(float $stock = 10): Product
    {
        $category = Category::query()->create([
            'name' => 'Citrus',
            'slug' => 'citrus',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        return Product::query()->create([
            'category_id' => $category->id,
            'title' => 'Sunshine Oranges',
            'slug' => 'sunshine-oranges',
            'short_description' => 'Sweet and juicy.',
            'price' => 250,
            'unit' => 'per kg',
            'stock_quantity' => $stock,
            'low_stock_threshold' => 2,
            'is_active' => true,
            'is_featured' => true,
        ]);
    }
}
