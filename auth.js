// ============================================
// AUTHENTIFICATION AFREMARKET
// ============================================

// Initialisation Supabase
let supabase = null;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Auth: Supabase client initialisé');
} catch (error) {
    console.error('❌ Auth: Erreur initialisation:', error);
}

// ============================================
// 1. INSCRIPTION
// ============================================
async function signUp(userData) {
    try {
        console.log('📝 Auth: Inscription pour', userData.email);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    fullname: userData.fullname,
                    username: userData.username || '',
                    phone: userData.phone || '',
                    country: userData.country || '',
                    city: userData.city || ''
                }
            }
        });

        if (authError) throw authError;

        if (authData.user) {
            await supabase.from('users').insert([{
                user_id: authData.user.id,
                fullname: userData.fullname,
                username: userData.username || '',
                email: userData.email,
                phone: userData.phone || '',
                country: userData.country || '',
                city: userData.city || '',
                referral_code: userData.referral || null,
                newsletter: userData.newsletter || true,
                created_at: new Date()
            }]);
        }

        return { success: true, user: authData.user };

    } catch (error) {
        console.error('❌ Auth: Erreur inscription:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 2. CONNEXION
// ============================================
async function signIn(email, password, remember = false) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        if (remember) {
            localStorage.setItem('afrimarket_user', JSON.stringify(data.user));
        } else {
            sessionStorage.setItem('afrimarket_user', JSON.stringify(data.user));
        }

        return { success: true, user: data.user };

    } catch (error) {
        console.error('❌ Auth: Erreur connexion:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 3. DÉCONNEXION
// ============================================
async function signOut() {
    try {
        await supabase.auth.signOut();
        localStorage.removeItem('afrimarket_user');
        sessionStorage.removeItem('afrimarket_user');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// 4. VÉRIFICATION SESSION
// ============================================
async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getStoredUser() {
    const local = localStorage.getItem('afrimarket_user');
    const session = sessionStorage.getItem('afrimarket_user');
    return local ? JSON.parse(local) : session ? JSON.parse(session) : null;
}

function isAuthenticated() {
    return !!getStoredUser();
}

async function requireAuth(redirectTo = 'connexion.html') {
    const user = getStoredUser();
    if (!user) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

// ============================================
// 5. MOT DE PASSE OUBLIÉ
// ============================================
async function resetPassword(email) {
    try {
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORT
// ============================================
window.Auth = {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getStoredUser,
    isAuthenticated,
    requireAuth,
    resetPassword
};