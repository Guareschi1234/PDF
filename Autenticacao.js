const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');
const profileScreen = document.getElementById('profile-screen');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authConfirmPassword = document.getElementById('auth-confirm-password');
const authConfirmField = document.getElementById('auth-confirm-field');
const authSubmit = document.getElementById('auth-submit');
const authTitle = document.getElementById('auth-title');
const authDescription = document.getElementById('auth-description');
const authMessage = document.getElementById('auth-message');
const authForgotButton = document.getElementById('auth-forgot-button');
const authModeButton = document.getElementById('auth-mode-button');
const authContinueButton = document.getElementById('auth-continue-button');
const authLoginButton = document.getElementById('auth-login-open');
const authUser = document.getElementById('auth-user');
const authUserName = document.getElementById('auth-user-name');
const authUserAvatar = document.getElementById('auth-user-avatar');
const authUserAvatarPlaceholder = document.getElementById('auth-user-avatar-placeholder');
const authLogout = document.getElementById('auth-logout');
const profileOpenButton = document.getElementById('profile-open');
const profileBackButton = document.getElementById('profile-back');
const profileForm = document.getElementById('profile-form');
const profileName = document.getElementById('profile-name');
const profileAvatarInput = document.getElementById('profile-avatar-input');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const profileAvatarPlaceholder = document.getElementById('profile-avatar-placeholder');
const profileSaveButton = document.getElementById('profile-save');
const profileHistory = document.getElementById('profile-history');
const profileHistoryEmpty = document.getElementById('profile-history-empty');
const profileChangePasswordButton = document.getElementById('profile-change-password');
const profileDeleteForm = document.getElementById('profile-delete-form');
const profileDeletePassword = document.getElementById('profile-delete-password');
const profileDeleteConfirmation = document.getElementById('profile-delete-confirmation');
const profileDeleteSubmit = document.getElementById('profile-delete-submit');
const profileMessage = document.getElementById('profile-message');
const authEmailField = authEmail.closest('label');
const authPasswordField = authPassword.closest('label');

const supabaseUrl = 'https://qrcktmubbqeqosylmplf.supabase.co';
const supabasePublishableKey = 'sb_publishable_5fW_4kfLyug6ozYTLWWpzw_haDZKV9L';
const recoveryRequested = /type=recovery|redefinir-senha/i.test(window.location.hash);

let supabaseClient = null;
let authMode = recoveryRequested ? 'update-password' : 'login';
let passwordRecovery = recoveryRequested;
let profileOpen = false;
let loginScreenOpen = false;
let activeUser = null;
let profileAvatarPath = null;
let avatarPreviewUrl = null;
let accountDeleted = false;
let headerProfileUserId = null;

function showAuthMessage(message, tone = 'info') {
    authMessage.textContent = message;
    authMessage.dataset.tone = tone;
}

function setAuthMode(mode) {
    authMode = mode;
    const needsPassword = mode === 'login' || mode === 'signup' || mode === 'update-password';
    const needsConfirmation = mode === 'signup' || mode === 'update-password';
    const isPasswordUpdate = mode === 'update-password';

    authEmailField.hidden = isPasswordUpdate;
    authEmail.required = !isPasswordUpdate;
    authPasswordField.hidden = !needsPassword;
    authPassword.required = needsPassword;
    authPassword.autocomplete = isPasswordUpdate ? 'new-password' : 'current-password';
    authConfirmField.hidden = !needsConfirmation;
    authConfirmPassword.required = needsConfirmation;
    authConfirmPassword.value = '';
    authForgotButton.hidden = mode !== 'login';
    authContinueButton.hidden = isPasswordUpdate;
    authModeButton.hidden = false;
    showAuthMessage('');

    if (mode === 'signup') {
        authTitle.textContent = 'Crie sua conta';
        authDescription.textContent = 'Cadastre-se para acessar suas ferramentas de PDF.';
        authSubmit.textContent = 'Cadastrar';
        authModeButton.textContent = 'Já tem uma conta? Entrar';
    } else if (mode === 'reset') {
        authTitle.textContent = 'Recuperar senha';
        authDescription.textContent = 'Enviaremos um link para o seu e-mail.';
        authSubmit.textContent = 'Enviar link de recuperação';
        authModeButton.textContent = 'Voltar para login';
    } else if (isPasswordUpdate) {
        authTitle.textContent = 'Escolha uma nova senha';
        authDescription.textContent = 'Defina uma nova senha para sua conta.';
        authSubmit.textContent = 'Salvar nova senha';
        authModeButton.textContent = 'Cancelar';
    } else {
        authTitle.textContent = 'Entre na sua conta';
        authDescription.textContent = 'Acesse suas ferramentas de PDF.';
        authSubmit.textContent = 'Entrar';
        authModeButton.textContent = 'Ainda não tem uma conta? Cadastre-se';
    }
}

