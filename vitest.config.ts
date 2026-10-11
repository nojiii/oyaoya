import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        // Firestoreに依存しないテスト。src/ 配下に <対象>.test.ts として置く
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        // Firestoreエミュレータが必要なテスト（npm run test:firestore で実行）
        test: {
          name: 'firestore',
          include: ['tests/firestore/**/*.test.ts'],
          // 1つのエミュレータを共有するため、ファイルは直列に実行する
          fileParallelism: false,
        },
      },
    ],
  },
})
