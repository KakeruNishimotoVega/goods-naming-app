// src/scripts/settings.js
// ルール設定画面のロジック

/**
 * 設定画面の初期化
 */
function initSettingsScreen() {
    console.log('Initializing settings screen...');

    // カテゴリの読み込み
    loadSettingsCategories();

    // カテゴリ選択時のイベント
    const categorySelect = document.getElementById('settings-category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', onSettingsCategoryChange);
    }

    // カテゴリ追加ボタンのイベント
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', onAddCategory);
    }
}

/**
 * 設定画面用のカテゴリ一覧を読み込む
 */
async function loadSettingsCategories() {
    const select = document.getElementById('settings-category-select');
    if (!select) return;

    try {
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
    } catch (error) {
        console.error('Failed to load categories:', error);
        showError('カテゴリの読み込みに失敗しました', 'types-list');
    }
}

/**
 * 設定画面のカテゴリ変更時の処理
 */
async function onSettingsCategoryChange(event) {
    const categoryId = event.target.value;

    if (!categoryId) {
        document.getElementById('types-list').innerHTML = '';
        return;
    }

    try {
        showLoading('types-list');

        // カテゴリのスキーマを取得
        const schema = await callGasApi('getSchemaForCategory', categoryId);

        // Type一覧を表示
        renderTypesList(schema.types || []);

        // Regulation（命名ルール）を表示
        renderRegulationsSection(schema.regulations || []);
    } catch (error) {
        console.error('Failed to load schema:', error);
        showError('スキーマの読み込みに失敗しました', 'types-list');
    }
}

/**
 * Type一覧を表示
 */
