import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/types';

const secretKey = process.env.SESSION_SECRET || 'default-secret-key-for-development-env';
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
    // This is expected for invalid tokens
    return null;
  }
}

export async function createSession(user: User) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 1 day
  const session = await encrypt({ user, expires });

  cookies().set('session', session, { 
    expires, 
    httpOnly: true,
    path: '/',
  });
}

export async function getSession(): Promise<{ user: User } | null> {
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
