/**
 * Keyword（選択肢）管理API
 * Typeに属するキーワードの追加、更新、削除を担当
 */

/**
 * 【API】新規Keywordを追加
 * @param typeId Type ID
 * @param keyword キーワード文字列またはキーワードオブジェクト
 * @returns 作成されたKeyword情報
 */
export function addKeyword(typeId: string, keyword: string | any) {
  if (!typeId) {
    throw new Error('typeIdが指定されていません。');
  }

  if (!keyword) {
    throw new Error('keywordが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 既存のKeywordsの最大priorityを取得して+1する
  const maxPriorityEndpoint = `${supabaseUrl}/rest/v1/keywords?select=priority&type_id=eq.${typeId}&order=priority.desc&limit=1`;
  const maxPriorityResponse = UrlFetchApp.fetch(maxPriorityEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  let nextPriority = 1;
  if (maxPriorityResponse.getResponseCode() === 200) {
    const maxPriorityData = JSON.parse(maxPriorityResponse.getContentText());
    if (maxPriorityData.length > 0 && maxPriorityData[0].priority !== null) {
      nextPriority = maxPriorityData[0].priority + 1;
    }
  }

  // keywordが文字列の場合とオブジェクトの場合を処理
  let keywordText: string;
  let priority: number;

  if (typeof keyword === 'string') {
    keywordText = keyword;
    priority = nextPriority;
  } else {
    keywordText = keyword.keyword;
    priority = keyword.priority !== undefined ? keyword.priority : nextPriority;
  }

  // Keywordを作成
  const endpoint = `${supabaseUrl}/rest/v1/keywords`;
  const payload = {
    type_id: typeId,
    keyword: keywordText,
    priority: priority
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
    throw new Error(`Keyword作成エラー: ${response.getContentText()}`);
  }

  const createdKeyword = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    keyword: createdKeyword,
    message: `Keyword「${keywordText}」を作成しました。`
  };
}

/**
 * 【API】既存のKeywordを更新
 * @param keywordData 更新するKeyword情報（idを含む）
 * @returns 更新されたKeyword情報
 */
export function updateKeyword(keywordData: any) {
  if (!keywordData || !keywordData.id) {
    throw new Error('Keyword IDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 更新するフィールドのみを抽出
  const updatePayload: any = {};

  if (keywordData.keyword !== undefined) updatePayload.keyword = keywordData.keyword;
  if (keywordData.priority !== undefined) updatePayload.priority = keywordData.priority;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error('更新する項目が指定されていません。');
  }

  const endpoint = `${supabaseUrl}/rest/v1/keywords?id=eq.${keywordData.id}`;
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'patch',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(updatePayload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`Keyword更新エラー: ${response.getContentText()}`);
  }

  const updatedKeyword = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    keyword: updatedKeyword,
    message: `Keyword「${updatedKeyword.keyword}」を更新しました。`
  };
}

/**
 * 【API】Keywordを削除
 * @param payload 削除するKeywordのIDまたは{id: string}オブジェクト
 * @returns 削除結果
 */
export function deleteKeyword(payload: string | any) {
  let keywordId: string;

  if (typeof payload === 'string') {
    keywordId = payload;
  } else if (payload && payload.id) {
    keywordId = payload.id;
  } else {
    throw new Error('Keyword IDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // Keywordの情報を取得（削除前に情報を保存）
  const getEndpoint = `${supabaseUrl}/rest/v1/keywords?select=*&id=eq.${keywordId}`;
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
    throw new Error(`Keyword取得エラー: ${getResponse.getContentText()}`);
  }

  const keywords = JSON.parse(getResponse.getContentText());
  if (keywords.length === 0) {
    throw new Error(`指定されたKeywordが見つかりません: ${keywordId}`);
  }

  const keywordToDelete = keywords[0];

  // Keywordを削除
  const deleteEndpoint = `${supabaseUrl}/rest/v1/keywords?id=eq.${keywordId}`;
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
    throw new Error(`Keyword削除エラー: ${deleteResponse.getContentText()}`);
  }

  return {
    success: true,
    message: `Keyword「${keywordToDelete.keyword}」を削除しました。`
  };
}
