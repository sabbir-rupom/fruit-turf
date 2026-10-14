import { Link } from '@inertiajs/react';
import { AdminLayout } from '../../components/AdminLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { money, dateLabel } from '../../lib/format';
import type { Order, Product } from '../../types';

interface Props {
    metrics: { revenue: number; orders: number; customers: number; pending_deliveries: number; low_stock: number };
    revenue: { date: string; label: string; revenue: number }[];
    recentOrders: Order[];
    lowStockProducts: Product[];
}

export default function Dashboard({ metrics, revenue, recentOrders, lowStockProducts }: Props) {
    const highest = Math.max(...revenue.map((day) => day.revenue), 1);
    const cards = [
        ['Net revenue', money(metrics.revenue), 'Settled payments, less settled refunds'],
        ['All orders', metrics.orders.toLocaleString(), 'Across every customer'],
        ['Active customers', metrics.customers.toLocaleString(), 'Enabled customer accounts'],
        ['On the move', metrics.pending_deliveries.toLocaleString(), 'Pending, processing or shipped'],
    ];

    return (
        <AdminLayout title="Good morning, grower.">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(([label, value, hint]) => <article key={label} className="rounded-2xl border border-leaf-100 bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 font-display text-3xl">{value}</p><p className="mt-2 text-xs text-muted">{hint}</p></article>)}
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
                <section className="rounded-2xl border border-leaf-100 bg-white p-6">
                    <div className="flex items-center justify-between"><div><h2 className="font-display text-2xl">Revenue at a glance</h2><p className="mt-1 text-sm text-muted">Settled sales, net of refunds · last 7 days</p></div><Link href="/admin/reports" className="text-sm font-semibold text-leaf-700 hover:underline">Full report →</Link></div>
                    <div className="mt-7 flex h-48 items-end gap-3 border-b border-leaf-100 pb-2 sm:gap-5">
                        {revenue.map((day) => <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div title={money(day.revenue)} className="w-full max-w-12 rounded-t-lg bg-leaf-500 transition hover:bg-leaf-700" style={{ height: `${Math.max(day.revenue / highest * 100, day.revenue ? 6 : 2)}%` }} /><span className="text-xs text-muted">{day.label}</span></div>)}
                    </div>
                </section>
                <section className="rounded-2xl border border-leaf-100 bg-white p-6">
                    <div className="flex items-center justify-between"><div><h2 className="font-display text-2xl">Low stock</h2><p className="mt-1 text-sm text-muted">{metrics.low_stock} fruits need a look</p></div><Link href="/admin/products" className="text-sm font-semibold text-leaf-700 hover:underline">Inventory →</Link></div>
                    <div className="mt-5 divide-y divide-leaf-100">
                        {lowStockProducts.length ? lowStockProducts.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{product.title}</p><p className="text-xs text-muted">{product.category?.name ?? 'Uncategorised'}</p></div><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{product.stock_quantity} {product.unit.replace('per ', '')}</span></div>) : <p className="py-8 text-sm text-muted">Everything is well stocked.</p>}
                    </div>
                </section>
            </div>
            <section className="mt-6 rounded-2xl border border-leaf-100 bg-white p-6">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-2xl">Recent orders</h2><p className="mt-1 text-sm text-muted">The latest activity from your store</p></div><Link href="/admin/orders" className="text-sm font-semibold text-leaf-700 hover:underline">All orders →</Link></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-3">Invoice</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead><tbody className="divide-y divide-leaf-100">{recentOrders.map((order) => <tr key={order.id}><td className="py-4 font-semibold">{order.invoice_number}</td><td>{order.buyer_name}</td><td>{dateLabel(order.placed_at)}</td><td><StatusBadge status={order.status} /></td><td className="text-right font-semibold">{money(order.total, order.currency)}</td></tr>)}</tbody></table></div>
            </section>
        </AdminLayout>
    );
}
