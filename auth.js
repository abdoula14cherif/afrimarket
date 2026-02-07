// ============================================
// auth.js - AUTHENTIFICATION COMPLÈTE AFRIMARKET
// ============================================

class AuthManager {
    constructor() {
        this.supabaseClient = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.authListeners = [];
        
        // États d'authentification
        this.AUTH_STATES = {
            LOADING: 'loading',
            AUTHENTICATED: 'authenticated',
            UNAUTHENTICATED: 'unauthenticated',
            ERROR: 'error'
        };
        
        this.currentState = this.AUTH_STATES.LOADING;
    }
    
    // ===== INITIALISATION =====
    
    async initialize() {
        if (this.isInitialized) return this.supabaseClient;
        
        try {
            // Vérifier la configuration
            if (!window.supabase || !window.SUPABASE_CONFIG) {
                throw new Error('Configuration Supabase manquante');
            }
            
            // Créer le client Supabase
            const { createClient } = window.supabase;
            this.supabaseClient = createClient(
                window.SUPABASE_CONFIG.URL,
                window.SUPABASE_CONFIG.ANON_KEY,
                window.SUPABASE_CONFIG.OPTIONS
            );
            
            // Écouter les changements d'authentification
            this.setupAuthListener();
            
            // Vérifier la session existante
            await this.checkExistingSession();
            
            this.isInitialized = true;
            console.log('🔐 AuthManager initialisé');
            
            return this.supabaseClient;
            
        } catch (error) {
            console.error('❌ Erreur initialisation AuthManager:', error);
            this.currentState = this.AUTH_STATES.ERROR;
            this.notifyListeners();
            return null;
        }
    }
    
    // ===== ÉCOUTEUR D'AUTH =====
    
