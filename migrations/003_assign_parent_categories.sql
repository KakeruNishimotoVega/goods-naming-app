-- Migration: Assign parent categories to existing categories
-- Created: 2026-03-24
-- Description: 既存の子カテゴリに適切な親カテゴリを割り当てる
-- Note: このマイグレーションは002_insert_parent_categories.sqlの実行後に実行してください

-- ソファ関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'ソファ' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('オットマン', 'ソファカバー', 'ダイニングソファ', '座椅子')
  AND parent_id IS NULL;

-- 既存の「ソファ」カテゴリがある場合は親カテゴリの下に移動
-- （データ重複を避けるため、既存カテゴリを確認後に実行）
-- UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'ソファ' AND parent_id IS NULL LIMIT 1)
-- WHERE name = 'ソファ' AND parent_id IS NOT NULL;

-- テレビ台関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'テレビ台' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('壁面収納テレビ台', '壁掛け風/スタンドテレビ台')
  AND parent_id IS NULL;

-- 収納関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = '収納' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('収納（汎用）', '衣類収納', 'ワゴン収納', '突っ張り収納', 'オープンラック', 
               'キッチン収納', '玄関収納', 'ランドリー収納', 'トイレ収納')
  AND parent_id IS NULL;

-- 寝具関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = '寝具' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('マットレス', 'ベッド', '掛け布団', '寝具カバー')
  AND parent_id IS NULL;

-- 照明関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = '照明' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('シーリング・ファン・スポットライト', 'ペンダントライト', 'スタンドライト', '卓上照明')
  AND parent_id IS NULL;

-- 家電関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = '家電' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('家電類', '電動ドライバー')
  AND parent_id IS NULL;

-- 雑貨関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = '雑貨' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('生活雑貨', 'ルームウェア', 'インテリア雑貨')
  AND parent_id IS NULL;

-- 机関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = '机' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('テーブル', 'デスク', 'ダイニングテーブル')
  AND parent_id IS NULL;

-- チェア関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'チェア' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('オフィスチェア', 'ダイニングチェア', 'デスクチェア', 'スツール', '学習椅子')
  AND parent_id IS NULL;

-- カーテン関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'カーテン' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('ドレープ単品・レースセット', 'レースカーテン・カーテンライナー', 'ブラインド', 'ロールスクリーン')
  AND parent_id IS NULL;

-- アウトドア関連
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'アウトドア' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('ガーデン')
  AND parent_id IS NULL;

-- その他（ラグ系マット類）
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'その他' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('ラグ', '玄関マット', 'キッチンマット', 'ジョイントマット', '透明ラグ', 'ラグ下敷き')
  AND parent_id IS NULL;

-- 既存の開発環境カテゴリ（C001, C002, C003）の処理
-- N人掛けソファ・座椅子 → ソファの下
UPDATE categories SET parent_id = (SELECT id FROM categories WHERE name = 'ソファ' AND parent_id IS NULL LIMIT 1)
WHERE name = 'N人掛けソファ・座椅子'
  AND parent_id IS NULL;

-- オットマンは既に上で処理済み

-- ソファカバーも既に上で処理済み

-- 確認用クエリ（実行後に結果を確認）
-- SELECT 
--   c.name as category_name,
--   p.name as parent_name
-- FROM categories c
-- LEFT JOIN categories p ON c.parent_id = p.id
-- ORDER BY p.name NULLS FIRST, c.name;
