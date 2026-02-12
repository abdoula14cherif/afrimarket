// =============================================
// AUTH.JS - Version sans contrainte
// =============================================

const SUPABASE_URL = 'https://mpxlbzsyilvzmgbfopkm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// INSCRIPTION - ULTRA SIMPLE
// =============================================
window.inscrireUtilisateur = async function(userData) {
    try {
        console.log('📝 Inscription:', userData.email);
        
        // 1. CRÉER L'UTILISATEUR DANS AUTH
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    role: 'user'
                }
            }
        });
        
        if (error) throw error;
        if (!data.user) throw new Error('Erreur création');
        
        console.log('✅ Auth OK:', data.user.id);
        
        // 2. INSÉRER DANS users (SANS CONTRAINTE)
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                email: userData.email,
                nom_complet: userData.nom_complet,
                role: 'user',
                statut: 'active',
                created_at: new Date().toISOString()
            });
        
        if (insertError) {
            console.error('❌ Erreur insertion:', insertError);
            // ON CONTINUE QUAND MÊME - L'UTILISATEUR EST CRÉÉ
        } else {
            console.log('✅ users OK');
        }
        
        // 3. STOCKER EN LOCAL
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', userData.nom_complet);
        
        return { success: true, user: data.user };
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        let message = 'Erreur technique';
        if (error.message.includes('already registered')) {
            message = 'Cet email est déjà utilisé';
        }
        return { success: false, error: message };
    }
};

// =============================================
// CONNEXION
// =============================================
window.connecterUtilisateur = async function(email, password) {
    try {
        // ADMIN
        if (email === 'abdoula14cherif@gmail.com' && password === 'abdoula.@5') {
            localStorage.setItem('afrimarket_logged_in', 'true');
            localStorage.setItem('afrimarket_user_email', email);
            localStorage.setItem('afrimarket_user_name', 'Abdoula Cherif');
            localStorage.setItem('afrimarket_user_role', 'admin');
            return { success: true, redirect: 'admin.html' };
        }
        
        // CONNEXION AUTH
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        
        if (error) throw error;
        
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', data.user.user_metadata?.nom_complet || 'Utilisateur');
        
        return { success: true, redirect: 'dashboard.html' };
        
    } catch (error) {
        return { success: false, error: 'Email ou mot de passe incorrect' };
    }
};

// =============================================
// VÉRIFICATION SESSION - SANS REDIRECTION
// =============================================
window.verifierSession = async function() {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
        localStorage.setItem('afrimarket_logged_in', 'true');
        return { loggedIn: true, user: data.session.user };
    }
    return { loggedIn: false };
};

console.log('✅ Auth chargé - Mode sans contrainte');