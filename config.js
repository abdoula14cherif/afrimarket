// config.js - Configuration AFRIMARKET

// Configuration Supabase
// REMPLACEZ CES VALEURS PAR LES VÔTRES
window.SUPABASE_CONFIG = {
    URL: 'https://VOTRE-ID.supabase.co',          // ← À CHANGER
    ANON_KEY: 'VOTRE-CLE-ANON-PUBLIQUE'          // ← À CHANGER
};

// Configuration de l'application
window.APP_CONFIG = {
    name: 'AFRIMARKET',
    version: '1.0.0',
    environment: 'development',
    features: {
        auth: true,
        upload: true,
        notifications: true
    },
    urls: {
        api: '/api',
        images: 'https://images.unsplash.com'
    }
};

// Messages par défaut
window.MESSAGES = {
    errors: {
        network: 'Erreur de connexion. Vérifiez votre internet.',
        auth: 'Vous devez être connecté pour cette action.',
        upload: 'Erreur lors de l\'upload de l\'image.',
        generic: 'Une erreur est survenue. Veuillez réessayer.'
    },
    success: {
        published: 'Annonce publiée avec succès !',
        saved: 'Modifications enregistrées.',
        deleted: 'Élément supprimé.'
    }
};

// Vérification de la configuration
function checkConfig() {
    if (!window.SUPABASE_CONFIG.URL || window.SUPABASE_CONFIG.URL.includes('VOTRE-ID')) {
        console.warn('⚠️ Configuration Supabase non définie');
        console.log('👉 Allez dans Supabase → Settings → API');
        console.log('👉 Copiez Project URL et anon key');
        console.log('👉 Mettez à jour config.js');
        
        // Mode démo (supprimer en production)
        window.SUPABASE_CONFIG = {
            URL: 'https://demo.supabase.co',
            ANON_KEY: 'demo-key-only'
        };
    }
}

// Exécuter la vérification
checkConfig();
