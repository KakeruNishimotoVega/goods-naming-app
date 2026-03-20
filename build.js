// build.js
const esbuild = require('esbuild');
const fs = require('fs');

// 1. 出力先の dist フォルダを作成
if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
}

// 2. GASの必須設定ファイル(appsscript.json)を dist にコピー
fs.copyFileSync('./src/appsscript.json', './dist/appsscript.json');

// 3. esbuildでTypeScriptを1つのファイルにバンドル
esbuild.build({
    entryPoints: ['./src/index.ts'], // エントリーポイント（出発点）
    bundle: true,                    // 1つのファイルにまとめる
    outfile: './dist/main.js',       // 出力先
    format: 'iife',                  // GASのグローバル空間で動くように即時関数にする
}).catch(() => process.exit(1));