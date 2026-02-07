// =============================================
// CONFIGURATION SUPABASE
// =============================================
const SUPABASE_URL = 'https://mpxlbzsyilvzmgbfopkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA';

// Initialiser Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// FONCTIONS D'AUTHENTIFICATION
// =============================================

/**
 * Inscrire un nouvel utilisateur
 * @param {Object} userData - Données utilisateur
 * @returns {Promise<Object>} Résultat de l'inscription
 */
async function inscrireUtilisateur(userData) {
    try {
        console.log('🔄 Tentative d\'inscription pour:', userData.email);

        // Valider les données
        if (!userData.email || !userData.password || !userData.nom_complet) {
            return {
                success: false,
                error: 'Email, mot de passe et nom complet sont obligatoires'
            };
        }

        // 1. Inscription avec Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    nom_complet: userData.nom_complet,
                    telephone: userData.telephone || '',
                    ville: userData.ville || ''
                },
                emailRedirectTo: window.location.origin // Pour la confirmation d'email
            }
        });

        // Gestion des erreurs Auth
        if (authError) {
            console.error('❌ Erreur Auth:', authError);
            
            // Messages d'erreur plus conviviaux
            let errorMessage = authError.message;
            if (authError.message.includes('already registered')) {
                errorMessage = 'Un compte existe déjà avec cet email';
            } else if (authError.message.includes('password')) {
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
            } else if (authError.message.includes('email')) {
                errorMessage = 'Email invalide';
            }
            
            return { success: false, error: errorMessage };
        }

        console.log('✅ Utilisateur auth créé:', authData.user.id);

        // 2. Créer l'utilisateur dans la table 'utilisateurs'
        try {
            const { error: dbError } = await supabase
                .from('utilisateurs')
                .insert([
                    {
                        id: authData.user.id,
                        email: userData.email,
                        nom_complet: userData.nom_complet,
                        telephone: userData.telephone || null,
                        ville: userData.ville || null,
                        created_at: new Date().toISOString(),
                        statut: 'actif'
                    }
                ]);

            if (dbError) {
                console.warn('⚠️ Erreur création profil:', dbError);
                
                // Si la table n'existe pas, on la crée
                if (dbError.message.includes('does not exist')) {
                    console.log('📋 Table utilisateurs non trouvée, création en cours...');
                    await creerTableUtilisateurs();
                    
                    // Réessayer l'insertion
                    const { error: retryError } = await supabase
                        .from('utilisateurs')
                        .insert([
                            {
                                id: authData.user.id,
                                email: userData.email,
                                nom_complet: userData.nom_complet,
                                telephone: userData.telephone || null,
                                ville: userData.ville || null,
                                created_at: new Date().toISOString()
                            }
                        ]);
                    
                    if (retryError) {
                        console.error('❌ Erreur insertion après création table:', retryError);
                    }
                }
            } else {
                console.log('✅ Profil utilisateur créé avec succès');
            }
        } catch (dbError) {
            console.warn('⚠️ Erreur base de données:', dbError);
            // On continue même avec l'erreur DB, l'utilisateur est créé dans Auth
        }

        // 3. Connecter automatiquement l'utilisateur après inscription
        if (authData.user) {
            // Stocker les informations de session
            localStorage.setItem('afrimarket_user_id', authData.user.id);
            localStorage.setItem('afrimarket_user_email', authData.user.email);
            localStorage.setItem('afrimarket_user_name', userData.nom_complet);
            
            // Mettre à jour l'état de connexion
            window.dispatchEvent(new CustomEvent('auth-change', { 
                detail: { loggedIn: true, user: authData.user } 
            }));
        }

        return { 
            success: true, 
            message: authData.user.identities && authData.user.identities.length === 0 
                ? 'Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.' 
                : 'Inscription réussie ! Vous êtes maintenant connecté.',
            user: authData.user,
            requiresConfirmation: authData.user.identities && authData.user.identities.length === 0
        };

    } catch (error) {
        console.error('❌ Erreur générale inscription:', error);
        return { 
            success: false, 
            error: error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.' 
        };
    }
}

