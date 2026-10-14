import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '../../../components/AdminLayout';
import { Pagination } from '../../../components/Pagination';
import { imageUrl, money } from '../../../lib/format';
import type { Paginated, Product } from '../../../types';

export default function ProductsIndex({ products }: { products: Paginated<Product> }) {
    return (
        <AdminLayout title="Fruit catalog">
            <div className="mb-5 flex justify-end"><Link href="/admin/products/create" className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700">+ Add a fruit</Link></div>
            <div className="overflow-hidden rounded-2xl border border-leaf-100 bg-white">
                <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-leaf-50/60 text-xs uppercase tracking-wider text-muted"><tr><th className="px-5 py-4">Fruit</th><th>Category</th><th>Price</th><th>Stock</th><th>Availability</th><th className="pr-5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-leaf-100">{products.data.map((product) => <tr key={product.id}><td className="px-5 py-4"><div className="flex items-center gap-3">{imageUrl(product.featured_image) && <img src={imageUrl(product.featured_image) ?? ''} alt="" className="size-11 rounded-xl object-cover" />}<div><p className="font-semibold">{product.title}</p><p className="text-xs text-muted">{product.slug}</p></div></div></td><td>{product.category?.name ?? '—'}</td><td>{money(product.price)}</td><td><span className={Number(product.stock_quantity) <= Number(product.low_stock_threshold) ? 'font-semibold text-amber-700' : ''}>{product.stock_quantity} {product.unit.replace('per ', '')}</span></td><td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{product.is_active ? 'Active' : 'Hidden'}</span></td><td className="pr-5 text-right"><div className="flex justify-end gap-3"><Link href={`/admin/products/${product.id}/edit`} className="font-semibold text-leaf-700 hover:underline">Edit</Link><button onClick={() => { if (window.confirm(`Remove ${product.title} from the catalog?`)) router.delete(`/admin/products/${product.id}`); }} className="font-semibold text-red-700 hover:underline">Remove</button></div></td></tr>)}</tbody></table></div>
                {products.data.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">Add the first fruit to your catalog.</p>}
            </div>
            <Pagination data={products} />
        </AdminLayout>
    );
}