function renderTypesList(typesData) {
    const listContainer = document.getElementById('types-list');
    if (!listContainer) return;

    if (!typesData || typesData.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><p class="text-muted">項目がありません</p></div>';
        return;
    }

    let html = '<div class="card">';
    html += '<div class="d-flex justify-between align-center mb-3">';
    html += '<h3>入力項目一覧</h3>';
    html += '<button id="add-type-btn" class="btn btn-primary btn-sm">項目を追加</button>';
    html += '</div>';

    // typesDataは [{type: {...}, keywords: [...]}] の形式
    typesData.forEach((typeData) => {
        const type = typeData.type;
        const keywords = typeData.keywords || [];

        html += `
            <div class="card mt-2">
                <div class="d-flex justify-between align-center">
                    <div style="flex: 1;">
                        <div class="d-flex align-center gap-2">
                            <h4 class="mb-1">${escapeHtml(type.type_name)}</h4>
                            <span class="badge ${type.is_required ? 'badge-required' : 'badge-optional'}">${type.is_required ? '必須' : '任意'}</span>
                        </div>
                        <p class="text-sm text-muted mb-2">${escapeHtml(type.description || '説明なし')}</p>
                        <div class="d-flex gap-1 align-center">
                            <span class="text-xs text-muted">タイプ: ${escapeHtml(type.selection_type)}</span>
                            <span class="text-xs text-muted">| 優先順位: ${type.priority}</span>
                            ${keywords.length > 0 ? `<span class="text-xs text-muted">| キーワード: ${keywords.length}個</span>` : ''}
                        </div>
                    </div>
                    <div class="d-flex gap-1" style="flex-shrink: 0;">
                        <button class="btn btn-secondary btn-sm" onclick="editType(${type.id})">編集</button>
                        ${type.selection_type !== 'TEXT' && type.selection_type !== 'TRUE_FALSE' ?
                            `<button class="btn btn-secondary btn-sm" onclick="manageKeywords(${type.id}, '${escapeHtml(type.type_name)}')">キーワード</button>` : ''}
                        <button class="btn btn-danger btn-sm" onclick="deleteType(${type.id}, '${escapeHtml(type.type_name)}')">削除</button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    listContainer.innerHTML = html;

    // 項目追加ボタンのイベント
    const addTypeBtn = document.getElementById('add-type-btn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', onAddType);
    }
}

/**
 * Type編集モーダルを開く
 */
async function editType(typeId) {
    try {
        // 現在のカテゴリIDを取得
        const categoryId = document.getElementById('settings-category-select').value;
        if (!categoryId) return;

        // スキーマを再取得してTypeを探す
        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const typeData = schema.types.find(t => t.type.id === typeId);

        if (!typeData) {
            alert('項目が見つかりませんでした');
            return;
        }

        const type = typeData.type;

        // モーダルに値を設定
        document.getElementById('edit-type-id').value = type.id;
        document.getElementById('edit-type-name').value = type.type_name;
        document.getElementById('edit-type-description').value = type.description || '';
        document.getElementById('edit-type-selection').value = type.selection_type;
        document.getElementById('edit-type-priority').value = type.priority;
        document.getElementById('edit-type-required').checked = type.is_required;

        // モーダルを開く
        openModal('edit-type-modal');

        // フォーム送信イベント
        const form = document.getElementById('edit-type-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            saveTypeEdit();
        };
    } catch (error) {
        console.error('Failed to load type:', error);
        alert('項目の読み込みに失敗しました');
    }
}

/**
 * Type編集を保存
 */
async function saveTypeEdit() {
    const typeId = document.getElementById('edit-type-id').value;
    const typeData = {
        id: parseInt(typeId),
        type_name: document.getElementById('edit-type-name').value,
        description: document.getElementById('edit-type-description').value,
        selection_type: document.getElementById('edit-type-selection').value,
        priority: parseInt(document.getElementById('edit-type-priority').value),
        is_required: document.getElementById('edit-type-required').checked
    };

    try {
        await callGasApi('updateType', typeData);
        closeModal('edit-type-modal');
        showToast('更新しました');

        // リロード
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    } catch (error) {
        console.error('Failed to update type:', error);
        alert('更新に失敗しました');
    }
}

/**
 * キーワード管理モーダルを開く
 */
async function manageKeywords(typeId, typeName) {
    try {
        // 現在のカテゴリIDを取得
        const categoryId = document.getElementById('settings-category-select').value;
        if (!categoryId) return;

        // スキーマを再取得
        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const typeData = schema.types.find(t => t.type.id === typeId);

        if (!typeData) {
            alert('項目が見つかりませんでした');
            return;
        }

        // モーダルにデータを設定
        document.getElementById('keywords-type-id').value = typeId;
        document.getElementById('keywords-modal-title').textContent = `キーワード管理 - ${typeName}`;

        // キーワード一覧を表示
        renderKeywordsList(typeData.keywords || []);

        // モーダルを開く
        openModal('keywords-modal');

        // 追加ボタンのイベント
        document.getElementById('add-keyword-btn').onclick = () => addKeywordInline(typeId);
    } catch (error) {
        console.error('Failed to load keywords:', error);
        alert('キーワードの読み込みに失敗しました');
    }
}

/**
 * キーワード一覧を表示
 */
function renderKeywordsList(keywords) {
    const listContainer = document.getElementById('keywords-list');
    if (!listContainer) return;

    if (keywords.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">キーワードがありません</p>';
        return;
    }

    let html = '<div class="card">';

    keywords.forEach((keyword) => {
        html += `
            <div class="d-flex justify-between align-center p-2 border-bottom">
                <div style="flex: 1;">
                    <span>${escapeHtml(keyword.keyword)}</span>
                    <span class="text-xs text-muted ml-2">優先順位: ${keyword.priority}</span>
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-secondary btn-sm" onclick="editKeyword(${keyword.id}, '${escapeHtml(keyword.keyword)}', ${keyword.priority})">編集</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteKeyword(${keyword.id}, '${escapeHtml(keyword.keyword)}')">削除</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    listContainer.innerHTML = html;
}

/**
 * キーワードをインライン追加
 */
function addKeywordInline(typeId) {
    const keyword = prompt('追加するキーワードを入力してください');
    if (!keyword) return;

    addKeywordApi(typeId, keyword);
}

/**
 * キーワード追加API呼び出し
 */
async function addKeywordApi(typeId, keyword) {
    try {
        await callGasApi('addKeyword', typeId, keyword);
        showToast('キーワードを追加しました');

        // キーワード一覧を再読み込み
        const categoryId = document.getElementById('settings-category-select').value;
        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const typeData = schema.types.find(t => t.type.id === typeId);
        if (typeData) {
            renderKeywordsList(typeData.keywords || []);
        }
    } catch (error) {
        console.error('Failed to add keyword:', error);
        alert('キーワードの追加に失敗しました');
    }
}

/**
 * キーワード編集
 */
async function editKeyword(keywordId, currentKeyword, currentPriority) {
    const newKeyword = prompt('キーワードを編集してください', currentKeyword);
    if (!newKeyword) return;

    const newPriority = prompt('優先順位を入力してください', currentPriority);
    if (!newPriority) return;

    try {
        await callGasApi('updateKeyword', {
            id: keywordId,
            keyword: newKeyword,
            priority: parseInt(newPriority)
        });
        showToast('キーワードを更新しました');

        // キーワード一覧を再読み込み
        const typeId = document.getElementById('keywords-type-id').value;
        const categoryId = document.getElementById('settings-category-select').value;
        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const typeData = schema.types.find(t => t.type.id === parseInt(typeId));
        if (typeData) {
            renderKeywordsList(typeData.keywords || []);
        }
    } catch (error) {
        console.error('Failed to update keyword:', error);
        alert('キーワードの更新に失敗しました');
    }
}

/**
 * キーワード削除
 */
async function deleteKeyword(keywordId, keyword) {
    if (!confirm(`キーワード「${keyword}」を削除しますか？`)) {
        return;
    }

    try {
        await callGasApi('deleteKeyword', { id: keywordId });
        showToast('キーワードを削除しました');

        // キーワード一覧を再読み込み
        const typeId = document.getElementById('keywords-type-id').value;
        const categoryId = document.getElementById('settings-category-select').value;
        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const typeData = schema.types.find(t => t.type.id === parseInt(typeId));
        if (typeData) {
            renderKeywordsList(typeData.keywords || []);
        }
    } catch (error) {
        console.error('Failed to delete keyword:', error);
        alert('キーワードの削除に失敗しました');
    }
}

/**
 * Type追加モーダルを開く
 */
function onAddType() {
    const categoryId = document.getElementById('settings-category-select').value;
    if (!categoryId) {
        alert('カテゴリを選択してください');
        return;
    }

    // フォームをクリア
    document.getElementById('add-type-name').value = '';
    document.getElementById('add-type-description').value = '';
    document.getElementById('add-type-selection').value = 'TEXT';
    document.getElementById('add-type-required').checked = false;

    // モーダルを開く
    openModal('add-type-modal');

    // フォーム送信イベント
    const form = document.getElementById('add-type-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        saveNewType();
    };
}

/**
 * Type追加を保存
 */
async function saveNewType() {
    const categoryId = document.getElementById('settings-category-select').value;
    const typeData = {
        category_id: parseInt(categoryId),
        type_name: document.getElementById('add-type-name').value,
        description: document.getElementById('add-type-description').value,
        selection_type: document.getElementById('add-type-selection').value,
        is_required: document.getElementById('add-type-required').checked
    };

    try {
        await callGasApi('addType', categoryId, typeData);
        closeModal('add-type-modal');
        showToast('項目を追加しました');

        // リロード
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    } catch (error) {
        console.error('Failed to add type:', error);
        alert('追加に失敗しました');
    }
}

/**
 * Type削除
 */
async function deleteType(typeId, typeName) {
    if (!confirm(`項目「${typeName}」を削除しますか？\n関連するキーワードもすべて削除されます。`)) {
        return;
    }

    try {
        await callGasApi('deleteType', typeId);
        showToast('削除しました');

        // リロード
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    } catch (error) {
        console.error('Failed to delete type:', error);
        alert('削除に失敗しました');
    }
}

/**
 * Regulation（命名ルール）セクションを表示
 */
function renderRegulationsSection(regulations) {
    const section = document.getElementById('regulations-section');
    if (!section) return;

    if (regulations.length === 0) {
        section.innerHTML = '';
        return;
    }

    let html = '<div class="card">';
    html += '<h3>命名ルール</h3>';

    regulations.forEach(regulation => {
        html += `
            <div class="card mt-2">
                <div class="d-flex justify-between align-center">
                    <div style="flex: 1;">
                        <h4 class="mb-1">${escapeHtml(regulation.target)}</h4>
                        <p class="text-sm font-mono bg-gray-100 p-2 rounded">${escapeHtml(regulation.pattern_string)}</p>
                    </div>
                    <div>
                        <button class="btn btn-secondary btn-sm" onclick="editRegulation(${regulation.id})">編集</button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    section.innerHTML = html;
}

/**
 * Regulation編集モーダルを開く
 */
async function editRegulation(regulationId) {
    try {
        const categoryId = document.getElementById('settings-category-select').value;
        if (!categoryId) return;

        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const regulation = schema.regulations.find(r => r.id === regulationId);

        if (!regulation) {
            alert('ルールが見つかりませんでした');
            return;
        }

        // モーダルに値を設定
        document.getElementById('edit-regulation-id').value = regulation.id;
        document.getElementById('edit-regulation-target').value = regulation.target;
        document.getElementById('edit-regulation-pattern').value = regulation.pattern_string;

        // プレースホルダーボタンを生成
        renderPlaceholderButtons(schema.types || []);

        // モーダルを開く
        openModal('edit-regulation-modal');

        // フォーム送信イベント
        const form = document.getElementById('edit-regulation-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            saveRegulationEdit();
        };
    } catch (error) {
        console.error('Failed to load regulation:', error);
        alert('ルールの読み込みに失敗しました');
    }
}

/**
 * プレースホルダーボタンを生成
 */
function renderPlaceholderButtons(typesData) {
    const container = document.getElementById('placeholder-buttons');
    if (!container) return;

    let html = '<p class="text-sm mb-2"><strong>プレースホルダーを挿入:</strong></p>';
    html += '<div class="d-flex flex-wrap gap-1">';

    typesData.forEach(typeData => {
        const type = typeData.type;
        html += `<button type="button" class="btn btn-secondary btn-sm" onclick="insertPlaceholder(${type.id})">{${type.id}} - ${escapeHtml(type.type_name)}</button>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * プレースホルダーを挿入
 */
function insertPlaceholder(typeId) {
    const textarea = document.getElementById('edit-regulation-pattern');
    if (!textarea) return;

    const placeholder = `{${typeId}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + placeholder + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
}

/**
 * Regulation編集を保存
 */
async function saveRegulationEdit() {
    const regulationId = document.getElementById('edit-regulation-id').value;
    const patternString = document.getElementById('edit-regulation-pattern').value;

    try {
        await callGasApi('updateRegulation', {
            id: parseInt(regulationId),
            pattern_string: patternString
        });
        closeModal('edit-regulation-modal');
        showToast('ルールを更新しました');

        // リロード
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    } catch (error) {
        console.error('Failed to update regulation:', error);
        alert('更新に失敗しました');
    }
}

/**
 * カテゴリ追加
 */
function onAddCategory() {
    console.log('Add new category');
    // TODO: カテゴリ追加ウィザードの実装
    alert('カテゴリ追加機能は今後実装予定です');
}

// 初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initSettingsScreen);
}
