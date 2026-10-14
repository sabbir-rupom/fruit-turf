<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => [
                'required',
                'email:rfc',
                'max:254',
                Rule::unique('users', 'email')->ignore($this->user()),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
        ];
    }
}
