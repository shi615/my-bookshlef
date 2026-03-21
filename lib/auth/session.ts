import { getAuth } from 'firebase-admin/auth'
import { adminApp } from '@/lib/firebase/admin'
import { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'session'
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000 // 5 days

/**
 * Create a long-lived session cookie from a short-lived Firebase ID token.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  return getAuth(adminApp()).createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  })
}

/**
 * Verify the session cookie from the incoming request.
 * Returns the decoded token on success, null on failure.
 */
export async function verifySessionCookie(
  request: NextRequest
): Promise<{ uid: string } | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null
  return verifySessionCookieValue(sessionCookie)
}

/**
 * Verify a session cookie value directly (for use in Server Components).
 */
export async function verifySessionCookieValue(
  cookieValue: string
): Promise<{ uid: string } | null> {
  try {
    const checkRevoked = process.env.NODE_ENV === 'production'
    const decoded = await getAuth(adminApp()).verifySessionCookie(cookieValue, checkRevoked)
    return { uid: decoded.uid }
  } catch {
    return null
  }
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS }
