import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { HOUSEHOLD_ID, db } from '../firebase'

// Live subscription to the household doc — mainly for the timezone, which anchors
// all calendar-day math. Falls back to the device timezone before it loads.
export function useHousehold() {
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, `households/${HOUSEHOLD_ID}`)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setHousehold(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      (err) => {
        console.error('[useHousehold] snapshot error', err)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  const timezone =
    household?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  return { household, timezone, loading }
}
