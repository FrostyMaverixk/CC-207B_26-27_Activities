import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import { ToastProvider, ToastContext } from './ToastContext'

function Probe({ onReady }) {
  const ctx = useContext(ToastContext)
  return (
    <div>
      <button type="button" onClick={() => ctx.toast.success('Saved', 'All good')}>
        push
      </button>
      <button
        type="button"
        onClick={async () => {
          const ok = await ctx.confirm({ title: 'Sure?', confirmLabel: 'Yes' })
          onReady(ok)
        }}
      >
        ask
      </button>
    </div>
  )
}

describe('ToastContext', () => {
  it('pushes and auto-cap shows a toast with an aria-live region', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('push'))
    expect(screen.getByText('Saved')).toBeInTheDocument()
    // The toast stack is the polite live region that announces feedback.
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull()
  })

  it('dismisses a toast via its close button', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('push'))
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('resolves a confirm as true when confirmed', async () => {
    const onReady = vi.fn()
    render(
      <ToastProvider>
        <Probe onReady={onReady} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('ask'))
    fireEvent.click(screen.getByText('Yes'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true))
  })

  it('resolves a confirm as false when cancelled', async () => {
    const onReady = vi.fn()
    render(
      <ToastProvider>
        <Probe onReady={onReady} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByText('ask'))
    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(false))
  })
})
