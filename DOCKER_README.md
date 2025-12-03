# Guide de Déploiement Docker - Vente en Ligne

## Architecture Docker

Ce projet utilise Docker et Docker Compose pour containeriser tous les microservices et leurs dépendances.

### Conteneurs Créés

#### Bases de Données
1. **postgres** (Port 5432) - PostgreSQL 16
   - Bases de données: users_db, orders_db, paiement_db
   - Username: postgres
   - Password: 2025

2. **mongodb** (Port 27017) - MongoDB 7
   - Base de données: produits_db

3. **redis** (Port 6379) - Redis 7

#### Microservices
4. **eureka-server** (Port 8761) - Service Discovery
5. **config-server** (Port 8888) - Configuration centralisée
6. **users-service** (Port 8081) - Gestion des utilisateurs
7. **produit-service** (Port 8082) - Gestion des produits
8. **carte-service** (Port 8083) - Gestion du panier
9. **order-service** (Port 8084) - Gestion des commandes
10. **paiement-service** (Port 8085) - Gestion des paiements
11. **api-gateway** (Port 8080) - Passerelle API

## Prérequis

- Docker Desktop installé et en cours d'exécution
- Au moins 8GB de RAM disponible
- Au moins 10GB d'espace disque libre

## Commandes Rapides

### Démarrer tous les services
```bash
./start-and-check.sh
```

Ou manuellement:
```bash
docker-compose up -d --build
```

### Arrêter tous les services
```bash
./stop-all.sh
```

Ou manuellement:
```bash
docker-compose down
```

### Voir les logs d'un service spécifique
```bash
docker-compose logs -f <nom-du-service>
```

Exemple:
```bash
docker-compose logs -f eureka-server
docker-compose logs -f users-service
```

### Voir l'état de tous les conteneurs
```bash
docker-compose ps
```

### Redémarrer un service spécifique
```bash
docker-compose restart <nom-du-service>
```

### Reconstruire un service spécifique
```bash
docker-compose up -d --build <nom-du-service>
```

## Ordre de Démarrage

Le fichier `docker-compose.yml` gère automatiquement l'ordre de démarrage avec des dépendances:

1. **Bases de données** (postgres, mongodb, redis) démarrent en premier
2. **eureka-server** démarre après
3. **config-server** démarre après eureka-server
4. **Services métier** démarrent après config-server et leurs bases de données respectives
5. **api-gateway** démarre en dernier après tous les services

## Health Checks

Chaque service dispose d'un health check:
- **Bases de données**: Vérification de disponibilité
- **Services Spring Boot**: Vérification via `/actuator/health`

## Accès aux Services

### Interfaces Web
- **Eureka Dashboard**: http://localhost:8761
- **Config Server**: http://localhost:8888
- **API Gateway**: http://localhost:8080

### Endpoints API
- **Users**: http://localhost:8080/api/users/
- **Produits**: http://localhost:8080/api/produits/
- **Carte**: http://localhost:8080/api/carte/
- **Orders**: http://localhost:8080/api/orders/
- **Paiements**: http://localhost:8080/api/paiements/

### Endpoints Actuator
Chaque service expose ses métriques:
```
http://localhost:<PORT>/actuator/health
http://localhost:<PORT>/actuator/info
http://localhost:<PORT>/actuator/metrics
```

## Volumes Docker

Les données persistantes sont stockées dans des volumes Docker:
- `postgres_data`: Données PostgreSQL
- `mongodb_data`: Données MongoDB
- `redis_data`: Données Redis

Pour supprimer les volumes (⚠️ supprime toutes les données):
```bash
docker-compose down -v
```

## Réseau Docker

Tous les conteneurs sont connectés au réseau `microservices-network` qui permet:
- Communication inter-services par nom de conteneur
- Isolation du réseau externe
- Résolution DNS automatique

## Dépannage

### Problème: Un service ne démarre pas

1. Vérifier les logs:
```bash
docker-compose logs <nom-du-service>
```

2. Vérifier si le port est déjà utilisé:
```bash
netstat -ano | grep <PORT>
```

