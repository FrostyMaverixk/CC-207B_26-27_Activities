import { describe, it, expect, vi, beforeEach } from 'vitest'

// jsdom Blob support: capture the blob that file-saver "saves" via our helper.
vi.mock('file-saver', () => ({ saveAs: vi.fn() }))
import { saveAs } from 'file-saver'
import { downloadCsvExcel, downloadCsvSheets, parseCsvFile } from './csv'

const ROWS = [
  { name: 'José Dela Cruz', note: 'a,b "quoted"', id: 1 },
  { name: 'Maria', note: 'ok', id: 2 },
]

async function savedBlobBytes() {
  const [blob] = saveAs.mock.calls.at(-1)
  return globalThis.readBlobBytes(blob)
}

beforeEach(() => saveAs.mockClear())

describe('csv — dual-flavour export (Excel vs Google Sheets)', () => {
  it('Excel flavour is prefixed with a UTF-8 BOM so Excel reads UTF-8', async () => {
    downloadCsvExcel('x.csv', ROWS)
    const bytes = await savedBlobBytes()
    // EF BB BF == U+FEFF in UTF-8
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  })

  it('Sheets flavour is plain UTF-8 (no BOM)', async () => {
    downloadCsvSheets('x.csv', ROWS)
    const bytes = await savedBlobBytes()
    expect([...bytes.slice(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes)).toContain('José Dela Cruz') // non-ASCII stays intact
  })

  it('uses CRLF line endings (RFC 4180)', async () => {
    downloadCsvSheets('x.csv', ROWS)
    const text = new TextDecoder().decode(await savedBlobBytes())
    expect(text.includes('\r\n')).toBe(true)
  })

  it('quotes fields containing commas or quotes (RFC 4180)', async () => {
    downloadCsvExcel('x.csv', ROWS)
    const text = new TextDecoder().decode(await savedBlobBytes())
    expect(text).toContain('"a,b ""quoted"""')
  })

  it('handles empty rows without throwing', async () => {
    expect(() => downloadCsvSheets('x.csv', null)).not.toThrow()
  })
})

describe('csv — tolerant import (BOM stripping + delimiter guessing)', () => {
  it('parses a comma file with a BOM and trims headers', async () => {
    const file = new File(['\uFEFFname,id\r\nAna,5\r\n'], 's.csv', { type: 'text/csv' })
    const rows = await parseCsvFile(file)
    expect(rows[0]).toMatchObject({ name: 'Ana', id: '5' })
  })

  it('guesses the semicolon delimiter (Excel locale export)', async () => {
    const file = new File(['name;id\r\nJosé;1\r\n'], 's.csv')
    const rows = await parseCsvFile(file)
    expect(rows[0]).toMatchObject({ name: 'José', id: '1' })
  })

  it('guesses the tab delimiter (Sheets TSV export)', async () => {
    const file = new File(['name\tid\r\nBen\t7\r\n'], 's.tsv')
    const rows = await parseCsvFile(file)
    expect(rows[0]).toMatchObject({ name: 'Ben', id: '7' })
  })

  it('skips fully-empty lines', async () => {
    const file = new File(['name,id\r\n\r\nAna,5\r\n'], 's.csv')
    const rows = await parseCsvFile(file)
    expect(rows).toHaveLength(1)
  })
})
