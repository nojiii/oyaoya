import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { createTestEnv } from './env'

const PROBLEM = 'subjects/math/units/unit-01/problems/problem-01'

const CONTENT_PATHS = [
  'subjects/math',
  'subjects/math/units/unit-01',
  PROBLEM,
  `previews/pr-1/${PROBLEM}`,
]

// ルールで定義していないパス（教材の下にぶら下げたものも含む）
const UNDEFINED_PATHS = ['users/alice', 'subjects/math/secrets/s1']

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await createTestEnv()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    for (const path of [...CONTENT_PATHS, ...UNDEFINED_PATHS]) {
      await setDoc(doc(db, path), { name: 'seed' })
    }
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

const visitors = {
  未ログイン: () => testEnv.unauthenticatedContext().firestore(),
  ログイン済み: () => testEnv.authenticatedContext('alice').firestore(),
}

describe.each(Object.entries(visitors))('%s', (_, firestore) => {
  test.each(CONTENT_PATHS)('%s を読める', async (path) => {
    const snap = await assertSucceeds(getDoc(doc(firestore(), path)))
    expect(snap.exists()).toBe(true)
  })

  test('教材の一覧を取得できる', async () => {
    const db = firestore()
    await assertSucceeds(getDocs(collection(db, 'subjects')))
    await assertSucceeds(getDocs(collection(db, 'subjects/math/units')))
    await assertSucceeds(
      getDocs(collection(db, 'previews/pr-1/subjects/math/units')),
    )
  })

  test.each(CONTENT_PATHS)('%s に書き込めない', async (path) => {
    const ref = doc(firestore(), path)
    await assertFails(setDoc(ref, { name: 'x' }))
    await assertFails(updateDoc(ref, { name: 'x' }))
    await assertFails(deleteDoc(ref))
  })

  test('教材を新規作成できない', async () => {
    const db = firestore()
    await assertFails(setDoc(doc(db, 'subjects/new'), { name: 'x' }))
    await assertFails(
      setDoc(doc(db, 'previews/pr-1/subjects/new'), { name: 'x' }),
    )
  })

  test.each(UNDEFINED_PATHS)(
    'ルールで定義していない %s は読み書きできない',
    async (path) => {
      const ref = doc(firestore(), path)
      await assertFails(getDoc(ref))
      await assertFails(getDocs(ref.parent))
      await assertFails(setDoc(ref, { name: 'x' }))
    },
  )
})
