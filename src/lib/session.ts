import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/types';

const secretKey = process.env.SESSION_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // 1 day expiration
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // console.error('JWT verification failed:', error);
    return null;
  }
}

export async function createSession(user: Omit<User, 'id'> & { id: string }) {
  const oneDayInSeconds = 24 * 60 * 60;
  const expires = new Date(Date.now() + oneDayInSeconds * 1000);
  const session = await encrypt({ user, expires });

  // Save the session in a cookie, including maxAge for better compatibility
  cookies().set('session', session, { 
    expires, 
    httpOnly: true,
    maxAge: oneDayInSeconds, // Explicitly set max age in seconds
  });
}

export async function getSession(): Promise<{ user: User } | null> {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  const decrypted = await decrypt(session);
  if (!decrypted) return null;
  return { user: decrypted.user };
}

export async function deleteSession() {
  cookies().delete('session');
}
