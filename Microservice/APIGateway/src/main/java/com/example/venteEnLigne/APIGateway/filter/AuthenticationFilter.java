package com.example.venteEnLigne.APIGateway.filter;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@Order(10)  // S'exécute APRÈS le CorsFilter (qui a Ordered.HIGHEST_PRECEDENCE)
public class AuthenticationFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationFilter.class);

    // Routes publiques qui ne nécessitent pas d'authentification
    private static final List<String> PUBLIC_ROUTES = Arrays.asList(
        "/api/users/register",
        "/api/users/login",
        "/api/users/verify-token",
        "/api/produits/disponibles",
        "/api/produits/search",
        "/api/produits/categorie",
        "/actuator"
    );

    // Routes qui nécessitent seulement une authentification (pas de rôle spécifique)
    private static final List<String> AUTHENTICATED_ROUTES = Arrays.asList(
        "/api/carte",
        "/api/orders",
        "/api/paiements",
        "/api/users/profile"
    );

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        logger.info("Request: {} {}", method, path);

        // Permettre les requêtes OPTIONS pour CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        // Vérifier si c'est une route publique
        if (isPublicRoute(path)) {
            logger.info("Public route accessed: {}", path);
            chain.doFilter(request, response);
            return;
        }

        // Pour les routes GET sur les produits (lecture seule), permettre l'accès
        if (path.startsWith("/api/produits") && "GET".equalsIgnoreCase(method)) {
            logger.info("Public GET on produits: {}", path);
            chain.doFilter(request, response);
            return;
        }

        // Extraire et vérifier le token
        String authHeader = httpRequest.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Missing or invalid Authorization header for: {}", path);
            sendUnauthorizedResponse(httpResponse, "Token d'authentification requis");
            return;
        }

        String token = authHeader.substring(7);

        try {
            // Vérifier le token Firebase
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            String userId = decodedToken.getUid();
            String email = decodedToken.getEmail();

            logger.info("Authenticated user: {} ({})", email, userId);

            // Ajouter les informations de l'utilisateur dans les headers pour les microservices
            HttpServletRequestWrapper wrappedRequest = new HttpServletRequestWrapper(httpRequest, userId, email);
            
            chain.doFilter(wrappedRequest, response);

        } catch (FirebaseAuthException e) {
            logger.error("Firebase token verification failed: {}", e.getMessage());
            sendUnauthorizedResponse(httpResponse, "Token invalide ou expiré");
        } catch (Exception e) {
            logger.error("Authentication error: {}", e.getMessage());
            sendUnauthorizedResponse(httpResponse, "Erreur d'authentification");
        }
    }

    private boolean isPublicRoute(String path) {
        return PUBLIC_ROUTES.stream().anyMatch(route -> 
            path.equals(route) || path.startsWith(route + "/") || path.startsWith(route + "?")
        );
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
            "{\"error\": \"Unauthorized\", \"message\": \"%s\", \"status\": 401}", 
            message
        ));
    }

    // Wrapper pour ajouter les headers utilisateur
    private static class HttpServletRequestWrapper extends jakarta.servlet.http.HttpServletRequestWrapper {
        private final String userId;
        private final String email;

        public HttpServletRequestWrapper(HttpServletRequest request, String userId, String email) {
            super(request);
            this.userId = userId;
            this.email = email;
        }

        @Override
        public String getHeader(String name) {
            if ("X-User-Id".equalsIgnoreCase(name)) {
                return userId;
            }
            if ("X-User-Email".equalsIgnoreCase(name)) {
                return email;
            }
            return super.getHeader(name);
        }

        @Override
        public java.util.Enumeration<String> getHeaderNames() {
            java.util.List<String> names = java.util.Collections.list(super.getHeaderNames());
            names.add("X-User-Id");
            names.add("X-User-Email");
            return java.util.Collections.enumeration(names);
        }
    }
}
