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
        container.innerHTML = `
            <div class="local-loader">
                <div class="spinner"></div>
                <span style="font-size: 0.95rem; font-weight: 500; letter-spacing: 0.05em;">読み込み中...</span>
            </div>
        `;
    }
}

/**
 * スケルトンスクリーンを表示
 */
function showSkeleton(containerId, type = 'card') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';
    if (type === 'card') {
        html = `
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
        `;
    } else if (type === 'list') {
        html = `
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="skeleton skeleton-text" style="width: 90%;"></div>
            <div class="skeleton skeleton-text" style="width: 70%;"></div>
        `;
    } else if (type === 'table') {
        html = `
            <div class="skeleton skeleton-text" style="width: 100%; height: 40px; margin-bottom: 10px;"></div>
            <div class="skeleton skeleton-text" style="width: 100%; height: 40px; margin-bottom: 10px;"></div>
            <div class="skeleton skeleton-text" style="width: 100%; height: 40px; margin-bottom: 10px;"></div>
        `;
    }

    container.innerHTML = html;
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
        // アニメーション用にクラスを追加
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

/**
 * モーダルを閉じる
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        // アニメーション終了後に非表示
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
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

/**
 * クリップボードにテキストをコピー
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('コピーしました！');
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopy(text);
            });
    } else {
        fallbackCopy(text);
    }
}

/**
 * フォールバックコピー機能（古いブラウザ対応）
 */
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showToast('コピーしました！');
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('コピーに失敗しました');
    }

    document.body.removeChild(textarea);
}

/**
 * トーストメッセージを表示
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    // タイプに応じた背景色を設定
    let bgColor = '#333';
    let icon = '✓';
    if (type === 'error') {
        bgColor = '#ef4444';
        icon = '✕';
    } else if (type === 'warning') {
        bgColor = '#f59e0b';
        icon = '⚠';
    } else if (type === 'info') {
        bgColor = '#3b82f6';
        icon = 'ℹ';
    }

    toast.innerHTML = `<span style="margin-right: 8px;">${icon}</span>${escapeHtml(message)}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 2000);
}

/**
 * エラーメッセージをトーストで表示
 */
function showErrorToast(message) {
    showToast(message, 'error');
}

/**
 * グローバルエラーハンドラー
 */
function handleApiError(error, context = '') {
    console.error(`API Error ${context}:`, error);

    let message = 'エラーが発生しました';

    if (error && error.message) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    showErrorToast(message);
}
