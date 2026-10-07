import {
  collection,
  doc,
  getDoc,
  getDocs,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Problem, Subject, Unit } from './types'

// PRプレビューのビルドでは previews/pr-<番号> が入り、そのPR専用のデータを読む
const ROOT = import.meta.env.VITE_CONTENT_ROOT
  ? `${import.meta.env.VITE_CONTENT_ROOT}/`
  : ''

function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

function byOrder<T extends { order: number; slug: string }>(a: T, b: T) {
  return a.order - b.order || a.slug.localeCompare(b.slug)
}

async function getOne<T>(path: string): Promise<T> {
  const snap = await getDoc(doc(db, ROOT + path))
  if (!snap.exists()) notFound()
  return { slug: snap.id, ...snap.data() } as T
}

async function getAll<T extends { order: number; slug: string }>(
  path: string,
): Promise<T[]> {
  const snap = await getDocs(collection(db, ROOT + path))
  return snap.docs
    .map((d) => ({ slug: d.id, ...(d.data() as DocumentData) }) as T)
    .sort(byOrder)
}

export function fetchSubjects() {
  return getAll<Subject>('subjects')
}

export async function fetchSubjectWithUnits(subjectSlug: string) {
  const base = `subjects/${subjectSlug}`
  const [subject, units] = await Promise.all([
    getOne<Subject>(base),
    getAll<Unit>(`${base}/units`),
  ])
  return { subject, units }
}

export async function fetchUnitWithProblems(
  subjectSlug: string,
  unitSlug: string,
) {
  const base = `subjects/${subjectSlug}/units/${unitSlug}`
  const [subject, unit, problems] = await Promise.all([
    getOne<Subject>(`subjects/${subjectSlug}`),
    getOne<Unit>(base),
    getAll<Problem>(`${base}/problems`),
  ])
  return { subject, unit, problems }
}

export async function fetchProblem(
  subjectSlug: string,
  unitSlug: string,
  problemSlug: string,
) {
  const unitPath = `subjects/${subjectSlug}/units/${unitSlug}`
  const [subject, unit, problem] = await Promise.all([
    getOne<Subject>(`subjects/${subjectSlug}`),
    getOne<Unit>(unitPath),
    getOne<Problem>(`${unitPath}/problems/${problemSlug}`),
  ])
  return { subject, unit, problem }
}
