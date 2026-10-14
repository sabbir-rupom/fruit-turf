import { Link, useForm } from '@inertiajs/react';
import { AppLayout } from '../../components/AppLayout';

interface LoginData {
    email: string;
    password: string;
    remember: boolean;
}

export default function Login() {
    const form = useForm<LoginData>({ email: '', password: '', remember: false });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post('/login');
    }

    return (
        <AppLayout>
            <main className="mx-auto max-w-md px-5 py-16">
                <div className="rounded-3xl border border-leaf-100 bg-white p-7 shadow-sm sm:p-9">
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">Welcome back</p>
                    <h1 className="mt-2 font-display text-4xl">Sign in to your patch.</h1>
                    <p className="mt-2 text-sm leading-6 text-muted">Keep track of deliveries, order history and your favorite fresh picks.</p>
                    <form onSubmit={submit} className="mt-7 space-y-4">
                        <label className="block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="field-input mt-2" />{form.errors.email && <span className="mt-1 block text-xs font-normal text-red-700">{form.errors.email}</span>}</label>
                        <label className="block text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className="field-input mt-2" />{form.errors.password && <span className="mt-1 block text-xs font-normal text-red-700">{form.errors.password}</span>}</label>
                        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={form.data.remember} onChange={(event) => form.setData('remember', event.target.checked)} className="accent-leaf-600" />Keep me signed in</label>
                        <button disabled={form.processing} className="w-full rounded-full bg-leaf-600 px-6 py-3 font-semibold text-white hover:bg-leaf-700">{form.processing ? 'Signing in…' : 'Sign in'}</button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted">New to Fruit Turf? <Link href="/#shop" className="font-semibold text-leaf-700 hover:underline">Shop as a guest</Link> or create an account at checkout.</p>
                </div>
            </main>
        </AppLayout>
    );
}
