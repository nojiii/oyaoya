import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router'
import { FESTIVAL_URL } from './pages/festival'
import { ErrorPage, Layout, Loading } from './pages/Layout'
import { loadGroupPage, loadHome, loadProblem } from './pages/loaders'
import GroupDetail from './pages/GroupDetail'
import Home from './pages/Home'
import ProblemDetail from './pages/ProblemDetail'

// 通常モードと大学祭モードで同じページを並べる。違いは loader に渡す festival だけ
function pages(festival: boolean): RouteObject[] {
  return [
    { index: true, loader: () => loadHome(festival), element: <Home /> },
    {
      path: 'problems/:problemId',
      loader: ({ params }) => loadProblem(params.problemId!, festival),
      element: <ProblemDetail />,
    },
    // それ以外のURLは分類のページ。階層は何段でもよいので、残りのパス全体を渡す
    {
      path: '*',
      loader: ({ params }) => loadGroupPage(params['*']!, festival),
      element: <GroupDetail />,
    },
  ]
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <Loading />,
    children: [...pages(false), { path: FESTIVAL_URL, children: pages(true) }],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
