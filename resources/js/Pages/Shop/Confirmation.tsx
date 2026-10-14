import { Link } from '@inertiajs/react';
import { AppLayout } from '../../components/AppLayout';
import { money } from '../../lib/format';
import type { Order } from '../../types';

export default function Confirmation({ order }: { order: Order }) {
    return (
        <AppLayout>
            <main className="mx-auto max-w-3xl px-5 py-16 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-leaf-100 text-3xl text-leaf-700">✓</div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Order planted</p>
                <h1 className="mt-2 font-display text-5xl">Thanks, {order.buyer_name.split(' ')[0]}.</h1>
                <p className="mt-4 text-muted">Your fruit is being prepared with care. A confirmation will be sent to {order.buyer_email}.</p>
                <div className="mt-8 rounded-3xl border border-leaf-100 bg-white p-6 text-left sm:p-8">
                    <div className="flex flex-wrap justify-between gap-3 border-b border-leaf-100 pb-5"><div><p className="text-xs uppercase tracking-widest text-muted">Order number</p><p className="mt-1 font-semibold">{order.invoice_number}</p></div><div className="text-right"><p className="text-xs uppercase tracking-widest text-muted">Payment</p><p className="mt-1 font-semibold">Cash on delivery</p></div></div>
                    <div className="divide-y divide-leaf-100">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.product_title} × {item.quantity} {item.unit}</span><span className="font-semibold">{money(item.line_total, order.currency)}</span></div>)}</div>
                    <div className="flex justify-between border-t border-leaf-100 pt-4 font-semibold"><span>Total</span><span>{money(order.total, order.currency)}</span></div>
                    <p className="mt-5 rounded-xl bg-leaf-50 p-4 text-sm leading-6 text-muted"><span className="font-semibold text-ink">Delivering to</span><br />{order.delivery_address}</p>
                </div>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                    {order.user_id && <Link href="/account" className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-white">View my orders</Link>}
                    <Link href="/" className="rounded-full border border-leaf-200 px-6 py-3 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">Continue shopping</Link>
                </div>
            </main>
        </AppLayout>
    );
}