/**
 * Créer la table utilisateurs si elle n'existe pas
 */
async function creerTableUtilisateurs() {
    // Cette fonction nécessiterait des privilèges admin
    // Pour l'instant, on affiche juste des instructions
    console.log(`
    ⚠️ IMPORTANT: Créez la table 'utilisateurs' dans Supabase:
    
    1. Allez sur https://supabase.com/dashboard/project/mpxlbzsyilvzmgbfopkm
    2. Cliquez sur "Table Editor"
    3. Cliquez sur "Create a new table"
    4. Nom: "utilisateurs"
    5. Colonnes:
       - id: UUID (Primary Key, references auth.users(id))
       - email: TEXT
       - nom_complet: TEXT
       - telephone: TEXT (nullable)
       - ville: TEXT (nullable)
       - created_at: TIMESTAMP
       - statut: TEXT (default: 'actif')
    
    6. Sauvegarder
    `);
    
    return { success: false, message: 'Table à créer manuellement' };
}

/**
 * Connecter un utilisateur existant
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Résultat de la connexion
 */
async function connecterUtilisateur(email, password) {
    try {
        console.log('🔄 Tentative de connexion pour:', email);

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
                errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
            }
            
            return { success: false, error: errorMessage };
        }

        console.log('✅ Connexion réussie:', data.user.id);
        
        // Stocker les informations utilisateur
        localStorage.setItem('afrimarket_user_id', data.user.id);
        localStorage.setItem('afrimarket_user_email', data.user.email);
        localStorage.setItem('afrimarket_user_name', data.user.user_metadata?.nom_complet || '');
        
        // Mettre à jour l'état de connexion
        window.dispatchEvent(new CustomEvent('auth-change', { 
            detail: { loggedIn: true, user: data.user } 
        }));

        return { 
            success: true, 
            user: data.user,
            message: 'Connexion réussie !'
        };
    } catch (error) {
        console.error('❌ Erreur générale connexion:', error);
        return { 
            success: false, 
            error: error.message || 'Erreur de connexion' 
        };
    }
}

/**
 * Déconnecter l'utilisateur
 * @returns {Promise<Object>} Résultat de la déconnexion
 */
async function deconnecterUtilisateur() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        // Supprimer les informations du localStorage
        localStorage.removeItem('afrimarket_user_id');
        localStorage.removeItem('afrimarket_user_email');
        localStorage.removeItem('afrimarket_user_name');
        
        // Mettre à jour l'état de connexion
        window.dispatchEvent(new CustomEvent('auth-change', { 
            detail: { loggedIn: false, user: null } 
        }));
        
        return { success: true, message: 'Déconnexion réussie' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Vérifier la session active
 * @returns {Promise<Object>} État de la session
 */
async function verifierSession() {
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            return { loggedIn: false, user: null, error: error.message };
        }
        
        const loggedIn = !!data.session;
        
        if (loggedIn && data.session.user) {
            // Mettre à jour le localStorage
            localStorage.setItem('afrimarket_user_id', data.session.user.id);
            localStorage.setItem('afrimarket_user_email', data.session.user.email);
            localStorage.setItem('afrimarket_user_name', data.session.user.user_metadata?.nom_complet || '');
        }
        
        return { 
            loggedIn: loggedIn, 
            user: data.session?.user || null,
            session: data.session
        };
    } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        return { loggedIn: false, user: null, error: error.message };
    }
}

/**
 * Vérifier si l'utilisateur est connecté (version simplifiée)
 * @returns {boolean} True si connecté
 */
function estConnecte() {
    return !!localStorage.getItem('afrimarket_user_id');
}

/**
 * Obtenir les informations de l'utilisateur connecté
 * @returns {Object|null} Informations utilisateur
 */
