export function StatusBadge({ status }: { status: string }) {
    const style = status === 'paid' || status === 'delivered' || status === 'processed'
        ? 'bg-emerald-50 text-emerald-700'
        : status === 'failed' || status === 'cancelled' || status === 'rejected'
            ? 'bg-red-50 text-red-700'
            : 'bg-amber-50 text-amber-700';

    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>{status.replaceAll('_', ' ')}</span>;
}
