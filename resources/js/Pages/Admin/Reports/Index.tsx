import { Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { AdminLayout } from '../../../components/AdminLayout';
import { money } from '../../../lib/format';

interface Props {
    filters: { from: string; to: string; grouping: 'day' | 'week' | 'month' };
    summary: { gross_sales: number; refunds: number; net_revenue: number; payments: number };
    breakdown: { period: string; revenue: number }[];
}

export default function ReportsIndex({ filters, summary, breakdown }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [grouping, setGrouping] = useState(filters.grouping);
    function apply(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get('/admin/reports', { from, to, grouping }, { preserveState: true, replace: true });
    }
    function changeGrouping(value: string) {
        if (value === 'day' || value === 'week' || value === 'month') {
            setGrouping(value);
        }
    }
    const exportUrl = `/admin/reports/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const purchasesUrl = `/admin/reports/purchases/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    return (
        <AdminLayout title="Financial reports">
            <form onSubmit={apply} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-leaf-100 bg-white p-5">
                <label className="text-xs font-semibold text-muted">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="field-input mt-1" /></label>
                <label className="text-xs font-semibold text-muted">Through<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="field-input mt-1" /></label>
                <label className="text-xs font-semibold text-muted">Breakdown<select value={grouping} onChange={(event) => changeGrouping(event.target.value)} className="field-input mt-1"><option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option></select></label>
                <button className="rounded-full bg-leaf-600 px-5 py-3 text-sm font-semibold text-white">Run report</button>
                <a href={exportUrl} className="rounded-full border border-leaf-200 px-5 py-3 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">Download CSV</a>
                <a href={purchasesUrl} className="rounded-full border border-leaf-200 px-5 py-3 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">Purchase report CSV</a>
            </form>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Gross sales" value={money(summary.gross_sales)} hint="Settled customer payments" />
                <Metric label="Refunds paid" value={money(summary.refunds)} hint="Settled refund transactions" />
                <Metric label="Net revenue" value={money(summary.net_revenue)} hint="Gross sales less refunds" />
                <Metric label="Payments settled" value={summary.payments.toLocaleString()} hint="Successful payment transactions" />
            </div>
            <section className="mt-6 rounded-2xl border border-leaf-100 bg-white p-6">
                <h2 className="font-display text-2xl">{grouping === 'day' ? 'Daily' : grouping === 'week' ? 'Weekly' : 'Monthly'} net revenue</h2>
                <p className="mt-1 text-sm text-muted">All figures are based on settled transactions in the selected period.</p>
                <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-muted"><tr><th className="py-3">Period</th><th className="text-right">Net revenue</th></tr></thead><tbody className="divide-y divide-leaf-100">{breakdown.map((entry) => <tr key={entry.period}><td className="py-3">{entry.period}</td><td className="text-right font-semibold">{money(entry.revenue)}</td></tr>)}</tbody></table>{breakdown.length === 0 && <p className="py-6 text-center text-sm text-muted">No settled sales in this reporting period.</p>}</div>
            </section>
        </AdminLayout>
    );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
    return <article className="rounded-2xl border border-leaf-100 bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 font-display text-3xl">{value}</p><p className="mt-2 text-xs text-muted">{hint}</p></article>;
}
