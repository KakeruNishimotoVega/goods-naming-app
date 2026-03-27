// src/scripts/auth.js
// 認証関連の処理（メールアドレス+パスワード方式）

// 初期化フラグ（二重初期化を防ぐ）
let isLoginScreenInitialized = false;
let isSignupScreenInitialized = false;

/**
 * ログイン画面の初期化
 */
function initLoginScreen() {
    // 二重初期化を防ぐ
    if (isLoginScreenInitialized) {
        console.log('Login screen already initialized, skipping...');
        return;
    }
    
    console.log('Initializing login screen...');
    isLoginScreenInitialized = true;

    // ログインフォーム
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // サインアップへのリンク
    const goToSignup = document.getElementById('go-to-signup');
    if (goToSignup) {
        goToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            showScreen('signup-screen');
        });
    }
    
    // ホーム（命名画面）に戻るボタン
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showScreen('naming-screen');
            // ナビゲーションリンクのアクティブ状態を更新
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => link.classList.remove('active'));
            const namingLink = document.querySelector('[data-screen="naming-screen"]');
            if (namingLink) {
                namingLink.classList.add('active');
            }
        });
    }
}

/**
 * サインアップ画面の初期化
 */
function initSignupScreen() {
    // 二重初期化を防ぐ
    if (isSignupScreenInitialized) {
        console.log('Signup screen already initialized, skipping...');
        return;
    }
    
    console.log('Initializing signup screen...');
    isSignupScreenInitialized = true;

    // サインアップフォーム
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // ログインへのリンク
    const goToLogin = document.getElementById('go-to-login');
    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showScreen('login-screen');
        });
    }
}

/**
 * セッション確認と自動リダイレクト
 */
function checkSessionAndRedirect() {
    showLoginLoading(true);
    
    google.script.run
        .withSuccessHandler((currentUser) => {
            showLoginLoading(false);
            
            if (currentUser) {
                // 既にログイン済み → ホーム画面へ
                console.log('既にログイン済み:', currentUser);
                redirectToHome();
            }
        })
        .withFailureHandler((error) => {
            showLoginLoading(false);
            console.log('セッション確認エラー（未ログイン）:', error);
            // エラーは無視（未ログイン状態）
        })
        .getCurrentUser();
}

/**
 * ログインフォームの送信ハンドラ
 */
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // バリデーション
    if (!email || !password) {
        showLoginError('メールアドレスとパスワードを入力してください');
        return;
    }
    
    if (!validateEmail(email)) {
        showLoginError('有効なメールアドレスを入力してください');
        return;
    }
    
    showLoginLoading(true);
    hideLoginError();
    
    // バックエンドAPIを呼び出し
    google.script.run
        .withSuccessHandler((result) => {
            showLoginLoading(false);
            
            if (result.error) {
                showLoginError(result.error);
                return;
            }
            
            // ログイン成功 → アプリ状態をリセットしてホーム画面へ
            console.log('[handleLogin] ログイン成功:', result);
            
            // 全ての画面初期化フラグをリセット
            if (typeof resetScreenInitializationFlags === 'function') {
                resetScreenInitializationFlags();
            }
            
            // DOM を完全リセット（前ユーザーのデータを削除）
            if (typeof resetDOMState === 'function') {
                resetDOMState();
            }
            
            // アプリ状態をリセット
            if (typeof resetAppState === 'function') {
                resetAppState();
            }
            
            console.log('[handleLogin] redirectToHome を呼び出します');
            redirectToHome();
        })
        .withFailureHandler((error) => {
            showLoginLoading(false);
            showLoginError('ログイン処理中にエラーが発生しました: ' + error.message);
        })
        .loginWithPassword(email, password);
}

/**
 * サインアップフォームの送信ハンドラ
 */
