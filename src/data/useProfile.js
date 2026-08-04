import { useCallback, useState } from 'react'

// The active kiosk selection, persisted so the fridge tablet reopens where it
// was left. Value is a personId, the sentinel 'overview', or null (show the
// picker). This is device-local, not per-account — a shared tablet stays signed
// in as a parent while the family taps between profiles.
const KEY = 'family-chores:selection'

export function useProfile() {
  const [selection, setSelection] = useState(() => {
    try {
      return localStorage.getItem(KEY) || null
    } catch {
      return null
    }
  })

  const select = useCallback((value) => {
    try {
      if (value) localStorage.setItem(KEY, value)
      else localStorage.removeItem(KEY)
    } catch {
      // Private mode / storage disabled — fall back to in-memory only.
    }
    setSelection(value || null)
  }, [])

  return { selection, select }
}