3. Redémarrer le service:
```bash
docker-compose restart <nom-du-service>
```

### Problème: Erreur de connexion à la base de données

1. Vérifier que la base de données est en cours d'exécution:
```bash
docker-compose ps postgres
```

2. Vérifier les logs de la base de données:
```bash
docker-compose logs postgres
```

3. Redémarrer la base de données et le service:
```bash
docker-compose restart postgres
docker-compose restart <nom-du-service>
```

### Problème: Service ne s'enregistre pas dans Eureka

1. Vérifier qu'Eureka est accessible:
```bash
curl http://localhost:8761
```

2. Vérifier les logs du service:
```bash
docker-compose logs <nom-du-service>
```

3. Vérifier le dashboard Eureka:
Ouvrir http://localhost:8761 dans un navigateur

### Problème: Mémoire insuffisante

1. Augmenter la mémoire allouée à Docker Desktop (au moins 8GB recommandé)

2. Réduire le nombre de services démarrés simultanément

### Problème: Build très lent

C'est normal lors du premier build car Maven doit télécharger toutes les dépendances.
Les builds suivants seront plus rapides grâce au cache Docker.

## Nettoyage

### Supprimer tous les conteneurs et images
```bash
docker-compose down
docker system prune -a
```

### Supprimer uniquement les conteneurs arrêtés
```bash
docker-compose down
```

### Supprimer les volumes (données)
```bash
docker-compose down -v
```

## Logs

Tous les logs de démarrage sont sauvegardés dans `startup-logs.txt` lors de l'utilisation du script `start-and-check.sh`.

## Reconstruction Complète

Pour reconstruire complètement tous les services:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Monitoring

### Voir l'utilisation des ressources
```bash
docker stats
```

### Voir les processus en cours dans un conteneur
```bash
docker-compose top <nom-du-service>
```

## Variables d'Environnement

Les variables d'environnement sont définies dans `docker-compose.yml`:
- URLs de connexion aux bases de données
- URLs d'Eureka et Config Server
- Credentials des bases de données

### Configuration du Token GitHub

Le service ProduitService nécessite un token GitHub pour stocker les images. Ce token ne doit **jamais** être commité dans le dépôt.

1. Copiez le fichier `.env.example` en `.env`:
```bash
cp .env.example .env
```

2. Modifiez le fichier `.env` avec votre token GitHub:
```bash
GITHUB_TOKEN=votre_token_github
```

3. Créez un Personal Access Token sur GitHub:
   - Allez sur https://github.com/settings/tokens
   - Cliquez sur "Generate new token (classic)"
   - Donnez un nom au token
   - Sélectionnez les permissions `repo` (pour les dépôts privés) ou `public_repo` (pour les dépôts publics)
   - Copiez le token généré

4. Docker Compose chargera automatiquement le fichier `.env` au démarrage.

⚠️ **Important**: Le fichier `.env` est ignoré par git (voir `.gitignore`). Ne partagez jamais votre token GitHub.

Pour modifier ces valeurs, éditez le fichier `docker-compose.yml`.

## Configuration Pour la Production

Pour un déploiement en production, considérez:

1. **Sécurité**:
   - Changer les mots de passe des bases de données
   - Utiliser des secrets Docker
   - Activer HTTPS sur l'API Gateway
   - Activer l'authentification Eureka

2. **Performance**:
   - Configurer les limites de ressources dans docker-compose.yml
   - Ajuster les paramètres JVM (-Xmx, -Xms)
   - Configurer les connection pools

3. **Haute Disponibilité**:
   - Déployer plusieurs instances de chaque service
   - Utiliser Docker Swarm ou Kubernetes
   - Configurer un load balancer externe

4. **Monitoring**:
   - Intégrer Prometheus et Grafana
   - Configurer des alertes
   - Centraliser les logs (ELK Stack)

## Support

Pour plus d'informations, consultez:
- DOCUMENTATION_CONFIGURATION.md - Documentation complète du système
- docker-compose.yml - Configuration des conteneurs
- Dockerfile de chaque service - Configuration de build

---

**Dernière mise à jour**: 28 novembre 2025
