import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

// src/firebase.ts と同じID（エミュレータは singleProject 設定のため揃える）
const PROJECT_ID = 'oyaoya-844ea'

// 接続先は FIRESTORE_EMULATOR_HOST（emulators:exec が設定する）から決まる
export function createTestEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf-8') },
  })
}
