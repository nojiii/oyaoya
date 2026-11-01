import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createMemoryRouter, RouterProvider } from 'react-router'

test('all published units navigate directly to preparation and old unit URLs still work', async () => {
  const { loadGroup, loadGroupPage, loadProblem } =
    await import('../src/pages/loaders.ts')
  const { curriculum } = await import('../src/curriculum.ts')
  const { default: ProblemDetail } =
    await import('../src/pages/ProblemDetail.tsx')
  let checked = 0
  for (const grade of curriculum)
    for (const subject of grade.children ?? []) {
      const parentPath = `${grade.slug}/${subject.slug}`
      const links = loadGroup(parentPath, false).groups
      for (const unit of subject.children ?? []) {
        if (unit.problems?.length !== 1 || unit.children?.length) continue
        const id = unit.problems[0]
        const target = `/problems/${id}`
        assert.equal(links.find((link) => link.name === unit.name)?.url, target)
        const redirect = loadGroupPage(`${parentPath}/${unit.slug}`, false)
        assert.equal(redirect.headers.get('Location'), target)
        const router = createMemoryRouter(
          [
            {
              path: '/problems/:problemId',
              loader: ({ params }) => loadProblem(params.problemId, false),
              element: createElement(ProblemDetail),
            },
            {
              path: '*',
              loader: ({ params }) => loadGroupPage(params['*'], false),
              element: createElement('p', null, 'unit list'),
            },
          ],
          { initialEntries: [`/${parentPath}`] },
        )
        try {
          await router.navigate(`/${parentPath}/${unit.slug}`)
          assert.equal(router.state.location.pathname, target)
          assert.equal(router.state.errors, null)
          const html = renderToString(createElement(RouterProvider, { router }))
          assert.ok(html.includes('この学習でやること'), unit.name)
          assert.ok(html.includes('はじめる'), unit.name)
          assert.ok(!html.includes('問題をえらんでください'), unit.name)
          assert.ok(
            !loadProblem(id, false).crumbs.some((crumb) =>
              crumb.url.endsWith(`/${unit.slug}`),
            ),
          )
          checked++
        } finally {
          router.dispose()
        }
      }
    }
  assert.ok(checked >= 1, `checked ${checked} units`)
  assert.equal(loadGroupPage('grade-1/math', false).lesson, null)
  assert.equal(loadGroupPage('grade-2', false).lesson, null)
})

// 大学祭のカテゴリはどれも問題が1つなので、ホームから問題選択を挟まず準備画面へ進み、戻るとホームに帰る
test('festival home shows each category with a picture and links straight to its preparation screen', async () => {
  const { loadGroupPage, loadHome, loadProblem } =
    await import('../src/pages/loaders.ts')
  const { festivalCurriculum } = await import('../src/curriculum.ts')
  const { default: Home } = await import('../src/pages/Home.tsx')
  const { groups } = loadHome(true)
  assert.deepEqual(
    groups.map((group) => group.name),
    festivalCurriculum.map((group) => group.name),
  )
  for (const [i, group] of festivalCurriculum.entries()) {
    const target = `/festival/problems/${group.problems[0]}`
    assert.equal(groups[i].url, target, group.name)
    assert.ok(groups[i].tag, group.name)
    assert.equal(
      loadGroupPage(group.slug, true).headers.get('Location'),
      target,
    )
    assert.deepEqual(loadProblem(group.problems[0], true).crumbs, [])
  }
  const router = createMemoryRouter(
    [
      {
        path: '/festival',
        loader: () => loadHome(true),
        element: createElement(Home),
      },
    ],
    { initialEntries: ['/festival'] },
  )
  try {
    await router.navigate('/festival')
    const html = renderToString(createElement(RouterProvider, { router }))
    assert.equal(
      html.match(/class="row-picture"/g)?.length,
      festivalCurriculum.length,
    )
    for (const group of festivalCurriculum)
      assert.ok(html.includes(`href="/festival/problems/${group.problems[0]}"`))
  } finally {
    router.dispose()
  }
})
