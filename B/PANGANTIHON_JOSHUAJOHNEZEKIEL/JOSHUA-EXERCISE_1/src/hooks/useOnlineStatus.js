import { useEffect, useState } from 'react'

/**
 * Live online/offline status, kept in sync with the browser (and the
 * `online`/`offline` events) so the UI can show a graceful-degradation banner
 * when writes may not reach Firestore.
 */
export default function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
