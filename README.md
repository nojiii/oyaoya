# おやおや (Oyaoya)

親子で一緒に取り組む学習支援アプリ。React + Vite + TypeScript 製。

教材コンテンツ（教科 → 単元 → 問題）は `content/` 配下の YAML + Markdown を正データとし、取り込みスクリプトで Firestore に同期してアプリから読み込む。

## 開発環境

- Node.js 24系を使用（`.nvmrc` 参照。nvm利用時は `nvm use`）
- VSCode使用時は、開くと推奨拡張機能（ESLint / Prettier / EditorConfig）の導入を促される（`.vscode/extensions.json`）
  - 通知が出ない場合は、拡張機能タブの「推奨」欄からESLint・Prettierを手動でインストールしてください
  - **これらの拡張機能を有効化しないと、保存時の自動フォーマット・自動修正は動作しません**
- 保存時にPrettierでの自動フォーマット、ESLintの自動修正が有効（`.vscode/settings.json`。上記拡張機能のインストールが前提）

## 開発

`npm run dev` のアプリはローカルの Firestore エミュレータに接続する（Java が必要）。ターミナルを2つ使う。

```bash
npm install

# ターミナル1: エミュレータ起動（http://127.0.0.1:4000/ で Emulator UI）
npm run emulators

# ターミナル2: content/ をエミュレータへ取り込んでから開発サーバー起動
npm run content:import
npm run dev
```

エミュレータのデータは停止すると消えるため、起動し直したら `npm run content:import` を再実行する。

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

## ビルド

```bash
npm run build
```

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
npm run content:import -- --production              # 本番Firestoreへ取り込み（要 gcloud 認証）
```

## Firestore 運用方針

- **ローカル開発は Firebase Local Emulator Suite を使う**（本番データには触れない）。起動後 `http://127.0.0.1:4000/` の Emulator UI でデータを自由に確認・編集できる。コラボレーターはこの環境で自由にスキーマを試行錯誤してよい
- クライアントからは教材の読み取りのみ許可し、書き込みは取り込みスクリプト（Admin SDK）経由に限る
- **本番Firestoreへのデータ形式変更は、必ずコードの変更 → PRレビューを経て行う**（Firebase Consoleでの直接編集はしない）
- 本番Firebase Consoleへの招待は、通常は **閲覧者(Viewer)** 権限までに留める。直接編集が必要な運用が生じた場合のみ、限定的に編集者(Editor)権限を検討する
- ルール定義は [firestore.rules](firestore.rules)、インデックス定義は [firestore.indexes.json](firestore.indexes.json)
