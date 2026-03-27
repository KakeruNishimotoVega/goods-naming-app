// src/scripts/management.js
// ユーザー管理画面のロジック

// 初期化フラグ
let isManagementScreenInitialized = false;

/**
 * ユーザー管理画面の初期化
 */
function initManagementScreen() {
    console.log('Initializing management screen...');

    // 二重初期化を防ぐ
    if (isManagementScreenInitialized) {
        console.log('Management screen already initialized, reloading data...');
        loadUsersList();
        return;
    }

    isManagementScreenInitialized = true;

    // 管理者権限チェック
    checkRole('admin', () => {
        // 権限あり：最新データを読み込む
        loadUsersList();

        // フォームのイベントリスナー設定（初回のみ）
        const changeRoleForm = document.getElementById('change-role-form');
        if (changeRoleForm && !changeRoleForm.dataset.listenerAdded) {
            changeRoleForm.addEventListener('submit', handleChangeRoleSubmit);
            changeRoleForm.dataset.listenerAdded = 'true';
        }

        const deleteUserForm = document.getElementById('delete-user-form');
        if (deleteUserForm && !deleteUserForm.dataset.listenerAdded) {
            deleteUserForm.addEventListener('submit', handleDeleteUserSubmit);
            deleteUserForm.dataset.listenerAdded = 'true';
        }
    }, () => {
        // 権限なし：命名画面へリダイレクト
        showErrorToast('この画面にアクセスする権限がありません（管理者のみ）');
        redirectToNamingScreen();
    });
}

/**
 * ユーザー一覧を読み込む
 */
async function loadUsersList() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    try {
        showLoading('users-tbody');

        const users = await callGasApi('listUsers');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">ユーザーが登録されていません</td></tr>';
            return;
        }

        renderUsersTable(users);
    } catch (error) {
        console.error('Failed to load users:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">ユーザーの読み込みに失敗しました</td></tr>';
    }
}

/**
 * ユーザー一覧テーブルを表示
 */
function renderUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    let html = '';

    users.forEach(user => {
        const roleDisplay = user.role === 'admin' ? '管理者' : '一般ユーザー';
        const roleColor = user.role === 'admin' ? '#ff6b35' : '#4a90e2';

        html += `
            <tr>
                <td>${escapeHtml(user.user_name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>
                    <span style="color: ${roleColor}; font-weight: bold;">
                        ${roleDisplay}
                    </span>
                </td>
                <td>
                    <button class="btn-change-role btn btn-secondary btn-sm" data-id="${user.id}" data-role="${user.role}" data-name="${escapeHtml(user.user_name)}">
                        権限変更
                    </button>
                    <button class="btn-delete-user btn btn-danger btn-sm" data-id="${user.id}" data-name="${escapeHtml(user.user_name)}" data-email="${escapeHtml(user.email)}">
                        削除
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // 権限変更ボタンのイベント
    document.querySelectorAll('.btn-change-role').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.id;
            const currentRole = this.dataset.role;
            const userName = this.dataset.name;
            openChangeRoleModal(userId, currentRole, userName);
        });
    });

    // 削除ボタンのイベント
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.id;
            const userName = this.dataset.name;
            const email = this.dataset.email;
            openDeleteUserModal(userId, userName, email);
        });
    });
}

/**
 * 権限変更モーダルを開く
 */
function openChangeRoleModal(userId, currentRole, userName) {
    console.log(`[openChangeRoleModal] userId=${userId}, currentRole=${currentRole}, userName=${userName}`);

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const newRoleDisplay = newRole === 'admin' ? '管理者' : '一般ユーザー';

    const message = document.getElementById('change-role-message');
    message.textContent = `${userName} さんの権限を「${newRoleDisplay}」に変更します。本当にいいですか？`;

    document.getElementById('change-role-user-id').value = userId;
    document.getElementById('change-role-new-role').value = newRole;

    openModal('change-role-modal');
}

/**
 * ユーザー削除確認モーダルを開く
 */
function openDeleteUserModal(userId, userName, email) {
    console.log(`[openDeleteUserModal] userId=${userId}, userName=${userName}, email=${email}`);

    const message = document.getElementById('delete-user-message');
    message.textContent = `ユーザー「${userName}」(${email}) を削除します。この操作は取り消せません。`;

    document.getElementById('delete-user-id').value = userId;

    openModal('delete-user-modal');
}

/**
 * 権限変更フォーム送信ハンドラ
 */
function handleChangeRoleSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('change-role-user-id').value;
    const newRole = document.getElementById('change-role-new-role').value;

    console.log(`[handleChangeRoleSubmit] userId=${userId}, newRole=${newRole}`);

    closeModal('change-role-modal');
    showLoading('users-tbody');

    // バックエンドAPIを呼び出し
    google.script.run
        .withSuccessHandler((result) => {
            console.log('[handleChangeRoleSubmit] 権限変更成功:', result);
            showSuccessToast('権限を変更しました');
            loadUsersList(); // テーブルを再読み込み
        })
        .withFailureHandler((error) => {
            console.error('[handleChangeRoleSubmit] 権限変更エラー:', error);
            showErrorToast('権限の変更に失敗しました: ' + error.message);
            loadUsersList(); // テーブルを再読み込み（フルサイズのロード）
        })
        .updateUserRole(userId, newRole);
}

/**
 * ユーザー削除フォーム送信ハンドラ
 */
function handleDeleteUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('delete-user-id').value;

    console.log(`[handleDeleteUserSubmit] userId=${userId}`);

    closeModal('delete-user-modal');
    showLoading('users-tbody');

    // バックエンドAPIを呼び出し
    google.script.run
        .withSuccessHandler(() => {
            console.log('[handleDeleteUserSubmit] ユーザー削除成功');
            showSuccessToast('ユーザーを削除しました');
            loadUsersList(); // テーブルを再読み込み
        })
        .withFailureHandler((error) => {
            console.error('[handleDeleteUserSubmit] ユーザー削除エラー:', error);
            showErrorToast('ユーザーの削除に失敗しました: ' + error.message);
            loadUsersList(); // テーブルを再読み込み
        })
        .deleteUser(userId);
}
