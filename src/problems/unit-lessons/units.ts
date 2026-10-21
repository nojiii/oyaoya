import type { ArithmeticMode } from '../arithmetic'

// 単元ごとに1つの問題を置く教材の一覧。id が問題IDで、そのままURL（/problems/<id>）になる。
// 公開後は id を変えない（URLが変わるため）
type Unit = {
  id: string
  title: string
  // 置く学年。1つの問題は1つの分類にだけ置く（パンくずと戻り先を1つに決めるため）
  grade: number
} &
  // 計算の単元。問題の文と台本は数字から作るので、計算の種類と最初に出す数字だけを書く
  (
    | {
        arithmetic: { mode: ArithmeticMode; initial: readonly [number, number] }
      }
    // それ以外の単元。台本は teaching.ts に書く
    | {
        // この学習でやること
        learn: string
        // 問題の文と、答え
        q: string
        a: string
        // 教えるときに、いちばん大事なこと
        parent: string
      }
  )

export const units = [
  {
    id: 'counting-to-10',
    title: '10までのかず',
    learn: '1〜10までの数を数え、数字と量を結びつけます。',
    q: '🍎 🍎 🍎 🍎 🍎 りんごはいくつあるでしょう？',
    a: '5',
    parent:
      '実物のりんごやおもちゃを使い、数字だけでなく「量」と結びつけてください。',
    grade: 1,
  },
  {
    id: 'addition-basic',
    title: 'たしざん',
    arithmetic: { mode: 'add', initial: [3, 4] },
    grade: 1,
  },
  {
    id: 'subtraction-basic',
    title: 'ひきざん',
    arithmetic: { mode: 'sub', initial: [8, 3] },
    grade: 1,
  },
  {
    id: 'subtraction-borrow',
    title: 'くり下がりのひきざん',
    arithmetic: { mode: 'borrow', initial: [13, 5] },
    grade: 2,
  },
  {
    id: 'clock-reading',
    title: '時計',
    learn: '時と分の読み方、短針・長針の意味を学びます。',
    q: '3時は針がどこ？',
    a: '短針が3を指す',
    parent: '身近な時計を使って、針の動きを一緒に確認してください。',
    grade: 1,
  },
  {
    id: 'shape-sides',
    title: 'かたち',
    learn: '三角形や四角形などの形と特徴を学びます。',
    q: '三角形は辺がいくつ？',
    a: '3',
    parent: '工作や積み木で形を作らせると理解が深まります。',
    grade: 1,
  },
  {
    id: 'multiplication-basic',
    title: 'かけざん',
    arithmetic: { mode: 'times', initial: [2, 3] },
    grade: 2,
  },
  {
    id: 'length-compare',
    title: '長さ',
    learn: 'ものの長さを比べたり、定規で測ったりします。',
    q: 'どちらが長い？',
    a: 'Aが長い',
    parent: '実際にものを測らせる経験が大切です。',
    grade: 2,
  },
  {
    id: 'time-duration',
    title: '時刻と時間',
    learn: '何分か、何時間かを理解します。',
    q: '1時間は60分だね。30分は1時間のどれくらいかな？',
    a: '1時間の半分',
    parent: '生活の中で時間を測る習慣をつけましょう。',
    grade: 2,
  },
  {
    id: 'shape-corners',
    title: '図形',
    learn: '角や辺、面について学びます。',
    q: '四角形の角は全部でいくつ？',
    a: '4',
    parent: '実際に紙を折ったり切ったりして考えさせると良いです。',
    grade: 2,
  },
] as const satisfies readonly Unit[]

export type UnitId = (typeof units)[number]['id']
// 計算以外の単元（台本を teaching.ts に書く単元）
export type ScriptedUnitId = Exclude<
  (typeof units)[number],
  { arithmetic: unknown }
>['id']
