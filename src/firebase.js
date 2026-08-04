import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
} from 'firebase/firestore'

// The Firebase config object is PUBLIC by design — it's an endpoint identifier,
// not a credential. It is safe to commit. All access control lives in
// firestore.rules. Paste the values from:
//   Firebase console → Project settings → General → Your apps → SDK setup.
//
// TODO(setup): replace these placeholders once the Firebase project exists.
export const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
}

// The single household this app manages. Matches seed/config.json.
export const HOUSEHOLD_ID = 'home'

const app = initializeApp(firebaseConfig)

// Firestore with offline persistence (M7 leans on this; harmless earlier).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
})

export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()

// Local development against the Firestore + Auth emulators. Enable with:
//   VITE_USE_EMULATOR=true npm run dev
// alongside `npm run emulators`.
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
}
