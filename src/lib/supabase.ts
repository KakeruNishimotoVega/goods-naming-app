/**
 * Supabase接続ヘルパー
 * GAS環境ではUrlFetchAppを使用してSupabase REST APIを直接呼び出す
 * @supabase/supabase-jsはGAS上では動作しないため使用しない
 */

/**
 * Supabaseの設定を取得
 */
function getSupabaseConfig() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_ANON_KEY');

  if (!url || !key) {
    throw new Error('Supabase configuration not found in script properties');
  }

  return { url, key };
}

/**
 * Supabase REST APIへのGETリクエスト
 * @param table テーブル名
 * @param query クエリパラメータ（オプション）
 * @returns レスポンスデータ
 */
function supabaseGet(table: string, query: string = ''): any {
  const { url, key } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${table}${query ? '?' + query : ''}`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode >= 400) {
    throw new Error(`Supabase GET request failed: ${responseCode} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

/**
 * Supabase REST APIへのPOSTリクエスト
 * @param table テーブル名
 * @param data 挿入するデータ
 * @param options 追加オプション（例: Prefer: return=representation）
 * @returns レスポンスデータ
 */
function supabasePost(table: string, data: any, options: { prefer?: string } = {}): any {
  const { url, key } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${table}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (options.prefer) {
    headers['Prefer'] = options.prefer;
  }

  const fetchOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(endpoint, fetchOptions);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode >= 400) {
    throw new Error(`Supabase POST request failed: ${responseCode} - ${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : null;
}

/**
 * Supabase REST APIへのPATCHリクエスト
 * @param table テーブル名
 * @param query 更新対象を絞り込むクエリパラメータ（例: id=eq.xxx）
 * @param data 更新するデータ
 * @param options 追加オプション
 * @returns レスポンスデータ
 */
function supabasePatch(table: string, query: string, data: any, options: { prefer?: string } = {}): any {
  const { url, key } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${table}?${query}`;

  const headers: Record<string, string> = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (options.prefer) {
    headers['Prefer'] = options.prefer;
  }

  const fetchOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'patch',
    headers: headers,
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(endpoint, fetchOptions);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode >= 400) {
    throw new Error(`Supabase PATCH request failed: ${responseCode} - ${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : null;
}

/**
 * Supabase REST APIへのDELETEリクエスト
 * @param table テーブル名
 * @param query 削除対象を絞り込むクエリパラメータ（例: id=eq.xxx）
 * @returns レスポンスデータ
 */
function supabaseDelete(table: string, query: string): any {
  const { url, key } = getSupabaseConfig();
  const endpoint = `${url}/rest/v1/${table}?${query}`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'delete',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode >= 400) {
    throw new Error(`Supabase DELETE request failed: ${responseCode} - ${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : null;
}
