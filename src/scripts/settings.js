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

    let html = '<div class="form-card">';
    html += '<div class="d-flex justify-between align-center mb-3">';
    html += '<h3>入力項目一覧</h3>';
    html += '<button id="add-type-btn" class="btn primary btn-sm">+ 項目を追加</button>';
    html += '</div>';

    // 項目ごとにブロック分けして表示
    typesData.forEach((typeData) => {
        const type = typeData.type;
        const keywords = typeData.keywords || [];

        html += '<div class="type-block" style="border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; margin-bottom: 1rem; background-color: white;">';

        // 項目ヘッダー
        html += '<div class="d-flex justify-between align-center mb-3">';
        html += '<div>';
        html += `<h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main);">${escapeHtml(type.display_name)}</h4>`;
        html += '</div>';
        html += '<div class="d-flex gap-1">';
        html += `<button class="btn secondary btn-sm btn-edit-type" data-type-id="${type.id}" title="項目を編集">編集</button>`;
        html += `<button class="btn danger btn-sm btn-delete-type" data-type-id="${type.id}" data-type-name="${escapeHtml(type.display_name)}" title="項目を削除">削除</button>`;
        html += '</div>';
        html += '</div>';

        // 説明文（あれば）
        if (type.description) {
            html += `<p class="text-sm text-muted" style="margin: 0 0 1rem 0; line-height: 1.5;">${escapeHtml(type.description)}</p>`;
        }

        // 項目情報（ラベル: 値の形式）
        html += '<div style="background-color: #f8fafc; border-radius: 6px; padding: 1rem; margin-bottom: 1rem;">';
        html += '<div style="display: grid; grid-template-columns: 140px 1fr; gap: 0.75rem; font-size: 0.9rem;">';
        
        // 選択方式
        const selectionTypeLabel = {
            'TEXT': 'テキスト入力',
            'SINGLE': '単一選択（ラジオボタン）',
            'MULTI': '複数選択（チェックボックス）',
            'MULTIPLE': '複数選択（チェックボックス）',
            'TRUE_FALSE': 'True/False（トグル）',
            'BOOLEAN': 'True/False（トグル）'
        }[type.selection_type] || type.selection_type;
        
        html += '<div style="font-weight: 600; color: var(--text-muted);">選択方式:</div>';
        html += `<div style="color: var(--text-main);">${escapeHtml(selectionTypeLabel)}</div>`;
        
        // 入力形式
        html += '<div style="font-weight: 600; color: var(--text-muted);">入力形式:</div>';
        html += `<div style="color: var(--text-main);"><span class="badge ${type.is_required ? 'badge-required' : 'badge-optional'}">${type.is_required ? '必須' : '任意'}</span></div>`;
        
        // キー名（プレースホルダーで使用）
        html += '<div style="font-weight: 600; color: var(--text-muted);">キー名:</div>';
        html += `<div style="font-family: monospace; color: var(--primary-color); font-weight: 500;">{${escapeHtml(type.key_name || type.display_name)}}</div>`;
        
        // プレースホルダー（TEXT入力の場合のみ）
        if (type.selection_type === 'TEXT' && type.placeholder) {
            html += '<div style="font-weight: 600; color: var(--text-muted);">プレースホルダー:</div>';
            html += `<div style="color: var(--text-muted); font-style: italic;">"${escapeHtml(type.placeholder)}"</div>`;
        }
        
        html += '</div>';
        html += '</div>';

        // キーワードテーブル（SINGLE/MULTI/MULTIPLEの場合のみ）
        if (type.selection_type === 'SINGLE' || type.selection_type === 'MULTI' || type.selection_type === 'MULTIPLE') {
            html += '<div class="keywords-section">';
            html += '<div class="d-flex justify-between align-center mb-2">';
            html += '<h5 style="margin: 0; font-size: 0.9rem; font-weight: 600;">選択肢一覧</h5>';
            html += `<button class="btn primary btn-sm btn-add-keyword" data-type-id="${type.id}" title="キーワードを追加">+ 選択肢を追加</button>`;
            html += '</div>';

            if (keywords.length > 0) {
                html += '<div class="table-responsive">';
                html += `<table class="table keywords-table" data-type-id="${type.id}">`;
                html += '<thead><tr>';
                html += '<th style="width: 80px;">優先順位</th>';
                html += '<th>テキスト</th>';
                html += '<th style="width: 150px;">操作</th>';
                html += '</tr></thead>';
                html += '<tbody class="sortable-keywords">';

                keywords.forEach((keyword) => {
                    html += `<tr data-keyword-id="${keyword.id}" draggable="true">`;
                    html += `<td class="text-center"><span class="drag-handle" style="cursor: move;">☰</span> ${keyword.priority}</td>`;
                    html += `<td class="keyword-text-cell" data-keyword-id="${keyword.id}" data-keyword-text="${escapeHtml(keyword.keyword)}" style="cursor: pointer;" title="クリックして編集">${escapeHtml(keyword.keyword)}</td>`;
                    html += `<td>`;
                    html += `<div class="d-flex gap-1">`;
                    html += `<button class="btn secondary btn-sm btn-google-search" data-keyword="${escapeHtml(keyword.keyword)}" title="Google検索">🔍</button>`;
                    html += `<button class="btn danger btn-sm btn-delete-keyword" data-keyword-id="${keyword.id}" data-keyword-text="${escapeHtml(keyword.keyword)}" title="削除">削除</button>`;
                    html += `</div>`;
                    html += `</td>`;
                    html += '</tr>';
                });

                html += '</tbody></table>';
                html += '</div>';
            } else {
                html += '<p class="text-muted text-sm">選択肢がありません</p>';
            }

            html += '</div>';
        }

        html += '</div>';
    });

    html += '</div>';

    listContainer.innerHTML = html;

    // 項目追加ボタンのイベント
    const addTypeBtn = document.getElementById('add-type-btn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', onAddType);
    }

    // 項目編集ボタンのイベント
    document.querySelectorAll('.btn-edit-type').forEach(btn => {
        btn.addEventListener('click', function() {
            editType(this.dataset.typeId);
        });
    });

    // 項目削除ボタンのイベント
    document.querySelectorAll('.btn-delete-type').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteType(this.dataset.typeId, this.dataset.typeName);
        });
    });

    // キーワード追加ボタンのイベント
    document.querySelectorAll('.btn-add-keyword').forEach(btn => {
        btn.addEventListener('click', function() {
            addKeywordInline(this.dataset.typeId);
        });
    });

    // Google検索ボタンのイベント
    document.querySelectorAll('.btn-google-search').forEach(btn => {
        btn.addEventListener('click', function() {
            window.open('https://www.google.com/search?q=' + encodeURIComponent(this.dataset.keyword), '_blank');
        });
    });

    // キーワードテキストのインライン編集
    document.querySelectorAll('.keyword-text-cell').forEach(cell => {
        cell.addEventListener('click', function() {
            makeKeywordEditable(this);
        });
    });

    // キーワード削除ボタンのイベント
    document.querySelectorAll('.btn-delete-keyword').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteKeyword(this.dataset.keywordId, this.dataset.keywordText);
        });
    });

    // ドラッグアンドドロップを初期化
    initDragAndDrop();
}