function obtenirUtilisateur() {
    if (!estConnecte()) return null;
    
    return {
        id: localStorage.getItem('afrimarket_user_id'),
        email: localStorage.getItem('afrimarket_user_email'),
        nom_complet: localStorage.getItem('afrimarket_user_name')
    };
}

/**
 * Réinitialiser le mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<Object>} Résultat
 */
async function reinitialiserMotDePasse(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            message: 'Un email de réinitialisation a été envoyé' 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour le profil utilisateur
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Résultat
 */
async function mettreAJourProfil(updates) {
    try {
        // Mettre à jour dans Auth
        const { data: authData, error: authError } = await supabase.auth.updateUser({
            data: updates
        });

        if (authError) {
            return { success: false, error: authError.message };
        }

        // Mettre à jour dans la table utilisateurs
        const { error: dbError } = await supabase
            .from('utilisateurs')
            .update(updates)
            .eq('id', authData.user.id);

        if (dbError) {
            console.warn('⚠️ Erreur mise à jour DB:', dbError);
            // On retourne quand même le succès car Auth est mis à jour
        }

        // Mettre à jour le localStorage si le nom change
        if (updates.nom_complet) {
            localStorage.setItem('afrimarket_user_name', updates.nom_complet);
        }

        return { 
            success: true, 
            message: 'Profil mis à jour avec succès',
            user: authData.user 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =============================================
// UTILITAIRES
// =============================================

/**
 * Afficher une notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, warning, info)
 */
function afficherNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotif = document.querySelector('.custom-notification');
    if (existingNotif) existingNotif.remove();

    // Créer la notification
    const notif = document.createElement('div');
    notif.className = `custom-notification ${type}`;
    notif.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 
                           type === 'warning' ? 'fa-exclamation-triangle' : 
                           'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // Styles CSS
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : 
                     '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

    // Style pour le contenu
    const contentStyle = `
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: 15px;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .notification-close:hover {
            opacity: 1;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;

    // Ajouter les styles
    const style = document.createElement('style');
    style.textContent = contentStyle;
    document.head.appendChild(style);

    // Ajouter au DOM
    document.body.appendChild(notif);

    // Fermer au clic
    notif.querySelector('.notification-close').addEventListener('click', () => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    });

    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        if (notif.parentNode) {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }
    }, 5000);
}

/**
 * Gérer les erreurs de formulaire
 * @param {string} fieldId - ID du champ
 * @param {string} message - Message d'erreur
 * @param {boolean} isValid - Si le champ est valide
 */
function gererErreurChamp(fieldId, message, isValid) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    if (!formGroup) return;
    
    // Supprimer les erreurs existantes
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    // Retirer les classes d'erreur précédentes
    field.classList.remove('error');
    formGroup.classList.remove('has-error');
    
    if (!isValid) {
        // Ajouter la classe d'erreur
        field.classList.add('error');
        formGroup.classList.add('has-error');
        
        // Créer le message d'erreur
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 14px;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        
        formGroup.appendChild(errorElement);
    }
}

// =============================================
// EXPORTATION DES FONCTIONS
// =============================================
window.inscrireUtilisateur = inscrireUtilisateur;
window.connecterUtilisateur = connecterUtilisateur;
window.deconnecterUtilisateur = deconnecterUtilisateur;
window.verifierSession = verifierSession;
window.estConnecte = estConnecte;
window.obtenirUtilisateur = obtenirUtilisateur;
window.reinitialiserMotDePasse = reinitialiserMotDePasse;
window.mettreAJourProfil = mettreAJourProfil;
window.afficherNotification = afficherNotification;
window.gererErreurChamp = gererErreurChamp;

console.log('✅ auth.js chargé avec succès');

// Vérifier la session au chargement
document.addEventListener('DOMContentLoaded', async function() {
    const session = await verifierSession();
    if (session.loggedIn) {
        console.log('👤 Utilisateur connecté:', session.user.email);
    }
});