# マイグレーション実行ガイド

カテゴリ階層構造機能を有効にするためのマイグレーション手順です。

## 前提条件

- Supabaseプロジェクトへのアクセス権限
- SQL実行権限（ダッシュボードまたはCLI）

## 実行手順

### Step 1: スキーマ変更（parent_idカラム追加）

Supabaseダッシュボードの「SQL Editor」で以下のSQLを実行してください：

```sql
-- migrations/001_add_category_hierarchy.sql を実行
```

または、以下のコマンドで直接実行：

```bash
psql $DATABASE_URL < migrations/001_add_category_hierarchy.sql
```

### Step 2: 親カテゴリの作成

続けて、親カテゴリを作成します：

```sql
-- migrations/002_insert_parent_categories.sql を実行
```

### Step 3: 既存カテゴリへの親カテゴリ割り当て

最後に、既存の子カテゴリに親カテゴリを割り当てます：

```sql
-- migrations/003_assign_parent_categories.sql を実行
```

**注意事項:**
- 003のマイグレーションは、既存のカテゴリ名に基づいて親子関係を設定します
- カテゴリ名が変更されている場合は、SQL内の`WHERE name IN (...)`部分を調整してください
- 既存の「ソファ」「テレビ台」などのカテゴリがある場合、親カテゴリの下に移動するか、重複を避けるために削除してください

### Step 4: 結果確認

マイグレーション実行後、以下のクエリで結果を確認してください：

```sql
-- 親カテゴリ一覧
SELECT id, name, parent_id 
FROM categories 
WHERE parent_id IS NULL 
ORDER BY name;

-- 親子関係の確認
SELECT 
  c.name as category_name,
  p.name as parent_name
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY p.name NULLS FIRST, c.name;
```

## デプロイ後の確認

1. アプリをビルド＆デプロイ:
   ```bash
   npm run deploy
   ```

2. GASエディタで環境変数を確認:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`

3. アプリを開いて以下を確認:
   - 命名画面で「親カテゴリで絞り込み」ドロップダウンが表示される
   - 「カテゴリ名で検索」テキストボックスが表示される
   - カテゴリ選択時に「親カテゴリ > 子カテゴリ」の形式で表示される
   - フィルタリングが正しく動作する

## トラブルシューティング

### エラー: 外部キー制約違反

**原因:** 存在しないparent_idを設定しようとしている

**対処法:** 002のマイグレーションが正しく実行されているか確認

### カテゴリが表示されない

**原因:** parent_id = NULLの親カテゴリは子カテゴリとして表示されない仕様

**対処法:** フィルタロジックが正しく、parent_idがnullでないカテゴリのみを表示していることを確認

### 検索やフィルタが動作しない

**原因:** JavaScriptのロード順序や変数のスコープの問題

**対処法:** 
1. ブラウザのコンソールでエラーを確認
2. `allCategories`や`allParentCategories`が正しくロードされているか確認
3. APIから正しいデータが返されているか確認（`getCategories()`, `getParentCategories()`）

## ロールバック

マイグレーションを元に戻す場合：

```sql
-- parent_idカラムを削除
ALTER TABLE categories DROP COLUMN parent_id;

-- 親カテゴリを削除（必要に応じて）
DELETE FROM categories WHERE name IN (
  'ソファ', 'テレビ台', '収納', '寝具', '照明', 
  '家電', '雑貨', '机', 'チェア', 'カーテン', 
  'アウトドア', 'その他'
) AND parent_id IS NULL;
```

**注意:** ロールバック後は、アプリコードも元のバージョンに戻す必要があります。
