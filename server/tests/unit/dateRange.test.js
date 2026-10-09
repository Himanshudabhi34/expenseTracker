import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  zonedTimeToUtc,
  startOfDay,
  startOfMonth,
  addDays,
  monthKey,
  dayKey,
  getZonedParts,
} from '../../src/utils/dateRange.js';

const TZ = 'Asia/Kolkata';

describe('dateRange utils (timezone aware)', () => {
  test('zonedTimeToUtc maps local wall clock to UTC instant', () => {
    const d = zonedTimeToUtc({ year: 2026, month: 1, day: 15, hour: 0 }, TZ);
    // 00:00 IST == 18:30 UTC previous day
    assert.equal(d.toISOString(), '2026-01-14T18:30:00.000Z');
  });

  test('startOfDay returns local midnight', () => {
    const d = startOfDay(new Date('2026-01-15T10:00:00Z'), TZ);
    assert.equal(d.toISOString(), '2026-01-14T18:30:00.000Z');
  });

  test('startOfMonth returns first day local midnight', () => {
    const d = startOfMonth(new Date('2026-01-15T10:00:00Z'), TZ);
    const parts = getZonedParts(d, TZ);
    assert.equal(parts.day, 1);
    assert.equal(parts.month, 1);
  });

  test('addDays handles month boundaries', () => {
    const d = addDays(new Date('2026-01-31T12:00:00Z'), 1, TZ);
    const key = dayKey(d, TZ);
    assert.equal(key, '2026-02-01');
  });

  test('monthKey formats as YYYY-MM', () => {
    assert.equal(monthKey(new Date('2026-07-05T06:00:00Z'), TZ), '2026-07');
  });
});
