<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $registering = ! $this->user() && $this->boolean('create_account');

        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => [
                'required',
                'email:rfc',
                'max:254',
                ...($registering ? [Rule::unique('users', 'email')] : []),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'delivery_address' => ['required', 'string', 'max:2000'],
            'customer_note' => ['nullable', 'string', 'max:1000'],
            'create_account' => ['sometimes', 'boolean'],
            'password' => [$registering ? 'required' : 'nullable', 'string', 'min:8', 'confirmed'],
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'decimal:0,3', 'gt:0', 'max:1000'],
        ];
    }
}
