import { useCallback, useEffect, useState } from 'react'
import {
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { HOUSEHOLD_ID, db } from '../firebase'
import { rolesForWeek } from '../lib/rotation'
import { cleanerVisitFor } from '../lib/cleaner'
import { encodeTick } from '../lib/ticks'

// Live subscription to one week document, lazy-creating it on first access.
//
// On creation the anchor `roles` and `configVersion` are FROZEN onto the doc, so
// later rotation/config changes never rewrite who did what in a past week. The
// create uses merge:true with a not-exists guard so two devices opening the same
// new week race cleanly instead of one clobbering the other's ticks.
export function useWeek(weekId, config) {
  const [week, setWeek] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!weekId || !config) return
    setLoading(true)
    setWeek(null)

    const ref = doc(db, `households/${HOUSEHOLD_ID}/weeks/${weekId}`)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          // Lazy-create with frozen roles; the listener fires again once written.
          setDoc(
            ref,
            {
              configVersion: config.version,
              roles: rolesForWeek(config, weekId),
              cleanerVisit: cleanerVisitFor(config, weekId) ?? null,
              ticks: {},
              overrides: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          ).catch((err) => {
            console.error('[useWeek] lazy create failed', err)
          })
          return
        }
        setWeek({ id: snap.id, ...snap.data() })
        setLoading(false)
      },
      (err) => {
        console.error('[useWeek] snapshot error', err)
        setLoading(false)
      },
    )
    return unsub
  }, [weekId, config])

  // Toggle a single box. A dot-path updateDoc writes one flat field, so two
  // people ticking different boxes at once merge without a transaction.
  const toggleTick = useCallback(
    (personId, taskId, dayIndex, nextDone) => {
      if (!weekId) return Promise.resolve()
      const ref = doc(db, `households/${HOUSEHOLD_ID}/weeks/${weekId}`)
      const key = encodeTick(personId, taskId, dayIndex)
      return updateDoc(ref, {
        [`ticks.${key}`]: nextDone
          ? { done: true, by: personId, at: serverTimestamp() }
          : deleteField(),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        console.error('[useWeek] toggle failed', err)
      })
    },
    [weekId],
  )

  return { week, loading, toggleTick }
}
