# モジュール責務定義

## ディレクトリ構造と責務

### `src/api/` - バックエンドAPI層
各ファイルは特定のドメインロジックを担当し、GASから呼び出される関数を定義します。

#### `categories.ts`
- カテゴリ一覧の取得
- カテゴリ別のスキーマ取得
- ウィザードによる新規カテゴリ作成

#### `types.ts`
- Type（入力項目）の追加
- Type（入力項目）の更新
- Type（入力項目）の削除

#### `keywords.ts`
- Keyword（選択肢）の追加
- Keyword（選択肢）の更新
- Keyword（選択肢）の削除

#### `regulations.ts`
- Regulation（命名ルール）の取得
- Regulation（命名ルール）の更新

#### `ngwords.ts`
- NGワード一覧の取得
- NGワードの追加
- NGワードの更新
- NGワードの削除

#### `naming.ts`
- 商品名・ページ名の生成
- NGワードチェック機能の統合

---

### `src/lib/` - 共通ライブラリ層
複数のAPIモジュールから使用される共通機能を提供します。

#### `supabase.ts`
- Supabase REST APIへの接続ヘルパー
- `UrlFetchApp`を使ったHTTPリクエスト処理
- エラーハンドリング
- 認証ヘッダーの自動付与

**主な関数:**
- `supabaseQuery(table, options)` - SELECT操作
- `supabaseInsert(table, data)` - INSERT操作
- `supabaseUpdate(table, id, data)` - UPDATE操作
- `supabaseDelete(table, id)` - DELETE操作

#### `utils.ts`
- 汎用ユーティリティ関数
- 文字列処理
- データ変換
- バリデーション

**主な関数:**
- `getScriptProperty(key)` - 環境変数取得
- `formatResponse(data, error)` - レスポンス整形
- `validateRequired(obj, keys)` - 必須チェック

---

### `src/types/` - TypeScript型定義層
プロジェクト全体で使用する型定義を集約します。

#### `index.ts`
- データベーススキーマに対応する型定義
- API関数の引数・戻り値の型定義
- フロントエンドとの共通型定義

**主な型:**
- `Category` - カテゴリ
- `Type` - 入力項目
- `Keyword` - 選択肢
- `Regulation` - 命名ルール
- `NgWord` - NGワード
- `ApiResponse<T>` - API統一レスポンス型

---

## 依存関係

```
src/api/*.ts
  ↓ 依存
src/lib/*.ts
  ↓ 依存
src/types/*.ts
```

- **API層** は **ライブラリ層** と **型定義層** に依存
- **ライブラリ層** は **型定義層** のみに依存
- **型定義層** は他に依存しない（Pure TypeScript）

---

## 命名規則

### ファイル名
- ケバブケース: `supabase.ts`, `ngwords.ts`
- 複数形で命名: `categories.ts`, `types.ts`, `keywords.ts`

### 関数名
- キャメルケース: `getCategories()`, `addKeyword()`
- 動詞 + 名詞: `createNewCategory()`, `updateRegulation()`

### 型名
- パスカルケース: `Category`, `ApiResponse`
- 単数形で命名: `Type`, `Keyword`

---

## GASエクスポートルール

`src/api/`内の関数で、フロントエンドから呼び出す必要があるものは、必ず以下の記述を追加:

```typescript
// 例: src/api/categories.ts
export function getCategories() {
  // 処理
}

// GASグローバルスコープに公開
(global as any).getCategories = getCategories;
```

`src/lib/`や`src/types/`の関数は、バックエンド内部でのみ使用されるため、グローバルエクスポート不要です。
