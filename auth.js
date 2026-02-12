// ============================================
// auth.js - Système d'authentification AFRIMARKET
// NOUVEAU PROJET SUPABASE - 12/02/2026
// ============================================

// ✅ NOUVELLES CLÉS SUPABASE
const SUPABASE_URL = 'https://xfbwimnwsixflypsvqfv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYndpbW53c2l4Zmx5cHN2cWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTYyNTQsImV4cCI6MjA4NjQ5MjI1NH0.34RMdbAC_3XWxutD6X2GgF9odULkx46bpBY-V3hSUp8';

// Initialisation Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// INSCRIPTION
// ============================================
window.inscrireUtilisateur = async function(userData) {
    try {
        console.log('📝 Inscription:', userData.email);
        
        // 1. CRÉER DANS AUTH
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
        
        if (error) throw error;
        console.log('✅ Auth OK:', data.user.id);
        
        // 2. CRÉER DANS users
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                email: userData.email,
                nom_complet: userData.nom_complet,
                telephone: userData.telephone || '',
                role: 'user',
                statut: 'active',
                created_at: new Date().toISOString()
            });
        
        if (userError) throw userError;
        console.log('✅ users OK');
        
        // 3. GÉNÉRER CODE DE PARRAINAGE
        const refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 4. CRÉER DANS referral_data
        const { error: refError } = await supabase
            .from('referral_data')
            .insert({
                user_id: data.user.id,
                referral_code: refCode,
                referral_link: 'https://afrimarket-prod.vercel.app/index.html?ref=' + refCode,
                is_unlocked: false,
                created_at: new Date().toISOString()
            });
        
        if (refError) throw refError;
        console.log('✅ referral_data OK, code:', refCode);
        
        // 5. STOCKER EN LOCAL
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', userData.nom_complet);
        localStorage.setItem('afrimarket_user_role', 'user');
        localStorage.setItem('afrimarket_referral_code', refCode);
        
        return { 
            success: true, 
            message: '✅ Inscription réussie !',
            user: data.user,
            referral_code: refCode
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        
        if (error.message?.includes('already registered')) {
            return { success: false, error: 'Cet email est déjà utilisé' };
        }
        if (error.message?.includes('duplicate key')) {
            return { success: false, error: 'Email déjà utilisé' };
        }
        
        return { success: false, error: 'Erreur technique. Veuillez réessayer.' };
    }
};

// ============================================
// CONNEXION
// ============================================
window.connecterUtilisateur = async function(email, password) {
    try {
        console.log('🔑 Connexion:', email);
        
        // ADMIN DIRECT
        if (email === 'abdoula14cherif@gmail.com' && password === 'abdoula.@5') {
            console.log('✅ Admin connecté');
            localStorage.setItem('afrimarket_logged_in', 'true');
            localStorage.setItem('afrimarket_user_email', email);
            localStorage.setItem('afrimarket_user_name', 'Abdoula Cherif');
            localStorage.setItem('afrimarket_user_role', 'admin');
            localStorage.setItem('afrimarket_user_id', 'admin-' + Date.now());
            return { 
                success: true, 
                message: '✅ Connexion admin réussie',
                redirect: 'admin.html' 
            };
        }
        
        // CONNEXION NORMALE
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        
        if (error) throw error;
        console.log('✅ Auth OK:', data.user.id);
        
        // RÉCUPÉRER LE NOM
        let userName = data.user.user_metadata?.nom_complet || 'Utilisateur';
        
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', userName);
        localStorage.setItem('afrimarket_user_role', 'user');
        
        return { 
            success: true, 
            message: '✅ Connexion réussie',
            redirect: 'dashboard.html' 
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        return { 
            success: false, 
            error: 'Email ou mot de passe incorrect' 
        };
    }
};

// ============================================
// DÉCONNEXION
// ============================================
window.deconnecterUtilisateur = async function() {
    try {
        await supabase.auth.signOut();
    } catch (e) {}
    
    const theme = localStorage.getItem('afrimarket_theme');
    localStorage.clear();
    if (theme) localStorage.setItem('afrimarket_theme', theme);
    window.location.href = 'connexion.html';
};

// ============================================
// VÉRIFICATION SESSION
// ============================================
window.verifierSession = async function() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            localStorage.setItem('afrimarket_logged_in', 'true');
            localStorage.setItem('afrimarket_user_id', session.user.id);
            localStorage.setItem('afrimarket_user_email', session.user.email);
            return { loggedIn: true, user: session.user };
        }
        
        // Fallback localStorage
        const localLoggedIn = localStorage.getItem('afrimarket_logged_in') === 'true';
        const localEmail = localStorage.getItem('afrimarket_user_email');
        
        if (localLoggedIn && localEmail) {
            return { 
                loggedIn: true, 
                user: { 
                    email: localEmail,
                    id: localStorage.getItem('afrimarket_user_id')
                },
                fromLocalStorage: true 
            };
        }
        
        return { loggedIn: false, user: null };
        
    } catch (error) {
        console.error('Erreur session:', error);
        return { loggedIn: false, user: null };
    }
};

// ============================================
// UTILITAIRES
// ============================================
window.estConnecte = function() {
    return localStorage.getItem('afrimarket_logged_in') === 'true';
};

window.obtenirUtilisateur = function() {
    if (!window.estConnecte()) return null;
    return {
        id: localStorage.getItem('afrimarket_user_id'),
        email: localStorage.getItem('afrimarket_user_email'),
        nom_complet: localStorage.getItem('afrimarket_user_name'),
        role: localStorage.getItem('afrimarket_user_role') || 'user'
    };
};

console.log('✅ Auth prêt - Nouveau projet Supabase');