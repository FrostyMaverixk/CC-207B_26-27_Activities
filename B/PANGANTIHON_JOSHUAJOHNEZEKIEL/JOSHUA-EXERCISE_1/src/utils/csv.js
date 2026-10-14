import Papa from 'papaparse'
import { saveAs } from 'file-saver'

/**
 * CSV downloads that open correctly in BOTH Microsoft Excel and Google Sheets.
 *
 * The two apps disagree on UTF-8 CSVs:
 *  - Excel needs a UTF-8 BOM, otherwise it assumes ANSI and shows mojibake
 *    for non-ASCII characters (é, ñ, ·, …).
 *  - Google Sheets can misread BOM'd files on some import paths and shows the
 *    BOM itself as "ï»¿" before the first header (plus mojibake).
 *
 * So we ship two flavours and the export UI lets the user pick the target app.
 * Both use comma separators and CRLF line endings (RFC 4180).
 */
export function downloadCsvExcel(filename, rows) {
  const csv = Papa.unparse(rows ?? [], { delimiter: ',', newline: '\r\n' })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

export function downloadCsvSheets(filename, rows) {
  const csv = Papa.unparse(rows ?? [], { delimiter: ',', newline: '\r\n' })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

/** Back-compatible alias — Excel flavour (UTF-8 BOM). */
export const downloadCsv = downloadCsvExcel

/**
 * Parse a CSV/TSV file into an array of row objects.
 * Accepts exports from Excel AND Google Sheets: the UTF-8 BOM is stripped
 * from headers, the delimiter is auto-detected (comma / tab / semicolon /
 * pipe), and fully-empty rows are skipped.
 */
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      delimitersToGuess: [',', '\t', ';', '|'],
      transformHeader: (h) => h.replace(/^\uFEFF/, '').trim(),
      complete: (res) => resolve(res.data),
      error: (err) => reject(err),
    })
  })
}
