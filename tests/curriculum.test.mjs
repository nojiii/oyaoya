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
