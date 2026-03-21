// build.js
const esbuild = require('esbuild');
const fs = require('fs');

// 1. 出力先の dist フォルダを作成
if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist');
}

// 2. GASの必須設定ファイルを dist にコピー
fs.copyFileSync('./src/appsscript.json', './dist/appsscript.json');

// 3. esbuildでTypeScriptをバンドル
esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    outfile: './dist/main.js',
    format: 'iife', // プラグインを外し、標準の即時関数に戻す
}).then(() => {
    // 4. 【ここがキモ！】ビルド完了後に、自前でGAS用の関数を露出させる
    let code = fs.readFileSync('./dist/main.js', 'utf8');
    
    // GASのグローバル空間と紐付けるためのおまじないを先頭に追加
    code = `var global = this;\n` + code;

    // コード内から "global.関数名 =" のパターンを正規表現で探し出す
    const matches = [...code.matchAll(/global\.(\w+)\s*=/g)];
    
    // 見つかった関数名の重複を排除
    const functionNames = [...new Set(matches.map(m => m[1]))];

    // ファイルの末尾に、GASが認識できる「function 関数名() {}」のラッパーを追記する
    functionNames.forEach(fnName => {
        code += `\nfunction ${fnName}() { return global.${fnName}.apply(this, arguments); }`;
    });

    // 書き換え終わったコードを保存
    fs.writeFileSync('./dist/main.js', code);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});