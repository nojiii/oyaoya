import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse } from 'yaml'
import type { Content } from '../src/content/types.ts'

export const CONTENT_DIR = resolve(import.meta.dirname, '..', 'content')

const SECTION_FILES = {
  question: 'question.md',
  howToSolve: 'how_to_solve.md',
  howToTeach: 'how_to_teach.md',
  examplePhrases: 'example_phrases.md',
} as const

type Meta = Record<string, unknown>

export class ContentError extends Error {}

function loadMeta(path: string): Meta {
  if (!existsSync(path)) throw new ContentError(`meta file not found: ${path}`)
  return (parse(readFileSync(path, 'utf-8')) ?? {}) as Meta
}

function requireField(meta: Meta, key: string, path: string) {
  const value = meta[key]
  if (value === undefined || value === null || value === '') {
    throw new ContentError(`"${key}" is missing in ${path}`)
  }
  return String(value)
}

function orderOf(meta: Meta, path: string) {
  const order = meta.order ?? 0
  if (typeof order !== 'number') {
    throw new ContentError(`"order" must be a number in ${path}`)
  }
  return order
}

function loadSection(path: string) {
  if (!existsSync(path)) {
    throw new ContentError(`required content file not found: ${path}`)
  }
  return readFileSync(path, 'utf-8')
}

// メタファイルのないディレクトリも返す（置き忘れを loadMeta でエラーにするため）
function childDirs(dir: string) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
}

function byOrder<T extends { order: number; slug: string }>(a: T, b: T) {
  return a.order - b.order || a.slug.localeCompare(b.slug)
}

// content/ を読み込んで検証する。不備があれば ContentError を投げる
export function loadContent(): Content {
  if (!existsSync(CONTENT_DIR)) {
    throw new ContentError(`content directory not found: ${CONTENT_DIR}`)
  }
  const content: Content = { subjects: [], units: {}, problems: {} }

  for (const subject of childDirs(CONTENT_DIR)) {
    const subjectDir = join(CONTENT_DIR, subject)
    const metaPath = join(subjectDir, '_meta.yaml')
    const meta = loadMeta(metaPath)
    content.subjects.push({
      slug: subject,
      name: requireField(meta, 'name', metaPath),
      order: orderOf(meta, metaPath),
    })
    const units = (content.units[subject] = [] as Content['units'][string])

    for (const unit of childDirs(subjectDir)) {
      const unitDir = join(subjectDir, unit)
      const unitMetaPath = join(unitDir, '_meta.yaml')
      const unitMeta = loadMeta(unitMetaPath)
      units.push({
        slug: unit,
        name: requireField(unitMeta, 'name', unitMetaPath),
        order: orderOf(unitMeta, unitMetaPath),
      })
      const problems = (content.problems[`${subject}/${unit}`] =
        [] as Content['problems'][string])

      for (const problem of childDirs(unitDir)) {
        const problemDir = join(unitDir, problem)
        const problemMetaPath = join(problemDir, 'meta.yaml')
        const problemMeta = loadMeta(problemMetaPath)
        problems.push({
          slug: problem,
          title: requireField(problemMeta, 'title', problemMetaPath),
          order: orderOf(problemMeta, problemMetaPath),
          question: loadSection(join(problemDir, SECTION_FILES.question)),
          howToSolve: loadSection(join(problemDir, SECTION_FILES.howToSolve)),
          howToTeach: loadSection(join(problemDir, SECTION_FILES.howToTeach)),
          examplePhrases: loadSection(
            join(problemDir, SECTION_FILES.examplePhrases),
          ),
        })
      }
      problems.sort(byOrder)
    }
    units.sort(byOrder)
  }
  content.subjects.sort(byOrder)
  return content
}