function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value.trim();
    const userName = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    
    // バリデーション
    if (!email || !userName || !password || !passwordConfirm) {
        showSignupError('すべての項目を入力してください');
        return;
    }
    
    if (!validateEmail(email)) {
        showSignupError('有効なメールアドレスを入力してください');
        return;
    }
    
    if (password.length < 8) {
        showSignupError('パスワードは8文字以上で入力してください');
        return;
    }
    
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        showSignupError('パスワードは英字と数字の両方を含む必要があります');
        return;
    }
    
    if (password !== passwordConfirm) {
        showSignupError('パスワードが一致しません');
        return;
    }
    
    showSignupLoading(true);
    hideSignupError();
    
    // バックエンドAPIを呼び出し
    google.script.run
        .withSuccessHandler((result) => {
            showSignupLoading(false);
            
            if (result.error) {
                showSignupError(result.error);
                return;
            }
            
            // サインアップ成功 → 自動ログイン
            console.log('サインアップ成功:', result);
            
            // 自動ログイン
            google.script.run
                .withSuccessHandler((loginResult) => {
                    if (loginResult.error) {
                        // 自動ログイン失敗 → ログイン画面へ
                        showScreen('login-screen');
                        showLoginError('登録は完了しました。ログインしてください。');
                    } else {
                        // 自動ログイン成功 → アプリ状態をリセットしてホーム画面へ
                        resetAppState();
                        redirectToHome();
                    }
                })
                .withFailureHandler(() => {
                    // 自動ログイン失敗 → ログイン画面へ
                    showScreen('login-screen');
                    showLoginError('登録は完了しました。ログインしてください。');
                })
                .loginWithPassword(email, password);
        })
        .withFailureHandler((error) => {
            showSignupLoading(false);
            showSignupError('登録処理中にエラーが発生しました: ' + error.message);
        })
        .registerUser(email, password, userName);
}

/**
 * ホーム画面（命名画面）へリダイレクト
 * セッションストレージに保存された遷移先があれば、権限を確認して遷移
 */
function redirectToHome() {
    console.log('[redirectToHome] リダイレクト処理を開始');
    
    // セッションストレージから遷移先を取得
    const pendingRedirect = sessionStorage.getItem('pendingRedirect');
    
    if (pendingRedirect) {
        console.log('[redirectToHome] 保存された遷移先:', pendingRedirect);
        
        // 管理系画面への遷移は権限チェックが必要
        const adminScreens = ['settings-screen', 'ngwords-screen', 'management-screen'];
        
        if (adminScreens.includes(pendingRedirect)) {
            // 権限を確認
            google.script.run
                .withSuccessHandler((role) => {
                    sessionStorage.removeItem('pendingRedirect');
                    
                    if (role === 'admin') {
                        // admin権限があれば目的の画面へ
                        console.log('[redirectToHome] admin権限あり - 目的の画面へ遷移:', pendingRedirect);
                        showScreen(pendingRedirect);
                        updateActiveNavLink(pendingRedirect);
                    } else {
                        // 権限がなければ命名画面へ
                        console.log('[redirectToHome] 権限不足 - 命名画面へ遷移');
                        showScreen('naming-screen');
                        updateActiveNavLink('naming-screen');
                        alert('この機能を使用するには管理者権限が必要です。');
                    }
                })
                .withFailureHandler((error) => {
                    console.error('[redirectToHome] 権限チェックエラー:', error);
                    sessionStorage.removeItem('pendingRedirect');
                    showScreen('naming-screen');
                    updateActiveNavLink('naming-screen');
                })
                .getUserRole();
        } else {
            // 命名画面などへは権限チェック不要で遷移
            sessionStorage.removeItem('pendingRedirect');
            showScreen(pendingRedirect);
            updateActiveNavLink(pendingRedirect);
        }
    } else {
        // 遷移先がない場合は命名画面へ
        console.log('[redirectToHome] 遷移先なし - 命名画面へ');
        console.log('[redirectToHome] showScreen を呼び出します');
        showScreen('naming-screen');
        updateActiveNavLink('naming-screen');
    }
    
    // ユーザー情報表示を更新
    updateUserDisplay();
    
    // タブの権限制御を更新
    if (typeof applyRoleBasedTabRestrictions === 'function') {
        applyRoleBasedTabRestrictions();
    }
}

/**
 * ナビゲーションリンクのアクティブ状態を更新
 */
