import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Link } from '@inertiajs/react';
import { AppLayout } from '../../components/AppLayout';

interface Customer {
    name: string;
    email: string;
    phone: string | null;
}

export default function Profile({ customer }: { customer: Customer }) {
    const form = useForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/account/profile');
    }

    return (
        <AppLayout>
            <main className="mx-auto max-w-2xl px-5 py-12">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Your details</p>
                <h1 className="mt-2 font-display text-5xl">Profile & delivery</h1>
                <p className="mt-3 text-muted">Keep your contact details up to date and manage the places you’d like us to deliver.</p>
                <Link href="/account/addresses" className="mt-4 inline-flex rounded-full border border-leaf-200 px-5 py-2.5 text-sm font-semibold text-leaf-700 hover:bg-white">Manage delivery addresses →</Link>
                <form onSubmit={submit} className="mt-7 space-y-5 rounded-3xl border border-leaf-100 bg-white p-6 sm:p-8">
                    <label className="block text-sm font-semibold">Full name<input required maxLength={160} autoComplete="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className="field-input mt-2" />{form.errors.name && <span className="mt-1 block text-xs text-red-700">{form.errors.name}</span>}</label>
                    <label className="block text-sm font-semibold">Email address<input required type="email" maxLength={254} autoComplete="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="field-input mt-2" />{form.errors.email && <span className="mt-1 block text-xs text-red-700">{form.errors.email}</span>}</label>
                    <label className="block text-sm font-semibold">Phone<input type="tel" maxLength={30} autoComplete="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="field-input mt-2" />{form.errors.phone && <span className="mt-1 block text-xs text-red-700">{form.errors.phone}</span>}</label>
                    <div className="flex gap-3"><button disabled={form.processing} className="rounded-full bg-leaf-600 px-6 py-3 font-semibold text-white hover:bg-leaf-700">{form.processing ? 'Saving…' : 'Save profile'}</button><a href="/account" className="rounded-full border border-leaf-200 px-6 py-3 font-semibold text-leaf-700">Back</a></div>
                </form>
            </main>
        </AppLayout>
    );
}
