import dotenv from 'dotenv';
import { beforeAll } from 'vitest';
import path from 'path';

// Load environment variables from possible .env locations
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../../packages/database/.env'),
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (result.parsed) {
    console.log(`Loaded environment from: ${envPath}`);
    break;
  }
}

// Global test setup
beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not defined. ' +
        'Make sure .env file exists with DATABASE_URL set.',
    );
  }
  console.log('DATABASE_URL is configured for testing');
});
