import axios from 'axios';

// Utiliser l'API Gateway comme point d'entrée unique
const API_GATEWAY_URL = 'http://localhost:8080';

// Instance API unique via API Gateway
const api = axios.create({
  baseURL: `${API_GATEWAY_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alias pour compatibilité
const userApi = api;
const produitApi = api;

// Intercepteur pour ajouter le token d'authentification
const addAuthInterceptor = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs 401
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token expiré ou invalide - rediriger vers login
        console.warn('Session expirée ou non autorisé');
        localStorage.removeItem('authToken');
        // Ne pas rediriger si on est déjà sur login/register
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(api);

// Service utilisateur
export const userService = {
  // Inscription d'un nouvel utilisateur
  register: async (userData) => {
    const response = await userApi.post('/users/register', userData);
    return response.data;
  },

  // Vérifier le token et récupérer les infos utilisateur
  verifyToken: async (token) => {
    const response = await userApi.post('/users/verify-token', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer tous les utilisateurs (Admin)
  getAllUsers: async () => {
    const response = await userApi.get('/users');
    return response.data;
  },

  // Récupérer un utilisateur par ID
  getUserById: async (id) => {
    const response = await userApi.get(`/users/${id}`);
    return response.data;
  },

  // Récupérer un utilisateur par email
  getUserByEmail: async (email) => {
    const response = await userApi.get(`/users/email/${email}`);
    return response.data;
  },

  // Récupérer les utilisateurs par rôle (Admin)
  getUsersByRole: async (role) => {
    const response = await userApi.get(`/users/role/${role}`);
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (id, userData) => {
    const response = await userApi.put(`/users/${id}`, userData);
    return response.data;
  },

  // Mettre à jour le rôle d'un utilisateur (Admin)
  updateUserRole: async (id, role) => {
    const response = await userApi.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Supprimer un utilisateur
  deleteUser: async (id) => {
    const response = await userApi.delete(`/users/${id}`);
    return response.data;
  }
};

// Service produit
export const produitService = {
  // Récupérer tous les produits
  getAllProduits: async (page = 0, size = 10) => {
    const response = await produitApi.get(`/produits?page=${page}&size=${size}`);
    return response.data;
  },

  // Récupérer un produit par ID
  getProduitById: async (id) => {
    const response = await produitApi.get(`/produits/${id}`);
    return response.data;
  },

  // Créer un nouveau produit
  createProduit: async (produitData) => {
    const response = await produitApi.post('/produits', produitData);
    return response.data;
  },

  // Mettre à jour un produit
  updateProduit: async (id, produitData) => {
    const response = await produitApi.put(`/produits/${id}`, produitData);
    return response.data;
  },

  // Supprimer un produit
  deleteProduit: async (id) => {
    const response = await produitApi.delete(`/produits/${id}`);
    return response.data;
  },

  // Récupérer les produits d'un vendeur
  getProduitsByVendeur: async (vendeurId) => {
    const response = await produitApi.get(`/produits/vendeur/${vendeurId}`);
    return response.data;
  },

  // Rechercher des produits
  searchProduits: async (query, page = 0, size = 100) => {
    const response = await produitApi.get(`/produits/search?keyword=${query}&page=${page}&size=${size}`);
    return response.data.content || response.data;
  },

  // Récupérer les produits par catégorie
  getProduitsByCategorie: async (categorie) => {
    const response = await produitApi.get(`/produits/categorie/${categorie}`);
    return response.data;
  },

  // Récupérer les produits disponibles
  getProduitsDisponibles: async () => {
    const response = await produitApi.get('/produits/status/DISPONIBLE');
    return response.data;
  },

  // Mettre à jour le stock d'un produit
  updateStock: async (id, quantite) => {
    const response = await produitApi.put(`/produits/${id}/stock?quantite=${quantite}`);
    return response.data;
  },

  // Mettre à jour le statut d'un produit
  updateStatus: async (id, status) => {
    const response = await produitApi.put(`/produits/${id}/status?status=${status}`);
    return response.data;
  }
};

// Service commandes
export const orderService = {
  // Créer une nouvelle commande
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Récupérer toutes les commandes (Admin)
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Récupérer une commande par ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Récupérer les commandes d'un utilisateur
  getOrdersByUserId: async (userId) => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  // Récupérer les commandes par statut
  getOrdersByStatus: async (status) => {
    const response = await api.get(`/orders/status/${status}`);
    return response.data;
  },

  // Récupérer les commandes par statut de paiement
  getOrdersByPaiementStatus: async (status) => {
    const response = await api.get(`/orders/paiement-status/${status}`);
    return response.data;
  },

  // Mettre à jour le statut d'une commande
  updateOrderStatus: async (id, statusData) => {
    const response = await api.patch(`/orders/${id}/status`, statusData);
    return response.data;
  },

  // Annuler une commande
  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  // Supprimer une commande
  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  // Obtenir les statistiques des commandes
  getOrderStats: async () => {
    const response = await api.get('/orders/stats');
    return response.data;
  }
};

// Service Panier (Cart) - Redis
export const cartService = {
  // Récupérer le panier d'un utilisateur
  getCart: async (userId) => {
    const response = await api.get(`/carte/${userId}`);
    return response.data;
  },

  // Ajouter un produit au panier
  addToCart: async (userId, produitId, quantite) => {
    const response = await api.post(`/carte/${userId}/items`, {
      produitId,
      quantite
    });
    return response.data;
  },

  // Mettre à jour la quantité d'un produit
  updateQuantity: async (userId, produitId, quantite) => {
    const response = await api.patch(`/carte/${userId}/items/${produitId}`, {
      quantite
    });
    return response.data;
  },

  // Supprimer un produit du panier
  removeFromCart: async (userId, produitId) => {
    const response = await api.delete(`/carte/${userId}/items/${produitId}`);
    return response.data;
  },

  // Vider le panier
  clearCart: async (userId) => {
    const response = await api.delete(`/carte/${userId}`);
    return response.data;
  }
};

// Service Paiement
export const paiementService = {
  // Créer un nouveau paiement
  createPaiement: async (paiementData) => {
    const response = await api.post('/paiements', paiementData);
    return response.data;
  },

  // Récupérer tous les paiements (Admin)
  getAllPaiements: async () => {
    const response = await api.get('/paiements');
    return response.data;
  },

  // Récupérer un paiement par ID
  getPaiementById: async (id) => {
    const response = await api.get(`/paiements/${id}`);
    return response.data;
  },

  // Récupérer les paiements d'une commande
  getPaiementsByOrderId: async (orderId) => {
    const response = await api.get(`/paiements/order/${orderId}`);
    return response.data;
  },

  // Récupérer les paiements d'un utilisateur
  getPaiementsByUserId: async (userId) => {
    const response = await api.get(`/paiements/user/${userId}`);
    return response.data;
  },

  // Récupérer les paiements par statut
  getPaiementsByStatus: async (status) => {
    const response = await api.get(`/paiements/status/${status}`);
    return response.data;
  },

  // Mettre à jour le statut d'un paiement
  updatePaiementStatus: async (id, statusData) => {
    const response = await api.patch(`/paiements/${id}/status`, statusData);
    return response.data;
  },

  // Confirmer un paiement
  confirmPaiement: async (id, providerResponse) => {
    const response = await api.post(`/paiements/${id}/confirm`, providerResponse);
    return response.data;
  },

  // Marquer un paiement comme échoué
  failPaiement: async (id, reason) => {
    const response = await api.post(`/paiements/${id}/fail`, { reason });
    return response.data;
  },

  // Vérifier si une commande est payée
  checkOrderPaymentStatus: async (orderId) => {
    const response = await api.get(`/paiements/order/${orderId}/paid`);
    return response.data;
  },

  // Obtenir les statistiques des paiements
  getStats: async () => {
    const response = await api.get('/paiements/stats');
    return response.data;
  }
};

// Constantes pour les méthodes de paiement
export const METHODES_PAIEMENT = {
  MPESA: { label: 'M-Pesa', icon: '📱', color: '#00A859' },
  ORANGE_MONEY: { label: 'Orange Money', icon: '🍊', color: '#FF6600' },
  AIRTEL_MONEY: { label: 'Airtel Money', icon: '📲', color: '#ED1C24' },
  AFRI_MONEY: { label: 'Afri Money', icon: '💵', color: '#1E90FF' },
  CARTE_BANCAIRE: { label: 'Carte Bancaire', icon: '💳', color: '#0066CC' },
  CASH_ON_DELIVERY: { label: 'Paiement à la livraison', icon: '💰', color: '#28A745' }
};

// Constantes pour les statuts de paiement
export const PAIEMENT_STATUS = {
  EN_ATTENTE: { label: 'En attente', color: '#FFC107' },
  SUCCES: { label: 'Réussi', color: '#28A745' },
  ECHOUE: { label: 'Échoué', color: '#DC3545' }
};

export default { userService, produitService, orderService, cartService, paiementService };
