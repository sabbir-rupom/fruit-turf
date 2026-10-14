<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => Transaction::query()->with('order:id,invoice_number,buyer_name,currency')->latest()->paginate(20),
        ]);
    }
}
