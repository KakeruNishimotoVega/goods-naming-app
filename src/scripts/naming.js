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

    // 結果エリアの閉じるボタン
    const closeResultBtn = document.getElementById('close-result-btn');
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
            const resultContainer = document.getElementById('naming-result');
            if (resultContainer) {
                resultContainer.style.display = 'none';
            }
        });
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

    // カテゴリが変更されたら生成結果をリセット
    const resultContainer = document.getElementById('naming-result');
    if (resultContainer) {
        hideElement(resultContainer);
    }

    if (!categoryId) {
        document.getElementById('dynamic-form').innerHTML = '';
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

    let html = '<div class="form-card">';
    html += '<h3>入力項目</h3>';

    // Fields（共通フィールド）を先に表示
    if (schema.fields && schema.fields.length > 0) {
        schema.fields.forEach(field => {
            html += '<div class="input-group">';
            html += `<label>${escapeHtml(field.display_name)}</label>`;
            html += `<input type="${field.input_type || 'text'}" id="field-${field.field_key}" data-field-key="${field.field_key}" class="form-control" placeholder="${field.placeholder || ''}" />`;
            html += '</div>';
        });
    }

    // Type（入力項目）
    if (schema.types && schema.types.length > 0) {
        schema.types.forEach(typeData => {
            // typeDataは {type: {...}, keywords: [...]} の形式
            html += renderTypeField(typeData.type, typeData.keywords);
        });
    } else {
        html += '<p class="text-muted">このカテゴリには入力項目がありません。</p>';
    }

    html += '</div>';

    formContainer.innerHTML = html;

    // リアルタイム生成のためのイベントリスナーを追加
    setupRealtimeGeneration();
}

/**
 * Typeフィールドをレンダリング
 * @param {Object} type - Type情報
 * @param {Array} keywords - キーワード一覧
 */
