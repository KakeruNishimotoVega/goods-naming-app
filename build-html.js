// build-html.js
// HTML/CSS/JSを統合して dist/index.html を生成するビルドスクリプト
const fs = require('fs');
const path = require('path');

console.log('Building HTML...');

// ディレクトリが存在するか確認するヘルパー
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ファイルが存在するか確認するヘルパー
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// ファイルを読み込むヘルパー（存在しない場合は空文字列）
function readFileOrEmpty(filePath) {
    if (fileExists(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    console.warn(`Warning: ${filePath} not found, using empty string`);
    return '';
}

// dist ディレクトリの確保
ensureDir('./dist');

// 1. CSS を結合
console.log('Combining CSS files...');
const cssFiles = [
    'src/styles/variables.css',
    'src/styles/base.css',
    'src/styles/components.css',
    'src/styles/utilities.css'
];

const css = cssFiles
    .map(file => {
        const content = readFileOrEmpty(file);
        return content ? `/* ${file} */\n${content}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

// 2. HTML テンプレートを結合
console.log('Combining HTML templates...');
const templateFiles = [
    'src/views/login.html',
    'src/views/signup.html',
    'src/views/naming.html',
    'src/views/settings.html',
    'src/views/ngwords.html',
    'src/views/management.html'
];

const templates = templateFiles
    .map(file => {
        const content = readFileOrEmpty(file);
        return content ? `<!-- ${file} -->\n${content}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

// 3. JavaScript を結合
console.log('Combining JavaScript files...');
const scriptFiles = [
    'src/scripts/utils.js',
    'src/scripts/app.js',
    'src/scripts/auth.js',
    'src/scripts/naming.js',
    'src/scripts/settings.js',
    'src/scripts/ngwords.js',
    'src/scripts/management.js'
];

const scripts = scriptFiles
    .map(file => {
        const content = readFileOrEmpty(file);
        return content ? `// ${file}\n${content}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

// 4. layout.html を読み込み、プレースホルダーを置換
console.log('Merging into layout.html...');
const layoutPath = 'src/views/layout.html';

if (!fileExists(layoutPath)) {
    console.error(`Error: ${layoutPath} not found!`);
    console.log('Creating a minimal layout.html template...');

    // 最小限のレイアウトテンプレートを作成
    const minimalLayout = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOWYA商品命名アプリ</title>
    <!-- CSS_PLACEHOLDER -->
</head>
<body>
    <!-- TEMPLATES_PLACEHOLDER -->
    <!-- SCRIPTS_PLACEHOLDER -->
</body>
</html>`;

    ensureDir('src/views');
    fs.writeFileSync(layoutPath, minimalLayout);
    console.log(`Created ${layoutPath}`);
}

let html = fs.readFileSync(layoutPath, 'utf-8');

// プレースホルダーを置換
html = html.replace('<!-- CSS_PLACEHOLDER -->', `<style>\n${css}\n</style>`);
html = html.replace('<!-- TEMPLATES_PLACEHOLDER -->', templates);
html = html.replace('<!-- SCRIPTS_PLACEHOLDER -->', `<script>\n${scripts}\n</script>`);

// 5. dist/index.html に出力
const outputPath = './dist/index.html';
fs.writeFileSync(outputPath, html);

console.log(`✓ HTML build complete: ${outputPath}`);
console.log(`  - ${cssFiles.filter(f => fileExists(f)).length}/${cssFiles.length} CSS files`);
console.log(`  - ${templateFiles.filter(f => fileExists(f)).length}/${templateFiles.length} HTML templates`);
console.log(`  - ${scriptFiles.filter(f => fileExists(f)).length}/${scriptFiles.length} JavaScript files`);
