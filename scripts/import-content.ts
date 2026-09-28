import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parse } from 'yaml'

const CONTENT_DIR = resolve(import.meta.dirname, '..', 'content')
const PROJECT_ID = 'oyaoya-844ea'

const SECTION_FILES = {
  question: 'question.md',
  howToSolve: 'how_to_solve.md',
  howToTeach: 'how_to_teach.md',
  examplePhrases: 'example_phrases.md',
} as const

type Doc = { path: string; data: Record<string, unknown> }

class ContentError extends Error {}

function loadMeta(path: string): Record<string, unknown> {
  if (!existsSync(path)) throw new ContentError(`meta file not found: ${path}`)
  return (parse(readFileSync(path, 'utf-8')) ?? {}) as Record<string, unknown>
}

function requireField(
  meta: Record<string, unknown>,
  key: string,
  path: string,
) {
  const value = meta[key]
  if (value === undefined || value === null || value === '') {
    throw new ContentError(`"${key}" is missing in ${path}`)
  }
  return value
}

function childDirs(dir: string, metaFile: string) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, metaFile)))
    .map((d) => d.name)
    .sort()
}

function collectDocs(): Doc[] {
  if (!existsSync(CONTENT_DIR)) {
    throw new ContentError(`content directory not found: ${CONTENT_DIR}`)
  }
  const docs: Doc[] = []

  for (const subject of childDirs(CONTENT_DIR, '_meta.yaml')) {
    const subjectDir = join(CONTENT_DIR, subject)
    const metaPath = join(subjectDir, '_meta.yaml')
    const meta = loadMeta(metaPath)
    docs.push({
      path: `subjects/${subject}`,
      data: {
        name: requireField(meta, 'name', metaPath),
        order: meta.order ?? 0,
      },
    })

    for (const unit of childDirs(subjectDir, '_meta.yaml')) {
      const unitDir = join(subjectDir, unit)
      const unitMetaPath = join(unitDir, '_meta.yaml')
      const unitMeta = loadMeta(unitMetaPath)
      docs.push({
        path: `subjects/${subject}/units/${unit}`,
        data: {
          name: requireField(unitMeta, 'name', unitMetaPath),
          order: unitMeta.order ?? 0,
        },
      })

      for (const problem of childDirs(unitDir, 'meta.yaml')) {
        const problemDir = join(unitDir, problem)
        const problemMetaPath = join(problemDir, 'meta.yaml')
        const problemMeta = loadMeta(problemMetaPath)
        const sections: Record<string, string> = {}
        for (const [field, file] of Object.entries(SECTION_FILES)) {
          const mdPath = join(problemDir, file)
          if (!existsSync(mdPath)) {
            throw new ContentError(`required content file not found: ${mdPath}`)
          }
          sections[field] = readFileSync(mdPath, 'utf-8')
        }
        docs.push({
          path: `subjects/${subject}/units/${unit}/problems/${problem}`,
          data: {
            title: requireField(problemMeta, 'title', problemMetaPath),
            order: problemMeta.order ?? 0,
            ...sections,
          },
        })
      }
    }
  }
  return docs
}

function summarize(docs: Doc[]) {
  const depth = (d: Doc) => d.path.split('/').length
  const subjects = docs.filter((d) => depth(d) === 2).length
  const units = docs.filter((d) => depth(d) === 4).length
  const problems = docs.filter((d) => depth(d) === 6).length
  return `${subjects}教科 / ${units}単元 / ${problems}問題`
}

async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')
  const production = args.includes('--production')

  const docs = collectDocs()

  if (checkOnly) {
    console.log(`${summarize(docs)}を検証しました`)
    return
  }

  if (production) {
    delete process.env.FIRESTORE_EMULATOR_HOST
  } else {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
  }

  const { initializeApp } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  const db = getFirestore(initializeApp({ projectId: PROJECT_ID }))

  const batch = db.batch()
  for (const doc of docs) batch.set(db.doc(doc.path), doc.data)
  await batch.commit()

  const target = production
    ? '本番Firestore'
    : `エミュレータ(${process.env.FIRESTORE_EMULATOR_HOST})`
  console.log(`${summarize(docs)}を${target}へ取り込みました`)
}

main().catch((err) => {
  console.error(err instanceof ContentError ? `エラー: ${err.message}` : err)
  process.exit(1)
})
