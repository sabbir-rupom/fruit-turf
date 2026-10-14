<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Products/Index', [
            'products' => Product::query()->with('category:id,name')->latest()->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'product' => null,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        unset($data['gallery_images']);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?: $data['title']);

        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('products', 'public');
        }

        if ($request->hasFile('gallery_images')) {
            $data['image_gallery'] = collect($request->file('gallery_images'))
                ->map(fn ($image) => $image->store('products/gallery', 'public'))
                ->all();
        }

        DB::transaction(function () use ($data, $request): void {
            $product = Product::query()->create($data);
            InventoryMovement::query()->create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'type' => 'initial_stock',
                'quantity_delta' => $product->stock_quantity,
                'reason' => 'Initial stock entered when product was created',
            ]);
        });

        return to_route('admin.products.index')->with('success', 'Fruit added to the catalog.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'product' => $product,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        unset($data['gallery_images']);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?: $data['title'], $product);
        $previousImage = $product->featured_image;
        $replacementImage = null;

        if ($request->hasFile('featured_image')) {
            $replacementImage = $request->file('featured_image')->store('products', 'public');
            $data['featured_image'] = $replacementImage;
        } else {
            unset($data['featured_image']);
        }

        if ($request->hasFile('gallery_images')) {
            $data['image_gallery'] = [
                ...($product->image_gallery ?? []),
                ...collect($request->file('gallery_images'))
                    ->map(fn ($image) => $image->store('products/gallery', 'public'))
                    ->all(),
            ];
        }

        DB::transaction(function () use ($data, $product, $request): void {
            $previousStock = (float) $product->stock_quantity;
            $product->update($data);
            $stockDelta = round((float) $product->stock_quantity - $previousStock, 3);

            if ($stockDelta !== 0.0) {
                InventoryMovement::query()->create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'type' => 'adjustment',
                    'quantity_delta' => $stockDelta,
                    'reason' => 'Manual stock adjustment from product catalog',
                ]);
            }
        });

        if ($replacementImage) {
            $this->deleteStoredImage($previousImage);
        }

        return to_route('admin.products.index')->with('success', 'Fruit details updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->update(['is_active' => false]);
        $product->delete();

        return back()->with('success', 'Fruit removed from the active catalog.');
    }

    private function uniqueSlug(string $value, ?Product $product = null): string
    {
        $base = Str::slug($value) ?: 'fruit';
        $slug = $base;
        $suffix = 2;

        while (Product::withTrashed()
            ->where('slug', $slug)
            ->when($product, fn ($query) => $query->whereKeyNot($product->id))
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function deleteStoredImage(?string $path): void
    {
        if ($path && ! Str::startsWith($path, ['http://', 'https://'])) {
            Storage::disk('public')->delete($path);
        }
    }
}
