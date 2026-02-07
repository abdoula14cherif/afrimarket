// auth.js - Authentification AFRIMARKET

// ===== INITIALISATION SUPABASE =====
let supabaseClient = null;

function initSupabase() {
    if (typeof window === 'undefined') return null;
    
    if (!window.SUPABASE_CONFIG) {
        console.error('Configuration Supabase manquante');
        return null;
    }
    
    if (!window.supabase) {
        console.error('Bibliothèque Supabase non chargée');
        return null;
    }
    
    const { createClient } = window.supabase;
    supabaseClient = createClient(
        window.SUPABASE_CONFIG.URL,
        window.SUPABASE_CONFIG.ANON_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
    
    return supabaseClient;
}

// ===== INSCRIPTION =====
async function inscrireUtilisateur(userData) {
    try {
        const client = initSupabase();
        if (!client) {
            throw new Error('Supabase non initialisé');
        }
        
        // Inscription avec email/mot de passe
        const { data, error } = await client.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    telephone: userData.telephone || null,
                    ville: userData.ville || null
                }
            }
        });
        
        if (error) throw error;
        
        return {
            success: true,
            user: data.user,
            message: 'Inscription réussie !'
        };
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== CONNEXION =====
async function connecterUtilisateur(email, password) {
    try {
        const client = initSupabase();
        if (!client) {
            throw new Error('Supabase non initialisé');
        }
        
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Stocker la session
        localStorage.setItem('afrimarket_user', JSON.stringify(data.user));
        
        return {
            success: true,
            user: data.user,
            session: data.session
        };
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        return {
            success: false,
            error: 'Email ou mot de passe incorrect'
        };
    }
}

// ===== DÉCONNEXION =====
async function deconnecterUtilisateur() {
    try {
        const client = initSupabase();
        if (!client) {
            throw new Error('Supabase non initialisé');
        }
        
        const { error } = await client.auth.signOut();
        if (error) throw error;
        
        // Supprimer les données locales
        localStorage.removeItem('afrimarket_user');
        sessionStorage.removeItem('afrimarket_session');
        
        return { success: true };
        
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        return { success: false, error: error.message };
    }
}

// ===== UTILISATEUR COURANT =====
async function getUtilisateurCourant() {
    try {
        const client = initSupabase();
        if (!client) {
            return null;
        }
        
        const { data: { user }, error } = await client.auth.getUser();
        
        if (error || !user) {
            // Vérifier le stockage local
            const localUser = localStorage.getItem('afrimarket_user');
            if (localUser) {
                return JSON.parse(localUser);
            }
            return null;
        }
        
        return user;
        
    } catch (error) {
        console.error('Erreur récupération utilisateur:', error);
        return null;
    }
}

// ===== VÉRIFICATION SESSION =====
async function verifierSession() {
    const user = await getUtilisateurCourant();
    
    if (user) {
        // Mettre à jour l'interface
        updateUIForLoggedInUser(user);
        return user;
    }
    
    // Mettre à jour pour utilisateur non connecté
    updateUIForLoggedOutUser();
    return null;
}

// ===== MISE À JOUR UI =====
function updateUIForLoggedInUser(user) {
    // Cacher bouton connexion
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <div class="user-menu">
                <button class="btn btn-user">
                    <i class="fas fa-user-circle"></i>
                    ${user.email.split('@')[0]}
                </button>
                <div class="user-dropdown">
                    <a href="historique.html"><i class="fas fa-history"></i> Mes annonces</a>
                    <a href="publier.html"><i class="fas fa-plus"></i> Publier</a>
                    <hr>
                    <button onclick="logout()" class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </div>
        `;
    }
}

function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <a href="connexion.html" class="btn btn-login">
                <i class="fas fa-sign-in-alt"></i> Connexion
            </a>
        `;
    }
}

// ===== FONCTION DE DÉCONNEXION GLOBALE =====
window.logout = async function() {
    const result = await deconnecterUtilisateur();
    if (result.success) {
        window.location.href = 'index.html';
    }
};

// ===== EXPORT =====
// Exposer les fonctions
window.inscrireUtilisateur = inscrireUtilisateur;
window.connecterUtilisateur = connecterUtilisateur;
window.deconnecterUtilisateur = deconnecterUtilisateur;
window.getUtilisateurCourant = getUtilisateurCourant;
window.verifierSession = verifierSession;
window.initSupabase = initSupabase;

// Initialiser au chargement
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function() {
        await verifierSession();
    });
}
