
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

// The payload can contain user data or other temporary data like OTP
export type SessionPayload = {
  user?: UserForSession;
  otp?: string;
  otpExpiry?: string;
  expires?: Date;
  [key: string]: any; // Allow other properties
};


export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // 1 day expiration
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    // This is expected for invalid tokens
    console.error("JWT decryption failed:", error);
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = payload.user ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date(Date.now() + 10 * 60 * 1000); // User session 1 day, OTP session 10 mins
  const sessionData = { ...payload, expires };
  const session = await encrypt(sessionData);

  cookies().set('session', session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  const decrypted = await decrypt(sessionCookie);
  if (!decrypted) return null;

  // Validate expiration
  if (decrypted.expires && new Date(decrypted.expires) < new Date()) {
    return null;
  }

  return decrypted;
}

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}
