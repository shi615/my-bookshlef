import { NextRequest, NextResponse } from 'next/server'
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idToken: unknown = body?.idToken

    if (typeof idToken !== 'string' || !idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
    }

    const sessionCookie = await createSessionCookie(idToken)

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 })
  }
}
