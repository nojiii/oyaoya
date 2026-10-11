# おやおや (Oyaoya)

親子で一緒に取り組む学習支援アプリ。React + Vite + TypeScript 製。

教材コンテンツ（教科 → 単元 → 問題）は `content/` 配下の YAML + Markdown を正データとし、取り込みスクリプトで Firestore に同期してアプリから読み込む。

## 開発環境

- Node.js 24系を使用（`.nvmrc` 参照。nvm利用時は `nvm use`）。それより古いNode.jsでは `npm install` がエラーで止まる（`.npmrc` の `engine-strict`）
- Java（JDK）21以上が必要（Firestore エミュレータの実行に使う）
  - Windowsでエミュレータ終了後も「Port 8080 is not open」と出て再起動できない場合は、`where java` の先頭が `...\Oracle\Java\javapath\java.exe` になっていないか確認する。これはJDK本体を別プロセスで起動するランチャーで、エミュレータ停止時にJDK本体が残ってしまう。環境変数 `PATH` でJDK本体の `bin`（例: `C:\Program Files\Java\jdk-21\bin`）を先頭にすると解消する
- VSCode使用時は、開くと推奨拡張機能（ESLint / Prettier / EditorConfig）の導入を促される（`.vscode/extensions.json`）
  - 通知が出ない場合は、拡張機能タブの「推奨」欄からESLint・Prettierを手動でインストールしてください
  - **これらの拡張機能を有効化しないと、保存時の自動フォーマット・自動修正は動作しません**
- 保存時にPrettierでの自動フォーマット、ESLintの自動修正が有効（`.vscode/settings.json`。上記拡張機能のインストールが前提）

## 開発

ローカルのアプリは Firestore エミュレータに接続する（本番データには触れない）。

```bash
npm install

# エミュレータ起動 → content/ の取り込み → 開発サーバー起動 をまとめて行う
npm run dev:full
```

- アプリ: `http://localhost:5173/`
- Emulator UI: `http://127.0.0.1:4000/`（データの確認・編集）
- `Ctrl+C` でエミュレータごと終了する

`content/` を編集したら、別のターミナルで `npm run content:import` を実行すると起動中のエミュレータへ反映される。

エミュレータと開発サーバーを別々に動かしたい場合は、ターミナルを2つ使う。

```bash
# ターミナル1: エミュレータ起動
npm run emulators

# ターミナル2: content/ をエミュレータへ取り込んでから開発サーバー起動
npm run content:import
npm run dev
```

エミュレータのデータは停止すると消えるため、起動し直したら `npm run content:import` を再実行する（`dev:full` は毎回自動で取り込む）。

## Lint・フォーマット

```bash
npm run lint          # ESLintでチェック
npm run format        # Prettierで整形
npm run format:check  # 整形が必要な箇所がないかチェック（CI向け）
```

コード整形ルール（詳細は [.prettierrc.json](.prettierrc.json) / [.editorconfig](.editorconfig)）:

- セミコロンなし
- シングルクォート使用
- インデントはスペース2つ
- 改行コードはLF、文字コードはUTF-8
- ESLintの整形系ルールはPrettierと衝突しないよう無効化済み（`eslint-config-prettier`）

## テスト

```bash
npm run typecheck       # 型チェック
npm test                # Firestoreに依存しないテスト（src/**/*.test.ts）
npm run test:firestore  # エミュレータを起動して tests/firestore/ を実行し、終わったら停止する
```

| 種類               | 置き場所                                                       | 内容                                                                           |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ユニットテスト     | `src/` 配下に `<対象>.test.ts`                                 | Firestoreを使わないロジック（現時点では対象がないため0件）                     |
| 統合テスト         | [tests/firestore/api.test.ts](tests/firestore/api.test.ts)     | `src/content/api.ts` がエミュレータ上のデータを期待どおりに読めるか            |
| セキュリティルール | [tests/firestore/rules.test.ts](tests/firestore/rules.test.ts) | `firestore.rules` の許可・拒否（読み取りのみ可、書き込みと未定義のパスは拒否） |

`npm run test:firestore` は8080番ポートでエミュレータを起動するため、`npm run dev:full` や `npm run emulators` を動かしている間は実行できない（先に停止する）。

## ビルド

```bash
npm run build
```

## PRとレビューの流れ

`main` へは直接pushせず、ブランチを切ってPull Requestを作る。

