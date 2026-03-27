/**
 * 管理者パスワード設定スクリプト
 * デプロイ後、GASエディタから手動実行してパスワードを設定する
 */

// lib/utils.tsで定義されているパスワード関連関数の宣言（esbuildがバンドル時に解決）
declare function validatePasswordStrength(password: string): string | null;
declare function generateSalt(): string;
declare function hashPassword(password: string, salt: string): string;

/**
 * 【手動実行用】管理者アカウントのパスワードを設定
 * GASエディタから実行し、引数を直接編集して使用してください
 * 
 * 使い方:
 * 1. GASエディタでこの関数を開く
 * 2. 下記のコードのemailとpasswordを実際の値に変更
 * 3. 実行ボタンをクリック
 * 4. ログで結果を確認
 */
export function setAdminPassword(): void {
  // ここに実際のメールアドレスとパスワードを入力してください
  const email = 'nishimoto.kakeru@vega-c.com';
  const password = 'YOUR_PASSWORD_HERE'; // ← 実際のパスワードに置き換えてください
  
  if (password === 'YOUR_PASSWORD_HERE') {
    Logger.log('エラー: パスワードを設定してください');
    Logger.log('スクリプトを編集して、passwordを実際の値に変更してください');
    return;
  }
  
  Logger.log(`[setAdminPassword] メール: ${email}`);
  
  // パスワード強度をチェック
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    Logger.log(`エラー: ${passwordError}`);
    return;
  }
  
  try {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty('SUPABASE_URL');
    const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      Logger.log('エラー: 環境変数が設定されていません');
      return;
    }

    // ユーザーを検索
    const getUserEndpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;
    
    const getUserOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };

    const getUserResponse = UrlFetchApp.fetch(getUserEndpoint, getUserOptions);

    if (getUserResponse.getResponseCode() !== 200) {
      Logger.log(`エラー: ユーザー検索に失敗しました - ${getUserResponse.getContentText()}`);
      return;
    }

    const users = JSON.parse(getUserResponse.getContentText());
    
    if (users.length === 0) {
      Logger.log(`エラー: メールアドレス ${email} のユーザーが見つかりません`);
      return;
    }

    const user = users[0];
    Logger.log(`ユーザーが見つかりました: ${user.user_name} (${user.email}), role=${user.role}`);

    // ソルトを生成
    const salt = generateSalt();
    
    // パスワードをハッシュ化
    const passwordHash = hashPassword(password, salt);

    // パスワードを更新
    const updateEndpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${user.id}`;
    
    const updatePayload = {
      password_hash: passwordHash,
      salt: salt
    };

    const updateOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'patch',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    };

    const updateResponse = UrlFetchApp.fetch(updateEndpoint, updateOptions);

    if (updateResponse.getResponseCode() !== 204) {
      Logger.log(`エラー: パスワード更新に失敗しました - ${updateResponse.getContentText()}`);
      return;
    }

    Logger.log('✅ パスワードを正常に設定しました');
    Logger.log('このパスワードでログインできます');
    
  } catch (error) {
    Logger.log(`エラー: ${error}`);
  }
}

/**
 * 【手動実行用】任意のユーザーのパスワードを設定（管理者用）
 * @param email 対象ユーザーのメールアドレス
 * @param newPassword 新しいパスワード
 */
export function setUserPassword(email: string, newPassword: string): void {
  if (!email || !newPassword) {
    Logger.log('エラー: emailとnewPasswordは必須です');
    return;
  }
  
  Logger.log(`[setUserPassword] メール: ${email}`);
  
  // パスワード強度をチェック
  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    Logger.log(`エラー: ${passwordError}`);
    return;
  }
  
  try {
    const props = PropertiesService.getScriptProperties();
    const supabaseUrl = props.getProperty('SUPABASE_URL');
    const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      Logger.log('エラー: 環境変数が設定されていません');
      return;
    }

    // ユーザーを検索
    const getUserEndpoint = `${supabaseUrl}/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&limit=1`;
    
    const getUserOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };

    const getUserResponse = UrlFetchApp.fetch(getUserEndpoint, getUserOptions);

    if (getUserResponse.getResponseCode() !== 200) {
      Logger.log(`エラー: ユーザー検索に失敗しました - ${getUserResponse.getContentText()}`);
      return;
    }

    const users = JSON.parse(getUserResponse.getContentText());
    
    if (users.length === 0) {
      Logger.log(`エラー: メールアドレス ${email} のユーザーが見つかりません`);
      return;
    }

    const user = users[0];
    Logger.log(`ユーザーが見つかりました: ${user.user_name} (${user.email}), role=${user.role}`);

    // ソルトを生成
    const salt = generateSalt();
    
    // パスワードをハッシュ化
    const passwordHash = hashPassword(newPassword, salt);

    // パスワードを更新
    const updateEndpoint = `${supabaseUrl}/rest/v1/app_users?id=eq.${user.id}`;
    
    const updatePayload = {
      password_hash: passwordHash,
      salt: salt
    };

    const updateOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'patch',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(updatePayload),
      muteHttpExceptions: true
    };

    const updateResponse = UrlFetchApp.fetch(updateEndpoint, updateOptions);

    if (updateResponse.getResponseCode() !== 204) {
      Logger.log(`エラー: パスワード更新に失敗しました - ${updateResponse.getContentText()}`);
      return;
    }

    Logger.log('✅ パスワードを正常に設定しました');
    Logger.log(`${user.user_name} (${user.email}) のパスワードを更新しました`);
    
  } catch (error) {
    Logger.log(`エラー: ${error}`);
  }
}
