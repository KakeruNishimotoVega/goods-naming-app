/**
 * Type（入力項目）管理API
 * カテゴリに属する入力項目の追加、更新、削除を担当
 */

/**
 * 【API】新規Typeを追加
 * @param categoryId カテゴリID
 * @param typeData Type情報
 * @returns 作成されたType情報
 */
export function addType(categoryId: string, typeData: any) {
  if (!categoryId) {
    throw new Error('categoryIdが指定されていません。');
  }

  if (!typeData || !typeData.key_name || !typeData.display_name || !typeData.selection_type) {
    throw new Error('必須項目（key_name, display_name, selection_type）が不足しています。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 既存のTypesの最大priorityを取得して+1する
  const maxPriorityEndpoint = `${supabaseUrl}/rest/v1/types?select=priority&category_id=eq.${categoryId}&order=priority.desc&limit=1`;
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

  // Typeを作成
  const endpoint = `${supabaseUrl}/rest/v1/types`;
  const payload = {
    category_id: categoryId,
    key_name: typeData.key_name,
    display_name: typeData.display_name,
    priority: typeData.priority !== undefined ? typeData.priority : nextPriority,
    is_required: typeData.is_required || false,
    selection_type: typeData.selection_type,
    description: typeData.description || null,
    placeholder: typeData.placeholder || null
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
    throw new Error(`Type作成エラー: ${response.getContentText()}`);
  }

  const createdType = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    type: createdType,
    message: `Type「${typeData.display_name}」を作成しました。`
  };
}

/**
 * 【API】既存のTypeを更新
 * @param typeObject 更新するType情報（idを含む）
 * @returns 更新されたType情報
 */
export function updateType(typeObject: any) {
  if (!typeObject || !typeObject.id) {
    throw new Error('Type IDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 更新するフィールドのみを抽出
  const updatePayload: any = {};

  if (typeObject.key_name !== undefined) updatePayload.key_name = typeObject.key_name;
  if (typeObject.display_name !== undefined) updatePayload.display_name = typeObject.display_name;
  if (typeObject.priority !== undefined) updatePayload.priority = typeObject.priority;
  if (typeObject.is_required !== undefined) updatePayload.is_required = typeObject.is_required;
  if (typeObject.selection_type !== undefined) updatePayload.selection_type = typeObject.selection_type;
  if (typeObject.description !== undefined) updatePayload.description = typeObject.description;
  if (typeObject.placeholder !== undefined) updatePayload.placeholder = typeObject.placeholder;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error('更新する項目が指定されていません。');
  }

  const endpoint = `${supabaseUrl}/rest/v1/types?id=eq.${typeObject.id}`;
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
    throw new Error(`Type更新エラー: ${response.getContentText()}`);
  }

  const updatedType = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    type: updatedType,
    message: `Type「${updatedType.display_name}」を更新しました。`
  };
}

/**
 * 【API】Typeを削除（関連するKeywordsも連鎖削除される）
 * @param typeId Type ID
 * @returns 削除結果
 */
export function deleteType(typeId: string) {
  if (!typeId) {
    throw new Error('Type IDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // Typeの情報を取得（削除前に情報を保存）
  const getEndpoint = `${supabaseUrl}/rest/v1/types?select=*&id=eq.${typeId}`;
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
    throw new Error(`Type取得エラー: ${getResponse.getContentText()}`);
  }

  const types = JSON.parse(getResponse.getContentText());
  if (types.length === 0) {
    throw new Error(`指定されたTypeが見つかりません: ${typeId}`);
  }

  const typeToDelete = types[0];

  // 関連するKeywordsを削除
  const deleteKeywordsEndpoint = `${supabaseUrl}/rest/v1/keywords?type_id=eq.${typeId}`;
  const deleteKeywordsResponse = UrlFetchApp.fetch(deleteKeywordsEndpoint, {
    method: 'delete',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (deleteKeywordsResponse.getResponseCode() !== 204) {
    Logger.log(`Keywords削除エラー（無視して続行）: ${deleteKeywordsResponse.getContentText()}`);
  }

  // Typeを削除
  const deleteEndpoint = `${supabaseUrl}/rest/v1/types?id=eq.${typeId}`;
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
    throw new Error(`Type削除エラー: ${deleteResponse.getContentText()}`);
  }

  return {
    success: true,
    message: `Type「${typeToDelete.display_name}」を削除しました。`
  };
}
