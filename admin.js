// ============================================
// ADMIN.JS - Logique de l'administration AFRIMARKET
// ============================================

// Configuration Supabase
const SUPABASE_URL = 'https://xfbwimnwsixflypsvqfv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYndpbW53c2l4Zmx5cHN2cWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTYyNTQsImV4cCI6MjA4NjQ5MjI1NH0.34RMdbAC_3XWxutD6X2GgF9odULkx46bpBY-V3hSUp8';

// ============================================
// VARIABLES GLOBALES
// ============================================
const ADMIN_EMAIL = 'abdoula14cherif@gmail.com';
let supabaseClient = null;
let currentUser = null;

// Données
let allUsers = [];
let allAnnonces = [];
let allReferrals = [];
let allRetraits = [];
let allRecharges = [];
let allBalances = [];

// État
let currentTab = 'users';
let currentRechargeId = null;
let currentRetraitId = null;
let currentAnnonceId = null;

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Administration chargée');
    
    // Initialiser Supabase
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Configurer l'interface
    setupInterface();
    
    // Vérifier la session
    await checkSession();
    
    // Charger les données
    await loadAllData();
});

// ============================================
// VÉRIFICATION DE SESSION - SIMPLE ET EFFICACE
// ============================================
async function checkSession() {
    // 1. VÉRIFIER DIRECTEMENT LOCALSTORAGE
    const isLoggedIn = localStorage.getItem('afrimarket_logged_in') === 'true';
    const userEmail = localStorage.getItem('afrimarket_user_email');
    const userRole = localStorage.getItem('afrimarket_user_role');
    const userId = localStorage.getItem('afrimarket_user_id');
    const userName = localStorage.getItem('afrimarket_user_name');
    
    console.log('🔍 Vérification session:', { isLoggedIn, userEmail, userRole });
    
    // 2. ADMIN - TOUJOURS ACCEPTÉ
    if (isLoggedIn && userEmail === ADMIN_EMAIL) {
        console.log('✅ Admin connecté via localStorage');
        
        // Forcer le rôle admin
        if (userRole !== 'admin') {
            localStorage.setItem('afrimarket_user_role', 'admin');
        }
        
        currentUser = {
            id: userId || 'admin-' + Date.now(),
            email: userEmail,
            user_metadata: {
                nom_complet: userName || 'Abdoula Cherif',
                role: 'admin'
            }
        };
        
        document.getElementById('adminEmail').textContent = `(${userEmail})`;
        updateSidebarInfo();
        return currentUser;
    }
    
    // 3. UTILISATEUR NORMAL
    if (isLoggedIn && userEmail) {
        console.log('✅ Utilisateur connecté via localStorage');
        
        currentUser = {
            id: userId,
            email: userEmail,
            user_metadata: {
                nom_complet: userName || 'Utilisateur',
                role: userRole || 'user'
            }
        };
        
        document.getElementById('adminEmail').textContent = `(${userEmail})`;
        updateSidebarInfo();
        return currentUser;
    }
    
    // 4. AUCUNE SESSION
    console.log('ℹ️ Aucune session trouvée - Mode lecture seule');
    document.getElementById('adminEmail').textContent = `(Non connecté - Mode lecture)`;
    updateSidebarInfo();
    return null;
}

// ============================================
// BOUTON FORCER ADMIN
// ============================================
function setupForceAdminButton() {
    const forceBtn = document.getElementById('forceAdminBtn');
    if (!forceBtn) return;
    
    forceBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔧 Activation du mode admin...');
        
        // Sauvegarder le thème
        const theme = localStorage.getItem('afrimarket_theme');
        
        // Forcer la connexion admin
        localStorage.setItem('afrimarket_logged_in', 'true');
        localStorage.setItem('afrimarket_user_email', ADMIN_EMAIL);
        localStorage.setItem('afrimarket_user_name', 'Abdoula Cherif');
        localStorage.setItem('afrimarket_user_role', 'admin');
        localStorage.setItem('afrimarket_user_id', 'admin-' + Date.now());
        
        if (theme) localStorage.setItem('afrimarket_theme', theme);
        
        showToast('✅ Mode admin activé ! Rechargement...', 'success');
        
        // Recharger la page
        setTimeout(() => window.location.reload(), 1000);
    });
}

// ============================================
// CONFIGURATION INTERFACE
// ============================================
function setupInterface() {
    // Thème
    const savedTheme = localStorage.getItem('afrimarket_theme') || 'light-mode';
    document.body.className = savedTheme;
    
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('menuThemeToggle').checked = savedTheme === 'dark-mode';
    document.getElementById('menuThemeToggle').addEventListener('change', toggleTheme);
    
    // Menu burger
    document.getElementById('menuBtn').addEventListener('click', () => {
        document.getElementById('sidebarMenu').classList.add('open');
        document.getElementById('menuOverlay').style.display = 'block';
    });
    
    document.getElementById('menuOverlay').addEventListener('click', closeSidebar);
    
    // Support
    document.getElementById('supportMenuItem').addEventListener('click', () => {
        alert('📞 Support AFRIMARKET\n\n📧 support@afrimarket.com');
        closeSidebar();
    });
    
    // Rafraîchir
    document.getElementById('refreshMenuItem').addEventListener('click', async () => {
        await loadAllData();
        showToast('✅ Données actualisées', 'success');
        closeSidebar();
    });
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        
        const theme = localStorage.getItem('afrimarket_theme');
        localStorage.clear();
        if (theme) localStorage.setItem('afrimarket_theme', theme);
        
        window.location.href = '../connexion.html';
    });
    
    // Bouton forcer admin
    setupForceAdminButton();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    document.body.className = isDark ? 'light-mode' : 'dark-mode';
    localStorage.setItem('afrimarket_theme', isDark ? 'light-mode' : 'dark-mode');
    document.getElementById('menuThemeToggle').checked = !isDark;
}

