# 🔧 SPÉCIFICATIONS TECHNIQUES DÉTAILLÉES

Ce document fournit les détails techniques pour implémenter les fonctionnalités prioritaires identifiées dans le document de recommandations.

---

## 📚 TABLE DES MATIÈRES
1. [Microservices à Créer](#microservices-à-créer)
2. [Modèles de Données](#modèles-de-données)
3. [APIs à Implémenter](#apis-à-implémenter)
4. [Composants Frontend](#composants-frontend)
5. [Intégrations Tierces](#intégrations-tierces)

---

## 🏗️ MICROSERVICES À CRÉER

### 1. ReviewService (Avis et Évaluations)
```
Port: 8086
Base de données: MongoDB
Collection: reviews
```

**Responsabilités:**
- Gestion des avis clients
- Calcul des moyennes de notes
- Questions/Réponses sur les produits
- Modération des avis

**Endpoints suggérés:**
```
POST   /api/reviews                    # Créer un avis
GET    /api/reviews/product/{id}       # Avis d'un produit
GET    /api/reviews/user/{id}          # Avis d'un utilisateur
PUT    /api/reviews/{id}               # Modifier un avis
DELETE /api/reviews/{id}               # Supprimer un avis
POST   /api/reviews/{id}/vote          # Voter utilité
GET    /api/reviews/stats/{productId}  # Statistiques
```

### 2. NotificationService (Notifications)
```
Port: 8087
Technologies: Firebase Cloud Messaging, WebSocket, Email (SendGrid)
```

**Responsabilités:**
- Notifications push
- Emails transactionnels
- SMS (Twilio)
- Notifications in-app temps réel

**Endpoints suggérés:**
```
POST   /api/notifications/push          # Envoyer push
POST   /api/notifications/email         # Envoyer email
POST   /api/notifications/sms           # Envoyer SMS
GET    /api/notifications/user/{id}     # Notifications utilisateur
PATCH  /api/notifications/{id}/read     # Marquer comme lu
POST   /api/notifications/subscribe     # Abonnement topic
DELETE /api/notifications/unsubscribe   # Désabonnement
```

### 3. SearchService (Recherche Avancée)
```
Port: 8088
Technologies: Elasticsearch
```

**Responsabilités:**
- Indexation des produits
- Recherche full-text
- Auto-complétion
- Filtres avancés
- Recherche par facettes

**Endpoints suggérés:**
```
GET    /api/search/products?q=          # Recherche produits
GET    /api/search/autocomplete?q=      # Auto-complétion
GET    /api/search/suggestions?q=       # "Vouliez-vous dire..."
POST   /api/search/index/{productId}    # Indexer produit
DELETE /api/search/index/{productId}    # Supprimer index
GET    /api/search/filters/{category}   # Filtres par catégorie
```

### 4. WishlistService (Favoris)
```
Port: 8089
Base de données: Redis + MongoDB
```

**Responsabilités:**
- Listes de souhaits
- Listes multiples
- Partage de listes
- Alertes disponibilité/prix

**Endpoints suggérés:**
```
GET    /api/wishlist/{userId}           # Obtenir wishlist
POST   /api/wishlist/{userId}/items     # Ajouter produit
DELETE /api/wishlist/{userId}/items/{id}# Supprimer produit
POST   /api/wishlist/{userId}/lists     # Créer liste
PUT    /api/wishlist/lists/{id}         # Modifier liste
POST   /api/wishlist/alerts/{productId} # Créer alerte prix
```

### 5. PromotionService (Promotions)
```
Port: 8090
Base de données: PostgreSQL
```

**Responsabilités:**
- Codes promo
- Ventes flash
- Programme fidélité
- Points de fidélité

**Endpoints suggérés:**
```
POST   /api/promotions/codes            # Créer code promo
GET    /api/promotions/validate/{code}  # Valider code
POST   /api/promotions/flash            # Créer vente flash
GET    /api/promotions/active           # Promotions actives
GET    /api/loyalty/points/{userId}     # Points fidélité
POST   /api/loyalty/earn                # Gagner des points
POST   /api/loyalty/redeem              # Utiliser des points
```

### 6. TrackingService (Suivi Livraison)
```
Port: 8091
Technologies: MongoDB, WebSocket
```

**Responsabilités:**
- Suivi temps réel
- Intégration transporteurs
- Notifications statut
- Historique livraisons

**Endpoints suggérés:**
```
GET    /api/tracking/{orderId}          # Statut livraison
GET    /api/tracking/{orderId}/history  # Historique
WS     /ws/tracking/{orderId}           # WebSocket temps réel
POST   /api/tracking/{orderId}/update   # Mise à jour (webhook)
GET    /api/tracking/carrier/{carrierId}# Statut transporteur
```

### 7. ChatService (Messagerie)
```
Port: 8092
Technologies: WebSocket, MongoDB
```

**Responsabilités:**
- Chat client-vendeur
- Support client
- Historique conversations
- Chatbot basique

**Endpoints suggérés:**
```
WS     /ws/chat/{conversationId}        # WebSocket chat
GET    /api/chat/conversations/{userId} # Liste conversations
POST   /api/chat/conversations          # Nouvelle conversation
GET    /api/chat/messages/{convId}      # Messages
POST   /api/chat/messages               # Envoyer message
POST   /api/chat/bot                    # Message au chatbot
```

### 8. AnalyticsService (Analytics)
```
Port: 8093
Technologies: ClickHouse/TimescaleDB, Kafka
```

**Responsabilités:**
- Tracking événements
- Métriques temps réel
- Rapports vendeurs
- Analytics produits

**Endpoints suggérés:**
```
POST   /api/analytics/events            # Enregistrer événement
GET    /api/analytics/dashboard/vendor/{id}  # Dashboard vendeur
GET    /api/analytics/product/{id}/stats     # Stats produit
GET    /api/analytics/realtime               # Métriques temps réel
GET    /api/analytics/reports/{type}         # Rapports
```

---

## 📊 MODÈLES DE DONNÉES

### Review (Avis)
```java
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    private String productId;
    private String userId;
    private String userName;
    private String userPhoto;
    private int rating;  // 1-5
    private String title;
    private String content;
    private List<String> images;
    private String videoUrl;
    private boolean verifiedPurchase;
    private int helpfulVotes;
    private int totalVotes;
    private ReviewStatus status;
    private String vendorResponse;
    private LocalDateTime vendorResponseDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

public enum ReviewStatus {
    PENDING, APPROVED, REJECTED, FLAGGED
}
```

### Wishlist (Favoris)
```java
@Document(collection = "wishlists")
public class Wishlist {
    @Id
    private String id;
    private String userId;
    private String name;
    private String description;
    private boolean isPublic;
    private List<WishlistItem> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
public class WishlistItem {
    private String productId;
    private String productTitle;
    private String productImage;
    private BigDecimal priceAtAdd;
    private BigDecimal currentPrice;
    private boolean priceAlert;
    private BigDecimal targetPrice;
    private LocalDateTime addedAt;
}
```

### Promotion (Code Promo)
```java
@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private String id;
    private String code;
    private PromotionType type;  // PERCENTAGE, FIXED, FREE_SHIPPING
    private BigDecimal value;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscount;
    private int usageLimit;
    private int usedCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String vendorId;  // null = plateforme
    private List<String> applicableCategories;
    private List<String> applicableProducts;
    private List<String> excludedProducts;
    private boolean isActive;
}
```

### LoyaltyAccount (Fidélité)
```java
@Entity
@Table(name = "loyalty_accounts")
public class LoyaltyAccount {
    @Id
    private String userId;
    private int points;
    private LoyaltyTier tier;  // BRONZE, SILVER, GOLD, PLATINUM
    private int lifetimePoints;
    private int lifetimeOrders;
    private BigDecimal lifetimeSpent;
    private LocalDateTime memberSince;
    private LocalDateTime tierExpiry;
    
    @OneToMany
    private List<PointTransaction> transactions;
}

@Entity
public class PointTransaction {
    @Id
    @GeneratedValue
    private Long id;
    private String userId;
    private String orderId;
    private int points;
    private TransactionType type;  // EARNED, REDEEMED, EXPIRED, BONUS
    private String description;
    private LocalDateTime createdAt;
}
```

### Notification
```java
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;
    private NotificationType type;
    private String title;
    private String body;
    private Map<String, String> data;
    private NotificationChannel channel;  // PUSH, EMAIL, SMS, IN_APP
    private boolean isRead;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
}

public enum NotificationType {
    ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED,
    PRICE_DROP, BACK_IN_STOCK, PROMOTION,
    MESSAGE_RECEIVED, REVIEW_RESPONSE,
    ACCOUNT_SECURITY, PAYMENT_RECEIVED
}
```

### Conversation (Chat)
```java
@Document(collection = "conversations")
public class Conversation {
    @Id
    private String id;
    private ConversationType type;  // CLIENT_VENDOR, SUPPORT
    private List<Participant> participants;
    private String lastMessageId;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
    private boolean isResolved;
    private String relatedOrderId;
    private String relatedProductId;
}

@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private MessageType type;  // TEXT, IMAGE, PRODUCT_LINK, ORDER_LINK
    private String content;
    private String attachmentUrl;
    private boolean isRead;
    private LocalDateTime sentAt;
}
```

### TrackingEvent (Suivi)
```java
@Document(collection = "tracking_events")
public class TrackingEvent {
    @Id
    private String id;
    private String orderId;
    private String carrierId;
    private String trackingNumber;
    private TrackingStatus status;
    private String location;
    private Double latitude;
    private Double longitude;
    private String description;
    private String deliveryProofPhoto;
    private String signatureUrl;
    private LocalDateTime timestamp;
    private LocalDateTime estimatedDelivery;
}

public enum TrackingStatus {
    PENDING, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY,
    DELIVERED, FAILED_ATTEMPT, RETURNED, EXCEPTION
}
```

---

## 🔌 APIS À IMPLÉMENTER

### Configuration API Gateway (routes supplémentaires)
```java
@Configuration
public class AdditionalGatewayRoutes {
    
    @Bean
    public RouterFunction<ServerResponse> reviewServiceRoute() {
        return route("review-service")
                .route(path("/api/reviews/**"), http())
                .filter(lb("ReviewService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> searchServiceRoute() {
        return route("search-service")
                .route(path("/api/search/**"), http())
                .filter(lb("SearchService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> wishlistServiceRoute() {
        return route("wishlist-service")
                .route(path("/api/wishlist/**"), http())
                .filter(lb("WishlistService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> promotionServiceRoute() {
        return route("promotion-service")
                .route(path("/api/promotions/**"), http())
                .route(path("/api/loyalty/**"), http())
                .filter(lb("PromotionService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> trackingServiceRoute() {
        return route("tracking-service")
                .route(path("/api/tracking/**"), http())
                .filter(lb("TrackingService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> chatServiceRoute() {
        return route("chat-service")
                .route(path("/api/chat/**"), http())
                .filter(lb("ChatService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> notificationServiceRoute() {
        return route("notification-service")
                .route(path("/api/notifications/**"), http())
                .filter(lb("NotificationService"))
                .build();
    }
    
    @Bean
    public RouterFunction<ServerResponse> analyticsServiceRoute() {
        return route("analytics-service")
                .route(path("/api/analytics/**"), http())
                .filter(lb("AnalyticsService"))
                .build();
    }
}
```

---

## 🖥️ COMPOSANTS FRONTEND À CRÉER

### Structure de dossiers suggérée
```
frontend/src/
├── components/
│   ├── common/
│   │   ├── SearchBar.jsx
│   │   ├── StarRating.jsx
│   │   ├── Notification.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── Modal.jsx
│   ├── product/
│   │   ├── ProductCard.jsx
│   │   ├── ProductGallery.jsx
│   │   ├── ProductReviews.jsx
│   │   ├── ProductQA.jsx
│   │   └── RelatedProducts.jsx
│   ├── cart/
│   │   ├── CartSidebar.jsx
│   │   ├── CartItem.jsx
│   │   └── CartSummary.jsx
│   ├── checkout/
│   │   ├── AddressForm.jsx
│   │   ├── PaymentForm.jsx
│   │   ├── OrderSummary.jsx
│   │   └── PromoCode.jsx
│   ├── user/
│   │   ├── Wishlist.jsx
│   │   ├── OrderHistory.jsx
│   │   ├── OrderTracking.jsx
│   │   └── LoyaltyCard.jsx
│   ├── chat/
│   │   ├── ChatWidget.jsx
│   │   ├── ChatWindow.jsx
│   │   └── MessageBubble.jsx
│   └── vendor/
│       ├── VendorDashboard.jsx
│       ├── InventoryManager.jsx
│       └── SalesAnalytics.jsx
├── hooks/
│   ├── useSearch.js
│   ├── useCart.js
│   ├── useWishlist.js
│   ├── useNotifications.js
│   ├── useChat.js
│   └── useTracking.js
├── services/
│   ├── api.js
│   ├── searchService.js
│   ├── reviewService.js
│   ├── wishlistService.js
│   ├── notificationService.js
│   ├── chatService.js
│   └── trackingService.js
└── context/
    ├── AuthContext.jsx
    ├── CartContext.jsx
    ├── WishlistContext.jsx
    └── NotificationContext.jsx
```

### Exemple: Composant SearchBar Avancé
```jsx
// components/common/SearchBar.jsx
import { useState, useEffect, useRef } from 'react';
import { searchService } from '../../services/searchService';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchService.autocomplete(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Erreur autocomplete:', error);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = (searchQuery) => {
    setShowSuggestions(false);
    onSearch(searchQuery || query);
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Rechercher un produit, une marque..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {loading && <span className="loading-indicator">⏳</span>}
        <button onClick={() => handleSearch()}>🔍</button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                setQuery(suggestion.text);
                handleSearch(suggestion.text);
              }}
            >
              {suggestion.type === 'product' && (
                <>
                  <img src={suggestion.image} alt="" />
                  <div className="suggestion-details">
                    <span className="suggestion-title">{suggestion.text}</span>
                    <span className="suggestion-category">{suggestion.category}</span>
                  </div>
                  <span className="suggestion-price">{suggestion.price} USD</span>
                </>
              )}
              {suggestion.type === 'category' && (
                <>
                  <span className="category-icon">📁</span>
                  <span>dans {suggestion.text}</span>
                </>
              )}
              {suggestion.type === 'brand' && (
                <>
                  <span className="brand-icon">🏷️</span>
                  <span>Marque: {suggestion.text}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
```

### Exemple: Composant Reviews
```jsx
// components/product/ProductReviews.jsx
import { useState, useEffect } from 'react';
import { reviewService } from '../../services/reviewService';
import StarRating from '../common/StarRating';
import './ProductReviews.css';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId, filter, sortBy]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getProductReviews(productId, { filter, sortBy }),
        reviewService.getProductStats(productId)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId, helpful) => {
    try {
      await reviewService.voteReview(reviewId, helpful);
      loadReviews();
    } catch (error) {
      console.error('Erreur vote:', error);
    }
  };

  return (
    <div className="reviews-section">
      <h2>Avis clients</h2>
      
      {stats && (
        <div className="reviews-summary">
          <div className="average-rating">
            <span className="rating-number">{stats.averageRating.toFixed(1)}</span>
            <StarRating rating={stats.averageRating} />
            <span className="total-reviews">{stats.totalReviews} avis</span>
          </div>
          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="rating-bar">
                <span>{star} ⭐</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(stats.distribution[star] / stats.totalReviews) * 100}%` }}
                  />
                </div>
                <span>{stats.distribution[star]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="reviews-controls">
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tous
          </button>
          <button className={filter === 'with-photos' ? 'active' : ''} onClick={() => setFilter('with-photos')}>
            📷 Avec photos
          </button>
          <button className={filter === 'verified' ? 'active' : ''} onClick={() => setFilter('verified')}>
            ✅ Achats vérifiés
          </button>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Plus récents</option>
          <option value="helpful">Plus utiles</option>
          <option value="rating-high">Meilleures notes</option>
          <option value="rating-low">Notes les plus basses</option>
        </select>
      </div>

      <button className="write-review-btn" onClick={() => setShowWriteReview(true)}>
        ✍️ Écrire un avis
      </button>

      {loading ? (
        <div className="loading">Chargement des avis...</div>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <img src={review.userPhoto || '/default-avatar.png'} alt="" className="reviewer-avatar" />
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.userName}</span>
                  {review.verifiedPurchase && (
                    <span className="verified-badge">✅ Achat vérifié</span>
                  )}
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <StarRating rating={review.rating} />
              </div>
              
              <h4 className="review-title">{review.title}</h4>
              <p className="review-content">{review.content}</p>
              
              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Photo ${idx + 1}`} />
                  ))}
                </div>
              )}

              {review.vendorResponse && (
                <div className="vendor-response">
                  <strong>🏪 Réponse du vendeur:</strong>
                  <p>{review.vendorResponse}</p>
                </div>
              )}

              <div className="review-footer">
                <span className="helpful-count">
                  {review.helpfulVotes} personnes ont trouvé cet avis utile
                </span>
                <div className="vote-buttons">
                  <button onClick={() => handleVote(review.id, true)}>👍 Utile</button>
                  <button onClick={() => handleVote(review.id, false)}>👎</button>
                  <button>🚩 Signaler</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
```

---

## 🔗 INTÉGRATIONS TIERCES

### 1. Stripe (Paiements)
```javascript
// services/stripeService.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY);

export const stripeService = {
  createPaymentIntent: async (amount, currency) => {
    // currency should come from user preferences or system config
    const userCurrency = currency || getUserPreferredCurrency() || 'usd';
    const response = await fetch('/api/paiements/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: userCurrency })
    });
    return response.json();
  },

  confirmPayment: async (clientSecret, paymentMethod) => {
    const stripe = await stripePromise;
    return stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });
  }
};
```

### 2. Firebase Cloud Messaging (Push)
```javascript
// services/fcmService.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../config/firebase';

const messaging = getMessaging(app);

export const fcmService = {
  requestPermission: async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  },

  onMessageReceived: (callback) => {
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  },

  subscribeToTopic: async (token, topic) => {
    return fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic })
    });
  }
};
```

### 3. Elasticsearch (Backend)
```java
// Configuration Elasticsearch (using new ElasticsearchClient - not deprecated RestHighLevelClient)
@Configuration
public class ElasticsearchConfig {
    
    @Value("${elasticsearch.host}")
    private String host;
    
    @Value("${elasticsearch.port:9200}")
    private int port;
    
    @Bean
    public ElasticsearchClient elasticsearchClient() {
        RestClient restClient = RestClient.builder(
            new HttpHost(host, port, "http")
        ).build();
        
        ElasticsearchTransport transport = new RestClientTransport(
            restClient, new JacksonJsonpMapper()
        );
        
        return new ElasticsearchClient(transport);
    }
}

// Service de recherche avec nouveau client Elasticsearch
@Service
public class ElasticSearchService {
    
    @Autowired
    private ElasticsearchClient client;
    
    public List<ProductSearchResult> searchProducts(String query, Map<String, Object> filters) throws IOException {
        SearchResponse<ProductDocument> response = client.search(s -> s
            .index("products")
            .query(q -> q
                .bool(b -> {
                    // Query principale
                    b.must(m -> m
                        .multiMatch(mm -> mm
                            .query(query)
                            .fields("titre^2", "description", "marque", "categorie")
                            .fuzziness("AUTO")
                        )
                    );
                    // Filtre status
                    b.filter(f -> f
                        .term(t -> t.field("status").value("DISPONIBLE"))
                    );
                    // Filtres optionnels
                    if (filters.containsKey("minPrice")) {
                        b.filter(f -> f
                            .range(r -> r.field("prix").gte(JsonData.of(filters.get("minPrice"))))
                        );
                    }
                    if (filters.containsKey("maxPrice")) {
                        b.filter(f -> f
                            .range(r -> r.field("prix").lte(JsonData.of(filters.get("maxPrice"))))
                        );
                    }
                    if (filters.containsKey("categorie")) {
                        b.filter(f -> f
                            .term(t -> t.field("categorie.keyword").value((String) filters.get("categorie")))
                        );
                    }
                    return b;
                })
            )
            .highlight(h -> h
                .fields("titre", hf -> hf)
                .fields("description", hf -> hf)
            ),
            ProductDocument.class
        );
        
        return parseSearchResults(response);
    }
    
    public List<String> autocomplete(String prefix) throws IOException {
        SearchResponse<ProductDocument> response = client.search(s -> s
            .index("products")
            .suggest(su -> su
                .suggesters("product-suggest", sg -> sg
                    .prefix(prefix)
                    .completion(c -> c
                        .field("titre.suggest")
                        .size(10)
                    )
                )
            ),
            ProductDocument.class
        );
        
        return parseSuggestions(response);
    }
}
```

### 4. WebSocket (Chat temps réel)
```java
// Configuration WebSocket
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Use explicit allowed origins instead of "*" for security
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("http://localhost:*", "https://*.yourdomain.com")
            .withSockJS();
    }
}

// Controller Chat
@Controller
public class ChatController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @MessageMapping("/chat/{conversationId}")
    public void sendMessage(@DestinationVariable String conversationId, Message message) {
        // Sauvegarder le message
        messageService.save(message);
        
        // Envoyer aux participants
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId, message);
        
        // Notification push si utilisateur offline
        notificationService.notifyNewMessage(message);
    }
    
    @MessageMapping("/chat/{conversationId}/typing")
    public void userTyping(@DestinationVariable String conversationId, TypingStatus status) {
        messagingTemplate.convertAndSend("/topic/chat/" + conversationId + "/typing", status);
    }
}
```

---

## 📱 CONFIGURATION PWA

### Manifest (public/manifest.json)
```json
{
  "name": "Vente en Ligne",
  "short_name": "VenteEnLigne",
  "description": "Votre marketplace e-commerce",
  "theme_color": "#4CAF50",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Mes commandes",
      "url": "/dashboard/client?tab=orders",
      "icons": [{"src": "/icons/orders.png", "sizes": "96x96"}]
    },
    {
      "name": "Mon panier",
      "url": "/dashboard/client?cart=open",
      "icons": [{"src": "/icons/cart.png", "sizes": "96x96"}]
    }
  ]
}
```

### Service Worker (public/sw.js)
```javascript
// Cache version should be updated during build process
// Use environment variable or build-time injection
const CACHE_VERSION = self.__CACHE_VERSION__ || Date.now();
const CACHE_NAME = `vente-en-ligne-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch avec stratégie Network First
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request)
        .then((response) => response || caches.match('/offline.html'))
      )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || []
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click sur notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});
```

---

*Document technique créé le 1er Décembre 2025*
*Projet Vente en Ligne - Spécifications Techniques*