    setupAuthListener() {
        if (!this.supabaseClient) return;
        
        // Écouter les changements d'authentification
        this.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Événement auth:', event, session?.user?.email);
            
            switch (event) {
                case 'SIGNED_IN':
                    this.handleSignedIn(session);
                    break;
                    
                case 'SIGNED_OUT':
                    this.handleSignedOut();
                    break;
                    
                case 'USER_UPDATED':
                    this.handleUserUpdated(session);
                    break;
                    
                case 'TOKEN_REFRESHED':
                    this.handleTokenRefreshed(session);
                    break;
            }
            
            this.notifyListeners();
        });
    }
    
    // ===== GESTION DES SESSIONS =====
    
    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabaseClient.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                await this.handleSignedIn(session);
            } else {
                this.currentState = this.AUTH_STATES.UNAUTHENTICATED;
                this.currentUser = null;
            }
            
        } catch (error) {
            console.error('❌ Erreur vérification session:', error);
            this.currentState = this.AUTH_STATES.ERROR;
        }
    }
    
    // ===== HANDLERS D'ÉVÉNEMENTS =====
    
    async handleSignedIn(session) {
        try {
            // Récupérer l'utilisateur complet avec profil
            const { data: { user }, error: userError } = await this.supabaseClient.auth.getUser();
            
            if (userError) throw userError;
            
            // Récupérer le profil depuis la table profiles
            let profile = null;
            if (user) {
                const { data: profileData, error: profileError } = await this.supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (!profileError) {
                    profile = profileData;
                }
            }
            
            this.currentUser = {
                ...user,
                profile: profile
            };
            
            this.currentState = this.AUTH_STATES.AUTHENTICATED;
            
            // Sauvegarder dans localStorage pour persistance
            this.saveToLocalStorage();
            
            console.log('✅ Utilisateur connecté:', this.currentUser.email);
            
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            this.currentState = this.AUTH_STATES.ERROR;
        }
    }
    
    handleSignedOut() {
        this.currentUser = null;
        this.currentState = this.AUTH_STATES.UNAUTHENTICATED;
        this.clearLocalStorage();
        console.log('👋 Utilisateur déconnecté');
    }
    
    handleUserUpdated(session) {
        if (this.currentUser && session?.user) {
            this.currentUser = { ...this.currentUser, ...session.user };
            this.saveToLocalStorage();
        }
    }
    
    handleTokenRefreshed(session) {
        console.log('🔄 Token rafraîchi');
    }
    
    // ===== OPÉRATIONS D'AUTHENTIFICATION =====
    
    async signUp(userData) {
        try {
            await this.ensureInitialized();
            
            const { data, error } = await this.supabaseClient.auth.signUp({
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
            
            // Créer le profil dans la table profiles
            if (data.user) {
                await this.createUserProfile(data.user.id, {
                    nom_complet: userData.nom_complet,
                    email: userData.email,
                    telephone: userData.telephone,
                    ville: userData.ville
                });
            }
            
            return {
                success: true,
                user: data.user,
                message: window.MESSAGES.SUCCESS.SIGNED_UP
            };
            
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async signIn(email, password) {
        try {
            await this.ensureInitialized();
            
            const { data, error } = await this.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            return {
                success: true,
                user: data.user,
                message: window.MESSAGES.SUCCESS.LOGGED_IN
            };
            
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            return {
                success: false,
                error: 'Email ou mot de passe incorrect'
            };
        }
    }
    
    async signOut() {
        try {
            await this.ensureInitialized();
            
            const { error } = await this.supabaseClient.auth.signOut();
            if (error) throw error;
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            return { success: false, error: error.message };
        }
    }
    
    async resetPassword(email) {
        try {
            await this.ensureInitialized();
            
            const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.ConfigUtils.getFullUrl('/reset-password')
            });
            
            if (error) throw error;
            
            return {
                success: true,
                message: 'Email de réinitialisation envoyé'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ===== GESTION DES PROFILS =====
    
    async createUserProfile(userId, profileData) {
        try {
            const { error } = await this.supabaseClient
                .from('profiles')
                .insert([{
                    id: userId,
                    nom_complet: profileData.nom_complet,
                    email: profileData.email,
                    telephone: profileData.telephone || null,
                    ville: profileData.ville || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erreur création profil:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateProfile(profileData) {
        try {
            await this.ensureInitialized();
            
            if (!this.currentUser) {
                throw new Error('Utilisateur non connecté');
            }
            
            const { error } = await this.supabaseClient
                .from('profiles')
                .update({
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentUser.id);
            
            if (error) throw error;
            
            // Mettre à jour l'utilisateur local
            if (this.currentUser.profile) {
                this.currentUser.profile = { ...this.currentUser.profile, ...profileData };
                this.saveToLocalStorage();
            }
            
            return {
                success: true,
                message: window.MESSAGES.SUCCESS.UPDATED
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getUserProfile(userId = null) {
        try {
            await this.ensureInitialized();
            
            const targetUserId = userId || this.currentUser?.id;
            if (!targetUserId) return null;
            
            const { data, error } = await this.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .single();
            
            if (error) throw error;
            
            return data;
            
        } catch (error) {
            console.error('❌ Erreur récupération profil:', error);
            return null;
        }
    }
    
    // ===== UTILITAIRE =====
    
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (!this.supabaseClient) {
            throw new Error('Supabase non initialisé');
        }
    }
    
    saveToLocalStorage() {
        if (!this.currentUser) return;
        
        try {
            localStorage.setItem('afrimarket_user', JSON.stringify({
                id: this.currentUser.id,
                email: this.currentUser.email,
                profile: this.currentUser.profile,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('❌ Erreur sauvegarde localStorage:', error);
        }
    }
    
    clearLocalStorage() {
        try {
            localStorage.removeItem('afrimarket_user');
            localStorage.removeItem('supabase.auth.token');
        } catch (error) {
            console.error('❌ Erreur nettoyage localStorage:', error);
        }
    }
    
    // ===== OBSERVATEURS =====
    
    addAuthListener(callback) {
        this.authListeners.push(callback);
        
        // Notifier immédiatement
        if (this.currentState !== this.AUTH_STATES.LOADING) {
            callback(this.currentState, this.currentUser);
        }
        
        // Retourner une fonction pour supprimer l'écouteur
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }
    
    notifyListeners() {
        this.authListeners.forEach(callback => {
            try {
                callback(this.currentState, this.currentUser);
            } catch (error) {
                console.error('❌ Erreur listener auth:', error);
            }
        });
    }
    
    // ===== GETTERS =====
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getAuthState() {
        return this.currentState;
    }
    
    isAuthenticated() {
        return this.currentState === this.AUTH_STATES.AUTHENTICATED;
    }
    
    isLoading() {
        return this.currentState === this.AUTH_STATES.LOADING;
    }
    
    // ===== AUTH SOCIALE =====
    
    async signInWithGoogle() {
        try {
            await this.ensureInitialized();
            
            const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.ConfigUtils.getFullUrl()
                }
            });
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async signInWithFacebook() {
        try {
            await this.ensureInitialized();
            
            const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: window.ConfigUtils.getFullUrl()
                }
            });
            
            if (error) throw error;
            
            return { success: true, data };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// ===== INSTANCE GLOBALE =====

// Créer l'instance unique
const authManager = new AuthManager();

// Exposer au global scope
window.AuthManager = authManager;

// Initialiser automatiquement
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function() {
        await authManager.initialize();
        
        // Mettre à jour l'interface UI
        updateAuthUI();
        
        // Écouter les changements d'auth
        authManager.addAuthListener((state, user) => {
            updateAuthUI();
        });
    });
}

// ===== FONCTIONS UI =====

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (!authButtons && !userMenu) return;
    
    const state = authManager.getAuthState();
    const user = authManager.getCurrentUser();
    
    // Cacher tous les éléments d'auth d'abord
    const allAuthElements = document.querySelectorAll('.auth-element');
    allAuthElements.forEach(el => el.style.display = 'none');
    
    if (state === authManager.AUTH_STATES.LOADING) {
        // État de chargement
        showLoadingAuth();
        
    } else if (state === authManager.AUTH_STATES.AUTHENTICATED && user) {
        // Utilisateur connecté
        showAuthenticatedUI(user);
        
    } else {
        // Non connecté
        showUnauthenticatedUI();
    }
}

function showLoadingAuth() {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <div class="auth-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Chargement...</span>
            </div>
        `;
    }
}

function showAuthenticatedUI(user) {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        const displayName = user.profile?.nom_complet || user.email.split('@')[0];
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        authButtons.innerHTML = `
            <div class="user-menu">
                <div class="user-avatar" onclick="toggleUserMenu()">
                    ${initials}
                </div>
                <div class="user-dropdown" id="user-dropdown">
                    <div class="user-info">
                        <strong>${displayName}</strong>
                        <small>${user.email}</small>
                    </div>
                    <a href="historique.html" class="dropdown-item">
                        <i class="fas fa-history"></i> Mes annonces
                    </a>
                    <a href="publier.html" class="dropdown-item">
                        <i class="fas fa-plus-circle"></i> Publier
                    </a>
                    <a href="profile.html" class="dropdown-item">
                        <i class="fas fa-user-cog"></i> Mon profil
                    </a>
                    <hr>
                    <button onclick="logout()" class="dropdown-item logout">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            </div>
        `;
    }
}

function showUnauthenticatedUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <a href="connexion.html" class="btn btn-login">
                <i class="fas fa-sign-in-alt"></i> Connexion
            </a>
            <a href="inscription.html" class="btn btn-secondary" style="margin-left: 8px;">
                <i class="fas fa-user-plus"></i> Inscription
            </a>
        `;
    }
}

// ===== FONCTIONS GLOBALES =====

window.toggleUserMenu = function() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

window.logout = async function() {
    if (confirm(window.MESSAGES.CONFIRM.LOGOUT)) {
        const result = await authManager.signOut();
        if (result.success) {
            window.location.href = 'index.html';
        }
    }
};

// Fermer le dropdown en cliquant ailleurs
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('user-dropdown');
    const avatar = document.querySelector('.user-avatar');
    
    if (dropdown && dropdown.classList.contains('show') && 
        !dropdown.contains(event.target) && 
        !avatar.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager };
}