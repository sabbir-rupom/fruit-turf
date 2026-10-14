export function money(value: string | number, currency = 'BDT'): string {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(Number(value));
}

export function imageUrl(path: string | null): string | null {
    if (!path) {
        return null;
    }

    return /^https?:\/\//i.test(path) ? path : `/storage/${path.replace(/^\/+/, '')}`;
}

export function dateLabel(value: string): string {
    return new Intl.DateTimeFormat('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
