import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const PROJECT_ID = 'oyaoya-844ea'

async function loadOptions(): Promise<FirebaseOptions> {
  if (import.meta.env.DEV) return { projectId: PROJECT_ID }
  // Firebase Hosting serves the web app config at this reserved URL.
  const res = await fetch('/__/firebase/init.json')
  return res.json()
}

const app = initializeApp(await loadOptions())

export const db = getFirestore(app)

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
