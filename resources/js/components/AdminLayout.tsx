import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from '../types';
import { AppLayout } from './AppLayout';

const links = [
    { label: 'Overview', href: '/admin' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Transactions', href: '/admin/transactions' },
    { label: 'Refunds', href: '/admin/refunds' },
    { label: 'Customers', href: '/admin/customers' },
    { label: 'Reports', href: '/admin/reports' },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
    const currentUrl = usePage<SharedProps>().url;

    return (
        <AppLayout>
            <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
                <aside>
                    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-muted">Store management</p>
                    <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
                        {links.map((link) => {
                            const active = link.href === '/admin' ? currentUrl === '/admin' : currentUrl.startsWith(link.href);
                            return <Link key={link.href} href={link.href} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-leaf-600 text-white' : 'text-muted hover:bg-leaf-50 hover:text-leaf-700'}`}>{link.label}</Link>;
                        })}
                    </nav>
                </aside>
                <main className="min-w-0">
                    <div className="mb-7 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Fruit Turf · Admin</p>
                            <h1 className="mt-2 font-display text-4xl">{title}</h1>
                        </div>
                    </div>
                    {children}
                </main>
            </div>
        </AppLayout>
    );
}
