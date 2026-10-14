import type { PageProps as InertiaPageProps } from '@inertiajs/core';

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: 'admin' | 'customer';
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    sort_order?: number;
    is_active?: boolean;
    products_count?: number;
}

export interface Product {
    id: number;
    category_id: number | null;
    category?: Category | null;
    title: string;
    slug: string;
    short_description: string | null;
    description: string | null;
    price: string;
    unit: string;
    stock_quantity: string;
    low_stock_threshold: string;
    is_perishable: boolean;
    featured_image: string | null;
    image_gallery: string[] | null;
    is_featured: boolean;
    is_active: boolean;
    created_at?: string;
}

export interface OrderItem {
    id: number;
    product_id: number | null;
    product_title: string;
    unit: string;
    unit_price: string;
    quantity: string;
    line_total: string;
    product?: Pick<Product, 'slug' | 'featured_image'> | null;
}

export interface Transaction {
    id: number;
    type: 'payment' | 'refund';
    status: 'pending' | 'paid' | 'failed';
    amount: string;
    provider: string | null;
    gateway_reference: string | null;
    processed_at: string | null;
    order?: Pick<Order, 'invoice_number' | 'buyer_name' | 'currency'>;
}

export interface RefundItem {
    id: number;
    order_item_id: number;
    quantity: string;
    amount: string;
    restock: boolean;
    order_item?: Pick<OrderItem, 'product_title' | 'unit' | 'quantity'>;
}

export interface Refund {
    id: number;
    order_id: number;
    amount: string;
    reason: string;
    status: 'pending' | 'processed' | 'rejected';
    gateway_reference: string | null;
    created_at: string;
    order?: Pick<Order, 'invoice_number' | 'buyer_name' | 'buyer_email' | 'currency'>;
    items?: RefundItem[];
}

export interface Order {
    id: number;
    invoice_number: string;
    user_id: number | null;
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string | null;
    delivery_address: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    payment_method: string;
    currency: string;
    subtotal: string;
    total: string;
    customer_note: string | null;
    placed_at: string;
    items: OrderItem[];
    transactions?: Transaction[];
    refunds?: Refund[];
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface FlashMessages {
    success?: string | null;
    error?: string | null;
}

export interface SharedProps extends InertiaPageProps {
    appName: string;
    auth: { user: User | null };
    flash: FlashMessages;
    errors: Record<string, string>;
}

declare module '@inertiajs/core' {
    interface PageProps {
        appName: string;
        auth: { user: User | null };
        flash: FlashMessages;
        errors: Record<string, string>;
    }
}
