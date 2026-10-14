<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');

        return [
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', Rule::unique('products', 'slug')->ignore($product)],
            'short_description' => ['nullable', 'string', 'max:280'],
            'description' => ['nullable', 'string', 'max:10000'],
            'price' => ['required', 'numeric', 'gt:0', 'max:99999999.99'],
            'unit' => ['required', 'string', 'max:30'],
            'stock_quantity' => ['required', 'numeric', 'min:0', 'max:9999999.999'],
            'low_stock_threshold' => ['required', 'numeric', 'min:0', 'max:9999999.999'],
            'is_perishable' => ['required', 'boolean'],
            'is_featured' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'featured_image' => ['nullable', 'image', 'max:5120'],
            'gallery_images' => ['sometimes', 'array', 'max:8'],
            'gallery_images.*' => ['image', 'max:5120'],
        ];
    }
}
