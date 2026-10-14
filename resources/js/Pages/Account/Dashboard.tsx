import { Link } from '@inertiajs/react';
import { AppLayout } from '../../components/AppLayout';
import { Pagination } from '../../components/Pagination';
import { StatusBadge } from '../../components/StatusBadge';
import { dateLabel, money } from '../../lib/format';
import type { Order, Paginated } from '../../types';

interface Props {
    orders: Paginated<Order>;
    stats: { orders: number; pending: number; spent: number };
}

export default function AccountDashboard({ orders, stats }: Props) {
    return (
        <AppLayout>
            <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Your little corner</p><h1 className="mt-2 font-display text-5xl">My account</h1><p className="mt-2 text-muted">Everything you’ve ordered, all in one place.</p></div><div className="flex gap-2"><Link href="/account/profile" className="rounded-full border border-leaf-200 px-5 py-2.5 text-sm font-semibold text-leaf-700 hover:bg-white">Edit profile</Link><Link href="/account/addresses" className="rounded-full border border-leaf-200 px-5 py-2.5 text-sm font-semibold text-leaf-700 hover:bg-white">Delivery addresses</Link></div></div>
                <div className="mt-7 grid gap-4 sm:grid-cols-3">{[['Orders placed', stats.orders], ['On the way', stats.pending], ['Paid with us', money(stats.spent)]].map(([label, value]) => <article key={label} className="rounded-2xl border border-leaf-100 bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 font-display text-3xl">{value}</p></article>)}</div>
                <section className="mt-8"><h2 className="mb-4 font-display text-3xl">Order history</h2><div className="space-y-3">{orders.data.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`} className="grid gap-4 rounded-2xl border border-leaf-100 bg-white p-5 transition hover:border-leaf-500 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold">{order.invoice_number}</p><p className="mt-1 text-sm text-muted">{dateLabel(order.placed_at)} · {order.items.length} items</p></div><div className="flex gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.payment_status} /></div><p className="font-semibold sm:text-right">{money(order.total, order.currency)}</p></Link>)}
                    {orders.data.length === 0 && <div className="rounded-2xl border border-leaf-100 bg-white p-10 text-center"><p className="font-display text-2xl">Your first harvest is waiting.</p><Link href="/" className="mt-4 inline-flex rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white">Explore the shop</Link></div>}
                </div><Pagination data={orders} /></section>
            </main>
        </AppLayout>
    );
}
