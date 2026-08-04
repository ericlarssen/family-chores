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
export const firebaseConfig = {
  apiKey: 'AIzaSyBdwecxtPhjY1eAwBtIj3lBVdKen69s05g',
  authDomain: 'family-chores-8d9d9.firebaseapp.com',
  projectId: 'family-chores-8d9d9',
  storageBucket: 'family-chores-8d9d9.firebasestorage.app',
  messagingSenderId: '466028459490',
  appId: '1:466028459490:web:5c4ed8dd21c82533b2b5bb',
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
