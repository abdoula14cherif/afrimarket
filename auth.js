// =============================================
// CONFIGURATION SUPABASE
// =============================================
const SUPABASE_URL = 'https://mpxlbzsyilvzmgbfopkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA';

// Variable globale pour Supabase
let supabase;

// Initialiser Supabase de manière sécurisée
function initialiserSupabase() {
    try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialisé avec succès');
            return true;
        } else {
            console.error('❌ Supabase JS non chargé');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur initialisation Supabase:', error);
        return false;
    }
}

// =============================================
// FONCTIONS D'AUTHENTIFICATION
// =============================================

/**
 * Inscrire un nouvel utilisateur
 */
async function inscrireUtilisateur(userData) {
    try {
        // Vérifier si Supabase est initialisé
        if (!supabase) {
            const initSuccess = initialiserSupabase();
            if (!initSuccess) {
                return {
                    success: false,
                    error: 'Service d\'authentification non disponible'
                };
            }
        }

        console.log('🔄 Tentative d\'inscription pour:', userData.email);

        // Validation des données
        if (!userData.email || !userData.password || !userData.nom_complet) {
            return {
                success: false,
                error: 'Email, mot de passe et nom complet sont obligatoires'
            };
        }

        // Inscription avec Supabase
        const { data, error } = await supabase.auth.signUp({
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
            console.error('❌ Erreur inscription:', error);
            
            // Messages d'erreur personnalisés
            let errorMessage = error.message;
            if (error.message.includes('User already registered')) {
                errorMessage = 'Un compte existe déjà avec cet email';
            } else if (error.message.includes('Password')) {
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = 'Adresse email invalide';
            }
            
            return { success: false, error: errorMessage };
        }

        console.log('✅ Inscription réussie:', data.user?.email);

        // Créer le profil dans la table utilisateurs
        if (data.user) {
            try {
                const { error: dbError } = await supabase
                    .from('utilisateurs')
                    .insert([
                        {
                            id: data.user.id,
                            email: userData.email,
                            nom_complet: userData.nom_complet,
                            telephone: userData.telephone || null,
                            ville: userData.ville || null,
                            created_at: new Date().toISOString(),
                            statut: 'actif'
                        }
                    ]);

                if (dbError) {
                    console.warn('⚠️ Note: Erreur création profil -', dbError.message);
                    // On continue quand même car l'utilisateur est créé dans Auth
                }
            } catch (dbError) {
                console.warn('⚠️ Note: Erreur base de données -', dbError.message);
            }

            // Stocker en localStorage
            localStorage.setItem('afrimarket_user_id', data.user.id);
            localStorage.setItem('afrimarket_user_email', data.user.email);
            localStorage.setItem('afrimarket_user_name', userData.nom_complet);
        }

        return { 
            success: true, 
            message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
            user: data.user
        };

    } catch (error) {
        console.error('❌ Erreur générale:', error);
        return { 
            success: false, 
            error: 'Une erreur est survenue. Veuillez réessayer.' 
        };
    }
}

/**
 * Connecter un utilisateur
 */
async function connecterUtilisateur(email, password) {
    try {
        // Vérifier si Supabase est initialisé
        if (!supabase) {
            const initSuccess = initialiserSupabase();
            if (!initSuccess) {
                return {
                    success: false,
                    error: 'Service d\'authentification non disponible'
                };
            }
        }

        console.log('🔄 Tentative de connexion:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('❌ Erreur connexion:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou mot de passe incorrect';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Veuillez confirmer votre email';
            }
            
            return { success: false, error: errorMessage };
        }

        console.log('✅ Connexion réussie:', data.user.email);
        
        // Stocker les infos
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', data.user.user_metadata?.nom_complet || '');
        
        return { 
            success: true, 
            user: data.user,
            message: 'Connexion réussie !'
        };
    } catch (error) {
        console.error('❌ Erreur:', error);
        return { 
            success: false, 
            error: 'Erreur de connexion' 
        };
    }
}

/**
 * Vérifier la session
 */
async function verifierSession() {
    try {
        if (!supabase) {
            initialiserSupabase();
            if (!supabase) {
                return { loggedIn: false, user: null };
            }
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
            return { loggedIn: false, user: null };
        }
        
        // Mettre à jour le localStorage
        if (data.session.user) {
            localStorage.setItem('afrimarket_user_id', data.session.user.id);
            localStorage.setItem('afrimarket_user_email', data.session.user.email);
            localStorage.setItem('afrimarket_user_name', data.session.user.user_metadata?.nom_complet || '');
        }
        
        return { 
            loggedIn: true, 
            user: data.session.user 
        };
    } catch (error) {
        return { loggedIn: false, user: null };
    }
}

/**
 * Déconnecter
 */
async function deconnecterUtilisateur() {
    try {
        if (!supabase) {
            initialiserSupabase();
        }

        const { error } = await supabase.auth.signOut();
        
        // Nettoyer le localStorage
        localStorage.removeItem('afrimarket_user_id');
        localStorage.removeItem('afrimarket_user_email');
        localStorage.removeItem('afrimarket_user_name');
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Vérifier si connecté (simple)
 */
function estConnecte() {
    return !!localStorage.getItem('afrimarket_user_id');
}

/**
 * Obtenir l'utilisateur courant
 */
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
// INITIALISATION ET EXPORT
// =============================================

// Initialiser Supabase au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initialisation de Supabase...');
    initialiserSupabase();
    
    // Vérifier la session
    verifierSession().then(session => {
        if (session.loggedIn) {
            console.log('👤 Session active:', session.user.email);
        }
    });
});

// Exporter les fonctions
window.inscrireUtilisateur = inscrireUtilisateur;
window.connecterUtilisateur = connecterUtilisateur;
window.deconnecterUtilisateur = deconnecterUtilisateur;
window.verifierSession = verifierSession;
window.estConnecte = estConnecte;
window.obtenirUtilisateur = obtenirUtilisateur;

console.log('✅ auth.js chargé');