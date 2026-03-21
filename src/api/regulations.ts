/**
 * Regulation（命名ルール）管理API
 * カテゴリに属する命名ルールの更新を担当
 */

/**
 * 【API】Regulationを更新
 * @param regulationObject 更新するRegulation情報（idを含む）
 * @returns 更新されたRegulation情報
 */
export function updateRegulation(regulationObject: any) {
  if (!regulationObject || !regulationObject.id) {
    throw new Error('Regulation IDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 更新するフィールドのみを抽出
  const updatePayload: any = {};

  if (regulationObject.target !== undefined) updatePayload.target = regulationObject.target;
  if (regulationObject.pattern_string !== undefined) updatePayload.pattern_string = regulationObject.pattern_string;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error('更新する項目が指定されていません。');
  }

  const endpoint = `${supabaseUrl}/rest/v1/regulations?id=eq.${regulationObject.id}`;
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
    throw new Error(`Regulation更新エラー: ${response.getContentText()}`);
  }

  const updatedRegulation = JSON.parse(response.getContentText())[0];

  return {
    success: true,
    regulation: updatedRegulation,
    message: `Regulation「${updatedRegulation.target}」を更新しました。`
  };
}
