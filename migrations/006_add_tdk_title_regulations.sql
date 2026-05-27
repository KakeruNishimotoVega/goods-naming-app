-- Migration: Add TDK title regulations for all categories
-- Created: 2026-05-27
-- Description: 全カテゴリにTDKタイトル用のレギュレーションを追加
-- Format: {nickname} | {商品名}

-- TDKタイトルのレギュレーションを全カテゴリに追加
INSERT INTO regulations (category_id, target, pattern_string)
SELECT 
  id as category_id,
  'TDKタイトル' as target,
  '{nickname} | {商品名}' as pattern_string
FROM categories
WHERE NOT EXISTS (
  SELECT 1 
  FROM regulations r 
  WHERE r.category_id = categories.id 
    AND r.target = 'TDKタイトル'
);

-- 確認用クエリ（コメントアウト）
-- SELECT c.name, r.target, r.pattern_string
-- FROM regulations r
-- JOIN categories c ON r.category_id = c.id
-- WHERE r.target = 'TDKタイトル'
-- ORDER BY c.name;
