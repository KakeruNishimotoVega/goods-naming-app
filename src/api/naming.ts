/**
 * 命名生成API
 * フォームデータから商品名・ページ名を生成し、NGワードチェックを行う
 */

/**
 * 【API】商品名・ページ名を生成
 * @param formData フォームデータ（categoryId, fields, types）
 * @returns 生成結果（キャッチコピー、商品名、NGワード検出情報）
 */
export function generateNames(formData: any) {
  if (!formData || !formData.categoryId) {
    throw new Error('カテゴリIDが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 1. Regulationsを取得
  const regulationsEndpoint = `${supabaseUrl}/rest/v1/regulations?select=*&category_id=eq.${formData.categoryId}`;
  const regulationsResponse = UrlFetchApp.fetch(regulationsEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (regulationsResponse.getResponseCode() !== 200) {
    throw new Error(`Regulations取得エラー: ${regulationsResponse.getContentText()}`);
  }

  const regulations = JSON.parse(regulationsResponse.getContentText());

  // 2. 置換用のデータを準備
  const replacementData: Record<string, string> = {};

  // fieldsデータを追加
  if (formData.fields) {
    Object.keys(formData.fields).forEach(key => {
      replacementData[key] = formData.fields[key] || '';
    });
  }

  // typesデータを追加（フロントエンドから既にkeyword文字列として送信される）
  if (formData.types) {
    Object.keys(formData.types).forEach(keyName => {
      replacementData[keyName] = formData.types[keyName] || '';
    });
  }

  // 3. 各regulationのpattern_stringを置換
  let productPageName = '';
  let productName = '';

  regulations.forEach((regulation: any) => {
    let result = regulation.pattern_string;

    // プレースホルダー {key_name} を実際の値に置換
    Object.keys(replacementData).forEach(key => {
      const placeholder = `{${key}}`;
      const value = replacementData[key] || '';
      // グローバル置換を実行
      result = result.split(placeholder).join(value);
    });

    // 未置換のプレースホルダー（値が入力されていない項目）を削除
    // パターン: {任意の文字列} を空文字列に置換
    result = result.replace(/\{[^}]+\}/g, '');

    // 連続するスペースを1つにまとめ、前後の空白を削除
    result = result.replace(/\s+/g, ' ').trim();

    // targetに応じて結果を振り分け
    if (regulation.target === 'キャッチコピー') {
      productPageName = result;
    } else if (regulation.target === '商品名') {
      productName = result;
    }
  });

  // 4. NGワードをチェック
  const ngWordsEndpoint = `${supabaseUrl}/rest/v1/prohibited_words?select=*`;
  const ngWordsResponse = UrlFetchApp.fetch(ngWordsEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  let prohibitedWordsFound: Array<{
    word: string;
    reason: string | null;
    target: 'productPageName' | 'productName';
  }> = [];

  if (ngWordsResponse.getResponseCode() === 200) {
    const ngWords = JSON.parse(ngWordsResponse.getContentText());

    ngWords.forEach((ngWord: any) => {
      // キャッチコピーにNGワードが含まれているかチェック
      if (productPageName.includes(ngWord.word)) {
        prohibitedWordsFound.push({
          word: ngWord.word,
          reason: ngWord.reason,
          target: 'productPageName'
        });
      }

      // 商品名にNGワードが含まれているかチェック
      if (productName.includes(ngWord.word)) {
        prohibitedWordsFound.push({
          word: ngWord.word,
          reason: ngWord.reason,
          target: 'productName'
        });
      }
    });
  }

  // 5. 結果を返す
  return {
    productPageName: productPageName,
    productName: productName,
    prohibitedWordsFound: prohibitedWordsFound,
    characterCounts: {
      productPageName: productPageName.length,
      productName: productName.length
    }
  };
}
