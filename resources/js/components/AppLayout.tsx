import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from '../types';
import { useCart } from '../contexts/CartContext';

export function AppLayout({ children }: { children: ReactNode }) {
    const { auth, flash } = usePage<SharedProps>().props;
    const { count } = useCart();

    return (
        <div className="min-h-screen bg-cream text-ink">
            <header className="no-print border-b border-leaf-100 bg-white/90">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-2xl bg-leaf-600 text-xl text-white">f</span>
                        <span>
                            <span className="block font-display text-2xl leading-none">fruit turf</span>
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.22em] text-muted">good things grow here</span>
                        </span>
                    </Link>
                    <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
                        <Link href="/" className="transition hover:text-leaf-700">Shop</Link>
                        <a href="/#our-promise" className="transition hover:text-leaf-700">Our promise</a>
                        {auth.user && (
                            <Link href={auth.user.role === 'admin' ? '/admin' : '/account'} className="transition hover:text-leaf-700">
                                {auth.user.role === 'admin' ? 'Admin' : 'My account'}
                            </Link>
                        )}
                    </nav>
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <form action="/logout" method="post">
                                <input type="hidden" name="_token" value={document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''} />
                                <button className="text-xs font-semibold text-muted hover:text-ink sm:text-sm">Sign out</button>
                            </form>
                        ) : (
                            <Link href="/login" className="text-xs font-semibold text-muted hover:text-ink sm:text-sm">Sign in</Link>
                        )}
                        {auth.user && <Link href={auth.user.role === 'admin' ? '/admin' : '/account'} className="text-xs font-semibold text-leaf-700 md:hidden">{auth.user.role === 'admin' ? 'Admin' : 'Account'}</Link>}
                        <Link href="/checkout" className="relative flex items-center gap-2 rounded-full bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf-700">
                            <span>Basket</span>
                            <span className="grid size-5 place-items-center rounded-full bg-white/20 text-xs">{count}</span>
                        </Link>
                    </div>
                </div>
            </header>
            {flash.success && <div className="mx-auto mt-5 max-w-7xl px-5 lg:px-8"><div className="rounded-xl border border-leaf-100 bg-leaf-50 px-4 py-3 text-sm text-leaf-700">{flash.success}</div></div>}
            {flash.error && <div className="mx-auto mt-5 max-w-7xl px-5 lg:px-8"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</div></div>}
            {children}
            <footer className="no-print mt-20 border-t border-leaf-100 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <span>Fruit Turf · Fresh from our growers to your table.</span>
                    <span>Picked with care. Delivered with a little sunshine.</span>
                </div>
            </footer>
        </div>
    );
}
