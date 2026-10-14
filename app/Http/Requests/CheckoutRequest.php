<?php

namespace App\Http\Requests;

use App\Services\PaymentConfiguration;
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
            'phone' => [
                $registering ? 'required' : 'nullable',
                'string',
                'max:30',
                'regex:/^\+?(?=(?:\D*\d){7,15}\D*$)[0-9\s().-]+$/',
            ],
            'delivery_address' => ['required', 'string', 'max:2000'],
            'customer_note' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', Rule::in([
                PaymentConfiguration::METHOD_CASH_ON_DELIVERY,
                PaymentConfiguration::METHOD_STRIPE,
            ])],
            'create_account' => ['sometimes', 'boolean'],
            'password' => [$registering ? 'required' : 'nullable', 'string', 'min:8', 'confirmed'],
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'decimal:0,3', 'gt:0', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.required' => 'A phone number is required when creating an account.',
            'phone.regex' => 'Enter a valid phone number with 7 to 15 digits. You may include a country code.',
        ];
    }
}
