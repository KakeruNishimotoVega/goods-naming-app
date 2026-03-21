# LOWYA商品命名アプリ リプレイス計画書

## プロジェクト概要
従来のGAS + スプレッドシート構成からSupabase + TypeScript構成への置き換え

## AI保守運用を前提とした設計方針
このプロジェクトはリリース後もAIによる保守運用を想定しています。以下の原則に従って実装します：

### 1. モジュール分割とファイル構造
- **関心事の分離**: データベース操作、ビジネスロジック、フロントエンドを明確に分離
- **適切な粒度**: 1ファイル = 1責務（例: `src/api/categories.ts`, `src/api/types.ts`）
- **トークン効率**: AIが必要なファイルだけを読めるよう、機能単位で分割

### 2. AIフレンドリーなコーディング
- **明確な命名**: 変数・関数名は説明的に（`getCategorySchema` > `getSchema`）
- **型安全性**: TypeScriptの型定義を徹底し、AIが推論しやすいコードに
- **コメントの戦略的配置**: 複雑なロジックやビジネスルールには必ずコメント
- **一貫性**: コーディングスタイルを統一（CLAUDE.mdに記載）

### 3. ナレッジ蓄積戦略
- **`docs/`ディレクトリ**: アーキテクチャ、API仕様、ビジネスルールを文書化
- **`MEMORY.md`**: AIが参照すべき重要な設計判断や制約を記録
- **`DATABASE_SCHEMA.md`**: DBスキーマを最新状態に保つ
- **インラインドキュメント**: JSDocスタイルで関数の意図を明記

### 4. Skills活用の準備
- 将来的にカスタムSkillを作成し、定型作業を自動化
- 例: `/add-api-endpoint`, `/update-schema`, `/generate-types`

---

## フェーズ0: プロジェクト構造とドキュメント整備
### 0.1 ファイル構造の設計
- [x] `src/api/` ディレクトリ作成とモジュール分割設計 ✅
- [x] `src/lib/` ディレクトリ作成（共通ライブラリ） ✅
- [x] `src/types/` ディレクトリ作成（TypeScript型定義） ✅
- [x] 各モジュールの責務を明確化 ✅

### 0.2 ドキュメント整備
- [x] `docs/API_SPEC.md` の作成（API仕様書のテンプレート） ✅
- [x] `docs/ARCHITECTURE.md` の作成（アーキテクチャドキュメント） ✅ (既存)
- [x] `MEMORY.md` に初期設計方針を記録 ✅

### 0.3 共通ライブラリの準備
- [x] `src/lib/supabase.ts` - Supabase接続ヘルパー作成 ✅
- [x] `src/lib/utils.ts` - 汎用ユーティリティ作成 ✅
- [x] `src/types/index.ts` - 共通型定義作成 ✅

---

## フェーズ1: データベース・バックエンド基盤
### 1.1 データベーススキーマの検証と調整
- [x] 現在のSupabaseスキーマを確認（`DATABASE_SCHEMA.md`と実際のDB） ✅
- [x] selection_typeの値を統一（text → TEXT） ✅
- [x] マイグレーション適用（normalize_selection_type_values） ✅

### 1.2 カテゴリ関連API（`src/api/categories.ts`）
- [x] `getCategories()` - カテゴリ一覧取得 ✅
- [x] `getSchemaForCategory(categoryId)` - カテゴリ別のスキーマ取得 ✅
- [x] `createNewCategory(wizardData)` - ウィザードによるカテゴリ作成 ✅

### 1.3 Type（入力項目）管理API（`src/api/types.ts`）
- [x] `addType(categoryId, typeData)` - 新規項目追加 ✅
- [x] `updateType(typeObject)` - 項目の更新 ✅
- [x] `deleteType(typeId)` - 項目の削除 ✅

