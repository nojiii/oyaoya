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

// content/ をビルド時に読み込んだもの（`virtual:content`）。一覧は表示順に並んでいる
export interface Content {
  subjects: Subject[]
  // 教科slug → 単元一覧
  units: Record<string, Unit[]>
  // `<教科slug>/<単元slug>` → 問題一覧
  problems: Record<string, Problem[]>
}