function setHeaderProfile(user, fullName, avatarPath) {
    const fallbackName = user.user_metadata && user.user_metadata.full_name
        || user.email && user.email.split('@')[0]
        || 'Meu perfil';
    const displayName = fullName || fallbackName;
    headerProfileUserId = user.id;
    authUserName.textContent = displayName;
    profileOpenButton.setAttribute('aria-label', `Abrir perfil de ${displayName}`);

    if (avatarPath && supabaseClient) {
        const { data } = supabaseClient.storage.from('pdf-editor-avatars').getPublicUrl(avatarPath);
        authUserAvatar.src = `${data.publicUrl}?v=${Date.now()}`;
        authUserAvatar.hidden = false;
        authUserAvatarPlaceholder.hidden = true;
    } else {
        authUserAvatar.hidden = true;
        authUserAvatar.removeAttribute('src');
        authUserAvatarPlaceholder.hidden = false;
    }
}

async function loadHeaderProfile(user) {
    if (headerProfileUserId === user.id) return;
    setHeaderProfile(user, '', null);

    try {
        const { data, error } = await supabaseClient
            .from('pdf_editor_profiles')
            .select('full_name, avatar_path')
            .eq('id', user.id)
            .maybeSingle();

        if (headerProfileUserId !== user.id) return;
        if (error) throw error;
        if (data) setHeaderProfile(user, data.full_name, data.avatar_path);
    } catch (error) {
        console.error('Não foi possível carregar o nome e a foto do perfil no cabeçalho.', error);
    }
}

function displayAuthState(session) {
    if (session && passwordRecovery) {
        activeUser = session.user;
        loginScreenOpen = false;
        setAuthMode('update-password');
        authScreen.hidden = false;
        profileScreen.hidden = true;
        appContainer.hidden = true;
        authUser.hidden = true;
        authLoginButton.hidden = true;
        return;
    }

    if (session) {
        activeUser = session.user;
        loginScreenOpen = false;
        authScreen.hidden = true;
        profileScreen.hidden = !profileOpen;
        appContainer.hidden = profileOpen;
        authUser.hidden = false;
        authLoginButton.hidden = true;
        loadHeaderProfile(session.user);
        return;
    }

    activeUser = null;
    profileOpen = false;
    headerProfileUserId = null;
    authUserName.textContent = '';
    authUserAvatar.hidden = true;
    authUserAvatar.removeAttribute('src');
    authUserAvatarPlaceholder.hidden = false;
    authScreen.hidden = !(passwordRecovery || loginScreenOpen);
    profileScreen.hidden = true;
    appContainer.hidden = passwordRecovery || loginScreenOpen;
    authUser.hidden = true;
    authLoginButton.hidden = passwordRecovery || loginScreenOpen;
}

function getAuthErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
    if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.';
    if (/user already registered/i.test(message)) return 'Este e-mail já possui cadastro. Faça login.';
    return `Não foi possível concluir a operação. ${message}`;
}

function showProfileMessage(message, tone = 'info') {
    profileMessage.textContent = message;
    profileMessage.dataset.tone = tone;
}

function showProfileAvatar(path) {
    if (!path || !supabaseClient) {
        profileAvatarPreview.hidden = true;
        profileAvatarPlaceholder.hidden = false;
        profileAvatarPreview.removeAttribute('src');
        return;
    }

    const { data } = supabaseClient.storage.from('pdf-editor-avatars').getPublicUrl(path);
    profileAvatarPreview.src = `${data.publicUrl}?v=${Date.now()}`;
    profileAvatarPreview.hidden = false;
    profileAvatarPlaceholder.hidden = true;
}

