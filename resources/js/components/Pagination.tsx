import { Link } from '@inertiajs/react';
import type { Paginated } from '../types';

export function Pagination<T>({ data }: { data: Paginated<T> }) {
    if (data.last_page < 2) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-6" aria-label="Pagination">
            {data.links.map((link, index) => {
                const label = link.label.replace('&laquo;', '←').replace('&raquo;', '→');
                return link.url ? (
                    <Link key={`${label}-${index}`} href={link.url} preserveScroll className={`grid min-w-9 place-items-center rounded-lg px-3 py-2 text-sm ${link.active ? 'bg-leaf-600 font-semibold text-white' : 'bg-white text-muted hover:bg-leaf-50'}`}>
                        {label}
                    </Link>
                ) : <span key={`${label}-${index}`} className="px-3 py-2 text-sm text-muted/50">{label}</span>;
            })}
        </nav>
    );
}
