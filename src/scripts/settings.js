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
            option.textContent = category.category_name;
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
    } catch (error) {
        console.error('Failed to load schema:', error);
        showError('スキーマの読み込みに失敗しました', 'types-list');
    }
}

/**
 * Type一覧を表示
 */
function renderTypesList(types) {
    const listContainer = document.getElementById('types-list');
    if (!listContainer) return;

    if (types.length === 0) {
        listContainer.innerHTML = '<p class="text-muted">項目がありません</p>';
        return;
    }

    let html = '<div class="card">';
    html += '<h3>入力項目一覧</h3>';

    types.forEach(type => {
        html += `
            <div class="card mt-2">
                <div class="d-flex justify-between align-center">
                    <div>
                        <h4>${escapeHtml(type.type_name)}</h4>
                        <p class="text-sm text-muted">${escapeHtml(type.description || '')}</p>
                        <span class="badge badge-primary">${escapeHtml(type.selection_type)}</span>
                        ${type.is_required ? '<span class="badge badge-danger ml-1">必須</span>' : '<span class="badge badge-secondary ml-1">任意</span>'}
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-secondary btn-sm" onclick="editType(${type.id})">編集</button>
                        <button class="btn btn-secondary btn-sm" onclick="manageKeywords(${type.id})">キーワード</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteType(${type.id})">削除</button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    listContainer.innerHTML = html;
}

/**
 * Type編集
 */
function editType(typeId) {
    console.log('Edit type:', typeId);
    // TODO: 編集モーダルの実装
    alert('Type編集機能は今後実装予定です');
}

/**
 * キーワード管理
 */
function manageKeywords(typeId) {
    console.log('Manage keywords:', typeId);
    // TODO: キーワード管理モーダルの実装
    alert('キーワード管理機能は今後実装予定です');
}

/**
 * Type削除
 */
async function deleteType(typeId) {
    if (!confirm('本当にこの項目を削除しますか？')) {
        return;
    }

    try {
        await callGasApi('deleteType', typeId);
        alert('削除しました');

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
