// src/scripts/naming.js
// 命名画面のロジック

// カテゴリデータのグローバル変数
let allCategories = []; // 全カテゴリのキャッシュ
let allParentCategories = []; // 全親カテゴリのキャッシュ
let selectedParentId = null; // 選択中の親カテゴリID
let selectedCategoryId = null; // 選択中の子カテゴリID
let currentSchema = null; // 現在のスキーマキャッシュ

/**
 * 命名画面の初期化
 */
function initNamingScreen() {
    console.log('Initializing naming screen...');

    // カテゴリの読み込み
    loadCategories();

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

    // 「変更」ボタンのクリックリスナー
    const changeCategoryBtn = document.getElementById('change-category-btn');
    if (changeCategoryBtn) {
        changeCategoryBtn.addEventListener('click', () => {
            // 選択状態をリセット
            selectedParentId = null;
            selectedCategoryId = null;

            // UIをリセット
            const categorySelectionPanel = document.getElementById('category-selection-panel');
            const categoryToggleSection = document.getElementById('category-toggle-section');
            const dynamicForm = document.getElementById('dynamic-form');
            const resultContainer = document.getElementById('naming-result');

            if (categorySelectionPanel) showElement(categorySelectionPanel);
            if (categoryToggleSection) hideElement(categoryToggleSection);
            if (dynamicForm) dynamicForm.innerHTML = '';
            if (resultContainer) hideElement(resultContainer);

            // 親カテゴリを再描画（選択状態をクリア）
            renderParentCategories();
        });
    }
}

/**
 * カテゴリ一覧を読み込む
 */
async function loadCategories() {
    try {
        showLoading('parent-category-list');

        // 全カテゴリと親カテゴリを並行取得
        const [categories, parentCategories] = await Promise.all([
            callGasApi('getCategories'),
            callGasApi('getParentCategories')
        ]);

        // グローバルキャッシュに保存
        allCategories = categories;
        allParentCategories = parentCategories;

        // 親カテゴリリストを表示
        renderParentCategories();

        // 動的フォームをクリア
        document.getElementById('dynamic-form').innerHTML = '';
    } catch (error) {
        handleApiError(error, 'loadCategories');
        showError('カテゴリの読み込みに失敗しました', 'parent-category-list');
    }
}

/**
 * 親カテゴリリストを表示
 */
function renderParentCategories() {
    const container = document.getElementById('parent-category-list');
    if (!container) return;

    container.innerHTML = '';

    allParentCategories.forEach(parent => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-card';
        button.dataset.parentId = parent.id;
        button.textContent = parent.name;

        // 選択中の親カテゴリをハイライト
        if (selectedParentId === parent.id) {
            button.classList.add('active');
        }

        // クリックイベント
        button.addEventListener('click', () => {
            onParentCategoryClick(parent.id);
        });

        container.appendChild(button);
    });
}

/**
 * 親カテゴリクリック時の処理
 */
function onParentCategoryClick(parentId) {
    // 既に選択されている場合は解除
    if (selectedParentId === parentId) {
        selectedParentId = null;
        selectedCategoryId = null;

        // 親カテゴリリストを再描画（選択状態をクリア）
        renderParentCategories();

        // 子カテゴリリストを非表示
        const childCard = document.getElementById('child-category-card');
        if (childCard) {
            hideElement(childCard);
        }

        // 動的フォームをクリア
        document.getElementById('dynamic-form').innerHTML = '';

        // 「変更」ボタンセクションを非表示
        const categoryToggleSection = document.getElementById('category-toggle-section');
        if (categoryToggleSection) {
            hideElement(categoryToggleSection);
        }

        // 結果エリアを非表示
        const resultContainer = document.getElementById('naming-result');
        if (resultContainer) {
            hideElement(resultContainer);
        }
        return;
    }

    // 新しい親カテゴリを選択
    selectedParentId = parentId;
    selectedCategoryId = null; // 子カテゴリ選択をリセット

    // 親カテゴリリストを再描画（選択状態を反映）
    renderParentCategories();

    // 子カテゴリリストを表示
    renderChildCategories(parentId);

    // 動的フォームをクリア
    document.getElementById('dynamic-form').innerHTML = '';

    // 結果エリアを非表示
    const resultContainer = document.getElementById('naming-result');
    if (resultContainer) {
        hideElement(resultContainer);
    }
}

/**
 * 子カテゴリリストを表示
 */
