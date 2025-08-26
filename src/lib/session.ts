
'use server';
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/types';

const passphrase = process.env.SESSION_SECRET;
if (!passphrase) {
    throw new Error('SESSION_SECRET environment variable is not set.');
}

const key = new TextEncoder().encode(passphrase);


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
  const expirationTime = payload.user ? '1d' : '10m'; // 1 day for user, 10 mins for OTP
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime) 
    .sign(key);
}

export async function decrypt(input: string | undefined): Promise<SessionPayload | null> {
  if (!input) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    // This is expected for invalid tokens
    console.warn("JWT decryption failed. This can happen with expired or invalid tokens.");
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + (payload.user ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000)); // User session 1 day, OTP session 10 mins
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

  // Validate expiration from the token itself
  if (decrypted.exp && decrypted.exp * 1000 < Date.now()) {
    return null;
  }

  return decrypted;
}

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}
