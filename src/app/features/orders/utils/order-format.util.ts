export function formatOrderDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parsed));
}

export function formatOrderMoney(amount: number, currency = 'EGP'): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatOrderItemLabel(count: number): string {
  return count === 1 ? '1 item' : `${count} items`;
}
