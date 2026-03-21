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
            option.textContent = category.name;
            select.appendChild(option);
        });

        document.getElementById('dynamic-form').innerHTML = '';
    } catch (error) {
        handleApiError(error, 'loadCategories');
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
        handleApiError(error, 'onCategoryChange');
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

    // Type（入力項目）
    if (schema.types && schema.types.length > 0) {
        html += '<h3>入力項目</h3>';
        schema.types.forEach(typeData => {
            // typeDataは {type: {...}, keywords: [...]} の形式
            html += renderTypeField(typeData.type, typeData.keywords);
        });
    }

    html += '<div class="d-flex gap-2">';
    html += '<button id="generate-btn" class="btn btn-primary mt-3">名称を生成</button>';
    html += '<button id="reset-btn" class="btn btn-secondary mt-3">リセット</button>';
    html += '</div>';
    html += '</div>';

    formContainer.innerHTML = html;

    // 生成ボタンのイベント
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', onGenerateNames);
    }

    // リセットボタンのイベント
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', onResetForm);
    }

    // リアルタイム生成のためのイベントリスナーを追加
    setupRealtimeGeneration();
}

/**
 * Typeフィールドをレンダリング
 * @param {Object} type - Type情報
 * @param {Array} keywords - キーワード一覧
 */
function renderTypeField(type, keywords) {
    let html = `<div class="form-group">`;

    // ラベル（必須表示も含む）
    html += `<label>${escapeHtml(type.type_name)}`;
    if (type.is_required) {
        html += '<span class="text-danger"> *</span>';
    }
    html += '</label>';

    // 説明文があれば表示
    if (type.description) {
        html += `<p class="text-sm text-gray-600">${escapeHtml(type.description)}</p>`;
    }

    if (type.selection_type === 'TEXT') {
        // テキスト入力
        html += `<input type="text" id="type-${type.id}" class="form-control" ${type.is_required ? 'required' : ''} />`;
    } else if (keywords && keywords.length > 0) {
        // 選択肢がある場合
        if (type.selection_type === 'SINGLE') {
            // ラジオボタン
            keywords.forEach(keyword => {
                html += `
                    <div class="form-check keyword-item">
                        <input type="radio" name="type-${type.id}" value="${keyword.id}" id="keyword-${keyword.id}" class="form-check-input" ${type.is_required ? 'required' : ''} />
                        <label for="keyword-${keyword.id}" class="form-check-label">
                            ${escapeHtml(keyword.keyword)}
                            <a href="https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}" target="_blank" class="google-search-link" title="Googleで検索">🔍</a>
                        </label>
                    </div>
                `;
            });
        } else if (type.selection_type === 'MULTIPLE') {
            // チェックボックス
            keywords.forEach(keyword => {
                html += `
                    <div class="form-check keyword-item">
                        <input type="checkbox" name="type-${type.id}" value="${keyword.id}" id="keyword-${keyword.id}" class="form-check-input" />
                        <label for="keyword-${keyword.id}" class="form-check-label">
                            ${escapeHtml(keyword.keyword)}
                            <a href="https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}" target="_blank" class="google-search-link" title="Googleで検索">🔍</a>
                        </label>
                    </div>
                `;
            });
        } else if (type.selection_type === 'TRUE_FALSE') {
            // True/Falseトグル
            html += `
                <div class="form-check form-switch">
                    <input type="checkbox" id="type-${type.id}" class="form-check-input" role="switch" />
                    <label for="type-${type.id}" class="form-check-label">有効にする</label>
                </div>
            `;
        }
    }

    html += '</div>';
    return html;
}

/**
 * リアルタイム生成のセットアップ
 */
let generateTimeout = null;
function setupRealtimeGeneration() {
    const formContainer = document.getElementById('dynamic-form');
    if (!formContainer) return;

    // すべての入力要素にイベントリスナーを追加
    formContainer.addEventListener('input', () => {
        // デバウンス処理（500ms）
        clearTimeout(generateTimeout);
        generateTimeout = setTimeout(() => {
            onGenerateNames(true); // 自動生成フラグを立てる
        }, 500);
    });

    formContainer.addEventListener('change', () => {
        // ラジオボタン・チェックボックスは即座に反映
        onGenerateNames(true);
    });
}

/**
 * 名称生成処理
 * @param {boolean} isRealtime - リアルタイム生成かどうか
 */
