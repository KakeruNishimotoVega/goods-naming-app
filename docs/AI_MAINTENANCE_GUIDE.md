# AI保守運用ガイド

このドキュメントは、AI（Claude Code等）がこのプロジェクトを効率的に保守・修正できるよう設計されています。

---

## プロジェクト構造（AI向け）

```
lowya-goods-naming-app/
├── src/
│   ├── index.ts              # エントリーポイント (doGet, グローバルエクスポート)
│   ├── index.html            # フロントエンド UI
│   ├── api/                  # バックエンドAPI (Supabase通信)
│   │   ├── categories.ts     # カテゴリ関連API
│   │   ├── types.ts          # Type（入力項目）管理API
│   │   ├── keywords.ts       # Keyword（選択肢）管理API
│   │   ├── regulations.ts    # Regulation（命名ルール）管理API
│   │   └── ngwords.ts        # NGワード管理API
│   ├── lib/                  # 共通ライブラリ
│   │   ├── supabase.ts       # Supabase接続ヘルパー
│   │   └── utils.ts          # 汎用ユーティリティ
│   └── types/                # TypeScript型定義
│       └── index.ts          # 共通型定義
├── docs/
│   ├── DATABASE_SCHEMA.md    # DBスキーマ定義 (**必読**)
│   ├── API_SPEC.md           # API仕様書
│   ├── REPLACE_PLAN.md       # リプレイス計画書
│   └── raw/                  # 移行前のコード（参考用）
└── CLAUDE.md                 # プロジェクト設定とルール
```

---

## 修正タスクの進め方

### ステップ1: 必読ファイルの確認
タスクを受け取ったら、まず以下を読んでコンテキストを把握してください：

1. **`CLAUDE.md`**: プロジェクト全体のルールと制約
2. **`docs/DATABASE_SCHEMA.md`**: DBスキーマとテーブル構造
3. **`docs/REPLACE_PLAN.md`**: 実装済み機能と未実装機能の確認

### ステップ2: 関連ファイルの特定
- **機能単位で分割されているため、変更箇所は限定的**
- 例: カテゴリ一覧のバグ → `src/api/categories.ts` を確認
- 例: UI表示の問題 → `src/index.html` のテンプレートを確認

### ステップ3: 最小限のファイル読み込み
- **トークン節約**: 関連ファイルだけを `Read` する
- **Grep/Globの活用**: 該当コードを探す際は検索ツールを優先

### ステップ4: 修正の実施
- **Edit ツールを優先**: 差分のみを送信
- **型安全性の維持**: TypeScriptエラーが出ないよう注意
- **GASの制約を遵守**: `(global as any).関数名` のエクスポートを忘れずに

### ステップ5: ドキュメント更新
修正内容によっては以下も更新：
- `docs/API_SPEC.md`: API仕様が変わった場合
- `docs/DATABASE_SCHEMA.md`: テーブル構造が変わった場合
- `MEMORY.md`: 重要な設計判断や制約を発見した場合

---

## よくある修正パターン

### パターン1: 新しいAPI関数の追加
1. `src/api/` に適切なファイルを作成または編集
2. Supabase REST APIを`UrlFetchApp`で呼び出す実装
3. `src/index.ts` でグローバルにエクスポート
4. `docs/API_SPEC.md` に仕様を追記

### パターン2: DBスキーマの変更
1. Supabase MCPツールでマイグレーション作成 (`mcp__supabase__apply_migration`)
2. `docs/DATABASE_SCHEMA.md` を更新
3. 影響を受けるAPI関数を修正
4. TypeScript型定義を更新 (`src/types/index.ts`)

### パターン3: フロントエンドUIの修正
1. `src/index.html` の該当テンプレート部分を特定
2. Tailwind CSSクラスを使ってスタイリング
3. JavaScript部分は既存パターンに従う（`window.関数名`形式）

### パターン4: ビジネスロジックの修正
1. `src/api/` 内の該当関数を特定
2. ロジック変更時は必ずコメントで理由を記載
3. 複雑な処理は `src/lib/utils.ts` にヘルパー関数として切り出す

---

## トークン節約のベストプラクティス

### 1. 段階的な情報収集
❌ **悪い例**: すべてのファイルを一度に読み込む
```
Read src/index.ts
Read src/api/categories.ts
Read src/api/types.ts
...（全ファイル読み込み）
```

✅ **良い例**: 必要なファイルだけを読む
```
1. Grep でエラー箇所を特定
2. 該当ファイルのみ Read
3. 依存ファイルが必要なら追加で Read
```

### 2. Grepの活用
関数定義やエラーメッセージを探す際は `Grep` を使用：
```
Grep pattern="function getCategories" path="src/"
```

### 3. 部分的な読み込み
大きなファイルは `offset` と `limit` を活用：
```
Read file_path="src/index.html" offset=1 limit=200
```

### 4. Supabase MCPツールの活用
DBを直接確認する際は以下のツールを使用：
- `mcp__supabase__list_tables`: テーブル一覧
- `mcp__supabase__execute_sql`: SQL実行
- `mcp__supabase__get_advisors`: パフォーマンス最適化のアドバイス

---

## エラーハンドリングの原則

### GAS環境特有の制約
- `@supabase/supabase-js` は使えない → `UrlFetchApp` で REST API 呼び出し
- 環境変数は `PropertiesService.getScriptProperties()` から取得
- 非同期処理は GAS の制約に注意

### エラーメッセージの設計
- ユーザーフレンドリーなメッセージを返す
- デバッグ情報は `Logger.log()` に出力
- エラーオブジェクトに `error` プロパティを含める

例:
```typescript
return {
  error: "カテゴリの取得に失敗しました",
  details: error.message // 開発用
};
```

---

## 禁止事項

以下は**絶対に実施しないでください**：

1. **未テストの大規模リファクタリング**: 動作確認なしに複数ファイルを書き換えない
2. **GASエクスポートの削除**: `(global as any).関数名` を削除すると GAS から呼び出せなくなる
3. **直接的なDB操作**: 必ず Supabase MCP ツールまたは REST API 経由で操作
4. **ドキュメントの放置**: コード変更したらドキュメントも更新
5. **過度な抽象化**: 不要なレイヤーやパターンを追加しない（KISS原則）

---

## PR作成時のチェックリスト

修正完了後、以下を確認してください：

- [ ] `npm run build` が成功する
- [ ] TypeScriptの型エラーがない
- [ ] GAS関数がグローバルにエクスポートされている
- [ ] 関連ドキュメントを更新した
- [ ] `MEMORY.md` に重要な変更を記録した（必要に応じて）
- [ ] `docs/REPLACE_PLAN.md` のチェックボックスを更新した

---

## Skills活用（将来実装予定）

将来的には以下のカスタムSkillsを作成し、定型作業を自動化します：

- `/add-api-endpoint <name>`: 新しいAPI関数のスケルトンを生成
- `/update-schema`: DBスキーマの変更を検出し、ドキュメントを自動更新
- `/generate-types`: Supabaseスキーマから TypeScript 型定義を生成
- `/test-endpoint <name>`: API関数のテストコードを生成

---

## 質問がある場合

不明点があれば以下のファイルを参照してください：

1. **技術的な制約**: `CLAUDE.md`
2. **DB構造**: `docs/DATABASE_SCHEMA.md`
3. **API仕様**: `docs/API_SPEC.md`（今後作成予定）
4. **過去の判断**: `MEMORY.md`

それでも不明な場合は、ユーザーに質問してください。
