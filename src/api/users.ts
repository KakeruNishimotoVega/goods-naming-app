/**
 * ユーザー管理API
 * app_usersテーブルのCRUD操作を担当
 */

import type { AppUser } from '../types';

// lib/utils.tsで定義されているパスワード関連関数の宣言（esbuildがバンドル時に解決）
declare function validatePasswordStrength(password: string): string | null;
declare function generateSalt(): string;
declare function hashPassword(password: string, salt: string): string;

/**
 * 【API】新規ユーザーを登録（セルフサインアップ）
 * @param email メールアドレス
 * @param password パスワード
 * @param userName 表示名
 * @returns 登録されたユーザー情報
 */
export function registerUser(email: string, password: string, userName: string): AppUser | { error: string } {
  if (!email || !password || !userName) {
    return { error: 'すべての項目を入力してください' };
  }

  // パスワード強度をチェック
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return { error: 'システムエラーが発生しました' };
  }

  try {
    // ソルトを生成
    const salt = generateSalt();
    
    // パスワードをハッシュ化
    const passwordHash = hashPassword(password, salt);

    const endpoint = `${supabaseUrl}/rest/v1/app_users`;

    const payload = {
      email: email,
      user_name: userName,
      role: 'user', // デフォルトはuserロール
      password_hash: passwordHash,
      salt: salt
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // 挿入したデータを返す
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(endpoint, options);

    if (response.getResponseCode() !== 201) {
      const errorText = response.getContentText();
      
      // 重複エラーのチェック
      if (errorText.includes('duplicate key') || errorText.includes('unique constraint')) {
        return { error: 'このメールアドレスは既に登録されています' };
      }
      
      Logger.log(`ユーザー登録エラー: ${errorText}`);
      return { error: 'ユーザー登録に失敗しました' };
    }

    const users = JSON.parse(response.getContentText());
    const user = users[0]; // Preferヘッダーで配列が返ってくる
    
    // パスワードハッシュとsaltは返さない（セキュリティ）
    const { password_hash, salt: userSalt, ...userWithoutPassword } = user;
    return userWithoutPassword as AppUser;
  } catch (error) {
    Logger.log(`ユーザー登録エラー: ${error}`);
    return { error: 'ユーザー登録中にエラーが発生しました' };
  }
}

/**
 * 【API】メールアドレスでユーザーを検索
 * @param email Gmailアドレス
 * @returns ユーザー情報（見つからない場合はnull）
 */
export function getUserByEmail(email: string): AppUser | null {
  if (!email) {
    throw new Error('emailは必須です');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません');
  }

  // emailで検索（完全一致）
  const endpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`ユーザー検索エラー: ${response.getContentText()}`);
  }

  const users = JSON.parse(response.getContentText());
  return users.length > 0 ? users[0] : null;
}

/**
 * 【API】ユーザーIDでユーザーを検索
 * @param userId ユーザーID（UUID）
 * @returns ユーザー情報（見つからない場合はnull）
 */
export function getUserById(userId: string): AppUser | null {
  if (!userId) {
    throw new Error('userIdは必須です');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません');
  }

  const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}&limit=1`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`ユーザー検索エラー: ${response.getContentText()}`);
  }

  const users = JSON.parse(response.getContentText());
  return users.length > 0 ? users[0] : null;
}

/**
 * 【API】ユーザーのロールを変更（管理者専用）
 * @param userId ユーザーID（UUID）
 * @param newRole 新しいロール（'admin' または 'user'）
 * @returns 更新されたユーザー情報
 */
export function updateUserRole(userId: string, newRole: 'admin' | 'user'): AppUser {
  if (!userId || !newRole) {
    throw new Error('userIdとnewRoleは必須です');
  }

  if (newRole !== 'admin' && newRole !== 'user') {
    throw new Error('roleは"admin"または"user"である必要があります');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません');
  }

  const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`;

  const payload = {
    role: newRole
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'patch',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`ロール更新エラー: ${response.getContentText()}`);
  }

  const users = JSON.parse(response.getContentText());
  
  if (users.length === 0) {
    throw new Error('ユーザーが見つかりませんでした');
  }
  
  return users[0];
}

/**
 * 【API】ユーザー名を更新
 * @param userId ユーザーID（UUID）
 * @param newUserName 新しい表示名
 * @returns 更新されたユーザー情報
 */
export function updateUserName(userId: string, newUserName: string): AppUser {
  if (!userId || !newUserName) {
    throw new Error('userIdとnewUserNameは必須です');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません');
  }

  const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`;

  const payload = {
    user_name: newUserName
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'patch',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`ユーザー名更新エラー: ${response.getContentText()}`);
  }

  const users = JSON.parse(response.getContentText());
  
  if (users.length === 0) {
    throw new Error('ユーザーが見つかりませんでした');
  }
  
  return users[0];
}

/**
 * 【API】全ユーザー一覧を取得（管理者専用）
 * @returns ユーザー一覧の配列
 */
export function listUsers(): AppUser[] {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません');
  }

  // created_atの降順で取得（新しいユーザーが上に）
  const endpoint = `${supabaseUrl}/rest/v1/app_users?select=*&order=created_at.desc`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`ユーザー一覧取得エラー: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

/**
 * 【API】ユーザーを削除（管理者専用）
 * @param userId ユーザーID（UUID）
 */
export function deleteUser(userId: string): void {
  if (!userId) {
    throw new Error('userIdは必須です');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません');
  }

  const endpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${userId}`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'delete',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);

  if (response.getResponseCode() !== 204 && response.getResponseCode() !== 200) {
    throw new Error(`ユーザー削除エラー: ${response.getContentText()}`);
  }
}