function renderTypeField(type, keywords) {
    let html = `<div class="input-group">`;

    // ラベル（必須バッジ付き）
    html += `<label>`;
    html += `${escapeHtml(type.display_name)}`;
    if (type.is_required) {
        html += ' <span class="badge badge-required">必須</span>';
    } else {
        html += ' <span class="badge badge-optional">任意</span>';
    }
    html += '</label>';

    // 説明文があれば表示
    if (type.description) {
        html += `<p class="text-sm text-muted" style="margin-top: 0.25rem; margin-bottom: 0.75rem;">${escapeHtml(type.description)}</p>`;
    }

    // key_nameをdata属性として保存（フォーム収集時に使用）
    const dataKeyName = type.key_name ? `data-key-name="${escapeHtml(type.key_name)}"` : '';

    if (type.selection_type === 'TEXT') {
        // テキスト入力
        const placeholder = type.placeholder || '入力してください...';
        html += `<input type="text" id="type-${type.id}" ${dataKeyName} class="form-control" placeholder="${escapeHtml(placeholder)}" ${type.is_required ? 'required' : ''} />`;
    } else if (type.selection_type === 'TRUE_FALSE' || type.selection_type === 'BOOLEAN') {
        // トグルスイッチ（キーワード不要）
        html += `
            <div class="toggle-switch-container">
                <label class="toggle-switch">
                    <input type="checkbox" id="type-${type.id}" ${dataKeyName} />
                    <span class="slider"></span>
                </label>
                <span>有効にする</span>
            </div>
        `;
    } else if (keywords && keywords.length > 0) {
        // 選択肢がある場合
        if (type.selection_type === 'SINGLE') {
            // チップUI（ラジオボタン）
            html += '<div class="chip-group">';
            keywords.forEach(keyword => {
                html += `
                    <label class="chip-label">
                        <input type="radio" name="type-${type.id}" value="${escapeHtml(keyword.keyword)}" id="keyword-${keyword.id}" ${dataKeyName} ${type.is_required ? 'required' : ''} />
                        <span class="chip-text">${escapeHtml(keyword.keyword)}</span>
                        <a href="https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}" target="_blank" class="google-search-link" title="Googleで検索">🔍</a>
                    </label>
                `;
            });
            html += '</div>';
        } else if (type.selection_type === 'MULTIPLE' || type.selection_type === 'MULTI') {
            // チップUI（チェックボックス）
            html += '<div class="chip-group">';
            keywords.forEach(keyword => {
                html += `
                    <label class="chip-label">
                        <input type="checkbox" name="type-${type.id}" value="${escapeHtml(keyword.keyword)}" ${dataKeyName} id="keyword-${keyword.id}" />
                        <span class="chip-text">${escapeHtml(keyword.keyword)}</span>
                        <a href="https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}" target="_blank" class="google-search-link" title="Googleで検索">🔍</a>
                    </label>
                `;
            });
            html += '</div>';
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
        const fieldKey = input.getAttribute('data-field-key');
        if (fieldKey) {
            formData.fields[fieldKey] = input.value;
        }
    });

    // Type（入力項目）の値を収集（key_nameをキーとして使用）
    const typeInputs = document.querySelectorAll('[id^="type-"]');
    typeInputs.forEach(input => {
        const keyName = input.getAttribute('data-key-name');
        if (!keyName) return; // key_nameがない場合はスキップ

        if (input.type === 'text') {
            // テキスト入力の場合
            formData.types[keyName] = input.value;
        } else if (input.type === 'checkbox' && !input.name) {
            // トグルスイッチ（TRUE_FALSE/BOOLEAN）の場合（nameが設定されていない単独のチェックボックス）
            // チェックされている場合はkey_nameを設定、されていない場合は空文字列
            formData.types[keyName] = input.checked ? keyName : '';
        }
    });

    // ラジオボタンとチェックボックス（複数選択）の値を収集
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
        const selected = document.querySelector(`input[name="${groupName}"]:checked`);
        if (selected) {
            const keyName = selected.getAttribute('data-key-name');
            if (keyName) {
                formData.types[keyName] = selected.value;
            }
        }
    });

    // チェックボックス（複数選択）の値を収集
    checkboxGroups.forEach(groupName => {
        const selected = document.querySelectorAll(`input[name="${groupName}"]:checked`);
        if (selected.length > 0) {
            const keyName = selected[0].getAttribute('data-key-name');
            if (keyName) {
                const values = Array.from(selected).map(input => input.value);
                formData.types[keyName] = values.join(' '); // スペース区切りで結合
            }
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

    // 推奨文字数の上限設定
    const MAX_PAGE_NAME_LENGTH = 17; // キャッチコピーの推奨上限
    const MAX_PRODUCT_NAME_LENGTH = 27; // 商品名の推奨上限

    let html = '';

    // キャッチコピー
    html += '<div class="result-item">';
    html += '<h4>キャッチコピー</h4>';
    html += `<div class="result-text">${escapeHtml(result.productPageName || '未生成')}</div>`;
    html += '<div class="result-meta">';

    const pageNameLength = result.characterCounts?.productPageName || 0;
    const pageNameExceedsLimit = pageNameLength > MAX_PAGE_NAME_LENGTH;
    html += `<span class="char-count ${pageNameExceedsLimit ? 'char-count-warning' : ''}">${pageNameExceedsLimit ? '⚠ ' : ''}文字数: ${pageNameLength}文字${pageNameExceedsLimit ? ` (推奨: ${MAX_PAGE_NAME_LENGTH}文字以内)` : ''}</span>`;
    html += `<button id="copy-page-name-btn" class="btn secondary btn-sm copy-btn">コピー</button>`;
    html += '</div>';

    // キャッチコピーのNGワードチェック
    const pageNgWords = (result.prohibitedWordsFound || []).filter(item => item.target === 'productPageName');
    if (pageNgWords.length > 0) {
        html += '<div class="alert alert-danger mt-2" style="margin-top: 0.5rem; font-size: 0.85rem;">';
        html += '<strong>⚠ NGワード検出:</strong> ';
        html += pageNgWords.map(ng => {
            const reason = ng.reason ? ` <span class="ng-reason-icon" title="${escapeHtml(ng.reason)}">ℹ️</span>` : '';
            return `"${escapeHtml(ng.word)}"${reason}`;
        }).join(', ');
        html += '</div>';
    }
    html += '</div>';

    // 商品名
    html += '<div class="result-item">';
    html += '<h4>商品名</h4>';
    html += `<div class="result-text">${escapeHtml(result.productName || '未生成')}</div>`;
    html += '<div class="result-meta">';

    const productNameLength = result.characterCounts?.productName || 0;
    const productNameExceedsLimit = productNameLength > MAX_PRODUCT_NAME_LENGTH;
    html += `<span class="char-count ${productNameExceedsLimit ? 'char-count-warning' : ''}">${productNameExceedsLimit ? '⚠ ' : ''}文字数: ${productNameLength}文字${productNameExceedsLimit ? ` (推奨: ${MAX_PRODUCT_NAME_LENGTH}文字以内)` : ''}</span>`;
    html += `<button id="copy-product-name-btn" class="btn secondary btn-sm copy-btn">コピー</button>`;
    html += '</div>';

    // 商品名のNGワードチェック
    const nameNgWords = (result.prohibitedWordsFound || []).filter(item => item.target === 'productName');
    if (nameNgWords.length > 0) {
        html += '<div class="alert alert-danger mt-2" style="margin-top: 0.5rem; font-size: 0.85rem;">';
        html += '<strong>⚠ NGワード検出:</strong> ';
        html += nameNgWords.map(ng => {
            const reason = ng.reason ? ` <span class="ng-reason-icon" title="${escapeHtml(ng.reason)}">ℹ️</span>` : '';
            return `"${escapeHtml(ng.word)}"${reason}`;
        }).join(', ');
        html += '</div>';
    }
    html += '</div>';

    // リセットボタン
    html += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">';
    html += '<button id="reset-from-result-btn" class="btn secondary w-100">入力内容をリセット</button>';
    html += '</div>';

    resultContent.innerHTML = html;

    // コピーボタンのイベントリスナー
    document.getElementById('copy-page-name-btn')?.addEventListener('click', () => {
        copyToClipboard(result.productPageName || '');
    });

    document.getElementById('copy-product-name-btn')?.addEventListener('click', () => {
        copyToClipboard(result.productName || '');
    });

    // リセットボタンのイベントリスナー
    document.getElementById('reset-from-result-btn')?.addEventListener('click', onResetForm);
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
