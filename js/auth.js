// ============================================
// FICHIER D'AUTHENTIFICATION AFREMARKET
// À placer dans /js/auth.js
// ============================================

// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = 'https://kfbstzlauxdwezgtzdsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYnN0emxhdXhkd2V6Z3R6ZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODYzMDQsImV4cCI6MjA4NjU2MjMwNH0.a43ze2_uKyaEgodntEvMRFEH7mNgByyfUHfzQpEKDFM';

// Initialisation du client Supabase
let supabase = null;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Auth: Supabase client initialisé');
} catch (error) {
    console.error('❌ Auth: Erreur initialisation Supabase:', error);
}

// ============================================
// 1. INSCRIPTION
// ============================================
export async function signUp(userData) {
    try {
        console.log('📝 Auth: Tentative d\'inscription pour', userData.email);

        // Validation des données
        if (!userData.email || !userData.password || !userData.fullname) {
            throw new Error('Tous les champs obligatoires doivent être remplis');
        }

        // Création de l'utilisateur dans Auth
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

        // Sauvegarde dans la table users
        if (authData.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert([{
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

            if (dbError) {
                console.warn('⚠️ Auth: Erreur sauvegarde profil:', dbError);
                // Non bloquant
            }
        }

        console.log('✅ Auth: Inscription réussie');
        return { success: true, user: authData.user };

    } catch (error) {
        console.error('❌ Auth: Erreur inscription:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 2. CONNEXION
// ============================================
export async function signIn(email, password, remember = false) {
    try {
        console.log('🔐 Auth: Tentative de connexion pour', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Gestion du "Se souvenir de moi"
        if (remember) {
            localStorage.setItem('afrimarket_session', 'active');
            localStorage.setItem('afrimarket_user', JSON.stringify(data.user));
        } else {
            sessionStorage.setItem('afrimarket_session', 'active');
            sessionStorage.setItem('afrimarket_user', JSON.stringify(data.user));
        }

        console.log('✅ Auth: Connexion réussie');
        return { success: true, user: data.user };

    } catch (error) {
        console.error('❌ Auth: Erreur connexion:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 3. DÉCONNEXION
// ============================================
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Nettoyage du stockage
        localStorage.removeItem('afrimarket_session');
        localStorage.removeItem('afrimarket_user');
        sessionStorage.removeItem('afrimarket_session');
        sessionStorage.removeItem('afrimarket_user');

        console.log('✅ Auth: Déconnexion réussie');
        return { success: true };

    } catch (error) {
        console.error('❌ Auth: Erreur déconnexion:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 4. VÉRIFICATION DE SESSION
// ============================================
export async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        return { success: true, session };

    } catch (error) {
        console.error('❌ Auth: Erreur récupération session:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 5. RÉCUPÉRATION DE L'UTILISATEUR CONNECTÉ
// ============================================
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        return { success: true, user };

    } catch (error) {
        console.error('❌ Auth: Erreur récupération utilisateur:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 6. RÉINITIALISATION MOT DE PASSE
// ============================================
export async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) throw error;

        console.log('✅ Auth: Email de réinitialisation envoyé');
        return { success: true };

    } catch (error) {
        console.error('❌ Auth: Erreur réinitialisation:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 7. MISE À JOUR DU MOT DE PASSE
// ============================================
export async function updatePassword(newPassword) {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        console.log('✅ Auth: Mot de passe mis à jour');
        return { success: true };

    } catch (error) {
        console.error('❌ Auth: Erreur mise à jour mot de passe:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 8. VÉRIFICATION SI L'UTILISATEUR EST CONNECTÉ
// ============================================
export function isAuthenticated() {
    const localSession = localStorage.getItem('afrimarket_session');
    const sessionSession = sessionStorage.getItem('afrimarket_session');
    
    return !!(localSession || sessionSession);
}

// ============================================
// 9. RÉCUPÉRATION DE L'UTILISATEUR DEPUIS LE STOCKAGE
// ============================================
export function getStoredUser() {
    try {
        const localUser = localStorage.getItem('afrimarket_user');
        const sessionUser = sessionStorage.getItem('afrimarket_user');
        
        if (localUser) return JSON.parse(localUser);
        if (sessionUser) return JSON.parse(sessionUser);
        
        return null;

    } catch (error) {
        console.error('❌ Auth: Erreur lecture stockage:', error);
        return null;
    }
}

// ============================================
// 10. RÉCUPÉRATION DU PROFIL UTILISATEUR
// ============================================
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

        return { success: true, profile: data };

    } catch (error) {
        console.error('❌ Auth: Erreur récupération profil:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 11. MISE À JOUR DU PROFIL
// ============================================
export async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Auth: Profil mis à jour');
        return { success: true, profile: data };

    } catch (error) {
        console.error('❌ Auth: Erreur mise à jour profil:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 12. CONNEXION AVEC PROVIDER (GOOGLE, ETC.)
// ============================================
export async function signInWithProvider(provider) {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;

        return { success: true, data };

    } catch (error) {
        console.error(`❌ Auth: Erreur connexion ${provider}:`, error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 13. INSCRIPTION/CONNEXION AVEC TÉLÉPHONE
// ============================================
export async function signInWithPhone(phone) {
    try {
        // Vérifier si l'utilisateur existe dans la table users
        const { data: userData, error: searchError } = await supabase
            .from('users')
            .select('email')
            .eq('phone', phone)
            .single();

        if (searchError || !userData) {
            throw new Error('Numéro de téléphone non trouvé');
        }

        // Rediriger vers la page de connexion avec email pré-rempli
        return { 
            success: true, 
            email: userData.email,
            message: 'Utilisez votre email pour vous connecter'
        };

    } catch (error) {
        console.error('❌ Auth: Erreur recherche téléphone:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 14. ENVOI DE CODE WHATSAPP (SIMULATION)
// ============================================
export async function sendWhatsAppCode(phone) {
    try {
        // Simuler l'envoi d'un code (à implémenter avec un service réel)
        const code = Math.floor(100000 + Math.random() * 900000);
        
        // Sauvegarder le code en session
        sessionStorage.setItem('whatsapp_code', code);
        sessionStorage.setItem('whatsapp_phone', phone);

        console.log(`📱 Auth: Code ${code} envoyé au ${phone}`);
        
        return { success: true, code: code };

    } catch (error) {
        console.error('❌ Auth: Erreur envoi code:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 15. VÉRIFICATION DU CODE WHATSAPP
// ============================================
export function verifyWhatsAppCode(enteredCode) {
    const savedCode = sessionStorage.getItem('whatsapp_code');
    const phone = sessionStorage.getItem('whatsapp_phone');

    if (!savedCode || !phone) {
        return { success: false, error: 'Session expirée' };
    }

    if (enteredCode === savedCode) {
        // Nettoyer
        sessionStorage.removeItem('whatsapp_code');
        return { success: true, phone: phone };
    }

    return { success: false, error: 'Code incorrect' };
}

// ============================================
// 16. PROTECTION DES ROUTES
// ============================================
export async function requireAuth(redirectTo = 'connexion.html') {
    const { success, session } = await getCurrentSession();
    
    if (!success || !session) {
        window.location.href = redirectTo;
        return false;
    }
    
    return true;
}

// ============================================
// 17. REDIRECTION SI DÉJÀ CONNECTÉ
// ============================================
export async function redirectIfAuthenticated(redirectTo = 'dashboard.html') {
    const { success, session } = await getCurrentSession();
    
    if (success && session) {
        window.location.href = redirectTo;
        return true;
    }
    
    return false;
}

// ============================================
// 18. OBSERVER LES CHANGEMENTS D'AUTH
// ============================================
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth: Changement d\'état:', event);
        callback(event, session);
    });
}

// ============================================
// 19. RAFRAÎCHIR LA SESSION
// ============================================
export async function refreshSession() {
    try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        
        console.log('✅ Auth: Session rafraîchie');
        return { success: true, session: data.session };

    } catch (error) {
        console.error('❌ Auth: Erreur rafraîchissement session:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// 20. SUPPRESSION DE COMPTE
// ============================================
export async function deleteAccount(userId) {
    try {
        // Note: La suppression de compte nécessite des droits admin
        // ou une fonction Edge/Serverless
        console.warn('⚠️ Auth: La suppression de compte n\'est pas implémentée');
        
        return { 
            success: false, 
            error: 'Fonctionnalité non disponible' 
        };

    } catch (error) {
        console.error('❌ Auth: Erreur suppression compte:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORT PAR DÉFAUT DE TOUTES LES FONCTIONS
// ============================================
export default {
    signUp,
    signIn,
    signOut,
    getCurrentSession,
    getCurrentUser,
    resetPassword,
    updatePassword,
    isAuthenticated,
    getStoredUser,
    getUserProfile,
    updateUserProfile,
    signInWithProvider,
    signInWithPhone,
    sendWhatsAppCode,
    verifyWhatsAppCode,
    requireAuth,
    redirectIfAuthenticated,
    onAuthStateChange,
    refreshSession,
    deleteAccount
};