import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { produitService, userService, orderService, paiementService } from '../services/api';
import './Dashboard.css';

// Constantes pour les statuts
const ORDER_STATUS = {
  EN_ATTENTE: { label: 'En Attente', icon: '⏳', color: '#ffc107' },
  EN_COURS: { label: 'En Cours', icon: '📦', color: '#17a2b8' },
  EN_ROUTE: { label: 'En Route', icon: '🚚', color: '#007bff' },
  LIVRE: { label: 'Livré', icon: '✅', color: '#28a745' },
  ANNULE: { label: 'Annulé', icon: '❌', color: '#dc3545' }
};

const PAIEMENT_STATUS = {
  EN_ATTENTE: { label: 'En Attente', icon: '⏳', color: '#ffc107' },
  SUCCES: { label: 'Réussi', icon: '✅', color: '#28a745' },
  ECHOUE: { label: 'Échoué', icon: '❌', color: '#dc3545' }
};

const METHODES_PAIEMENT = {
  MOBILE_MONEY: { label: 'Mobile Money', icon: '📱' },
  CARTE_BANCAIRE: { label: 'Carte Bancaire', icon: '💳' },
  ESPECES: { label: 'Espèces', icon: '💵' },
  VIREMENT: { label: 'Virement', icon: '🏦' }
};

const PRODUCT_STATUS = {
  DISPONIBLE: { label: 'Disponible', color: '#28a745' },
  RUPTURE_STOCK: { label: 'Rupture', color: '#dc3545' },
  EN_PROMOTION: { label: 'Promotion', color: '#fd7e14' },
  DESACTIVE: { label: 'Désactivé', color: '#6c757d' }
};

