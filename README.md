# おやおや (Oyaoya)

親子で一緒に取り組む学習支援アプリ。React + Vite + TypeScript 製。

現在は方向性を模索中のプロトタイプで、コンテンツはバックエンドを持たず `src/content/data.ts` にコードとして直書きしている。

## 開発環境

- Node.js 24系を使用（`.nvmrc` 参照。nvm利用時は `nvm use`）
- VSCode使用時は、開くと推奨拡張機能（ESLint / Prettier / EditorConfig）の導入を促される（`.vscode/extensions.json`）
  - 通知が出ない場合は、拡張機能タブの「推奨」欄からESLint・Prettierを手動でインストールしてください
  - **これらの拡張機能を有効化しないと、保存時の自動フォーマット・自動修正は動作しません**
- 保存時にPrettierでの自動フォーマット、ESLintの自動修正が有効（`.vscode/settings.json`。上記拡張機能のインストールが前提）

## 開発

```bash
npm install
npm run dev
```

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
