// src/scripts/app.js
// アプリケーションのコアロジック

/**
 * アプリケーションの初期化
 */
function initApp() {
    console.log('Initializing LOWYA Naming App...');

    // 画面切り替えの設定
    setupScreenNavigation();

    // 初期画面の表示
    showScreen('naming-screen');

    console.log('App initialized successfully');
}

/**
 * 画面切り替えのセットアップ
 */
function setupScreenNavigation() {
    // TODO: ナビゲーションメニューの実装
    // 各画面への切り替え処理を実装
}

/**
 * 指定した画面を表示
 */
function showScreen(screenId) {
    // すべての画面を非表示
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
    });

    // 指定した画面を表示
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = 'block';
    }
}

/**
 * GASバックエンドAPI呼び出しのラッパー
 */
function callGasApi(functionName, ...args) {
    return new Promise((resolve, reject) => {
        try {
            // GAS環境では google.script.run を使用
            if (typeof google !== 'undefined' && google.script && google.script.run) {
                google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    [functionName](...args);
            } else {
                // 開発環境用のモック
                console.warn(`Mock API call: ${functionName}`, args);
                reject(new Error('GAS API not available in development mode'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

// ページ読み込み時に初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
}
