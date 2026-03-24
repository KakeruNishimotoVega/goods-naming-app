/**
 * 共通型定義
 * データベーススキーマに基づく型定義とフロントエンド用の型
 */

// ==================== データベーススキーマ型定義 ====================

/**
 * categories（カテゴリ）テーブルの型
 */
export interface Category {
  id: string; // uuid
  name: string;
  parent_id: string | null; // 親カテゴリID（NULL = 親カテゴリ）
  parent_name?: string; // 親カテゴリ名（JOIN結果）
  created_at: string; // timestamptz
}

/**
 * types（タイプ・入力項目定義）テーブルの型
 */
export interface Type {
  id: string; // uuid
  category_id: string; // uuid
  key_name: string; // 項目のキー名（例: 幅N、N人掛け）
  display_name: string; // 表示用の名称
  priority: number | null; // 表示優先度
  is_required: boolean | null; // 必須項目かどうか
  selection_type: SelectionType; // 選択タイプ
  description: string | null; // 項目の説明文
  placeholder: string | null; // プレースホルダー
  created_at: string; // timestamptz
}

/**
 * selection_typeの値
 * - TEXT: フリーテキスト入力
 * - SINGLE: 単一選択（ラジオボタン）
 * - MULTI: 複数選択（チェックボックス）
 * - TRUE_FALSE: ON/OFF切り替え（トグル）
 */
export type SelectionType = 'TEXT' | 'SINGLE' | 'MULTI' | 'TRUE_FALSE';

/**
 * keywords（キーワード・選択肢）テーブルの型
 */
export interface Keyword {
  id: string; // uuid
  type_id: string; // uuid
  keyword: string; // キーワード文字列
  priority: number | null; // 表示優先度
  created_at: string; // timestamptz
}

/**
 * regulations（命名規則）テーブルの型
 */
export interface Regulation {
  id: string; // uuid
  category_id: string; // uuid
  target: string; // 適用対象（キャッチコピー/商品名）
  pattern_string: string; // パターン文字列（{key_name}形式）
  created_at: string; // timestamptz
}

/**
 * fields（汎用入力フィールド）テーブルの型
 */
export interface Field {
  id: string; // uuid
  field_key: string; // フィールドのキー（例: nickname）
  display_name: string; // 表示用の名称
  input_type: string; // 入力タイプ（text/number/etc）
  priority: number | null; // 表示優先度
  placeholder: string | null; // プレースホルダー
  created_at: string; // timestamptz
}

/**
 * prohibited_words（禁止ワード）テーブルの型
 */
export interface ProhibitedWord {
  id: string; // uuid
  word: string; // 禁止ワード
  reason: string | null; // 禁止理由
  created_at: string; // timestamptz
}

/**
 * app_users（アプリユーザー）テーブルの型
 */
export interface AppUser {
  id: string; // uuid
  email: string;
  role: string; // ユーザーの権限ロール
  created_at: string; // timestamptz
}

// ==================== API用の複合型定義 ====================

/**
 * カテゴリとそのスキーマ（fields + types + keywords + regulations）を含む複合型
 */
export interface CategorySchema {
  category: Category;
  fields: Field[];
  types: TypeWithKeywords[];
  regulations: Regulation[];
}

/**
 * TypeとそのKeywordsを含む複合型
 */
export interface TypeWithKeywords {
  type: Type;
  keywords: Keyword[];
}

/**
 * 命名生成のための入力データ型
 */
export interface NamingFormData {
  category_id: string;
  fields: Record<string, string>; // field_key -> value
  types: Record<string, string | string[]>; // key_name -> value(s)
}

/**
 * 命名生成の結果型
 */
export interface NamingResult {
  productPageName: string; // キャッチコピー
  productName: string; // 商品名
  prohibitedWordsFound: ProhibitedWordMatch[]; // 検出された禁止ワード
}

/**
 * 禁止ワードマッチ情報
 */
export interface ProhibitedWordMatch {
  word: string; // マッチした禁止ワード
  reason: string | null; // 禁止理由
  target: 'productPageName' | 'productName'; // どちらでマッチしたか
}

// ==================== フロントエンド用の型定義 ====================

/**
 * フォームの入力状態を管理する型
 */
export interface FormState {
  categoryId: string | null;
  fields: Record<string, string>;
  types: Record<string, string | string[]>;
}

/**
 * UI表示用のエラー型
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * API応答の共通型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
