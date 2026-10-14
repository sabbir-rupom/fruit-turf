<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['key', 'value'])]
#[Hidden(['value'])]
class PaymentSetting extends Model
{
    protected $table = 'payment_settings';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['value' => 'encrypted'];
    }
}