function updateActiveNavLink(screenId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetLink = document.querySelector(`[data-screen="${screenId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

/**
 * ログインローディング表示の切り替え
 */
function showLoginLoading(show) {
    const loadingElement = document.getElementById('login-loading');
    const loginBtn = document.getElementById('login-btn');
    
    if (show) {
        showElement(loadingElement);
        if (loginBtn) loginBtn.disabled = true;
    } else {
        hideElement(loadingElement);
        if (loginBtn) loginBtn.disabled = false;
    }
}

/**
 * サインアップローディング表示の切り替え
 */
function showSignupLoading(show) {
    const loadingElement = document.getElementById('signup-loading');
    const signupBtn = document.getElementById('signup-btn');
    
    if (show) {
        showElement(loadingElement);
        if (signupBtn) signupBtn.disabled = true;
    } else {
        hideElement(loadingElement);
        if (signupBtn) signupBtn.disabled = false;
    }
}

/**
 * ログインエラーメッセージを表示
 */
function showLoginError(message) {
    const errorElement = document.getElementById('login-error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * ログインエラーメッセージを非表示
 */
function hideLoginError() {
    const errorElement = document.getElementById('login-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * サインアップエラーメッセージを表示
 */
function showSignupError(message) {
    const errorElement = document.getElementById('signup-error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * サインアップエラーメッセージを非表示
 */
function hideSignupError() {
    const errorElement = document.getElementById('signup-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * メールアドレスのバリデーション
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * ログアウト処理
 */
function handleLogout() {
    if (!confirm('ログアウトしますか？')) {
        return;
    }
    
    google.script.run
        .withSuccessHandler(() => {
            console.log('ログアウト成功');
            
            // アプリケーション全体の状態をリセット
            if (typeof resetAppState === 'function') {
                resetAppState();
            }
            
            // 命名画面へ遷移（ログイン不要なので）
            showScreen('naming-screen');
            
            // ナビゲーションリンクのアクティブ状態を更新
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => link.classList.remove('active'));
            const namingLink = document.querySelector('[data-screen="naming-screen"]');
            if (namingLink) {
                namingLink.classList.add('active');
            }
            
            // ゲスト表示とタブに鍵アイコンを表示（未ログイン状態）
            if (typeof updateGuestDisplay === 'function') {
                updateGuestDisplay();
            }
            if (typeof applyGuestTabRestrictions === 'function') {
                applyGuestTabRestrictions();
            }
            
            // フォームをクリア
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.reset();
            }
            
            hideLoginError();
        })
        .withFailureHandler((error) => {
            alert('ログアウトエラー: ' + error.message);
        })
        .logout();
}

/**
 * ユーザー表示を更新（ヘッダーに名前とログアウトボタンを表示）
 */
function updateUserDisplay() {
    console.log('[updateUserDisplay] ユーザー情報を取得中...');
    
    google.script.run
        .withSuccessHandler((currentUser) => {
            console.log('[updateUserDisplay] サーバーからの応答:', currentUser);
            
            if (!currentUser) {
                console.log('[updateUserDisplay] ユーザー情報がありません - ゲスト表示を設定');
                // 未ログイン時はゲスト表示
                if (typeof updateGuestDisplay === 'function') {
                    updateGuestDisplay();
                }
                return;
            }
            
            // ユーザー情報エリアを更新（サイドメニュー下部）
            const userDisplayArea = document.getElementById('user-display-area');
            if (userDisplayArea) {
                userDisplayArea.innerHTML = `
                    <span class="user-name">${escapeHtml(currentUser.userName)}</span>
                    <button id="logout-btn" class="btn secondary btn-sm">ログアウト</button>
                `;
                
                // ログアウトボタンにイベントリスナーを設定
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', handleLogout);
                }
            }
            
            // ナビゲーションメニューの権限制御
            console.log(`[updateUserDisplay] ナビゲーション更新: role=${currentUser.role}`);
            updateNavigationByRole(currentUser.role);
        })
        .withFailureHandler((error) => {
            console.error('[updateUserDisplay] ユーザー情報取得エラー:', error);
        })
        .getCurrentUser();
}

/**
 * ロールに基づいてナビゲーションメニューを制御
 */
function updateNavigationByRole(role) {
    // admin機能タブの制御（ルール設定、NGワード、ユーザー管理）
    const settingsLink = document.querySelector('[data-screen="settings-screen"]');
    const ngwordsLink = document.querySelector('[data-screen="ngwords-screen"]');
    const managementLink = document.querySelector('[data-screen="management-screen"]');
    
    if (role === 'user') {
        // user権限: admin機能タブを無効化（disabled クラスを追加）
        if (settingsLink) {
            settingsLink.classList.add('disabled');
            settingsLink.style.display = null; // インラインスタイルをクリア
        }
        if (ngwordsLink) {
            ngwordsLink.classList.add('disabled');
            ngwordsLink.style.display = null; // インラインスタイルをクリア
        }
        if (managementLink) {
            managementLink.classList.add('disabled');
            managementLink.style.display = null; // インラインスタイルをクリア
        }
    } else {
        // admin権限: すべてのリンクを有効化
        if (settingsLink) {
            settingsLink.classList.remove('disabled');
            settingsLink.style.display = null; // インラインスタイルをクリア
        }
        if (ngwordsLink) {
            ngwordsLink.classList.remove('disabled');
            ngwordsLink.style.display = null; // インラインスタイルをクリア
        }
        if (managementLink) {
            managementLink.classList.remove('disabled');
            managementLink.style.display = null; // インラインスタイルをクリア
        }
    }
}

// 注意: initLoginScreen()は自動的に呼ばれません
// app.jsのcheckLoginAndShowInitialScreen()で必要に応じて画面が表示されます