/**
 * Type編集モーダルを開く
 */
async function editType(typeId) {
    // モーダルを先に開く（ローディング状態）
    openModal('edit-type-modal');

    // フォームをローディング状態に
    const form = document.getElementById('edit-type-form');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => input.disabled = true);

    try {
        // 現在のカテゴリIDを取得
        const categoryId = document.getElementById('settings-category-select').value;
        if (!categoryId) {
            closeModal('edit-type-modal');
            return;
        }

        // スキーマを再取得してTypeを探す
        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const typeData = schema.types.find(t => t.type.id === typeId);

        if (!typeData) {
            closeModal('edit-type-modal');
            alert('項目が見つかりませんでした');
            return;
        }

        const type = typeData.type;

        // モーダルに値を設定
        document.getElementById('edit-type-id').value = type.id;
        document.getElementById('edit-type-key-name').value = type.key_name || '';
        document.getElementById('edit-type-name').value = type.display_name;
        document.getElementById('edit-type-description').value = type.description || '';
        document.getElementById('edit-type-selection').value = type.selection_type;
        document.getElementById('edit-type-required').checked = type.is_required;

        // フォームを有効化
        inputs.forEach(input => input.disabled = false);

        // フォーム送信イベント
        form.onsubmit = (e) => {
            e.preventDefault();
            saveTypeEdit();
        };
    } catch (error) {
        console.error('Failed to load type:', error);
        closeModal('edit-type-modal');
        alert('項目の読み込みに失敗しました');
    }
}

