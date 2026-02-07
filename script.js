// script.js - Logique principale AFRIMARKET

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('AFRIMARKET initialisé');
    initTheme();
    initNavigation();
    loadCategories();
    loadRecentAds();
});

// ===== THÈME =====
function initTheme() {
    const themeBtn = document.getElementById('theme-btn');
    const savedTheme = localStorage.getItem('afrimarket_theme') || 'light-mode';
    
    // Appliquer thème
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);
    
    // Gérer le bouton
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light-mode' : 'dark-mode';
    
    document.body.className = newTheme;
    localStorage.setItem('afrimarket_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-btn');
    if (!themeBtn) return;
    
    const icon = themeBtn.querySelector('i');
    if (theme === 'dark-mode') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// ===== NAVIGATION =====
function initNavigation() {
    // Mettre en évidence la page active
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('a[href]');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ===== CATÉGORIES =====
async function loadCategories() {
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) return;
    
    try {
        // Catégories par défaut (en attendant Supabase)
        const categories = [
            { id: 1, nom: 'Électronique', icone: 'fas fa-laptop', couleur: '#2563EB' },
            { id: 2, nom: 'Téléphones', icone: 'fas fa-mobile-alt', couleur: '#DC2626' },
            { id: 3, nom: 'Véhicules', icone: 'fas fa-car', couleur: '#F97316' },
            { id: 4, nom: 'Immobilier', icone: 'fas fa-home', couleur: '#10B981' },
            { id: 5, nom: 'Mode', icone: 'fas fa-tshirt', couleur: '#8B5CF6' },
            { id: 6, nom: 'Services', icone: 'fas fa-tools', couleur: '#6366F1' }
        ];
        
        categoriesGrid.innerHTML = '';
        
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.style.borderLeft = `4px solid ${cat.couleur}`;
            card.innerHTML = `
                <i class="${cat.icone}"></i>
                <h4>${cat.nom}</h4>
            `;
            
            card.addEventListener('click', () => {
                filterByCategory(cat.id);
            });
            
            categoriesGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        categoriesGrid.innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

function filterByCategory(categoryId) {
    alert(`Filtrer par catégorie ${categoryId}`);
    // À implémenter avec Supabase
}

// ===== ANNONCES =====
async function loadRecentAds() {
    const adsGrid = document.getElementById('ads-grid');
    if (!adsGrid) return;
    
    try {
        // Données de test (en attendant Supabase)
        const ads = [
            {
                id: 1,
                titre: 'iPhone 12 Pro Max',
                description: '256Go, état impeccable, avec facture originale',
                prix: 750,
                ville: 'Abidjan',
                categorie: 'Téléphones'
            },
            {
                id: 2,
                titre: 'Appartement 3 pièces',
                description: 'Résidence sécurisée, proche centre ville',
                prix: 150000,
                ville: 'Dakar',
                categorie: 'Immobilier'
            },
            {
                id: 3,
                titre: 'Toyota RAV4 2018',
                description: 'Diesel, 75000km, entretien à jour',
                prix: 12000,
                ville: 'Lomé',
                categorie: 'Véhicules'
            },
            {
                id: 4,
                titre: 'Service plomberie',
                description: 'Plombier professionnel disponible 24/7',
                prix: null,
                ville: 'Bamako',
                categorie: 'Services'
            }
        ];
        
        adsGrid.innerHTML = '';
        
        ads.forEach(ad => {
            const card = document.createElement('div');
            card.className = 'ad-card';
            card.innerHTML = `
                <div class="ad-image">
                    <i class="fas fa-image fa-3x"></i>
                </div>
                <div class="ad-content">
                    <h3 class="ad-title">${ad.titre}</h3>
                    ${ad.prix ? `<div class="ad-price">${ad.prix.toLocaleString()} FCFA</div>` : ''}
                    <p class="ad-description">${ad.description}</p>
                    <div class="ad-footer">
                        <div class="ad-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${ad.ville}
                        </div>
                        <span class="ad-category">${ad.categorie}</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                viewAdDetails(ad.id);
            });
            
            adsGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erreur chargement annonces:', error);
        adsGrid.innerHTML = '<p class="error">Aucune annonce disponible</p>';
    }
}

function viewAdDetails(adId) {
    alert(`Voir détails annonce ${adId}`);
    // À implémenter
}

// ===== UTILITAIRES =====
function showNotification(message, type = 'info') {
    // Créer une notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Fermer automatiquement après 5s
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Fermer au clic
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// ===== SUPABASE =====
// Ces fonctions seront complétées quand Supabase sera configuré
window.loadCategoriesFromSupabase = async function() {
    try {
        if (!window.supabaseClient) {
            console.warn('Supabase non initialisé');
            return [];
        }
        
        const { data, error } = await window.supabaseClient
            .from('categories')
            .select('*')
            .order('nom');
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('Erreur Supabase:', error);
        return [];
    }
};

window.loadAdsFromSupabase = async function() {
    try {
        if (!window.supabaseClient) {
            console.warn('Supabase non initialisé');
            return [];
        }
        
        const { data, error } = await window.supabaseClient
            .from('annonces')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('Erreur Supabase:', error);
        return [];
    }
};

// ===== EXPORT =====
// Exposer les fonctions globalement
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.loadCategories = loadCategories;
window.loadRecentAds = loadRecentAds;
window.showNotification = showNotification;