### 1.4 Keyword（選択肢）管理API（`src/api/keywords.ts`）
- [ ] `addKeyword(typeId, keyword)` - キーワード追加
- [ ] `updateKeyword(typeId, keywordData)` - キーワード更新
- [ ] `deleteKeyword(payload)` - キーワード削除

### 1.5 Regulation（命名ルール）管理API（`src/api/regulations.ts`）
- [ ] `updateRegulation(regulationObject)` - ルールの更新

### 1.6 NGワード管理API（`src/api/ngwords.ts`）
- [ ] `getNgWords()` - NGワード一覧取得
- [ ] `addNgWord(word, reason)` - NGワード追加
- [ ] `updateNgWord(id, word, reason)` - NGワード更新
- [ ] `deleteNgWord(id)` - NGワード削除

### 1.7 命名生成API（`src/api/naming.ts`）
- [ ] `generateNames(formData)` - 商品名・ページ名生成
- [ ] NGワードチェック機能の組み込み

---

## フェーズ2: フロントエンド基盤
### 2.1 HTMLビルドシステムの構築
- [ ] `build-html.js` の作成（CSS/HTML/JS統合スクリプト）
- [ ] `src/views/` ディレクトリ作成とレイアウト分割
- [ ] `src/styles/` ディレクトリ作成とCSS分割
- [ ] `src/scripts/` ディレクトリ作成とJS分割
- [ ] ビルドコマンドの統合（`npm run build`）

### 2.2 既存HTMLの分割作業
- [ ] `docs/raw/index.html` の構造分析
- [ ] 共通レイアウト → `src/views/layout.html`
- [ ] 命名画面 → `src/views/naming.html`
- [ ] 設定画面 → `src/views/settings.html`
- [ ] NGワード管理 → `src/views/ngwords.html`

### 2.3 CSSの整理とトンマナ定義
- [ ] CSS変数の抽出 → `src/styles/variables.css`
- [ ] カラーパレットの文書化
- [ ] 基本スタイル → `src/styles/base.css`
- [ ] コンポーネント → `src/styles/components.css`
- [ ] Tailwind CSS導入（CDN版で試験）

### 2.4 JavaScriptの分割
- [ ] 共通ユーティリティ → `src/scripts/utils.js`
- [ ] アプリケーションコア → `src/scripts/app.js`
- [ ] 命名画面ロジック → `src/scripts/naming.js`
- [ ] 設定画面ロジック → `src/scripts/settings.js`

### 2.5 Google Apps ScriptのHTML配信設定
- [ ] `doGet()`関数でHTMLを配信
- [ ] 環境変数（Supabase URL/キー）をフロントエンドに安全に渡す方法の実装

---

## フェーズ3: 命名画面（メイン機能）
### 3.1 カテゴリ選択機能
- [ ] カテゴリドロップダウンの実装
- [ ] カテゴリ変更時のスキーマ読み込み

### 3.2 動的フォーム生成
- [ ] 基本フィールド（Fields）の表示
- [ ] Type（入力項目）の動的レンダリング
  - [ ] テキスト入力
  - [ ] 単一選択（ラジオボタン/チップUI）
  - [ ] 複数選択（チェックボックス/チップUI）
  - [ ] True/Falseトグル

### 3.3 リアルタイム命名生成
- [ ] フォーム入力値の監視
- [ ] `generateNames()`のフロントエンド呼び出し
- [ ] 結果のフローティング表示
- [ ] 文字数カウント表示

### 3.4 NGワードチェック機能
- [ ] 生成結果に対するNGワードの検出
- [ ] 警告バッジとツールチップ表示

### 3.5 Google検索連携
- [ ] キーワードにGoogle検索リンクを追加
- [ ] ホバー時のアイコン表示

### 3.6 フォームリセット機能
- [ ] リセット確認モーダル
- [ ] すべての入力値のクリア

### 3.7 結果の確定・コピー機能
- [ ] 「これで決定する」モーダル
- [ ] クリップボードコピー機能

---

