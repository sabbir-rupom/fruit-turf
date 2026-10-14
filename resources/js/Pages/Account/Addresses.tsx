import { router, useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { AppLayout } from '../../components/AppLayout';

interface Address {
    id: number;
    label: string;
    recipient_name: string;
    phone: string | null;
    address: string;
    is_default: boolean;
}

interface AddressData {
    label: string;
    recipient_name: string;
    phone: string;
    address: string;
    is_default: boolean;
}

export default function Addresses({ addresses }: { addresses: Address[] }) {
    const create = useForm<AddressData>({ label: 'Home', recipient_name: '', phone: '', address: '', is_default: false });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        create.post('/account/addresses', { onSuccess: () => create.reset() });
    }

    return (
        <AppLayout>
            <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Delivery details</p>
                <h1 className="mt-2 font-display text-5xl">Your addresses</h1>
                <p className="mt-3 max-w-2xl text-muted">Save the places your favorite fruit should go. Your default address will be filled in at checkout.</p>
                <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
                    <section className="space-y-3">
                        {addresses.map((address) => <AddressCard key={address.id} address={address} />)}
                        {!addresses.length && <div className="rounded-2xl border border-leaf-100 bg-white p-8 text-sm text-muted">No saved addresses yet. Add one and we’ll remember it for next time.</div>}
                    </section>
                    <form onSubmit={submit} className="rounded-2xl border border-leaf-100 bg-white p-6">
                        <h2 className="font-display text-2xl">Add an address</h2>
                        <div className="mt-5 space-y-4">
                            <Field label="Label" error={create.errors.label}><input required maxLength={50} placeholder="Home, work…" value={create.data.label} onChange={(event) => create.setData('label', event.target.value)} className="field-input" /></Field>
                            <Field label="Recipient name" error={create.errors.recipient_name}><input required maxLength={160} autoComplete="name" value={create.data.recipient_name} onChange={(event) => create.setData('recipient_name', event.target.value)} className="field-input" /></Field>
                            <Field label="Phone (optional)" error={create.errors.phone}><input maxLength={30} autoComplete="tel" value={create.data.phone} onChange={(event) => create.setData('phone', event.target.value)} className="field-input" /></Field>
                            <Field label="Full delivery address" error={create.errors.address}><textarea required rows={3} maxLength={2000} autoComplete="street-address" value={create.data.address} onChange={(event) => create.setData('address', event.target.value)} className="field-input resize-y" /></Field>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={create.data.is_default} onChange={(event) => create.setData('is_default', event.target.checked)} className="accent-leaf-600" />Make this my default</label>
                        </div>
                        <button disabled={create.processing} className="mt-5 rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700">{create.processing ? 'Saving…' : 'Save address'}</button>
                    </form>
                </div>
            </main>
        </AppLayout>
    );
}

function AddressCard({ address }: { address: Address }) {
    const form = useForm<AddressData>({
        label: address.label,
        recipient_name: address.recipient_name,
        phone: address.phone ?? '',
        address: address.address,
        is_default: address.is_default,
    });

    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put(`/account/addresses/${address.id}`);
    }

    return <form onSubmit={update} className="rounded-2xl border border-leaf-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><h2 className="font-display text-xl">{address.label}</h2>{address.is_default && <span className="rounded-full bg-leaf-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-leaf-700">Default</span>}</div><button type="button" onClick={() => { if (window.confirm('Remove this saved address?')) router.delete(`/account/addresses/${address.id}`); }} className="text-xs font-semibold text-red-700 hover:underline">Remove</button></div>
        <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" error={form.errors.label}><input required maxLength={50} value={form.data.label} onChange={(event) => form.setData('label', event.target.value)} className="field-input" /></Field>
            <Field label="Recipient" error={form.errors.recipient_name}><input required maxLength={160} value={form.data.recipient_name} onChange={(event) => form.setData('recipient_name', event.target.value)} className="field-input" /></Field>
            <Field label="Phone" error={form.errors.phone}><input maxLength={30} value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="field-input" /></Field>
            <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={form.data.is_default} onChange={(event) => form.setData('is_default', event.target.checked)} className="accent-leaf-600" />Default address</label>
            <div className="sm:col-span-2"><Field label="Address" error={form.errors.address}><textarea required rows={3} maxLength={2000} value={form.data.address} onChange={(event) => form.setData('address', event.target.value)} className="field-input resize-y" /></Field></div>
        </div>
        <button disabled={form.processing} className="mt-4 rounded-full border border-leaf-200 px-4 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">Save changes</button>
    </form>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <label className="block text-sm font-semibold">{label}{children}<span className="mt-1 block text-xs font-normal text-red-700">{error}</span></label>;
}
