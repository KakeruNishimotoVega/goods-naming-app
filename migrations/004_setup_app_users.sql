-- Migration: Setup app_users table for authentication
-- Created: 2026-03-26
-- Description: app_usersテーブルのセットアップとuser_nameカラムの追加、初回管理者の登録

-- Step 1: app_usersテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Step 2: user_nameカラムを追加（既存の場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'app_users' AND column_name = 'user_name'
    ) THEN
        ALTER TABLE app_users ADD COLUMN user_name TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Step 3: roleカラムのデフォルト値を'user'に変更（既に'editor'の場合）
ALTER TABLE app_users ALTER COLUMN role SET DEFAULT 'user';

-- Step 4: 既存のrole='editor'のレコードを'user'に更新
UPDATE app_users SET role = 'user' WHERE role = 'editor';

-- Step 5: 初回管理者を登録（既に存在する場合はスキップ）
INSERT INTO app_users (email, user_name, role)
VALUES ('nishimoto.kakeru@vega-c.com', '西元 翔', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin', user_name = '西元 翔';

-- Step 6: インデックスを作成（既に存在する場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);

-- Step 7: コメントを追加
COMMENT ON TABLE app_users IS 'アプリケーションユーザー管理テーブル';
COMMENT ON COLUMN app_users.id IS 'ユーザーID（UUID）';
COMMENT ON COLUMN app_users.email IS 'Gmailアドレス（一意）';
COMMENT ON COLUMN app_users.user_name IS '表示名';
COMMENT ON COLUMN app_users.role IS 'ユーザーロール（admin / user）';
COMMENT ON COLUMN app_users.created_at IS 'アカウント作成日時（UTC）';

-- 注意: このアプリはGAS環境でSupabase Service Role Keyを使用するため、
-- Row Level Security (RLS) は無効化しています。
-- すべてのデータベースアクセスはバックエンド（GAS）経由で行われ、
-- フロントエンドから直接Supabaseにアクセスすることはありません。
