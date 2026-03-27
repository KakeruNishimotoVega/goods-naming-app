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
            console.log('ログイン成功:', result);
            resetAppState();
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
 */
function redirectToHome() {
    // showScreen()を使って画面を切り替え（初期化も含む）
    showScreen('naming-screen');
    
    // ナビゲーションリンクを更新
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const namingLink = document.querySelector('[data-screen="naming-screen"]');
    if (namingLink) {
        namingLink.classList.add('active');
    }
    
    // ユーザー情報表示を更新
    updateUserDisplay();
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
            
            // ログイン画面へ遷移
            showScreen('login-screen');
            
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
                console.log('[updateUserDisplay] ユーザー情報がありません');
                return;
            }
            
            // ヘッダーのユーザー情報エリアを更新
            const userDisplayArea = document.getElementById('user-display-area');
            if (userDisplayArea) {
                userDisplayArea.innerHTML = `
                    <span class="user-name">${currentUser.userName}</span>
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
    // settings と ngwords のリンクは admin のみ表示
    const settingsLink = document.querySelector('[data-screen="settings-screen"]');
    const ngwordsLink = document.querySelector('[data-screen="ngwords-screen"]');
    
    if (role === 'admin') {
        // admin: すべて表示
        if (settingsLink) settingsLink.style.display = 'inline-block';
        if (ngwordsLink) ngwordsLink.style.display = 'inline-block';
    } else {
        // user: 設定系を非表示
        if (settingsLink) settingsLink.style.display = 'none';
        if (ngwordsLink) ngwordsLink.style.display = 'none';
    }
}

// 注意: initLoginScreen()は自動的に呼ばれません
// app.jsのcheckLoginAndShowInitialScreen()で必要に応じて画面が表示されます
