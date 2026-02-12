// =============================================
// AUTH.JS - Système d'authentification AFRIMARKET
// =============================================

console.log('🔐 AFRIMARKET Auth System - Chargement...');

// =============================================
// CONFIGURATION SUPABASE
// =============================================
const SUPABASE_CONFIG = {
    URL: 'https://mpxlbzsyilvzmgbfopkm.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA'
};

// =============================================
// VARIABLES GLOBALES
// =============================================
let supabase = null;
let isInitialized = false;
let debugMode = localStorage.getItem('afrimarket_debug') === 'true';

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

function logDebug(message) {
    if (debugMode) {
        console.log('🔍 [Auth] ' + message);
    }
}

function logError(error, context = '') {
    console.error('❌ [Auth] Erreur' + (context ? ' ' + context + ':' : ':'), error);
}

function getErrorMessage(error) {
    const message = error.message || error.toString();
    
    // Traductions des erreurs Supabase
    const translations = {
        'User already registered': 'Un compte existe déjà avec cet email',
        'already registered': 'Un compte existe déjà avec cet email',
        'already exists': 'Un compte existe déjà avec cet email',
        'Invalid login credentials': 'Email ou mot de passe incorrect',
        'Email not confirmed': 'Veuillez confirmer votre email',
        'Invalid email': 'Adresse email invalide',
        'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
        'too many requests': 'Trop de tentatives. Réessayez plus tard',
        'network error': 'Erreur réseau. Vérifiez votre connexion',
        'Failed to fetch': 'Erreur de connexion au serveur'
    };
    
    for (const [key, translation] of Object.entries(translations)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
            return translation;
        }
    }
    
    return message;
}

// =============================================
// INITIALISATION SUPABASE
// =============================================

function initSupabase() {
    try {
        if (isInitialized && supabase) {
            return { success: true, supabase };
        }
        
        if (typeof window.supabase === 'undefined') {
            logError('Supabase JS non chargé');
            return { 
                success: false, 
                error: 'Bibliothèque Supabase non chargée. Rechargez la page.' 
            };
        }
        
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false
                }
            }
        );
        
        isInitialized = true;
        logDebug('Supabase initialisé avec succès');
        
        return { success: true, supabase };
        
    } catch (error) {
        logError(error, 'initialisation Supabase');
        return { 
            success: false, 
            error: 'Erreur d\'initialisation: ' + error.message 
        };
    }
}

// =============================================
// ✅ FONCTION D'INSCRIPTION CORRIGÉE
// =============================================

async function inscrireUtilisateur(userData) {
    logDebug(`Inscription: ${userData.email}`);
    
    const initResult = initSupabase();
    if (!initResult.success) {
        return { success: false, error: initResult.error };
    }
    
    try {
        // Validation
        if (!userData.email || !userData.password || !userData.nom_complet) {
            return { success: false, error: 'Tous les champs obligatoires doivent être remplis' };
        }
        
        if (userData.password.length < 6) {
            return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
        }
        
        // 1. INSCRIPTION SUPABASE AUTH
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    telephone: userData.telephone || '',
                    role: 'user'
                }
            }
        });
        
        if (error) {
            logError(error, 'inscription');
            return { success: false, error: getErrorMessage(error) };
        }
        
        if (!data.user) {
            return { success: false, error: 'Erreur création utilisateur' };
        }
        
        logDebug(`✅ Utilisateur AUTH créé: ${data.user.id}`);
        
        // 2. ✅ INSÉRER DANS LA TABLE users (PAS utilisateurs)
        try {
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: userData.email,
                    nom_complet: userData.nom_complet,
                    telephone: userData.telephone || null,
                    role: 'user',
                    statut: 'active',
                    created_at: new Date().toISOString()
                });
            
            if (dbError) {
                logDebug(`Note - users: ${dbError.message}`);
            } else {
                logDebug('✅ Utilisateur ajouté à la table users');
            }
        } catch (dbError) {
            logDebug(`Note: ${dbError.message}`);
        }
        
        // 3. ✅ GÉNÉRER UN CODE DE PARRAINAGE
        const refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 4. ✅ INSÉRER DANS referral_data
        try {
            const { error: refError } = await supabase
                .from('referral_data')
                .insert({
                    user_id: data.user.id,
                    referral_code: refCode,
                    referral_link: 'https://afrimarket-prod.vercel.app/index.html?ref=' + refCode,
                    is_unlocked: false,
                    created_at: new Date().toISOString()
                });
            
            if (refError) {
                logDebug(`Note - referral_data: ${refError.message}`);
            } else {
                logDebug('✅ Code de parrainage créé: ' + refCode);
            }
        } catch (refError) {
            logDebug(`Note: ${refError.message}`);
        }
        
        // 5. STOCKER EN LOCALSTORAGE
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', userData.nom_complet);
        localStorage.setItem('afrimarket_user_role', 'user');
        localStorage.setItem('afrimarket_referral_code', refCode);
        
        if (data.user.identities && data.user.identities.length > 0) {
            localStorage.setItem('afrimarket_logged_in', 'true');
        }
        
        let successMessage = '✅ Inscription réussie ! ';
        if (data.user?.identities?.length === 0) {
            successMessage += 'Vérifiez votre email pour confirmer votre compte.';
        } else {
            successMessage += 'Vous êtes maintenant connecté.';
        }
        
        return {
            success: true,
            message: successMessage,
            user: data.user,
            referral_code: refCode,
            requiresEmailConfirmation: data.user?.identities?.length === 0
        };
        
    } catch (error) {
        logError(error, 'inscription générale');
        return {
            success: false,
            error: 'Une erreur inattendue est survenue. Veuillez réessayer.'
        };
    }
}

