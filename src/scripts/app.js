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
 * 命名画面は誰でもアクセス可能なので、常に命名画面を表示
 */
function checkLoginAndShowInitialScreen() {
    console.log('[checkLoginAndShowInitialScreen] アプリを初期化中...');
    
    // サイドメニューを表示
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.style.display = 'flex';
        console.log('[checkLoginAndShowInitialScreen] サイドメニューを表示しました');
    }
    
    // まず命名画面を表示（ログイン不要）
    showScreen('naming-screen');
    
    // ログイン状態を確認してタブの制御を行う（バックグラウンドで実行）
    google.script.run
        .withSuccessHandler((currentUser) => {
            console.log('[checkLoginAndShowInitialScreen] サーバーからの応答:', currentUser);
            
            if (currentUser) {
                // ログイン済み：ユーザー情報を表示
                console.log('[checkLoginAndShowInitialScreen] ログイン済み - ユーザー情報を表示');
                
                updateUserDisplay();
                
                // 権限に基づいてタブを制御
                applyRoleBasedTabRestrictions();
            } else {
                // 未ログイン：ゲスト表示とタブに鍵アイコンを表示
                console.log('[checkLoginAndShowInitialScreen] 未ログイン - ゲスト表示とタブに鍵アイコンを表示');
                updateGuestDisplay();
                applyGuestTabRestrictions();
            }
        })
        .withFailureHandler((error) => {
            console.error('[checkLoginAndShowInitialScreen] ログイン状態確認エラー:', error);
            // エラー時も未ログイン扱いでゲスト表示とタブを制御
            updateGuestDisplay();
            applyGuestTabRestrictions();
        })
        .getCurrentUser();
}

/**
 * ユーザーのロールに基づいてタブの表示制御を適用
 * 未ログイン時も管理系タブに鍵アイコンを表示
 */