function renderChildCategories(parentId) {
    const card = document.getElementById('child-category-card');
    const container = document.getElementById('child-category-list');
    if (!card || !container) return;

    // 該当する子カテゴリをフィルタ
    const childCategories = allCategories.filter(c => c.parent_id === parentId);

    if (childCategories.length === 0) {
        card.style.display = 'none';
        return;
    }

    // カードを表示
    card.style.display = 'block';
    container.innerHTML = '';

    childCategories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-card';
        button.dataset.categoryId = category.id;
        button.textContent = category.name;

        // 選択中の子カテゴリをハイライト
        if (selectedCategoryId === category.id) {
            button.classList.add('active');
        }

        // クリックイベント
        button.addEventListener('click', () => {
            onChildCategoryClick(category.id);
        });

        container.appendChild(button);
    });
}

/**
 * 子カテゴリクリック時の処理
 */
async function onChildCategoryClick(categoryId) {
    // 既に選択されている場合は解除
    if (selectedCategoryId === categoryId) {
        selectedCategoryId = null;

        // 子カテゴリリストを再描画（選択状態をクリア）
        renderChildCategories(selectedParentId);

        // 動的フォームをクリア
        document.getElementById('dynamic-form').innerHTML = '';

        // 「変更」ボタンセクションを非表示
        const categoryToggleSection = document.getElementById('category-toggle-section');
        if (categoryToggleSection) {
            hideElement(categoryToggleSection);
        }

        // カテゴリ選択パネルを表示
        const categorySelectionPanel = document.getElementById('category-selection-panel');
        if (categorySelectionPanel) {
            showElement(categorySelectionPanel);
        }

        // 結果エリアを非表示
        const resultContainer = document.getElementById('naming-result');
        if (resultContainer) {
            hideElement(resultContainer);
        }
        return;
    }

    // 新しい子カテゴリを選択
    selectedCategoryId = categoryId;

    // 子カテゴリリストを再描画（選択状態を反映）
    renderChildCategories(selectedParentId);

    // 結果エリアを非表示
    const resultContainer = document.getElementById('naming-result');
    if (resultContainer) {
        hideElement(resultContainer);
    }

    // カテゴリ選択パネルを即座に非表示化
    const categorySelectionPanel = document.getElementById('category-selection-panel');
    const categoryToggleSection = document.getElementById('category-toggle-section');
    if (categorySelectionPanel) hideElement(categorySelectionPanel);

    try {
        showLoading('dynamic-form');

        // カテゴリのスキーマを取得
        const schema = await callGasApi('getSchemaForCategory', categoryId);

        // 動的フォームを生成
        renderDynamicForm(schema);

        // 「変更」ボタンセクションを表示
        if (categoryToggleSection) showElement(categoryToggleSection);

        // 選択済みカテゴリをブレッドクラムに表示
        updateSelectedCategoryBreadcrumb();
    } catch (error) {
        handleApiError(error, 'onChildCategoryClick');
        showError('スキーマの読み込みに失敗しました', 'dynamic-form');
    }
}

/**
 * 選択済みカテゴリをブレッドクラムに表示
 */
function updateSelectedCategoryBreadcrumb() {
    const parentCategory = allParentCategories.find(p => p.id === selectedParentId);
    const childCategory = allCategories.find(c => c.id === selectedCategoryId);

    const parentName = parentCategory ? escapeHtml(parentCategory.name) : '';
    const childName = childCategory ? escapeHtml(childCategory.name) : '';

    const breadcrumb = document.getElementById('selected-category-breadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = `${parentName} > ${childName}`;
    }
}

/**
 * 動的フォームを生成
 */
