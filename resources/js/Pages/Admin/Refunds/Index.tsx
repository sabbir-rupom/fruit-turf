import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '../../../components/AdminLayout';
import { Pagination } from '../../../components/Pagination';
import { StatusBadge } from '../../../components/StatusBadge';
import { dateLabel, money } from '../../../lib/format';
import type { Paginated, Refund } from '../../../types';

export default function RefundsIndex({ refunds }: { refunds: Paginated<Refund> }) {
    return (
        <AdminLayout title="Care & refunds">
            <p className="mb-5 max-w-3xl text-sm leading-6 text-muted">Review customer reports and record refunds after completing the payout through the original payment channel. Stripe refunds must first be completed in the Stripe Dashboard; enter the resulting Stripe refund ID below so it is recorded against Stripe, not as a cash payout.</p>
            <div className="space-y-4">
                {refunds.data.map((refund) => <RefundCard key={refund.id} refund={refund} />)}
                {!refunds.data.length && <div className="rounded-2xl border border-leaf-100 bg-white p-10 text-center text-sm text-muted">No refund requests to review.</div>}
            </div>
            <Pagination data={refunds} />
        </AdminLayout>
    );
}

function RefundCard({ refund }: { refund: Refund }) {
    const form = useForm({ gateway_reference: '' });
    const rejectForm = useForm({});
    function settle(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(`/admin/refunds/${refund.id}/process`);
    }

    return <article className="rounded-2xl border border-leaf-100 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex flex-wrap items-center gap-3"><h2 className="font-display text-2xl">Refund #{refund.id}</h2><StatusBadge status={refund.status} /></div><p className="mt-1 text-sm text-muted">Order {refund.order?.invoice_number} · {refund.order?.buyer_name} · {dateLabel(refund.created_at)}</p></div>
            <p className="font-display text-2xl">{money(refund.amount, refund.order?.currency)}</p>
        </div>
        <p className="mt-4 rounded-xl bg-cream p-4 text-sm leading-6"><span className="font-semibold">Customer note: </span>{refund.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">{refund.items?.map((item) => <span key={item.id} className="rounded-full bg-leaf-50 px-3 py-1.5 text-xs text-leaf-700">{item.order_item?.product_title}: {item.quantity} {item.order_item?.unit}{item.restock ? ' · restock' : ''}</span>)}</div>
        {refund.status === 'pending' && <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-leaf-100 pt-5">
            <form onSubmit={settle} className="flex flex-1 flex-wrap items-end gap-3">
                <label className="min-w-56 flex-1 text-xs font-semibold text-muted">{refund.order?.payment_method === 'stripe' ? 'Stripe refund ID (complete refund in Stripe first)' : 'Payout reference (required)'}<input required maxLength={120} value={form.data.gateway_reference} onChange={(event) => form.setData('gateway_reference', event.target.value)} placeholder={refund.order?.payment_method === 'stripe' ? 're_…' : 'Bank transfer or payment reference'} className="field-input mt-1" />{form.errors.gateway_reference && <span className="text-red-700">{form.errors.gateway_reference}</span>}</label>
                <button disabled={form.processing} className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700">Record as paid</button>
            </form>
            <button onClick={() => { if (window.confirm('Reject this refund request?')) rejectForm.post(`/admin/refunds/${refund.id}/reject`); }} className="rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Reject request</button>
        </div>}
        {refund.gateway_reference && <p className="mt-4 text-xs text-muted">Settlement reference: {refund.gateway_reference}</p>}
    </article>;
}
