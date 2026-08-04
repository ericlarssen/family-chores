import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HID = 'home'

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv

/**
 * Authenticated context for an allowlisted-or-not Google user. The rules read
 * `request.auth.token.email` (lowercased) and require `email_verified`, so we
 * mirror the real Firebase Auth token shape here.
 */
function authed(uid, email, { verified = true } = {}) {
  return testEnv.authenticatedContext(uid, {
    email,
    email_verified: verified,
  })
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-family-chores',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  // Seed the household + allowlist the way the seed script would — with rules
  // bypassed, since no client is ever allowed to write the allowlist.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, `households/${HID}`), {
      name: 'Home',
      timezone: 'America/Chicago',
      weekStartsOn: 'mon',
    })
    await setDoc(doc(db, `households/${HID}/allowlist/admin@example.com`), {
      role: 'admin',
      personId: 'p1',
    })
    await setDoc(doc(db, `households/${HID}/allowlist/adult@example.com`), {
      role: 'adult',
      personId: 'p2',
    })
    await setDoc(doc(db, `households/${HID}/config/current`), {
      version: 1,
      people: [],
    })
  })
})

describe('household reads', () => {
  it('denies a signed-out read', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, `households/${HID}`)))
  })

  it('denies a signed-in but non-allowlisted read', async () => {
    const db = authed('u-stranger', 'stranger@gmail.com').firestore()
    await assertFails(getDoc(doc(db, `households/${HID}`)))
  })

  it('denies an allowlisted account whose email is not verified', async () => {
    const db = authed('u-admin', 'admin@example.com', { verified: false }).firestore()
    await assertFails(getDoc(doc(db, `households/${HID}`)))
  })

  it('allows an allowlisted, verified account to read', async () => {
    const db = authed('u-admin', 'admin@example.com').firestore()
    await assertSucceeds(getDoc(doc(db, `households/${HID}`)))
  })

  it('matches the allowlist case-insensitively on the token email', async () => {
    // Allowlist doc id is lowercase; the token email is mixed case. The rule
    // lowercases the token, so this must still resolve.
    const db = authed('u-admin', 'Admin@Example.com').firestore()
    await assertSucceeds(getDoc(doc(db, `households/${HID}`)))
  })
})

describe('config writes', () => {
  it('allows an admin to write config', async () => {
    const db = authed('u-admin', 'admin@example.com').firestore()
    await assertSucceeds(
      setDoc(doc(db, `households/${HID}/config/current`), { version: 2, people: [] }),
    )
  })

  it('denies a non-admin (adult) writing config', async () => {
    const db = authed('u-adult', 'adult@example.com').firestore()
    await assertFails(
      setDoc(doc(db, `households/${HID}/config/current`), { version: 2, people: [] }),
    )
  })
})

describe('allowlist writes', () => {
  it('denies any client writing the allowlist, even an admin', async () => {
    const db = authed('u-admin', 'admin@example.com').firestore()
    await assertFails(
      setDoc(doc(db, `households/${HID}/allowlist/new@example.com`), {
        role: 'adult',
        personId: 'p3',
      }),
    )
  })
})

describe('members writes', () => {
  it('allows an allowlisted user to write their own member doc', async () => {
    const db = authed('u-admin', 'admin@example.com').firestore()
    await assertSucceeds(
      setDoc(doc(db, `households/${HID}/members/u-admin`), {
        email: 'admin@example.com',
        personId: 'p1',
      }),
    )
  })

  it("denies writing another user's member doc", async () => {
    const db = authed('u-admin', 'admin@example.com').firestore()
    await assertFails(
      setDoc(doc(db, `households/${HID}/members/someone-else`), {
        email: 'admin@example.com',
        personId: 'p1',
      }),
    )
  })
})

describe('weeks writes', () => {
  it('allows an allowlisted user to create and update a week', async () => {
    const db = authed('u-adult', 'adult@example.com').firestore()
    await assertSucceeds(
      setDoc(doc(db, `households/${HID}/weeks/2026-08-03`), {
        configVersion: 1,
        roles: { p1: 'evening', p2: 'morning' },
        ticks: {},
      }),
    )
  })
})
