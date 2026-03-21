// src/scripts/utils.js
// 共通ユーティリティ関数

/**
 * 要素を表示する
 */
function showElement(element) {
    if (element) {
        element.style.display = 'block';
    }
}

/**
 * 要素を非表示にする
 */
function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * 要素を切り替える
 */
function toggleElement(element) {
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * ローディングスピナーを表示
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="spinner"></div> 読み込み中...';
    }
}

/**
 * エラーメッセージを表示
 */
function showError(message, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
}

/**
 * 成功メッセージを表示
 */
function showSuccess(message, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="alert alert-success">${message}</div>`;
    }
}

/**
 * モーダルを開く
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * モーダルを閉じる
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 文字列をエスケープする（XSS対策）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * オブジェクトをクエリ文字列に変換
 */
function objectToQueryString(obj) {
    return Object.keys(obj)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
}