1. `main` から作業ブランチを作って変更し、pushしてPRを作成する（[テンプレート](.github/pull_request_template.md)に沿って記入）
2. 自動で次が走る
   - **CI**（[ci.yml](.github/workflows/ci.yml)）: `lint`（ESLint・Prettier・コンテンツ検証）/ `typecheck` / `test`（ユニット・Firestoreエミュレータ）/ `build`。すべて成功しないとマージできない
   - **プレビュー**: PR専用のプレビューURLがコメントされる（下記「デプロイとプレビューの仕組み」）
   - **AIレビュー**（CodeRabbit）: 補助的な指摘がコメントされる。対応は必須ではなく、採否はPR作成者とレビュアーが判断する（設定は [.coderabbit.yaml](.coderabbit.yaml)）
3. レビュアーはCI結果とコードを見て、プレビューURLで実際に操作して確認し、Approveする
4. `main` へマージすると本番へ自動デプロイされる

pushする前に手元で確かめるなら:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:firestore
```

依存パッケージとGitHub Actionsは、Dependabotが週1回更新PRを作る（[dependabot.yml](.github/dependabot.yml)）。CIが通れば通常のPRと同じようにレビューしてマージする。DependabotのPRにはプレビューは作られない。

`firestore.rules` や `.github/` など権限・デプロイに関わるファイルは、[CODEOWNERS](.github/CODEOWNERS) によりオーナーのレビューが必要。

## コンテンツ

```text
content/
  <教科slug>/_meta.yaml               # name, order
  <教科slug>/<単元slug>/_meta.yaml    # name, order
  <教科slug>/<単元slug>/<問題slug>/
    meta.yaml                         # title, order
    question.md / how_to_solve.md / how_to_teach.md / example_phrases.md
```

Firestore 上は `subjects/{教科}/units/{単元}/problems/{問題}` に同じ階層で保存され、URL も `/<教科>/<単元>/<問題>` になる。

```bash
npm run content:check                               # 検証のみ（Firestoreに書き込まない。CI向け）
npm run content:import                              # エミュレータへ取り込み
npm run content:import -- --root previews/pr-1      # エミュレータの previews/pr-1/ 配下へ取り込み
npm run content:remove -- --root previews/pr-1      # previews/pr-1/ 配下を削除
```

取り込みは同期方式で、`content/` から消したドキュメントは Firestore からも削除される。`--production` を付けると本番 Firebase プロジェクトに接続する（通常は CI のみが使う）。

## デプロイとプレビューの仕組み

| タイミング   | Firestore（コンテンツ）                       | Hosting                                                       |
| ------------ | --------------------------------------------- | ------------------------------------------------------------- |
| PR作成・更新 | `previews/pr-<番号>/subjects/...` に取り込み  | プレビューURL（PRにコメントされる）。そのPR専用のデータを読む |
| mainへマージ | ルール反映 → `subjects/...`（本番）に取り込み | 本番URL（`https://oyaoya-844ea.web.app`）                     |
| PRクローズ   | `previews/pr-<番号>/` を削除                  | プレビューURLは7日で自動失効                                  |

PRごとにデータの置き場所が分かれているため、複数のPRを同時に開いてもプレビュー同士は干渉しない。クライアントが読むパスは、ビルド時の環境変数 `VITE_CONTENT_ROOT` で切り替わる（未設定なら本番パス）。

## Firestore 運用方針

- **ローカル開発は Firebase Local Emulator Suite を使う**（本番データには触れない）。起動後 `http://127.0.0.1:4000/` の Emulator UI でデータを自由に確認・編集できる。コラボレーターはこの環境で自由にスキーマを試行錯誤してよい
- クライアントからは教材の読み取りのみ許可し、書き込みは取り込みスクリプト（Admin SDK）経由に限る
- **アプリから Firestore を触るのは [src/content/api.ts](src/content/api.ts) だけ**にする。ページやコンポーネントから `firebase/firestore` を直接呼ばず、必要な関数を `api.ts` に追加して使う（パスの切り替えやデータ形式の変更をこの1ファイルに閉じ込めるため）
- **本番Firestoreへのデータ形式変更は、必ずコードの変更 → PRレビューを経て行う**（Firebase Consoleでの直接編集はしない）
- 本番Firebase Consoleへの招待は、通常は **閲覧者(Viewer)** 権限までに留める。直接編集が必要な運用が生じた場合のみ、限定的に編集者(Editor)権限を検討する
- ルール定義は [firestore.rules](firestore.rules)、インデックス定義は [firestore.indexes.json](firestore.indexes.json)
