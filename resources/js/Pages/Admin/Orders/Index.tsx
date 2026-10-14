import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '../../../components/AdminLayout';
import { Pagination } from '../../../components/Pagination';
import { StatusBadge } from '../../../components/StatusBadge';
import { dateLabel, money } from '../../../lib/format';
import type { Order, Paginated } from '../../../types';

export default function OrdersIndex({ orders }: { orders: Paginated<Order> }) {
    return (
        <AdminLayout title="Customer orders">
            <div className="overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
                <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className="bg-leaf-50/60 text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Order</th><th>Customer</th><th>Placed</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody className="divide-y divide-leaf-100">{orders.data.map((order) => <OrderRow key={order.id} order={order} />)}</tbody>
                </table>
                {!orders.data.length && <p className="p-8 text-center text-sm text-muted">No orders have been placed yet.</p>}
            </div>
            <Pagination data={orders} />
        </AdminLayout>
    );
}

function OrderRow({ order }: { order: Order }) {
    const options: Record<Order['status'], Order['status'][]> = {
        pending: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: [],
    };
    const form = useForm<{ status: string }>({ status: order.status });
    const payment = useForm({ gateway_reference: '' });
    function update(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.patch(`/admin/orders/${order.id}`);
    }
    function settle(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        payment.post(`/admin/orders/${order.id}/settle`);
    }

    return <tr className="align-top">
        <td className="px-5 py-4"><p className="font-semibold">{order.invoice_number}</p><p className="mt-1 text-xs text-muted">{order.items.length} line items</p></td>
        <td className="py-4"><p className="font-medium">{order.buyer_name}</p><p className="text-xs text-muted">{order.buyer_email}</p></td>
        <td className="py-4 text-muted">{dateLabel(order.placed_at)}</td>
        <td className="py-4">{order.items.length} items</td>
        <td className="py-4"><StatusBadge status={order.payment_status} />{order.payment_status !== 'paid' && <form onSubmit={settle} className="mt-2 flex flex-col gap-1"><input required maxLength={120} value={payment.data.gateway_reference} onChange={(event) => payment.setData('gateway_reference', event.target.value)} placeholder="Settlement reference" className="w-36 rounded-lg border border-leaf-100 px-2 py-1.5 text-xs" /><button disabled={payment.processing} className="text-left text-xs font-semibold text-leaf-700 hover:underline">Record collection</button>{payment.errors.gateway_reference && <span className="text-xs text-red-700">{payment.errors.gateway_reference}</span>}</form>}</td>
        <td className="py-4 font-semibold">{money(order.total, order.currency)}</td>
        <td className="py-4"><StatusBadge status={order.status} /><form onSubmit={update} className="mt-2 flex items-center gap-2"><select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} disabled={!options[order.status].length} className="rounded-lg border border-leaf-100 bg-white px-2 py-2 text-xs capitalize disabled:opacity-70"><option value={order.status}>{order.status}</option>{options[order.status].map((status) => <option key={status} value={status}>{status}</option>)}</select>{options[order.status].length > 0 && <button disabled={form.processing || form.data.status === order.status} className="text-xs font-semibold text-leaf-700 hover:underline">Save</button>}</form>{form.errors.status && <p className="mt-1 text-xs text-red-700">{form.errors.status}</p>}</td>
    </tr>;
}