const historyServiceLabels = {
    'merge-pdf': 'Juntar PDFs',
    'extract-pages': 'Extrair páginas',
    'pdf-to-word': 'PDF para Word',
    'word-to-pdf': 'Word para PDF',
    'pdf-to-jpg': 'PDF para JPG',
    'jpg-to-pdf': 'JPG para PDF',
    'ocr-pdf': 'OCR de PDF'
};

async function loadProfileHistory(userId) {
    const { data, error } = await supabaseClient
        .from('pdf_editor_history')
        .select('file_name, service, edited_at')
        .eq('user_id', userId)
        .order('edited_at', { ascending: false })
        .limit(3);

    if (error) throw error;

    profileHistory.replaceChildren();
    profileHistoryEmpty.hidden = data.length > 0;
    data.forEach((entry) => {
        const item = document.createElement('li');
        item.className = 'profile-history-item';

        const name = document.createElement('span');
        name.className = 'profile-history-name';
        name.textContent = entry.file_name;

        const metadata = document.createElement('span');
        metadata.className = 'profile-history-meta';
        const service = historyServiceLabels[entry.service] || entry.service;
        const date = new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(new Date(entry.edited_at));
        metadata.textContent = `${service} · ${date}`;

        item.append(name, metadata);
        profileHistory.append(item);
    });
}

async function loadProfile() {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sua sessão expirou. Entre novamente.');

    activeUser = userData.user;
    const { data: existingProfile, error: profileError } = await supabaseClient
        .from('pdf_editor_profiles')
        .select('full_name, avatar_path')
        .eq('id', activeUser.id)
        .maybeSingle();

    if (profileError) throw profileError;

    let profile = existingProfile;
    if (!profile) {
        const { data, error } = await supabaseClient
            .from('pdf_editor_profiles')
            .upsert({
                id: activeUser.id,
                full_name: activeUser.user_metadata && activeUser.user_metadata.full_name || ''
            }, { onConflict: 'id' })
            .select('full_name, avatar_path')
            .single();
        if (error) throw error;
        profile = data;
    }

    profileName.value = profile.full_name || '';
    profileAvatarPath = profile.avatar_path;
    showProfileAvatar(profileAvatarPath);
    setHeaderProfile(activeUser, profile.full_name, profile.avatar_path);
    await loadProfileHistory(activeUser.id);
}

async function openProfile() {
    profileOpen = true;
    authScreen.hidden = true;
    profileScreen.hidden = false;
    appContainer.hidden = true;
    authUser.hidden = true;
    profileName.value = '';
    profileHistory.replaceChildren();
    profileHistoryEmpty.hidden = true;
    profileAvatarPath = null;
    profileAvatarInput.value = '';
    if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        avatarPreviewUrl = null;
    }
    showProfileAvatar(null);
    showProfileMessage('Carregando perfil...');

    try {
        await loadProfile();
        showProfileMessage('');
    } catch (error) {
        console.error('Não foi possível carregar o perfil.', error);
        const details = error instanceof Error ? error.message : String(error);
        showProfileMessage(`Não foi possível carregar o perfil. Confira a configuração do Supabase. Detalhe: ${details}`, 'error');
    }
}

window.recordFileHistory = async (fileName, service) => {
    if (!supabaseClient || !activeUser) {
        return false;
    }

    const { error } = await supabaseClient.from('pdf_editor_history').insert({
        user_id: activeUser.id,
        file_name: fileName,
        service
    });
    if (error) throw error;
    return true;
};

function getAuthRedirectUrl(hash = '') {
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
        throw new Error('Abra a página por um servidor local ou endereço HTTPS para usar a autenticação.');
    }

    const redirectUrl = new URL(window.location.pathname, window.location.origin);
    redirectUrl.hash = hash;
    return redirectUrl.toString();
}

authModeButton.addEventListener('click', () => {
    if (authMode === 'update-password') {
        passwordRecovery = false;
        if (supabaseClient) {
            supabaseClient.auth.getSession()
                .then(({ data, error }) => {
                    if (error) throw error;
                    if (!data.session) setAuthMode('login');
                    displayAuthState(data.session);
                })
                .catch((error) => {
                    console.error('Não foi possível verificar a sessão do Supabase.', error);
                    showAuthMessage('Não foi possível verificar sua sessão. Recarregue a página ou tente entrar novamente.', 'error');
                });
        } else {
            setAuthMode('login');
        }
        return;
    }
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
});

