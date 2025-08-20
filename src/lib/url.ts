import 'server-only'
import { headers } from 'next/headers'
 
export function getBaseUrl() {
  // 1. Try to get the host from Vercel's system environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
 
  // 2. Try to get the host from the request headers
  const headersList = headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  if (host) {
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    return `${protocol}://${host}`;
  }
 
  // 3. Fallback for local development or other environments
  return 'http://localhost:9002';
}
