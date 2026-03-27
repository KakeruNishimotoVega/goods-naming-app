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
                
                // 権限に基づいてタブを制御
                applyRoleBasedTabRestrictions();
                
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
 * ユーザーのロールに基づいてタブの表示制御を適用
 */
function applyRoleBasedTabRestrictions() {
    console.log('[applyRoleBasedTabRestrictions] 権限チェック中...');
    
    google.script.run
        .withSuccessHandler((role) => {
            console.log('[applyRoleBasedTabRestrictions] ユーザーロール:', role);
            
            if (role === 'user') {
                // 一般ユーザーの場合、設定とNGワードタブを無効化
                const settingsTab = document.querySelector('.nav-link[data-screen="settings-screen"]');
                const ngwordsTab = document.querySelector('.nav-link[data-screen="ngwords-screen"]');
                
                if (settingsTab) {
                    settingsTab.classList.add('disabled');
                    console.log('[applyRoleBasedTabRestrictions] 設定タブを無効化しました');
                }
                
                if (ngwordsTab) {
                    ngwordsTab.classList.add('disabled');
                    console.log('[applyRoleBasedTabRestrictions] NGワードタブを無効化しました');
                }
            }
        })
        .withFailureHandler((error) => {
            console.error('[applyRoleBasedTabRestrictions] 権限チェックエラー:', error);
        })
        .getUserRole();
}

/**
 * 画面切り替えのセットアップ
 */
function setupScreenNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // 無効化されているタブはクリック不可
            if (link.classList.contains('disabled')) {
                console.log('[setupScreenNavigation] 無効化されたタブがクリックされました');
                return;
            }

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

    // ナビゲーションの表示制御（ログイン・サインアップ画面では非表示）
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (screenId === 'login-screen' || screenId === 'signup-screen') {
            navbar.style.display = 'none';
        } else {
            navbar.style.display = 'flex';
        }
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
 * アプリケーション全体の状態をリセット（ログアウト時に呼び出し）
 */
function resetAppState() {
    console.log('[resetAppState] アプリケーション状態をリセット中...');
    
    // ====== 命名画面のリセット ======
    // グローバル変数をリセット
    if (typeof allCategories !== 'undefined') {
        window.allCategories = [];
    }
    if (typeof allParentCategories !== 'undefined') {
        window.allParentCategories = [];
    }
    if (typeof selectedParentId !== 'undefined') {
        window.selectedParentId = null;
    }
    if (typeof selectedCategoryId !== 'undefined') {
        window.selectedCategoryId = null;
    }
    if (typeof currentSchema !== 'undefined') {
        window.currentSchema = null;
    }
    if (typeof isNamingScreenInitialized !== 'undefined') {
        window.isNamingScreenInitialized = false;
    }
    
    // 命名画面のDOM状態をリセット
    const namingScreen = document.getElementById('naming-screen');
    if (namingScreen) {
        const parentCategoryList = document.getElementById('parent-category-list');
        const categoryToggleSection = document.getElementById('category-toggle-section');
        const dynamicForm = document.getElementById('dynamic-form');
        const resultContainer = document.getElementById('naming-result');
        
        if (parentCategoryList) parentCategoryList.innerHTML = '';
        if (categoryToggleSection) categoryToggleSection.style.display = 'none';
        if (dynamicForm) dynamicForm.innerHTML = '';
        if (resultContainer) resultContainer.style.display = 'none';
    }
    
    // ====== 設定画面のリセット ======
    // グローバル変数をリセット
    if (typeof settingsAllCategories !== 'undefined') {
        window.settingsAllCategories = [];
    }
    if (typeof settingsAllParentCategories !== 'undefined') {
        window.settingsAllParentCategories = [];
    }
    if (typeof settingsSelectedParentId !== 'undefined') {
        window.settingsSelectedParentId = null;
    }
    if (typeof settingsSelectedCategoryId !== 'undefined') {
        window.settingsSelectedCategoryId = null;
    }
    if (typeof isSettingsScreenInitialized !== 'undefined') {
        window.isSettingsScreenInitialized = false;
    }
    
    // 設定画面のDOM状態をリセット
    const settingsScreen = document.getElementById('settings-screen');
    if (settingsScreen) {
        const containerList = document.querySelectorAll('#settings-screen [id$="-list"]');
        containerList.forEach(container => container.innerHTML = '');
    }
    
    // ====== NGワード画面のリセット ======
    if (typeof isNgWordsScreenInitialized !== 'undefined') {
        window.isNgWordsScreenInitialized = false;
    }
    
    const ngwordsScreen = document.getElementById('ngwords-screen');
    if (ngwordsScreen) {
        const ngwordsList = document.getElementById('ngwords-list');
        const ngwordsTbody = document.getElementById('ngwords-tbody');
        
        if (ngwordsList) ngwordsList.innerHTML = '';
        if (ngwordsTbody) ngwordsTbody.innerHTML = '';
    }
    
    // ====== フォーム入力値のクリア ======
    // 全てのinput, textarea, selectをリセット
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
        form.reset();
    });
    
    // ====== ナビゲーション状態をリセット ======
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        link.classList.remove('disabled');
    });
    
    // 命名タブをアクティブにする
    const namingLink = document.querySelector('.nav-link[data-screen="naming-screen"]');
    if (namingLink) {
        namingLink.classList.add('active');
    }
    
    console.log('[resetAppState] アプリケーション状態のリセットが完了しました');
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