function closeSidebar() {
    document.getElementById('sidebarMenu').classList.remove('open');
    document.getElementById('menuOverlay').style.display = 'none';
}

function updateSidebarInfo() {
    if (!currentUser) {
        document.getElementById('sidebarUserName').textContent = 'Visiteur';
        document.getElementById('sidebarUserEmail').textContent = 'Non connecté';
        document.getElementById('sidebarUserAvatar').innerHTML = '<i class="fas fa-user"></i>';
        return;
    }
    
    const name = currentUser.user_metadata?.nom_complet || currentUser.email?.split('@')[0] || 'Admin';
    const email = currentUser.email || ADMIN_EMAIL;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarUserEmail').textContent = email;
    document.getElementById('sidebarUserAvatar').innerHTML = `<span>${initials}</span>`;
}

// ============================================
// GESTION DES ONGLETS
// ============================================
window.switchTab = function(tabName) {
    currentTab = tabName;
    
    // Cacher tous les onglets
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    
    // Afficher l'onglet sélectionné
    document.getElementById(`${tabName}-tab`).style.display = 'block';
    
    // Mettre à jour les boutons
    document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
};

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================
async function loadAllData() {
    showLoading(true);
    
    try {
        await Promise.all([
            loadUsers(),
            loadAnnonces(),
            loadReferrals(),
            loadRetraits(),
            loadRecharges(),
            loadBalances()
        ]);
        
        updateStatistics();
        updateAllTables();
        updatePendingBadges();
        showToast('✅ Données chargées', 'success');
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showToast('Erreur de chargement', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadUsers() {
    try {
        const { data } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        allUsers = data || [];
    } catch (e) {
        console.error('Erreur users:', e);
        allUsers = [];
    }
}

async function loadAnnonces() {
    try {
        const { data } = await supabaseClient
            .from('annonces')
            .select('*')
            .order('created_at', { ascending: false });
        allAnnonces = data || [];
    } catch (e) {
        console.error('Erreur annonces:', e);
        allAnnonces = [];
    }
}

async function loadReferrals() {
    try {
        const { data } = await supabaseClient
            .from('referral_data')
            .select('*');
        allReferrals = data || [];
    } catch (e) {
        console.error('Erreur referrals:', e);
        allReferrals = [];
    }
}

async function loadRetraits() {
    try {
        const { data } = await supabaseClient
            .from('retraits')
            .select('*')
            .order('created_at', { ascending: false });
        allRetraits = data || [];
    } catch (e) {
        console.error('Erreur retraits:', e);
        allRetraits = [];
    }
}

async function loadRecharges() {
    try {
        const { data } = await supabaseClient
            .from('recharges')
            .select('*')
            .order('created_at', { ascending: false });
        allRecharges = data || [];
    } catch (e) {
        console.error('Erreur recharges:', e);
        allRecharges = [];
    }
}

async function loadBalances() {
    try {
        const { data } = await supabaseClient
            .from('balances')
            .select('*');
        allBalances = data || [];
    } catch (e) {
        console.error('Erreur balances:', e);
        allBalances = [];
    }
}

// ============================================
// STATISTIQUES ET BADGES
// ============================================
function updateStatistics() {
    document.getElementById('statsUsers').textContent = allUsers.length || 0;
    document.getElementById('statsAnnonces').textContent = allAnnonces.length || 0;
    
    const parrainsActifs = allReferrals.filter(r => r.is_unlocked).length;
    document.getElementById('statsParrains').textContent = parrainsActifs || 0;
    
    const retraitsEnAttente = allRetraits.filter(r => r.status === 'pending').length;
    document.getElementById('statsRetraits').textContent = retraitsEnAttente || 0;
    
    const rechargesEnAttente = allRecharges.filter(r => r.status === 'pending').length;
    document.getElementById('statsRecharges').textContent = rechargesEnAttente || 0;
    
    document.getElementById('statsTotalPending').textContent = 
        (retraitsEnAttente + rechargesEnAttente) || 0;
}

function updatePendingBadges() {
    const retraitsEnAttente = allRetraits.filter(r => r.status === 'pending').length;
    const rechargesEnAttente = allRecharges.filter(r => r.status === 'pending').length;
    const totalEnAttente = retraitsEnAttente + rechargesEnAttente;
    
    // Badge titre
    const pendingBadge = document.getElementById('pendingCountBadge');
    const pendingCount = document.getElementById('pendingCount');
    if (totalEnAttente > 0) {
        pendingBadge.style.display = 'inline-block';
        pendingCount.textContent = totalEnAttente;
    } else {
        pendingBadge.style.display = 'none';
    }
    
    // Badge retraits
    const retraitsBadge = document.getElementById('retraitsPendingBadge');
    if (retraitsBadge) {
        retraitsBadge.textContent = retraitsEnAttente;
        retraitsBadge.style.display = retraitsEnAttente > 0 ? 'inline-block' : 'none';
    }
    
    // Badge recharges
    const rechargesBadge = document.getElementById('rechargesPendingBadge');
    if (rechargesBadge) {
        rechargesBadge.textContent = rechargesEnAttente;
        rechargesBadge.style.display = rechargesEnAttente > 0 ? 'inline-block' : 'none';
    }
}

// ============================================
// MISE À JOUR DES TABLEAUX
// ============================================
function updateAllTables() {
    updateUsersTable();
    updateAnnoncesTable();
    updateReferralsTable();
    updateRetraitsTable();
    updateRechargesTable();
}

// ----- TABLEAU UTILISATEURS -----
function updateUsersTable(filteredUsers = null) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const usersToShow = filteredUsers || allUsers;
    
    tbody.innerHTML = '';
    
    if (usersToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="no-data">
            <i class="fas fa-users"></i><p>Aucun utilisateur</p></td></tr>`;
        return;
    }
    
    usersToShow.forEach(user => {
        const balance = allBalances.find(b => b.user_id === user.id)?.amount || 0;
        const referral = allReferrals.find(r => r.user_id === user.id);
        const date = user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-';
        const shortId = user.id.substring(0, 8) + '...';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shortId}</td>
            <td><strong>${user.nom_complet || user.email?.split('@')[0] || '-'}</strong></td>
            <td>${user.email || '-'}</td>
            <td><span class="badge ${user.email === ADMIN_EMAIL ? 'badge-admin' : 'badge-user'}">
                ${user.email === ADMIN_EMAIL ? 'Admin' : 'Utilisateur'}</span></td>
            <td><span class="badge ${user.statut === 'inactive' ? 'badge-inactive' : 'badge-active'}">
                ${user.statut === 'inactive' ? 'Inactif' : 'Actif'}</span></td>
            <td><strong style="color: var(--primary-green);">${balance.toLocaleString()} F</strong></td>
            <td><code>${referral?.referral_code || '-'}</code></td>
            <td><span class="badge ${referral?.is_unlocked ? 'badge-active' : 'badge-inactive'}">
                ${referral?.is_unlocked ? '🔓 Débloqué' : '🔒 Verrouillé'}</span></td>
            <td>${date}</td>
            <td class="actions-cell">
                <button class="action-btn edit-btn" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                ${!referral?.is_unlocked && user.email !== ADMIN_EMAIL ? 
                    `<button class="action-btn unlock-btn" onclick="unlockReferral('${user.id}')">
                        <i class="fas fa-unlock"></i>
                    </button>` : ''}
                ${user.email !== ADMIN_EMAIL ? 
                    `<button class="action-btn ${user.statut === 'inactive' ? 'enable-btn' : 'disable-btn'}" 
                        onclick="toggleUserStatus('${user.id}', '${user.statut === 'inactive' ? 'active' : 'inactive'}')">
                        <i class="fas ${user.statut === 'inactive' ? 'fa-check' : 'fa-ban'}"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.filterUsers = function() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';
    const statusFilter = document.getElementById('userStatusFilter')?.value || 'all';
    
    const filtered = allUsers.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(search) || 
                            user.nom_complet?.toLowerCase().includes(search);
        const matchesRole = roleFilter === 'all' || 
            (roleFilter === 'admin' ? user.email === ADMIN_EMAIL : user.email !== ADMIN_EMAIL);
        const matchesStatus = statusFilter === 'all' || user.statut === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    updateUsersTable(filtered);
};

// ----- TABLEAU ANNONCES -----
function updateAnnoncesTable(filteredAnnonces = null) {
    const tbody = document.getElementById('annoncesTableBody');
    if (!tbody) return;
    
    const annoncesToShow = filteredAnnonces || allAnnonces;
    
    tbody.innerHTML = '';
    
    if (annoncesToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="no-data">
            <i class="fas fa-newspaper"></i><p>Aucune annonce</p></td></tr>`;
        return;
    }
    
    annoncesToShow.forEach(annonce => {
        const user = allUsers.find(u => u.id === annonce.user_id);
        const date = new Date(annonce.created_at).toLocaleDateString('fr-FR');
        const shortId = annonce.id.substring(0, 8) + '...';
        const shortTitle = annonce.titre?.substring(0, 30) + (annonce.titre?.length > 30 ? '...' : '');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shortId}</td>
            <td><strong>${shortTitle || '-'}</strong></td>
            <td>${annonce.description?.substring(0, 30)}...</td>
            <td>${user?.email?.split('@')[0] || annonce.user_id?.substring(0,8) || '-'}</td>
            <td><span class="badge ${annonce.type === 'vente' ? 'badge-vente' : 'badge-actualite'}">
                ${annonce.type === 'vente' ? 'Vente' : 'Actualité'}</span></td>
            <td>${annonce.prix ? annonce.prix.toLocaleString() + ' F' : 'Gratuit'}</td>
            <td>${annonce.views || 0}</td>
            <td>${annonce.contacts || 0}</td>
            <td>${date}</td>
            <td><span class="badge ${annonce.statut === 'actif' ? 'badge-active' : 'badge-inactive'}">
                ${annonce.statut === 'actif' ? 'Actif' : 'Inactif'}</span></td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewAnnonceDetails('${annonce.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editAnnonce('${annonce.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ${annonce.statut === 'actif' ? 'disable-btn' : 'enable-btn'}" 
                    onclick="toggleAnnonceStatus('${annonce.id}', '${annonce.statut === 'actif' ? 'inactif' : 'actif'}')">
                    <i class="fas ${annonce.statut === 'actif' ? 'fa-ban' : 'fa-check'}"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteAnnonce('${annonce.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.filterAnnonces = function() {
    const search = document.getElementById('annonceSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('annonceTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('annonceStatusFilter')?.value || 'all';
    
    const filtered = allAnnonces.filter(annonce => {
        const matchesSearch = annonce.titre?.toLowerCase().includes(search) || 
                            annonce.description?.toLowerCase().includes(search);
        const matchesType = typeFilter === 'all' || annonce.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || annonce.statut === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });
    
    updateAnnoncesTable(filtered);
};

// ----- TABLEAU PARRAINAGES -----
function updateReferralsTable(filteredReferrals = null) {
    const tbody = document.getElementById('referralsTableBody');
    if (!tbody) return;
    
    const referralsToShow = filteredReferrals || allReferrals;
    
    tbody.innerHTML = '';
    
    if (referralsToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="no-data">
            <i class="fas fa-sitemap"></i><p>Aucun parrainage</p></td></tr>`;
        return;
    }
    
    referralsToShow.forEach(ref => {
        const user = allUsers.find(u => u.id === ref.user_id);
        const date = ref.unlocked_at ? new Date(ref.unlocked_at).toLocaleDateString('fr-FR') : '-';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${user?.nom_complet || user?.email?.split('@')[0] || 'Inconnu'}</strong></td>
            <td>${user?.email || '-'}</td>
            <td><code>${ref.referral_code || '-'}</code></td>
            <td><span class="badge ${ref.is_unlocked ? 'badge-active' : 'badge-inactive'}">
                ${ref.is_unlocked ? 'Débloqué' : 'Verrouillé'}</span></td>
            <td>${date}</td>
            <td><strong>${ref.direct_count || 0}</strong></td>
            <td><strong>${ref.level2_count || 0}</strong></td>
            <td><strong>${ref.level3_count || 0}</strong></td>
            <td>${(ref.direct_earnings || 0).toLocaleString()} F</td>
            <td>${(ref.level2_earnings || 0).toLocaleString()} F</td>
            <td>${(ref.level3_earnings || 0).toLocaleString()} F</td>
            <td><strong>${(ref.total_earned || 0).toLocaleString()} F</strong></td>
            <td class="actions-cell">
                ${!ref.is_unlocked ? 
                    `<button class="action-btn unlock-btn" onclick="unlockReferral('${ref.user_id}')">
                        <i class="fas fa-unlock"></i>
                    </button>` : 
                    `<span class="badge badge-active">Débloqué</span>`}
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.filterReferrals = function() {
    const search = document.getElementById('referralSearch')?.value.toLowerCase() || '';
    
    const filtered = allReferrals.filter(ref => {
        const user = allUsers.find(u => u.id === ref.user_id);
        return user?.email?.toLowerCase().includes(search) || 
               user?.nom_complet?.toLowerCase().includes(search) ||
               ref.referral_code?.toLowerCase().includes(search);
    });
    
    updateReferralsTable(filtered);
};

// ----- TABLEAU RETRAITS -----
function updateRetraitsTable(filteredRetraits = null) {
    const tbody = document.getElementById('retraitsTableBody');
    if (!tbody) return;
    
    const retraitsToShow = filteredRetraits || allRetraits;
    
    tbody.innerHTML = '';
    
    if (retraitsToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="no-data">
            <i class="fas fa-wallet"></i><p>Aucun retrait</p></td></tr>`;
        return;
    }
    
    retraitsToShow.forEach(retrait => {
        const user = allUsers.find(u => u.id === retrait.user_id);
        const date = new Date(retrait.created_at).toLocaleDateString('fr-FR');
        const processedDate = retrait.processed_at ? 
            new Date(retrait.processed_at).toLocaleDateString('fr-FR') : '-';
        const shortId = retrait.id.substring(0, 8) + '...';
        
        let methodIcon = 'fa-mobile-alt';
        let contactInfo = retrait.phone || '-';
        if (retrait.method === 'crypto') {
            methodIcon = 'fa-coins';
            contactInfo = retrait.wallet_address?.substring(0, 15) + '...' || '-';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shortId}</td>
            <td><strong>${user?.email?.split('@')[0] || retrait.user_id?.substring(0,8) || '-'}</strong></td>
            <td>${contactInfo}</td>
            <td><strong style="color: var(--primary-red);">${retrait.amount.toLocaleString()} F</strong></td>
            <td><i class="fas ${methodIcon}"></i> ${retrait.method === 'mobile' ? 'Mobile' : 'Crypto'}</td>
            <td>${retrait.account_name || '-'}</td>
            <td>${date}</td>
            <td>
                <span class="badge ${retrait.status === 'pending' ? 'badge-pending' : 
                                  retrait.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">
                    ${retrait.status === 'pending' ? 'En attente' : 
                      retrait.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                </span>
            </td>
            <td>${processedDate}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewRetraitDetails('${retrait.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${retrait.status === 'pending' && currentUser ? 
                    `<button class="action-btn approve-btn" onclick="approveRetrait('${retrait.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn reject-btn" onclick="rejectRetrait('${retrait.id}')">
                        <i class="fas fa-times"></i>
                    </button>` : 
                    `<span class="badge badge-inactive">Traité</span>`}
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.filterRetraits = function() {
    const search = document.getElementById('retraitSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('retraitStatusFilter')?.value || 'all';
    const methodFilter = document.getElementById('retraitMethodFilter')?.value || 'all';
    
    const filtered = allRetraits.filter(retrait => {
        const user = allUsers.find(u => u.id === retrait.user_id);
        const matchesSearch = user?.email?.toLowerCase().includes(search) || 
                            retrait.id?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || retrait.status === statusFilter;
        const matchesMethod = methodFilter === 'all' || retrait.method === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    });
    
    updateRetraitsTable(filtered);
};

window.filterRetraitsByStatus = function(status) {
    document.getElementById('retraitStatusFilter').value = status;
    filterRetraits();
};

// ----- TABLEAU RECHARGES -----
function updateRechargesTable(filteredRecharges = null) {
    const tbody = document.getElementById('rechargesTableBody');
    if (!tbody) return;
    
    const rechargesToShow = filteredRecharges || allRecharges;
    
    tbody.innerHTML = '';
    
    if (rechargesToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="no-data">
            <i class="fas fa-coins"></i><p>Aucune recharge</p></td></tr>`;
        return;
    }
    
    rechargesToShow.forEach(recharge => {
        const user = allUsers.find(u => u.id === recharge.user_id);
        const date = new Date(recharge.created_at).toLocaleDateString('fr-FR');
        const processedDate = recharge.processed_at ? 
            new Date(recharge.processed_at).toLocaleDateString('fr-FR') : '-';
        const shortId = recharge.id.substring(0, 8) + '...';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shortId}</td>
            <td><strong>${user?.email?.split('@')[0] || recharge.user_id?.substring(0,8) || '-'}</strong></td>
            <td>${recharge.phone || '-'}</td>
            <td><strong style="color: var(--primary-green);">+${recharge.amount.toLocaleString()} F</strong></td>
            <td>${recharge.method || 'Mobile Money'}</td>
            <td>${recharge.account_name || '-'}</td>
            <td>${date}</td>
            <td>
                ${recharge.unlock_referral ? 
                    `<span class="badge badge-pending"><i class="fas fa-unlock"></i> Oui</span>` : 
                    `<span class="badge badge-inactive">Non</span>`}
            </td>
            <td>
                <span class="badge ${recharge.status === 'pending' ? 'badge-pending' : 
                                  recharge.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">
                    ${recharge.status === 'pending' ? 'En attente' : 
                      recharge.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                </span>
            </td>
            <td>${processedDate}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewRechargeDetails('${recharge.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                ${recharge.status === 'pending' && currentUser ? 
                    `<button class="action-btn approve-btn" onclick="approveRecharge('${recharge.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn reject-btn" onclick="rejectRecharge('${recharge.id}')">
                        <i class="fas fa-times"></i>
                    </button>` : 
                    `<span class="badge badge-inactive">Traité</span>`}
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.filterRecharges = function() {
    const search = document.getElementById('rechargeSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('rechargeStatusFilter')?.value || 'all';
    const operatorFilter = document.getElementById('rechargeOperatorFilter')?.value || 'all';
    
    const filtered = allRecharges.filter(recharge => {
        const user = allUsers.find(u => u.id === recharge.user_id);
        const matchesSearch = user?.email?.toLowerCase().includes(search) || 
                            recharge.id?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || recharge.status === statusFilter;
        const matchesOperator = operatorFilter === 'all' || recharge.operator === operatorFilter;
        return matchesSearch && matchesStatus && matchesOperator;
    });
    
    updateRechargesTable(filtered);
};

window.filterRechargesByStatus = function(status) {
    document.getElementById('rechargeStatusFilter').value = status;
    filterRecharges();
};

// ============================================
// ACTIONS UTILISATEURS
// ============================================
window.showAddUserModal = function() {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    document.getElementById('userModalTitle').textContent = 'Ajouter un utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordField').style.display = 'block';
    document.getElementById('userBalance').value = 0;
    showModal('userModal');
};

window.editUser = function(userId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('userModalTitle').textContent = 'Modifier l\'utilisateur';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.nom_complet || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userRole').value = user.email === ADMIN_EMAIL ? 'admin' : 'user';
    document.getElementById('userStatus').value = user.statut || 'active';
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordField').style.display = 'none';
    
    const balance = allBalances.find(b => b.user_id === user.id)?.amount || 0;
    document.getElementById('userBalance').value = balance;
    
    showModal('userModal');
};

window.saveUser = async function() {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    const userId = document.getElementById('userId').value;
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const balance = parseFloat(document.getElementById('userBalance').value) || 0;
    
    if (!name || !email) {
        showToast('❌ Champs obligatoires', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (userId) {
            // MODIFICATION
            const { error } = await supabaseClient
                .from('users')
                .update({ nom_complet: name, email, role, statut: status })
                .eq('id', userId);
            
            if (error) throw error;
            
            await supabaseClient
                .from('balances')
                .upsert({ user_id: userId, amount: balance, total_earned: balance })
                .eq('user_id', userId);
            
            showToast('✅ Utilisateur modifié', 'success');
            
        } else {
            // AJOUT
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password: password || 'Default123!',
                options: { data: { nom_complet: name, role } }
            });
            
            if (error) throw error;
            
            if (balance > 0 && data.user) {
                await supabaseClient
                    .from('balances')
                    .insert([{ user_id: data.user.id, amount: balance, total_earned: balance }]);
            }
            
            showToast('✅ Utilisateur ajouté', 'success');
        }
        
        closeModal('userModal');
        await loadAllData();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
};

window.toggleUserStatus = async function(userId, newStatus) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    showConfirm(
        `${newStatus === 'active' ? 'Activer' : 'Désactiver'} cet utilisateur ?`,
        async () => {
            showLoading(true);
            try {
                await supabaseClient.from('users').update({ statut: newStatus }).eq('id', userId);
                showToast(`✅ Utilisateur ${newStatus === 'active' ? 'activé' : 'désactivé'}`, 'success');
                await loadUsers();
                updateUsersTable();
            } catch (error) {
                showToast('❌ Erreur', 'error');
            } finally {
                showLoading(false);
            }
        }
    );
};

window.deleteUser = async function(userId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    showConfirm(
        '⚠️ Supprimer cet utilisateur ? Cette action est irréversible.',
        async () => {
            showLoading(true);
            try {
                await supabaseClient.from('users').delete().eq('id', userId);
                showToast('✅ Utilisateur supprimé', 'success');
                await loadAllData();
            } catch (error) {
                showToast('❌ Erreur', 'error');
            } finally {
                showLoading(false);
            }
        }
    );
};

// ============================================
// ACTIONS PARRAINAGE
// ============================================
window.unlockReferral = async function(userId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    showConfirm(
        '🔓 Débloquer le lien de parrainage ?',
        async () => {
            showLoading(true);
            try {
                await supabaseClient
                    .from('referral_data')
                    .update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
                    .eq('user_id', userId);
                
                showToast('✅ Lien débloqué', 'success');
                await loadReferrals();
                updateReferralsTable();
                updateUsersTable();
            } catch (error) {
                showToast('❌ Erreur', 'error');
            } finally {
                showLoading(false);
            }
        }
    );
};

// ============================================
// ACTIONS ANNONCES
// ============================================
window.showAddAnnonceModal = async function() {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    const select = document.getElementById('annonceUserId');
    select.innerHTML = '';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.email || user.id.substring(0,8)}`;
        select.appendChild(option);
    });
    
    document.getElementById('annonceModalTitle').textContent = 'Ajouter une annonce';
    document.getElementById('annonceForm').reset();
    document.getElementById('annonceId').value = '';
    showModal('annonceModal');
};

window.editAnnonce = function(annonceId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    const annonce = allAnnonces.find(a => a.id === annonceId);
    if (!annonce) return;
    
    const select = document.getElementById('annonceUserId');
    select.innerHTML = '';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.email || user.id.substring(0,8)}`;
        if (user.id === annonce.user_id) option.selected = true;
        select.appendChild(option);
    });
    
    document.getElementById('annonceModalTitle').textContent = 'Modifier l\'annonce';
    document.getElementById('annonceId').value = annonce.id;
    document.getElementById('annonceTitre').value = annonce.titre || '';
    document.getElementById('annonceDescription').value = annonce.description || '';
    document.getElementById('annonceType').value = annonce.type || 'vente';
    document.getElementById('annoncePrix').value = annonce.prix || '';
    
    showModal('annonceModal');
};

window.saveAnnonce = async function() {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    const annonceId = document.getElementById('annonceId').value;
    const titre = document.getElementById('annonceTitre').value;
    const description = document.getElementById('annonceDescription').value;
    const type = document.getElementById('annonceType').value;
    const prix = document.getElementById('annoncePrix').value;
    const userId = document.getElementById('annonceUserId').value;
    
    if (!titre || !description || !userId) {
        showToast('❌ Champs obligatoires', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (annonceId) {
            await supabaseClient
                .from('annonces')
                .update({ titre, description, type, prix: prix ? parseFloat(prix) : null })
                .eq('id', annonceId);
            
            showToast('✅ Annonce modifiée', 'success');
        } else {
            await supabaseClient
                .from('annonces')
                .insert([{
                    titre, description, type,
                    prix: prix ? parseFloat(prix) : null,
                    user_id: userId,
                    statut: 'actif',
                    views: 0,
                    contacts: 0
                }]);
            
            showToast('✅ Annonce ajoutée', 'success');
        }
        
        closeModal('annonceModal');
        await loadAnnonces();
        updateAnnoncesTable();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur', 'error');
    } finally {
        showLoading(false);
    }
};

window.viewAnnonceDetails = function(annonceId) {
    const annonce = allAnnonces.find(a => a.id === annonceId);
    if (!annonce) return;
    
    currentAnnonceId = annonceId;
    const user = allUsers.find(u => u.id === annonce.user_id);
    const date = new Date(annonce.created_at).toLocaleString('fr-FR');
    
    document.getElementById('annonceDetailsContent').innerHTML = `
        <div class="transaction-details">
            <div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${annonce.id}</span></div>
            <div class="detail-row"><span class="detail-label">Titre:</span><span class="detail-value">${annonce.titre || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Description:</span><span class="detail-value">${annonce.description || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value"><span class="badge ${annonce.type === 'vente' ? 'badge-vente' : 'badge-actualite'}">${annonce.type}</span></span></div>
            <div class="detail-row"><span class="detail-label">Prix:</span><span class="detail-value"><strong>${annonce.prix ? annonce.prix.toLocaleString() + ' F' : 'Gratuit'}</strong></span></div>
            <div class="detail-row"><span class="detail-label">Statut:</span><span class="detail-value"><span class="badge ${annonce.statut === 'actif' ? 'badge-active' : 'badge-inactive'}">${annonce.statut}</span></span></div>
            <div class="detail-row"><span class="detail-label">Vues:</span><span class="detail-value">${annonce.views || 0}</span></div>
            <div class="detail-row"><span class="detail-label">Contacts:</span><span class="detail-value">${annonce.contacts || 0}</span></div>
            <div class="detail-row"><span class="detail-label">Utilisateur:</span><span class="detail-value">${user?.email || annonce.user_id}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${date}</span></div>
        </div>
    `;
    
    showModal('annonceDetailsModal');
};

window.editAnnonceFromModal = function() {
    closeModal('annonceDetailsModal');
    editAnnonce(currentAnnonceId);
};

window.deleteAnnonceFromModal = function() {
    closeModal('annonceDetailsModal');
    deleteAnnonce(currentAnnonceId);
};

window.toggleAnnonceStatus = async function(annonceId, newStatus) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    showLoading(true);
    try {
        await supabaseClient.from('annonces').update({ statut: newStatus }).eq('id', annonceId);
        showToast(`✅ Annonce ${newStatus === 'actif' ? 'activée' : 'désactivée'}`, 'success');
        await loadAnnonces();
        updateAnnoncesTable();
    } catch (error) {
        showToast('❌ Erreur', 'error');
    } finally {
        showLoading(false);
    }
};

window.deleteAnnonce = async function(annonceId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    showConfirm('⚠️ Supprimer cette annonce ?', async () => {
        showLoading(true);
        try {
            await supabaseClient.from('annonces').delete().eq('id', annonceId);
            showToast('✅ Annonce supprimée', 'success');
            await loadAnnonces();
            updateAnnoncesTable();
        } catch (error) {
            showToast('❌ Erreur', 'error');
        } finally {
            showLoading(false);
        }
    });
};

window.deleteAllInactiveAnnonces = async function() {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    showConfirm('⚠️ Supprimer toutes les annonces inactives ?', async () => {
        showLoading(true);
        try {
            await supabaseClient.from('annonces').delete().eq('statut', 'inactif');
            showToast('✅ Annonces inactives supprimées', 'success');
            await loadAnnonces();
            updateAnnoncesTable();
        } catch (error) {
            showToast('❌ Erreur', 'error');
        } finally {
            showLoading(false);
        }
    });
};

// ============================================
// ACTIONS RETRAITS
// ============================================
window.viewRetraitDetails = function(retraitId) {
    const retrait = allRetraits.find(r => r.id === retraitId);
    if (!retrait) return;
    
    currentRetraitId = retraitId;
    const user = allUsers.find(u => u.id === retrait.user_id);
    const date = new Date(retrait.created_at).toLocaleString('fr-FR');
    
    let methodDetails = '';
    if (retrait.method === 'mobile') {
        methodDetails = `
            <div class="detail-row"><span class="detail-label">Téléphone:</span><span class="detail-value">${retrait.phone || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Opérateur:</span><span class="detail-value">${retrait.operator || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Pays:</span><span class="detail-value">${retrait.country || '-'}</span></div>
        `;
    } else {
        methodDetails = `
            <div class="detail-row"><span class="detail-label">Wallet:</span><span class="detail-value">${retrait.wallet_address?.substring(0, 20)}...</span></div>
            <div class="detail-row"><span class="detail-label">Réseau:</span><span class="detail-value">${retrait.network || '-'}</span></div>
        `;
    }
    
    document.getElementById('retraitDetailsContent').innerHTML = `
        <div class="transaction-details">
            <div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${retrait.id}</span></div>
            <div class="detail-row"><span class="detail-label">Utilisateur:</span><span class="detail-value">${user?.email || retrait.user_id}</span></div>
            <div class="detail-row"><span class="detail-label">Montant:</span><span class="detail-value"><strong style="color: var(--primary-red);">${retrait.amount.toLocaleString()} F</strong></span></div>
            <div class="detail-row"><span class="detail-label">Méthode:</span><span class="detail-value">${retrait.method === 'mobile' ? 'Mobile Money' : 'Crypto'}</span></div>
            ${methodDetails}
            <div class="detail-row"><span class="detail-label">Nom du compte:</span><span class="detail-value">${retrait.account_name || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${date}</span></div>
            <div class="detail-row"><span class="detail-label">Statut:</span><span class="detail-value">
                <span class="badge ${retrait.status === 'pending' ? 'badge-pending' : 
                                  retrait.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">
                    ${retrait.status}
                </span>
            </span></div>
        </div>
    `;
    
    showModal('retraitDetailsModal');
};

window.approveRetrait = async function(retraitId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    
    const retrait = allRetraits.find(r => r.id === retraitId);
    if (!retrait) return;
    
    showConfirm(`✅ Approuver ce retrait de ${retrait.amount.toLocaleString()} F ?`, async () => {
        showLoading(true);
        try {
            await supabaseClient
                .from('retraits')
                .update({ 
                    status: 'approved', 
                    processed_at: new Date().toISOString(),
                    processed_by: currentUser.id
                })
                .eq('id', retraitId);
            
            await supabaseClient
                .from('balances')
                .update({ 
                    amount: supabase.raw('amount - ' + retrait.amount),
                    total_withdrawn: supabase.raw('COALESCE(total_withdrawn, 0) + ' + retrait.amount)
                })
                .eq('user_id', retrait.user_id);
            
            showToast('✅ Retrait approuvé', 'success');
            closeModal('retraitDetailsModal');
            await loadAllData();
            
        } catch (error) {
            console.error('Erreur:', error);
            showToast('❌ ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    });
};

window.approveRetraitFromModal = function() {
    approveRetrait(currentRetraitId);
};

window.rejectRetrait = async function(retraitId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    
    const retrait = allRetraits.find(r => r.id === retraitId);
    if (!retrait) return;
    
    showConfirm(`❌ Rejeter ce retrait de ${retrait.amount.toLocaleString()} F ?`, async () => {
        showLoading(true);
        try {
            await supabaseClient
                .from('retraits')
                .update({ 
                    status: 'rejected', 
                    processed_at: new Date().toISOString(),
                    processed_by: currentUser.id
                })
                .eq('id', retraitId);
            
            showToast('✅ Retrait rejeté', 'success');
            closeModal('retraitDetailsModal');
            await loadAllData();
            
        } catch (error) {
            showToast('❌ Erreur', 'error');
        } finally {
            showLoading(false);
        }
    });
};

window.rejectRetraitFromModal = function() {
    rejectRetrait(currentRetraitId);
};

// ============================================
// ACTIONS RECHARGES
// ============================================
window.viewRechargeDetails = function(rechargeId) {
    const recharge = allRecharges.find(r => r.id === rechargeId);
    if (!recharge) return;
    
    currentRechargeId = rechargeId;
    const user = allUsers.find(u => u.id === recharge.user_id);
    const date = new Date(recharge.created_at).toLocaleString('fr-FR');
    
    document.getElementById('rechargeDetailsContent').innerHTML = `
        <div class="transaction-details">
            <div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">${recharge.id}</span></div>
            <div class="detail-row"><span class="detail-label">Utilisateur:</span><span class="detail-value">${user?.email || recharge.user_id}</span></div>
            <div class="detail-row"><span class="detail-label">Montant:</span><span class="detail-value"><strong style="color: var(--primary-green);">+${recharge.amount.toLocaleString()} F</strong></span></div>
            <div class="detail-row"><span class="detail-label">Opérateur:</span><span class="detail-value">${recharge.method || 'Mobile Money'}</span></div>
            <div class="detail-row"><span class="detail-label">Téléphone:</span><span class="detail-value">${recharge.phone || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Nom du compte:</span><span class="detail-value">${recharge.account_name || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">Déblocage:</span><span class="detail-value">${recharge.unlock_referral ? '✅ Oui' : '❌ Non'}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${date}</span></div>
            <div class="detail-row"><span class="detail-label">Statut:</span><span class="detail-value">
                <span class="badge ${recharge.status === 'pending' ? 'badge-pending' : 
                                  recharge.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">
                    ${recharge.status}
                </span>
            </span></div>
        </div>
    `;
    
    showModal('rechargeDetailsModal');
};

window.approveRecharge = async function(rechargeId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    
    const recharge = allRecharges.find(r => r.id === rechargeId);
    if (!recharge) return;
    
    showConfirm(`✅ Approuver cette recharge de ${recharge.amount.toLocaleString()} F ?`, async () => {
        showLoading(true);
        try {
            await supabaseClient
                .from('recharges')
                .update({ 
                    status: 'approved', 
                    processed_at: new Date().toISOString(),
                    processed_by: currentUser.id
                })
                .eq('id', rechargeId);
            
            await supabaseClient
                .from('balances')
                .update({ 
                    amount: supabase.raw('amount + ' + recharge.amount),
                    total_earned: supabase.raw('total_earned + ' + recharge.amount)
                })
                .eq('user_id', recharge.user_id);
            
            if (recharge.unlock_referral) {
                await supabaseClient
                    .from('referral_data')
                    .update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
                    .eq('user_id', recharge.user_id);
            }
            
            showToast('✅ Recharge approuvée', 'success');
            closeModal('rechargeDetailsModal');
            await loadAllData();
            
        } catch (error) {
            console.error('Erreur:', error);
            showToast('❌ ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    });
};

window.approveRechargeFromModal = function() {
    approveRecharge(currentRechargeId);
};

window.rejectRecharge = async function(rechargeId) {
    if (!currentUser) {
        showToast('❌ Connexion requise', 'error');
        return;
    }
    
    const recharge = allRecharges.find(r => r.id === rechargeId);
    if (!recharge) return;
    
    showConfirm(`❌ Rejeter cette recharge de ${recharge.amount.toLocaleString()} F ?`, async () => {
        showLoading(true);
        try {
            await supabaseClient
                .from('recharges')
                .update({ 
                    status: 'rejected', 
                    processed_at: new Date().toISOString(),
                    processed_by: currentUser.id
                })
                .eq('id', rechargeId);
            
            showToast('✅ Recharge rejetée', 'success');
            closeModal('rechargeDetailsModal');
            await loadAllData();
            
        } catch (error) {
            showToast('❌ Erreur', 'error');
        } finally {
            showLoading(false);
        }
    });
};

window.rejectRechargeFromModal = function() {
    rejectRecharge(currentRechargeId);
};

// ============================================
// UTILITAIRES
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${type === 'success' ? 'fa-check-circle' : 
            type === 'error' ? 'fa-exclamation-circle' : 
            type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${type === 'success' ? 'Succès' : 
                type === 'error' ? 'Erreur' : 
                type === 'warning' ? 'Attention' : 'Information'}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

window.showModal = function(id) {
    document.getElementById(id).style.display = 'flex';
};

window.closeModal = function(id) {
    document.getElementById(id).style.display = 'none';
};

function showConfirm(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmBtn').onclick = async () => {
        await onConfirm();
        closeModal('confirmModal');
    };
    showModal('confirmModal');
}

window.exportTableToCSV = function(tableType) {
    let data = [];
    let filename = `afrimarket_${tableType}_${new Date().toISOString().split('T')[0]}.csv`;
    
    switch(tableType) {
        case 'users':
            data = allUsers.map(u => ({
                Email: u.email,
                Nom: u.nom_complet || '',
                Rôle: u.email === ADMIN_EMAIL ? 'Admin' : 'User',
                Statut: u.statut || 'active',
                Solde: allBalances.find(b => b.user_id === u.id)?.amount || 0,
                Date: u.created_at
            }));
            break;
        case 'annonces':
            data = allAnnonces.map(a => ({
                Titre: a.titre,
                Type: a.type,
                Prix: a.prix,
                Vues: a.views,
                Statut: a.statut,
                Date: a.created_at
            }));
            break;
        case 'retraits':
            data = allRetraits.map(r => ({
                Montant: r.amount,
                Méthode: r.method,
                Statut: r.status,
                Date: r.created_at
            }));
            break;
        case 'recharges':
            data = allRecharges.map(r => ({
                Montant: r.amount,
                Opérateur: r.operator,
                Statut: r.status,
                Date: r.created_at
            }));
            break;
        case 'referrals':
            data = allReferrals.map(r => {
                const user = allUsers.find(u => u.id === r.user_id);
                return {
                    Utilisateur: user?.email || '',
                    Code: r.referral_code,
                    Statut: r.is_unlocked ? 'Débloqué' : 'Verrouillé',
                    Gains: r.total_earned || 0
                };
            });
            break;
    }
    
    if (data.length === 0) {
        showToast('❌ Aucune donnée à exporter', 'error');
        return;
    }
    
    const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast(`✅ Export ${tableType} réussi`, 'success');
};

// Exposer les fonctions pour les événements HTML
window.loadAllData = loadAllData;