function applyRoleBasedTabRestrictions() {
    console.log('[applyRoleBasedTabRestrictions] 権限チェック中...');
    
    const settingsTab = document.querySelector('.nav-link[data-screen="settings-screen"]');
    const ngwordsTab = document.querySelector('.nav-link[data-screen="ngwords-screen"]');
    const managementTab = document.querySelector('.nav-link[data-screen="management-screen"]');
    
    google.script.run
        .withSuccessHandler((role) => {
            console.log('[applyRoleBasedTabRestrictions] ユーザーロール:', role);
            
            // まず全てのタブから locked と disabled クラスを削除
            if (settingsTab) {
                settingsTab.classList.remove('locked', 'disabled');
            }
            if (ngwordsTab) {
                ngwordsTab.classList.remove('locked', 'disabled');
            }
            if (managementTab) {
                managementTab.classList.remove('locked', 'disabled');
            }
            
            if (role === 'user') {
                // 一般ユーザーの場合、設定、NGワード、ユーザー管理タブを無効化（鍵アイコン付き）
                if (settingsTab) {
                    settingsTab.classList.add('locked');
                    console.log('[applyRoleBasedTabRestrictions] ルール設定タブを無効化しました（user権限）');
                }
                
                if (ngwordsTab) {
                    ngwordsTab.classList.add('locked');
                    console.log('[applyRoleBasedTabRestrictions] NGワードタブを無効化しました（user権限）');
                }
                
                if (managementTab) {
                    managementTab.classList.add('locked');
                    console.log('[applyRoleBasedTabRestrictions] ユーザー管理タブを無効化しました（user権限）');
                }
            } else if (role === 'admin') {
                // 管理者の場合、すべてのタブを有効化
                console.log('[applyRoleBasedTabRestrictions] すべてのタブを有効化しました（admin権限）');
            }
            
            console.log('[applyRoleBasedTabRestrictions] 権限制御が完了しました');
        })
        .withFailureHandler((error) => {
            console.error('[applyRoleBasedTabRestrictions] 権限チェックエラー（未ログイン扱い）:', error);
            
            // 未ログイン時は管理系タブに鍵アイコンを表示
            if (settingsTab) {
                settingsTab.classList.add('locked');
                console.log('[applyRoleBasedTabRestrictions] ルール設定タブに鍵アイコンを追加（未ログイン）');
            }
            if (ngwordsTab) {
                ngwordsTab.classList.add('locked');
                console.log('[applyRoleBasedTabRestrictions] NGワードタブに鍵アイコンを追加（未ログイン）');
            }
            if (managementTab) {
                managementTab.classList.add('locked');
                console.log('[applyRoleBasedTabRestrictions] ユーザー管理タブに鍵アイコンを追加（未ログイン）');
            }
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
 * ゲスト表示を更新（未ログイン時）
 */
function updateGuestDisplay() {
    console.log('[updateGuestDisplay] ゲスト表示を設定中...');
    
    const userDisplayArea = document.getElementById('user-display-area');
    if (userDisplayArea) {
        userDisplayArea.innerHTML = `
            <span class="user-name">ゲスト</span>
            <button id="guest-login-btn" class="btn primary btn-sm">ログイン</button>
        `;
        
        // ログインボタンにイベントリスナーを設定
        const loginBtn = document.getElementById('guest-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                showScreen('login-screen');
                if (typeof initLoginScreen === 'function') {
                    initLoginScreen();
                }
            });
        }
    }
}

/**
 * ゲスト状態でのタブ制御（管理系タブに鍵アイコンを表示）
 */
function applyGuestTabRestrictions() {
    console.log('[applyGuestTabRestrictions] ゲスト状態でのタブ制御中...');
    
    const settingsTab = document.querySelector('.nav-link[data-screen="settings-screen"]');
    const ngwordsTab = document.querySelector('.nav-link[data-screen="ngwords-screen"]');
    const managementTab = document.querySelector('.nav-link[data-screen="management-screen"]');
    
    // まず全てのタブから locked と disabled クラスを削除
    if (settingsTab) {
        settingsTab.classList.remove('locked', 'disabled');
        settingsTab.classList.add('locked');
        console.log('[applyGuestTabRestrictions] ルール設定タブに鍵アイコンを追加');
    }
    if (ngwordsTab) {
        ngwordsTab.classList.remove('locked', 'disabled');
        ngwordsTab.classList.add('locked');
        console.log('[applyGuestTabRestrictions] NGワードタブに鍵アイコンを追加');
    }
    if (managementTab) {
        managementTab.classList.remove('locked', 'disabled');
        managementTab.classList.add('locked');
        console.log('[applyGuestTabRestrictions] ユーザー管理タブに鍵アイコンを追加');
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

            // 無効化されているタブ（locked または disabled）はクリック時に処理を実行
            if (link.classList.contains('locked') || link.classList.contains('disabled')) {
                const screenId = link.getAttribute('data-screen');
                console.log('[setupScreenNavigation] 制限されたタブがクリックされました:', screenId);
                
                // 管理系画面へのアクセス試行
                if (isAdminScreen(screenId)) {
                    handleAdminScreenAccess(screenId);
                }
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
 * 管理系画面かどうかを判定
 */
function isAdminScreen(screenId) {
    const adminScreens = ['settings-screen', 'ngwords-screen', 'management-screen'];
    return adminScreens.includes(screenId);
}

/**
 * 管理系画面へのアクセス試行時の処理
 */
function handleAdminScreenAccess(screenId) {
    console.log('[handleAdminScreenAccess] 管理系画面へのアクセスを試行:', screenId);
    
    // ログイン状態を確認
    google.script.run
        .withSuccessHandler((currentUser) => {
            if (!currentUser) {
                // 未ログイン（ゲスト） → 「ログインが必要です。」と表示するだけ
                console.log('[handleAdminScreenAccess] ゲスト状態 - ログインが必要です');
                alert('ログインが必要です。');
            } else {
                // ログイン済みだが権限不足 → エラーメッセージを表示
                console.log('[handleAdminScreenAccess] 権限不足 - アクセス拒否');
                alert('この機能を使用するには管理者権限が必要です。');
            }
        })
        .withFailureHandler((error) => {
            console.error('[handleAdminScreenAccess] ログイン状態確認エラー:', error);
            // エラー時も未ログイン扱い
            alert('ログインが必要です。');
        })
        .getCurrentUser();
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
    console.log('[showScreen] screenId:', screenId);
    console.log('[showScreen] typeof initNamingScreen:', typeof initNamingScreen);
    
    if (screenId === 'login-screen' && typeof initLoginScreen === 'function') {
        initLoginScreen();
    } else if (screenId === 'signup-screen' && typeof initSignupScreen === 'function') {
        initSignupScreen();
    } else if (screenId === 'naming-screen' && typeof initNamingScreen === 'function') {
        console.log('[showScreen] 命名画面の初期化を呼び出します');
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
    
    // グローバル変数を直接リセット
    if (typeof isLoginScreenInitialized !== 'undefined') {
        isLoginScreenInitialized = false;
    }
    if (typeof isSignupScreenInitialized !== 'undefined') {
        isSignupScreenInitialized = false;
    }
    if (typeof isNamingScreenInitialized !== 'undefined') {
        isNamingScreenInitialized = false;
    }
    if (typeof isSettingsScreenInitialized !== 'undefined') {
        isSettingsScreenInitialized = false;
    }
    if (typeof isNgWordsScreenInitialized !== 'undefined') {
        isNgWordsScreenInitialized = false;
    }
    if (typeof isManagementScreenInitialized !== 'undefined') {
        isManagementScreenInitialized = false;
    }
    
    console.log('[resetScreenInitializationFlags] フラグのリセットが完了しました');
    console.log('[resetScreenInitializationFlags] isNamingScreenInitialized:', typeof isNamingScreenInitialized !== 'undefined' ? isNamingScreenInitialized : 'undefined');
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
