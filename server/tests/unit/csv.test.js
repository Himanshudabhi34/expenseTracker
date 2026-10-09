import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell, toCsv } from '../../src/utils/csv.js';

describe('csv utils', () => {
  test('neutralises formula injection prefixes', () => {
    assert.equal(escapeCsvCell('=1+1'), "'=1+1");
    assert.equal(escapeCsvCell('+SUM(A1)'), "'+SUM(A1)");
    assert.equal(escapeCsvCell('-2+3'), "'-2+3");
    assert.equal(escapeCsvCell('@cmd'), "'@cmd");
  });

  test('quotes values containing separators or quotes', () => {
    assert.equal(escapeCsvCell('a,b'), '"a,b"');
    assert.equal(escapeCsvCell('he said "hi"'), '"he said ""hi"""');
  });

  test('builds a csv with headers and rows', () => {
    const csv = toCsv([{ a: 1, b: 'x' }], {
      columns: [
        { key: 'a', header: 'A' },
        { key: 'b', header: 'B' },
      ],
    });
    assert.equal(csv, 'A,B\n1,x\n');
  });

  test('handles empty rows with header only', () => {
    const csv = toCsv([], { columns: [{ key: 'a', header: 'A' }] });
    assert.equal(csv, 'A\n');
  });
});
