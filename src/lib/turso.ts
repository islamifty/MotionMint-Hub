import 'server-only';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema';

const isTursoConfigured = process.env.KV_TURSO_DATABASE_URL && process.env.KV_TURSO_AUTH_TOKEN;

let db: ReturnType<typeof drizzle>;

if (isTursoConfigured) {
  const turso = createClient({
    url: process.env.KV_TURSO_DATABASE_URL!,
    authToken: process.env.KV_TURSO_AUTH_TOKEN!,
  });
  
  db = drizzle(turso, { schema });
  
  // This function will automatically run migrations on the first connection
  // in a new environment. This avoids race conditions in the setup action.
  const runMigrations = async () => {
    try {
        console.log("Checking for migrations...");
        await migrate(db, { migrationsFolder: 'drizzle' });
        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Error running migrations:", error);
        // We don't want to crash the app if migrations fail, but we log the error.
        // The setup/API check will still work correctly.
    }
  };

  runMigrations();

} else {
  // During build time or if not configured, provide a dummy client.
  // The middleware will handle redirects if the app is run without config.
  console.warn("Turso environment variables not found. Using a dummy database client.");
  const dummyClient = createClient({ url: "file:dummy.db" });
  db = drizzle(dummyClient, { schema });
}

export { db };
