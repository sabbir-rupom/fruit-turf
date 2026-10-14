import { Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { useToast, type ToastMessage, type ToastVariant } from '../contexts/ToastContext';

const variants: Record<ToastVariant, { icon: string; style: string }> = {
    success: {
        icon: '✓',
        style: 'border-leaf-100 bg-white text-ink',
    },
    error: {
        icon: '!',
        style: 'border-red-200 bg-white text-red-800',
    },
    info: {
        icon: 'i',
        style: 'border-sky-200 bg-white text-sky-900',
    },
};

export function ToastViewport() {
    const { toasts, dismissToast } = useToast();

    return (
        <div
            aria-label="Notifications"
            aria-live="polite"
            className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
        >
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
        </div>
    );
}

function ToastCard({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
    const variant = toast.variant ?? 'success';

    useEffect(() => {
        if (toast.duration === 0) {
            return;
        }

        const timeout = window.setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);

        return () => window.clearTimeout(timeout);
    }, [onDismiss, toast.duration, toast.id]);

    return (
        <section
            role={variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg shadow-ink/10 animate-[toast-in_180ms_ease-out] ${variants[variant].style}`}
        >
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${variant === 'success' ? 'bg-leaf-100 text-leaf-700' : variant === 'error' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`} aria-hidden="true">
                {variants[variant].icon}
            </span>
            <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-5">{toast.message}</p>
            {toast.action && (
                <Link href={toast.action.href} onClick={() => onDismiss(toast.id)} className="shrink-0 pt-1 text-sm font-bold text-leaf-700 underline underline-offset-2 hover:text-leaf-900">
                    {toast.action.label}
                </Link>
            )}
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="grid size-7 shrink-0 place-items-center rounded-full text-lg leading-none text-muted transition hover:bg-leaf-50 hover:text-ink"
            >
                ×
            </button>
        </section>
    );
}
