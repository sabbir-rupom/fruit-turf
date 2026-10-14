import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '../../../components/AdminLayout';

interface Settings {
    currency: string;
    cash_on_delivery_enabled: boolean;
    stripe_enabled: boolean;
    stripe_available: boolean;
    stripe_publishable_key: string | null;
    stripe_secret_key_configured: boolean;
    stripe_webhook_secret_configured: boolean;
}

interface PaymentSettingsData {
    cash_on_delivery_enabled: boolean;
    stripe_enabled: boolean;
    stripe_publishable_key: string;
    stripe_secret_key: string;
    stripe_webhook_secret: string;
}

export default function Payments({ settings }: { settings: Settings }) {
    const form = useForm<PaymentSettingsData>({
        cash_on_delivery_enabled: settings.cash_on_delivery_enabled,
        stripe_enabled: settings.stripe_enabled,
        stripe_publishable_key: settings.stripe_publishable_key ?? '',
        stripe_secret_key: '',
        stripe_webhook_secret: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put('/admin/settings/payments', {
            onSuccess: () => form.reset('stripe_secret_key', 'stripe_webhook_secret'),
        });
    }

    return (
        <AdminLayout title="Payment settings">
            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-leaf-100 bg-white p-5 sm:p-7">
                    <p className="text-sm text-muted">Store currency: <span className="font-semibold text-ink">{settings.currency}</span></p>
                    {!settings.stripe_available && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Stripe Checkout requires USD. Set FRUIT_TURF_CURRENCY=USD in the application environment before enabling it, and reprice existing products in USD.</p>}
                    <div className="mt-5 space-y-4">
                        <Toggle label="Cash on delivery" description="Customers pay when their order arrives." checked={form.data.cash_on_delivery_enabled} onChange={(checked) => form.setData('cash_on_delivery_enabled', checked)} />
                        <Toggle label="Stripe card checkout" description="Customers pay through Stripe-hosted Checkout." checked={form.data.stripe_enabled} onChange={(checked) => form.setData('stripe_enabled', checked)} disabled={!settings.stripe_available && !settings.stripe_enabled} />
                    </div>
                    {form.errors.cash_on_delivery_enabled && <p className="mt-3 text-sm text-red-700">{form.errors.cash_on_delivery_enabled}</p>}
                    {form.errors.stripe_enabled && <p className="mt-3 text-sm text-red-700">{form.errors.stripe_enabled}</p>}
                </section>
                <section className="rounded-2xl border border-leaf-100 bg-white p-5 sm:p-7">
                    <h2 className="font-display text-2xl">Stripe credentials</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">Credentials are encrypted in the database. Secret fields remain blank after saving; leave them blank to keep the saved values.</p>
                    <div className="mt-5 grid gap-4">
                        <Credential label="Publishable key" value={form.data.stripe_publishable_key} onChange={(value) => form.setData('stripe_publishable_key', value)} error={form.errors.stripe_publishable_key} placeholder="pk_test_…" />
                        <Credential label="Secret key" value={form.data.stripe_secret_key} onChange={(value) => form.setData('stripe_secret_key', value)} error={form.errors.stripe_secret_key} configured={settings.stripe_secret_key_configured} placeholder="sk_test_…" type="password" />
                        <Credential label="Webhook signing secret" value={form.data.stripe_webhook_secret} onChange={(value) => form.setData('stripe_webhook_secret', value)} error={form.errors.stripe_webhook_secret} configured={settings.stripe_webhook_secret_configured} placeholder="whsec_…" type="password" />
                    </div>
                </section>
                <button type="submit" disabled={form.processing} className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60">{form.processing ? 'Saving…' : 'Save payment settings'}</button>
            </form>
        </AdminLayout>
    );
}

function Toggle({ label, description, checked, onChange, disabled = false }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
    return <label className={`flex items-start gap-3 rounded-xl border border-leaf-100 p-4 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1 accent-leaf-600" />
        <span><span className="font-semibold">{label}</span><span className="mt-1 block text-sm text-muted">{description}</span></span>
    </label>;
}

function Credential({ label, value, onChange, error, configured, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; error?: string; configured?: boolean; placeholder: string; type?: string }) {
    return <label className="block text-sm font-semibold">{label}{configured && <span className="ml-2 text-xs font-normal text-leaf-700">Configured · blank retains current value</span>}<input type={type} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-input mt-1" /><span className="mt-1 block text-xs font-normal text-red-700">{error}</span></label>;
}
