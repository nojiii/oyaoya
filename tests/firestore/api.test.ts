import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import {
  fetchProblem,
  fetchSubjects,
  fetchSubjectWithUnits,
  fetchUnitWithProblems,
} from '../../src/content/api'
import { createTestEnv } from './env'

const PROBLEM_SECTIONS = {
  question: '問題文',
  howToSolve: '解き方',
  howToTeach: '教え方',
  examplePhrases: '声掛け例',
}

// 取り込みスクリプト（scripts/import-content.ts）が書き込むのと同じ形
const SEED: Record<string, Record<string, unknown>> = {
  'subjects/math': { name: '算数', order: 1 },
  'subjects/japanese': { name: '国語', order: 2 },
  'subjects/math/units/unit-b': { name: 'ひき算', order: 2 },
  'subjects/math/units/unit-a': { name: 'たし算', order: 1 },
  'subjects/math/units/unit-a/problems/p2': {
    title: 'のこりはいくつ',
    order: 1,
    ...PROBLEM_SECTIONS,
  },
  'subjects/math/units/unit-a/problems/p1': {
    title: 'あわせていくつ',
    order: 1,
    ...PROBLEM_SECTIONS,
  },
  // 本番パスと取り違えていないことを確かめるためのプレビュー用データ
  'previews/pr-1/subjects/science': { name: '理科', order: 1 },
}

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await createTestEnv()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    for (const [path, data] of Object.entries(SEED)) {
      await setDoc(doc(db, path), data)
    }
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

async function expectNotFound(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(Response)
  expect((error as Response).status).toBe(404)
}

describe('本番パス', () => {
  test('教科一覧を order 順で返す', async () => {
    expect(await fetchSubjects()).toEqual([
      { slug: 'math', name: '算数', order: 1 },
      { slug: 'japanese', name: '国語', order: 2 },
    ])
  })

  test('教科と、その単元一覧を order 順で返す', async () => {
    const { subject, units } = await fetchSubjectWithUnits('math')
    expect(subject).toEqual({ slug: 'math', name: '算数', order: 1 })
    expect(units.map((u) => u.slug)).toEqual(['unit-a', 'unit-b'])
  })

  test('order が同じ問題は slug 順で返す', async () => {
    const { subject, unit, problems } = await fetchUnitWithProblems(
      'math',
      'unit-a',
    )
    expect(subject.slug).toBe('math')
    expect(unit).toEqual({ slug: 'unit-a', name: 'たし算', order: 1 })
    expect(problems.map((p) => p.slug)).toEqual(['p1', 'p2'])
  })

  test('問題の4セクションを返す', async () => {
    const { subject, unit, problem } = await fetchProblem(
      'math',
      'unit-a',
      'p1',
    )
    expect(subject.slug).toBe('math')
    expect(unit.slug).toBe('unit-a')
    expect(problem).toEqual({
      slug: 'p1',
      title: 'あわせていくつ',
      order: 1,
      ...PROBLEM_SECTIONS,
    })
  })

  test('存在しないものは 404 を投げる', async () => {
    await expectNotFound(fetchSubjectWithUnits('nope'))
    await expectNotFound(fetchUnitWithProblems('math', 'nope'))
    await expectNotFound(fetchProblem('math', 'unit-a', 'nope'))
    // 単元はあっても、親の教科が違えば見つからない
    await expectNotFound(fetchUnitWithProblems('japanese', 'unit-a'))
  })
})

describe('PRプレビュー（VITE_CONTENT_ROOT 指定時）', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  test('previews/pr-<番号>/ 配下だけを読む', async () => {
    vi.stubEnv('VITE_CONTENT_ROOT', 'previews/pr-1')
    vi.resetModules()
    const api = await import('../../src/content/api')

    expect(await api.fetchSubjects()).toEqual([
      { slug: 'science', name: '理科', order: 1 },
    ])
    await expectNotFound(api.fetchSubjectWithUnits('math'))
  })
})
