import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AdminLayout } from '../../../components/AdminLayout';
import type { Category } from '../../../types';

export default function CategoriesIndex({ categories }: { categories: Category[] }) {
    const create = useForm({ name: '', description: '' });
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        create.post('/admin/categories', { onSuccess: () => create.reset() });
    }

    return (
        <AdminLayout title="Growing categories">
            <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-leaf-100 bg-white p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <label className="text-sm font-semibold">New category<input required maxLength={100} value={create.data.name} onChange={(event) => create.setData('name', event.target.value)} className="field-input mt-2" />{create.errors.name && <span className="text-xs text-red-700">{create.errors.name}</span>}</label>
                <label className="text-sm font-semibold">Short description<input maxLength={500} value={create.data.description} onChange={(event) => create.setData('description', event.target.value)} className="field-input mt-2" /></label>
                <button disabled={create.processing} className="rounded-full bg-leaf-600 px-5 py-3 text-sm font-semibold text-white hover:bg-leaf-700">Add category</button>
            </form>
            <div className="grid gap-4 md:grid-cols-2">
                {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
            </div>
        </AdminLayout>
    );
}

function CategoryCard({ category }: { category: Category }) {
    const form = useForm({
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put(`/admin/categories/${category.id}`);
    }

    return <form onSubmit={submit} className="rounded-2xl border border-leaf-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="font-display text-xl">{category.name}</p><p className="text-xs text-muted">{category.products_count} products</p></div><button type="button" onClick={() => { if (window.confirm(`Delete the ${category.name} category?`)) router.delete(`/admin/categories/${category.id}`); }} className="text-xs font-semibold text-red-700 hover:underline">Delete</button></div>
        <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted">Name<input required value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className="field-input mt-1" /></label>
            <label className="text-xs font-semibold text-muted">Slug<input required value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} className="field-input mt-1" /></label>
            <label className="text-xs font-semibold text-muted">Sort order<input required type="number" min="0" value={form.data.sort_order} onChange={(event) => form.setData('sort_order', Number(event.target.value))} className="field-input mt-1" /></label>
            <label className="flex items-center gap-2 pt-5 text-sm"><input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} className="accent-leaf-600" />Active</label>
            <label className="sm:col-span-2 text-xs font-semibold text-muted">Description<input value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className="field-input mt-1" /></label>
        </div>
        <button disabled={form.processing} className="mt-4 rounded-full border border-leaf-200 px-4 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50">{form.processing ? 'Saving…' : 'Save category'}</button>
    </form>;
}
