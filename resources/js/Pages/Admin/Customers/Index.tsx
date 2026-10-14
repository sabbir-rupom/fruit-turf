import { router } from '@inertiajs/react';
import { AdminLayout } from '../../../components/AdminLayout';
import { Pagination } from '../../../components/Pagination';
import { money } from '../../../lib/format';
import type { Paginated, User } from '../../../types';

interface Customer extends User {
    orders_count: number;
    lifetime_value: string | null;
    is_active: boolean;
    created_at: string;
}

export default function CustomersIndex({ customers }: { customers: Paginated<Customer> }) {
    return (
        <AdminLayout title="Your customers">
            <div className="overflow-x-auto rounded-2xl border border-leaf-100 bg-white">
                <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-leaf-50/60 text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Customer</th><th>Contact</th><th>Orders</th><th>Lifetime value</th><th>Status</th></tr></thead>
                    <tbody className="divide-y divide-leaf-100">{customers.data.map((customer) => <tr key={customer.id}><td className="px-5 py-4"><p className="font-semibold">{customer.name}</p><p className="text-xs text-muted">Joined {new Date(customer.created_at).toLocaleDateString()}</p></td><td><p>{customer.email}</p><p className="text-xs text-muted">{customer.phone ?? 'No phone provided'}</p></td><td>{customer.orders_count}</td><td className="font-semibold">{money(customer.lifetime_value ?? 0)}</td><td><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{customer.is_active ? 'Active' : 'Disabled'}</span><button onClick={() => router.patch(`/admin/customers/${customer.id}/status`)} className="text-xs font-semibold text-leaf-700 hover:underline">{customer.is_active ? 'Disable' : 'Enable'}</button></div></td></tr>)}</tbody>
                </table>
                {!customers.data.length && <p className="p-8 text-center text-sm text-muted">No registered customers yet.</p>}
            </div>
            <Pagination data={customers} />
        </AdminLayout>
    );
}
