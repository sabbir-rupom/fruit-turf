<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddressRequest;
use App\Models\CustomerAddress;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Account/Addresses', [
            'addresses' => request()->user()->addresses()->orderByDesc('is_default')->orderBy('id')->get(),
        ]);
    }

    public function store(AddressRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($user, $data): void {
            $user = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $makeDefault = ($data['is_default'] ?? false) || ! $user->addresses()->exists();
            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            $user->addresses()->create([...$data, 'is_default' => $makeDefault]);
        });

        return back()->with('success', 'Delivery address saved.');
    }

    public function update(AddressRequest $request, CustomerAddress $address): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $address, $data): void {
            $user = User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $address = $user->addresses()->whereKey($address->id)->lockForUpdate()->firstOrFail();
            $makeDefault = $data['is_default'] ?? false;

            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            $address->update([...$data, 'is_default' => $makeDefault]);
        });

        return back()->with('success', 'Delivery address updated.');
    }

    public function destroy(Request $request, CustomerAddress $address): RedirectResponse
    {
        DB::transaction(function () use ($request, $address): void {
            $user = User::query()->whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $address = $user->addresses()->whereKey($address->id)->lockForUpdate()->firstOrFail();
            $wasDefault = $address->is_default;
            $address->delete();

            if ($wasDefault) {
                $user->addresses()->oldest('id')->first()?->update(['is_default' => true]);
            }
        });

        return back()->with('success', 'Delivery address removed.');
    }
}