const DashboardAdmin = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  // Données
  const [produits, setProduits] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paiements, setPaiements] = useState([]);

  // Stats
  const [paiementStats, setPaiementStats] = useState(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Afficher notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 4000);
  };

  // Chargement initial des données
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProduits(),
        loadUsers(),
        loadOrders(),
        loadPaiements()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showNotification('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProduits = async () => {
    try {
      const data = await produitService.getAllProduits();
      setProduits(data || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const loadPaiements = async () => {
    try {
      const [enAttente, succes, echoue, stats] = await Promise.all([
        paiementService.getPaiementsByStatus('EN_ATTENTE').catch(() => []),
        paiementService.getPaiementsByStatus('SUCCES').catch(() => []),
        paiementService.getPaiementsByStatus('ECHOUE').catch(() => []),
        paiementService.getStats().catch(() => null)
      ]);
      setPaiements([...enAttente, ...succes, ...echoue]);
      setPaiementStats(stats);
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    }
  };

  // Statistiques calculées
  const computedStats = useMemo(() => {
    const totalProduits = produits.length;
    const produitsDisponibles = produits.filter(p => p.status === 'DISPONIBLE').length;
    const produitsRupture = produits.filter(p => p.status === 'RUPTURE_STOCK').length;
    const produitsPromo = produits.filter(p => p.status === 'EN_PROMOTION').length;

    const totalUsers = users.length;
    const clients = users.filter(u => u.role === 'CLIENT').length;
    const vendeurs = users.filter(u => u.role === 'VENDEUR').length;
    const admins = users.filter(u => u.role === 'ADMIN').length;

    const totalOrders = orders.length;
    const ordersEnAttente = orders.filter(o => o.orderStatus === 'EN_ATTENTE').length;
    const ordersLivrees = orders.filter(o => o.orderStatus === 'LIVRE').length;
    const ordersAnnulees = orders.filter(o => o.orderStatus === 'ANNULE').length;
    const revenus = orders
      .filter(o => o.paiementStatus === 'SUCCES')
      .reduce((sum, o) => sum + (o.montantTotal || 0), 0);

    return {
      produits: { total: totalProduits, disponibles: produitsDisponibles, rupture: produitsRupture, promo: produitsPromo },
      users: { total: totalUsers, clients, vendeurs, admins },
      orders: { total: totalOrders, enAttente: ordersEnAttente, livrees: ordersLivrees, annulees: ordersAnnulees, revenus },
      paiements: paiementStats || { totalPaiements: 0, paiementsSucces: 0, paiementsEnAttente: 0, paiementsEchoue: 0, montantTotal: 0 }
    };
  }, [produits, users, orders, paiementStats]);

  // Filtrer les données par date
  const filterByDate = (items, dateField = 'createdAt') => {
    if (dateFilter === 'all') return items;
    const now = new Date();
    const filterDate = new Date();
    
    switch (dateFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return items;
    }
    
    return items.filter(item => new Date(item[dateField]) >= filterDate);
  };

  // Actions
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpdateProduitStatus = async (id, newStatus) => {
    try {
      await produitService.updateStatus(id, newStatus);
      showNotification('✅ Statut du produit mis à jour!');
      loadProduits();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('❌ Erreur lors de la mise à jour');
    }
  };

  const handleDeleteProduit = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce produit?')) {
      try {
        await produitService.deleteProduit(id);
        showNotification('✅ Produit supprimé!');
        loadProduits();
      } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors de la suppression');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { orderStatus: newStatus });
      showNotification('✅ Statut de commande mis à jour!');
      loadOrders();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('❌ Erreur lors de la mise à jour');
    }
  };

  const handleUpdatePaiementStatus = async (paiementId, newStatus) => {
    try {
      if (newStatus === 'SUCCES') {
        await paiementService.confirmPaiement(paiementId, { transactionReference: `ADMIN-${Date.now()}` });
      } else if (newStatus === 'ECHOUE') {
        await paiementService.failPaiement(paiementId, 'Rejeté par administrateur');
      }
      showNotification('✅ Statut de paiement mis à jour!');
      loadPaiements();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('❌ Erreur lors de la mise à jour du paiement');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await userService.updateUser(userId, { role: newRole });
      showNotification('✅ Rôle utilisateur mis à jour!');
      loadUsers();
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('❌ Erreur lors de la mise à jour du rôle');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur?')) {
      try {
        await userService.deleteUser(userId);
        showNotification('✅ Utilisateur supprimé!');
        loadUsers();
      } catch (error) {
        console.error('Erreur:', error);
        showNotification('❌ Erreur lors de la suppression');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ==================== RENDER SECTIONS ====================

  // Vue d'ensemble
  const renderOverview = () => (
    <div className="admin-overview">
      {/* Stats principales */}
      <div className="overview-stats-grid">
        {/* Produits */}
        <div className="overview-card">
          <div className="overview-card-header">
            <span className="overview-icon">📦</span>
            <h4>Produits</h4>
          </div>
          <div className="overview-card-stats">
            <div className="big-stat">{computedStats.produits.total}</div>
            <div className="sub-stats">
              <span className="success">✅ {computedStats.produits.disponibles} disponibles</span>
              <span className="warning">⚠️ {computedStats.produits.rupture} en rupture</span>
              <span className="promo">🏷️ {computedStats.produits.promo} en promo</span>
            </div>
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="overview-card">
          <div className="overview-card-header">
            <span className="overview-icon">👥</span>
            <h4>Utilisateurs</h4>
          </div>
          <div className="overview-card-stats">
            <div className="big-stat">{computedStats.users.total}</div>
            <div className="sub-stats">
              <span className="client">🛒 {computedStats.users.clients} clients</span>
              <span className="vendeur">🏪 {computedStats.users.vendeurs} vendeurs</span>
              <span className="admin">⚙️ {computedStats.users.admins} admins</span>
            </div>
          </div>
        </div>

        {/* Commandes */}
        <div className="overview-card">
          <div className="overview-card-header">
            <span className="overview-icon">🛒</span>
            <h4>Commandes</h4>
          </div>
          <div className="overview-card-stats">
            <div className="big-stat">{computedStats.orders.total}</div>
            <div className="sub-stats">
              <span className="warning">⏳ {computedStats.orders.enAttente} en attente</span>
              <span className="success">✅ {computedStats.orders.livrees} livrées</span>
              <span className="danger">❌ {computedStats.orders.annulees} annulées</span>
            </div>
          </div>
        </div>

        {/* Revenus */}
        <div className="overview-card revenue">
          <div className="overview-card-header">
            <span className="overview-icon">💰</span>
            <h4>Revenus</h4>
          </div>
          <div className="overview-card-stats">
            <div className="big-stat money">{computedStats.orders.revenus.toFixed(2)} $</div>
            <div className="sub-stats">
              <span className="success">💳 {computedStats.paiements.paiementsSucces || 0} paiements réussis</span>
              <span className="warning">⏳ {computedStats.paiements.paiementsEnAttente || 0} en attente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="recent-activity-grid">
        {/* Dernières commandes */}
        <div className="recent-section">
          <h3>🛒 Dernières Commandes</h3>
          <div className="recent-list">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="recent-item">
                <div className="item-main">
                  <span className="item-id">#{order.id?.substring(0, 8)}</span>
                  <span className="item-amount">{order.montantTotal} {order.currency}</span>
                </div>
                <div className="item-meta">
                  <span className={`mini-badge ${order.orderStatus?.toLowerCase()}`}>
                    {ORDER_STATUS[order.orderStatus]?.icon} {ORDER_STATUS[order.orderStatus]?.label}
                  </span>
                  <span className="item-date">{formatDate(order.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('orders')}>
            Voir toutes les commandes →
          </button>
        </div>

        {/* Derniers utilisateurs */}
        <div className="recent-section">
          <h3>👥 Nouveaux Utilisateurs</h3>
          <div className="recent-list">
            {users.slice(0, 5).map(user => (
              <div key={user.id} className="recent-item user">
                <div className="user-avatar-small">
                  {user.photoProfil ? (
                    <img src={user.photoProfil} alt="" />
                  ) : (
                    <span>{user.prenom?.charAt(0)}{user.nom?.charAt(0)}</span>
                  )}
                </div>
                <div className="item-main">
                  <span className="item-name">{user.prenom} {user.nom}</span>
                  <span className="item-email">{user.email}</span>
                </div>
                <span className={`role-badge ${user.role?.toLowerCase()}`}>{user.role}</span>
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('users')}>
            Voir tous les utilisateurs →
          </button>
        </div>

        {/* Derniers produits */}
        <div className="recent-section">
          <h3>📦 Derniers Produits</h3>
          <div className="recent-list">
            {produits.slice(0, 5).map(produit => (
              <div key={produit.id} className="recent-item">
                <div className="product-thumb">
                  {produit.imageUrl ? (
                    <img src={produit.imageUrl} alt="" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className="item-main">
                  <span className="item-name">{produit.titre}</span>
                  <span className="item-price">{produit.prix} {produit.currency}</span>
                </div>
                <span className={`status-dot ${produit.status?.toLowerCase()}`}></span>
              </div>
            ))}
          </div>
          <button className="view-all-btn" onClick={() => setActiveTab('produits')}>
            Voir tous les produits →
          </button>
        </div>
      </div>
    </div>
  );

  // Gestion des produits
  const renderProduits = () => {
    const filteredProduits = produits.filter(p => {
      const matchSearch = !searchQuery || 
        p.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="admin-section">
        <div className="section-header">
          <h3>📦 Gestion des Produits ({filteredProduits.length})</h3>
          <div className="section-filters">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(PRODUCT_STATUS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Catégorie</th>
                  <th>Vendeur</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProduits.map(produit => (
                  <tr key={produit.id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          {produit.imageUrl ? (
                            <img src={produit.imageUrl} alt="" />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className="product-info">
                          <span className="product-title">{produit.titre}</span>
                          <span className="product-id">ID: {produit.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="price-cell">{produit.prix} {produit.currency || 'USD'}</td>
                    <td>
                      <span className={`stock-badge ${produit.stock <= 5 ? 'low' : ''}`}>
                        {produit.stock} unités
                      </span>
                    </td>
                    <td>{produit.categorie || '-'}</td>
                    <td className="vendeur-cell">{produit.vendeurId?.substring(0, 8) || '-'}</td>
                    <td>
                      <select
                        value={produit.status}
                        onChange={e => handleUpdateProduitStatus(produit.id, e.target.value)}
                        className={`status-select ${produit.status?.toLowerCase()}`}
                      >
                        {Object.entries(PRODUCT_STATUS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => { setSelectedItem(produit); setShowOrderModal(true); }}
                          title="Voir détails"
                        >
                          👁️
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteProduit(produit.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Gestion des utilisateurs
  const renderUsers = () => {
    const filteredUsers = users.filter(u => {
      const matchSearch = !searchQuery || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nom?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || u.role === statusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="admin-section">
        <div className="section-header">
          <h3>👥 Gestion des Utilisateurs ({filteredUsers.length})</h3>
          <div className="section-filters">
            <input
              type="text"
              placeholder="🔍 Rechercher par nom ou email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les rôles</option>
              <option value="CLIENT">Client</option>
              <option value="VENDEUR">Vendeur</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.photoProfil ? (
                            <img src={user.photoProfil} alt="" />
                          ) : (
                            <span>{user.prenom?.charAt(0)}{user.nom?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="user-info">
                          <span className="user-name">{user.prenom} {user.nom}</span>
                          <span className="user-id">ID: {user.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>{user.telephone || '-'}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={e => handleUpdateUserRole(user.id, e.target.value)}
                        className={`role-select ${user.role?.toLowerCase()}`}
                        disabled={user.uid === userProfile?.uid}
                      >
                        <option value="CLIENT">Client</option>
                        <option value="VENDEUR">Vendeur</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => { setSelectedItem(user); setShowUserModal(true); }}
                          title="Voir profil"
                        >
                          👁️
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Supprimer"
                          disabled={user.uid === userProfile?.uid}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Gestion des commandes
  const renderOrders = () => {
    let filteredOrders = filterByDate(orders);
    filteredOrders = filteredOrders.filter(o => {
      const matchSearch = !searchQuery || 
        o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.userId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || o.orderStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="admin-section">
        <div className="section-header">
          <h3>🛒 Gestion des Commandes ({filteredOrders.length})</h3>
          <div className="section-filters">
            <input
              type="text"
              placeholder="🔍 Rechercher par ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(ORDER_STATUS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>

        {/* Stats des commandes */}
        <div className="mini-stats-row">
          <div className="mini-stat">
            <span className="mini-stat-value">{computedStats.orders.total}</span>
            <span className="mini-stat-label">Total</span>
          </div>
          <div className="mini-stat warning">
            <span className="mini-stat-value">{computedStats.orders.enAttente}</span>
            <span className="mini-stat-label">En attente</span>
          </div>
          <div className="mini-stat success">
            <span className="mini-stat-value">{computedStats.orders.livrees}</span>
            <span className="mini-stat-label">Livrées</span>
          </div>
          <div className="mini-stat info">
            <span className="mini-stat-value">{computedStats.orders.revenus.toFixed(0)} $</span>
            <span className="mini-stat-label">Revenus</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Commande</th>
                  <th>Client</th>
                  <th>Articles</th>
                  <th>Montant</th>
                  <th>Paiement</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td className="id-cell">#{order.id?.substring(0, 8)}</td>
                    <td className="client-cell">{order.userId?.substring(0, 8)}</td>
                    <td>{order.items?.length || 0} article(s)</td>
                    <td className="amount-cell">{order.montantTotal} {order.currency}</td>
                    <td>
                      <span className={`status-badge small ${order.paiementStatus?.toLowerCase()}`}>
                        {PAIEMENT_STATUS[order.paiementStatus]?.icon} {PAIEMENT_STATUS[order.paiementStatus]?.label || order.paiementStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.orderStatus}
                        onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`status-select ${order.orderStatus?.toLowerCase()}`}
                      >
                        {Object.entries(ORDER_STATUS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="date-cell">{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => { setSelectedItem(order); setShowOrderModal(true); }}
                          title="Voir détails"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Gestion des paiements
  const renderPaiements = () => {
    let filteredPaiements = filterByDate(paiements);
    filteredPaiements = filteredPaiements.filter(p => {
      const matchSearch = !searchQuery || 
        p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="admin-section">
        <div className="section-header">
          <h3>💳 Gestion des Paiements ({filteredPaiements.length})</h3>
          <div className="section-filters">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(PAIEMENT_STATUS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
            </select>
          </div>
        </div>

        {/* Stats des paiements */}
        <div className="mini-stats-row">
          <div className="mini-stat">
            <span className="mini-stat-value">{computedStats.paiements.totalPaiements || 0}</span>
            <span className="mini-stat-label">Total</span>
          </div>
          <div className="mini-stat success">
            <span className="mini-stat-value">{computedStats.paiements.paiementsSucces || 0}</span>
            <span className="mini-stat-label">Réussis</span>
          </div>
          <div className="mini-stat warning">
            <span className="mini-stat-value">{computedStats.paiements.paiementsEnAttente || 0}</span>
            <span className="mini-stat-label">En attente</span>
          </div>
          <div className="mini-stat danger">
            <span className="mini-stat-value">{computedStats.paiements.paiementsEchoue || 0}</span>
            <span className="mini-stat-label">Échoués</span>
          </div>
          <div className="mini-stat info">
            <span className="mini-stat-value">{(computedStats.paiements.montantTotal || 0).toFixed(0)} $</span>
            <span className="mini-stat-label">Montant total</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Paiement</th>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.map(paiement => (
                  <tr key={paiement.id}>
                    <td className="id-cell">#{paiement.id?.substring(0, 8)}</td>
                    <td className="id-cell">#{paiement.orderId?.substring(0, 8)}</td>
                    <td className="client-cell">{paiement.userId?.substring(0, 8)}</td>
                    <td className="amount-cell">{paiement.montant} {paiement.currency}</td>
                    <td>
                      <span className="method-badge">
                        {METHODES_PAIEMENT[paiement.methodePaiement]?.icon} {METHODES_PAIEMENT[paiement.methodePaiement]?.label || paiement.methodePaiement}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${paiement.status?.toLowerCase()}`}>
                        {PAIEMENT_STATUS[paiement.status]?.icon} {PAIEMENT_STATUS[paiement.status]?.label || paiement.status}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(paiement.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {paiement.status === 'EN_ATTENTE' && (
                          <>
                            <button 
                              className="action-btn success"
                              onClick={() => handleUpdatePaiementStatus(paiement.id, 'SUCCES')}
                              title="Confirmer"
                            >
                              ✅
                            </button>
                            <button 
                              className="action-btn danger"
                              onClick={() => handleUpdatePaiementStatus(paiement.id, 'ECHOUE')}
                              title="Rejeter"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        <button 
                          className="action-btn view"
                          onClick={() => { setSelectedItem(paiement); setShowPaiementModal(true); }}
                          title="Voir détails"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Modal détails utilisateur
  const renderUserModal = () => {
    if (!showUserModal || !selectedItem) return null;
    const user = selectedItem;

    return (
      <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
        <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={() => setShowUserModal(false)}>×</button>
          <h2>👤 Détails Utilisateur</h2>
          
          <div className="user-detail-header">
            <div className="user-avatar-large">
              {user.photoProfil ? (
                <img src={user.photoProfil} alt="" />
              ) : (
                <span>{user.prenom?.charAt(0)}{user.nom?.charAt(0)}</span>
              )}
            </div>
            <div className="user-detail-info">
              <h3>{user.prenom} {user.nom}</h3>
              <span className={`role-badge large ${user.role?.toLowerCase()}`}>{user.role}</span>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Téléphone</span>
              <span className="detail-value">{user.telephone || 'Non renseigné'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">UID Firebase</span>
              <span className="detail-value">{user.uid || user.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date d'inscription</span>
              <span className="detail-value">{formatDate(user.createdAt)}</span>
            </div>
            {user.adresse && (
              <div className="detail-item full">
                <span className="detail-label">Adresse</span>
                <span className="detail-value">
                  {user.adresse.avenue}, {user.adresse.quartier}<br/>
                  {user.adresse.commune}, {user.adresse.ville}<br/>
                  {user.adresse.province}, {user.adresse.pays}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Modal détails commande
  const renderOrderModal = () => {
    if (!showOrderModal || !selectedItem) return null;
    const order = selectedItem;

    return (
      <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
        <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={() => setShowOrderModal(false)}>×</button>
          <h2>📦 Détails Commande #{order.id?.substring(0, 8)}</h2>
          
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Client ID</span>
              <span className="detail-value">{order.userId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Montant Total</span>
              <span className="detail-value amount">{order.montantTotal} {order.currency}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Statut Commande</span>
              <span className={`status-badge ${order.orderStatus?.toLowerCase()}`}>
                {ORDER_STATUS[order.orderStatus]?.icon} {ORDER_STATUS[order.orderStatus]?.label}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Statut Paiement</span>
              <span className={`status-badge ${order.paiementStatus?.toLowerCase()}`}>
                {PAIEMENT_STATUS[order.paiementStatus]?.icon} {PAIEMENT_STATUS[order.paiementStatus]?.label}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date de création</span>
              <span className="detail-value">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="order-items-section">
              <h4>Articles commandés ({order.items.length})</h4>
              <div className="order-items-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span className="item-name">{item.produitTitre || `Produit ${item.produitId?.substring(0, 8)}`}</span>
                    <span className="item-qty">x{item.quantite}</span>
                    <span className="item-price">{item.prixUnitaire} {order.currency}</span>
                    <span className="item-total">{(item.prixUnitaire * item.quantite).toFixed(2)} {order.currency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.adresseLivraison && (
            <div className="address-section">
              <h4>📍 Adresse de livraison</h4>
              <div className="address-content">
                <p><strong>{order.adresseLivraison.nomDestinataire}</strong></p>
                <p>{order.adresseLivraison.avenue}, {order.adresseLivraison.quartier}</p>
                <p>{order.adresseLivraison.commune}, {order.adresseLivraison.ville}</p>
                <p>{order.adresseLivraison.province}, {order.adresseLivraison.pays}</p>
                <p>📞 {order.adresseLivraison.telephone}</p>
                {order.adresseLivraison.reference && (
                  <p><em>Réf: {order.adresseLivraison.reference}</em></p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal détails paiement
  const renderPaiementModal = () => {
    if (!showPaiementModal || !selectedItem) return null;
    const paiement = selectedItem;

    return (
      <div className="modal-overlay" onClick={() => setShowPaiementModal(false)}>
        <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={() => setShowPaiementModal(false)}>×</button>
          <h2>💳 Détails Paiement #{paiement.id?.substring(0, 8)}</h2>
          
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">ID Commande</span>
              <span className="detail-value">{paiement.orderId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Client ID</span>
              <span className="detail-value">{paiement.userId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Montant</span>
              <span className="detail-value amount">{paiement.montant} {paiement.currency}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Méthode</span>
              <span className="method-badge large">
                {METHODES_PAIEMENT[paiement.methodePaiement]?.icon} {METHODES_PAIEMENT[paiement.methodePaiement]?.label}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Statut</span>
              <span className={`status-badge large ${paiement.status?.toLowerCase()}`}>
                {PAIEMENT_STATUS[paiement.status]?.icon} {PAIEMENT_STATUS[paiement.status]?.label}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(paiement.createdAt)}</span>
            </div>
            {paiement.transactionReference && (
              <div className="detail-item full">
                <span className="detail-label">Référence Transaction</span>
                <span className="detail-value">{paiement.transactionReference}</span>
              </div>
            )}
            {paiement.numeroTelephone && (
              <div className="detail-item">
                <span className="detail-label">Téléphone</span>
                <span className="detail-value">{paiement.numeroTelephone}</span>
              </div>
            )}
            {paiement.providerResponse && (
              <div className="detail-item full">
                <span className="detail-label">Réponse Provider</span>
                <pre className="detail-value code">{JSON.stringify(paiement.providerResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container admin">
      {notification && (
        <div className="notification-toast">
          {notification}
        </div>
      )}

      <header className="dashboard-header">
        <h1>⚙️ Administration</h1>
        <div className="header-actions">
          <button onClick={loadAllData} className="refresh-btn" title="Rafraîchir">
            🔄
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-card">
          <div className="welcome-avatar">
            {userProfile?.photoProfil ? (
              <img src={userProfile.photoProfil} alt="Profile" />
            ) : (
              <div className="avatar-placeholder admin">
                {userProfile?.prenom?.charAt(0)}{userProfile?.nom?.charAt(0)}
              </div>
            )}
          </div>
          <div className="welcome-info">
            <h2>Bonjour {userProfile?.prenom} {userProfile?.nom}!</h2>
            <p className="role-badge admin">{userProfile?.role}</p>
            <p className="email">{userProfile?.email}</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="admin-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => { setActiveTab('overview'); setSearchQuery(''); setStatusFilter(''); }}
          >
            📊 Vue d'ensemble
          </button>
          <button 
            className={activeTab === 'produits' ? 'active' : ''} 
            onClick={() => { setActiveTab('produits'); setSearchQuery(''); setStatusFilter(''); }}
          >
            📦 Produits ({produits.length})
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => { setActiveTab('users'); setSearchQuery(''); setStatusFilter(''); }}
          >
            👥 Utilisateurs ({users.length})
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); setStatusFilter(''); }}
          >
            🛒 Commandes ({orders.length})
          </button>
          <button 
            className={activeTab === 'paiements' ? 'active' : ''} 
            onClick={() => { setActiveTab('paiements'); setSearchQuery(''); setStatusFilter(''); }}
          >
            💳 Paiements ({paiements.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'produits' && renderProduits()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'paiements' && renderPaiements()}
        </div>
      </main>

      {/* Modals */}
      {renderUserModal()}
      {renderOrderModal()}
      {renderPaiementModal()}
    </div>
  );
};

export default DashboardAdmin;
