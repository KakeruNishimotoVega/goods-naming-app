/**
 * 汎用ユーティリティ関数
 * プロジェクト全体で使用する共通処理
 */

/**
 * エラーハンドリング用のラッパー関数
 * GAS環境でのエラーをキャッチしてログ出力 & ユーザーフレンドリーなメッセージを返す
 * @param fn 実行する関数
 * @param errorMessage ユーザー向けエラーメッセージ
 * @returns 関数の実行結果またはエラーオブジェクト
 */
function withErrorHandling<T>(fn: () => T, errorMessage: string): T | { error: string } {
  try {
    return fn();
  } catch (error) {
    Logger.log(`Error: ${errorMessage}`);
    Logger.log(error);
    return { error: errorMessage };
  }
}

/**
 * オブジェクトが空かどうかを判定
 * @param obj チェック対象のオブジェクト
 * @returns 空の場合true
 */
function isEmpty(obj: any): boolean {
  if (obj == null) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 文字列の文字数をカウント（全角・半角を区別しない）
 * @param text 対象文字列
 * @returns 文字数
 */
function countCharacters(text: string): number {
  if (!text) return 0;
  return text.length;
}

/**
 * テンプレート文字列のプレースホルダーを置換
 * @param template テンプレート文字列（例: "{nickname} / {N人掛け}{カテゴリ}"）
 * @param data 置換データ（key: プレースホルダー名, value: 置換する値）
 * @returns 置換後の文字列
 */
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;

  // プレースホルダー {key_name} を実際の値に置換
  Object.keys(data).forEach(key => {
    const value = data[key] || '';
    const placeholder = `{${key}}`;
    // グローバル置換を実行
    result = result.split(placeholder).join(value);
  });

  return result;
}

/**
 * 配列から重複を削除
 * @param array 対象配列
 * @returns 重複を削除した配列
 */
function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * 配列をpriorityでソート（昇順）
 * @param items priorityプロパティを持つオブジェクトの配列
 * @returns ソート済み配列
 */
function sortByPriority<T extends { priority: number | null }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const priorityA = a.priority ?? 999;
    const priorityB = b.priority ?? 999;
    return priorityA - priorityB;
  });
}

/**
 * 禁止ワードを含むかどうかをチェック
 * @param text チェック対象のテキスト
 * @param prohibitedWords 禁止ワードの配列
 * @returns マッチした禁止ワードの配列
 */
function findProhibitedWords(
  text: string,
  prohibitedWords: Array<{ word: string; reason: string | null }>
): Array<{ word: string; reason: string | null }> {
  if (!text) return [];

  const matches: Array<{ word: string; reason: string | null }> = [];

  prohibitedWords.forEach(item => {
    if (text.includes(item.word)) {
      matches.push(item);
    }
  });

  return matches;
}

/**
 * フォームデータのバリデーション
 * @param formData 検証対象のフォームデータ
 * @param requiredFields 必須フィールドのキーリスト
 * @returns バリデーションエラーの配列（エラーがない場合は空配列）
 */
function validateFormData(
  formData: Record<string, any>,
  requiredFields: string[]
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  requiredFields.forEach(field => {
    if (isEmpty(formData[field])) {
      errors.push({
        field: field,
        message: `${field}は必須項目です`,
      });
    }
  });

  return errors;
}

/**
 * UUIDのバリデーション
 * @param uuid チェック対象のUUID文字列
 * @returns 有効なUUIDの場合true
 */
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * 安全なJSON.parse（エラーが発生した場合はnullを返す）
 * @param jsonString JSON文字列
 * @returns パース結果またはnull
 */
function safeJsonParse<T = any>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    Logger.log('JSON parse error:', error);
    return null;
  }
}

/**
 * オブジェクトから指定したキーのみを抽出
 * @param obj 元のオブジェクト
 * @param keys 抽出したいキーの配列
 * @returns 抽出されたプロパティのみを持つオブジェクト
 */
function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * 配列を指定したサイズのチャンクに分割
 * @param array 対象配列
 * @param size チャンクサイズ
 * @returns チャンクの配列
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * ディープコピー（JSONシリアライズ可能なオブジェクト用）
 * @param obj コピー対象のオブジェクト
 * @returns コピーされたオブジェクト
 */
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ==================== パスワードハッシュ化ユーティリティ ====================

/**
 * ランダムなsaltを生成
 * @returns 16進数文字列のsalt（64文字）
 */
export function generateSalt(): string {
  // 256ビット（32バイト）のランダムデータを生成
  const randomBytes = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  return randomBytes.substring(0, 64);
}

/**
 * パスワードをSHA-256でハッシュ化
 * @param password 平文パスワード
 * @param salt ソルト
 * @returns ハッシュ化されたパスワード（16進数文字列）
 */
export function hashPassword(password: string, salt: string): string {
  const combined = password + salt;
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    combined,
    Utilities.Charset.UTF_8
  );
  
  // Byte配列を16進数文字列に変換
  return digest
    .map(byte => {
      // バイトを16進数に変換（負の値を正の値に変換）
      const hex = (byte < 0 ? byte + 256 : byte).toString(16);
      // 1桁の場合は先頭に0を追加
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * パスワードを検証
 * @param password 検証する平文パスワード
 * @param salt 保存されたソルト
 * @param storedHash 保存されたハッシュ
 * @returns パスワードが一致する場合true
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * パスワードの強度を検証
 * @param password チェック対象のパスワード
 * @returns バリデーションエラー（エラーがない場合はnull）
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'パスワードは8文字以上で入力してください';
  }
  
  // 英数字が含まれているかチェック
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return 'パスワードは英字と数字の両方を含む必要があります';
  }
  
  return null;
}
