// src/scripts/naming.js
// 命名画面のロジック

/**
 * 命名画面の初期化
 */
function initNamingScreen() {
    console.log('Initializing naming screen...');

    // カテゴリの読み込み
    loadCategories();

    // カテゴリ選択時のイベント
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', onCategoryChange);
    }
}

/**
 * カテゴリ一覧を読み込む
 */
async function loadCategories() {
    const select = document.getElementById('category-select');
    if (!select) return;

    try {
        showLoading('dynamic-form');

        const categories = await callGasApi('getCategories');

        // セレクトボックスをクリア
        select.innerHTML = '<option value="">カテゴリを選択してください</option>';

        // カテゴリをセレクトボックスに追加
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.category_name;
            select.appendChild(option);
        });

        document.getElementById('dynamic-form').innerHTML = '';
    } catch (error) {
        console.error('Failed to load categories:', error);
        showError('カテゴリの読み込みに失敗しました', 'dynamic-form');
    }
}

/**
 * カテゴリ変更時の処理
 */
async function onCategoryChange(event) {
    const categoryId = event.target.value;

    if (!categoryId) {
        document.getElementById('dynamic-form').innerHTML = '';
        hideElement(document.getElementById('naming-result'));
        return;
    }

    try {
        showLoading('dynamic-form');

        // カテゴリのスキーマを取得
        const schema = await callGasApi('getSchemaForCategory', categoryId);

        // 動的フォームを生成
        renderDynamicForm(schema);
    } catch (error) {
        console.error('Failed to load schema:', error);
        showError('スキーマの読み込みに失敗しました', 'dynamic-form');
    }
}

/**
 * 動的フォームを生成
 */
function renderDynamicForm(schema) {
    const formContainer = document.getElementById('dynamic-form');
    if (!formContainer) return;

    let html = '<div class="card">';

    // 基本フィールド（Fields）
    if (schema.fields && schema.fields.length > 0) {
        html += '<h3>基本情報</h3>';
        schema.fields.forEach(field => {
            html += renderField(field);
        });
    }

    // Type（入力項目）
    if (schema.types && schema.types.length > 0) {
        html += '<h3>詳細項目</h3>';
        schema.types.forEach(type => {
            html += renderTypeField(type);
        });
    }

    html += '<button id="generate-btn" class="btn btn-primary mt-3">名称を生成</button>';
    html += '</div>';

    formContainer.innerHTML = html;

    // 生成ボタンのイベント
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', onGenerateNames);
    }
}

/**
 * フィールドをレンダリング
 */
function renderField(field) {
    return `
        <div class="form-group">
            <label for="field-${field.name}">${escapeHtml(field.label)}</label>
            <input
                type="text"
                id="field-${field.name}"
                class="form-control"
                placeholder="${escapeHtml(field.placeholder || '')}"
            />
        </div>
    `;
}

/**
 * Typeフィールドをレンダリング
 */
function renderTypeField(type) {
    let html = `<div class="form-group">`;
    html += `<label>${escapeHtml(type.type_name)}</label>`;

    if (type.selection_type === 'TEXT') {
        // テキスト入力
        html += `<input type="text" id="type-${type.id}" class="form-control" />`;
    } else if (type.keywords && type.keywords.length > 0) {
        // 選択肢がある場合
        if (type.selection_type === 'SINGLE') {
            // ラジオボタン
            type.keywords.forEach(keyword => {
                html += `
                    <div class="form-check">
                        <input type="radio" name="type-${type.id}" value="${keyword.id}" id="keyword-${keyword.id}" class="form-check-input" />
                        <label for="keyword-${keyword.id}" class="form-check-label">${escapeHtml(keyword.keyword)}</label>
                    </div>
                `;
            });
        } else if (type.selection_type === 'MULTIPLE') {
            // チェックボックス
            type.keywords.forEach(keyword => {
                html += `
                    <div class="form-check">
                        <input type="checkbox" name="type-${type.id}" value="${keyword.id}" id="keyword-${keyword.id}" class="form-check-input" />
                        <label for="keyword-${keyword.id}" class="form-check-label">${escapeHtml(keyword.keyword)}</label>
                    </div>
                `;
            });
        }
    }

    html += '</div>';
    return html;
}

/**
 * 名称生成処理
 */
async function onGenerateNames() {
    const resultContainer = document.getElementById('naming-result');
    const resultContent = document.getElementById('result-content');

    try {
        showLoading('result-content');
        showElement(resultContainer);

        // フォームデータの収集
        const formData = collectFormData();

        // API呼び出し
        const result = await callGasApi('generateNames', formData);

        // 結果を表示
        displayResult(result);
    } catch (error) {
        console.error('Failed to generate names:', error);
        showError('名称の生成に失敗しました', 'result-content');
    }
}

/**
 * フォームデータを収集
 */
function collectFormData() {
    const categoryId = document.getElementById('category-select').value;
    const formData = {
        categoryId: categoryId,
        fields: {},
        types: {}
    };

    // TODO: フォーム値の収集ロジックを実装

    return formData;
}

/**
 * 生成結果を表示
 */
function displayResult(result) {
    const resultContent = document.getElementById('result-content');
    if (!resultContent) return;

    let html = '<div class="card">';
    html += `<h3>商品名</h3>`;
    html += `<p class="text-lg font-bold">${escapeHtml(result.productName || '')}</p>`;
    html += `<h3 class="mt-3">ページ名</h3>`;
    html += `<p class="text-lg font-bold">${escapeHtml(result.pageName || '')}</p>`;
    html += '</div>';

    resultContent.innerHTML = html;
}

// 初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initNamingScreen);
}