function renderDynamicForm(schema) {
    const formContainer = document.getElementById('dynamic-form');
    if (!formContainer) return;

    // スキーマをキャッシュ（バリデーション用）
    currentSchema = schema;

    // ミニマルカテゴリ（types, regulations が未設定）の場合
    if (schema.isMinimalCategory) {
        renderMinimalCategoryForm();
        return;
    }

    let html = '<div class="form-card">';
    html += '<h3>入力項目</h3>';

    // Fields（共通フィールド）を先に表示
    if (schema.fields && schema.fields.length > 0) {
        schema.fields.forEach(field => {
            html += '<div class="input-group">';
            html += `<label>${escapeHtml(field.display_name)}</label>`;
            const placeholder = field.placeholder ? `例：${field.placeholder}` : '例：';
            html += `<input type="${field.input_type || 'text'}" id="field-${field.field_key}" data-field-key="${field.field_key}" class="form-control" placeholder="${placeholder}" />`;
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
 * ミニマルカテゴリ（レギュレーション未設定）のフォームを生成
 */
function renderMinimalCategoryForm() {
    const formContainer = document.getElementById('dynamic-form');
    if (!formContainer) return;

    let html = '<div class="form-card">';
    
    // 説明文
    html += '<div class="alert alert-info" style="margin-bottom: 1.5rem;">';
    html += '<h4 style="margin-top: 0; margin-bottom: 0.5rem;">このカテゴリは現時点ではレギュレーションが未設定です</h4>';
    html += '<p style="margin: 0;">理由：対象商品数が少ない、または、レギュレーション設定の費用対効果と判断されたため。</p>';
    html += '</div>';
    
    // フリーテキストフィールド
    html += '<h3>命名入力</h3>';
    html += '<div class="input-group">';
    html += '<label for="minimal-catchcopy">キャッチコピー</label>';
    html += '<input type="text" id="minimal-catchcopy" class="form-control" placeholder="例：キャッチコピーを入力してください" />';
    html += '</div>';
    
    html += '<div class="input-group">';
    html += '<label for="minimal-productname">商品名</label>';
    html += '<input type="text" id="minimal-productname" class="form-control" placeholder="例：商品名を入力してください" />';
    html += '</div>';
    
    // 共通レギュレーション例
    html += '<div style="margin-top: 2rem; padding: 1rem; background-color: #f5f5f5; border-radius: 4px;">';
    html += '<h4 style="margin-top: 0; margin-bottom: 1rem;">共通レギュレーション例</h4>';
    html += '<p style="margin: 0.5rem 0;"><strong>キャッチコピー：</strong>{nickname} / {カテゴリ}</p>';
    html += '<p style="margin: 0.5rem 0;"><strong>商品名：</strong>[{幅N}] {カテゴリ} {機能性} {素材}</p>';
    html += '</div>';
    
    // 共通ルール
    html += '<div style="margin-top: 1.5rem; padding: 1rem; background-color: #f9f9f9; border-radius: 4px;">';
    html += '<h4 style="margin-top: 0; margin-bottom: 1rem;">共通ルール</h4>';
    html += '<dl style="margin: 0;">';
    
    html += '<dt style="font-weight: bold; margin-top: 0.75rem;">◯幅の表記について</dt>';
    html += '<dd style="margin-left: 1rem; margin-bottom: 0.5rem;">同じページ内に異なる幅のSKUがある場合：幅80/100<br>商品の幅が伸縮する場合：幅80〜100</dd>';
    
    html += '<dt style="font-weight: bold; margin-top: 0.75rem;">◯製造国</dt>';
    html += '<dd style="margin-left: 1rem; margin-bottom: 0.5rem;">国内工場で製造された商品は「日本製」と表記すること。<br>表記揺れを防ぐため、「国産」表記はNG。</dd>';
    
    html += '<dt style="font-weight: bold; margin-top: 0.75rem;">◯開梱設置付き</dt>';
    html += '<dd style="margin-left: 1rem; margin-bottom: 0.5rem;">商品名・キャッチコピーともに「開梱設置付き」は表示しない。</dd>';
    
    html += '<dt style="font-weight: bold; margin-top: 0.75rem;">◯完成レベル</dt>';
    html += '<dd style="margin-left: 1rem; margin-bottom: 0.5rem;">「半完成品」表記はNG。<br>「完成品」は"TV台", "収納", "デスク", "テーブル", "ソファ", "キッチン", "照明", "チェア"のみ表記すること。</dd>';
    
    html += '</dl>';
    html += '</div>';
    
    html += '</div>';

    formContainer.innerHTML = html;

    // リアルタイム生成のためのイベントリスナーを追加
    setupRealtimeGenerationForMinimal();
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
        const placeholder = type.placeholder ? `例：${type.placeholder}` : '例：入力してください';
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
                html += `<label class="chip-label"><input type="radio" name="type-${type.id}" value="${escapeHtml(keyword.keyword)}" id="keyword-${keyword.id}" ${dataKeyName} data-is-required="${type.is_required}" ${type.is_required ? 'required' : ''} /><span class="chip-text">${escapeHtml(keyword.keyword)}</span><a href="https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}" target="_blank" class="google-search-link" data-keyword="${escapeHtml(keyword.keyword)}" title="Googleで検索" aria-label="Googleで検索"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="search-icon"><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="2"/><path d="M14 14L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></a></label>`;
            });
            html += '</div>';
        } else if (type.selection_type === 'MULTIPLE' || type.selection_type === 'MULTI') {
            // チップUI（チェックボックス）
            html += '<div class="chip-group">';
            keywords.forEach(keyword => {
                html += `<label class="chip-label"><input type="checkbox" name="type-${type.id}" value="${escapeHtml(keyword.keyword)}" ${dataKeyName} id="keyword-${keyword.id}" /><span class="chip-text">${escapeHtml(keyword.keyword)}</span><a href="https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}" target="_blank" class="google-search-link" data-keyword="${escapeHtml(keyword.keyword)}" title="Googleで検索" aria-label="Googleで検索"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="search-icon"><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="2"/><path d="M14 14L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></a></label>`;
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
// ラジオボタングループごとの前回選択値を記録
const radioGroupStates = {};

function setupRealtimeGeneration() {
    const formContainer = document.getElementById('dynamic-form');
    if (!formContainer) return;

    // ラジオボタンのトグル機能を設定（必須でない項目のみ）
    const radioButtons = formContainer.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        const groupName = radio.name;
        const isRequired = radio.getAttribute('data-is-required') === 'true';
        
        // グループごとに初期化
        if (!radioGroupStates[groupName]) {
            radioGroupStates[groupName] = null;
        }

        // 必須でない場合のみトグル機能を付与
        if (!isRequired) {
            radio.addEventListener('change', (event) => {
                if (event.target.checked) {
                    // 新しい選択値と前回の選択値が同じ場合は解除
                    if (radioGroupStates[groupName] === event.target.value) {
                        event.target.checked = false;
                        radioGroupStates[groupName] = null;
                    } else {
                        // 新しい選択値を記録
                        radioGroupStates[groupName] = event.target.value;
                    }
                    // 生成処理を実行
                    onGenerateNames(true);
                }
            });
        } else {
            // 必須項目の場合は通常のchangeイベント
            radio.addEventListener('change', (event) => {
                if (event.target.checked) {
                    radioGroupStates[groupName] = event.target.value;
                    onGenerateNames(true);
                }
            });
        }
    });

    // すべての入力要素にイベントリスナーを追加
    formContainer.addEventListener('input', () => {
        // デバウンス処理（500ms）
        clearTimeout(generateTimeout);
        generateTimeout = setTimeout(() => {
            onGenerateNames(true); // 自動生成フラグを立てる
        }, 500);
    });
}

/**
 * ミニマルカテゴリ用のリアルタイム生成セットアップ
 */
function setupRealtimeGenerationForMinimal() {
    const catchcopyInput = document.getElementById('minimal-catchcopy');
    const productnameInput = document.getElementById('minimal-productname');

    if (!catchcopyInput || !productnameInput) return;

    const handleInput = () => {
        // デバウンス処理（500ms）
        clearTimeout(generateTimeout);
        generateTimeout = setTimeout(() => {
            onGenerateNamesMinimal();
        }, 500);
    };

    catchcopyInput.addEventListener('input', handleInput);
    productnameInput.addEventListener('input', handleInput);
}

/**
 * 名称生成処理
 * @param {boolean} isRealtime - リアルタイム生成かどうか
 */
async function onGenerateNames(isRealtime = false) {
    const resultContainer = document.getElementById('naming-result');
    const resultContent = document.getElementById('result-content');

    try {
        // 必須項目のバリデーション
        if (!validateRequiredFields()) {
            showElement(resultContainer);
            showError('必須項目を入力してください', 'result-content');
            return;
        }

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
 * ミニマルカテゴリ用の名称生成処理
 */
async function onGenerateNamesMinimal() {
    const resultContainer = document.getElementById('naming-result');
    const resultContent = document.getElementById('result-content');

    const catchcopy = document.getElementById('minimal-catchcopy')?.value?.trim() || '';
    const productname = document.getElementById('minimal-productname')?.value?.trim() || '';

    // 両方空の場合は結果エリアを非表示
    if (!catchcopy && !productname) {
        hideElement(resultContainer);
        return;
    }

    try {
        showElement(resultContainer);

        // API呼び出し（NGワードチェックのみ）
        const result = await callGasApi('generateNamesMinimal', {
            catchcopy: catchcopy,
            productname: productname
        });

        // 結果を表示
        displayResult(result);
    } catch (error) {
        handleApiError(error, 'onGenerateNamesMinimal');
    }
}

/**
 * フォームデータを収集
 */
function collectFormData() {
    const categoryId = selectedCategoryId;
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
 * 必須項目のバリデーション
 */
function validateRequiredFields() {
    if (!currentSchema) return true; // スキーマがない場合はそのまま進める

    // ミニマルカテゴリの場合
    if (currentSchema.isMinimalCategory) {
        const catchcopyInput = document.getElementById('minimal-catchcopy');
        const productnameInput = document.getElementById('minimal-productname');
        if (!catchcopyInput || !productnameInput) return true;
        
        const catchcopyValue = catchcopyInput.value.trim();
        const productnameValue = productnameInput.value.trim();
        
        return catchcopyValue.length > 0 && productnameValue.length > 0;
    }

    // 通常カテゴリの場合：必須フィールド（Type）をチェック
    if (currentSchema.types && currentSchema.types.length > 0) {
        for (const typeData of currentSchema.types) {
            const type = typeData.type;
            if (!type.is_required) continue; // 必須項目のみチェック

            const inputElement = document.querySelector(`[data-key-name="${type.key_name}"]`);
            if (!inputElement) continue;

            // テキスト入力の場合
            if (type.selection_type === 'TEXT') {
                if (!inputElement.value || inputElement.value.trim() === '') {
                    return false; // 必須項目が空
                }
            }
            // ラジオボタン（SINGLE）の場合
            else if (type.selection_type === 'SINGLE') {
                const selectedRadio = document.querySelector(`input[name="type-${type.id}"]:checked`);
                if (!selectedRadio) {
                    return false; // 必須項目が未選択
                }
            }
            // チェックボックス（MULTIPLE）の場合
            else if (type.selection_type === 'MULTIPLE' || type.selection_type === 'MULTI') {
                const selectedCheckboxes = document.querySelectorAll(`input[name="type-${type.id}"]:checked`);
                if (selectedCheckboxes.length === 0) {
                    return false; // 必須項目が未選択
                }
            }
            // トグルスイッチの場合（TR UE_FALSEは通常必須ではないが、念のため処理）
            else if (type.selection_type === 'TRUE_FALSE' || type.selection_type === 'BOOLEAN') {
                // トグルスイッチは必須チェックが不要（常に値がある）
            }
        }
    }

    return true; // すべての必須項目が入力されている
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

    // 無効状態の判定：NGワード検出のみ（必須項目チェックは生成前に実施済み）
    const hasNgWords = (result.prohibitedWordsFound || []).length > 0;
    const isDisabled = hasNgWords;

    let html = '';

    // 警告バナー（NGワード検出の場合）
    if (isDisabled) {
        html += '<div class="alert alert-warning" style="margin-bottom: 1em; background-color: #fef3c7; border: 1px solid #fcd34d; color: #92400e; padding: 0.75rem 1rem; border-radius: var(--border-radius-md);">';
        html += '<strong>⚠️ NGワードが検出されています。</strong> 下記の結果はコピーできません。';
        html += '</div>';
    }

    // キャッチコピー
    html += '<div class="result-item">';
    html += '<h4>キャッチコピー</h4>';
    html += `<div class="result-text${isDisabled ? ' disabled' : ''}">${escapeHtml(result.productPageName || '未生成')}</div>`;
    html += '<div class="result-meta">';

    const pageNameLength = result.characterCounts?.productPageName || 0;
    const pageNameExceedsLimit = pageNameLength > MAX_PAGE_NAME_LENGTH;
    html += `<span class="char-count ${pageNameExceedsLimit ? 'char-count-warning' : ''}">${pageNameExceedsLimit ? '⚠ ' : ''}文字数: ${pageNameLength}文字${pageNameExceedsLimit ? ` (推奨: ${MAX_PAGE_NAME_LENGTH}文字以内)` : ''}</span>`;
    html += `<button id="copy-page-name-btn" class="btn secondary btn-sm copy-btn"${isDisabled ? ' disabled' : ''} ${isDisabled ? 'title="NGワード検出または必須項目が未入力です"' : ''}>コピー</button>`;
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
    html += `<div class="result-text${isDisabled ? ' disabled' : ''}">${escapeHtml(result.productName || '未生成')}</div>`;
    html += '<div class="result-meta">';

    const productNameLength = result.characterCounts?.productName || 0;
    const productNameExceedsLimit = productNameLength > MAX_PRODUCT_NAME_LENGTH;
    html += `<span class="char-count ${productNameExceedsLimit ? 'char-count-warning' : ''}">${productNameExceedsLimit ? '⚠ ' : ''}文字数: ${productNameLength}文字${productNameExceedsLimit ? ` (推奨: ${MAX_PRODUCT_NAME_LENGTH}文字以内)` : ''}</span>`;
    html += `<button id="copy-product-name-btn" class="btn secondary btn-sm copy-btn"${isDisabled ? ' disabled' : ''} ${isDisabled ? 'title="NGワード検出または必須項目が未入力です"' : ''}>コピー</button>`;
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
        if (!isDisabled) {
            copyToClipboard(result.productPageName || '');
        }
    });

    document.getElementById('copy-product-name-btn')?.addEventListener('click', () => {
        if (!isDisabled) {
            copyToClipboard(result.productName || '');
        }
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
