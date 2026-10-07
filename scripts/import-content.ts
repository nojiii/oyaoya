import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from 'firebase-admin/firestore'
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

// '' は本番パス、プレビューは previews/<id> 配下のみ許可（誤って他の場所を消さないため）
function parseRoot(args: string[]): string {
  const i = args.indexOf('--root')
  if (i === -1) return ''
  const root = args[i + 1] ?? ''
  if (!/^previews\/[A-Za-z0-9_-]+$/.test(root)) {
    throw new ContentError(
      `--root は previews/<id> 形式で指定してください: "${root}"`,
    )
  }
  return root
}

async function findOrphans(
  col: CollectionReference,
  wanted: Set<string>,
  out: DocumentReference[],
) {
  for (const ref of await col.listDocuments()) {
    if (!wanted.has(ref.path)) {
      out.push(ref)
      continue
    }
    for (const sub of await ref.listCollections()) {
      await findOrphans(sub, wanted, out)
    }
  }
}

async function sync(db: Firestore, root: string, docs: Doc[]) {
  const prefix = root ? `${root}/` : ''
  const writer = db.bulkWriter()
  for (const doc of docs) writer.set(db.doc(prefix + doc.path), doc.data)
  await writer.close()

  const wanted = new Set(docs.map((d) => prefix + d.path))
  const orphans: DocumentReference[] = []
  await findOrphans(db.collection(`${prefix}subjects`), wanted, orphans)
  for (const ref of orphans) await db.recursiveDelete(ref)
  return orphans.length
}

async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes('--check')
  const production = args.includes('--production')
  const remove = args.includes('--remove')
  const root = parseRoot(args)

  if (remove && !root) {
    throw new ContentError(
      '--remove には --root previews/<id> の指定が必要です',
    )
  }

  const docs = remove ? [] : collectDocs()

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

  const target = [
    production
      ? '本番Firestore'
      : `エミュレータ(${process.env.FIRESTORE_EMULATOR_HOST})`,
    root ? ` の ${root}/` : '',
  ].join('')

  if (remove) {
    await db.recursiveDelete(db.doc(root))
    console.log(`${target} を削除しました`)
    return
  }

  const removed = await sync(db, root, docs)
  console.log(
    `${summarize(docs)}を${target}へ取り込みました（不要なドキュメント${removed}件を削除）`,
  )
}

main().catch((err) => {
  console.error(err instanceof ContentError ? `エラー: ${err.message}` : err)
  process.exit(1)
})
