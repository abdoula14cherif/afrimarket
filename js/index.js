// ============================================
// SCRIPT PRINCIPAL DE LA PAGE D'ACCUEIL AFREMARKET
// ============================================

// Configuration Supabase (déjà dans config.js)
// Les clés sont chargées depuis config.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Afrimarket chargé avec succès');
    
    // Initialisation de toutes les fonctionnalités
    initMobileMenu();
    initSearchBar();
    loadCategories();
    loadFeaturedAnnonces();
    loadRecentAnnonces();
    initScrollAnimations();
    initCounters();
    checkUserSession();
    initNewsletter();
    initThemeToggle();
    initBackToTop();
});

// ============================================
// 1. MENU MOBILE RESPONSIVE
// ============================================
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileMenuBtn || !navLinks) return;
    
    // Créer le menu mobile s'il n'existe pas
    if (!document.querySelector('.mobile-nav')) {
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = `
            <div class="mobile-nav-header">
                <span class="logo">
                    <span class="logo-afri">Afri</span><span class="logo-market">Market</span>
                </span>
                <button class="close-mobile-nav"><i class="fas fa-times"></i></button>
            </div>
            <div class="mobile-nav-links">
                <a href="categories.html"><i class="fas fa-th-large"></i> Catégories</a>
                <a href="connexion.html"><i class="fas fa-sign-in-alt"></i> Connexion</a>
                <a href="inscriptions.html" class="btn-primary"><i class="fas fa-plus-circle"></i> Déposer une annonce</a>
            </div>
            <div class="mobile-nav-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Rechercher...">
            </div>
        `;
        document.body.appendChild(mobileNav);
        
        // Gestionnaire pour ouvrir le menu
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Gestionnaire pour fermer le menu
        const closeBtn = mobileNav.querySelector('.close-mobile-nav');
        closeBtn.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Fermer en cliquant en dehors
        mobileNav.addEventListener('click', function(e) {
            if (e.target === mobileNav) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ============================================
// 2. BARRE DE RECHERCHE AVANCÉE
// ============================================
function initSearchBar() {
    const searchInputs = document.querySelectorAll('.search-bar input, .mobile-nav-search input');
    
    searchInputs.forEach(input => {
        // Recherche en temps réel (debounce)
        let timeout;
        input.addEventListener('input', function(e) {
            clearTimeout(timeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) return;
            
            timeout = setTimeout(() => {
                performSearch(query);
            }, 500);
        });
        
        // Recherche avec Entrée
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `recherche.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    });
}

function performSearch(query) {
    // Simuler une recherche (à remplacer par appel API Supabase)
    console.log('🔍 Recherche:', query);
    
    // Afficher des suggestions (optionnel)
    const suggestions = [
        'iPhone', 'Voiture', 'Appartement', 'Téléphone', 'Ordinateur'
    ].filter(item => item.toLowerCase().includes(query.toLowerCase()));
    
    // Vous pouvez ajouter un dropdown de suggestions ici
}

// ============================================
// 3. CHARGEMENT DES CATÉGORIES
// ============================================
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    try {
        // Afficher un loader
        categoriesGrid.innerHTML = '<div class="loader"></div>';
        
        // Données statiques (à remplacer par appel Supabase)
        const categories = [
            { 
                name: 'Véhicules', 
                icon: 'fa-car', 
                count: 2345,
                color: 'var(--bleu)',
                slug: 'vehicules'
            },
            { 
                name: 'Immobilier', 
                icon: 'fa-home', 
                count: 1234,
                color: 'var(--rouge)',
                slug: 'immobilier'
            },
            { 
                name: 'Emploi', 
                icon: 'fa-briefcase', 
                count: 892,
                color: 'var(--orange)',
                slug: 'emploi'
            },
            { 
                name: 'Mode', 
                icon: 'fa-tshirt', 
                count: 3456,
                color: 'var(--vert)',
                slug: 'mode'
            },
            { 
                name: 'Maison', 
                icon: 'fa-couch', 
                count: 1567,
                color: 'var(--bleu)',
                slug: 'maison'
            },
            { 
                name: 'Multimédia', 
                icon: 'fa-laptop', 
                count: 2789,
                color: 'var(--rouge)',
                slug: 'multimedia'
            },
            { 
                name: 'Services', 
                icon: 'fa-tools', 
                count: 945,
                color: 'var(--orange)',
                slug: 'services'
            },
            { 
                name: 'Autres', 
                icon: 'fa-ellipsis-h', 
                count: 678,
                color: 'var(--vert)',
                slug: 'autres'
            }
        ];
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        
        categoriesGrid.innerHTML = categories.map(cat => `
            <a href="recherche.html?categorie=${cat.slug}" class="category-card" style="--category-color: ${cat.color}">
                <div class="category-icon">
                    <i class="fas ${cat.icon}"></i>
                </div>
                <div class="category-info">
                    <span class="category-name">${cat.name}</span>
                    <span class="category-count">${cat.count.toLocaleString()} annonces</span>
                </div>
            </a>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        categoriesGrid.innerHTML = '<div class="error-message">Erreur de chargement</div>';
    }
}

// ============================================
// 4. CHARGEMENT DES ANNONCES À LA UNE
// ============================================
async function loadFeaturedAnnonces() {
    const featuredGrid = document.getElementById('featuredAnnonces');
    if (!featuredGrid) return;
    
    try {
        // Simuler un chargement depuis Supabase
        const annonces = [
            {
                id: 1,
                title: 'iPhone 14 Pro Max 256GB',
                price: 450000,
                location: 'Abidjan, Cocody',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000),
                category: 'Multimédia',
                images: 3,
                seller: {
                    name: 'Jean K.',
                    rating: 4.8,
                    verified: true
                },
                featured: true,
                urgent: true
            },
            {
                id: 2,
                title: 'Toyota Camry 2020 - Très bon état',
                price: 12500000,
                location: 'Abidjan, Plateau',
                date: new Date(Date.now() - 5 * 60 * 60 * 1000),
                category: 'Véhicules',
                images: 8,
                seller: {
                    name: 'Marie B.',
                    rating: 4.9,
                    verified: true
                },
                featured: true
            },
            {
                id: 3,
                title: 'Appartement 3 pièces + terrasse',
                price: 85000000,
                location: 'Abidjan, Marcory',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                category: 'Immobilier',
                images: 12,
                seller: {
                    name: 'Pierre A.',
                    rating: 4.7,
                    verified: true
                },
                featured: true,
                negociable: true
            },
            {
                id: 4,
                title: 'Tenue traditionnelle homme - Bazin',
                price: 25000,
                location: 'Abidjan, Treichville',
                date: new Date(Date.now() - 3 * 60 * 60 * 1000),
                category: 'Mode',
                images: 5,
                seller: {
                    name: 'Aminata S.',
                    rating: 5.0,
                    verified: false
                },
                featured: true
            }
        ];
        
        featuredGrid.innerHTML = annonces.map(annonce => `
            <div class="featured-card" data-id="${annonce.id}">
                ${annonce.urgent ? '<div class="featured-badge urgent">URGENT</div>' : ''}
                <div class="featured-image">
                    <div class="image-placeholder">
                        <i class="fas fa-camera"></i>
                        <span>${annonce.images} photos</span>
                    </div>
                </div>
                <div class="featured-content">
                    <h3>
                        <a href="annonce.html?id=${annonce.id}">${annonce.title}</a>
                    </h3>
                    <div class="featured-price">
                        ${formatPrice(annonce.price)} FCFA
                        ${annonce.negociable ? '<span class="negociable">Négociable</span>' : ''}
                    </div>
                    <div class="featured-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${annonce.location}
                    </div>
                    <div class="featured-meta">
                        <div class="seller-info">
                            <span class="seller-name">
                                ${annonce.seller.name}
                                ${annonce.seller.verified ? '<i class="fas fa-check-circle verified" title="Vendeur vérifié"></i>' : ''}
                            </span>
                            <div class="seller-rating">
                                ${generateStars(annonce.seller.rating)}
                                <span>${annonce.seller.rating}</span>
                            </div>
                        </div>
                        <div class="featured-actions">
                            <span class="featured-date">
                                <i class="far fa-clock"></i> ${timeAgo(annonce.date)}
                            </span>
                            <button class="btn-favorite" onclick="toggleFavorite(${annonce.id})">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement annonces:', error);
    }
}

// ============================================
// 5. CHARGEMENT DES ANNONCES RÉCENTES
// ============================================
async function loadRecentAnnonces() {
    const recentGrid = document.getElementById('recentAnnonces');
    if (!recentGrid) return;
    
    try {
        const annonces = [
            // Données similaires à featured mais plus récentes
            {
                id: 5,
                title: 'PlayStation 5 + Manettes',
                price: 350000,
                location: 'Abidjan, Yopougon',
                date: new Date(Date.now() - 30 * 60 * 1000),
                category: 'Multimédia',
                images: 4,
                seller: { name: 'Koffi D.', rating: 4.5, verified: false }
            },
            // Ajoutez d'autres annonces...
        ];
        
        // Similaire à loadFeaturedAnnonces
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ============================================
// 6. FONCTIONS UTILITAIRES
// ============================================

// Formater le prix
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Temps relatif (il y a X minutes)
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        an: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `Il y a ${interval} ${unit}${interval > 1 ? 's' : ''}`;
        }
    }
    
    return 'À l\'instant';
}

// Générer des étoiles de notation
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

// Gérer les favoris
window.toggleFavorite = function(annonceId) {
    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        btn.classList.add('active');
        showNotification('Annonce ajoutée aux favoris', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        btn.classList.remove('active');
        showNotification('Annonce retirée des favoris', 'info');
    }
};

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// 7. COMPTEURS (STATISTIQUES)
// ============================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.innerText.replace(/[^0-9]/g, ''));
        const suffix = counter.innerText.replace(/[0-9]/g, '');
        
        let current = 0;
        const increment = target / 50; // 50 étapes
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.innerText = target.toLocaleString() + suffix;
                clearInterval(timer);
            } else {
                counter.innerText = Math.floor(current).toLocaleString() + suffix;
            }
        }, 30);
    });
}

// ============================================
// 8. ANIMATIONS AU SCROLL
// ============================================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.category-card, .featured-card, .step-card, .section-header'
    );
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Animation spéciale pour les cartes
                if (entry.target.classList.contains('category-card') ||
                    entry.target.classList.contains('featured-card') ||
                    entry.target.classList.contains('step-card')) {
                    entry.target.style.animation = 'fadeInScale 0.6s ease forwards';
                }
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => observer.observe(el));
}

// ============================================
// 9. VÉRIFICATION SESSION UTILISATEUR
// ============================================
async function checkUserSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            // Utilisateur connecté
            updateUIForLoggedUser(session.user);
            loadUserNotifications();
        }
    } catch (error) {
        console.error('Erreur session:', error);
    }
}

function updateUIForLoggedUser(user) {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Remplacer les liens de connexion/inscription
    const authLinks = navLinks.querySelectorAll('a[href="connexion.html"], a[href="inscriptions.html"]');
    authLinks.forEach(link => link.remove());
    
    // Ajouter les liens utilisateur
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <button class="user-menu-btn">
            <i class="fas fa-user-circle"></i>
            <span>Mon compte</span>
            <i class="fas fa-chevron-down"></i>
        </button>
        <div class="user-dropdown">
            <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Tableau de bord</a>
            <a href="mes-annonces.html"><i class="fas fa-list"></i> Mes annonces</a>
            <a href="favoris.html"><i class="fas fa-heart"></i> Favoris</a>
            <a href="messages.html"><i class="fas fa-envelope"></i> Messages</a>
            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>
        </div>
    `;
    
    navLinks.appendChild(userMenu);
    
    // Gestionnaire du menu utilisateur
    const menuBtn = userMenu.querySelector('.user-menu-btn');
    menuBtn.addEventListener('click', () => {
        userMenu.classList.toggle('active');
    });
    
    // Fermer en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
            userMenu.classList.remove('active');
        }
    });
    
    // Gestionnaire déconnexion
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        await supabase.auth.signOut();
        window.location.reload();
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
}

function loadUserNotifications() {
    // Charger les notifications de l'utilisateur
    // À implémenter avec Supabase
}

// ============================================
// 10. NEWSLETTER
// ============================================
function initNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = newsletterForm.querySelector('input[type="email"]').value;
        const button = newsletterForm.querySelector('button');
        
        // Validation
        if (!isValidEmail(email)) {
            showNotification('Email invalide', 'error');
            return;
        }
        
        // Simuler l'envoi
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
        
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-paper-plane"></i> S\'inscrire';
            newsletterForm.reset();
            showNotification('Inscription réussie à la newsletter !', 'success');
        }, 2000);
        
        // Ici, vous pouvez envoyer à Supabase
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// 11. THEME (CLAIR/SOMBRE)
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Vérifier le thème sauvegardé
    const savedTheme = localStorage.getItem('afrimarket_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('afrimarket_theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Animation
        themeToggle.classList.add('rotate');
        setTimeout(() => themeToggle.classList.remove('rotate'), 300);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ============================================
// 12. BOUTON RETOUR EN HAUT
// ============================================
function initBackToTop() {
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// 13. AJOUTER LES STYLES DYNAMIQUES
// ============================================
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Styles pour les animations */
        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        /* Loader */
        .loader {
            width: 50px;
            height: 50px;
            border: 4px solid var(--clair);
            border-top-color: var(--bleu);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Notifications */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--blanc);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 10000;
            border-left: 4px solid;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            border-left-color: var(--vert);
        }
        
        .notification.success i {
            color: var(--vert);
        }
        
        .notification.error {
            border-left-color: var(--rouge);
        }
        
        .notification.error i {
            color: var(--rouge);
        }
        
        .notification.info {
            border-left-color: var(--bleu);
        }
        
        .notification.info i {
            color: var(--bleu);
        }
        
        /* Menu utilisateur */
        .user-menu {
            position: relative;
        }
        
        .user-menu-btn {
            background: none;
            border: none;
            padding: 0.6rem 1.2rem;
            border-radius: var(--radius-full);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: var(--noir);
            transition: all 0.3s ease;
        }
        
        .user-menu-btn:hover {
            background: var(--clair);
        }
        
        .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--blanc);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            min-width: 200px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 100;
        }
        
        .user-menu.active .user-dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .user-dropdown a {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0.8rem 1rem;
            color: var(--noir);
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .user-dropdown a:hover {
            background: var(--clair);
            color: var(--bleu);
        }
        
        .user-dropdown a i {
            width: 20px;
            color: var(--gris);
        }
        
        /* Vendeur vérifié */
        .fa-check-circle.verified {
            color: var(--bleu);
            font-size: 0.9rem;
            margin-left: 4px;
        }
        
        /* Badge urgent */
        .featured-badge.urgent {
            background: linear-gradient(135deg, var(--rouge), var(--orange));
        }
        
        /* Négociable */
        .negociable {
            font-size: 0.8rem;
            background: var(--vert-clair);
            color: var(--vert-fonce);
            padding: 2px 8px;
            border-radius: var(--radius-full);
            margin-left: 8px;
        }
        
        /* Bouton retour en haut */
        .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: var(--gradient-primary);
            color: var(--blanc);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: var(--shadow-lg);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
        }
        
        .back-to-top.show {
            opacity: 1;
            visibility: visible;
        }
        
        .back-to-top:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-xl);
        }
        
        /* Animation de rotation */
        .rotate {
            animation: rotate 0.3s ease;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* Mobile Nav */
        .mobile-nav {
            position: fixed;
            top: 0;
            left: -100%;
            width: 80%;
            max-width: 400px;
            height: 100vh;
            background: var(--blanc);
            z-index: 2000;
            transition: left 0.3s ease;
            box-shadow: var(--shadow-lg);
            overflow-y: auto;
        }
        
        .mobile-nav.active {
            left: 0;
        }
        
        .mobile-nav-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 2px solid var(--clair);
        }
        
        .close-mobile-nav {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--gris);
            cursor: pointer;
        }
        
        .mobile-nav-links {
            padding: 1rem;
        }
        
        .mobile-nav-links a {
            display: block;
            padding: 1rem;
            text-decoration: none;
            color: var(--noir);
            border-radius: var(--radius);
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .mobile-nav-links a i {
            width: 25px;
            color: var(--bleu);
        }
        
        .mobile-nav-search {
            padding: 1rem;
            display: flex;
            align-items: center;
            background: var(--clair);
            border-radius: var(--radius-full);
            margin: 1rem;
        }
        
        .mobile-nav-search i {
            color: var(--gris);
            margin: 0 0.5rem;
        }
        
        .mobile-nav-search input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 0.5rem;
            outline: none;
        }
    `;
    
    document.head.appendChild(style);
}

// Appeler la fonction pour ajouter les styles dynamiques
addDynamicStyles();