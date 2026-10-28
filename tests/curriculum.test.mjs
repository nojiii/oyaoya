import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTestServer } from './viteServer.mjs'

// 1つの問題を2つの分類に置くと、パンくず・戻り先・色が最初に見つかった分類になってしまうため
test('every problem is placed in exactly one group', async () => {
  const server = await createTestServer()
  try {
    const { curriculum, festivalCurriculum } =
      await server.ssrLoadModule('/src/curriculum.ts')
    for (const tree of [curriculum, festivalCurriculum]) {
      const placed = []
      const walk = (groups) => {
        for (const group of groups) {
          placed.push(...(group.problems ?? []))
          walk(group.children ?? [])
        }
      }
      walk(tree)
      const duplicated = placed.filter((id, i) => placed.indexOf(id) !== i)
      assert.deepEqual(duplicated, [])
    }
  } finally {
    await server.close()
  }
})

// units.ts の単元は、curriculum.ts の同じ slug の単元に置く。
// 置き忘れると一覧・メニューに出ず、名前が違うと一覧と問題ページの見出しが食い違うため
test('every unit lesson is placed under a group with its id as slug and its title as name', async () => {
  const server = await createTestServer()
  try {
    const { curriculum } = await server.ssrLoadModule('/src/curriculum.ts')
    const { units } = await server.ssrLoadModule(
      '/src/problems/unit-lessons/units.ts',
    )
    const groups = []
    const walk = (list) => {
      for (const group of list) {
        groups.push(group)
        walk(group.children ?? [])
      }
    }
    walk(curriculum)
    for (const unit of units) {
      const placed = groups.filter((group) => group.problems?.includes(unit.id))
      assert.equal(placed.length, 1, unit.id + ': placed in curriculum.ts')
      assert.equal(placed[0].slug, unit.id, unit.id + ': slug')
      assert.equal(placed[0].name, unit.title, unit.id + ': name')
      assert.deepEqual(
        placed[0].problems,
        [unit.id],
        unit.id + ': only problem',
      )
    }
  } finally {
    await server.close()
  }
})
