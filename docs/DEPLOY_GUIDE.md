# デプロイガイド

## 前提条件

### 1. 環境変数の設定
GASのスクリプトプロパティに以下の環境変数を設定してください：

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**設定方法：**
1. GASエディタを開く
2. 左メニューから「プロジェクトの設定」（歯車アイコン）をクリック
3. 「スクリプト プロパティ」セクションで「スクリプト プロパティを編集」をクリック
4. 上記の2つのプロパティを追加

### 2. 必要なツール
- Node.js (v16以上)
- npm
- clasp (Google Apps Script CLI)

```bash
npm install -g @google/clasp
```

### 3. clasp認証
初回のみ、claspの認証が必要です：

```bash
clasp login
```

## デプロイ手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. ビルド
TypeScriptとHTMLをビルドします：

```bash
npm run build
```

このコマンドで以下が実行されます：
- `build.js`: TypeScriptファイルをバンドルして `dist/main.js` を生成
- `build-html.js`: HTML/CSS/JavaScriptを統合して `dist/index.html` を生成

**生成されるファイル：**
- `dist/main.js` - バックエンドAPI（GAS関数）
- `dist/index.html` - フロントエンド（UI）
- `dist/appsscript.json` - GAS設定ファイル

### 3. デプロイ
ビルドとデプロイを一度に実行：

```bash
npm run deploy
```

または、手動でデプロイ：

```bash
clasp push
```

### 4. ウェブアプリとして公開
初回デプロイ後、GASエディタで以下の設定を行います：

1. GASエディタを開く
2. 右上の「デプロイ」→「新しいデプロイ」をクリック
3. 「種類の選択」で「ウェブアプリ」を選択
4. 以下のように設定：
   - **説明**: `LOWYA商品命名アプリ`
   - **次のユーザーとして実行**: 自分（あなたのアカウント）
   - **アクセスできるユーザー**: 自分のみ（または組織内のユーザー）
5. 「デプロイ」をクリック
6. 表示されたURLをブックマーク

## トラブルシューティング

### ビルドエラー
```bash
# キャッシュをクリアして再ビルド
rm -rf dist
npm run build
```

### デプロイエラー
```bash
# claspの認証を再確認
clasp login

# .clasp.jsonの確認
cat .clasp.json
```

### 環境変数が反映されない
- GASのスクリプトプロパティを再確認
- プロパティ名が正確か確認（大文字小文字を含む）
- ブラウザのキャッシュをクリア

### APIエラー
- Supabaseのプロジェクトが有効か確認
- サービスロールキーが正しいか確認
- Supabase側のRLS（Row Level Security）設定を確認

## 更新手順

コードを更新した場合：

1. 変更をコミット
```bash
git add .
git commit -m "feat: 機能名"
git push origin main
```

2. ビルド＆デプロイ
```bash
npm run deploy
```

3. GASエディタで動作確認

## ファイル構造

```
lowya-goods-naming-app/
├── src/                    # ソースコード
│   ├── api/               # バックエンドAPI
│   ├── lib/               # 共通ライブラリ
│   ├── types/             # TypeScript型定義
│   ├── views/             # HTMLテンプレート
│   ├── styles/            # CSSファイル
│   ├── scripts/           # JavaScriptファイル
│   ├── index.ts           # エントリーポイント
│   └── appsscript.json    # GAS設定
├── dist/                   # ビルド出力（自動生成）
│   ├── main.js            # バンドルされたバックエンド
│   ├── index.html         # 統合されたフロントエンド
│   └── appsscript.json    # GAS設定（コピー）
├── build.js               # TypeScriptビルドスクリプト
├── build-html.js          # HTMLビルドスクリプト
└── .clasp.json            # clasp設定
```

## 注意事項

- `dist/` ディレクトリは自動生成されるため、直接編集しない
- ソースコードは `src/` 配下のみを編集する
- デプロイ前に必ずビルドを実行する
- スクリプトプロパティには機密情報が含まれるため、外部に公開しない
