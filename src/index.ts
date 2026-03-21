/**
 * Webアプリにアクセスされたときの最初のエントリーポイント
 */
const doGet = (e: GoogleAppsScript.Events.DoGet) => {
  // src/index.html を読み込んでWebページとして出力する
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('商品名・キャッチコピー命名アプリ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
};

// GASのエディタに認識させるためグローバルに登録
(global as any).doGet = doGet;

/**
 * Supabaseとの接続テストを行う関数
 */
const testSupabaseConnection = () => {
  // 1. 環境変数（スクリプトプロパティ）の取得
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabaseの環境変数が設定されていません。スクリプトプロパティにSUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを設定してください。');
  }

  // 2. アクセス先のURL（categoriesテーブルから全件取得するREST API）
  const endpoint = `${supabaseUrl}/rest/v1/categories?select=*`;

  // 3. 通信のオプション設定（Service Role KeyでRLSを突破する）
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    // エラー時も例外で落とさず、レスポンスの中身を確認できるようにする設定
    muteHttpExceptions: true 
  };

  // 4. 通信の実行と結果のログ出力
  const response = UrlFetchApp.fetch(endpoint, options);
  
  console.log('ステータスコード:', response.getResponseCode());
  console.log('レスポンス内容:', response.getContentText());
};

/**
 * 【API】Supabaseからカテゴリ一覧を取得してフロントに返す関数
 */
const getCategories = () => {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // カテゴリ一覧を作成日時の昇順で取得するAPIエンドポイント
  const endpoint = `${supabaseUrl}/rest/v1/categories?select=*&order=created_at.asc`;

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
    throw new Error(`DBエラー: ${response.getContentText()}`);
  }

  // 取得したJSON文字列をオブジェクトに変換してフロントエンドへ返す
  return JSON.parse(response.getContentText());
};

// GASのエディタに認識させるためグローバルに登録
(global as any).testSupabaseConnection = testSupabaseConnection;
(global as any).getCategories = getCategories;