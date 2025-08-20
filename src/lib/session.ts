
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/types';

// Ensure the secret key is at least 32 characters long for HS256
const secretKey = process.env.SESSION_SECRET;
if (!secretKey || secretKey.length < 32) {
    throw new Error('SESSION_SECRET environment variable must be set and be at least 32 characters long.');
}
const key = new TextEncoder().encode(secretKey);

// Define the structure of the session payload, excluding the password
type UserForSession = Omit<User, 'password'>;

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
    // This is expected for invalid tokens
    console.error("JWT decryption failed:", error);
    return null;
  }
}

export async function createSession(user: UserForSession) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 1 day
  const session = await encrypt({ user, expires });

  cookies().set('session', session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<{ user: UserForSession } | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  const decrypted = await decrypt(sessionCookie);
  if (!decrypted) return null;

  // Validate expiration
  if (new Date(decrypted.expires) < new Date()) {
    return null;
  }

  return { user: decrypted.user };
}

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}
