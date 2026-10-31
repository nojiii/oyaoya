# おやおや (Oyaoya)

親子で一緒に取り組む学習支援アプリ。React + Vite + TypeScript 製。

問題は1問ごとに専用の画面として `src/problems/` に置き、文章もソースコードに直接書く。バックエンド（データベース）は現時点では使っていない。

## 全体像

学年 → 教科 → 単元 → 問題と選んでいくと、問題ごとの画面が表示されるサイト。ログインはない。プログラムは大きく3つに分かれている。

- **問題**（[src/problems/](src/problems/)）: 1問ごとの画面。問題文・解き方・教え方・声掛け例の文章も、ここに直接書く
- **階層**（[src/curriculum.ts](src/curriculum.ts)）: 学年・教科・単元などの分類と、そこに並べる問題
- **枠**（[src/pages/](src/pages/) と [src/components/](src/components/)）: ホームや一覧のページと、複数の問題で使う部品

これらを、ブラウザで開けるファイル一式に変換する作業を「ビルド」と呼ぶ。問題の文章もビルドのときにプログラムへ含まれるので、表示中にサーバーへ取りに行くことはない。

### やりたいこと別：どこを触るか

| やりたいこと                                     | 触る場所                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 問題を追加する                                   | [src/problems/](src/problems/)（手順は[問題を追加する](#問題を追加する)）                                 |
| 問題の文章や見た目を直す                         | その問題のフォルダ（`src/problems/<問題ID>/`）                                                            |
| 学年・教科・単元を増やす、並べ替える、段を増やす | [src/curriculum.ts](src/curriculum.ts)（書き方は[階層を変える](#階層を変える)）                           |
| 大学祭用の問題を追加する                         | [src/problems/](src/problems/) と [src/curriculum.ts](src/curriculum.ts)（[大学祭モード](#大学祭モード)） |
| 複数の問題で使う部品を作る、直す                 | [src/components/](src/components/)                                                                        |
| ホームや一覧ページの文言・並びを変える           | [src/pages/](src/pages/)                                                                                  |
| サイト全体の色・余白・文字サイズを変える         | [src/index.css](src/index.css)                                                                            |
| 新しい種類のページ（URL）を増やす                | [src/App.tsx](src/App.tsx) と [src/pages/](src/pages/)                                                    |
| サイト全体で使う画像を置く                       | [public/](public/)                                                                                        |
| キャラクター（おやじい）の絵や動きを変える       | [public/oyajii.riv](public/oyajii.riv)（手順は[キャラクター（おやじい）](#キャラクターおやじい)）         |
| CI・デプロイの設定を変える                       | `.github/` と `firebase.json`（オーナーのレビューが必要）                                                 |

それ以外のファイル（`tsconfig*.json`、`eslint.config.js` など）は道具の設定で、普段は触らない。

## 開発環境

- Node.js 24系を使用（`.nvmrc` 参照。nvm利用時は `nvm use`）。それより古いNode.jsでは `npm install` がエラーで止まる（`.npmrc` の `engine-strict`）
- VSCode使用時は、開くと推奨拡張機能（ESLint / Prettier / EditorConfig）の導入を促される（`.vscode/extensions.json`）
  - 通知が出ない場合は、拡張機能タブの「推奨」欄からESLint・Prettierを手動でインストールしてください
  - **これらの拡張機能を有効化しないと、保存時の自動フォーマット・自動修正は動作しません**
- 保存時にPrettierでの自動フォーマット、ESLintの自動修正が有効（`.vscode/settings.json`。上記拡張機能のインストールが前提）
  - 各自のVSCode設定で別のフォーマッタを指定していても、このリポジトリではPrettierが使われる
  - VSCodeの自動保存（Auto Save）を `afterDelay` にしていると、保存時の整形は走らない（VSCodeの仕様）。その場合は `Ctrl+S` で保存するか、`npm run format` を実行する
  - 整形漏れはCIの `lint` で検出される。落ちたら `npm run format` を実行してコミットする

## 開発

```bash
npm install
npm run dev   # http://localhost:5173/
```

ソースコードを保存すると、画面に反映される。

## Lint・フォーマット・型チェック・テスト

```bash
npm run lint          # ESLintでチェック
npm run format        # Prettierで整形
npm run format:check  # 整形が必要な箇所がないかチェック（CI向け）
npm run typecheck     # 型チェック
npm test              # テスト
```

コード整形ルール（詳細は [.prettierrc.json](.prettierrc.json) / [.editorconfig](.editorconfig)）:

- セミコロンなし
- シングルクォート使用
- インデントはスペース2つ
- 改行コードはLF、文字コードはUTF-8
- ESLintの整形系ルールはPrettierと衝突しないよう無効化済み（`eslint-config-prettier`）

## ビルド

```bash
npm run build
```

## PRとレビューの流れ

`main` へは直接pushせず、ブランチを切ってPull Requestを作る。

1. `main` から作業ブランチを作って変更し、pushしてPRを作成する（[テンプレート](.github/pull_request_template.md)に沿って記入）
   - ブランチ名は機能名を英語で付ける（例: `problem-search`）。`feature/` などの接頭辞は付けない
2. 自動で次が走る
   - **CI**（[ci.yml](.github/workflows/ci.yml)）: `lint`（ESLint・Prettier）/ `typecheck` / `build`（テストとビルド）。すべて成功しないとマージできない
   - **プレビュー**: そのPRの内容をビルドしたプレビューURLがコメントされる（7日で自動失効）
   - **AIレビュー**（CodeRabbit）: 補助的な指摘がコメントされる。対応は必須ではなく、採否はPR作成者とレビュアーが判断する（設定は [.coderabbit.yaml](.coderabbit.yaml)）
3. レビュアーはCI結果とコードを見て、プレビューURLで実際に操作して確認し、Approveする
4. `main` へマージすると本番（`https://oyaoya-844ea.web.app`）へ自動デプロイされる

pushする前に手元で確かめるなら:

```bash
npm run lint && npm run format:check && npm test && npm run build
```

依存パッケージとGitHub Actionsは、Dependabotが週1回更新PRを作る（[dependabot.yml](.github/dependabot.yml)）。CIが通れば通常のPRと同じようにレビューしてマージする。DependabotのPRにはプレビューは作られない。

修正版が出ている脆弱性は、週1回の更新とは別に、Dependabotが修正のPRをすぐに作る（複数あれば1つのPRにまとめる）。修正版がまだない場合や、ほかの依存との兼ね合いで上げられない場合はPRが作られないので、Security タブのアラートを見て個別に対応する。脆弱性の修正は急ぐため、公開から7日待つ設定はこのPRには効かない。扱いは通常のDependabotのPRと同じ。

workflowで使う外部のActionsは、タグ（`@v7` など）ではなくコミットSHAで固定している（タグは後から別のコードに差し替えられる可能性があるため）。行末のコメントが対応するバージョンで、SHAとコメントの更新はDependabotが行う。Actionsを追加するときも同じ形式で書く。

`.github/` や `firebase.json` などCI・デプロイに関わるファイルは、[CODEOWNERS](.github/CODEOWNERS) によりオーナーのレビューが必要。

### セキュリティの設定

GitHubのリポジトリ設定（Settings → Advanced Security）で、次を有効にしている。ファイルには現れない設定なので、ここに記録しておく。

- **Dependabot alerts**: 使っているパッケージに脆弱性が見つかると通知される。一覧はGitHubの Security タブ → Dependabot で見られる。手元では `npm audit` で確かめられる
- **Malware alerts**: 使っているパッケージが、悪意あるコードを含むもの（乗っ取られて改ざんされたパッケージなど）だと判明すると通知される。脆弱性とは別の通知で、同じく Security タブで見られる。通知が来たら、アラートに書かれた手順に従ってそのパッケージを取り除くか安全なバージョンに戻す
- **Dependabot security updates**: 上の脆弱性のうち修正版があるものについて、直すPRが自動で作られる（まとめ方は [dependabot.yml](.github/dependabot.yml)）
- **Secret scanning と push protection**: GitHubが検出できる形式の秘密情報（主要なサービスのAPIキーなど）を含むコミットをpushすると、GitHubが拒否する。拒否されたら、そのコミットから秘密情報を取り除いてpushし直す。すべての秘密情報を検出できるわけではないので、これに頼らず、秘密情報はリポジトリに置かない（GitHubの Secrets に登録して使う）

### テストについて

テストは [tests/](tests/) に置き、`npm test` で動かす（CIでも `build` ジョブの中で走る）。[Vitest](https://vitest.dev/) を使う。設定は [vite.config.ts](vite.config.ts) の `test` で、アプリと同じ Vite の設定のまま `src` のファイルを `import` できる。`npx vitest` で起動すると、ファイルを保存するたびに関係するテストだけを動かし直す。

- ふつうのテストは Node.js の上で動かす。ページの HTML を確かめるときは、`react-dom/server` の `renderToString` で描く
- 押す・スワイプするなどの操作を確かめるテストは、ファイルの先頭に `// @vitest-environment happy-dom` と書き、[Testing Library](https://testing-library.com/docs/react-testing-library/intro/) で描いて操作する（例: [teaching-carousel.test.mjs](tests/teaching-carousel.test.mjs)）。happy-dom は要素の大きさやアニメーションを持たないので、[domStubs.mjs](tests/domStubs.mjs) で差し替える
- ソースコードを文字列として読んで中身を取り出すテストは書かない（書き方を変えただけで壊れるため）。計算は関数に切り出して呼び、操作は画面を描いて確かめる

画面の見た目や構成は変更が多く、テストの維持コストが効果を上回るので、見た目はテストせず、プレビューURLでの目視で確かめる。次のようなところにテストを書く。

- 計算や、おはじきの並べ方など、分岐のあるロジック（例: [arithmetic.test.mjs](tests/arithmetic.test.mjs)）
- URLと移動先、階層の決まり（1つの問題は1つの分類にだけ置く など）
- 台本の進み具合の保存と復元
- バックエンドを導入してユーザーごとのデータを扱うとき → アクセス権限（セキュリティルール）のテスト

## フォルダ構成

```text
src/
  main.tsx                 # 起動するところ（普段は触らない）
  App.tsx                  # URLとページの対応
  index.css                # サイト全体の見た目
  curriculum.ts            # 階層（分類と、そこに並べる問題）
  problems/                # 問題。1問 = 1フォルダ
    index.ts               #   問題の一覧
    <問題ID>/              #   フォルダ名が問題ID
      index.tsx            #     その問題のタイトルと画面
    sample/                #   台本とデザインの見本（一覧には出さない）
    arithmetic.ts          #   計算の問題の文と、解き方の台本を、数字から作る
    unit-lessons/          #   単元ごとに1問ずつ置く教材（1つのフォルダで複数の問題を作る）
      units.ts             #     単元の一覧（問題ID・タイトル・計算の種類と最初の数字、または数える数）
  components/              # 複数の問題で使う部品
    TeachingScript.tsx     #   教えている最中に使う台本。準備の画面と、声かけを1ページずつ出す台本（スワイプだけで進める）
    pagedFlow.ts           #   ページを分けた台本の、進み具合の保存とページ送り（大学祭の問題で使う）
    ScriptGuide.tsx        #   台本を初めて開いたときの、使い方の説明（3段）
    ArithmeticLesson.tsx   #   計算の問題の画面（準備の画面で数字を変えられる台本と、おはじき）
    CountingLesson.tsx     #   数える単元の画面（準備の画面で数える数を選べる台本）
    CounterDisplay.tsx     #   台本の下に出す、おはじきの画面
    LessonVisual.tsx       #   台本のステップごとの図
    SideNavigation.tsx     #   横のメニュー
  pages/                   # 問題以外のページと、全ページ共通の枠
tests/                     # テスト（npm test）
```

複数人で同時に開発しても変更がぶつかりにくいように、次の決まりで置く。

- 1つの問題に関するもの（画面、文章、その問題だけで使う部品・画像・スタイル）は、すべてその問題のフォルダの中に置く。担当する問題のフォルダの中は自由に作ってよい
- 2つ以上の問題で使うようになった部品は [src/components/](src/components/) へ移す。最初から共通化しない
- 問題専用のスタイルは、問題のフォルダに `*.module.css`（CSS Modules）で書く。[src/index.css](src/index.css) に足すと、他の問題とクラス名が重なったり、同じファイルの編集がぶつかったりする
- 問題専用の画像は、問題のフォルダに置いて `import` する。[public/](public/) に置くのはサイト全体で使う画像だけ
- 問題を追加するときに触る共有のファイルは、[src/problems/index.ts](src/problems/index.ts) と [src/curriculum.ts](src/curriculum.ts) の2つだけ（[単元の教材](#単元の教材を足す)は、`unit-lessons/` の中のファイルも触る）

## 問題を追加する

台本とデザインの見本を [src/problems/sample/](src/problems/sample/) に置いている（`/problems/sample` で開ける。一覧には出さない）。準備の画面と、ページを分けた台本の部品（ステージ・セリフ・控えのセリフ・教え方のポイント・方法の選択・「？」で答えを見る・たしかめ・終わる）をひととおり使い、書き方をコメントで添えている。新しい問題は、このフォルダをコピーして書き換えると始めやすい。

1. `src/problems/` に新しい問題IDのフォルダを作る（見本をコピーするときは、フォルダごとコピーして名前を問題IDに変える）
2. フォルダに `index.tsx` を作り、`title`（タイトル）と、画面のコンポーネントを `export default` する
3. [src/problems/index.ts](src/problems/index.ts) に2行足す（アルファベット順の位置に入れる）

   ```ts
   import * as subtractionCandies from './subtraction-candies'

   export const problems = {
     'addition-within-10': lesson('addition-within-10'),
     'subtraction-candies': subtractionCandies,
   }
   ```

4. [src/curriculum.ts](src/curriculum.ts) で、置きたい分類の `problems` に問題IDを足す
5. `npm run dev` で起動し、`http://localhost:5173/problems/<問題ID>` を開いて確かめる
6. `npm run typecheck` で書き間違いがないか確かめる（CIでも走る）

### 単元の教材を足す

単元ごとに1問だけ置く教材は、問題のフォルダを作らず、[src/problems/unit-lessons/](src/problems/unit-lessons/) にまとめて書く。

1. [units.ts](src/problems/unit-lessons/units.ts) に単元を1つ足す。`id` が問題ID
   - `arithmetic`（計算の種類と、最初に出す数字）だけを書く。問題の文と台本は、数字から作る（[arithmetic.ts](src/problems/arithmetic.ts)）
   - 数える単元は、`arithmetic` の代わりに `counting`（最初に出す、数える数）を書く。台本は [CountingFlow.tsx](src/components/CountingFlow.tsx)
2. [src/problems/index.ts](src/problems/index.ts) に `'<問題ID>': lesson('<問題ID>'),` を1行足す（アルファベット順の位置に入れる）
3. [src/curriculum.ts](src/curriculum.ts) で、その単元（「じゅんび中」の単元なら、その行）の4つ目の引数に `['<問題ID>']` を書く

`src/problems/index.ts` への足し忘れは、`npm run typecheck` が見つける。`curriculum.ts` への置き忘れと、`slug`・名前が `units.ts` の `id`・`title` と違うことは、`npm test` が見つける。

### 問題ID

- フォルダ名が問題IDで、そのまま問題のURLになる（`/problems/<問題ID>`）
- 半角の英小文字・数字・ハイフンで、内容がわかる名前を付ける（例: `addition-within-10`）
- 教科名や単元の番号は入れない（階層が変わっても、IDを変えずに済むようにするため）
- 公開後は変えない（URLが変わるため）

### 問題の画面の書き方

- 親が教えている最中に使う画面にするときは、[TeachingScript](src/components/TeachingScript.tsx) に台本を渡す（書き方は[教えている最中に使う台本](#教えている最中に使う台本)）
- 台本の形に収まらない問題は、TeachingScript を使わずに自由に組み立ててよい
- 上の帯の戻るボタン（1つ上の一覧へ）と、単元名の見出しはページの枠が出すので、問題の画面には書かない
- 文章はソースコードに直接書く。文言を1か所に集める仕組み（国際化対応など）は、必要になった時点で入れる
- 文章は画像の中に入れず、文字で書く（将来、問題の文章を検索できるようにするため）

### 教えている最中に使う台本

`TeachingScript` は、親が教えている最中に見る台本。最初に準備の画面を出し、「台本をはじめる」で台本に入る。

準備の画面は、上から「図（`picture`）→ この学習でやること → 今日の教え方のポイント（いちばん大事な一文だけを淡い橙の面に）→ たたんだ行」の順。数字を変える欄（`editor`）・詳しい教え方・使い方・声かけの先読みは、たたんだ行にまとめる（図がない単元では、数字を変える欄を図の場所に出す）。

- 台本は「問題 → いっしょに解く → おしまい」の一本道。声かけを1ページずつ出し、スワイプだけで進める（左へで次、右へで前。キーボードでは ← →）。前へ・次へのボタンは置かない
- 台本を初めて開いたときだけ、使い方の説明（3段。[ScriptGuide](src/components/ScriptGuide.tsx)）を出す。一度見たら、同じブラウザでは出さない
- ページを分けた台本（`flow` に [LessonSlides](src/components/LessonSlides.tsx) を渡すもの。今のたし算・数える単元）の1ページは、上から「ステージ（図。なければキャラクター）→ 見出し → 教え方のポイント → こう声をかけよう（セリフ）→ 次のページの名前」。教え方のポイントは、セリフのあるページでは `<TeachingPoints collapsible>` で書き、開いた状態で出す（見出しを押すとたためる）。セリフのないページでは、教え方のポイントを本文として出す
- ページを分けた台本では、答えのページのあとに「たしかめ」のページを置く（「問題 → いっしょに解く → 答え → たしかめ」）。答えが合ったかだけでなく、解き方が身についたかを確かめる。ページの `section` に `'たしかめ'` と書くと、見出しの上に札が出る。教え方のポイントには、できているかを見分けるところ（親が見るところ）を書く
  - たし算: どうやって答えを見つけたかを話してもらう → ちがう数の問題（2つの数を入れかえ、2つ目を1つ増やす。合計が10なら1つ減らす）をひとりで解く
  - 数える単元: 反対のはしから数え直す → 並べた中から、半分（切り上げ）の数だけ取ってもらう
- 台本の中では数字を変えない。数字は準備の画面で変える
- 左上の「×」で準備の画面へ戻る（進み具合は残る）
- 問題（`question`）は、台本の最初のページに出す
- いっしょに解く手順（`turns`）の1ステップは、「お子さんへの声かけ（`say`）」と、`reveal` があれば「📝 解説を確認する」の2ページになる
- 教え方のヒント（`how`）・声をかける前の準備（`do`）・このセリフの理由（`why`。書かなければ `prepare.point`）・避けたい声かけ（`avoid`）は、ページの下に閉じて出す（押したときだけ開く）
- 最後のページ（ページを分けた台本では、たしかめの最後のページ）には、準備の画面へ戻る「終わる」を置く（`flow` を使わない台本では、問題の一覧へ戻るボタンも置く）。最後まで終えた台本は、次に開くと最初のページから始まる
- 進み具合は、同じタブの中では保存される（sessionStorage）。準備の画面や一覧を見直しても、続きから再開できる。最後まで終えた問題は、次に開いたときに準備の画面から始まる。準備の画面で問題の数字を変えると、新しい数字の台本の最初から始まる
- ページを分けた台本で、保存するのがページの位置だけなら、[pagedFlow](src/components/pagedFlow.ts) を使うと保存とページ送りを書かずに済む（大学祭の問題がこの形）。選んだ方法なども覚えておく台本は、[見本](src/problems/sample/)のように自分で書く
- 台本を進めている間は、画面全体を橙にし、上の帯と見出しを隠し、スマホの画面が自動で消えないようにする
- `counters` を渡すと、台本の下におはじきの画面を出す。`renderVisual`（ステップごとの図）は、`counters` がないときだけ出す

```tsx
<TeachingScript
  prepare={{
    goal: '...',
    materials: ['おはじき'],
    point: '...',
    avoid: ['...'],
  }}
  question={{
    say: 'あかい りんごが 3こ、あおい りんごが 2こ あるよ。あわせて なんこ かな？',
    show: <p>あかい りんごが 3こ、あおい りんごが 2こ。あわせて なんこ？</p>,
  }}
  turns={[
    {
      say: 'ぜんぶで なんこ あるか、1こずつ かぞえてみよう',
      do: 'おはじきを5こ、お子さんの前に置く',
      how: 'おはじきを1つずつ指さしながら、いっしょに数えます。',
      why: '1つずつ数えると、数え飛ばしが減ります。',
      avoid: ['先に「5こだよ」と言う'],
    },
  ]}
/>
```

- `say`（言うこと）だけが必須。ほかは必要なステップにだけ書く
- `say` はお子さんにそのまま言える話し言葉で、1〜2文にする
- `do` は、声をかける**前に**親がすること（準備）
- `show` は問題（`question`）でだけ使う。答えの入った図は問題には入れず、ステップの `reveal` に書く
- 文言は、チームでのロールプレイ（親役・子役に分かれて台本どおりに進める）で詰まったところを直していく

## 階層を変える

階層は [src/curriculum.ts](src/curriculum.ts) の1ファイルに書く。問題のフォルダは階層と無関係なので、動かさない。

```ts
export const curriculum: Group[] = [
  {
    slug: 'grade-1',
    name: '小学1年生',
    children: [
      {
        slug: 'math',
        name: '算数',
        children: [
          unit('数の理解', 'counting', '数を正しく数えよう'),
          unit('たし算・ひき算', 'addition-within-10', '10までのたし算', [
            'addition-within-10',
          ]),
        ],
      },
    ],
  },
  { slug: 'grade-2', name: '小学2年生' },
]
```

- 一番上の段は学年で、その下に教科・単元を置く。ホームには学年が並び、学年を選ぶと教科の一覧が出る
- 分類は `slug`（URLになる）と `name`（画面に出る名前）を持ち、`children`（下の分類）と `problems`（問題ID）を入れられる
- 入れ子は何段でもよい。一覧には書いた順に並ぶ（じゅんび中の分類だけは、選べる分類の下にたたむ）
- 段を足す、並べ替える、問題を別の分類へ移すといった変更は、このファイルの書き換えだけでできる
- 分類のURLは `slug` を上からつないだもの（例: `/grade-1/math/addition-within-10`）。階層を変えると分類のURLは変わるが、問題のURLは変わらない
- `slug` は半角の英小文字・数字・ハイフンで付ける。一番上の段では `problems` と `festival` は使えない（問題・大学祭モードのURLと重なるため）
- 1つの問題は、1つの分類にだけ置く（2つに置くと、戻り先と見出しのラベルが、先に書いた分類になってしまう。`npm test` が見つける）
- 単元は `unit(タグ, slug, 名前, 問題ID)` で書く。問題IDを省くと「じゅんび中」になる。問題を作るときは、`slug` と同じ問題IDにする
- タグは `TAGS` に書いたものから選ぶ。一覧の行の小さな絵（[src/pages/TagPicture.tsx](src/pages/TagPicture.tsx)）が、`TAGS` の並び順で決まる
- 下の分類がなく、問題が1つだけの分類は、一覧から問題のページへ直接進む（分類のURLを開いても、問題のページへ移る）。問題のページの戻るボタンは、その分類を飛ばして1つ上の一覧へ戻る
- 問題が1つもない分類は「じゅんび中」と表示され、押せない。一覧では、選べる分類の下に「じゅんび中（件数）」としてたたむ
- 画面の色は [src/index.css](src/index.css) の `:root` の変数で決めている（台本の画面だけ、全面が橙）

### 型チェックのよくあるエラー

書き間違いは `npm run typecheck` が見つける。CIでも走るので、エラーが残ったままではマージできない。

| エラーメッセージ                                                    | 原因                                                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/curriculum.ts` で `Type '"..."' is not assignable to type ...` | 問題IDの書き間違いか、[src/problems/index.ts](src/problems/index.ts) にまだ足していない |
| `src/problems/index.ts` で `Property 'title' is missing ...`        | その問題の `index.tsx` に `export const title = '...'` がない                           |
| `src/problems/index.ts` で `lesson('...')` に `is not assignable`   | `units.ts` にない問題IDを書いている（書き間違いか、`units.ts` にまだ足していない）      |

## 大学祭モード

大学祭の展示用に、通常とは別の問題を出すモード。URLの先頭に `/festival` を付けると大学祭モードになる（例: `/festival`、`/festival/problems/<問題ID>`）。ページの構成は通常モードと同じで、違うのは使う階層だけ。通常モードは [src/curriculum.ts](src/curriculum.ts) の `curriculum` を、大学祭モードは同じファイルの `festivalCurriculum` を使う。

大学祭モードの一番上の段は、難易度（かんたん・ふつう・むずかしいの3段階）。大学祭モードのホームには難易度が並ぶ。

大学祭用の問題は、通常の問題と同じ手順で作る（[問題を追加する](#問題を追加する)）。違うのは手順4と5だけ。

- 手順4: `curriculum` ではなく `festivalCurriculum` の、置きたい難易度の `problems` に問題IDを足す。書き方は `curriculum` と同じで、難易度の下に `children` で教科などの段を足してもよい
- 手順5: `http://localhost:5173/festival/problems/<問題ID>` を開いて確かめる

そのほかの決まり:

- 大学祭用の問題は `festivalCurriculum` にだけ置く（`curriculum` に置くと、通常モードの一覧にも出る）
- 問題のページ自体は、どちらのモードのURLでも開ける。その問題を置いていないモードで開くと、戻るボタンはホームへ戻る
- 通常モードのホームの一番下に、大学祭モードへの入り口（「大学祭」）がある。大学祭モードから通常モードへ戻るボタンは置かない。会場ではQRコードなどで `/festival` を案内する。大学祭モードの中のリンクはすべて `/festival` 付きになるので、たどっている間は大学祭モードのまま
- 枠（`src/pages/`）の表示を大学祭モードで変えたいときは、[src/pages/festival.ts](src/pages/festival.ts) の `useFestival()` で今のモードを調べる

## 表示の仕組み

[src/App.tsx](src/App.tsx) がURLを見て、どのページを出すかを決める。

| URL                             | 出るページ                                                 | 中身の探し方                           |
| ------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| `/`                             | ホーム（[Home.tsx](src/pages/Home.tsx)）                   | `curriculum.ts` の一番上の段を並べる   |
| `/problems/<問題ID>`            | 問題（[ProblemDetail.tsx](src/pages/ProblemDetail.tsx)）   | `problems/index.ts` から問題IDで探す   |
| それ以外（例: `/grade-1/math`） | 分類の一覧（[GroupDetail.tsx](src/pages/GroupDetail.tsx)） | `curriculum.ts` を `slug` の順にたどる |

URLの先頭に `/festival` を付けると、同じ3種類のページが大学祭モードで出る（[大学祭モード](#大学祭モード)）。

探す処理は [src/pages/loaders.ts](src/pages/loaders.ts) にある。見つからなければ「ページが見つかりませんでした。」と表示される。

ページ（`src/pages/` の各ファイル）は `curriculum.ts` と `problems/index.ts` を直接読まず、`loaders.ts` の関数が返すデータだけを使う（階層や問題の一覧の形を変えたときに、直す場所を `loaders.ts` に限るため）。

問題のページでは、枠（`Layout.tsx` と `ProblemDetail.tsx`）が上の帯（戻るボタン）と単元名の見出しを出し、その下にその問題の画面（`src/problems/<問題ID>/index.tsx`）を表示する。

問題はビルドのときにプログラムへ含まれるので、問題を直しても、`main` へマージして再デプロイされるまで本番には反映されない。開発中（`npm run dev`）は、保存するたびに画面へ反映される。

## キャラクター（おやじい）

おやじいは [Rive](https://rive.app/) で作ったアニメーション。[public/oyajii.riv](public/oyajii.riv) を [src/components/oyajiiFile.ts](src/components/oyajiiFile.ts) がアプリを開いたときに1回だけ読み込み、[src/components/Oyajii.tsx](src/components/Oyajii.tsx) がそれを使い回して描く。画面に置くときは `<Oyajii className="…" />` と書き、大きさは `className` で決める。

ふだんは待機（`idle`）をくり返す。`motion` を渡すと、その値に変わるたびに次の動きを1回して、待機に戻る。

| `motion`  | 動き                     | 使っている場所                                             |
| --------- | ------------------------ | ---------------------------------------------------------- |
| `start`   | ぴょんと跳ねて手を振る   | 台本をはじめるときの幕（「はじめましょう」）               |
| `finish`  | 目を細めてお辞儀する     | 台本を終わるときの幕（「おつかれさまでした」）             |
| `correct` | 跳ねて腕を上げる         | 足し算の答えのページで「？」を押したとき                   |
| `talk`    | 口を動かして身ぶりをする | ページ送りのない台本の、声かけのカード（セリフのアイコン） |

`oyajii.riv` は Rive エディターから書き出したもので、これ自体は編集できない。絵や動きを変えるときは、Rive エディター上の元のファイルを直して「Export → For Runtime」で書き出し、`public/oyajii.riv` を差し替える。次の名前はアプリが使っているので変えない。

- ステートマシン：`State Machine 1`
- ViewModel：`Oyajii`（トリガー `start`・`finish`・`correct`・`talk`）

Rive の描画エンジン（wasm）は、外部の CDN からではなくアプリと一緒に配信する（本体の wasm が動かない古い端末のための予備も同じ）。JS と wasm の版は合わせる必要があるので、`package.json` には `@rive-app/react-canvas` だけを書き、wasm はそれが使っている `@rive-app/canvas` から読む。同じものを読んでいるかは [tests/oyajii.test.mjs](tests/oyajii.test.mjs) で確かめている。

## バックエンドについて

データの置き場所は、種類によって分ける。

- **問題**（全員に同じものを見せる内容）: ソースコードに書き、ビルドのときにプログラムへ含める。バックエンドは使わない
- **ユーザーごとのデータ**（学習履歴、ログインなど）: バックエンドで管理する。まだその機能がないので、バックエンドは導入していない。必要になった時点で導入する

Firestore（データベース）とそのエミュレータは、現在は使っていない。開発で起動するのは `npm run dev` だけでよい。Firebaseで使っているのは Hosting（ビルドしたファイルを置いて公開する場所）だけで、`firebase.json` と `.firebaserc` はそのための設定。

### これまでの経緯

- 最初は教材を Firestore に取り込んで配信していた。教材は読み取り専用でユーザーごとのデータもないため、ビルド時に読み込む形へ切り替えた。当時の実装（取り込みスクリプト、セキュリティルールとそのテスト、エミュレータ設定、PRプレビュー用のデータ分離）は、`firestore.rules` を削除したコミットの差分で確認できる
- 次に、教材を `content/` 配下の YAML + Markdown で管理し、全問題を同じ見た目のページで表示していた。問題ごとに個別の開発が入り、専用の見た目が必要になるため、問題を1問ずつ画面として書く今の形へ切り替えた。当時の実装（読み込みと検証のスクリプト）は、`content/` を削除したコミットの差分で確認できる
