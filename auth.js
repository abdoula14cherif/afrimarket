// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = 'https://xfbwimnwsixflypsvqfv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYndpbW53c2l4Zmx5cHN2cWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTYyNTQsImV4cCI6MjA4NjQ5MjI1NH0.34RMdbAC_3XWxutD6X2GgF9odULkx46bpBY-V3hSUp8';

// Initialiser Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// ============================================
// FONCTIONS D'AUTHENTIFICATION
// ============================================

/**
 * Inscription d'un nouvel utilisateur
 */
async function inscrireUtilisateur(userData) {
    try {
        console.log('📝 Inscription:', userData.email);
        
        // 1. CRÉER L'UTILISATEUR DANS SUPABASE AUTH
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    phone: userData.telephone || ''
                }
            }
        });
        
        if (authError) {
            console.error('❌ Erreur auth:', authError);
            if (authError.message.includes('already registered')) {
                return { success: false, error: 'Un compte existe déjà avec cet email' };
            }
            return { success: false, error: authError.message };
        }
        
        if (!authData.user) {
            return { success: false, error: 'Erreur création utilisateur' };
        }
        
        // 2. INSÉRER DANS LA TABLE users
        try {
            await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    nom_complet: userData.nom_complet,
                    phone: userData.telephone || '',
                    role: 'user',
                    is_admin: false,
                    statut: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            console.log('✅ users OK');
        } catch (e) {
            console.error('⚠️ Erreur users:', e);
        }
        
        // 3. GÉNÉRER UN CODE DE PARRAINAGE PERSONNALISÉ
        const personalCode = generatePersonalCode(userData.nom_complet);
        const referralLink = `${window.location.origin}/index.html?ref=${personalCode}`;
        
        // 4. CRÉER LE CODE DE PARRAINAGE
        try {
            await supabase
                .from('referral_data')
                .insert({
                    user_id: authData.user.id,
                    referral_code: personalCode,
                    referral_link: referralLink,
                    is_unlocked: false,
                    unlocked_at: null,
                    direct_count: 0,
                    level2_count: 0,
                    level3_count: 0,
                    direct_earnings: 0,
                    level2_earnings: 0,
                    level3_earnings: 0,
                    total_earned: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            console.log('✅ referral_data OK - Code:', personalCode);
        } catch (e) {
            console.error('⚠️ Erreur referral_data:', e);
        }
        
        // 5. CRÉER LA RELATION DE PARRAINAGE
        if (userData.referral_code) {
            try {
                const { data: referrerData } = await supabase
                    .from('referral_data')
                    .select('user_id')
                    .eq('referral_code', userData.referral_code)
                    .maybeSingle();
                
                if (referrerData) {
                    await supabase
                        .from('referral_relationships')
                        .insert({
                            referrer_id: referrerData.user_id,
                            referred_user_id: authData.user.id,
                            level: 1,
                            commission_earned: 0,
                            created_at: new Date().toISOString()
                        });
                    console.log('✅ Relation parrainage créée');
                }
            } catch (e) {
                console.error('⚠️ Erreur création relation:', e);
            }
        }
        
        // 6. CRÉER LE SOLDE
        try {
            await supabase
                .from('balances')
                .insert({
                    user_id: authData.user.id,
                    amount: 0,
                    currency: 'FCFA',
                    total_earned: 0,
                    total_withdrawn: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            console.log('✅ balances OK');
        } catch (e) {
            console.error('⚠️ Erreur balances:', e);
        }
        
        // 7. STOCKER EN LOCAL
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', authData.user.id);
        localStorage.setItem('afrimarket_user_email', authData.user.email);
        localStorage.setItem('afrimarket_user_name', userData.nom_complet);
        localStorage.setItem('afrimarket_user_role', 'user');
        localStorage.setItem('afrimarket_my_referral_code', personalCode);
        localStorage.setItem('afrimarket_referral_unlocked', 'false');
        
        return { 
            success: true, 
            message: '✅ Inscription réussie !',
            code: personalCode
        };
        
    } catch (error) {
        console.error('❌ ERREUR:', error);
        return { success: false, error: 'Erreur technique' };
    }
}

/**
 * Connexion utilisateur
 */
async function connecterUtilisateur(email, password) {
    try {
        console.log('🔐 Connexion:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Erreur:', error);
            if (error.message.includes('Invalid login credentials')) {
                return { success: false, error: 'Email ou mot de passe incorrect' };
            }
            return { success: false, error: error.message };
        }
        
        if (!data.user) {
            return { success: false, error: 'Erreur de connexion' };
        }
        
        // Récupérer les infos utilisateur
        let userData = null;
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            userData = profile;
        } catch (e) {}
        
        const isAdmin = data.user.email === 'abdoula14cherif@gmail.com';
        const nomComplet = userData?.nom_complet || data.user.user_metadata?.nom_complet || data.user.email.split('@')[0];
        
        // Stocker en local
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', nomComplet);
        localStorage.setItem('afrimarket_user_role', isAdmin ? 'admin' : 'user');
        
        // Récupérer le code de parrainage
        try {
            const { data: referral } = await supabase
                .from('referral_data')
                .select('referral_code, is_unlocked')
                .eq('user_id', data.user.id)
                .single();
            
            if (referral) {
                localStorage.setItem('afrimarket_my_referral_code', referral.referral_code);
                localStorage.setItem('afrimarket_referral_unlocked', referral.is_unlocked ? 'true' : 'false');
            }
        } catch (e) {}
        
        return {
            success: true,
            message: isAdmin ? '✅ Connexion admin réussie' : '✅ Connexion réussie',
            redirect: isAdmin ? 'admin.html' : 'dashboard.html'
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        return { success: false, error: 'Erreur technique' };
    }
}

/**
 * Déconnexion
 */
async function deconnecterUtilisateur() {
    try {
        await supabase.auth.signOut();
        const theme = localStorage.getItem('afrimarket_theme');
        localStorage.clear();
        if (theme) localStorage.setItem('afrimarket_theme', theme);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error);
        return { success: false };
    }
}

