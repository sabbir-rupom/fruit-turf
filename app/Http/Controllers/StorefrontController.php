<?php

namespace App\Http\Controllers;

use App\Contracts\ProductRepository;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function index(Request $request, ProductRepository $products): Response
    {
        $filters = $request->only(['search', 'category', 'sort']);

        return Inertia::render('Shop/Index', [
            'products' => $products->paginateForStorefront($filters),
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'category' => $filters['category'] ?? '',
                'sort' => $filters['sort'] ?? 'featured',
            ],
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active && (! $product->category_id || $product->category?->is_active), 404);

        return Inertia::render('Shop/Show', [
            'product' => $product->load('category:id,name,slug'),
        ]);
    }
}
