import { AdminLayout } from '../../../components/AdminLayout';
import { Pagination } from '../../../components/Pagination';
import { StatusBadge } from '../../../components/StatusBadge';
import { dateLabel, money } from '../../../lib/format';
import type { Paginated, Transaction } from '../../../types';

export default function TransactionsIndex({ transactions }: { transactions: Paginated<Transaction> }) {
    return (
        <AdminLayout title="Transaction ledger">
            <div className="overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-leaf-50/60 text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Date</th><th>Invoice / customer</th><th>Type</th><th>Provider / reference</th><th>Status</th><th className="pr-5 text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-leaf-100">{transactions.data.map((transaction) => <tr key={transaction.id}><td className="px-5 py-4 text-muted">{transaction.processed_at ? dateLabel(transaction.processed_at) : 'Awaiting settlement'}</td><td><p className="font-semibold">{transaction.order?.invoice_number ?? '—'}</p><p className="text-xs text-muted">{transaction.order?.buyer_name}</p></td><td className="capitalize">{transaction.type}</td><td><p>{transaction.provider ?? '—'}</p><p className="text-xs text-muted">{transaction.gateway_reference ?? '—'}</p></td><td><StatusBadge status={transaction.status} /></td><td className="pr-5 text-right font-semibold">{money(transaction.amount, transaction.order?.currency)}</td></tr>)}</tbody>
                </table>
                {!transactions.data.length && <p className="p-8 text-center text-sm text-muted">No transactions recorded.</p>}
            </div>
            <Pagination data={transactions} />
        </AdminLayout>
    );
}
