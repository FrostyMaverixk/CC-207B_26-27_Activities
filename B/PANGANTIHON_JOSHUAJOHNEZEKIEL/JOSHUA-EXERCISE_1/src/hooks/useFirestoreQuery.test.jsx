import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// useFirestoreQuery subscribes via the gateway's onSnapshot; mock the gateway
// (and its Firebase underpinnings) so we can emit snapshots deterministically.
// Delivery is queued on a microtask so the transient `loading === true` paint
// is observable before data arrives.
const onSnapshotMock = vi.fn(() => vi.fn()) // returns an unsubscribe fn
const mutationHandlers = new Set()
const fireMutation = (evt) => mutationHandlers.forEach((fn) => fn(evt))

vi.mock('firebase/firestore', () => ({
  onSnapshot: (...a) => onSnapshotMock(...a),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  runTransaction: vi.fn(),
}))

vi.mock('../firebase', () => ({
  db: { __fake: true },
  getBackupDb: vi.fn(() => null),
  isBackupConfigured: vi.fn(() => false),
}))

vi.mock('../utils/firestoreGateway', () => ({
  onSnapshot: (...a) => onSnapshotMock(...a),
  onMutation: (cb) => {
    mutationHandlers.add(cb)
    return () => mutationHandlers.delete(cb)
  },
}))

import useFirestoreQuery, { clearQueryCache } from './useFirestoreQuery'

function makeCollectionSnapshot(docs) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d })) }
}

function makeDocSnapshot(exists, data) {
  return { exists: () => exists, id: 'doc-1', data: () => data }
}

/** Wrap a mock so it delivers the next()/onErr() callback on a later tick. */
function deliverAsync(...args) {
  return (_ref, next, onErr) => {
    const [snap, error] = args
    setTimeout(() => {
      if (error) onErr(error)
      else next(snap)
    }, 0)
    return vi.fn()
  }
}

beforeEach(() => {
  onSnapshotMock.mockClear()
  clearQueryCache()
  // The hook logs subscription errors via console.error; suppress so Vitest
  // doesn't flag expected error-path logs as unhandled exceptions.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

describe('useFirestoreQuery', () => {
  it('starts loading and resolves with mapped documents', async () => {
    onSnapshotMock.mockImplementation(
      deliverAsync(makeCollectionSnapshot([{ id: 'a', name: 'Ana' }])),
    )

    // Keep a STABLE reference identity across re-renders (the hook maps data
    // back to the exact reference it subscribed to — like useMemo does in app).
    const ref = { kind: 'collection' }
    const { result } = renderHook(() => useFirestoreQuery(ref))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'a', name: 'Ana' }])
    expect(result.current.error).toBeNull()
  })

  it('turns a document snapshot into a single-element array', async () => {
    onSnapshotMock.mockImplementation(deliverAsync(makeDocSnapshot(true, { name: 'Doc' })))
    const ref = { kind: 'doc' }
    const { result } = renderHook(() => useFirestoreQuery(ref))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([{ id: 'doc-1', name: 'Doc' }])
  })

  it('reports a missing document as empty data (not an error)', async () => {
    onSnapshotMock.mockImplementation(deliverAsync(makeDocSnapshot(false, null)))
    const ref = { kind: 'doc' }
    const { result } = renderHook(() => useFirestoreQuery(ref))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces subscription errors', async () => {
    onSnapshotMock.mockImplementation(deliverAsync(null, new Error('boom')))
    const ref = { kind: 'collection' }
    const { result } = renderHook(() => useFirestoreQuery(ref))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error?.message).toBe('boom')
    expect(result.current.data).toEqual([])
  })

  it('subscribes to nothing (idle) when the reference is null', () => {
    const { result } = renderHook(() => useFirestoreQuery(null))
    expect(onSnapshotMock).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual([])
  })

  it('unsubscribes on unmount', () => {
    const unsub = vi.fn()
    onSnapshotMock.mockReturnValue(unsub)
    const ref = { kind: 'collection' }
    const { unmount } = renderHook(() => useFirestoreQuery(ref))
    unmount()
    expect(unsub).toHaveBeenCalled()
  })

  it('re-subscribes when the reference identity changes', async () => {
    onSnapshotMock
      .mockImplementationOnce(
        (_ref, next) => {
          setTimeout(() => next(makeCollectionSnapshot([])), 0)
          return vi.fn()
        },
      )
      .mockImplementationOnce(
        (_ref, next) => {
          setTimeout(() => next(makeCollectionSnapshot([{ id: 'b', name: 'Ben' }])), 0)
          return vi.fn()
        },
      )

    const refA = { kind: 'a' }
    const refB = { kind: 'b' }
    const { result, rerender } = renderHook(({ ref }) => useFirestoreQuery(ref), {
      initialProps: { ref: refA },
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    rerender({ ref: refB })
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'b', name: 'Ben' }]))
  })

  it('serves a fresh cache hit without subscribing — zero reads this mount', async () => {
    onSnapshotMock.mockImplementation(deliverAsync(makeCollectionSnapshot([{ id: 'a', name: 'Ana' }])))
    const ref = { kind: 'collection' }
    const first = renderHook(() => useFirestoreQuery(ref, 'students:cache-test'))
    await waitFor(() => expect(first.result.current.loading).toBe(false))
    expect(onSnapshotMock).toHaveBeenCalledTimes(1)
    first.unmount()

    // Second mount inside the TTL → paints from cache, subscribes to nothing.
    onSnapshotMock.mockClear()
    const second = renderHook(() => useFirestoreQuery(ref, 'students:cache-test'))
    expect(second.result.current.loading).toBe(false)
    expect(second.result.current.data).toEqual([{ id: 'a', name: 'Ana' }])
    await new Promise((r) => setTimeout(r, 20))
    expect(onSnapshotMock).not.toHaveBeenCalled()
    second.unmount()
  })

  it('wakes a cache-only hook when its collection is mutated', async () => {
    onSnapshotMock.mockImplementation(deliverAsync(makeCollectionSnapshot([{ id: 'a', name: 'Ana' }])))
    const ref = { kind: 'collection' }
    const first = renderHook(() => useFirestoreQuery(ref, 'students:wake-test'))
    await waitFor(() => expect(first.result.current.data).toEqual([{ id: 'a', name: 'Ana' }]))
    first.unmount()

    const second = renderHook(() => useFirestoreQuery(ref, 'students:wake-test'))
    expect(second.result.current.data).toEqual([{ id: 'a', name: 'Ana' }])
    expect(onSnapshotMock).toHaveBeenCalledTimes(1)

    // A write lands on the same collection → the hook goes live and refreshes.
    onSnapshotMock.mockClear()
    onSnapshotMock.mockImplementation(deliverAsync(makeCollectionSnapshot([{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Ben' }])))
    fireMutation({ type: 'set', collection: 'students' })
    await waitFor(() => expect(second.result.current.data).toEqual([{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Ben' }]))
    second.unmount()
  })
})