/**
 * Vérifier si l'utilisateur est connecté
 */
function estConnecte() {
    return localStorage.getItem('afrimarket_logged_in') === 'true';
}

/**
 * Rediriger si non connecté
 */
function requireAuth() {
    if (!estConnecte()) {
        window.location.href = 'connexion.html';
        return false;
    }
    return true;
}

/**
 * Rediriger si déjà connecté
 */
function redirectIfAuthenticated() {
    if (estConnecte()) {
        const role = localStorage.getItem('afrimarket_user_role');
        window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        return true;
    }
    return false;
}

/**
 * Générer un code de parrainage personnel
 */
function generatePersonalCode(nomComplet) {
    const prenom = nomComplet.split(' ')[0].toUpperCase();
    const prefix = prenom.substring(0, Math.min(4, prenom.length));
    const randomNum = Math.floor(Math.random() * 9000 + 1000);
    return prefix + randomNum;
}

/**
 * Valider un code de parrainage
 */
async function validateReferralCode(code) {
    if (!code) return false;
    
    const demoCode = ['ADMIN2026', 'TEST123', 'DEMO', 'AFRIMARKET'];
    if (demoCode.includes(code.toUpperCase())) {
        return true;
    }
    
    try {
        const { data } = await supabase
            .from('referral_data')
            .select('referral_code')
            .eq('referral_code', code.toUpperCase())
            .maybeSingle();
        return !!data;
    } catch (e) {
        return false;
    }
}

/**
 * Récupérer le code de parrainage depuis l'URL
 */
function getReferralCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('ref');
    
    if (!code && window.location.pathname.includes('/ref/')) {
        code = window.location.pathname.split('/ref/')[1];
        if (code) code = code.split('/')[0].split('?')[0];
    }
    
    return code ? code.toUpperCase() : null;
}

/**
 * Afficher une notification toast
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// EXPORTER LES FONCTIONS
// ============================================
window.inscrireUtilisateur = inscrireUtilisateur;
window.connecterUtilisateur = connecterUtilisateur;
window.deconnecterUtilisateur = deconnecterUtilisateur;
window.estConnecte = estConnecte;
window.requireAuth = requireAuth;
window.redirectIfAuthenticated = redirectIfAuthenticated;
window.validateReferralCode = validateReferralCode;
window.getReferralCodeFromURL = getReferralCodeFromURL;
window.showToast = showToast;
window.generatePersonalCode = generatePersonalCode;
window.supabase = supabase;