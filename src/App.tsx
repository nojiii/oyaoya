import { createBrowserRouter, RouterProvider } from 'react-router'
import { ErrorPage, Layout, Loading } from './pages/Layout'
import { loadGroup, loadHome, loadProblem } from './pages/loaders'
import GroupDetail from './pages/GroupDetail'
import Home from './pages/Home'
import ProblemDetail from './pages/ProblemDetail'

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <Loading />,
    children: [
      { index: true, loader: loadHome, element: <Home /> },
      {
        path: 'problems/:problemId',
        loader: ({ params }) => loadProblem(params.problemId!),
        element: <ProblemDetail />,
      },
      // それ以外のURLは分類のページ。階層は何段でもよいので、残りのパス全体を渡す
      {
        path: '*',
        loader: ({ params }) => loadGroup(params['*']!),
        element: <GroupDetail />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
