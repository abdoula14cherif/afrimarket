// auth.js - Version complète pour inscription et connexion
console.log('🔧 Chargement de auth.js...');

// =============================================
// CONFIGURATION SUPABASE
// =============================================
const SUPABASE_URL = 'https://mpxlbzsyilvzmgbfopkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA';

// Variable Supabase
let supabaseClient = null;

// =============================================
// INITIALISATION
// =============================================

// Initialiser Supabase
function initSupabase() {
    try {
        if (window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            console.log('✅ Supabase initialisé');
            return true;
        } else {
            console.error('❌ Supabase JS non disponible');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur init Supabase:', error);
        return false;
    }
}

// =============================================
// FONCTION D'INSCRIPTION
// =============================================

async function inscrireUtilisateur(userData) {
    console.log('👤 Inscription pour:', userData.email);
    
    // Initialiser Supabase si nécessaire
    if (!supabaseClient) {
        if (!initSupabase()) {
            return {
                success: false,
                error: 'Service d\'authentification non disponible'
            };
        }
    }
    
    try {
        // Inscrire l'utilisateur
        const { data, error } = await supabaseClient.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    telephone: userData.telephone || '',
                    ville: userData.ville || ''
                }
            }
        });
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            
            // Messages d'erreur en français
            if (error.message.includes('already registered') || error.message.includes('already exists')) {
                return { success: false, error: 'Un compte existe déjà avec cet email' };
            } else if (error.message.includes('password') || error.message.includes('Password')) {
                return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
            } else if (error.message.includes('email') || error.message.includes('Email')) {
                return { success: false, error: 'Adresse email invalide' };
            } else {
                return { success: false, error: error.message };
            }
        }
        
        console.log('✅ Utilisateur créé:', data.user?.id);
        
        // Essayer de créer le profil dans la table utilisateurs
        if (data.user) {
            try {
                const { error: dbError } = await supabaseClient
                    .from('utilisateurs')
                    .insert({
                        id: data.user.id,
                        email: userData.email,
                        nom_complet: userData.nom_complet,
                        telephone: userData.telephone || null,
                        ville: userData.ville || null,
                        created_at: new Date().toISOString()
                    });
                    
                if (dbError) {
                    console.warn('⚠️ Note:', dbError.message);
                    console.log('💡 Astuce: Créez la table "utilisateurs" dans Supabase Table Editor');
                }
            } catch (dbError) {
                console.warn('⚠️ Erreur base de données:', dbError);
            }
            
            // Stocker en localStorage
            localStorage.setItem('afrimarket_user_id', data.user.id);
            localStorage.setItem('afrimarket_user_email', data.user.email);
            localStorage.setItem('afrimarket_user_name', userData.nom_complet);
        }
        
        return {
            success: true,
            message: data.user?.identities?.length === 0 
                ? 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.'
                : 'Inscription réussie ! Vous êtes maintenant connecté.',
            user: data.user
        };
        
    } catch (error) {
        console.error('💥 Erreur générale:', error);
        return {
            success: false,
            error: 'Erreur serveur. Veuillez réessayer plus tard.'
        };
    }
}

// =============================================
// FONCTION DE CONNEXION
// =============================================

async function connecterUtilisateur(email, password, rememberMe = false) {
    console.log('🔑 Connexion pour:', email);
    
    // Initialiser Supabase si nécessaire
    if (!supabaseClient) {
        if (!initSupabase()) {
            return {
                success: false,
                error: 'Service d\'authentification non disponible'
            };
        }
    }
    
    try {
        // Connexion avec Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Erreur connexion:', error);
            
            // Messages d'erreur en français
            if (error.message.includes('Invalid login credentials')) {
                return { success: false, error: 'Email ou mot de passe incorrect' };
            } else if (error.message.includes('Email not confirmed')) {
                return { success: false, error: 'Veuillez confirmer votre email avant de vous connecter' };
            } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
                return { success: false, error: 'Email ou mot de passe invalide' };
            } else {
                return { success: false, error: error.message };
            }
        }
        
        console.log('✅ Connexion réussie:', data.user?.email);
        
        // Stocker en localStorage
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', data.user.user_metadata?.nom_complet || '');
        
        if (rememberMe) {
            localStorage.setItem('afrimarket_remember_me', 'true');
        }
        
        return {
            success: true,
            message: 'Connexion réussie !',
            user: data.user
        };
        
    } catch (error) {
        console.error('💥 Erreur générale connexion:', error);
        return {
            success: false,
            error: 'Erreur de connexion. Veuillez réessayer.'
        };
    }
}

// =============================================
// FONCTION DE DÉCONNEXION
// =============================================

async function deconnecterUtilisateur() {
    if (!supabaseClient) {
        if (!initSupabase()) {
            return { success: false, error: 'Erreur d\'initialisation' };
        }
    }
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        // Nettoyer le localStorage
        localStorage.removeItem('afrimarket_user_id');
        localStorage.removeItem('afrimarket_user_email');
        localStorage.removeItem('afrimarket_user_name');
        localStorage.removeItem('afrimarket_remember_me');
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, message: 'Déconnexion réussie' };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// FONCTION DE VÉRIFICATION DE SESSION
// =============================================

async function verifierSession() {
    if (!supabaseClient) {
        if (!initSupabase()) {
            return { loggedIn: false, user: null };
        }
    }
    
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error || !data.session) {
            // Vérifier si on a des infos en localStorage (pour remember me)
            const userId = localStorage.getItem('afrimarket_user_id');
            if (userId && localStorage.getItem('afrimarket_remember_me') === 'true') {
                console.log('📝 Session expirée mais remember me activé');
                return { 
                    loggedIn: false, 
                    user: null,
                    hasRememberMe: true 
                };
            }
            return { loggedIn: false, user: null };
        }
        
        // Mettre à jour le localStorage
        localStorage.setItem('afrimarket_user_id', data.session.user.id);
        localStorage.setItem('afrimarket_user_email', data.session.user.email);
        localStorage.setItem('afrimarket_user_name', data.session.user.user_metadata?.nom_complet || '');
        
        return { 
            loggedIn: true, 
            user: data.session.user,
            session: data.session
        };
        
    } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        return { loggedIn: false, user: null };
    }
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

function estConnecte() {
    return !!localStorage.getItem('afrimarket_user_id');
}

function obtenirUtilisateur() {
    const id = localStorage.getItem('afrimarket_user_id');
    if (!id) return null;
    
    return {
        id: id,
        email: localStorage.getItem('afrimarket_user_email'),
        nom_complet: localStorage.getItem('afrimarket_user_name')
    };
}

// =============================================
// INITIALISATION AU CHARGEMENT
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation auth.js...');
    initSupabase();
    
    // Tester la connexion
    setTimeout(async () => {
        if (supabaseClient) {
            const { data } = await supabaseClient.auth.getSession();
            console.log('🔍 Session active:', data.session ? 'Oui' : 'Non');
        }
    }, 1000);
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

console.log('✅ auth.js prêt, toutes les fonctions sont disponibles');