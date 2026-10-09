import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toMinor, toMajor, formatMinor } from '../../src/utils/currency.js';
import { getPagination, buildPaginatedResult } from '../../src/utils/pagination.js';

describe('currency utils', () => {
  test('converts major to minor units as integers', () => {
    assert.equal(toMinor(150), 15000);
    assert.equal(toMinor(150.5), 15050);
    assert.equal(toMinor(0.01), 1);
    assert.ok(Number.isInteger(toMinor(19.99)));
  });

  test('converts minor back to major', () => {
    assert.equal(toMajor(15000), 150);
    assert.equal(toMajor(1), 0.01);
  });

  test('formats minor units as currency', () => {
    assert.match(formatMinor(15000, 'INR'), /150/);
  });
});

describe('pagination utils', () => {
  test('defaults to page 1 with limit 20', () => {
    assert.deepEqual(getPagination({}), { page: 1, limit: 20, skip: 0 });
  });

  test('caps limit at 100', () => {
    assert.equal(getPagination({ limit: 1000 }).limit, 100);
  });

  test('computes skip correctly', () => {
    assert.equal(getPagination({ page: 3, limit: 20 }).skip, 40);
  });

  test('builds paginated result metadata', () => {
    const result = buildPaginatedResult({ items: [1, 2], total: 45, page: 2, limit: 20 });
    assert.equal(result.pagination.totalPages, 3);
    assert.equal(result.pagination.hasNextPage, true);
    assert.equal(result.pagination.hasPrevPage, true);
  });
});
