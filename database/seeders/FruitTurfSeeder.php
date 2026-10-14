<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class FruitTurfSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Citrus', 'slug' => 'citrus', 'description' => 'Bright, refreshing citrus fruits.', 'sort_order' => 1],
            ['name' => 'Berries', 'slug' => 'berries', 'description' => 'Sweet, delicate seasonal berries.', 'sort_order' => 2],
            ['name' => 'Tropical', 'slug' => 'tropical', 'description' => 'Sun-ripened fruits from the tropics.', 'sort_order' => 3],
            ['name' => 'Seasonal', 'slug' => 'seasonal', 'description' => 'The best produce of the current season.', 'sort_order' => 4],
            ['name' => 'Organic', 'slug' => 'organic', 'description' => 'Carefully grown without synthetic pesticides.', 'sort_order' => 5],
        ];

        foreach ($categories as $attributes) {
            Category::query()->updateOrCreate(['slug' => $attributes['slug']], [...$attributes, 'is_active' => true]);
        }

        $products = [
            ['title' => 'Sunshine Oranges', 'slug' => 'sunshine-oranges', 'category' => 'citrus', 'price' => 280, 'unit' => 'per kg', 'stock' => 24, 'featured' => true, 'color' => 'photo-1547514701-42782101795e'],
            ['title' => 'Ruby Strawberries', 'slug' => 'ruby-strawberries', 'category' => 'berries', 'price' => 480, 'unit' => 'per box', 'stock' => 12, 'featured' => true, 'color' => 'photo-1464965911861-746a04b4bca6'],
            ['title' => 'Golden Mangoes', 'slug' => 'golden-mangoes', 'category' => 'tropical', 'price' => 360, 'unit' => 'per kg', 'stock' => 18, 'featured' => true, 'color' => 'photo-1553279768-865429fa0078'],
            ['title' => 'Green Avocados', 'slug' => 'green-avocados', 'category' => 'tropical', 'price' => 420, 'unit' => 'per kg', 'stock' => 5, 'featured' => false, 'color' => 'photo-1523049673857-eb18f1d7b578'],
            ['title' => 'Blueberry Bunch', 'slug' => 'blueberry-bunch', 'category' => 'berries', 'price' => 540, 'unit' => 'per box', 'stock' => 16, 'featured' => true, 'color' => 'photo-1498557850523-fd3d118b962e'],
            ['title' => 'Sweet Pineapple', 'slug' => 'sweet-pineapple', 'category' => 'seasonal', 'price' => 190, 'unit' => 'each', 'stock' => 9, 'featured' => false, 'color' => 'photo-1550258987-190a2d41a8ba'],
            ['title' => 'Organic Green Grapes', 'slug' => 'organic-green-grapes', 'category' => 'organic', 'price' => 390, 'unit' => 'per kg', 'stock' => 14, 'featured' => true, 'color' => 'photo-1537640538966-79f369143f8f'],
            ['title' => 'Fresh Lemons', 'slug' => 'fresh-lemons', 'category' => 'citrus', 'price' => 220, 'unit' => 'per dozen', 'stock' => 3, 'featured' => false, 'color' => 'photo-1513558161293-cdaf765edfd7'],
        ];

        foreach ($products as $product) {
            $categoryId = Category::query()->where('slug', $product['category'])->value('id');
            $product = Product::query()->firstOrCreate(
                ['slug' => $product['slug']],
                [
                    'category_id' => $categoryId,
                    'title' => $product['title'],
                    'short_description' => 'Picked at peak ripeness and delivered fresh to your door.',
                    'description' => "Enjoy {$product['title']} selected by our produce team for exceptional freshness and flavor.",
                    'price' => $product['price'],
                    'unit' => $product['unit'],
                    'stock_quantity' => $product['stock'],
                    'low_stock_threshold' => 5,
                    'is_perishable' => true,
                    'featured_image' => "https://images.unsplash.com/{$product['color']}?auto=format&fit=crop&w=900&q=85",
                    'is_featured' => $product['featured'],
                    'is_active' => true,
                ],
            );

            if ($product->wasRecentlyCreated) {
                $product->inventoryMovements()->create([
                    'type' => 'initial_stock',
                    'quantity_delta' => $product->stock_quantity,
                    'reason' => 'Initial stock loaded from the Fruit Turf sample catalog',
                ]);
            }
        }

        $admin = config('fruit-turf.admin');
        if ($admin['name'] && $admin['email'] && $admin['password']) {
            $adminUser = User::query()->firstOrNew(['email' => $admin['email']]);

            if (! $adminUser->exists) {
                $adminUser->fill([
                    'name' => $admin['name'],
                    'role' => 'admin',
                    'is_active' => true,
                    'password' => $admin['password'],
                ])->save();
            } elseif (! $adminUser->isAdmin()) {
                throw new RuntimeException('FRUIT_TURF_ADMIN_EMAIL is already assigned to a non-admin account.');
            }
        }
    }
}
