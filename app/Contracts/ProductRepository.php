<?php

namespace App\Contracts;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ProductRepository
{
    /**
     * @param array{search?: string|null, category?: string|null, sort?: string|null} $filters
     * @return LengthAwarePaginator<int, Product>
     */
    public function paginateForStorefront(array $filters = []): LengthAwarePaginator;

    /**
     * @param array<int, int> $productIds
     * @return Collection<int, Product>
     */
    public function lockForCheckout(array $productIds): Collection;
}
