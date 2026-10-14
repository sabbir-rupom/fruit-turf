import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types';

export interface CartLine {
    product: Product;
    quantity: number;
}

interface CartContextValue {
    lines: CartLine[];
    count: number;
    subtotal: number;
    ready: boolean;
    add: (product: Product, quantity?: number) => void;
    setQuantity: (productId: number, quantity: number) => void;
    remove: (productId: number) => void;
    clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'fruit-turf-cart';

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isCartLine(value: unknown): value is CartLine {
    if (!isRecord(value) || !isRecord(value.product)) {
        return false;
    }

    const product = value.product;
    return typeof value.quantity === 'number'
        && value.quantity > 0
        && typeof product.id === 'number'
        && typeof product.title === 'string'
        && typeof product.slug === 'string'
        && typeof product.price === 'string'
        && typeof product.unit === 'string'
        && typeof product.stock_quantity === 'string'
        && (product.featured_image === null || typeof product.featured_image === 'string')
        && typeof product.is_featured === 'boolean'
        && typeof product.is_active === 'boolean';
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [lines, setLines] = useState<CartLine[]>([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed: unknown = JSON.parse(stored);
                setLines(Array.isArray(parsed) ? parsed.filter(isCartLine) : []);
            } catch (error) {
                if (!(error instanceof SyntaxError)) {
                    throw error;
                }

                window.localStorage.removeItem(STORAGE_KEY);
                console.warn('Discarded invalid saved Fruit Turf basket data.', error);
            }
        }
        setReady(true);
    }, []);

    useEffect(() => {
        if (ready) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        }
    }, [lines, ready]);

    const value = useMemo<CartContextValue>(() => ({
        lines,
        ready,
        count: lines.reduce((count, line) => count + line.quantity, 0),
        subtotal: lines.reduce((total, line) => total + Number(line.product.price) * line.quantity, 0),
        add(product, quantity = 1) {
            setLines((current) => {
                const existing = current.find((line) => line.product.id === product.id);
                return existing
                    ? current.map((line) => line.product.id === product.id
                        ? { ...line, quantity: Math.min(line.quantity + quantity, Number(product.stock_quantity)) }
                        : line)
                    : [...current, { product, quantity: Math.min(quantity, Number(product.stock_quantity)) }];
            });
        },
        setQuantity(productId, quantity) {
            setLines((current) => current.flatMap((line) => {
                if (line.product.id !== productId) {
                    return [line];
                }

                const capped = Math.min(quantity, Number(line.product.stock_quantity));
                return capped > 0 ? [{ ...line, quantity: capped }] : [];
            }));
        },
        remove(productId) {
            setLines((current) => current.filter((line) => line.product.id !== productId));
        },
        clear() {
            setLines([]);
        },
    }), [lines, ready]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider.');
    }

    return context;
}
