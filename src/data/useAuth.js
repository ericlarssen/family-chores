import { useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { HOUSEHOLD_ID, auth, db, googleProvider } from '../firebase'

// Auth + allowlist state, collapsed into one status the UI can switch on.
//
//   'loading'    — resolving the current user / their allowlist entry
//   'signed-out' — no Firebase user
//   'not-allowed'— signed in, but no allowlist doc for this email
//   'allowed'    — signed in and allowlisted; `profile` is populated
export function useAuth() {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        setStatus('signed-out')
        return
      }

      setUser(fbUser)
      setStatus('loading')

      const email = (fbUser.email || '').toLowerCase()

      try {
        // The rules only permit reading the allowlist if the caller is already
        // allowlisted, so a successful read is itself the allowlist check.
        const snap = await getDoc(
          doc(db, `households/${HOUSEHOLD_ID}/allowlist/${email}`),
        )

        if (!snap.exists()) {
          setProfile(null)
          setStatus('not-allowed')
          return
        }

        const entry = snap.data()
        setProfile({
          email,
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          role: entry.role,
          personId: entry.personId,
        })
        setStatus('allowed')

        // Record/refresh this device's member doc. Rules allow a user to write
        // only their own members/{uid}. Best-effort — don't block the UI on it.
        setDoc(
          doc(db, `households/${HOUSEHOLD_ID}/members/${fbUser.uid}`),
          {
            email,
            displayName: fbUser.displayName || '',
            photoURL: fbUser.photoURL || '',
            personId: entry.personId,
            lastSeen: serverTimestamp(),
          },
          { merge: true },
        ).catch((err) => {
          console.warn('[auth] failed to write member doc', err)
        })
      } catch (err) {
        // A permission-denied here means "not allowlisted"; surface anything
        // else so a misconfigured project doesn't masquerade as a locked-out
        // account.
        if (err?.code === 'permission-denied') {
          setProfile(null)
          setStatus('not-allowed')
        } else {
          console.error('[auth] allowlist check failed', err)
          setProfile(null)
          setStatus('not-allowed')
        }
      }
    })

    return unsub
  }, [])

  return {
    status,
    user,
    profile,
    signIn: () => signInWithPopup(auth, googleProvider),
    signOut: () => fbSignOut(auth),
  }
}
