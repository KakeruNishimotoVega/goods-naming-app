/**
 * カテゴリ関連API
 * カテゴリの取得、スキーマ取得、新規作成を担当
 */

/**
 * 【API】Supabaseからカテゴリ一覧を取得
 * @returns カテゴリ一覧の配列
 */
export function getCategories() {
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
}

/**
 * 【API】指定されたカテゴリのスキーマ（types + keywords + regulations）を取得
 * @param categoryId カテゴリID (uuid)
 * @returns カテゴリスキーマオブジェクト
 */
export function getSchemaForCategory(categoryId: string) {
  if (!categoryId) {
    throw new Error('categoryIdが指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 1. カテゴリ情報を取得
  const categoryEndpoint = `${supabaseUrl}/rest/v1/categories?select=*&id=eq.${categoryId}`;
  const categoryResponse = UrlFetchApp.fetch(categoryEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (categoryResponse.getResponseCode() !== 200) {
    throw new Error(`カテゴリ取得エラー: ${categoryResponse.getContentText()}`);
  }

  const categories = JSON.parse(categoryResponse.getContentText());
  if (categories.length === 0) {
    throw new Error(`指定されたカテゴリが見つかりません: ${categoryId}`);
  }
  const category = categories[0];

  // 2. Typesを取得（priority順）
  const typesEndpoint = `${supabaseUrl}/rest/v1/types?select=*&category_id=eq.${categoryId}&order=priority.asc`;
  const typesResponse = UrlFetchApp.fetch(typesEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  if (typesResponse.getResponseCode() !== 200) {
    throw new Error(`Types取得エラー: ${typesResponse.getContentText()}`);
  }

  const types = JSON.parse(typesResponse.getContentText());

  // 3. 各TypeのKeywordsを取得
  const typesWithKeywords = types.map((type: any) => {
    const keywordsEndpoint = `${supabaseUrl}/rest/v1/keywords?select=*&type_id=eq.${type.id}&order=priority.asc`;
    const keywordsResponse = UrlFetchApp.fetch(keywordsEndpoint, {
      method: 'get',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });

    const keywords = keywordsResponse.getResponseCode() === 200
      ? JSON.parse(keywordsResponse.getContentText())
      : [];

    return {
      type: type,
      keywords: keywords
    };
  });

  // 4. Regulationsを取得
  const regulationsEndpoint = `${supabaseUrl}/rest/v1/regulations?select=*&category_id=eq.${categoryId}`;
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

  // 5. Fieldsを取得（全カテゴリ共通）
  const fieldsEndpoint = `${supabaseUrl}/rest/v1/fields?select=*&order=priority.asc`;
  const fieldsResponse = UrlFetchApp.fetch(fieldsEndpoint, {
    method: 'get',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });

  const fields = fieldsResponse.getResponseCode() === 200
    ? JSON.parse(fieldsResponse.getContentText())
    : [];

  // 6. すべてをまとめて返す
  return {
    category: category,
    fields: fields,
    types: typesWithKeywords,
    regulations: regulations
  };
}

/**
 * 【API】新しいカテゴリをウィザードから作成
 * @param wizardData ウィザードから送信されたカテゴリ作成データ
 * @returns 作成されたカテゴリID
 */
export function createNewCategory(wizardData: any) {
  if (!wizardData || !wizardData.categoryName) {
    throw new Error('カテゴリ名が指定されていません。');
  }

  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('環境変数が設定されていません。');
  }

  // 1. Categoryを作成
  const categoryEndpoint = `${supabaseUrl}/rest/v1/categories`;
  const categoryPayload = {
    name: wizardData.categoryName
  };

  const categoryResponse = UrlFetchApp.fetch(categoryEndpoint, {
    method: 'post',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(categoryPayload),
    muteHttpExceptions: true
  });

  if (categoryResponse.getResponseCode() !== 201) {
    throw new Error(`カテゴリ作成エラー: ${categoryResponse.getContentText()}`);
  }

  const createdCategory = JSON.parse(categoryResponse.getContentText())[0];
  const categoryId = createdCategory.id;

  // 2. Typesを作成（wizardData.typesが存在する場合）
  if (wizardData.types && Array.isArray(wizardData.types)) {
    const typesEndpoint = `${supabaseUrl}/rest/v1/types`;

    wizardData.types.forEach((typeData: any, index: number) => {
      const typePayload = {
        category_id: categoryId,
        key_name: typeData.key_name,
        display_name: typeData.display_name,
        priority: index + 1,
        is_required: typeData.is_required || false,
        selection_type: typeData.selection_type,
        description: typeData.description || null,
        placeholder: typeData.placeholder || null
      };

      const typeResponse = UrlFetchApp.fetch(typesEndpoint, {
        method: 'post',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        payload: JSON.stringify(typePayload),
        muteHttpExceptions: true
      });

      if (typeResponse.getResponseCode() !== 201) {
        throw new Error(`Type作成エラー: ${typeResponse.getContentText()}`);
      }

      const createdType = JSON.parse(typeResponse.getContentText())[0];
      const typeId = createdType.id;

      // 3. Keywordsを作成（typeData.keywordsが存在する場合）
      if (typeData.keywords && Array.isArray(typeData.keywords)) {
        const keywordsEndpoint = `${supabaseUrl}/rest/v1/keywords`;

        typeData.keywords.forEach((keywordText: string, keywordIndex: number) => {
          const keywordPayload = {
            type_id: typeId,
            keyword: keywordText,
            priority: keywordIndex + 1
          };

          const keywordResponse = UrlFetchApp.fetch(keywordsEndpoint, {
            method: 'post',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            payload: JSON.stringify(keywordPayload),
            muteHttpExceptions: true
          });

          if (keywordResponse.getResponseCode() !== 201) {
            Logger.log(`Keyword作成エラー（無視して続行）: ${keywordResponse.getContentText()}`);
          }
        });
      }
    });
  }

  // 4. Regulationsを作成（wizardData.regulationsが存在する場合）
  if (wizardData.regulations && Array.isArray(wizardData.regulations)) {
    const regulationsEndpoint = `${supabaseUrl}/rest/v1/regulations`;

    wizardData.regulations.forEach((regulationData: any) => {
      const regulationPayload = {
        category_id: categoryId,
        target: regulationData.target,
        pattern_string: regulationData.pattern_string
      };

      const regulationResponse = UrlFetchApp.fetch(regulationsEndpoint, {
        method: 'post',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(regulationPayload),
        muteHttpExceptions: true
      });

      if (regulationResponse.getResponseCode() !== 201) {
        Logger.log(`Regulation作成エラー（無視して続行）: ${regulationResponse.getContentText()}`);
      }
    });
  }

  // 5. 作成されたカテゴリIDを返す
  return {
    success: true,
    categoryId: categoryId,
    message: `カテゴリ「${wizardData.categoryName}」を作成しました。`
  };
}
