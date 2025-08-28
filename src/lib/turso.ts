import 'server-only';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Check if the required environment variables are set.
const isTursoConfigured = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let db: ReturnType<typeof drizzle>;

if (isTursoConfigured) {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  db = drizzle(turso, { schema });
} else {
  // During build time on Vercel, env vars might not be available.
  // We provide a dummy client to allow the build to pass.
  // The middleware will handle redirects if the app is run without config.
  console.warn("Turso environment variables not found. Using a dummy database client for build process.");
  const dummyClient = createClient({ url: "file:dummy.db", syncUrl: undefined, authToken: undefined });
  db = drizzle(dummyClient, { schema });
}


export { db };
