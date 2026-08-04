// Idempotent seed for the family-chores Firestore project.
//
// Writes, from seed/config.json:
//   households/home                       (household fields)
//   households/home/allowlist/{email}     (one per allowlist entry, id lowercased)
//   households/home/config/current        (the live config)
//   households/home/configVersions/{n}    (immutable snapshot of that config)
//
// Re-running overwrites cleanly and never duplicates. `createdAt` on the
// household is preserved across runs so a re-seed is a true no-op on data.
//
// Auth: uses the Firebase Admin SDK, which bypasses security rules. It needs
// a service account key — the one real secret in this project:
//   Firebase console → Project settings → Service accounts → Generate new
//   private key → save as seed/serviceAccount.json (gitignored).
// Alternatively set GOOGLE_APPLICATION_CREDENTIALS to a key path.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HID = 'home'

function loadConfig() {
  const raw = readFileSync(resolve(__dirname, 'config.json'), 'utf8')
  return JSON.parse(raw)
}

function initAdmin() {
  const keyPath = resolve(__dirname, 'serviceAccount.json')
  try {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
    return initializeApp({ credential: cert(serviceAccount) })
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(
        '\nMissing seed/serviceAccount.json.\n' +
          'Firebase console → Project settings → Service accounts → ' +
          'Generate new private key, save it as seed/serviceAccount.json, ' +
          'then re-run `npm run seed`.\n',
      )
      process.exit(1)
    }
    throw err
  }
}

async function seed() {
  const config = loadConfig()
  initAdmin()
  const db = getFirestore()

  const householdRef = db.doc(`households/${HID}`)

  // Preserve createdAt if the household already exists, so re-seeds don't churn.
  const existing = await householdRef.get()
  const createdAt = existing.exists
    ? existing.data().createdAt
    : FieldValue.serverTimestamp()

  const batch = db.batch()

  batch.set(householdRef, {
    name: config.household.name,
    timezone: config.household.timezone,
    weekStartsOn: config.household.weekStartsOn,
    createdAt,
  })

  // Allowlist — the one thing the client can never write. Ids are lowercased
  // to match the rules, which lowercase the caller's token email.
  for (const entry of config.allowlist) {
    const email = entry.email.toLowerCase()
    batch.set(householdRef.collection('allowlist').doc(email), {
      role: entry.role,
      personId: entry.personId,
    })
  }

  // The live config document + an immutable snapshot at this version.
  const configDoc = {
    version: config.version,
    people: config.people,
    rotation: config.rotation,
    anchors: config.anchors,
    childTasks: config.childTasks,
    cleaner: config.cleaner,
  }
  batch.set(householdRef.collection('config').doc('current'), configDoc)
  batch.set(
    householdRef.collection('configVersions').doc(String(config.version)),
    { ...configDoc, snapshotAt: FieldValue.serverTimestamp() },
  )

  await batch.commit()

  console.log(`Seeded household "${config.household.name}" (${HID}):`)
  console.log(`  • config/current  → version ${config.version}`)
  console.log(`  • configVersions/${config.version}`)
  console.log(`  • allowlist (${config.allowlist.length}):`)
  for (const entry of config.allowlist) {
    console.log(
      `      - ${entry.email.toLowerCase()}  ${entry.role} (${entry.personId})`,
    )
  }
  console.log('\nDone. Re-running changes nothing.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
