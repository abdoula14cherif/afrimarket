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
    
    // Chercher une traduction
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
        
        // Créer le client Supabase
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
// FONCTIONS D'AUTHENTIFICATION
// =============================================

/**
 * Inscription d'un nouvel utilisateur
 */
async function inscrireUtilisateur(userData) {
    logDebug(`Inscription: ${userData.email}`);
    
    // Initialiser Supabase
    const initResult = initSupabase();
    if (!initResult.success) {
        return { success: false, error: initResult.error };
    }
    
    try {
        // Validation des données
        if (!userData.email || !userData.password || !userData.nom_complet) {
            return { 
                success: false, 
                error: 'Tous les champs obligatoires doivent être remplis' 
            };
        }
        
        if (userData.password.length < 6) {
            return { 
                success: false, 
                error: 'Le mot de passe doit contenir au moins 6 caractères' 
            };
        }
        
        // Inscription avec Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    telephone: userData.telephone || '',
                    ville: userData.ville || '',
                    inscription_date: new Date().toISOString()
                }
            }
        });
        
        if (error) {
            logError(error, 'inscription');
            return { 
                success: false, 
                error: getErrorMessage(error)
            };
        }
        
        logDebug(`Utilisateur créé: ${data.user?.id}`);
        
        // Créer le profil dans la table utilisateurs (si la table existe)
        if (data.user) {
            try {
                const { error: dbError } = await supabase
                    .from('utilisateurs')
                    .insert({
                        id: data.user.id,
                        email: userData.email,
                        nom_complet: userData.nom_complet,
                        telephone: userData.telephone || null,
                        ville: userData.ville || null,
                        created_at: new Date().toISOString(),
                        statut: 'actif'
                    });
                
                if (dbError) {
                    logDebug(`Note: ${dbError.message}`);
                    // Ce n'est pas une erreur critique, on continue
                }
            } catch (dbError) {
                logDebug(`Note DB: ${dbError.message}`);
            }
            
            // Stocker en localStorage
            localStorage.setItem('afrimarket_user_id', data.user.id);
            localStorage.setItem('afrimarket_user_email', data.user.email);
            localStorage.setItem('afrimarket_user_name', userData.nom_complet);
            localStorage.setItem('afrimarket_user_data', JSON.stringify({
                telephone: userData.telephone,
                ville: userData.ville
            }));
            
            // Si email confirmé automatiquement, marquer comme connecté
            if (data.user.identities && data.user.identities.length > 0) {
                localStorage.setItem('afrimarket_logged_in', 'true');
            }
        }
        
        // Message de succès
        let successMessage = 'Inscription réussie ! ';
        if (data.user?.identities?.length === 0) {
            successMessage += 'Vérifiez votre email pour confirmer votre compte.';
        } else {
            successMessage += 'Vous êtes maintenant connecté.';
        }
        
        return {
            success: true,
            message: successMessage,
            user: data.user,
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

/**
 * Connexion d'un utilisateur
 */
async function connecterUtilisateur(email, password, rememberMe = false) {
    logDebug(`Connexion: ${email}`);
    
    // Initialiser Supabase
    const initResult = initSupabase();
    if (!initResult.success) {
        return { success: false, error: initResult.error };
    }
    
    try {
        // Validation
        if (!email || !password) {
            return { 
                success: false, 
                error: 'Email et mot de passe requis' 
            };
        }
        
        // Connexion avec Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            logError(error, 'connexion');
            return { 
                success: false, 
                error: getErrorMessage(error)
            };
        }
        
        logDebug(`Connexion réussie: ${data.user.email}`);
        
        // Stocker les informations utilisateur
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', data.user.user_metadata?.nom_complet || '');
        localStorage.setItem('afrimarket_logged_in', 'true');
        
        if (rememberMe) {
            localStorage.setItem('afrimarket_remember_me', 'true');
            // Stocker plus longtemps
            const userData = {
                email: data.user.email,
                nom: data.user.user_metadata?.nom_complet || ''
            };
            localStorage.setItem('afrimarket_user_data', JSON.stringify(userData));
        }
        
        return {
            success: true,
            message: 'Connexion réussie !',
            user: data.user
        };
        
    } catch (error) {
        logError(error, 'connexion générale');
        return {
            success: false,
            error: 'Erreur de connexion au serveur'
        };
    }
}

/**
 * Déconnexion
 */
async function deconnecterUtilisateur() {
    logDebug('Déconnexion');
    
    const initResult = initSupabase();
    if (!initResult.success) {
        return { success: false, error: initResult.error };
    }
    
    try {
        const { error } = await supabase.auth.signOut();
        
        // Nettoyer le localStorage
        localStorage.removeItem('afrimarket_user_id');
        localStorage.removeItem('afrimarket_user_email');
        localStorage.removeItem('afrimarket_user_name');
        localStorage.removeItem('afrimarket_logged_in');
        localStorage.removeItem('afrimarket_user_data');
        // Garder remember_me si l'utilisateur veut rester connecté
        
        if (error) {
            logError(error, 'déconnexion');
            return { success: false, error: error.message };
        }
        
        return { 
            success: true, 
            message: 'Déconnexion réussie' 
        };
        
    } catch (error) {
        logError(error, 'déconnexion générale');
        return { 
            success: false, 
            error: 'Erreur lors de la déconnexion' 
        };
    }
}

