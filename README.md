# おやおや (Oyaoya)

親子で一緒に取り組む学習支援アプリ。React + Vite + TypeScript 製。

教材コンテンツ（教科 → 単元 → 問題）は `content/` 配下の YAML + Markdown を正データとし、ビルド時にアプリへ読み込む。バックエンド（データベース）は現時点では使っていない。

## 全体像

教科 → 単元 → 問題と選んでいくと、問題文・解き方・教え方・声掛け例が表示される、読むだけのサイト。ログインや入力欄はない。大きく2つの部分でできている。

- **教材**（[content/](content/)）: 問題文などの文章を書いたテキストファイル。プログラムは書かない
- **画面**（[src/](src/)）: 教材をどう並べて表示するかを決めるプログラム

この2つを、ブラウザで開けるファイル一式に変換する作業を「ビルド」と呼ぶ。教材はビルドのときに画面のプログラムへ埋め込まれるので、表示中にサーバーへ教材を取りに行くことはない。

### やりたいこと別：どこを触るか

| やりたいこと                           | 触る場所                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| 教科・単元・問題を追加する、文章を直す | [content/](content/)（書き方は[コンテンツ（教材）](#コンテンツ教材)）                    |
| 画面の文言や並びを変える               | [src/pages/](src/pages/)                                                                 |
| 色・余白・文字サイズを変える           | [src/index.css](src/index.css)                                                           |
| 新しいページ（URL）を増やす            | [src/App.tsx](src/App.tsx) と [src/pages/](src/pages/)                                   |
| 教材の取り出し方を増やす（例: 検索）   | [src/content/api.ts](src/content/api.ts)                                                 |
| 教材の項目を増やす（例: 難易度）       | [scripts/content.ts](scripts/content.ts) と [src/content/types.ts](src/content/types.ts) |
| 画面で使う画像を置く                   | [public/](public/)                                                                       |
| CI・デプロイの設定を変える             | `.github/` と `firebase.json`（オーナーのレビューが必要）                                |

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

ソースコードも `content/` の教材も、保存すると画面に反映される。

## Lint・フォーマット・型チェック

```bash
npm run lint          # ESLintでチェック
npm run format        # Prettierで整形
npm run format:check  # 整形が必要な箇所がないかチェック（CI向け）
npm run typecheck     # 型チェック
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
   - **CI**（[ci.yml](.github/workflows/ci.yml)）: `lint`（ESLint・Prettier・コンテンツ検証）/ `typecheck` / `build`。すべて成功しないとマージできない
   - **プレビュー**: そのPRの内容をビルドしたプレビューURLがコメントされる（7日で自動失効）
   - **AIレビュー**（CodeRabbit）: 補助的な指摘がコメントされる。対応は必須ではなく、採否はPR作成者とレビュアーが判断する（設定は [.coderabbit.yaml](.coderabbit.yaml)）
3. レビュアーはCI結果とコードを見て、プレビューURLで実際に操作して確認し、Approveする
4. `main` へマージすると本番（`https://oyaoya-844ea.web.app`）へ自動デプロイされる

pushする前に手元で確かめるなら:

```bash
npm run lint && npm run format:check && npm run content:check && npm run build
```

依存パッケージとGitHub Actionsは、Dependabotが週1回更新PRを作る（[dependabot.yml](.github/dependabot.yml)）。CIが通れば通常のPRと同じようにレビューしてマージする。DependabotのPRにはプレビューは作られない。

workflowで使う外部のActionsは、タグ（`@v7` など）ではなくコミットSHAで固定している（タグは後から別のコードに差し替えられる可能性があるため）。行末のコメントが対応するバージョンで、SHAとコメントの更新はDependabotが行う。Actionsを追加するときも同じ形式で書く。

`.github/` や `firebase.json` などCI・デプロイに関わるファイルは、[CODEOWNERS](.github/CODEOWNERS) によりオーナーのレビューが必要。

### テストについて

現時点では自動テストを置いていない。画面の見た目や構成は変更が多く、テストの維持コストが効果を上回るため、PRではCI（lint・型チェック・ビルド）とプレビューURLでの目視確認で品質を担保する。

次の場合はテストを追加する。

- 正誤判定や採点など、分岐のあるロジックを書くとき → そのロジックだけを対象にしたユニットテスト
- バックエンドを導入してユーザーごとのデータを扱うとき → アクセス権限（セキュリティルール）のテスト

## コンテンツ（教材）

フォルダの入れ子が、そのまま「教科 → 単元 → 問題」になる。

```text
content/
  math/                          # 教科
    _meta.yaml                   #   教科の名前と並び順
    unit-01-addition-1digit/     # 単元
      _meta.yaml                 #   単元の名前と並び順
      problem-01/                # 問題
        meta.yaml                #   問題のタイトルと並び順
        question.md              #   問題文
        how_to_solve.md          #   解き方
        how_to_teach.md          #   教え方（親向け）
        example_phrases.md       #   声掛け例（親向け）
```

### 教材を追加する手順

1. 既存の問題フォルダ（例: `content/math/unit-01-addition-1digit/problem-01`）をコピーして、フォルダ名を変える
2. `meta.yaml` の `title` と `order`、4つの `.md` を書き換える
3. `npm run dev` で表示を確かめる
4. `npm run content:check` で不備がないか確かめる

単元や教科を増やすときも同じで、フォルダを作って `_meta.yaml` を置く。

### フォルダ名

- フォルダ名（slug と呼ぶ）がそのままURLになる（`/<教科>/<単元>/<問題>`。例: `/math/unit-01-addition-1digit/problem-01`）
- 半角の英小文字・数字・ハイフンで付ける
- 公開後にフォルダ名を変えるとURLも変わるので、変えない
- `content/` の中のフォルダは、すべて教科・単元・問題として扱われる。画像用などの別のフォルダを置くと、メタファイルがないというエラーになる

### YAMLファイル（名前と並び順）

`項目名: 値` を1行に1つずつ書く。コロンの後ろには半角スペースが必要。

```yaml
name: 算数
order: 1
```

| 対象       | ファイル名                           | 必須の項目 | 任意の項目 |
| ---------- | ------------------------------------ | ---------- | ---------- |
| 教科・単元 | `_meta.yaml`（先頭にアンダースコア） | `name`     | `order`    |
| 問題       | `meta.yaml`（アンダースコアなし）    | `title`    | `order`    |

- `name` / `title` は画面に表示される名前
- `order` は一覧での並び順。小さいほど上に出る。省略すると0になり、同じ値ならフォルダ名の順に並ぶ
- `order` は数字で書く。`order: "1"` のように引用符で囲むとエラーになる

### Markdownファイル（本文）

- 4つのファイルは名前が決まっていて、すべて必須
- 「問題」「解き方」などの見出しは画面側が付けるので、本文だけを書く（1行目を `#` の見出しにしなくてよい）
- 使える書き方は、段落・箇条書き（`-`）・番号付きリスト（`1.`）・太字（`**太字**`）・リンク
- 段落を分けるときは、間に空行を入れる。空行のない改行は、画面では改行されない
- 表とHTMLタグは使えない
- 教材の中に画像を入れる仕組みはまだない（`content/` に画像を置いても表示されない）

### 検証とよくあるエラー

```bash
npm run content:check   # content/ に不備がないか検証する
```

同じ検証がCIと `npm run build` でも走るので、不備のある教材はマージもデプロイもされない。

| エラーメッセージ                                         | 原因                                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `meta file not found: ...`                               | `_meta.yaml` / `meta.yaml` がないか、ファイル名が違う。`content/` に教材以外のフォルダを置いたときも出る |
| `"name" is missing in ...` / `"title" is missing in ...` | 必須の項目が書かれていないか、値が空                                                                     |
| `"order" must be a number in ...`                        | `order` が数字になっていない                                                                             |
| `required content file not found: ...`                   | 4つの `.md` のどれかがないか、ファイル名が違う                                                           |

### 読み込みの仕組み

教材が画面に表示されるまでの流れ。

```text
content/ のファイル
   ↓ 1. 読み込んで検証し、1つのデータにまとめる            scripts/content.ts
   ↓ 2. そのデータを画面のプログラムから読めるようにする    vite.config.ts
   ↓ 3. 必要な部分だけを取り出す関数を用意する              src/content/api.ts
   ↓ 4. URLに応じて、どの関数とどのページを使うかを決める   src/App.tsx
   ↓ 5. 受け取ったデータを表示する                          src/pages/*.tsx
ブラウザの画面
```

たとえば `/math/unit-01-addition-1digit/problem-01` を開くと、次の順に動く。

1. [src/App.tsx](src/App.tsx) がURLを教科・単元・問題の3つに分けて、`fetchProblem` を呼ぶ
2. [src/content/api.ts](src/content/api.ts) の `fetchProblem` が、まとめられたデータから該当する問題を探す。見つからなければ「ページが見つかりませんでした」と表示される
3. [src/pages/ProblemDetail.tsx](src/pages/ProblemDetail.tsx) が問題を受け取り、4つの本文をMarkdownから見出しや箇条書きに変換して表示する

上の2でできるデータは、プログラムの中では `virtual:content` という名前で読み込める（[vite.config.ts](vite.config.ts) のプラグインが用意している）。

**アプリから教材を読むのは [src/content/api.ts](src/content/api.ts) だけ**にする。ページやコンポーネントから `virtual:content` を直接importせず、必要な関数を `api.ts` に追加して使う（将来バックエンドへ移すときに、この1ファイルの差し替えで済ませるため）。

教材はビルドのときに埋め込まれるので、教材を直しても、`main` へマージして再デプロイされるまで本番には反映されない。開発中（`npm run dev`）は、`content/` を保存するたびに画面が自動で再読み込みされる。

## バックエンドについて

以前は教材を Firestore に取り込んで配信していたが、教材は読み取り専用でユーザーごとのデータもないため、ビルド時の読み込みに切り替えた。学習履歴やログインなど、ユーザーごとのデータが必要になった時点でバックエンドを導入する。

Firestore を使っていた頃の実装（取り込みスクリプト、セキュリティルールとそのテスト、エミュレータ設定、PRプレビュー用のデータ分離）は、`firestore.rules` を削除したコミットの差分で確認できる。
