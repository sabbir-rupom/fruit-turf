import { createInertiaApp } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { CartProvider } from './contexts/CartContext';

const pages = import.meta.glob<{ default: ResolvedComponent }>('./Pages/**/*.tsx', {
    eager: true,
});

void createInertiaApp({
    title: (title) => (title ? `${title} · Fruit Turf` : 'Fruit Turf · Fresh, thoughtfully sourced'),
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Inertia page "${name}" was not found.`);
        }

        return page.default;
    },
    setup({ el, App, props }) {
        if (!el) {
            throw new Error('The Inertia root element was not found.');
        }

        createRoot(el).render(
            <CartProvider>
                <App {...props} />
            </CartProvider>,
        );
    },
    progress: { color: '#316b4a' },
});