/**
 * Vérification de session
 */
async function verifierSession() {
    const initResult = initSupabase();
    if (!initResult.success) {
        return { loggedIn: false, user: null, error: initResult.error };
    }
    
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            logDebug('Erreur session: ' + error.message);
            return checkLocalStorageSession();
        }
        
        if (!data.session) {
            return checkLocalStorageSession();
        }
        
        // Session valide trouvée
        const user = data.session.user;
        
        // Mettre à jour le localStorage
        localStorage.setItem('afrimarket_user_id', user.id);
        localStorage.setItem('afrimarket_user_email', user.email);
        localStorage.setItem('afrimarket_user_name', user.user_metadata?.nom_complet || '');
        localStorage.setItem('afrimarket_logged_in', 'true');
        
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

/**
 * Vérifier session dans localStorage (fallback)
 */
function checkLocalStorageSession() {
    const userId = localStorage.getItem('afrimarket_user_id');
    const rememberMe = localStorage.getItem('afrimarket_remember_me') === 'true';
    const loggedIn = localStorage.getItem('afrimarket_logged_in') === 'true';
    
    if (userId && (rememberMe || loggedIn)) {
        logDebug('Session locale trouvée (remember me)');
        return {
            loggedIn: true,
            user: {
                id: userId,
                email: localStorage.getItem('afrimarket_user_email'),
                user_metadata: {
                    nom_complet: localStorage.getItem('afrimarket_user_name') || ''
                }
            },
            fromLocalStorage: true
        };
    }
    
    return { loggedIn: false, user: null };
}

/**
 * Vérifier si connecté (simple)
 */
function estConnecte() {
    return localStorage.getItem('afrimarket_logged_in') === 'true' || 
           localStorage.getItem('afrimarket_user_id') !== null;
}

/**
 * Obtenir l'utilisateur courant
 */
function obtenirUtilisateur() {
    if (!estConnecte()) return null;
    
    return {
        id: localStorage.getItem('afrimarket_user_id'),
        email: localStorage.getItem('afrimarket_user_email'),
        nom_complet: localStorage.getItem('afrimarket_user_name'),
        telephone: '',
        ville: ''
    };
}

// =============================================
// GESTION DES ÉVÉNEMENTS AUTH
// =============================================

function setupAuthEvents() {
    // Écouter les changements d'état d'authentification
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            logDebug(`Auth state changed: ${event}`);
            
            if (event === 'SIGNED_IN' && session) {
                // Mettre à jour le localStorage
                localStorage.setItem('afrimarket_user_id', session.user.id);
                localStorage.setItem('afrimarket_user_email', session.user.email);
                localStorage.setItem('afrimarket_logged_in', 'true');
                
                // Déclencher un événement personnalisé
                window.dispatchEvent(new CustomEvent('auth-signed-in', {
                    detail: { user: session.user }
                }));
            }
            
            if (event === 'SIGNED_OUT') {
                // Nettoyer (sauf remember_me)
                localStorage.removeItem('afrimarket_logged_in');
                
                window.dispatchEvent(new CustomEvent('auth-signed-out'));
            }
        });
    }
}

// =============================================
// INITIALISATION AU CHARGEMENT
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    logDebug('Initialisation du système d\'auth...');
    
    // Initialiser Supabase
    const initResult = initSupabase();
    
    if (initResult.success) {
        setupAuthEvents();
        
        // Vérifier la session au démarrage
        setTimeout(async () => {
            const session = await verifierSession();
            logDebug(`Session au démarrage: ${session.loggedIn ? 'Connecté' : 'Non connecté'}`);
        }, 1000);
    } else {
        logError(initResult.error, 'initialisation démarrage');
    }
});

// =============================================
// EXPORTATION DES FONCTIONS
// =============================================
window.inscrireUtilisateur = inscrireUtilisateur;
window.connecterUtilisateur = connecterUtilisateur;
window.deconnecterUtilisateur = deconnecterUtilisateur;
window.verifierSession = verifierSession;
window.estConnecte = estConnecte;
window.obtenirUtilisateur = obtenirUtilisateur;

// Fonctions de debug
window.authDebug = {
    getState: () => ({
        supabase: !!supabase,
        userId: localStorage.getItem('afrimarket_user_id'),
        loggedIn: estConnecte()
    }),
    clearStorage: () => {
        localStorage.removeItem('afrimarket_user_id');
        localStorage.removeItem('afrimarket_user_email');
        localStorage.removeItem('afrimarket_user_name');
        localStorage.removeItem('afrimarket_logged_in');
        localStorage.removeItem('afrimarket_user_data');
        logDebug('Storage nettoyé');
    },
    testConnection: async () => {
        const initResult = initSupabase();
        return initResult;
    }
};

logDebug('✅ Système d\'auth prêt');