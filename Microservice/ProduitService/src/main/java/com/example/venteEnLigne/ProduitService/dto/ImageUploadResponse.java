package com.example.venteEnLigne.ProduitService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la réponse d'upload d'image.
 * Contient l'URL CDN jsDelivr de l'image uploadée.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageUploadResponse {

    /**
     * URL CDN jsDelivr de l'image uploadée.
     * Format: https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
     */
    private String url;

    /**
     * Nom du fichier uploadé
     */
    private String fileName;

    /**
     * Message de statut
     */
    private String message;

    /**
     * Indique si c'est un remplacement d'un fichier existant
     */
    private boolean replaced;
}
