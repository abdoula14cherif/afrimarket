// Configuration initiale
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initTheme();
    loadAnnonces();
    initFilters();
    initNavigation();
    
    // Démarrer avec des exemples si vide
    if (!localStorage.getItem('afrimarket_annonces')) {
        createExampleAnnonces();
    }
}

// Gestion du thème
function initTheme() {
    const themeBtn = document.getElementById('theme-btn');
    const savedTheme = localStorage.getItem('afrimarket_theme') || 'light-mode';
    
    // Appliquer le thème sauvegardé
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);
    
    // Gérer le clic sur le bouton de thème
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
    icon.className = theme === 'dark-mode' ? 'fas fa-sun' : 'fas fa-moon';
}

// Chargement des annonces
function loadAnnonces() {
    const annoncesList = document.getElementById('annonces-list');
    const annoncesCount = document.getElementById('annonces-count');
    
    if (!annoncesList) return;
    
    // Récupérer les annonces depuis le localStorage
    const annonces = JSON.parse(localStorage.getItem('afrimarket_annonces')) || [];
    
    // Mettre à jour le compteur
    if (annoncesCount) {
        annoncesCount.textContent = `${annonces.length} annonce${annonces.length !== 1 ? 's' : ''}`;
    }
    
    // Afficher les annonces
    displayAnnonces(annonces, annoncesList);
}

function displayAnnonces(annonces, container) {
    container.innerHTML = '';
    
    if (annonces.length === 0) {
        container.innerHTML = `
            <div class="no-annonces">
                <i class="fas fa-inbox"></i>
                <h4>Aucune annonce pour le moment</h4>
                <p>Soyez le premier à publier une annonce sur AFRIMARKET</p>
                <a href="publier.html" class="btn">Publier maintenant</a>
            </div>
        `;
        return;
    }
    
    // Trier par date (plus récent en premier)
    annonces.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Afficher chaque annonce
    annonces.forEach(annonce => {
        const annonceElement = createAnnonceElement(annonce);
        container.appendChild(annonceElement);
    });
}

function createAnnonceElement(annonce) {
    const div = document.createElement('div');
    div.className = 'annonce-card';
    div.dataset.category = annonce.category;
    
    // Formater la date
    const date = new Date(annonce.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    // Déterminer l'icône de catégorie
    const categoryIcon = annonce.category === 'vente' ? 'fas fa-shopping-cart' : 'fas fa-newspaper';
    const categoryText = annonce.category === 'vente' ? 'À VENDRE' : 'ACTUALITÉ';
    
    // Utiliser l'image ou une image par défaut
    const imageUrl = annonce.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
    
    div.innerHTML = `
        <div class="annonce-image">
            <div class="annonce-category category-${annonce.category}">
                <i class="${categoryIcon}"></i>
                ${categoryText}
            </div>
            <img src="${imageUrl}" alt="${annonce.title}" loading="lazy">
        </div>
        
        <div class="annonce-content">
            <div class="annonce-header">
                <h3 class="annonce-title">${annonce.title}</h3>
                ${annonce.price ? `<span class="annonce-price">${annonce.price} €</span>` : ''}
            </div>
            
            <p class="annonce-description">${annonce.description}</p>
            
            <div class="annonce-footer">
                <span class="annonce-date">
                    <i class="far fa-calendar"></i>
                    ${formattedDate}
                </span>
                ${annonce.whatsapp ? `
                    <a href="https://wa.me/${annonce.whatsapp.replace(/\D/g, '')}" 
                       target="_blank" 
                       class="whatsapp-btn">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </a>
                ` : ''}
            </div>
        </div>
    `;
    
    return div;
}

// Filtrage des annonces
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Mettre à jour les boutons actifs
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Appliquer le filtre
            const filter = this.dataset.filter;
            filterAnnonces(filter);
        });
    });
}

function filterAnnonces(filter) {
    const annoncesList = document.getElementById('annonces-list');
    if (!annoncesList) return;
    
    // Récupérer toutes les annonces
    const allAnnonces = JSON.parse(localStorage.getItem('afrimarket_annonces')) || [];
    
    // Filtrer si nécessaire
    const filteredAnnonces = filter === 'all' 
        ? allAnnonces 
        : allAnnonces.filter(a => a.category === filter);
    
    // Afficher les annonces filtrées
    displayAnnonces(filteredAnnonces, annoncesList);
}

// Navigation
function initNavigation() {
    // Mettre en surbrillance l'élément de navigation actif
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Créer des exemples d'annonces
function createExampleAnnonces() {
    const examples = [
        {
            id: Date.now(),
            title: "Smartphone iPhone 12 Pro Max",
            description: "256 Go, état impeccable, avec facture et accessoires. Vente urgente pour départ à l'étranger.",
            category: "vente",
            price: 750,
            whatsapp: "+33612345678",
            image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: Date.now() + 1,
            title: "Festival de musique traditionnelle",
            description: "Événement culturel ce week-end au centre ville. Entrée gratuite avec animations et restauration locale.",
            category: "actualite",
            price: null,
            whatsapp: "+33787654321",
            image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: Date.now() + 2,
            title: "Vélo de course professionnel",
            description: "Marque Trek, taille M, peu utilisé. Parfait pour les amateurs de cyclisme. Prix négociable.",
            category: "vente",
            price: 450,
            whatsapp: null,
            image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            date: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            title: "Cours de cuisine africaine",
            description: "Apprenez à préparer des plats traditionnels. Session débutants tous les samedis matin.",
            category: "actualite",
            price: 25,
            whatsapp: "+33698765432",
            image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    localStorage.setItem('afrimarket_annonces', JSON.stringify(examples));
    loadAnnonces(); // Recharger pour afficher les exemples
}

// Fonction pour ajouter une nouvelle annonce
function addAnnonce(annonceData) {
    const annonces = JSON.parse(localStorage.getItem('afrimarket_annonces')) || [];
    
    // Ajouter un ID unique et la date
    const newAnnonce = {
        id: Date.now(),
        ...annonceData,
        date: new Date().toISOString()
    };
    
    annonces.unshift(newAnnonce); // Ajouter au début
    localStorage.setItem('afrimarket_annonces', JSON.stringify(annonces));
    
    // Rediriger vers l'accueil
    window.location.href = 'index.html';
}

// Fonction pour supprimer une annonce
function deleteAnnonce(id) {
    let annonces = JSON.parse(localStorage.getItem('afrimarket_annonces')) || [];
    annonces = annonces.filter(annonce => annonce.id !== id);
    localStorage.setItem('afrimarket_annonces', JSON.stringify(annonces));
    return annonces;
}

// Fonction pour convertir une image en Base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
// Dans script.js, ajoutez :
async function updateNavigation() {
    const user = await getUtilisateurConnecte();
    const authNav = document.getElementById('auth-nav-item');
    
    if (!authNav) return;
    
    if (user) {
        authNav.innerHTML = `
            <div class="nav-item" id="profile-nav">
                <i class="fas fa-user"></i>
                <span>Profil</span>
            </div>
        `;
        
        document.getElementById('profile-nav').addEventListener('click', function() {
            // Ouvrir dropdown ou rediriger vers profil
        });
    } else {
        authNav.innerHTML = `
            <a href="connexion.html" class="nav-item">
                <i class="fas fa-sign-in-alt"></i>
                <span>Connexion</span>
            </a>
        `;
    }
    }