async function onGenerateNames(isRealtime = false) {
    const resultContainer = document.getElementById('naming-result');
    const resultContent = document.getElementById('result-content');

    try {
        if (!isRealtime) {
            showLoading('result-content');
        }
        showElement(resultContainer);

        // フォームデータの収集
        const formData = collectFormData();

        // API呼び出し
        const result = await callGasApi('generateNames', formData);

        // 結果を表示
        displayResult(result);
    } catch (error) {
        handleApiError(error, 'onGenerateNames');
        if (!isRealtime) {
            showError('名称の生成に失敗しました', 'result-content');
        }
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

    // 基本フィールド（Fields）の値を収集
    const fieldInputs = document.querySelectorAll('[id^="field-"]');
    fieldInputs.forEach(input => {
        const fieldName = input.id.replace('field-', '');
        formData.fields[fieldName] = input.value;
    });

    // Type（入力項目）の値を収集
    const typeInputs = document.querySelectorAll('[id^="type-"]');
    typeInputs.forEach(input => {
        const typeId = input.id.replace('type-', '');

        if (input.type === 'text') {
            // テキスト入力の場合
            formData.types[typeId] = input.value;
        }
    });

    // ラジオボタンとチェックボックスの値を収集
    const radioGroups = new Set();
    const checkboxGroups = new Set();

    document.querySelectorAll('[id^="keyword-"]').forEach(input => {
        const groupName = input.name;

        if (input.type === 'radio') {
            radioGroups.add(groupName);
        } else if (input.type === 'checkbox') {
            checkboxGroups.add(groupName);
        }
    });

    // ラジオボタン（単一選択）の値を収集
    radioGroups.forEach(groupName => {
        const typeId = groupName.replace('type-', '');
        const selected = document.querySelector(`input[name="${groupName}"]:checked`);
        if (selected) {
            formData.types[typeId] = selected.value;
        }
    });

    // チェックボックス（複数選択）の値を収集
    checkboxGroups.forEach(groupName => {
        const typeId = groupName.replace('type-', '');
        const selected = document.querySelectorAll(`input[name="${groupName}"]:checked`);
        const values = Array.from(selected).map(input => input.value);
        if (values.length > 0) {
            formData.types[typeId] = values;
        }
    });

    return formData;
}

/**
 * 生成結果を表示
 */
function displayResult(result) {
    const resultContent = document.getElementById('result-content');
    if (!resultContent) return;

    let html = '<div class="card">';

    // 商品ページ名
    html += '<div class="mb-4">';
    html += '<h3>商品ページ名</h3>';
    html += `<p class="text-lg font-bold">${escapeHtml(result.productPageName || '')}</p>`;
    html += `<p class="text-sm text-gray-600">文字数: ${result.characterCounts?.productPageName || 0}</p>`;

    // 商品ページ名のNGワードチェック
    const pageNgWords = (result.prohibitedWordsFound || []).filter(item => item.target === 'productPageName');
    if (pageNgWords.length > 0) {
        html += '<div class="alert alert-warning mt-2">';
        html += '<strong>⚠ NGワードが検出されました:</strong><ul class="mb-0">';
        pageNgWords.forEach(ng => {
            html += `<li>"${escapeHtml(ng.word)}"`;
            if (ng.reason) {
                html += ` - ${escapeHtml(ng.reason)}`;
            }
            html += '</li>';
        });
        html += '</ul></div>';
    }
    html += '</div>';

    // 商品名
    html += '<div class="mb-4">';
    html += '<h3>商品名</h3>';
    html += `<p class="text-lg font-bold">${escapeHtml(result.productName || '')}</p>`;
    html += `<p class="text-sm text-gray-600">文字数: ${result.characterCounts?.productName || 0}</p>`;

    // 商品名のNGワードチェック
    const nameNgWords = (result.prohibitedWordsFound || []).filter(item => item.target === 'productName');
    if (nameNgWords.length > 0) {
        html += '<div class="alert alert-warning mt-2">';
        html += '<strong>⚠ NGワードが検出されました:</strong><ul class="mb-0">';
        nameNgWords.forEach(ng => {
            html += `<li>"${escapeHtml(ng.word)}"`;
            if (ng.reason) {
                html += ` - ${escapeHtml(ng.reason)}`;
            }
            html += '</li>';
        });
        html += '</ul></div>';
    }
    html += '</div>';

    // コピーボタン
    html += '<div class="d-flex gap-2">';
    html += '<button id="copy-page-name-btn" class="btn btn-secondary">商品ページ名をコピー</button>';
    html += '<button id="copy-product-name-btn" class="btn btn-secondary">商品名をコピー</button>';
    html += '</div>';

    html += '</div>';

    resultContent.innerHTML = html;

    // コピーボタンのイベントリスナー
    document.getElementById('copy-page-name-btn')?.addEventListener('click', () => {
        copyToClipboard(result.productPageName || '');
    });

    document.getElementById('copy-product-name-btn')?.addEventListener('click', () => {
        copyToClipboard(result.productName || '');
    });
}

/**
 * フォームをリセット
 */
function onResetForm() {
    if (!confirm('フォームをリセットしますか？入力内容はすべてクリアされます。')) {
        return;
    }

    // すべてのテキスト入力をクリア
    document.querySelectorAll('#dynamic-form input[type="text"]').forEach(input => {
        input.value = '';
    });

    // すべてのラジオボタンをクリア
    document.querySelectorAll('#dynamic-form input[type="radio"]').forEach(input => {
        input.checked = false;
    });

    // すべてのチェックボックスをクリア
    document.querySelectorAll('#dynamic-form input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });

    // 結果表示をクリア
    const resultContainer = document.getElementById('naming-result');
    if (resultContainer) {
        hideElement(resultContainer);
    }

    showToast('フォームをリセットしました');
}

// 初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initNamingScreen);
}
