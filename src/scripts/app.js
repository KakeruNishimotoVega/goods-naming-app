// src/scripts/app.js
// アプリケーションのコアロジック

/**
 * アプリケーションの初期化
 */
function initApp() {
    console.log('Initializing LOWYA Naming App...');

    // 画面切り替えの設定
    setupScreenNavigation();

    // ログイン状態を確認してから画面を表示
    checkLoginAndShowInitialScreen();

    console.log('App initialized successfully');
}

/**
 * ログイン状態を確認して初期画面を表示
 */
function checkLoginAndShowInitialScreen() {
    console.log('[checkLoginAndShowInitialScreen] ログイン状態を確認中...');
    
    google.script.run
        .withSuccessHandler((currentUser) => {
            console.log('[checkLoginAndShowInitialScreen] サーバーからの応答:', currentUser);
            
            if (currentUser) {
                // ログイン済み：ユーザー情報を表示して命名画面へ
                console.log('[checkLoginAndShowInitialScreen] ログイン済み - 命名画面へ');
                updateUserDisplay();
                showScreen('naming-screen');
                initNamingScreen();
            } else {
                // 未ログイン：ログイン画面へ
                console.log('[checkLoginAndShowInitialScreen] 未ログイン - ログイン画面へ');
                showScreen('login-screen');
                // ログイン画面の初期化（イベントリスナー設定）
                if (typeof initLoginScreen === 'function') {
                    initLoginScreen();
                }
            }
        })
        .withFailureHandler((error) => {
            console.error('[checkLoginAndShowInitialScreen] ログイン状態確認エラー:', error);
            // エラー時はログイン画面へ
            showScreen('login-screen');
            if (typeof initLoginScreen === 'function') {
                initLoginScreen();
            }
        })
        .getCurrentUser();
}

/**
 * 画面切り替えのセットアップ
 */
function setupScreenNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // アクティブ状態を更新
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 画面を切り替え
            const screenId = link.getAttribute('data-screen');
            if (screenId) {
                showScreen(screenId);

                // 命名画面から離れるとき、生成結果をリセット
                if (screenId !== 'naming-screen') {
                    const resultContainer = document.getElementById('naming-result');
                    if (resultContainer) {
                        hideElement(resultContainer);
                    }
                }
            }
        });
    });
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

    // 画面に応じた初期化処理を実行
    if (screenId === 'login-screen' && typeof initLoginScreen === 'function') {
        initLoginScreen();
    } else if (screenId === 'signup-screen' && typeof initSignupScreen === 'function') {
        initSignupScreen();
    } else if (screenId === 'naming-screen' && typeof initNamingScreen === 'function') {
        initNamingScreen();
    } else if (screenId === 'settings-screen' && typeof initSettingsScreen === 'function') {
        initSettingsScreen();
    } else if (screenId === 'ngwords-screen' && typeof initNgWordsScreen === 'function') {
        initNgWordsScreen();
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

/**
 * グローバルデバッグ関数: 現在のユーザー情報を確認
 */
window.debugGetCurrentUser = function() {
    google.script.run
        .withSuccessHandler((currentUser) => {
            console.log('=== デバッグ: 現在のユーザー情報 ===');
            console.log(currentUser);
            if (currentUser) {
                console.log('userId:', currentUser.userId);
                console.log('email:', currentUser.email);
                console.log('userName:', currentUser.userName);
                console.log('role:', currentUser.role);
                console.log('role type:', typeof currentUser.role);
                console.log('role === "admin":', currentUser.role === 'admin');
            } else {
                console.log('未ログイン');
            }
        })
        .withFailureHandler((error) => {
            console.error('デバッグエラー:', error);
        })
        .getCurrentUser();
};

/**
 * グローバルデバッグ関数: 権限チェック
 */
window.debugCheckRole = function(role) {
    google.script.run
        .withSuccessHandler((hasPermission) => {
            console.log(`=== デバッグ: 権限チェック (role=${role}) ===`);
            console.log('結果:', hasPermission);
        })
        .withFailureHandler((error) => {
            console.error('デバッグエラー:', error);
        })
        .hasRole(role);
};

/**
 * グローバルデバッグ関数: データベースからユーザー情報を取得
 */
window.debugGetUserByEmail = function(email) {
    google.script.run
        .withSuccessHandler((user) => {
            console.log('=== デバッグ: データベースのユーザー情報 ===');
            console.log(user);
            if (user) {
                console.log('id:', user.id);
                console.log('email:', user.email);
                console.log('user_name:', user.user_name);
                console.log('role:', user.role);
                console.log('role type:', typeof user.role);
                console.log('created_at:', user.created_at);
            } else {
                console.log('ユーザーが見つかりません');
            }
        })
        .withFailureHandler((error) => {
            console.error('デバッグエラー:', error);
        })
        .getUserByEmail(email);
};

// ページ読み込み時に初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initApp);
}
