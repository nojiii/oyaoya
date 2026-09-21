export interface Problem {
  slug: string
  title: string
  question: string
  howToSolve: string
  howToTeach: string
  examplePhrases: string
}

export interface Unit {
  slug: string
  name: string
  problems: Problem[]
}

export interface Subject {
  slug: string
  name: string
  units: Unit[]
}
