package com.example.venteEnLigne.ProduitService.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration des propriétés GitHub pour l'upload d'images.
 * Le token GitHub doit être configuré via variable d'environnement GITHUB_TOKEN
 * et ne doit JAMAIS être exposé dans le code source.
 */
@Data
@Component
@ConfigurationProperties(prefix = "github")
public class GitHubProperties {

    /**
     * Token d'authentification GitHub.
     * À configurer via variable d'environnement: GITHUB_TOKEN
     */
    private String token;

    /**
     * Propriétaire du repository (username ou organisation)
     */
    private String owner = "Florentin-artemix";

    /**
     * Nom du repository pour stocker les images
     */
    private String repo = "vente-en-ligne-images";

    /**
     * Branche du repository
     */
    private String branch = "main";

    /**
     * URL de base de l'API GitHub
     */
    private String apiUrl = "https://api.github.com";
}