/**
 * Type編集を保存
 */
async function saveTypeEdit() {
    const typeId = document.getElementById('edit-type-id').value;
    const typeData = {
        id: typeId,
        display_name: document.getElementById('edit-type-name').value,
        description: document.getElementById('edit-type-description').value,
        selection_type: document.getElementById('edit-type-selection').value,
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
 * キーワード追加モーダルを開く
 */
function addKeywordInline(typeId) {
    // TypeIDを保存
    document.getElementById('add-keyword-type-id').value = typeId;
    document.getElementById('add-keyword-text').value = '';

    // モーダルを開く
    openModal('add-keyword-modal');

    // フォーム送信イベント
    const form = document.getElementById('add-keyword-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        saveNewKeyword();
    };
}

/**
 * 新しいキーワードを保存
 */
async function saveNewKeyword() {
    const typeId = document.getElementById('add-keyword-type-id').value;
    const keyword = document.getElementById('add-keyword-text').value.trim();

    if (!keyword) {
        alert('キーワードを入力してください');
        return;
    }

    try {
        await callGasApi('addKeyword', typeId, keyword);
        closeModal('add-keyword-modal');
        showToast('キーワードを追加しました');

        // 画面をリロード
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    } catch (error) {
        console.error('Failed to add keyword:', error);
        alert('キーワードの追加に失敗しました');
    }
}

/**
 * キーワード編集（モーダル用）
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
        const typeData = schema.types.find(t => t.type.id === typeId);
        if (typeData) {
            renderKeywordsList(typeData.keywords || []);
        }
    } catch (error) {
        console.error('Failed to update keyword:', error);
        alert('キーワードの更新に失敗しました');
    }
}

/**
 * キーワードテキストをインライン編集可能にする
 */
function makeKeywordEditable(cell) {
    // 既に編集中の場合は何もしない
    if (cell.querySelector('input')) return;

    const keywordId = cell.dataset.keywordId;
    const currentText = cell.dataset.keywordText;

    // テキストを入力フィールドに置き換え
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'form-control';
    input.style.width = '100%';

    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    // 保存処理
    const saveEdit = async () => {
        const newText = input.value.trim();
        if (!newText) {
            alert('キーワードを入力してください');
            input.focus();
            return;
        }

        if (newText === currentText) {
            // 変更なし
            cell.textContent = currentText;
            return;
        }

        try {
            await callGasApi('updateKeyword', {
                id: keywordId,
                keyword: newText
            });
            showToast('キーワードを更新しました');

            // 画面をリロード
            const categorySelect = document.getElementById('settings-category-select');
            if (categorySelect && categorySelect.value) {
                onSettingsCategoryChange({ target: categorySelect });
            }
        } catch (error) {
            console.error('Failed to update keyword:', error);
            alert('キーワードの更新に失敗しました');
            cell.textContent = currentText;
        }
    };

    // Enterキーで保存
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            // Escキーでキャンセル
            cell.textContent = currentText;
        }
    });

    // フォーカスが外れたら保存
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (cell.contains(input)) {
                saveEdit();
            }
        }, 100);
    });
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

        // モーダル内から呼ばれた場合
        const modalTypeId = document.getElementById('keywords-type-id');
        if (modalTypeId && modalTypeId.value) {
            const typeId = modalTypeId.value;
            const categoryId = document.getElementById('settings-category-select').value;
            const schema = await callGasApi('getSchemaForCategory', categoryId);
            const typeData = schema.types.find(t => t.type.id === parseInt(typeId));
            if (typeData) {
                renderKeywordsList(typeData.keywords || []);
            }
        } else {
            // インラインから呼ばれた場合
            const categorySelect = document.getElementById('settings-category-select');
            if (categorySelect && categorySelect.value) {
                onSettingsCategoryChange({ target: categorySelect });
            }
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
    const displayName = document.getElementById('add-type-name').value.trim();

    if (!displayName) {
        alert('項目名を入力してください');
        return;
    }

    // key_nameは項目名と同じ
    const keyName = displayName;

    const typeData = {
        category_id: categoryId,
        key_name: keyName,
        display_name: displayName,
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

    // 商品ページ名→商品名の順にソート
    const sortedRegulations = [...regulations].sort((a, b) => {
        const order = { '商品ページ名': 1, '商品名': 2 };
        return (order[a.target] || 999) - (order[b.target] || 999);
    });

    let html = '<div class="form-card">';
    html += '<h3>命名ルール</h3>';

    sortedRegulations.forEach(regulation => {
        html += `
            <div class="input-group" style="border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--border-radius-md); margin-top: 1rem;">
                <div class="d-flex justify-between align-center mb-2">
                    <h4 style="margin: 0; font-size: 1rem;">${escapeHtml(regulation.target)}</h4>
                    <button class="btn secondary btn-sm btn-edit-regulation" data-regulation-id="${regulation.id}">編集</button>
                </div>
                <div class="font-mono" style="background: var(--background-color); padding: 0.75rem; border-radius: var(--border-radius-sm); font-size: 0.9rem; color: var(--text-main); word-break: break-all;">${escapeHtml(regulation.pattern_string)}</div>
            </div>
        `;
    });

    html += '</div>';
    section.innerHTML = html;

    // 編集ボタンのイベントリスナーを追加
    document.querySelectorAll('.btn-edit-regulation').forEach(btn => {
        btn.addEventListener('click', function() {
            editRegulation(this.dataset.regulationId);
        });
    });
}

/**
 * Regulation編集モーダルを開く
 */
async function editRegulation(regulationId) {
    // モーダルを先に開く（ローディング状態）
    openModal('edit-regulation-modal');

    // フォームをローディング状態に
    const form = document.getElementById('edit-regulation-form');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => input.disabled = true);

    try {
        const categoryId = document.getElementById('settings-category-select').value;
        if (!categoryId) {
            closeModal('edit-regulation-modal');
            return;
        }

        const schema = await callGasApi('getSchemaForCategory', categoryId);
        const regulation = schema.regulations.find(r => r.id === regulationId);

        if (!regulation) {
            closeModal('edit-regulation-modal');
            alert('ルールが見つかりませんでした');
            return;
        }

        // モーダルに値を設定
        document.getElementById('edit-regulation-id').value = regulation.id;
        document.getElementById('edit-regulation-target').value = regulation.target;
        document.getElementById('edit-regulation-pattern').value = regulation.pattern_string;

        // プレースホルダーボタンを生成
        renderPlaceholderButtons(schema.types || []);

        // フォームを有効化
        inputs.forEach(input => input.disabled = false);

        // キャンセルボタンのイベント（リセット処理付き）
        const cancelBtn = document.getElementById('cancel-regulation-edit');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                resetRegulationModal();
                closeModal('edit-regulation-modal');
            };
        }

        // フォーム送信イベント
        form.onsubmit = (e) => {
            e.preventDefault();
            saveRegulationEdit();
        };
    } catch (error) {
        console.error('Failed to load regulation:', error);
        closeModal('edit-regulation-modal');
        alert('ルールの読み込みに失敗しました');
    }
}

