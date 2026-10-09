export function formatCurrency(value, currency = 'INR') {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

export function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', opts).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function toInputDate(value = new Date()) {
  const d = new Date(value);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function percent(value) {
  return `${Math.round((Number(value) || 0) * 100) / 100}%`;
}

export function titleCase(str = '') {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function paymentMethodLabel(method) {
  const map = {
    cash: 'Cash',
    upi: 'UPI',
    debit_card: 'Debit Card',
    credit_card: 'Credit Card',
    bank_transfer: 'Bank Transfer',
    other: 'Other',
  };
  return map[method] || titleCase(method);
}
