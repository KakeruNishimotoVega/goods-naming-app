// src/scripts/ngwords.js
// NGワード管理画面のロジック

/**
 * NGワード管理画面の初期化
 */
function initNgWordsScreen() {
    console.log('Initializing NG words screen...');

    // NGワード一覧を読み込む
    loadNgWords();

    // 追加ボタンのイベント
    const addBtn = document.getElementById('add-ngword-btn');
    if (addBtn) {
        addBtn.addEventListener('click', onAddNgWord);
    }
}

/**
 * NGワード一覧を読み込む
 */
async function loadNgWords() {
    const tbody = document.getElementById('ngwords-tbody');
    if (!tbody) return;

    try {
        showLoading('ngwords-tbody');

        const ngWords = await callGasApi('getNgWords');

        if (ngWords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">NGワードが登録されていません</td></tr>';
            return;
        }

        renderNgWordsList(ngWords);
    } catch (error) {
        console.error('Failed to load NG words:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">NGワードの読み込みに失敗しました</td></tr>';
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
                <td>${ngWord.id}</td>
                <td><strong>${escapeHtml(ngWord.word)}</strong></td>
                <td>${escapeHtml(ngWord.reason || '-')}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editNgWord(${ngWord.id}, '${escapeHtml(ngWord.word)}', '${escapeHtml(ngWord.reason || '')}')">編集</button>
                    <button class="btn btn-danger btn-sm ml-1" onclick="deleteNgWord(${ngWord.id}, '${escapeHtml(ngWord.word)}')">削除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
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
    const id = parseInt(document.getElementById('edit-ngword-id').value);
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

// 初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initNgWordsScreen);
}
