// src/scripts/app.js
// アプリケーションのコアロジック

/**
 * アプリケーションの初期化
 */
function initApp() {
    console.log('Initializing LOWYA Naming App...');

    // ページを離れるときにセッションをクリア（前のログイン状態を保持しない）
    window.addEventListener('beforeunload', () => {
        console.log('[beforeunload] セッションをクリア中...');
        google.script.run.logout();
    });

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
                
                // 全ての画面初期化フラグをリセット（ユーザー切り替え時のキャッシュ防止）
                resetScreenInitializationFlags();
                
                // DOM を完全リセット（前ユーザーのデータを削除）
                resetDOMState();
                
                // 【重要】サイドメニューを先に表示
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.style.display = 'flex';
                    console.log('[checkLoginAndShowInitialScreen] サイドメニューを表示しました');
                }
                
                updateUserDisplay();
                
                // 権限に基づいてタブを制御
                applyRoleBasedTabRestrictions();
                
                // showScreen() は initNamingScreen() を自動的に呼ぶので、重複呼び出しを避ける
                showScreen('naming-screen');
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
                // 一般ユーザーの場合、設定、NGワード、ユーザー管理タブを無効化（グレーアウト）
                const settingsTab = document.querySelector('.nav-link[data-screen="settings-screen"]');
                const ngwordsTab = document.querySelector('.nav-link[data-screen="ngwords-screen"]');
                const managementTab = document.querySelector('.nav-link[data-screen="management-screen"]');
                
                if (settingsTab) {
                    settingsTab.classList.add('disabled');
                    console.log('[applyRoleBasedTabRestrictions] ルール設定タブを無効化しました');
                }
                
                if (ngwordsTab) {
                    ngwordsTab.classList.add('disabled');
                    console.log('[applyRoleBasedTabRestrictions] NGワードタブを無効化しました');
                }
                
                if (managementTab) {
                    managementTab.classList.add('disabled');
                    console.log('[applyRoleBasedTabRestrictions] ユーザー管理タブを無効化しました');
                }
            }
            
            console.log('[applyRoleBasedTabRestrictions] 権限制御が完了しました');
        })
        .withFailureHandler((error) => {
            console.error('[applyRoleBasedTabRestrictions] 権限チェックエラー:', error);
        })
        .getUserRole();
}

/**
 * 権限確認完了後にサイドメニューを表示
 */
function showSidebarAfterAuthCheck() {
    console.log('[showSidebarAfterAuthCheck] サイドメニューを表示中...');
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'flex';
        console.log('[showSidebarAfterAuthCheck] サイドメニュー表示完了');
    }
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

    // サイドメニューの表示制御（ログイン・サインアップ画面では非表示）
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        if (screenId === 'login-screen' || screenId === 'signup-screen') {
            sidebar.style.display = 'none';
            console.log('[showScreen] ログイン画面のためサイドメニューを非表示にしました');
        } else {
            // ログイン後の画面では常にサイドメニューを表示
            sidebar.style.display = 'flex';
            console.log('[showScreen] サイドメニューを表示しました');
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
    } else if (screenId === 'management-screen' && typeof initManagementScreen === 'function') {
        initManagementScreen();
    }
}

/**
 * 全ての画面初期化フラグをリセット（ユーザー切り替え時に呼び出し）
 */
function resetScreenInitializationFlags() {
    console.log('[resetScreenInitializationFlags] 全初期化フラグをリセット中...');
    
    if (typeof isLoginScreenInitialized !== 'undefined') {
        window.isLoginScreenInitialized = false;
    }
    if (typeof isSignupScreenInitialized !== 'undefined') {
        window.isSignupScreenInitialized = false;
    }
    if (typeof isNamingScreenInitialized !== 'undefined') {
        window.isNamingScreenInitialized = false;
    }
    if (typeof isSettingsScreenInitialized !== 'undefined') {
        window.isSettingsScreenInitialized = false;
    }
    if (typeof isNgWordsScreenInitialized !== 'undefined') {
        window.isNgWordsScreenInitialized = false;
    }
    if (typeof isManagementScreenInitialized !== 'undefined') {
        window.isManagementScreenInitialized = false;
    }
    
    console.log('[resetScreenInitializationFlags] フラグのリセットが完了しました');
}

/**
 * DOM状態を完全リセット（前ユーザーのデータを削除）
 */
function resetDOMState() {
    console.log('[resetDOMState] DOM状態を完全リセット中...');
    
    // ====== 命名画面 ======
    const namingScreen = document.getElementById('naming-screen');
    if (namingScreen) {
        const parentCategoryList = document.getElementById('parent-category-list');
        const childCategoryCard = document.getElementById('child-category-card');
        const categoryToggleSection = document.getElementById('category-toggle-section');
        const categorySelectionPanel = document.getElementById('category-selection-panel');
        const dynamicForm = document.getElementById('dynamic-form');
        const resultContainer = document.getElementById('naming-result');
        
        if (parentCategoryList) parentCategoryList.innerHTML = '';
        if (childCategoryCard) childCategoryCard.style.display = 'none';
        if (categoryToggleSection) categoryToggleSection.style.display = 'none';
        if (categorySelectionPanel) categorySelectionPanel.style.display = 'block';
        if (dynamicForm) dynamicForm.innerHTML = '';
        if (resultContainer) resultContainer.style.display = 'none';
    }
    
    // ====== 設定画面 ======
    const settingsScreen = document.getElementById('settings-screen');
    if (settingsScreen) {
        const containerList = document.querySelectorAll('#settings-screen [id$="-list"]');
        containerList.forEach(container => container.innerHTML = '');
    }
    
    // ====== NGワード画面 ======
    const ngwordsScreen = document.getElementById('ngwords-screen');
    if (ngwordsScreen) {
        const ngwordsTbody = document.getElementById('ngwords-tbody');
        if (ngwordsTbody) ngwordsTbody.innerHTML = '';
    }
    
    // ====== ユーザー管理画面 ======
    const managementScreen = document.getElementById('management-screen');
    if (managementScreen) {
        const usersTbody = document.getElementById('users-tbody');
        if (usersTbody) usersTbody.innerHTML = '';
    }
    
    // ====== フォーム入力値のクリア ======
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
        form.reset();
    });
    
    console.log('[resetDOMState] DOM状態のリセットが完了しました');
}

/**
 * アプリケーション全体の状態をリセット（ログアウト時に呼び出し）
 */
function resetAppState() {
    console.log('[resetAppState] アプリケーション状態をリセット中...');
    
    // 全初期化フラグをリセット
    resetScreenInitializationFlags();
    
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
    
    // 設定画面のDOM状態をリセット
    const settingsScreen = document.getElementById('settings-screen');
    if (settingsScreen) {
        const containerList = document.querySelectorAll('#settings-screen [id$="-list"]');
        containerList.forEach(container => container.innerHTML = '');
    }
    
    // ====== NGワード画面のリセット ======
    const ngwordsScreen = document.getElementById('ngwords-screen');
    if (ngwordsScreen) {
        const ngwordsList = document.getElementById('ngwords-list');
        const ngwordsTbody = document.getElementById('ngwords-tbody');
        
        if (ngwordsList) ngwordsList.innerHTML = '';
        if (ngwordsTbody) ngwordsTbody.innerHTML = '';
    }
    
    // ====== ユーザー管理画面のリセット ======
    const managementScreen = document.getElementById('management-screen');
    if (managementScreen) {
        const usersTbody = document.getElementById('users-tbody');
        
        if (usersTbody) usersTbody.innerHTML = '';
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
