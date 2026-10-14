import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useCart } from '../../contexts/CartContext';
import { imageUrl, money } from '../../lib/format';
import type { Product } from '../../types';

export default function ShopShow({ product }: { product: Product }) {
    const { add } = useCart();
    const photos = [product.featured_image, ...(product.image_gallery ?? [])]
        .map(imageUrl)
        .filter((photo): photo is string => photo !== null);
    const [activePhoto, setActivePhoto] = useState(0);
    const photo = photos[activePhoto] ?? null;

    return (
        <AppLayout>
            <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
                <Link href="/" className="text-sm font-semibold text-muted hover:text-leaf-700">← Back to the harvest</Link>
                <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <div className="overflow-hidden rounded-[2rem] bg-leaf-50">
                            {photo && <img src={photo} alt={product.title} className="aspect-square size-full object-cover" />}
                        </div>
                        {photos.length > 1 && <div className="mt-3 flex gap-3">{photos.map((image, index) => <button key={image} onClick={() => setActivePhoto(index)} aria-label={`Show product image ${index + 1}`} className={`size-16 overflow-hidden rounded-xl border-2 ${activePhoto === index ? 'border-leaf-600' : 'border-transparent'}`}><img src={image} alt="" className="size-full object-cover" /></button>)}</div>}
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">{product.category?.name ?? 'Fresh pick'} · {product.is_perishable ? 'Picked fresh' : 'Pantry ready'}</p>
                        <h1 className="mt-3 font-display text-5xl">{product.title}</h1>
                        <p className="mt-5 text-lg leading-8 text-muted">{product.description ?? product.short_description}</p>
                        <div className="mt-7 border-y border-leaf-100 py-5">
                            <p className="font-display text-3xl">{money(product.price)} <span className="font-sans text-sm font-normal text-muted">{product.unit}</span></p>
                            <p className="mt-2 text-sm text-muted">{Number(product.stock_quantity) > 0 ? `${product.stock_quantity} ${product.unit.replace('per ', '')} available today` : 'Currently out of stock'}</p>
                        </div>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <button onClick={() => add(product)} disabled={Number(product.stock_quantity) <= 0} className="rounded-full bg-leaf-600 px-7 py-3 font-semibold text-white transition hover:bg-leaf-700">Add to basket</button>
                            <Link href="/checkout" className="rounded-full border border-leaf-200 px-7 py-3 font-semibold text-leaf-700 transition hover:bg-leaf-50">Go to checkout</Link>
                        </div>
                        <p className="mt-7 text-xs leading-5 text-muted">Fresh produce is packed close to delivery. If anything isn’t just right, our team will make it right.</p>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
