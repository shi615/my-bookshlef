'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore

function getFirebaseClient() {
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)

    if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
      const host = process.env.NEXT_PUBLIC_EMULATOR_HOST ?? 'localhost'
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
      connectFirestoreEmulator(db, host, 8080)
    }
  }

  return { app, auth, db }
}

export { getFirebaseClient }
