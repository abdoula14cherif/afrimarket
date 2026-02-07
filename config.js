// ============================================
// config.js - CONFIGURATION COMPLÈTE AFRIMARKET
// ============================================

// Configuration Supabase
const SUPABASE_CONFIG = {
    // URL de votre projet Supabase
    URL: 'https://mpxlbzsyilvzmgbfopkm.supabase.co',
    
    // Clé publique anon (toujours safe pour le frontend)
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGxienN5aWx2em1nYmZvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzQ1MTksImV4cCI6MjA4NTg1MDUxOX0.M29oom7n6zJb7iC9QzBCF3w2IyGPBkvps1t76i_6PAA',
    
    // Options supplémentaires
    OPTIONS: {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
};

// Configuration de l'application
const APP_CONFIG = {
    // Informations générales
    APP_NAME: 'AFRIMARKET',
    VERSION: '1.0.0',
    ENVIRONMENT: 'production',
    
    // URLs
    BASE_URL: 'https://afrimarket-prod.vercel.app',
    API_URL: 'https://afrimarket-prod.vercel.app/api',
    
    // Fonctionnalités
    FEATURES: {
        AUTH: true,
        UPLOAD: true,
        NOTIFICATIONS: true,
        MESSAGES: true,
        FAVORITES: true
    },
    
    // Paramètres
    SETTINGS: {
        ITEMS_PER_PAGE: 20,
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 heures
        CACHE_DURATION: 3600 // 1 heure en secondes
    },
    
    // Catégories par défaut
    DEFAULT_CATEGORIES: [
        { id: 1, nom: 'Électronique', icone: 'fas fa-laptop', couleur: '#2563EB' },
        { id: 2, nom: 'Téléphones', icone: 'fas fa-mobile-alt', couleur: '#DC2626' },
        { id: 3, nom: 'Véhicules', icone: 'fas fa-car', couleur: '#F97316' },
        { id: 4, nom: 'Immobilier', icone: 'fas fa-home', couleur: '#10B981' },
        { id: 5, nom: 'Mode', icone: 'fas fa-tshirt', couleur: '#8B5CF6' },
        { id: 6, nom: 'Services', icone: 'fas fa-tools', couleur: '#6366F1' },
        { id: 7, nom: 'Emploi', icone: 'fas fa-briefcase', couleur: '#EC4899' },
        { id: 8, nom: 'Actualités', icone: 'fas fa-newspaper', couleur: '#F59E0B' },
        { id: 9, nom: 'Événements', icone: 'fas fa-calendar-alt', couleur: '#14B8A6' },
        { id: 10, nom: 'Divers', icone: 'fas fa-box', couleur: '#64748B' }
    ]
};

// Messages de l'application
const MESSAGES = {
    // Succès
    SUCCESS: {
        PUBLISHED: '✅ Annonce publiée avec succès !',
        UPDATED: '✅ Modifications enregistrées.',
        DELETED: '✅ Élément supprimé.',
        SAVED: '✅ Enregistré avec succès.',
        LOGGED_IN: '✅ Connexion réussie !',
        SIGNED_UP: '✅ Inscription réussie ! Bienvenue !'
    },
    
    // Erreurs
    ERRORS: {
        NETWORK: '❌ Erreur de connexion. Vérifiez votre internet.',
        AUTH_REQUIRED: '🔒 Vous devez être connecté pour cette action.',
        UPLOAD_FAILED: '❌ Erreur lors de l\'upload de l\'image.',
        INVALID_DATA: '❌ Données invalides. Veuillez vérifier.',
        NOT_FOUND: '❌ Élément non trouvé.',
        PERMISSION_DENIED: '❌ Vous n\'avez pas la permission.',
        GENERIC: '❌ Une erreur est survenue. Veuillez réessayer.'
    },
    
    // Validations
    VALIDATION: {
        REQUIRED: 'Ce champ est obligatoire',
        EMAIL: 'Veuillez entrer un email valide',
        PASSWORD_LENGTH: 'Le mot de passe doit faire au moins 8 caractères',
        PASSWORD_MATCH: 'Les mots de passe ne correspondent pas',
        PHONE: 'Numéro de téléphone invalide',
        PRICE: 'Prix invalide'
    },
    
    // Confirmations
    CONFIRM: {
        DELETE: 'Êtes-vous sûr de vouloir supprimer ?',
        LOGOUT: 'Voulez-vous vous déconnecter ?',
        CANCEL: 'Voulez-vous annuler les modifications ?'
    }
};

// Services disponibles
const SERVICES = {
    WHATSAPP: {
        ENABLED: true,
        BASE_URL: 'https://wa.me/',
        MESSAGE_PREFIX: 'Bonjour, je suis intéressé par votre annonce : '
    },
    
    EMAIL: {
        ENABLED: false, // À activer plus tard
        CONTACT: 'contact@afrimarket.app'
    },
    
    MAPS: {
        ENABLED: false,
        API_KEY: '',
        DEFAULT_ZOOM: 12
    }
};

// Fonctions utilitaires de configuration
const ConfigUtils = {
    // Vérifier la configuration
    checkConfig() {
        console.group('🔧 Configuration AFRIMARKET');
        console.log('📱 App:', APP_CONFIG.APP_NAME, 'v' + APP_CONFIG.VERSION);
        console.log('🌍 Environnement:', APP_CONFIG.ENVIRONMENT);
        console.log('🔗 Base URL:', APP_CONFIG.BASE_URL);
        console.log('🗄️ Supabase:', SUPABASE_CONFIG.URL ? '✅ Connecté' : '❌ Erreur');
        console.log('🎯 Fonctionnalités:', Object.keys(APP_CONFIG.FEATURES).filter(k => APP_CONFIG.FEATURES[k]).join(', '));
        console.groupEnd();
        
        // Vérifications critiques
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
            console.error('❌ Configuration Supabase incomplète !');
            return false;
        }
        
        return true;
    },
    
    // Obtenir la configuration pour l'environnement
    getEnvironmentConfig() {
        const env = APP_CONFIG.ENVIRONMENT;
        
        const configs = {
            development: {
                debug: true,
                logLevel: 'debug',
                apiCache: false
            },
            production: {
                debug: false,
                logLevel: 'error',
                apiCache: true
            },
            staging: {
                debug: true,
                logLevel: 'warn',
                apiCache: false
            }
        };
        
        return configs[env] || configs.production;
    },
    
    // Initialiser l'application
    initialize() {
        // Vérifier la configuration
        const configValid = this.checkConfig();
        
        if (!configValid) {
            console.warn('⚠️ Configuration incomplète - mode démo activé');
            this.enableDemoMode();
        }
        
        // Appliquer les paramètres d'environnement
        const envConfig = this.getEnvironmentConfig();
        window.APP_DEBUG = envConfig.debug;
        
        return configValid;
    },
    
    // Mode démo (fallback)
    enableDemoMode() {
        console.warn('🔧 Mode démo activé');
        // Rien à faire pour l'instant, juste un warning
    },
    
    // Obtenir l'URL complète
    getFullUrl(path = '') {
        return APP_CONFIG.BASE_URL + (path.startsWith('/') ? path : '/' + path);
    },
    
    // Obtenir l'URL de l'API
    getApiUrl(endpoint = '') {
        return APP_CONFIG.API_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
    }
};

// Exposer au global scope
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.APP_CONFIG = APP_CONFIG;
window.MESSAGES = MESSAGES;
window.SERVICES = SERVICES;
window.ConfigUtils = ConfigUtils;

// Initialiser automatiquement
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        ConfigUtils.initialize();
        console.log('🎯 Configuration AFRIMARKET chargée');
    });
}

// Export pour modules (si supporté)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        APP_CONFIG,
        MESSAGES,
        SERVICES,
        ConfigUtils
    };
}