import dotenv from 'dotenv';
import { beforeAll } from 'vitest';
import path from 'path';

// 테스트 환경변수 로드 — NODE_ENV 기반으로 .env.test 우선 로드
const nodeEnv = process.env.NODE_ENV ?? 'test';
const envSpecificPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
const envSpecificResult = dotenv.config({ path: envSpecificPath });
if (envSpecificResult.parsed) {
  console.log(`Loaded environment from: ${envSpecificPath}`);
}

// Load environment variables from possible .env locations
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '../../packages/database/.env'),
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath, override: false });
  if (result.parsed) {
    console.log(`Loaded environment from: ${envPath}`);
    break;
  }
}

// Global test setup
// DATABASE_URL은 E2E 테스트에서만 필수다.
// CI에서 유닛 테스트(pnpm vitest run src)는 DB 없이 실행되므로,
// 환경변수가 없을 때 throw하지 않는다.
beforeAll(() => {
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is configured for testing');
  }
});