// =============================================
// ✅ FONCTION DE CONNEXION CORRIGÉE
// =============================================

async function connecterUtilisateur(email, password, rememberMe = false) {
    logDebug(`Connexion: ${email}`);
    
    const initResult = initSupabase();
    if (!initResult.success) {
        return { success: false, error: initResult.error };
    }
    
    try {
        // ADMIN - CONNEXION DIRECTE
        const ADMIN_EMAIL = 'abdoula14cherif@gmail.com';
        const ADMIN_PASSWORD = 'abdoula.@5';
        
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            logDebug('✅ Connexion admin directe');
            
            localStorage.setItem('afrimarket_logged_in', 'true');
            localStorage.setItem('afrimarket_user_email', email);
            localStorage.setItem('afrimarket_user_name', 'Abdoula Cherif');
            localStorage.setItem('afrimarket_user_role', 'admin');
            localStorage.setItem('afrimarket_user_id', 'admin-' + Date.now());
            
            return {
                success: true,
                message: '✅ Connexion administrateur réussie !',
                user: { email, role: 'admin' },
                redirect: 'admin.html'
            };
        }
        
        // UTILISATEUR NORMAL - CONNEXION AUTH
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            logError(error, 'connexion');
            return { success: false, error: getErrorMessage(error) };
        }
        
        if (!data.user) {
            return { success: false, error: 'Erreur de connexion' };
        }
        
        logDebug(`✅ Connexion Auth réussie: ${data.user.id}`);
        
        // RÉCUPÉRER LES INFOS DEPUIS LA TABLE users
        let userName = data.user.user_metadata?.nom_complet || 'Utilisateur';
        let userRole = 'user';
        
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('nom_complet, role')
                .eq('id', data.user.id)
                .maybeSingle();
            
            if (userData) {
                userName = userData.nom_complet || userName;
                userRole = userData.role || 'user';
            }
        } catch (e) {
            logDebug('Impossible de récupérer les infos depuis users');
        }
        
        // STOCKER EN LOCAL
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', userName);
        localStorage.setItem('afrimarket_user_role', userRole);
        
        if (rememberMe) {
            localStorage.setItem('afrimarket_remember_me', 'true');
        }
        
        return {
            success: true,
            message: '✅ Connexion réussie !',
            user: data.user,
            redirect: 'dashboard.html'
        };
        
    } catch (error) {
        logError(error, 'connexion générale');
        return { success: false, error: 'Erreur de connexion au serveur' };
    }
}

// =============================================
// DÉCONNEXION
// =============================================

async function deconnecterUtilisateur() {
    logDebug('Déconnexion');
    
    const initResult = initSupabase();
    if (!initResult.success) {
        return { success: false, error: initResult.error };
    }
    
    try {
        await supabase.auth.signOut();
        
        // Nettoyer le localStorage (garder le thème)
        const theme = localStorage.getItem('afrimarket_theme');
        localStorage.clear();
        if (theme) localStorage.setItem('afrimarket_theme', theme);
        
        return { success: true, message: 'Déconnexion réussie' };
        
    } catch (error) {
        logError(error, 'déconnexion');
        return { success: false, error: 'Erreur lors de la déconnexion' };
    }
}