/**
 * Regulation編集モーダルをリセット
 */
function resetRegulationModal() {
    document.getElementById('edit-regulation-id').value = '';
    document.getElementById('edit-regulation-target').value = '';
    document.getElementById('edit-regulation-pattern').value = '';

    const placeholderButtons = document.getElementById('placeholder-buttons');
    if (placeholderButtons) {
        placeholderButtons.innerHTML = '';
    }
}

/**
 * プレースホルダーボタンを生成
 */
function renderPlaceholderButtons(typesData) {
    const container = document.getElementById('placeholder-buttons');
    if (!container) return;

    let html = '<p class="text-sm mb-2"><strong>プレースホルダーを挿入:</strong></p>';
    html += '<div class="d-flex flex-wrap gap-1" id="placeholder-buttons-container">';

    typesData.forEach(typeData => {
        const type = typeData.type;
        html += `<button type="button" class="btn btn-secondary btn-sm btn-insert-placeholder" data-type-id="${type.id}" data-type-name="${escapeHtml(type.display_name)}">${escapeHtml(type.display_name)}</button>`;
    });

    html += '</div>';
    container.innerHTML = html;

    // イベントリスナーを追加
    document.querySelectorAll('.btn-insert-placeholder').forEach(btn => {
        btn.addEventListener('click', function() {
            insertPlaceholder(this.dataset.typeId, this.dataset.typeName);
        });
    });

    // テキストエリアの変更を監視
    const textarea = document.getElementById('edit-regulation-pattern');
    if (textarea) {
        // 初期状態をチェック
        updatePlaceholderButtonStates();

        // input イベントで変更を監視（既存のリスナーをクリア）
        textarea.removeEventListener('input', updatePlaceholderButtonStates);
        textarea.addEventListener('input', updatePlaceholderButtonStates);
    }
}

