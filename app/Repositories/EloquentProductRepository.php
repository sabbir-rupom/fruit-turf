<?php

namespace App\Repositories;

use App\Contracts\ProductRepository;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class EloquentProductRepository implements ProductRepository
{
    public function paginateForStorefront(array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with('category:id,name,slug')
            ->where('is_active', true)
            ->where(function (Builder $query) {
                $query->whereHas('category', fn (Builder $category) => $category->where('is_active', true))
                    ->orWhereNull('category_id');
            });

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function (Builder $query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['category'])) {
            $query->whereHas('category', fn (Builder $category) => $category->where('slug', $filters['category']));
        }

        match ($filters['sort'] ?? 'featured') {
            'price_asc' => $query->orderBy('price')->orderBy('title'),
            'price_desc' => $query->orderByDesc('price')->orderBy('title'),
            'name' => $query->orderBy('title'),
            default => $query->orderByDesc('is_featured')->orderBy('title'),
        };

        return $query->paginate(12)->withQueryString();
    }

    public function lockForCheckout(array $productIds): Collection
    {
        return Product::query()
            ->whereIn('id', $productIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }
}
