import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
    variant?: ToastVariant;
    action?: {
        label: string;
        href: string;
    };
    duration?: number;
}

export interface ToastMessage extends ToastOptions {
    id: number;
    message: string;
}

interface ToastContextValue {
    toasts: ToastMessage[];
    showToast: (message: string, options?: ToastOptions) => void;
    dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const nextId = useRef(0);

    const dismissToast = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, options: ToastOptions = {}) => {
        const id = ++nextId.current;
        setToasts((current) => [
            ...current,
            { id, message, variant: 'success', duration: 4000, ...options },
        ]);
    }, []);

    const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider.');
    }

    return context;
}