/**
 * プレースホルダーを挿入
 */
function insertPlaceholder(_typeId, typeName) {
    const textarea = document.getElementById('edit-regulation-pattern');
    if (!textarea) return;

    const placeholder = `{${typeName}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + placeholder + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);

    // ボタンの状態を更新
    updatePlaceholderButtonStates();
}

/**
 * プレースホルダーボタンの状態を更新（使用済みを無効化）
 */
function updatePlaceholderButtonStates() {
    const textarea = document.getElementById('edit-regulation-pattern');
    if (!textarea) return;

    const pattern = textarea.value;
    
    // パターンから使用されているプレースホルダーを抽出
    const usedPlaceholders = new Set();
    const regex = /\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(pattern)) !== null) {
        usedPlaceholders.add(match[1]);
    }

    // 各ボタンの状態を更新
    document.querySelectorAll('.btn-insert-placeholder').forEach(btn => {
        const typeName = btn.dataset.typeName;
        
        if (usedPlaceholders.has(typeName)) {
            // 使用済み: ボタンを無効化してスタイルを変更
            btn.disabled = true;
            btn.classList.add('btn-used');
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.style.backgroundColor = '#e2e8f0';
            btn.style.color = '#64748b';
            
            // チェックマークを追加（まだない場合）
            if (!btn.querySelector('.checkmark')) {
                const checkmark = document.createElement('span');
                checkmark.className = 'checkmark';
                checkmark.textContent = ' ✓';
                checkmark.style.color = '#10b981';
                btn.appendChild(checkmark);
            }
        } else {
            // 未使用: ボタンを有効化
            btn.disabled = false;
            btn.classList.remove('btn-used');
            btn.style.opacity = '';
            btn.style.cursor = '';
            btn.style.backgroundColor = '';
            btn.style.color = '';
            
            // チェックマークを削除
            const checkmark = btn.querySelector('.checkmark');
            if (checkmark) {
                checkmark.remove();
            }
        }
    });
}

/**
 * Regulation編集を保存
 */
async function saveRegulationEdit() {
    const regulationId = document.getElementById('edit-regulation-id').value;
    const patternString = document.getElementById('edit-regulation-pattern').value;

    try {
        await callGasApi('updateRegulation', {
            id: regulationId,
            pattern_string: patternString
        });
        resetRegulationModal();
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

/**
 * ドラッグアンドドロップの初期化
 */
function initDragAndDrop() {
    const tables = document.querySelectorAll('.keywords-table');

    tables.forEach(table => {
        const tbody = table.querySelector('.sortable-keywords');
        if (!tbody) return;

        let draggedRow = null;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            row.addEventListener('dragstart', function(e) {
                draggedRow = this;
                this.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });

            row.addEventListener('dragend', function() {
                this.style.opacity = '1';
                draggedRow = null;
            });

            row.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (draggedRow && draggedRow !== this) {
                    const rect = this.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;

                    if (e.clientY < midpoint) {
                        this.parentNode.insertBefore(draggedRow, this);
                    } else {
                        this.parentNode.insertBefore(draggedRow, this.nextSibling);
                    }
                }
            });

            row.addEventListener('drop', function() {
                // 順序変更を保存
                saveKeywordOrder(table.dataset.typeId, tbody);
            });
        });
    });
}

/**
 * キーワードの順序を保存
 */
async function saveKeywordOrder(typeId, tbody) {
    try {
        const rows = tbody.querySelectorAll('tr');
        const updates = [];

        rows.forEach((row, index) => {
            const keywordId = row.dataset.keywordId;
            updates.push({
                id: keywordId,
                priority: index + 1
            });
        });

        // 一括更新APIを呼び出す
        await callGasApi('updateKeywordsPriority', typeId, updates);
        showToast('優先順位を更新しました');

        // 画面をリロード
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    } catch (error) {
        console.error('Failed to update keyword order:', error);
        alert('優先順位の更新に失敗しました');

        // エラー時は画面をリロードして元に戻す
        const categorySelect = document.getElementById('settings-category-select');
        if (categorySelect && categorySelect.value) {
            onSettingsCategoryChange({ target: categorySelect });
        }
    }
}

// 初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initSettingsScreen);
}
