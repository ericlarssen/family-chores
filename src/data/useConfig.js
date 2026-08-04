import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { HOUSEHOLD_ID, db } from '../firebase'

// Live subscription to the household's active config document. The whole app is
// driven by this — task text, people, rotation, anchors — so nothing in the UI
// hardcodes chore content.
export function useConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, `households/${HOUSEHOLD_ID}/config/current`)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setConfig(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      (err) => {
        console.error('[useConfig] snapshot error', err)
        setLoading(false)
      },
    )
    return unsub
  }, [])

  return { config, loading }
}
