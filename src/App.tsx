import { createBrowserRouter, RouterProvider } from 'react-router'
import {
  fetchProblem,
  fetchSubjects,
  fetchSubjectWithUnits,
  fetchUnitWithProblems,
} from './content/api'
import { ErrorPage, Layout, Loading } from './pages/Layout'
import Home from './pages/Home'
import SubjectDetail from './pages/SubjectDetail'
import UnitDetail from './pages/UnitDetail'
import ProblemDetail from './pages/ProblemDetail'

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <Loading />,
    children: [
      { index: true, loader: () => fetchSubjects(), element: <Home /> },
      {
        path: ':subject',
        loader: ({ params }) => fetchSubjectWithUnits(params.subject!),
        element: <SubjectDetail />,
      },
      {
        path: ':subject/:unit',
        loader: ({ params }) =>
          fetchUnitWithProblems(params.subject!, params.unit!),
        element: <UnitDetail />,
      },
      {
        path: ':subject/:unit/:problem',
        loader: ({ params }) =>
          fetchProblem(params.subject!, params.unit!, params.problem!),
        element: <ProblemDetail />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
