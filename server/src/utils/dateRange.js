const partsFormatterCache = new Map();

function partsFormatter(timeZone) {
  if (!partsFormatterCache.has(timeZone)) {
    partsFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }
  return partsFormatterCache.get(timeZone);
}

export function getZonedParts(date, timeZone) {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

export function getTimeZoneOffsetMs(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - date.getTime();
}

export function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

export function startOfDay(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return zonedTimeToUtc({ year: p.year, month: p.month, day: p.day }, timeZone);
}

export function endOfDay(date, timeZone) {
  const start = startOfDay(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function startOfMonth(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return zonedTimeToUtc({ year: p.year, month: p.month, day: 1 }, timeZone);
}

export function endOfMonth(date, timeZone) {
  const nextMonthStart = addMonths(startOfMonth(date, timeZone), 1, timeZone);
  return new Date(nextMonthStart.getTime() - 1);
}

export function addDays(date, days, timeZone) {
  const p = getZonedParts(date, timeZone);
  return zonedTimeToUtc(
    {
      year: p.year,
      month: p.month,
      day: p.day + days,
    },
    timeZone
  );
}

export function addMonths(date, months, timeZone) {
  const p = getZonedParts(date, timeZone);
  const targetMonth = p.month - 1 + months;
  const year = p.year + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  return zonedTimeToUtc({ year, month: month + 1, day: 1 }, timeZone);
}

export function dayKey(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function monthKey(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}

export function monthLabel(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone }).format(
    zonedTimeToUtc({ year: p.year, month: p.month, day: 1 }, timeZone)
  );
}

export function startOfWeek(date, timeZone) {
  const p = getZonedParts(date, timeZone);
  const base = zonedTimeToUtc({ year: p.year, month: p.month, day: p.day }, timeZone);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  return addDays(base, -weekday, timeZone);
}

export function resolveRange({ from, to, period, date, timeZone }) {
  const now = date ? new Date(date) : new Date();
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new Error('Invalid date range');
    }
    return { start: startOfDay(fromDate, timeZone), end: endOfDay(toDate, timeZone) };
  }

  switch (period) {
    case 'today':
      return { start: startOfDay(now, timeZone), end: endOfDay(now, timeZone) };
    case 'week':
      return { start: startOfWeek(now, timeZone), end: endOfDay(now, timeZone) };
    case 'year':
      return {
        start: zonedTimeToUtc(
          { year: getZonedParts(now, timeZone).year, month: 1, day: 1 },
          timeZone
        ),
        end: endOfDay(now, timeZone),
      };
    case 'month':
    default:
      return { start: startOfMonth(now, timeZone), end: endOfDay(now, timeZone) };
  }
}

export default {
  getZonedParts,
  getTimeZoneOffsetMs,
  zonedTimeToUtc,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  dayKey,
  monthKey,
  monthLabel,
  resolveRange,
};
