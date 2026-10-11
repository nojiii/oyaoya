# おやおや (Oyaoya)

親子で一緒に取り組む学習支援アプリ。React + Vite + TypeScript 製。

教材コンテンツ（教科 → 単元 → 問題）は `content/` 配下の YAML + Markdown を正データとし、ビルド時にアプリへ読み込む。バックエンド（データベース）は現時点では使っていない。

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

## コンテンツ

```text
content/
  <教科slug>/_meta.yaml               # name, order
  <教科slug>/<単元slug>/_meta.yaml    # name, order
  <教科slug>/<単元slug>/<問題slug>/
    meta.yaml                         # title, order
    question.md / how_to_solve.md / how_to_teach.md / example_phrases.md
```

ディレクトリ名（slug）がそのままURLになる（`/<教科>/<単元>/<問題>`）。一覧は `order` の小さい順（同じなら slug 順）に並ぶ。

```bash
npm run content:check   # content/ に不備がないか検証する（CIでも実行される）
```

必須の項目やファイルが欠けていると、`content:check` と `npm run build` がエラーになる。

### 読み込みの仕組み

- [scripts/content.ts](scripts/content.ts) が `content/` を読み込んで検証する
- [vite.config.ts](vite.config.ts) のプラグインがその結果を `virtual:content` というモジュールとしてアプリに渡す
- **アプリから教材を読むのは [src/content/api.ts](src/content/api.ts) だけ**にする。ページやコンポーネントから `virtual:content` を直接importせず、必要な関数を `api.ts` に追加して使う（将来バックエンドへ移すときに、この1ファイルの差し替えで済ませるため）

## バックエンドについて

以前は教材を Firestore に取り込んで配信していたが、教材は読み取り専用でユーザーごとのデータもないため、ビルド時の読み込みに切り替えた。学習履歴やログインなど、ユーザーごとのデータが必要になった時点でバックエンドを導入する。

Firestore を使っていた頃の実装（取り込みスクリプト、セキュリティルールとそのテスト、エミュレータ設定、PRプレビュー用のデータ分離）は、`firestore.rules` を削除したコミットの差分で確認できる。
