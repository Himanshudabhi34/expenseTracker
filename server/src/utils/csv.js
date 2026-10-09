// Characters that spreadsheet applications interpret as the start of a formula.
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Neutralises spreadsheet formula injection by prefixing dangerous cells with a
 * single quote and always returning a properly CSV-quoted string.
 */
export function escapeCsvCell(value, separator = ',') {
  if (value === null || value === undefined) return '';

  let str = typeof value === 'string' ? value : String(value);

  // Guard against CSV injection.
  if (FORMULA_PREFIXES.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  const needsQuotes =
    str.includes('"') || str.includes(separator) || str.includes('\n') || str.includes('\r');

  if (needsQuotes) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function toCsv(rows, { columns, separator = ',' } = {}) {
  if (!rows || rows.length === 0) {
    const header = columns
      ? columns.map((c) => escapeCsvCell(c.header, separator)).join(separator)
      : '';
    return `${header}\n`;
  }

  const cols = columns || Object.keys(rows[0]).map((key) => ({ key, header: key }));

  const headerLine = cols.map((c) => escapeCsvCell(c.header, separator)).join(separator);
  const bodyLines = rows.map((row) =>
    cols.map((c) => escapeCsvCell(row[c.key], separator)).join(separator)
  );

  return [headerLine, ...bodyLines].join('\n') + '\n';
}

export default { escapeCsvCell, toCsv };
