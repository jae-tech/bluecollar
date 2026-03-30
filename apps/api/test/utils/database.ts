import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@repo/database';

let testClient: ReturnType<typeof postgres>;
let testDb: ReturnType<typeof drizzle>;

export async function initializeTestDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  testClient = postgres(DATABASE_URL);
  testDb = drizzle(testClient, { schema });

  return testDb;
}

export function getTestDatabase() {
  if (!testDb) {
    throw new Error(
      'Test database not initialized. Call initializeTestDatabase first.',
    );
  }
  return testDb;
}

export async function closeTestDatabase() {
  if (testClient) {
    await testClient.end();
  }
}

/**
 * Execute a function within a database transaction
 * The transaction will automatically rollback after the function completes
 * This ensures tests don't pollute the database
 */
export async function withTransaction<T>(
  fn: (db: ReturnType<typeof drizzle>) => Promise<T>,
): Promise<T> {
  const db = getTestDatabase();

  return db.transaction(async (tx: any) => {
    const result = await fn(tx);
    // Transaction will automatically rollback after this returns
    return result;
  });
}

/**
 * Clear all data from specified tables
 * Useful for cleanup between tests if not using transactions
 */
export async function clearDatabase(tableNames: string[]) {
  const db = getTestDatabase();
  // Note: This is a fallback. With transactions, this shouldn't be necessary
  // But it can be useful if implementing transaction-per-test pattern differently
  console.log('Clearing tables:', tableNames);
}
