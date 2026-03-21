# API仕様書

## 概要
このドキュメントは、LOWYA商品命名アプリのバックエンドAPI仕様を定義します。
全てのAPIはGoogle Apps Script環境で動作し、フロントエンドから`google.script.run`を通じて呼び出されます。

---

## 共通仕様

### エラーレスポンス形式
```typescript
{
  error: string;      // ユーザー向けエラーメッセージ
  details?: any;      // デバッグ用の詳細情報
}
```

### 成功レスポンス形式
```typescript
{
  data: any;          // 実際のデータ
  message?: string;   // オプションの成功メッセージ
}
```

---

## Categories API (`src/api/categories.ts`)

### getCategories()
カテゴリ一覧を取得

**パラメータ**: なし

**レスポンス**:
```typescript
{
  data: Array<{
    id: number;
    name: string;
    created_at: string;
  }>
}
```

**エラー**:
- `"カテゴリの取得に失敗しました"`

---

### getSchemaForCategory(categoryId: number)
指定カテゴリのスキーマ（Types + Keywords + Regulations）を取得

**パラメータ**:
- `categoryId`: カテゴリID

**レスポンス**:
```typescript
{
  data: {
    category: {
      id: number;
      name: string;
    };
    types: Array<{
      id: number;
      name: string;
      priority: number;
      is_required: boolean;
      selection_type: 'single' | 'multiple' | 'text' | 'boolean';
      description: string;
      keywords: Array<{
        id: number;
        keyword: string;
        priority: number;
      }>;
    }>;
    regulation: {
      product_name_rule: string;
      page_name_rule: string;
    };
  }
}
```

**エラー**:
- `"スキーマの取得に失敗しました"`

---

### createNewCategory(wizardData: object)
ウィザードからカテゴリを新規作成

**パラメータ**:
```typescript
{
  categoryName: string;
  types: Array<{
    name: string;
    priority: number;
    is_required: boolean;
    selection_type: string;
    description: string;
    keywords: string[];  // キーワードの配列
  }>;
  productNameRule: string;
  pageNameRule: string;
}
```

**レスポンス**:
```typescript
{
  data: {
    categoryId: number;
  },
  message: "カテゴリを作成しました"
}
```

**エラー**:
- `"カテゴリの作成に失敗しました"`

---

## Types API (`src/api/types.ts`)

### addType(categoryId: number, typeData: object)
カテゴリに新しいTypeを追加

**パラメータ**:
```typescript
{
  categoryId: number;
  typeData: {
    name: string;
    priority: number;
    is_required: boolean;
    selection_type: 'single' | 'multiple' | 'text' | 'boolean';
    description: string;
  }
}
```

**レスポンス**:
```typescript
{
  data: { id: number },
  message: "項目を追加しました"
}
```

---

### updateType(typeObject: object)
既存のTypeを更新

**パラメータ**:
```typescript
{
  id: number;
  name?: string;
  priority?: number;
  is_required?: boolean;
  selection_type?: string;
  description?: string;
}
```

**レスポンス**:
```typescript
{
  message: "項目を更新しました"
}
```

---

### deleteType(typeId: number)
Typeを削除（関連するKeywordsも連鎖削除）

**パラメータ**:
- `typeId`: Type ID

**レスポンス**:
```typescript
{
  message: "項目を削除しました"
}
```

---

## Keywords API (`src/api/keywords.ts`)

### addKeyword(typeId: number, keyword: string)
Typeにキーワードを追加

**パラメータ**:
```typescript
{
  typeId: number;
  keyword: string;
}
```

**レスポンス**:
```typescript
{
  data: { id: number },
  message: "キーワードを追加しました"
}
```

---

### updateKeyword(typeId: number, keywordData: object)
キーワードを更新

**パラメータ**:
```typescript
{
  typeId: number;
  keywordData: {
    id: number;
    keyword: string;
    priority: number;
  }
}
```

**レスポンス**:
```typescript
{
  message: "キーワードを更新しました"
}
```

---

### deleteKeyword(payload: object)
キーワードを削除

**パラメータ**:
```typescript
{
  typeId: number;
  keywordId: number;
}
```

**レスポンス**:
```typescript
{
  message: "キーワードを削除しました"
}
```

---

## Regulations API (`src/api/regulations.ts`)

### updateRegulation(regulationObject: object)
命名ルールを更新

**パラメータ**:
```typescript
{
  category_id: number;
  product_name_rule?: string;
  page_name_rule?: string;
}
```

**レスポンス**:
```typescript
{
  message: "ルールを更新しました"
}
```

---

## NGWords API (`src/api/ngwords.ts`)

### getNgWords()
NGワード一覧を取得

**パラメータ**: なし

**レスポンス**:
```typescript
{
  data: Array<{
    id: number;
    word: string;
    reason: string;
    created_at: string;
  }>
}
```

---

### addNgWord(word: string, reason: string)
NGワードを追加

**パラメータ**:
```typescript
{
  word: string;
  reason: string;
}
```

**レスポンス**:
```typescript
{
  data: { id: number },
  message: "NGワードを追加しました"
}
```

---

### updateNgWord(id: number, word: string, reason: string)
NGワードを更新

**パラメータ**:
```typescript
{
  id: number;
  word: string;
  reason: string;
}
```

**レスポンス**:
```typescript
{
  message: "NGワードを更新しました"
}
```

---

### deleteNgWord(id: number)
NGワードを削除

**パラメータ**:
- `id`: NGワードID

**レスポンス**:
```typescript
{
  message: "NGワードを削除しました"
}
```

---

## Naming API (`src/api/naming.ts`)

### generateNames(formData: object)
商品名とページ名を生成

**パラメータ**:
```typescript
{
  categoryId: number;
  fields: {
    [key: string]: string | string[] | boolean;
  }
}
```

**レスポンス**:
```typescript
{
  data: {
    productName: string;
    pageName: string;
    warnings: string[];  // NGワード警告
    characterCounts: {
      productName: number;
      pageName: number;
    }
  }
}
```

**エラー**:
- `"命名の生成に失敗しました"`

---

## 実装状況

| API | ファイル | ステータス |
|-----|---------|----------|
| getCategories | categories.ts | ✅ 実装済み |
| getSchemaForCategory | categories.ts | 🔲 未実装 |
| createNewCategory | categories.ts | 🔲 未実装 |
| addType | types.ts | 🔲 未実装 |
| updateType | types.ts | 🔲 未実装 |
| deleteType | types.ts | 🔲 未実装 |
| addKeyword | keywords.ts | 🔲 未実装 |
| updateKeyword | keywords.ts | 🔲 未実装 |
| deleteKeyword | keywords.ts | 🔲 未実装 |
| updateRegulation | regulations.ts | 🔲 未実装 |
| getNgWords | ngwords.ts | 🔲 未実装 |
| addNgWord | ngwords.ts | 🔲 未実装 |
| updateNgWord | ngwords.ts | 🔲 未実装 |
| deleteNgWord | ngwords.ts | 🔲 未実装 |
| generateNames | naming.ts | 🔲 未実装 |
