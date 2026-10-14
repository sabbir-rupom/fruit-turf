import { Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { AdminLayout } from '../../../components/AdminLayout';
import { imageUrl } from '../../../lib/format';
import type { Category, Product } from '../../../types';

interface Props {
    product: Product | null;
    categories: Category[];
}

interface ProductForm {
    category_id: number | '';
    title: string;
    slug: string;
    short_description: string;
    description: string;
    price: string;
    unit: string;
    stock_quantity: string;
    low_stock_threshold: string;
    is_perishable: boolean;
    is_featured: boolean;
    is_active: boolean;
    featured_image: File | null;
    gallery_images: File[];
}

export default function ProductFormPage({ product, categories }: Props) {
    const [imageName, setImageName] = useState('');
    const form = useForm<ProductForm>({
        category_id: product?.category_id ?? '',
        title: product?.title ?? '',
        slug: product?.slug ?? '',
        short_description: product?.short_description ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
        unit: product?.unit ?? 'per kg',
        stock_quantity: product?.stock_quantity ?? '0',
        low_stock_threshold: product?.low_stock_threshold ?? '5',
        is_perishable: product?.is_perishable ?? true,
        is_featured: product?.is_featured ?? false,
        is_active: product?.is_active ?? true,
        featured_image: null,
        gallery_images: [],
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (product) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/products/${product.id}`, { forceFormData: true });
        } else {
            form.post('/admin/products', { forceFormData: true });
        }
    }

    const photo = imageUrl(product?.featured_image ?? null);
    return (
        <AdminLayout title={product ? 'Edit fruit' : 'Add a fruit'}>
            <form onSubmit={submit} className="max-w-4xl rounded-2xl border border-leaf-100 bg-white p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Product name" error={form.errors.title}><input required maxLength={160} value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className="field-input" /></Field>
                    <Field label="Slug (optional)" error={form.errors.slug}><input maxLength={180} value={form.data.slug} onChange={(event) => form.setData('slug', event.target.value)} placeholder="generated-from-name" className="field-input" /></Field>
                    <Field label="Category" error={form.errors.category_id}><select value={form.data.category_id} onChange={(event) => form.setData('category_id', event.target.value ? Number(event.target.value) : '')} className="field-input"><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
                    <Field label="Unit" error={form.errors.unit}><select value={form.data.unit} onChange={(event) => form.setData('unit', event.target.value)} className="field-input"><option>per kg</option><option>per dozen</option><option>per box</option><option>each</option><option>per bunch</option></select></Field>
                    <Field label="Price" error={form.errors.price}><input required type="number" min="0.01" step="0.01" value={form.data.price} onChange={(event) => form.setData('price', event.target.value)} className="field-input" /></Field>
                    <Field label="Stock quantity" error={form.errors.stock_quantity}><input required type="number" min="0" step="0.001" value={form.data.stock_quantity} onChange={(event) => form.setData('stock_quantity', event.target.value)} className="field-input" /></Field>
                    <Field label="Low-stock alert threshold" error={form.errors.low_stock_threshold}><input required type="number" min="0" step="0.001" value={form.data.low_stock_threshold} onChange={(event) => form.setData('low_stock_threshold', event.target.value)} className="field-input" /></Field>
                    <Field label="Short description" error={form.errors.short_description}><input maxLength={280} value={form.data.short_description} onChange={(event) => form.setData('short_description', event.target.value)} className="field-input" /></Field>
                    <div className="sm:col-span-2"><Field label="Full description" error={form.errors.description}><textarea rows={4} maxLength={10000} value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className="field-input resize-y" /></Field></div>
                    <div className="space-y-3"><Field label="Featured image" error={form.errors.featured_image}><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0] ?? null; form.setData('featured_image', file); setImageName(file?.name ?? ''); }} className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-leaf-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-leaf-700" />{imageName && <span className="mt-1 block text-xs text-muted">{imageName}</span>}{photo && <img src={photo} alt="Current product" className="mt-3 size-20 rounded-xl object-cover" />}</Field><Field label="Additional gallery images" error={form.errors.gallery_images}><input type="file" accept="image/*" multiple onChange={(event) => form.setData('gallery_images', Array.from(event.target.files ?? []))} className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-leaf-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-leaf-700" /><span className="mt-1 block text-xs font-normal text-muted">Up to 8 images, 5 MB each. New gallery images are added to existing ones.</span>{form.errors['gallery_images.0'] && <span className="block text-xs text-red-700">{form.errors['gallery_images.0']}</span>}</Field></div>
                    <div className="flex flex-col justify-center gap-3 rounded-xl bg-leaf-50 p-4">
                        <Toggle label="Perishable produce" checked={form.data.is_perishable} onChange={(value) => form.setData('is_perishable', value)} />
                        <Toggle label="Feature on the storefront" checked={form.data.is_featured} onChange={(value) => form.setData('is_featured', value)} />
                        <Toggle label="Available for sale" checked={form.data.is_active} onChange={(value) => form.setData('is_active', value)} />
                    </div>
                </div>
                <div className="mt-7 flex gap-3"><button disabled={form.processing} className="rounded-full bg-leaf-600 px-6 py-3 font-semibold text-white hover:bg-leaf-700">{form.processing ? 'Saving…' : product ? 'Save changes' : 'Add to catalog'}</button><Link href="/admin/products" className="rounded-full border border-leaf-200 px-6 py-3 font-semibold text-leaf-700">Cancel</Link></div>
                {Object.keys(form.errors).length > 0 && <p className="mt-4 text-sm text-red-700">Please check the fields marked above.</p>}
            </form>
        </AdminLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <label className="block text-sm font-semibold">{label}{children}<span className="mt-1 block text-xs font-normal text-red-700">{error}</span></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
    return <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-leaf-600" />{label}</label>;
}
