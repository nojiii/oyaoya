export interface Subject {
  slug: string
  name: string
  order: number
}

export interface Unit {
  slug: string
  name: string
  order: number
}

export interface Problem {
  slug: string
  title: string
  order: number
  question: string
  howToSolve: string
  howToTeach: string
  examplePhrases: string
}
