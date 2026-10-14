import { Link, useForm } from '@inertiajs/react';
import { useEffect, type FormEvent, type ReactNode } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useCart } from '../../contexts/CartContext';
import { money } from '../../lib/format';
import type { User } from '../../types';

interface Props {
    customer: (Pick<User, 'name' | 'email' | 'phone'> & { default_address: string | null }) | null;
    paymentMethods: { cash_on_delivery: boolean; stripe: boolean };
}

interface CheckoutData {
    name: string;
    email: string;
    phone: string;
    delivery_address: string;
    customer_note: string;
    payment_method: 'cash_on_delivery' | 'stripe';
    create_account: boolean;
    password: string;
    password_confirmation: string;
    items: { product_id: number; quantity: number }[];
}

const PHONE_NUMBER_PATTERN = String.raw`^\+?(?=(?:\D*\d){7,15}\D*$)[0-9\s().-]+$`;

export default function Checkout({ customer, paymentMethods }: Props) {
    const { lines, subtotal, setQuantity, remove, clear, ready } = useCart();
    const initialPaymentMethod = paymentMethods.cash_on_delivery ? 'cash_on_delivery' : 'stripe';
    const hasPaymentMethods = paymentMethods.cash_on_delivery || paymentMethods.stripe;
    const form = useForm<CheckoutData>({
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        delivery_address: customer?.default_address ?? '',
        customer_note: '',
        payment_method: initialPaymentMethod,
        create_account: false,
        password: '',
        password_confirmation: '',
        items: [],
    });

    useEffect(() => {
        form.setData('items', lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity })));
    }, [lines]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/checkout', { onSuccess: clear });
    }

    return (
        <AppLayout>
            <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                <div className="mb-9">
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Almost home</p>
                    <h1 className="mt-2 font-display text-5xl">Your fresh delivery</h1>
                    <p className="mt-2 text-muted">A few details help us get your harvest to the right door.</p>
                </div>
                {!ready || lines.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center">
                        <h2 className="font-display text-2xl">{ready ? 'Your basket is waiting to be filled.' : 'Loading your basket…'}</h2>
                        {ready && <Link href="/" className="mt-5 inline-flex rounded-full bg-leaf-600 px-5 py-3 text-sm font-semibold text-white">Browse fresh fruit</Link>}
                    </div>
                ) : (
                    <form onSubmit={submit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
                        <section className="rounded-3xl border border-leaf-100 bg-white p-6 sm:p-8">
                            <h2 className="font-display text-2xl">Delivery details</h2>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <Field label="Full name" error={form.errors.name}><input required maxLength={160} autoComplete="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className="field-input" /></Field>
                                <Field label="Email address" error={form.errors.email}><input required type="email" maxLength={254} autoComplete="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="field-input" /></Field>
                                <Field label={form.data.create_account ? 'Phone number (required for account creation)' : 'Phone number'} error={form.errors.phone}><input type="tel" required={form.data.create_account} pattern={PHONE_NUMBER_PATTERN} title="Enter 7 to 15 digits, optionally with a leading country code, spaces, parentheses or hyphens." maxLength={30} autoComplete="tel" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="field-input" /><span className="mt-1 block text-xs font-normal text-muted">Use 7 to 15 digits. A country code is optional.</span></Field>
                                <div className="sm:col-span-2"><Field label="Delivery address" error={form.errors.delivery_address}><textarea required rows={3} maxLength={2000} autoComplete="street-address" value={form.data.delivery_address} onChange={(event) => form.setData('delivery_address', event.target.value)} placeholder="House, street, area, city and any delivery notes" className="field-input resize-y" /></Field></div>
                                <div className="sm:col-span-2"><Field label="Note for the seller (optional)" error={form.errors.customer_note}><textarea rows={2} maxLength={1000} value={form.data.customer_note} onChange={(event) => form.setData('customer_note', event.target.value)} placeholder="Anything we should know?" className="field-input resize-y" /></Field></div>
                            </div>
                            {!customer && (
                                <div className="mt-6 rounded-2xl bg-leaf-50 p-4">
                                    <label className="flex items-start gap-3 text-sm">
                                        <input type="checkbox" checked={form.data.create_account} onChange={(event) => form.setData('create_account', event.target.checked)} className="mt-1 accent-leaf-600" />
                                        <span><span className="font-semibold">Create an account for next time</span><span className="mt-1 block text-muted">You can also check out as a guest. An account keeps your order history in one place.</span></span>
                                    </label>
                                    {form.data.create_account && <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <Field label="Password" error={form.errors.password}><input type="password" minLength={8} autoComplete="new-password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className="field-input" required /></Field>
                                        <Field label="Confirm password" error={form.errors.password_confirmation}><input type="password" minLength={8} autoComplete="new-password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} className="field-input" required /></Field>
                                    </div>}
                                </div>
                            )}
                            {form.errors.items && <p className="mt-4 text-sm text-red-700">{form.errors.items}</p>}
                            {form.errors.payment_method && <p className="mt-4 text-sm text-red-700">{form.errors.payment_method}</p>}
                        </section>
                        <aside className="rounded-3xl border border-leaf-100 bg-white p-6 sm:p-8 lg:sticky lg:top-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-display text-2xl">Your basket <span className="font-sans text-sm font-normal text-muted">({lines.length} items)</span></h2>
                                <button type="button" onClick={clear} className="shrink-0 rounded-full border border-leaf-200 px-3 py-2 text-xs font-semibold text-leaf-700 transition hover:bg-leaf-50">Clear basket</button>
                            </div>
                            <div className="mt-5 divide-y divide-leaf-100">
                                {lines.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 py-4">
                                    <div className="min-w-0 flex-1"><p className="font-semibold">{product.title}</p><p className="mt-1 text-sm text-muted">{money(product.price)} · {product.unit}</p><button type="button" onClick={() => remove(product.id)} className="mt-2 text-xs font-semibold text-muted underline hover:text-red-700">Remove</button></div>
                                    <input aria-label={`${product.title} quantity`} type="number" min="0" max={product.stock_quantity} step="1" value={quantity} onChange={(event) => setQuantity(product.id, Number(event.target.value))} className="h-10 w-24 rounded-lg border border-leaf-100 px-2 text-sm" />
                                    <p className="w-20 pt-2 text-right text-sm font-semibold">{money(Number(product.price) * quantity)}</p>
                                </div>)}
                            </div>
                            <div className="mt-5 border-t border-leaf-100 pt-5">
                                <div className="flex items-center justify-between text-sm text-muted"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                                <div className="mt-2 flex items-center justify-between text-sm text-muted"><span>Delivery</span><span>Calculated at delivery</span></div>
                                <div className="mt-4 flex items-center justify-between font-semibold"><span>Total</span><span className="text-xl">{money(subtotal)}</span></div>
                            </div>
                            <fieldset className="mt-5 space-y-3">
                                <legend className="mb-2 text-sm font-semibold">Payment method</legend>
                                {!hasPaymentMethods && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Checkout is temporarily unavailable because no payment method is currently configured.</p>}
                                {paymentMethods.cash_on_delivery && <label className="flex cursor-pointer gap-3 rounded-xl border border-leaf-100 p-3 text-sm">
                                    <input type="radio" name="payment_method" value="cash_on_delivery" checked={form.data.payment_method === 'cash_on_delivery'} onChange={() => form.setData('payment_method', 'cash_on_delivery')} className="mt-1 accent-leaf-600" />
                                    <span><span className="font-semibold">Cash on delivery</span><span className="mt-1 block text-xs text-muted">Pay when your fresh delivery arrives.</span></span>
                                </label>}
                                {paymentMethods.stripe && <label className="flex cursor-pointer gap-3 rounded-xl border border-leaf-100 p-3 text-sm">
                                    <input type="radio" name="payment_method" value="stripe" checked={form.data.payment_method === 'stripe'} onChange={() => form.setData('payment_method', 'stripe')} className="mt-1 accent-leaf-600" />
                                    <span><span className="font-semibold">Card with Stripe</span><span className="mt-1 block text-xs text-muted">Pay securely on Stripe’s hosted checkout page.</span></span>
                                </label>}
                            </fieldset>
                            <button type="submit" disabled={form.processing || !hasPaymentMethods} className="mt-5 w-full rounded-full bg-leaf-600 px-6 py-3.5 font-semibold text-white transition hover:bg-leaf-700 disabled:opacity-60">{form.processing ? 'Placing order…' : form.data.payment_method === 'stripe' ? 'Continue to secure payment' : 'Place your order'}</button>
                        </aside>
                    </form>
                )}
            </main>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <label className="block text-sm font-semibold">{label}{children}<span className="mt-1 block text-xs font-normal text-red-700">{error}</span></label>;
}