## フェーズ4: ルール設定画面
### 4.1 カテゴリ選択とスキーマ表示
- [ ] カテゴリ選択ドロップダウン
- [ ] 現在のルール一覧表示（Type一覧）

### 4.2 Type（入力項目）の編集
- [ ] 編集モーダルの実装
- [ ] 優先順位の変更
- [ ] 必須/任意の切り替え
- [ ] SelectionTypeの変更
- [ ] Descriptionの編集

### 4.3 Type（入力項目）の追加
- [ ] 追加モーダルの実装
- [ ] 新規項目の保存
- [ ] 優先順位の自動調整

### 4.4 Type（入力項目）の削除
- [ ] 削除確認
- [ ] 関連するKeywordsの連鎖削除
- [ ] 優先順位の再計算

### 4.5 Keyword（選択肢）の管理
- [ ] キーワード管理モーダル
- [ ] ドラッグ&ドロップでの並び替え
- [ ] キーワードの追加
- [ ] キーワードの編集
- [ ] キーワードの削除
- [ ] 優先順位の保存

### 4.6 Regulation（命名ルール）の編集
- [ ] ルール編集モーダル
- [ ] プレースホルダーボタンの生成
- [ ] 使用済みプレースホルダーの検出
- [ ] ルールの保存

### 4.7 カテゴリ新規追加ウィザード
- [ ] ステップ1: カテゴリ名入力
- [ ] ステップ2: Type（項目）の追加
- [ ] ステップ3: 命名ルールの設定
- [ ] プレースホルダーボタンの動的生成
- [ ] カテゴリ作成の実行

---

## フェーズ5: NGワード管理画面
### 5.1 NGワード一覧表示
- [ ] テーブル形式での表示
- [ ] 空状態の表示

### 5.2 NGワードの追加
- [ ] 追加モーダルの実装
- [ ] 自動ID採番
- [ ] データベースへの保存

### 5.3 NGワードの編集
- [ ] 編集モーダルの実装
- [ ] 既存データの読み込み
- [ ] 更新処理

### 5.4 NGワードの削除
- [ ] 削除確認
- [ ] データベースからの削除

---

## フェーズ6: UI/UX最適化
### 6.1 スタイリングの統一
- [ ] Tailwind CSSへの完全移行
- [ ] レスポンシブ対応の確認
- [ ] ダークモード対応（オプション）

### 6.2 ローディング状態の改善
- [ ] スケルトンスクリーンの実装
- [ ] ローカルローダーの最適化

### 6.3 エラーハンドリング
- [ ] API呼び出しエラーの表示
- [ ] ユーザーフレンドリーなエラーメッセージ
- [ ] リトライ機能

### 6.4 アニメーションとトランジション
- [ ] モーダルの開閉アニメーション
- [ ] フローティングフッターのスライドイン
- [ ] トーストメッセージのフェードイン/アウト

---

## フェーズ7: テスト・デプロイ
### 7.1 単体テストの作成
- [ ] バックエンドAPI関数のテスト
- [ ] 命名ロジックのテスト
- [ ] NGワードチェックのテスト

### 7.2 結合テスト
- [ ] フロントエンド⇔バックエンドの通信テスト
- [ ] エンドツーエンドの操作フローテスト

### 7.3 デプロイと動作確認
- [ ] `npm run build` でビルド確認
- [ ] `npm run deploy` でGASへデプロイ
- [ ] 本番環境での動作確認
- [ ] スプレッドシートとの完全な置き換え

---

## 注意事項とリスク
- GAS環境では`@supabase/supabase-js`が動作しないため、`UrlFetchApp`でREST API直接呼び出し
- 環境変数はスクリプトプロパティで管理
- ビルドプロセスで`global`へのエクスポートを忘れない
- データ移行時のバックアップ必須

---

## 進行状況
- 現在のフェーズ: **フェーズ1（データベース・バックエンド基盤）**
- 完了した項目: `getCategories()` API実装済み
