import { defineConfig } from 'vitest/config';
import path from 'path';

// tsconfig.json의 path mapping을 Vitest에서도 인식하도록 설정
export default defineConfig({
  // 절대 경로 alias 설정 (@/ → src/, @repo/* → packages/*/src)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/constants': path.resolve(
        __dirname,
        '../../packages/constants/src/reserved-slugs.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'test/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
