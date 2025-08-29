import 'server-only';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

let db: ReturnType<typeof drizzle>;

const turso = createClient({
    url: process.env.KV_TURSO_DATABASE_URL!,
    authToken: process.env.KV_TURSO_AUTH_TOKEN!,
});
  
db = drizzle(turso, { schema });

export { db };
