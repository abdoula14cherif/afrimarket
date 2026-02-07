// auth.js - Version ultra-simple et fonctionnelle
console.log('🔧 Chargement de auth.js...');

// Configuration Supabase
const SUPABASE_URL = 'https://mpxlbzsyilvzmgbfopkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA';

// Variable Supabase
let supabaseClient = null;

// Initialiser Supabase
function initSupabase() {
    try {
        if (window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
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

// Fonction d'inscription SIMPLIFIÉE
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
        // 1. Inscrire l'utilisateur
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
            if (error.message.includes('already registered')) {
                return { success: false, error: 'Cet email est déjà utilisé' };
            } else if (error.message.includes('password')) {
                return { success: false, error: 'Mot de passe trop faible (minimum 6 caractères)' };
            } else if (error.message.includes('email')) {
                return { success: false, error: 'Email invalide' };
            } else {
                return { success: false, error: error.message };
            }
        }
        
        console.log('✅ Utilisateur créé:', data.user?.id);
        
        // 2. Essayer de créer le profil (optionnel)
        if (data.user) {
            try {
                const { error: dbError } = await supabaseClient
                    .from('utilisateurs')
                    .insert({
                        id: data.user.id,
                        email: userData.email,
                        nom_complet: userData.nom_complet,
                        telephone: userData.telephone,
                        ville: userData.ville,
                        created_at: new Date().toISOString()
                    });
                    
                if (dbError) {
                    console.warn('⚠️ Table utilisateurs non créée:', dbError.message);
                    console.log('💡 Créez la table "utilisateurs" dans Supabase avec les colonnes: id, email, nom_complet, telephone, ville, created_at');
                }
            } catch (dbError) {
                console.warn('⚠️ Erreur base de données:', dbError);
            }
            
            // Stocker en localStorage
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('user_name', userData.nom_complet);
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
            error: 'Erreur serveur. Veuillez réessayer.'
        };
    }
}

// Initialiser au chargement
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

// Exporter la fonction
window.inscrireUtilisateur = inscrireUtilisateur;
console.log('✅ auth.js prêt, fonction inscrireUtilisateur disponible');