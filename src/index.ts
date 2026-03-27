/**
 * Webアプリにアクセスされたときの最初のエントリーポイント
 */
const doGet = (e: GoogleAppsScript.Events.DoGet) => {
  // dist/index.html を読み込んでWebページとして出力する
  // NOTE: build-html.jsでsrc/配下のファイルが統合されてdist/index.htmlに出力される
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('LOWYA商品命名アプリ')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
};

// GASのエディタに認識させるためグローバルに登録
(global as any).doGet = doGet;

/**
 * フロントエンドから環境変数を取得するための関数
 * セキュリティのため、公開用のキーのみを返す
 */
const getEnvironmentVariables = () => {
  const props = PropertiesService.getScriptProperties();

  return {
    supabaseUrl: props.getProperty('SUPABASE_URL') || '',
    // NOTE: フロントエンドにはanon keyのみを渡す（service role keyは渡さない）
    supabaseAnonKey: props.getProperty('SUPABASE_ANON_KEY') || ''
  };
};

// GASのエディタに認識させるためグローバルに登録
(global as any).getEnvironmentVariables = getEnvironmentVariables;

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

// GASのエディタに認識させるためグローバルに登録
(global as any).testSupabaseConnection = testSupabaseConnection;

// API関数のインポート（build.jsがバンドル時に解決）
// NOTE: GAS環境では通常のimportは使えないが、esbuildがバンドル時に解決する
import { getCategories, getParentCategories, getSchemaForCategory, createNewCategory } from './api/categories';
import { addType, updateType, deleteType } from './api/types';
import { addKeyword, updateKeyword, deleteKeyword, updateKeywordsPriority } from './api/keywords';
import { updateRegulation } from './api/regulations';
import { getNgWords, addNgWord, updateNgWord, deleteNgWord } from './api/ngwords';
import { generateNames, generateNamesMinimal } from './api/naming';
import { 
  loginWithPassword,
  getCurrentUser, 
  getUserRole,
  createSession, 
  logout, 
  hasRole 
} from './api/auth';
import { 
  registerUser, 
  getUserByEmail, 
  getUserById, 
  updateUserRole, 
  updateUserName, 
  listUsers, 
  deleteUser 
} from './api/users';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength
} from './lib/utils';
import {
  setAdminPassword,
  setUserPassword
} from './scripts/setAdminPassword';

// カテゴリAPI関数をグローバルに公開
(global as any).getCategories = getCategories;
(global as any).getParentCategories = getParentCategories;
(global as any).getSchemaForCategory = getSchemaForCategory;
(global as any).createNewCategory = createNewCategory;

// TypeAPI関数をグローバルに公開
(global as any).addType = addType;
(global as any).updateType = updateType;
(global as any).deleteType = deleteType;

// KeywordAPI関数をグローバルに公開
(global as any).addKeyword = addKeyword;
(global as any).updateKeyword = updateKeyword;
(global as any).deleteKeyword = deleteKeyword;
(global as any).updateKeywordsPriority = updateKeywordsPriority;

// RegulationAPI関数をグローバルに公開
(global as any).updateRegulation = updateRegulation;

// NGワードAPI関数をグローバルに公開
(global as any).getNgWords = getNgWords;
(global as any).addNgWord = addNgWord;
(global as any).updateNgWord = updateNgWord;
(global as any).deleteNgWord = deleteNgWord;

// 命名生成API関数をグローバルに公開
(global as any).generateNames = generateNames;
(global as any).generateNamesMinimal = generateNamesMinimal;

// 認証API関数をグローバルに公開
(global as any).loginWithPassword = loginWithPassword;
(global as any).getCurrentUser = getCurrentUser;
(global as any).getUserRole = getUserRole;
(global as any).createSession = createSession;
(global as any).logout = logout;
(global as any).hasRole = hasRole;

// ユーザー管理API関数をグローバルに公開
(global as any).registerUser = registerUser;
(global as any).getUserByEmail = getUserByEmail;
(global as any).getUserById = getUserById;
(global as any).updateUserRole = updateUserRole;
(global as any).updateUserName = updateUserName;
(global as any).listUsers = listUsers;
(global as any).deleteUser = deleteUser;

// 管理者パスワード設定スクリプトをグローバルに公開
(global as any).setAdminPassword = setAdminPassword;
(global as any).setUserPassword = setUserPassword;

// パスワードユーティリティをグローバルに公開
(global as any).generateSalt = generateSalt;
(global as any).hashPassword = hashPassword;
(global as any).verifyPassword = verifyPassword;
(global as any).validatePasswordStrength = validatePasswordStrength;