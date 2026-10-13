import { describe, it, expect, vi, beforeEach } from 'vitest'

// ids.js imports Firestore at module scope; mock the SDK + our firebase shim
// so the counter logic can be exercised without a backend.
const docMock = vi.fn((_db, ...path) => ({ path }))
const runTransactionMock = vi.fn(async (db, cb) => cb(txFixture))

const txFixture = {
  get: vi.fn(async (_ref) => ({ exists: () => true, data: () => ({ value: 4 }) })),
  set: vi.fn(),
}

vi.mock('firebase/firestore', () => ({
  doc: (...a) => docMock(...a),
  runTransaction: (...a) => runTransactionMock(...a),
  // The gateway imports the whole Firestore surface at module scope.
  collection: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
}))

vi.mock('../firebase', () => ({
  db: { __fake: true },
  getBackupDb: vi.fn(() => null),
  isBackupConfigured: vi.fn(() => false),
}))

import { pad3, normCode, operatorBase, nextSequence } from './ids'

beforeEach(() => {
  vi.clearAllMocks()
  txFixture.get.mockImplementation(async () => ({ exists: () => true, data: () => ({ value: 4 }) }))
  txFixture.set.mockClear()
})

describe('ids — pure helpers', () => {
  it('zero-pads to three digits', () => {
    expect(pad3(1)).toBe('001')
    expect(pad3(42)).toBe('042')
    expect(pad3(999)).toBe('999')
  })

  it('normalizes codes to uppercase alphanumerics', () => {
    expect(normCode('BS Math')).toBe('BSMATH')
    expect(normCode('b.a')).toBe('BA')
    expect(normCode('')).toBe('')
  })

  it('builds operator bases like CASSC-BSMATH2A', () => {
    expect(operatorBase('CASSC', 'BS Math', '2', 'A')).toBe('CASSC-BSMATH2A')
  })
})

describe('ids — sequence counter', () => {
  it('returns the next value and stores the advanced counter', async () => {
    const result = await nextSequence('students')
    expect(result).toBe(5) // current 4 → returns 5
    expect(txFixture.set).toHaveBeenCalledWith(expect.anything(), { value: 5 }, { merge: true })
  })

  it('starts at 1 when the counter document does not exist', async () => {
    txFixture.get.mockImplementation(async () => ({ exists: () => false, data: () => ({}) }))
    await expect(nextSequence('events')).resolves.toBe(1)
  })
})