// =============================================
// VÉRIFICATION DE SESSION
// =============================================

async function verifierSession() {
    const initResult = initSupabase();
    if (!initResult.success) {
        return { loggedIn: false, user: null, error: initResult.error };
    }
    
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
            return checkLocalStorageSession();
        }
        
        const user = data.session.user;
        
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', user.id);
        localStorage.setItem('afrimarket_user_email', user.email);
        localStorage.setItem('afrimarket_user_name', user.user_metadata?.nom_complet || '');
        
        return {
            loggedIn: true,
            user: user,
            session: data.session
        };
        
    } catch (error) {
        logError(error, 'vérification session');
        return checkLocalStorageSession();
    }
}

// =============================================
// VÉRIFICATION LOCALSTORAGE
// =============================================

function checkLocalStorageSession() {
    const loggedIn = localStorage.getItem('afrimarket_logged_in') === 'true';
    const userId = localStorage.getItem('afrimarket_user_id');
    const userEmail = localStorage.getItem('afrimarket_user_email');
    const userName = localStorage.getItem('afrimarket_user_name');
    
    if (loggedIn && userId) {
        return {
            loggedIn: true,
            user: {
                id: userId,
                email: userEmail,
                user_metadata: { nom_complet: userName }
            },
            fromLocalStorage: true
        };
    }
    
    return { loggedIn: false, user: null };
}

// =============================================
// FONCTIONS UTILES
// =============================================

function estConnecte() {
    return localStorage.getItem('afrimarket_logged_in') === 'true' || 
           localStorage.getItem('afrimarket_user_id') !== null;
}

function obtenirUtilisateur() {
    if (!estConnecte()) return null;
    
    return {
        id: localStorage.getItem('afrimarket_user_id'),
        email: localStorage.getItem('afrimarket_user_email'),
        nom_complet: localStorage.getItem('afrimarket_user_name'),
        role: localStorage.getItem('afrimarket_user_role') || 'user'
    };
}

// =============================================
// ÉVÉNEMENTS AUTH
// =============================================

function setupAuthEvents() {
    if (!supabase) return;
    
    supabase.auth.onAuthStateChange((event, session) => {
        logDebug(`Auth state changed: ${event}`);
        
        if (event === 'SIGNED_IN' && session) {
            localStorage.setItem('afrimarket_logged_in', 'true');
            localStorage.setItem('afrimarket_user_id', session.user.id);
            localStorage.setItem('afrimarket_user_email', session.user.email);
            
            window.dispatchEvent(new CustomEvent('auth-signed-in', {
                detail: { user: session.user }
            }));
        }
        
        if (event === 'SIGNED_OUT') {
            const theme = localStorage.getItem('afrimarket_theme');
            localStorage.clear();
            if (theme) localStorage.setItem('afrimarket_theme', theme);
            
            window.dispatchEvent(new CustomEvent('auth-signed-out'));
        }
    });
}

// =============================================
// INITIALISATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    logDebug('Initialisation du système d\'auth...');
    
    const initResult = initSupabase();
    
    if (initResult.success) {
        setupAuthEvents();
        
        setTimeout(async () => {
            const session = await verifierSession();
            logDebug(`Session au démarrage: ${session.loggedIn ? 'Connecté' : 'Non connecté'}`);
        }, 1000);
    }
});

// =============================================
// EXPORTATION
// =============================================
window.inscrireUtilisateur = inscrireUtilisateur;
window.connecterUtilisateur = connecterUtilisateur;
window.deconnecterUtilisateur = deconnecterUtilisateur;
window.verifierSession = verifierSession;
window.estConnecte = estConnecte;
window.obtenirUtilisateur = obtenirUtilisateur;

// =============================================
// DEBUG
// =============================================
window.authDebug = {
    getState: () => ({
        supabase: !!supabase,
        userId: localStorage.getItem('afrimarket_user_id'),
        loggedIn: estConnecte(),
        userRole: localStorage.getItem('afrimarket_user_role')
    }),
    clearStorage: () => {
        const theme = localStorage.getItem('afrimarket_theme');
        localStorage.clear();
        if (theme) localStorage.setItem('afrimarket_theme', theme);
        logDebug('Storage nettoyé');
    },
    testConnection: async () => {
        const initResult = initSupabase();
        return initResult;
    }
};

logDebug('✅ Système d\'auth prêt (version corrigée)');