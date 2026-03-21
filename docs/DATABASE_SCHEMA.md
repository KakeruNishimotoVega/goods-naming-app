# データベーススキーマ定義書

## 概要
LOWYA商品命名アプリのデータベーススキーマ定義。Supabase (PostgreSQL) を使用。

**最終更新:** 2026-03-21
**データソース:** Supabase MCP経由で取得

---

## テーブル一覧

### 1. categories（カテゴリ）
商品カテゴリのマスタテーブル。

**現在のレコード数:** 3件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | カテゴリID（自動生成） |
| name | text | NOT NULL | - | カテゴリ名（例: N人掛けソファ・座椅子） |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

**外部キー参照元:**
- types.category_id → categories.id
- regulations.category_id → categories.id

**データ例:**
- N人掛けソファ・座椅子
- オットマン
- ソファカバー

---

### 2. types（タイプ・入力項目定義）
各カテゴリに対する入力項目の定義テーブル。

**現在のレコード数:** 16件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | タイプID（自動生成） |
| category_id | uuid | FOREIGN KEY → categories(id) | - | 所属カテゴリ |
| key_name | text | NOT NULL | - | 項目のキー名（例: 幅N、N人掛け） |
| display_name | text | NOT NULL | - | 表示用の名称 |
| priority | integer | NULLABLE | 0 | 表示優先度（小さい順に表示） |
| is_required | boolean | NULLABLE | false | 必須項目かどうか |
| selection_type | text | NOT NULL | - | 選択タイプ（SINGLE/MULTI/text） |
| description | text | NULLABLE | - | 項目の説明文 |
| placeholder | text | NULLABLE | - | 入力欄のプレースホルダー |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

**外部キー参照元:**
- keywords.type_id → types.id

**selection_typeの値:**
- `TEXT`: フリーテキスト入力
- `SINGLE`: 単一選択（ラジオボタン）
- `MULTI`: 複数選択（チェックボックス）
- `BOOLEAN`: ON/OFF切り替え（トグル）

**データ例:**
- 幅N (text入力、優先度1)
- N人掛け (SINGLE選択、必須、優先度2)
- カテゴリ (SINGLE選択、必須、優先度3)

---

### 3. keywords（キーワード・選択肢）
typesの選択肢として使用されるキーワードマスタ。

**現在のレコード数:** 64件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | キーワードID（自動生成） |
| type_id | uuid | FOREIGN KEY → types(id) | - | 所属タイプ |
| keyword | text | NOT NULL | - | キーワード文字列（例: 2人掛け、ソファ） |
| priority | integer | NULLABLE | 0 | 表示優先度（小さい順に表示） |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

**データ例（N人掛けタイプの選択肢）:**
- 1人掛け (優先度1)
- 2人掛け (優先度2)
- 3人掛け (優先度3)

---

### 4. regulations（命名規則）
カテゴリごとの商品名生成パターンを定義。

**現在のレコード数:** 6件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 規則ID（自動生成） |
| category_id | uuid | FOREIGN KEY → categories(id) | - | 対象カテゴリ |
| target | text | NOT NULL | - | 適用対象（キャッチコピー/商品名） |
| pattern_string | text | NOT NULL | - | パターン文字列（{key_name}形式） |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

**パターン文字列の記法:**
- `{key_name}`: typesのkey_nameで置換される
- `{nickname}`: fieldsのnicknameで置換される
- 例: `{nickname} / {N人掛け}{カテゴリ}`

**データ例:**
- キャッチコピー: `{nickname} / {N人掛け}{カテゴリ}`
- 商品名: `[{幅N}] {N人掛け} {カテゴリ} {機能性・付属} {内部構造} {張地素材} {脚部素材} {テイスト}`

---

### 5. fields（汎用入力フィールド）
カテゴリに依存しない共通の入力項目定義。

**現在のレコード数:** 1件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | フィールドID（自動生成） |
| field_key | text | NOT NULL, UNIQUE | - | フィールドのキー（例: nickname） |
| display_name | text | NOT NULL | - | 表示用の名称（例: 愛称） |
| input_type | text | NOT NULL | - | 入力タイプ（text/number/etc） |
| priority | integer | NULLABLE | 0 | 表示優先度 |
| placeholder | text | NULLABLE | - | プレースホルダー |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

**データ例:**
- field_key: `nickname`, display_name: `愛称`, placeholder: `グッピー`

---

### 6. prohibited_words（禁止ワード）
商品名に使用してはいけないワードのマスタ。

**現在のレコード数:** 17件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | 禁止ワードID（自動生成） |
| word | text | NOT NULL, UNIQUE | - | 禁止ワード |
| reason | text | NULLABLE | - | 禁止理由 |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

**データ例:**
- `IKEA` (理由: 他社の商標)
- `ニトリ` (理由: 他社の商標)
- `国産` (理由: 「日本製」に統一するため)

### 7. app_users（アプリユーザー）
アプリケーションのユーザー管理テーブル。

**現在のレコード数:** 0件
**RLS有効:** Yes

| カラム名 | 型 | 制約 | デフォルト値 | 説明 |
|---------|-----|------|-------------|------|
| id | uuid | PRIMARY KEY | gen_random_uuid() | ユーザーID（自動生成） |
| email | text | NOT NULL, UNIQUE | - | ユーザーのメールアドレス |
| role | text | NOT NULL | 'editor'::text | ユーザーの権限ロール |
| created_at | timestamptz | NOT NULL | timezone('utc'::text, now()) | 作成日時（UTC） |

---

## リレーション図

```
categories (1) ──→ (N) types
                    ↓
                 keywords (N)

categories (1) ──→ (N) regulations

fields (独立)

prohibited_words (独立)

app_users (独立)
```

---

## インデックス推奨

パフォーマンス向上のため、以下のインデックスを推奨：

```sql
-- typesのカテゴリ検索用
CREATE INDEX idx_types_category_id ON types(category_id);
CREATE INDEX idx_types_priority ON types(category_id, priority);

-- keywordsのタイプ検索用
CREATE INDEX idx_keywords_type_id ON keywords(type_id);
CREATE INDEX idx_keywords_priority ON keywords(type_id, priority);

-- regulationsのカテゴリ検索用
CREATE INDEX idx_regulations_category_id ON regulations(category_id);

-- prohibited_wordsの検索用
CREATE INDEX idx_prohibited_words_word ON prohibited_words(word);
```

---

## 備考

- すべてのテーブルでプライマリキーはuuid型を使用
- タイムスタンプはすべてtimestamptz（タイムゾーン付きタイムスタンプ）で UTC保存
- すべてのテーブルでRow Level Security (RLS) が有効化されている
- 外部キー制約が設定されており、データの整合性が保たれている
- updated_atカラムは現在のスキーマには存在しない（created_atのみ）
