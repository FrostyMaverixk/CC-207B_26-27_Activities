import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// With `globals: false`, @testing-library/react cannot auto-register its
// afterEach — do it explicitly so every test starts with a fresh DOM.
afterEach(cleanup)

// jsdom has no matchMedia (used by ThemeContext for the OS preference) and no
// AudioContext (sound effects guard for it at runtime). Padding matchMedia is
// enough to keep components that read it happy in tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom Blob sometimes has no .text()/.arrayBuffer() — expose FileReader
// helpers so a single utility works everywhere.
const readBlob = (blob, readAs) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader[readAs](blob)
  })

/** Raw bytes of a Blob (BOM/encoding-preserving — use for byte-level checks). */
globalThis.readBlobBytes = (blob) => readBlob(blob, 'readAsArrayBuffer').then((ab) => new Uint8Array(ab))

/** UTF-8 text of a Blob (a leading BOM is stripped, per the text spec). */
globalThis.readBlobAsText = (blob) => readBlob(blob, 'readAsText')