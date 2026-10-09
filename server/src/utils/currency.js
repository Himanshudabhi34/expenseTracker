export function toMinor(major) {
  return Math.round(Number(major) * 100);
}

export function toMajor(minor) {
  return Number(minor) / 100;
}

export function formatMinor(minor, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(toMajor(minor));
  } catch {
    return `${toMajor(minor).toFixed(2)} ${currency}`;
  }
}

export default { toMinor, toMajor, formatMinor };
