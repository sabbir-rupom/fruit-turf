import { Link, router } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { Pagination } from '../../components/Pagination';
import { useCart } from '../../contexts/CartContext';
import { imageUrl, money } from '../../lib/format';
import type { Category, Paginated, Product } from '../../types';

interface Props {
    products: Paginated<Product>;
    categories: Category[];
    filters: { search: string; category: string; sort: string };
}

export default function ShopIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const { add } = useCart();

    function applySearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get('/', { ...filters, search }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout>
            <main>
                <section className="mx-auto max-w-7xl px-5 pb-14 pt-9 lg:px-8 lg:pt-14">
                    <div className="grid overflow-hidden rounded-[2rem] bg-leaf-100 lg:grid-cols-[1.05fr_.95fr]">
                        <div className="flex flex-col justify-center px-7 py-10 sm:px-12 lg:py-16">
                            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-leaf-700">
                                <span className="size-2 rounded-full bg-leaf-500" /> Harvested for you
                            </span>
                            <h1 className="max-w-xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">A little more <span className="text-leaf-600">fresh</span> in every day.</h1>
                            <p className="mt-5 max-w-lg text-base leading-7 text-muted">Beautiful fruit, picked at its best and brought straight from trusted growers to your table.</p>
                            <a href="#shop" className="mt-7 inline-flex w-fit items-center gap-3 rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-leaf-700">Explore the harvest <span aria-hidden="true">↗</span></a>
                        </div>
                        <div className="relative min-h-64 bg-[#e2efdf] lg:min-h-[390px]">
                            <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1400&q=88" alt="Colorful fresh fruit on a table" className="absolute inset-0 size-full object-cover" />
                            <div className="absolute bottom-5 left-5 rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted">The good stuff</p>
                                <p className="mt-1 font-display text-xl">Fresh. Local. Thoughtful.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="shop" className="mx-auto max-w-7xl scroll-mt-8 px-5 lg:px-8">
                    <div className="flex flex-col justify-between gap-5 border-b border-leaf-100 pb-6 md:flex-row md:items-end">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.2em] text-leaf-600">From the orchard</p>
                            <h2 className="mt-2 font-display text-4xl">Shop the harvest</h2>
                        </div>
                        <form onSubmit={applySearch} className="flex gap-2">
                            <label htmlFor="product-search" className="sr-only">Search fruits</label>
                            <input id="product-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your favorite fruit" className="w-full rounded-full border border-leaf-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-leaf-500 sm:w-64" />
                            <button className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700">Search</button>
                        </form>
                    </div>

                    <div className="flex flex-wrap gap-2 py-5">
                        <Link href="/" preserveState className={`rounded-full px-4 py-2 text-sm font-semibold ${filters.category ? 'bg-white text-muted' : 'bg-leaf-600 text-white'}`}>Everything</Link>
                        {categories.map((category) => <Link key={category.id} href={`/?category=${category.slug}`} preserveState className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filters.category === category.slug ? 'bg-leaf-600 text-white' : 'bg-white text-muted hover:bg-leaf-50'}`}>{category.name}</Link>)}
                        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
                            Sort
                            <select value={filters.sort} onChange={(event) => router.get('/', { ...filters, sort: event.target.value }, { preserveState: true, replace: true })} className="rounded-full border border-leaf-100 bg-white px-3 py-2 text-ink outline-none">
                                <option value="featured">Featured</option>
                                <option value="price_asc">Price: low to high</option>
                                <option value="price_desc">Price: high to low</option>
                                <option value="name">Name</option>
                            </select>
                        </label>
                    </div>

                    {products.data.length ? (
                        <>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((product) => {
                                    const photo = imageUrl(product.featured_image);
                                    return (
                                        <article key={product.id} className="group overflow-hidden rounded-3xl border border-leaf-100/70 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-leaf-700/5">
                                            <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-leaf-50">
                                                {photo && <img src={photo} alt={product.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
                                                {product.is_featured && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-leaf-700">Grower favorite</span>}
                                                {Number(product.stock_quantity) <= Number(product.low_stock_threshold) && <span className="absolute bottom-3 left-3 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-800">Limited harvest</span>}
                                            </Link>
                                            <div className="p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-semibold uppercase tracking-widest text-leaf-600">{product.category?.name ?? 'Fresh pick'}</p>
                                                    <span className="text-xs text-muted">{product.unit}</span>
                                                </div>
                                                <Link href={`/products/${product.slug}`} className="mt-1 block font-display text-2xl hover:text-leaf-700">{product.title}</Link>
                                                <p className="mt-1 min-h-10 text-sm leading-5 text-muted">{product.short_description}</p>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <p className="font-semibold">{money(product.price)}<span className="ml-1 text-xs font-normal text-muted">/{product.unit.replace('per ', '')}</span></p>
                                                    <button onClick={() => add(product)} disabled={Number(product.stock_quantity) <= 0} className="grid size-10 place-items-center rounded-full bg-leaf-50 text-xl font-medium text-leaf-700 transition hover:bg-leaf-600 hover:text-white" aria-label={`Add ${product.title} to basket`}>+</button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            <Pagination data={products} />
                        </>
                    ) : (
                        <div className="rounded-3xl bg-white px-6 py-16 text-center">
                            <p className="font-display text-2xl">Nothing in this patch just yet.</p>
                            <p className="mt-2 text-sm text-muted">Try another search or browse all fresh picks.</p>
                            <Link href="/" className="mt-5 inline-flex rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white">Clear filters</Link>
                        </div>
                    )}
                </section>

                <section id="our-promise" className="mx-auto mt-20 max-w-7xl px-5 lg:px-8">
                    <div className="grid gap-4 rounded-[2rem] bg-ink p-7 text-white sm:grid-cols-3 sm:p-10">
                        {[
                            ['01', 'Picked at the right moment', 'We choose fruit for its flavor, not how far it can travel.'],
                            ['02', 'A shorter trip to your table', 'Thoughtful sourcing keeps our produce fresh and our footprint lighter.'],
                            ['03', 'Care in every delivery', 'Your basket is packed by hand and handled like it matters.'],
                        ].map(([number, title, description]) => <div key={number} className="rounded-2xl border border-white/10 p-5"><span className="font-display text-3xl text-leaf-100/60">{number}</span><h3 className="mt-4 font-display text-xl">{title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{description}</p></div>)}
                    </div>
                </section>
            </main>
        </AppLayout>
    );
}