authLoginButton.addEventListener('click', () => {
    loginScreenOpen = true;
    passwordRecovery = false;
    profileOpen = false;
    setAuthMode('login');
    displayAuthState(null);
    if (!supabaseClient) {
        showAuthMessage('O serviço de autenticação não está disponível. Verifique sua conexão e recarregue a página.', 'error');
    } else {
        authEmail.focus();
    }
});

authContinueButton.addEventListener('click', () => {
    loginScreenOpen = false;
    passwordRecovery = false;
    profileOpen = false;
    setAuthMode('login');
    displayAuthState(null);
});

authForgotButton.addEventListener('click', () => setAuthMode('reset'));

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
        showAuthMessage('O serviço de autenticação não está disponível. Recarregue a página e tente novamente.', 'error');
        return;
    }

    if ((authMode === 'signup' || authMode === 'update-password')
        && authPassword.value !== authConfirmPassword.value) {
        showAuthMessage('As senhas informadas não são iguais.', 'error');
        authConfirmPassword.focus();
        return;
    }

    authSubmit.disabled = true;
    showAuthMessage('Aguarde...');

    try {
        if (authMode === 'login') {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: authEmail.value.trim(),
                password: authPassword.value
            });
            if (error) throw error;
        } else if (authMode === 'signup') {
            const { data, error } = await supabaseClient.auth.signUp({
                email: authEmail.value.trim(),
                password: authPassword.value,
                options: { emailRedirectTo: getAuthRedirectUrl() }
            });
            if (error) throw error;
            if (!data.session) {
                showAuthMessage('Cadastro iniciado. Verifique seu e-mail para confirmar a conta.', 'success');
            }
        } else if (authMode === 'reset') {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(authEmail.value.trim(), {
                redirectTo: getAuthRedirectUrl('redefinir-senha')
            });
            if (error) throw error;
            showAuthMessage('Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.', 'success');
        } else if (authMode === 'update-password') {
            const { error } = await supabaseClient.auth.updateUser({ password: authPassword.value });
            if (error) throw error;
            passwordRecovery = false;
            window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
            const { data, error: sessionError } = await supabaseClient.auth.getSession();
            if (sessionError) throw sessionError;
            displayAuthState(data.session);
            if (profileOpen) {
                showProfileMessage('Senha alterada com sucesso.', 'success');
            } else {
                showStatus('Senha alterada com sucesso.', '#16a34a');
            }
        }
    } catch (error) {
        console.error('Erro na autenticação do Supabase.', error);
        showAuthMessage(getAuthErrorMessage(error), 'error');
    } finally {
        authSubmit.disabled = false;
    }
});

authLogout.addEventListener('click', async () => {
    if (!supabaseClient) return;
    authLogout.disabled = true;
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        passwordRecovery = false;
        setAuthMode('login');
    } catch (error) {
        console.error('Não foi possível encerrar a sessão do Supabase.', error);
        window.alert(getAuthErrorMessage(error));
    } finally {
        authLogout.disabled = false;
    }
});

profileOpenButton.addEventListener('click', openProfile);

profileBackButton.addEventListener('click', async () => {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        profileOpen = false;
        displayAuthState(data.session);
    } catch (error) {
        console.error('Não foi possível voltar ao editor.', error);
        showProfileMessage(getAuthErrorMessage(error), 'error');
    }
});

profileAvatarInput.addEventListener('change', () => {
    const file = profileAvatarInput.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
        profileAvatarInput.value = '';
        showProfileMessage('Escolha uma imagem PNG, JPG ou WebP de até 2 MB.', 'error');
        return;
    }

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    avatarPreviewUrl = URL.createObjectURL(file);
    profileAvatarPreview.src = avatarPreviewUrl;
    profileAvatarPreview.hidden = false;
    profileAvatarPlaceholder.hidden = true;
    showProfileMessage('');
});

profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeUser) {
        showProfileMessage('Sua sessão expirou. Entre novamente.', 'error');
        return;
    }

    const fullName = profileName.value.trim();
    if (!fullName) {
        showProfileMessage('Informe seu nome.', 'error');
        profileName.focus();
        return;
    }

    profileSaveButton.disabled = true;
    showProfileMessage('Salvando perfil...');

    try {
        const file = profileAvatarInput.files[0];
        let avatarPath = profileAvatarPath;
        if (file) {
            avatarPath = `${activeUser.id}/avatar`;
            const { error: uploadError } = await supabaseClient.storage
                .from('pdf-editor-avatars')
                .upload(avatarPath, file, {
                    cacheControl: '3600',
                    contentType: file.type,
                    upsert: true
                });
            if (uploadError) throw uploadError;
        }

        const { error } = await supabaseClient.from('pdf_editor_profiles').upsert({
            id: activeUser.id,
            full_name: fullName,
            avatar_path: avatarPath
        }, { onConflict: 'id' });
        if (error) throw error;

        profileAvatarPath = avatarPath;
        profileAvatarInput.value = '';
        if (avatarPreviewUrl) {
            URL.revokeObjectURL(avatarPreviewUrl);
            avatarPreviewUrl = null;
        }
        showProfileAvatar(profileAvatarPath);
        setHeaderProfile(activeUser, fullName, profileAvatarPath);
        showProfileMessage('Perfil atualizado com sucesso.', 'success');
    } catch (error) {
        console.error('Não foi possível salvar o perfil.', error);
        const details = error instanceof Error ? error.message : String(error);
        showProfileMessage(`Não foi possível salvar o perfil. Detalhe: ${details}`, 'error');
    } finally {
        profileSaveButton.disabled = false;
    }
});

profileChangePasswordButton.addEventListener('click', () => {
    profileOpen = true;
    passwordRecovery = true;
    setAuthMode('update-password');
    authScreen.hidden = false;
    profileScreen.hidden = true;
    appContainer.hidden = true;
    authUser.hidden = true;
});

profileDeleteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeUser || !activeUser.email) {
        showProfileMessage('Não foi possível identificar a conta atual. Entre novamente.', 'error');
        return;
    }

    profileDeleteSubmit.disabled = true;
    showProfileMessage('Confirmando senha e excluindo conta...');
    try {
        const { error: passwordError } = await supabaseClient.auth.signInWithPassword({
            email: activeUser.email,
            password: profileDeletePassword.value
        });
        if (passwordError) throw passwordError;

        const { error: deleteError } = await supabaseClient.functions.invoke('delete-account', {
            body: { confirmation: profileDeleteConfirmation.value }
        });
        if (deleteError) throw deleteError;

        accountDeleted = true;
        profileOpen = false;
        passwordRecovery = false;
        const { error: signOutError } = await supabaseClient.auth.signOut({ scope: 'local' });
        displayAuthState(null);
        setAuthMode('login');
        showAuthMessage(signOutError
            ? 'A conta foi excluída, mas não foi possível limpar a sessão local. Feche esta página.'
            : 'Sua conta e seus dados foram excluídos.', signOutError ? 'error' : 'success');
    } catch (error) {
        console.error('Não foi possível excluir a conta.', error);
        showProfileMessage(getAuthErrorMessage(error), 'error');
    } finally {
        profileDeletePassword.value = '';
        profileDeleteSubmit.disabled = false;
    }
});

setAuthMode(authMode);

if (recoveryRequested) {
    authScreen.hidden = false;
    appContainer.hidden = true;
}

if (!window.supabase || !window.supabase.createClient) {
    showAuthMessage('Não foi possível carregar o serviço de autenticação. Verifique sua conexão e recarregue a página.', 'error');
    authSubmit.disabled = true;
    displayAuthState(null);
} else {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    });
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            passwordRecovery = true;
            setAuthMode('update-password');
        } else if (event === 'SIGNED_OUT') {
            passwordRecovery = false;
            profileOpen = false;
            loginScreenOpen = false;
            setAuthMode('login');
            if (accountDeleted) showAuthMessage('Sua conta e seus dados foram excluídos.', 'success');
        } else if (event === 'SIGNED_IN') {
            accountDeleted = false;
        }
        displayAuthState(session);
    });

    supabaseClient.auth.getSession()
        .then(({ data, error }) => {
            if (error) throw error;
            displayAuthState(data.session);
        })
        .catch((error) => {
            console.error('Não foi possível verificar a sessão do Supabase.', error);
            displayAuthState(null);
            const message = 'Não foi possível verificar sua sessão. Você ainda pode usar o editor sem entrar.';
            if (loginScreenOpen || passwordRecovery) {
                showAuthMessage(message, 'error');
            } else {
                showStatus(message, '#b7791f');
            }
        });
}
