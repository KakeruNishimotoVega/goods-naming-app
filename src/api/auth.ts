/**
 * 認証関連API
 * メールアドレス＋パスワード認証とセッション管理を担当
 */

import type { AppUser, LoginRequest, AuthSession } from '../types';

// lib/utils.tsで定義されているパスワード関連関数の宣言（esbuildがバンドル時に解決）
declare function verifyPassword(password: string, salt: string, storedHash: string): boolean;

/**
 * 【API】メールアドレスとパスワードでログイン
 * @param email メールアドレス
 * @param password パスワード
 * @returns ログイン成功時はユーザー情報、失敗時はエラーオブジェクト
 */
export function loginWithPassword(email: string, password: string): AppUser | { error: string } {
  Logger.log(`[loginWithPassword] email=${email}`);
  
  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください' };
  }

  try {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty('SUPABASE_URL');
    const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      Logger.log('[loginWithPassword] 環境変数が設定されていません');
      return { error: 'システムエラーが発生しました' };
    }

    // メールアドレスでユーザーを検索
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
      Logger.log(`[loginWithPassword] DB検索エラー: ${response.getContentText()}`);
      return { error: 'システムエラーが発生しました' };
    }

    const users = JSON.parse(response.getContentText());
    
    if (users.length === 0) {
      Logger.log('[loginWithPassword] ユーザーが見つかりません');
      return { error: 'メールアドレスまたはパスワードが正しくありません' };
    }

    const user: AppUser = users[0];

    // パスワードが設定されていない場合（移行期など）
    if (!user.password_hash || !user.salt) {
      Logger.log('[loginWithPassword] パスワードが設定されていません');
      return { error: 'パスワードが設定されていません。管理者に連絡してください。' };
    }

    // パスワードを検証
    const isValid = verifyPassword(password, user.salt, user.password_hash);
    
    if (!isValid) {
      Logger.log('[loginWithPassword] パスワードが一致しません');
      return { error: 'メールアドレスまたはパスワードが正しくありません' };
    }

    // セッションを作成
    createSession(user);
    
    Logger.log('[loginWithPassword] ログイン成功');
    
    // パスワードハッシュとsaltは返さない（セキュリティ）
    const { password_hash, salt, ...userWithoutPassword } = user;
    return userWithoutPassword as AppUser;
  } catch (error) {
    Logger.log(`[loginWithPassword] エラー: ${error}`);
    return { error: 'ログイン処理中にエラーが発生しました' };
  }
}

/**
 * 【API】現在ログイン中のユーザー情報を取得
 * @returns セッションデータ（userId, email, userName, role）またはnull
 */
export function getCurrentUser(): AuthSession | null {
  const cache = CacheService.getUserCache();
  const sessionData = cache.get('user_session');
  
  Logger.log(`[getCurrentUser] セッションデータ: ${sessionData}`);
  
  if (!sessionData) {
    Logger.log('[getCurrentUser] セッションデータが見つかりません');
    return null;
  }
  
  try {
    const parsed = JSON.parse(sessionData);
    Logger.log(`[getCurrentUser] パース済みデータ: ${JSON.stringify(parsed)}`);
    return parsed;
  } catch (error) {
    Logger.log(`セッションデータのパースエラー: ${error}`);
    return null;
  }
}

/**
 * 【API】セッションを作成（ログイン状態にする）
 * @param user アプリユーザー情報
 */
export function createSession(user: AppUser): void {
  Logger.log(`[createSession] ユーザー: ${JSON.stringify(user)}`);
  
  const sessionData: AuthSession = {
    userId: user.id,
    email: user.email,
    userName: user.user_name,
    role: user.role
  };
  
  Logger.log(`[createSession] セッションデータ: ${JSON.stringify(sessionData)}`);
  
  const cache = CacheService.getUserCache();
  // 1日（86400秒）有効なセッション
  cache.put('user_session', JSON.stringify(sessionData), 86400);
  
  Logger.log('[createSession] セッションを保存しました（有効期限: 1日）');
}

/**
 * 【API】ログアウト（セッションを削除）
 */
export function logout(): void {
  const cache = CacheService.getUserCache();
  cache.remove('user_session');
  Logger.log('[logout] セッションを削除しました');
}

/**
 * 【API】現在のユーザーのロールを取得
 * @returns ロール（'admin' | 'user'）またはnull（未ログイン時）
 */
export function getUserRole(): 'admin' | 'user' | null {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    Logger.log('[getUserRole] 未ログイン：nullを返します');
    return null;
  }
  
  Logger.log(`[getUserRole] 現在のユーザー: role=${currentUser.role}, email=${currentUser.email}`);
  return currentUser.role;
}

/**
 * 【API】現在のユーザーが指定されたロールを持っているかチェック
 * @param requiredRole 必要なロール（'admin' または 'user'）
 * @returns true: 権限あり, false: 権限なし
 */
export function hasRole(requiredRole: 'admin' | 'user'): boolean {
  Logger.log(`[hasRole] チェック中... requiredRole=${requiredRole}`);
  
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    Logger.log('[hasRole] 未ログイン：falseを返します');
    return false; // 未ログイン
  }
  
  Logger.log(`[hasRole] 現在のユーザー: role=${currentUser.role}, email=${currentUser.email}`);
  
  // adminは全ての権限を持つ
  if (currentUser.role === 'admin') {
    Logger.log(`[hasRole] adminユーザーなのでtrueを返します`);
    return true;
  }
  
  // userロールは'user'のみアクセス可能
  const result = requiredRole === 'user';
  Logger.log(`[hasRole] userロール: requiredRole=${requiredRole}, result=${result}`);
  return result;
}
