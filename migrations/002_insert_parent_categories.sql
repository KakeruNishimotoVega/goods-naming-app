-- Migration: Insert parent categories
-- Created: 2026-03-24
-- Description: 親カテゴリ12個を挿入（parent_id = NULL）

-- 親カテゴリの挿入
INSERT INTO categories (name, parent_id) VALUES
('ソファ', NULL),
('テレビ台', NULL),
('収納', NULL),
('寝具', NULL),
('照明', NULL),
('家電', NULL),
('雑貨', NULL),
('机', NULL),
('チェア', NULL),
('カーテン', NULL),
('アウトドア', NULL),
('その他', NULL);

-- 確認用クエリ（実行後に親カテゴリを確認）
-- SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL ORDER BY name;
