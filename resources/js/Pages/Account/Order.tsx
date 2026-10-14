import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { dateLabel, money } from '../../lib/format';
import type { Order, Refund } from '../../types';

interface RefundForm {
    reason: string;
    items: { order_item_id: number; quantity: number; restock: boolean }[];
    order?: string;
}

export default function AccountOrder({ order }: { order: Order }) {
    const form = useForm<RefundForm>({
        reason: '',
        items: order.items.map((item) => ({ order_item_id: item.id, quantity: 0, restock: false })),
    });

    function requestRefund(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.transform((data) => ({ ...data, items: data.items.filter((item) => item.quantity > 0) }));
        form.post(`/account/orders/${order.id}/refunds`);
    }

    const existingRefunds = order.refunds ?? [];
    const canRequestRefund = order.status === 'delivered' && order.payment_status === 'paid';

    return (
        <AppLayout>
            <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
                <Link href="/account" className="text-sm font-semibold text-muted hover:text-leaf-700">← Back to my account</Link>
                <div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Order details</p><h1 className="mt-2 font-display text-4xl">{order.invoice_number}</h1><p className="mt-2 text-sm text-muted">Placed {dateLabel(order.placed_at)}</p></div><div className="flex items-center gap-2 no-print"><StatusBadge status={order.status} /><StatusBadge status={order.payment_status} /><button onClick={() => window.print()} className="rounded-full border border-leaf-200 px-4 py-2 text-sm font-semibold text-leaf-700">Print invoice</button></div></div>
                <div className="mt-7 grid gap-7 lg:grid-cols-[1.2fr_.8fr]">
                    <section className="rounded-2xl border border-leaf-100 bg-white p-6">
                        <h2 className="font-display text-2xl">What’s in your delivery</h2>
                        <div className="mt-4 divide-y divide-leaf-100">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-4"><div><p className="font-semibold">{item.product_title}</p><p className="mt-1 text-sm text-muted">{item.quantity} {item.unit} × {money(item.unit_price, order.currency)}</p></div><p className="font-semibold">{money(item.line_total, order.currency)}</p></div>)}</div>
                        <div className="flex justify-between border-t border-leaf-100 pt-4 font-semibold"><span>Total</span><span>{money(order.total, order.currency)}</span></div>
                    </section>
                    <aside className="space-y-5">
                        <section className="rounded-2xl border border-leaf-100 bg-white p-6"><h2 className="font-display text-xl">Delivery details</h2><p className="mt-3 text-sm font-semibold">{order.buyer_name}</p><p className="text-sm text-muted">{order.buyer_email}</p>{order.buyer_phone && <p className="text-sm text-muted">{order.buyer_phone}</p>}<p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{order.delivery_address}</p></section>
                        {existingRefunds.length > 0 && <section className="rounded-2xl border border-leaf-100 bg-white p-6"><h2 className="font-display text-xl">Care requests</h2>{existingRefunds.map((refund: Refund) => <div key={refund.id} className="mt-3 flex items-center justify-between border-t border-leaf-100 pt-3 text-sm"><span>Refund #{refund.id} · {money(refund.amount, order.currency)}</span><StatusBadge status={refund.status} /></div>)}</section>}
                    </aside>
                </div>
                {canRequestRefund && <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                    <h2 className="font-display text-2xl">Something not quite right?</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">Tell us what happened. Choose the quantity you’d like reviewed; we’ll confirm the refund before processing it.</p>
                    <form onSubmit={requestRefund} className="mt-5">
                        <div className="divide-y divide-amber-200">{order.items.map((item, index) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{item.product_title}</p><p className="text-xs text-muted">Up to {item.quantity} {item.unit}</p></div><div className="flex items-center gap-4"><label className="text-xs text-muted">Quantity<input type="number" min="0" max={item.quantity} step="0.001" value={form.data.items[index]?.quantity ?? 0} onChange={(event) => { const items = [...form.data.items]; items[index] = { ...items[index], quantity: Number(event.target.value) }; form.setData('items', items); }} className="ml-2 w-24 rounded-lg border border-amber-200 bg-white px-2 py-2 text-sm text-ink" /></label><label className="flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={form.data.items[index]?.restock ?? false} onChange={(event) => { const items = [...form.data.items]; items[index] = { ...items[index], restock: event.target.checked }; form.setData('items', items); }} className="accent-leaf-600" />Safe to restock</label></div></div>)}</div>
                        <label className="mt-4 block text-sm font-semibold">What went wrong?<textarea required maxLength={500} rows={3} value={form.data.reason} onChange={(event) => form.setData('reason', event.target.value)} className="field-input mt-2 resize-y" /></label>
                        {form.errors.items && <p className="mt-2 text-xs text-red-700">{form.errors.items}</p>}{form.errors.order && <p className="mt-2 text-xs text-red-700">{form.errors.order}</p>}
                        <button disabled={form.processing} className="mt-4 rounded-full border border-leaf-600 px-5 py-2.5 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">{form.processing ? 'Sending…' : 'Request a refund review'}</button>
                    </form>
                </section>}
            </main>
        </AppLayout>
    );
}
