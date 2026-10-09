import { addDays, getZonedParts, zonedTimeToUtc } from '../../utils/dateRange.js';
import { detectIncomeIntent } from './categorizer.js';

const MONTHS = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const WEEKDAYS = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const PAYMENT_PATTERNS = [
  { method: 'upi', rx: /\b(upi|gpay|google pay|phonepe|paytm|bhim|neft|imps)\b/i },
  { method: 'credit_card', rx: /\b(credit card|credit-card|cc)\b/i },
  { method: 'debit_card', rx: /\b(debit card|debit-card|atm card)\b/i },
  { method: 'bank_transfer', rx: /\b(bank transfer|net banking|netbanking|bank)\b/i },
  { method: 'cash', rx: /\b(cash)\b/i },
  { method: 'other', rx: /\b(card)\b/i },
];

function localNoon(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return zonedTimeToUtc({ year: p.year, month: p.month, day: p.day, hour: 12 }, timeZone);
}

/**
 * Parses a natural-language date expression relative to `now`.
 * @returns {{ date: Date|null, matched: string|null }}
 */
export function parseDate(text, { now = new Date(), timeZone = 'UTC' } = {}) {
  const lower = text.toLowerCase();

  const relative = [
    { rx: /\b(day before yesterday)\b/, days: -2 },
    { rx: /\byesterday\b/, days: -1 },
    { rx: /\btoday\b/, days: 0 },
    { rx: /\b(tonight|this evening|this morning|this afternoon|now)\b/, days: 0 },
    { rx: /\btomorrow\b/, days: 1 },
  ];
  for (const item of relative) {
    const m = lower.match(item.rx);
    if (m) return { date: localNoon(addDays(now, item.days, timeZone), timeZone), matched: m[0] };
  }

  const daysAgo = lower.match(/\b(\d+)\s+days?\s+ago\b/);
  if (daysAgo) {
    return {
      date: localNoon(addDays(now, -Number(daysAgo[1]), timeZone), timeZone),
      matched: daysAgo[0],
    };
  }

  const weeksAgo = lower.match(/\b(\d+)\s+weeks?\s+ago\b/);
  if (weeksAgo) {
    return {
      date: localNoon(addDays(now, -Number(weeksAgo[1]) * 7, timeZone), timeZone),
      matched: weeksAgo[0],
    };
  }

  const lastWeekday = lower.match(
    /\b(?:last|previous)\s+(sun(?:day)?|mon(?:day)?|tue(?:sday|s)?|wed(?:nesday)?|thu(?:rsday|rs)?|fri(?:day)?|sat(?:urday)?)\b/
  );
  if (lastWeekday) {
    const target = WEEKDAYS[lastWeekday[1].slice(0, 3)];
    if (target !== undefined) {
      const p = getZonedParts(now, timeZone);
      const currentDow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
      let diff = currentDow - target;
      if (diff <= 0) diff += 7;
      return { date: localNoon(addDays(now, -diff, timeZone), timeZone), matched: lastWeekday[0] };
    }
  }

  const iso = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    return {
      date: zonedTimeToUtc({ year: +iso[1], month: +iso[2], day: +iso[3], hour: 12 }, timeZone),
      matched: iso[0],
    };
  }

  const dmy = lower.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/);
  if (dmy) {
    const year = dmy[3]
      ? dmy[3].length === 2
        ? 2000 + Number(dmy[3])
        : Number(dmy[3])
      : getZonedParts(now, timeZone).year;
    return {
      date: zonedTimeToUtc({ year, month: +dmy[2], day: +dmy[1], hour: 12 }, timeZone),
      matched: dmy[0],
    };
  }

  const dayMonth = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\b/);
  if (dayMonth && MONTHS[dayMonth[2]]) {
    return {
      date: zonedTimeToUtc(
        {
          year: getZonedParts(now, timeZone).year,
          month: MONTHS[dayMonth[2]],
          day: +dayMonth[1],
          hour: 12,
        },
        timeZone
      ),
      matched: dayMonth[0],
    };
  }

  const monthDay = lower.match(/\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (monthDay && MONTHS[monthDay[1]]) {
    return {
      date: zonedTimeToUtc(
        {
          year: getZonedParts(now, timeZone).year,
          month: MONTHS[monthDay[1]],
          day: +monthDay[2],
          hour: 12,
        },
        timeZone
      ),
      matched: monthDay[0],
    };
  }

  return { date: null, matched: null };
}

