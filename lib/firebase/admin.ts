import { getApps, initializeApp, cert, App } from 'firebase-admin/app'

function getAdminApp(): App {
  const existingApps = getApps()
  if (existingApps.length > 0) {
    return existingApps[0]
  }

  // In test/emulator environment the Admin SDK uses GOOGLE_CLOUD_PROJECT
  // and connects automatically via FIRESTORE_EMULATOR_HOST env var.
  if (
    process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' ||
    process.env.FIRESTORE_EMULATOR_HOST
  ) {
    return initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT ?? 'my-bookshelf-prod' })
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.GOOGLE_CLOUD_PROJECT

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_ADMIN_CLIENT_EMAIL, ' +
        'FIREBASE_ADMIN_PRIVATE_KEY, and GOOGLE_CLOUD_PROJECT.'
    )
  }

  return initializeApp({
    credential: cert({ clientEmail, privateKey, projectId }),
    projectId,
  })
}

// Export the function for lazy initialization — do NOT call at module level
// so that `next build` does not trigger credential checks at build time.
export { getAdminApp as adminApp }
export default getAdminApp
