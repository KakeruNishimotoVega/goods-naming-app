-- Migration: Add password authentication support to app_users table
-- Date: 2026-03-27
-- Description: Adds password_hash and salt columns to support email/password authentication

-- Add password_hash column (stores hashed password)
ALTER TABLE app_users
ADD COLUMN password_hash TEXT;

-- Add salt column (stores random salt for password hashing)
ALTER TABLE app_users
ADD COLUMN salt TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN app_users.password_hash IS 'SHA-256 hashed password with salt';
COMMENT ON COLUMN app_users.salt IS 'Random salt used for password hashing';
