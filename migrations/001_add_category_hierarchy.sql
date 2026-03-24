-- Migration: Add category hierarchy support
-- Created: 2026-03-24
-- Description: categoriesテーブルにparent_idカラムを追加し、親子関係を表現できるようにする

-- Step 1: カラムを追加
ALTER TABLE categories
ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Step 2: インデックスを作成（親カテゴリでのフィルタリングを高速化）
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Step 3: コメントを追加
COMMENT ON COLUMN categories.parent_id IS '親カテゴリのID。NULLの場合は親カテゴリを示す';
