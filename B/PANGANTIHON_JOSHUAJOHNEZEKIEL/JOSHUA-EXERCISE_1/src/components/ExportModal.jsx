import Modal from './Modal'
import { FileSpreadsheet } from 'lucide-react'
import { downloadCsvExcel, downloadCsvSheets } from '../utils/csv'

/**
 * Export dialog shared by every table tab. Excel and Google Sheets read
 * UTF-8 CSVs differently (see utils/csv.js), so the user picks the target
 * app and gets the exact flavour that app expects.
 */
export default function ExportModal({ open, onClose, filename, rows, title = 'Export CSV' }) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth={440}>
      {open && (
        <div className="col" style={{ gap: 10 }}>
          <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
            Excel and Google Sheets read UTF-8 CSVs differently — pick the app you will open this
            file in, so names and symbols never turn into gibberish:
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              downloadCsvExcel(filename, rows)
              onClose()
            }}
          >
            <FileSpreadsheet size={15} /> For Microsoft Excel
          </button>
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => {
              downloadCsvSheets(filename, rows)
              onClose()
            }}
          >
            For Google Sheets
          </button>
          <span className="hint muted">
            Excel gets a UTF-8 BOM; the Sheets file is plain UTF-8 (no BOM). Both are
            comma-separated with CRLF line endings.
          </span>
        </div>
      )}
    </Modal>
  )
}
