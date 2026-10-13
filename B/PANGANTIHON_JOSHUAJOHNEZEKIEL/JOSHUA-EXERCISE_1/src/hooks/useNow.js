import { useEffect, useState } from 'react'

/**
 * Returns a `now` timestamp that ticks every `intervalMs` (default 30s).
 *
 * Use it to derive wall-clock-driven values (like "past the event end time")
 * so they update while the page stays open, instead of being frozen at the
 * first render. Keeps Date.now() out of the render body.
 */
export default function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(iv)
  }, [intervalMs])
  return now
}
