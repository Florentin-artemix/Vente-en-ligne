# 🔧 Documentation : Résolution du Problème CORS

## 📋 Contexte du Problème

### Symptômes observés
```
Access to XMLHttpRequest at 'http://localhost:8080/api/carte/...' from origin 'http://127.0.0.1:5173' 
has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header contains multiple values 
'http://127.0.0.1:5173, *', but only one is allowed.
```

### Services affectés
- ❌ CarteService (Panier)
- ❌ OrderService (Commandes)
- ❌ PaiementService (Paiements)

### Impact
- Impossible de charger le panier
- Impossible de créer/charger les commandes
- Impossible de consulter les paiements
- Erreurs `Network Error` dans la console

---

## 🔍 Analyse du Problème

### Cause racine : Configuration CORS dupliquée

Le problème était causé par une **configuration CORS en double** à plusieurs niveaux :

#### 1. Configuration dans l'API Gateway (CorsConfig.java)
```java
// Fichier: Microservice/APIGateway/src/main/java/.../config/CorsConfig.java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "http://127.0.0.1:*"));
    // ...
}
```

#### 2. Configuration dans APIGateway.yml
```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOriginPatterns: 
              - "http://localhost:*"
              - "http://127.0.0.1:*"
```

#### 3. Annotations @CrossOrigin dans les contrôleurs
```java
@RestController
@CrossOrigin(origins = "*")  // ← Problème !
public class CartController { }

@RestController  
@CrossOrigin(origins = "*")  // ← Problème !
public class OrderController { }

@RestController
@CrossOrigin(origins = "*")  // ← Problème !
public class PaiementController { }
```

### Pourquoi cela cause une erreur ?

Quand une requête passe par l'API Gateway vers un microservice :

1. **L'API Gateway** ajoute l'en-tête : `Access-Control-Allow-Origin: http://127.0.0.1:5173`
2. **Le microservice** ajoute aussi : `Access-Control-Allow-Origin: *`
3. **Résultat final** : `Access-Control-Allow-Origin: http://127.0.0.1:5173, *`

Le navigateur reçoit **deux valeurs** dans l'en-tête, ce qui est interdit par la spécification CORS. Une seule valeur est autorisée.

---

## ✅ Solution Appliquée

### Principe : Centraliser la configuration CORS

La configuration CORS doit être gérée **uniquement à un seul endroit** : l'API Gateway.

### Modifications effectuées

#### 1. Suppression de CorsConfig.java
```bash
rm Microservice/APIGateway/src/main/java/.../config/CorsConfig.java
```
**Raison** : Spring Cloud Gateway gère mieux les CORS via la configuration YAML.

#### 2. Suppression des annotations @CrossOrigin
Fichiers modifiés :
- `CartController.java`
- `OrderController.java`  
- `PaiementController.java`

```java
// AVANT
@RestController
@CrossOrigin(origins = "*")
public class CartController { }

// APRÈS
@RestController
public class CartController { }
```

#### 3. Amélioration de la configuration YAML
```yaml
# config-repo/APIGateway.yml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOriginPatterns: 
              - "http://localhost:*"
              - "http://127.0.0.1:*"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - PATCH        # ← Ajouté
              - OPTIONS
            allowedHeaders: "*"
            exposedHeaders:  # ← Ajouté
              - "Authorization"
              - "Content-Type"
            allowCredentials: true
            maxAge: 3600     # ← Ajouté (cache preflight 1h)
```

---

## 📊 Architecture CORS Finale

```
┌─────────────────┐         ┌───────────────────────────────────┐
│                 │         │          API GATEWAY              │
│     Frontend    │  ───►   │  (Seul point de config CORS)     │
│  localhost:5173 │  CORS   │                                   │
│                 │  ───►   │  Access-Control-Allow-Origin:     │
└─────────────────┘         │  http://127.0.0.1:5173            │
                            └──────────────┬────────────────────┘
                                           │
                                           │ Pas de CORS
                                           │ (communication interne)
                                           ▼
                  ┌─────────────────────────────────────────────┐
                  │              MICROSERVICES                  │
                  │                                             │
                  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
                  │  │  Users   │ │  Orders  │ │ Paiement │    │
                  │  │ Service  │ │ Service  │ │ Service  │    │
                  │  └──────────┘ └──────────┘ └──────────┘    │
                  │                                             │
                  │  (Aucune configuration CORS)               │
                  └─────────────────────────────────────────────┘
```

---

## 🧪 Comment Vérifier

### Test de la configuration CORS
```bash
curl -v -X OPTIONS http://localhost:8080/api/orders \
  -H "Origin: http://127.0.0.1:5173" \
  -H "Access-Control-Request-Method: POST"
```

### Réponse attendue
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://127.0.0.1:5173
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
Access-Control-Allow-Credentials: true
```

### Vérification dans le navigateur
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet Network
3. Vérifier que les requêtes vers `localhost:8080` ne sont plus bloquées

---

## 📚 Bonnes Pratiques CORS

### ✅ À faire
- Centraliser la configuration CORS à l'API Gateway
- Utiliser `allowedOriginPatterns` plutôt que `allowedOrigins` pour les patterns
- Activer `allowCredentials: true` si vous utilisez des cookies/tokens
- Définir un `maxAge` pour réduire les requêtes preflight

### ❌ À éviter
- Configurer CORS à plusieurs endroits
- Utiliser `@CrossOrigin(origins = "*")` dans les microservices
- Utiliser `*` avec `allowCredentials: true` (interdit par la spec)

---

## 🔗 Références

- [Spring Cloud Gateway - CORS Configuration](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#cors-configuration)
- [MDN - Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS)
- [Understanding CORS](https://fetch.spec.whatwg.org/#cors-protocol)

---

## 📝 Changelog

| Date | Modification |
|------|--------------|
| 2025-12-01 | Correction initiale du problème CORS |
| | Suppression de CorsConfig.java |
| | Suppression des @CrossOrigin des contrôleurs |
| | Centralisation de la config dans APIGateway.yml |
