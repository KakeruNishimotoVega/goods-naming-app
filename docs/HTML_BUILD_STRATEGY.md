# HTML/CSS ビルド戦略

## 課題
`index.html` が巨大化し、AI保守運用が困難。GASでは1ファイルにバンドルが必要。

## 解決策: ソース分割 + ビルド時統合

### 開発時のファイル構成
```
src/
├── views/
│   ├── layout.html          # 共通レイアウト（ヘッダー、サイドバー）
│   ├── naming.html          # 命名画面のテンプレート
│   ├── settings.html        # ルール設定画面のテンプレート
│   └── ngwords.html         # NGワード管理画面のテンプレート
├── styles/
│   ├── variables.css        # CSS変数定義（カラー、サイズ）
│   ├── base.css             # 基本スタイル
│   ├── components.css       # コンポーネント（ボタン、モーダル）
│   └── utilities.css        # ユーティリティクラス
├── scripts/
│   ├── app.js               # アプリケーションロジック
│   ├── naming.js            # 命名画面のロジック
│   ├── settings.js          # 設定画面のロジック
│   └── utils.js             # 共通ユーティリティ
└── index.html (統合先)
```

### ビルドプロセス
```javascript
// build-html.js
const fs = require('fs');
const path = require('path');

// 1. CSS を結合
const css = [
  'variables.css',
  'base.css',
  'components.css',
  'utilities.css'
].map(file => fs.readFileSync(`src/styles/${file}`, 'utf-8')).join('\n');

// 2. HTML テンプレートを結合
const templates = [
  'naming.html',
  'settings.html',
  'ngwords.html'
].map(file => fs.readFileSync(`src/views/${file}`, 'utf-8')).join('\n');

// 3. JavaScript を結合
const scripts = [
  'utils.js',
  'app.js',
  'naming.js',
  'settings.js'
].map(file => fs.readFileSync(`src/scripts/${file}`, 'utf-8')).join('\n');

// 4. layout.html に統合
let html = fs.readFileSync('src/views/layout.html', 'utf-8');
html = html.replace('<!-- CSS_PLACEHOLDER -->', `<style>${css}</style>`);
html = html.replace('<!-- TEMPLATES_PLACEHOLDER -->', templates);
html = html.replace('<!-- SCRIPTS_PLACEHOLDER -->', `<script>${scripts}</script>`);

// 5. dist/index.html に出力
fs.writeFileSync('dist/index.html', html);
```

### package.json に追加
```json
{
  "scripts": {
    "build": "node build.js && node build-html.js",
    "deploy": "npm run build && clasp push"
  }
}
```

## AI保守運用のメリット

### トークン効率
- CSS修正時は `src/styles/components.css` だけ読む（200行程度）
- 命名画面修正時は `src/views/naming.html` と `src/scripts/naming.js` だけ読む

### 理解しやすさ
- ファイル名で責務が明確
- 変更箇所の特定が容易

### デザイントンマナ管理
- `src/styles/variables.css` でカラーパレット一元管理
- Tailwind CSS との併用も可能（後述）

## Tailwind CSS の導入方法

### オプション1: CDN（簡単、制約あり）
```html
<!-- layout.html の <head> -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#2b8b84',
        }
      }
    }
  }
</script>
```

### オプション2: ビルド時生成（推奨）
```bash
npm install -D tailwindcss
npx tailwindcss init
```

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#2b8b84',
      }
    }
  }
}
```

```javascript
// build-html.js に追加
const { exec } = require('child_process');
exec('npx tailwindcss -i src/styles/input.css -o dist/output.css --minify');
```

## 段階的移行プラン

### ステップ1: ビルドスクリプト作成
- [ ] `build-html.js` 作成
- [ ] `package.json` のスクリプト更新

### ステップ2: 既存HTMLの分割
- [ ] `docs/raw/index.html` を分析
- [ ] `src/views/` にテンプレート分割
- [ ] `src/styles/` にCSS分割
- [ ] `src/scripts/` にJavaScript分割

### ステップ3: デザイントンマナの抽出
- [ ] CSS変数の定義（`:root`）
- [ ] カラーパレット文書化
- [ ] コンポーネントスタイルのカタログ作成

### ステップ4: Tailwind CSS導入
- [ ] CDN版で試験導入
- [ ] 既存CSSをTailwindに段階的置き換え
- [ ] ビルド時生成に移行
