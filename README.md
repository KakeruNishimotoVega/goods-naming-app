# LOWYA商品命名アプリ

従来のGAS + スプレッドシート構成からSupabase + TypeScript構成への置き換えプロジェクト。

## 概要

このアプリは、商品命名のルールに基づいて自動的に商品名とページ名を生成するツールです。カテゴリごとに異なる命名ルールを設定でき、NGワードのチェックも自動で行います。

## 主な機能

### 1. 命名画面
- カテゴリ選択
- 動的フォーム生成（テキスト、単一選択、複数選択、True/False）
- リアルタイム命名生成
- NGワードチェックと警告表示
- Google検索連携
- フォームリセット
- クリップボードコピー

### 2. ルール設定画面
- カテゴリごとのルール一覧表示
- 入力項目（Type）の追加・編集・削除
- キーワード（選択肢）の管理
- 命名ルール（Regulation）の編集
- プレースホルダー挿入機能

### 3. NGワード管理画面
- NGワード一覧表示
- NGワードの追加・編集・削除
- 理由の記録

## 技術スタック

- **バックエンド**: Google Apps Script (TypeScript)
- **データベース**: Supabase (PostgreSQL)
- **フロントエンド**: HTML/CSS/JavaScript
- **ビルドツール**: esbuild
- **デプロイツール**: clasp

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/vega-corporation/lowya-goods-naming-app.git
cd lowya-goods-naming-app
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
GASのスクリプトプロパティに以下を設定：
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

詳細は [DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) を参照。

### 4. ビルド
```bash
npm run build
```

### 5. デプロイ
```bash
npm run deploy
```

## ドキュメント

- [REPLACE_PLAN.md](docs/REPLACE_PLAN.md) - 全7フェーズの開発計画
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - システムアーキテクチャ
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - データベーススキーマ
- [DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) - デプロイ手順
- [AI_MAINTENANCE_GUIDE.md](docs/AI_MAINTENANCE_GUIDE.md) - AI保守運用ガイド
- [API_SPEC.md](docs/API_SPEC.md) - API仕様書

## 開発

### プロジェクト構造
```
src/
├── api/              # バックエンドAPI（GAS関数）
├── lib/              # 共通ライブラリ
├── types/            # TypeScript型定義
├── views/            # HTMLテンプレート
├── styles/           # CSSファイル
└── scripts/          # JavaScriptファイル
```

### ビルドシステム
- `build.js` - TypeScriptをバンドル
- `build-html.js` - HTML/CSS/JSを統合

### コマンド
```bash
npm run build    # ビルド
npm run deploy   # ビルド + デプロイ
npm run test     # テスト実行
```

## AI主導の保守運用

このプロジェクトはAI（Claude）による保守運用を前提に設計されています。

- **モジュール分割**: 1ファイル = 1責務、最大500行
- **トークン効率**: 必要なファイルだけを読む
- **ナレッジ蓄積**: `docs/` にすべての仕様を文書化
- **明確な命名**: 説明的な変数・関数名

詳細は [AI_MAINTENANCE_GUIDE.md](docs/AI_MAINTENANCE_GUIDE.md) を参照。

## 開発進捗

- ✅ フェーズ0: プロジェクト構造とドキュメント整備
- ✅ フェーズ1: データベース・バックエンド基盤
- ✅ フェーズ2: フロントエンド基盤
- ✅ フェーズ3: 命名画面（メイン機能）
- ✅ フェーズ4: ルール設定画面
- ✅ フェーズ5: NGワード管理画面
- ✅ フェーズ6: UI/UX最適化
- ✅ フェーズ7: テスト・デプロイ

## ライセンス

ISC

## 作者

VEGA Corporation

---

**Co-Authored-By: Claude Opus 4.6**
