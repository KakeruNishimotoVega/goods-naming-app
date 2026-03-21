/**
 * NGワード管理API
 * 禁止ワードの取得、追加、更新、削除を担当
 */

/**
 * 【API】NGワード一覧を取得
 * @returns NGワード一覧
 */
export function getNgWords() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  const endpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*&order=created_at.asc`;

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`NGワード取得エラー: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

/**
 * 【API】NGワードを追加
 * @param word 禁止ワード
 * @param reason 禁止理由（オプション）
 * @returns 作成されたNGワード情報
 */
export function addNgWord(word: string, reason?: string) {
  if (!word) {
    throw new Error('禁止ワードが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  const endpoint = `${supabaseUrl}/rest/v1/prohibited_words`;
  const payload = {
    word: word,
    reason: reason || null
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 201) {
    throw new Error(`NGワード追加エラー: ${response.getContentText()}`);
  }

  const createdNgWord = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    ngWord: createdNgWord,
    message: `NGワード「${word}」を追加しました。`
  };
}

/**
 * 【API】NGワードを更新
 * @param id NGワードID
 * @param word 禁止ワード
 * @param reason 禁止理由（オプション）
 * @returns 更新されたNGワード情報
 */
export function updateNgWord(id: string, word: string, reason?: string) {
  if (!id) {
    throw new Error('NGワードIDが指定されていません。');
  }

  if (!word) {
    throw new Error('禁止ワードが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  const endpoint = `${supabaseUrl}/rest/v1/prohibited_words?id=eq.${id}`;
  const payload = {
    word: word,
    reason: reason !== undefined ? reason : null
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'patch',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`NGワード更新エラー: ${response.getContentText()}`);
  }

  const updatedNgWord = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    ngWord: updatedNgWord,
    message: `NGワード「${word}」を更新しました。`
  };
}

/**
 * 【API】NGワードを削除
 * @param id NGワードID
 * @returns 削除結果
 */
export function deleteNgWord(id: string) {
  if (!id) {
    throw new Error('NGワードIDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // NGワードの情報を取得（削除前に情報を保存）
  const getEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*&id=eq.${id}`;
  const getResponse = UrlFetchApp.fetch(getEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (getResponse.getResponseCode() !== 200) {
    throw new Error(`NGワード取得エラー: ${getResponse.getContentText()}`);
  }

  const ngWords = JSON.parse(getResponse.getContentText());
  if (ngWords.length === 0) {
    throw new Error(`指定されたNGワードが見つかりません: ${id}`);
  }

  const ngWordToDelete = ngWords[0];

  // NGワードを削除
  const deleteEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?id=eq.${id}`;
  const deleteResponse = UrlFetchApp.fetch(deleteEndpoint, {
    method: 'delete',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (deleteResponse.getResponseCode() !== 204) {
    throw new Error(`NGワード削除エラー: ${deleteResponse.getContentText()}`);
  }

  return {
    success: true,
    message: `NGワード「${ngWordToDelete.word}」を削除しました。`
  };
}
