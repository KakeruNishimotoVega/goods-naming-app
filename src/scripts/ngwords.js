// src/scripts/ngwords.js
// NGワード管理画面のロジック

// 初期化フラグ（二重初期化を防ぐ）
let isNgWordsScreenInitialized = false;

/**
 * NGワード管理画面の初期化
 */
function initNgWordsScreen() {
    console.log('[initNgWordsScreen] NGワード管理画面の初期化を開始...');
    console.log('[initNgWordsScreen] isNgWordsScreenInitialized:', isNgWordsScreenInitialized);
    
    // 二重初期化を防ぐ
    if (isNgWordsScreenInitialized) {
        console.log('[initNgWordsScreen] 既に初期化済み - スキップ');
        return;
    }
    
    console.log('[initNgWordsScreen] 初期化実行中...');
    isNgWordsScreenInitialized = true;

    // 管理者権限チェック（権限チェック中はローディング表示）
    const tbody = document.getElementById('ngwords-tbody');
    if (tbody) {
        showLoading('ngwords-tbody');
    }

    checkRole('admin', () => {
        // 権限あり：最新データを読み込む
        loadNgWords();

        // 追加ボタンのイベント（初回のみ設定）
        const addBtn = document.getElementById('add-ngword-btn');
        if (addBtn && !addBtn.dataset.listenerAdded) {
            addBtn.addEventListener('click', onAddNgWord);
            addBtn.dataset.listenerAdded = 'true';
        }
        
        console.log('[initNgWordsScreen] 初期化完了');
    }, () => {
        // 権限なし：命名画面へリダイレクト
        showErrorToast('この画面にアクセスする権限がありません（管理者のみ）');
        redirectToNamingScreen();
    });
}

/**
 * NGワード一覧を読み込む
 */
async function loadNgWords() {
    console.log('[loadNgWords] 処理開始');
    
    const tbody = document.getElementById('ngwords-tbody');
    if (!tbody) {
        console.error('[loadNgWords] ngwords-tbody要素が見つかりません');
        return;
    }

    try {
        console.log('[loadNgWords] ローディング表示開始');
        showLoading('ngwords-tbody');

        console.log('[loadNgWords] getNgWordsを呼び出し中...');
        const ngWords = await callGasApi('getNgWords');
        console.log('[loadNgWords] データ取得成功:', ngWords);

        if (!ngWords || !Array.isArray(ngWords)) {
            console.error('[loadNgWords] 予期しないデータ形式:', typeof ngWords);
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">データ形式エラー</td></tr>';
            return;
        }

        if (ngWords.length === 0) {
            console.log('[loadNgWords] NGワードなし');
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">NGワードが登録されていません</td></tr>';
            return;
        }

        console.log('[loadNgWords] レンダリング開始');
        renderNgWordsList(ngWords);
        console.log('[loadNgWords] 処理完了');
    } catch (error) {
        console.error('[loadNgWords] エラー:', error);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">NGワードの読み込みに失敗しました</td></tr>';
    }
}

/**
 * NGワード一覧を表示
 */
function renderNgWordsList(ngWords) {
    const tbody = document.getElementById('ngwords-tbody');
    if (!tbody) return;

    let html = '';

    ngWords.forEach(ngWord => {
        html += `
            <tr>
                <td>
                    <span class="ngword-text" data-id="${ngWord.id}" style="cursor: pointer; color: #007bff; text-decoration: underline;">
                        ${escapeHtml(ngWord.word)}
                    </span>
                </td>
                <td>${escapeHtml(ngWord.reason || '-')}</td>
                <td>
                    <button class="btn-delete-ngword btn btn-danger btn-sm" data-id="${ngWord.id}" data-word="${escapeHtml(ngWord.word)}">削除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // NGワードクリックでモーダルを開く
    document.querySelectorAll('.ngword-text').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id; // UUIDなので文字列のまま
            const ngWord = ngWords.find(ng => ng.id === id);
            if (ngWord) {
                editNgWord(ngWord.id, ngWord.word, ngWord.reason || '');
            }
        });
    });

    // 削除ボタンのイベント
    document.querySelectorAll('.btn-delete-ngword').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id; // UUIDなので文字列のまま
            const word = this.dataset.word;
            deleteNgWord(id, word);
        });
    });
}

/**
 * NGワード追加モーダルを開く
 */
function onAddNgWord() {
    // フォームをクリア
    document.getElementById('add-ngword-word').value = '';
    document.getElementById('add-ngword-reason').value = '';

    // モーダルを開く
    openModal('add-ngword-modal');

    // フォーム送信イベント
    const form = document.getElementById('add-ngword-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        saveNewNgWord();
    };
}

/**
 * 新規NGワードを保存
 */
async function saveNewNgWord() {
    const word = document.getElementById('add-ngword-word').value;
    const reason = document.getElementById('add-ngword-reason').value;

    try {
        await callGasApi('addNgWord', word, reason);
        closeModal('add-ngword-modal');
        showToast('NGワードを追加しました');
        loadNgWords();
    } catch (error) {
        console.error('Failed to add NG word:', error);
        alert('NGワードの追加に失敗しました');
    }
}

/**
 * NGワード編集モーダルを開く
 */
function editNgWord(id, currentWord, currentReason) {
    // フォームに現在の値を設定
    document.getElementById('edit-ngword-id').value = id;
    document.getElementById('edit-ngword-word').value = currentWord;
    document.getElementById('edit-ngword-reason').value = currentReason || '';

    // モーダルを開く
    openModal('edit-ngword-modal');

    // フォーム送信イベント
    const form = document.getElementById('edit-ngword-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        saveNgWordEdit();
    };
}

/**
 * NGワード編集を保存
 */
async function saveNgWordEdit() {
    const id = document.getElementById('edit-ngword-id').value; // UUIDなので文字列のまま
    const word = document.getElementById('edit-ngword-word').value;
    const reason = document.getElementById('edit-ngword-reason').value;

    try {
        await callGasApi('updateNgWord', id, word, reason);
        closeModal('edit-ngword-modal');
        showToast('NGワードを更新しました');
        loadNgWords();
    } catch (error) {
        console.error('Failed to update NG word:', error);
        alert('NGワードの更新に失敗しました');
    }
}

/**
 * NGワード削除
 */
function deleteNgWord(id, word) {
    if (!confirm(`NGワード「${word}」を削除しますか？`)) {
        return;
    }

    deleteNgWordApi(id);
}

/**
 * NGワード削除API呼び出し
 */
async function deleteNgWordApi(id) {
    try {
        await callGasApi('deleteNgWord', id);
        showToast('NGワードを削除しました');
        loadNgWords();
    } catch (error) {
        console.error('Failed to delete NG word:', error);
        alert('NGワードの削除に失敗しました');
    }
}

// 注意: initNgWordsScreen()は自動的に呼ばれません
// app.jsのshowScreen()で画面表示時に呼ばれます