/**
 * Parses an amount expression from text.
 * Supports: ₹250, Rs 250, 250 rupees, 1,200, 1.5k, 45k, 2 lakh.
 * @returns {{ amount: number|null, matched: string|null }}
 */
export function parseAmount(text) {
  const source = text.replace(/,/g, '');

  const prefixed = source.match(/(?:₹|rs\.?|inr)\s*([\d.]+)\s*(k|lakh|lac|cr|crore)?/i);
  if (prefixed) {
    return { amount: applyUnit(Number(prefixed[1]), prefixed[2]), matched: prefixed[0].trim() };
  }

  const suffixed = source.match(
    /([\d.]+)\s*(k|lakh|lac|cr|crore)?\s*(?:rupees|rs\.?|inr|bucks|dollars?)/i
  );
  if (suffixed) {
    return { amount: applyUnit(Number(suffixed[1]), suffixed[2]), matched: suffixed[0].trim() };
  }

  const unitOnly = source.match(/([\d.]+)\s*(k|lakh|lac)\b/i);
  if (unitOnly) {
    return { amount: applyUnit(Number(unitOnly[1]), unitOnly[2]), matched: unitOnly[0].trim() };
  }

  const numbers = [...source.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) => ({
    value: Number(m[1]),
    raw: m[0],
    index: m.index,
  }));
  if (numbers.length === 0) return { amount: null, matched: null };

  const plausible = numbers.filter((n) => n.value > 0);
  if (plausible.length === 0) return { amount: null, matched: null };
  const largest = plausible.reduce((a, b) => (b.value > a.value ? b : a));
  return { amount: largest.value, matched: largest.raw };
}

function applyUnit(value, unit) {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u === 'k') return value * 1000;
  if (u === 'lakh' || u === 'lac') return value * 100000;
  if (u === 'cr' || u === 'crore') return value * 10000000;
  return value;
}

export function parsePaymentMethod(text) {
  for (const { method, rx } of PAYMENT_PATTERNS) {
    if (rx.test(text)) return method;
  }
  return 'other';
}

function cleanDescription(text) {
  let out = ` ${text} `;
  out = out.replace(/[₹$€£]/g, ' ');
  out = out.replace(
    /\b(spent|paid|pay|bought|purchased|received|receive|got|earned|earn|added|for|on|of|a|an|the|my|i|me|to|at|in|rs\.?|inr|rupees|cash|upi|gpay|phonepe|paytm|credit card|debit card|bank transfer|card|today|yesterday|tonight|tomorrow|this morning|this evening)\b/gi,
    ' '
  );
  out = out.replace(/\b\d+(?:st|nd|rd|th)?\b/gi, ' ');
  out = out.replace(/\s+/g, ' ').trim();
  if (!out) return 'Expense';
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * Parses a natural-language transaction entry into a structured draft.
 * Never invents values: fields are null when not found.
 */
export function parseExpenseEntry(input, { now = new Date(), timeZone = 'UTC' } = {}) {
  const text = String(input || '').trim();
  const amountResult = parseAmount(text);
  const dateResult = parseDate(text, { now, timeZone });
  const type = detectIncomeIntent(text) ? 'income' : 'expense';
  const paymentMethod = parsePaymentMethod(text);
  const description = cleanDescription(text);

  const missing = [];
  if (amountResult.amount === null) missing.push('amount');
  if (!dateResult.date) missing.push('date');

  return {
    amount: amountResult.amount,
    type,
    date: dateResult.date,
    description,
    paymentMethod,
    matched: {
      amount: amountResult.matched,
      date: dateResult.matched,
    },
    missing,
    raw: input,
  };
}

export default { parseExpenseEntry, parseAmount, parseDate, parsePaymentMethod };
