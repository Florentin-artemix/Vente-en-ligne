package com.example.venteEnLigne.ProduitService.service;

import com.example.venteEnLigne.ProduitService.config.GitHubProperties;
import com.example.venteEnLigne.ProduitService.dto.ImageUploadResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service pour l'upload d'images vers GitHub et la génération d'URLs CDN jsDelivr.
 * 
 * Sécurité:
 * - Le token GitHub est récupéré via variable d'environnement (GITHUB_TOKEN)
 * - Le token n'est JAMAIS exposé dans le code source ou les logs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

    private final GitHubProperties gitHubProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String[] ALLOWED_CONTENT_TYPES = {
            "image/jpeg",
            // "image/jpg" est inclus car certains navigateurs/clients envoient ce type non-standard
            "image/jpg",
            "image/png",
            "image/gif"
    };

    /**
     * Upload une image vers le repository GitHub et retourne l'URL CDN jsDelivr.
     *
     * @param file Fichier image à uploader (JPG, PNG, GIF)
     * @return ImageUploadResponse contenant l'URL CDN
     * @throws IOException Si erreur lors de la lecture du fichier
     * @throws IllegalArgumentException Si le type de fichier n'est pas supporté
     */
    public ImageUploadResponse uploadImage(MultipartFile file) throws IOException {
        validateFile(file);
        
        String uniqueFileName = generateUniqueFileName(file.getOriginalFilename());
        String path = "images/" + uniqueFileName;
        
        log.info("Upload de l'image: {}", uniqueFileName);
        
        // Vérifier si le fichier existe déjà et récupérer son SHA si c'est le cas
        String existingSha = getFileSha(path);
        boolean isReplacement = existingSha != null;
        
        // Upload ou mise à jour du fichier
        uploadToGitHub(file, path, existingSha);
        
        // Générer l'URL CDN jsDelivr
        String cdnUrl = generateJsDelivrUrl(path);
        
        log.info("Image uploadée avec succès. URL CDN: {}", cdnUrl);
        
        return ImageUploadResponse.builder()
                .url(cdnUrl)
                .fileName(uniqueFileName)
                .message(isReplacement ? "Image remplacée avec succès" : "Image uploadée avec succès")
                .replaced(isReplacement)
                .build();
    }

    /**
     * Valide le fichier uploadé.
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide ou null");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isAllowedContentType(contentType)) {
            throw new IllegalArgumentException(
                    "Type de fichier non supporté. Types acceptés: JPG, PNG, GIF");
        }

        // Limite de taille: 10 MB
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("La taille du fichier ne doit pas dépasser 10 MB");
        }
    }

    /**
     * Vérifie si le type de contenu est autorisé.
     */
    private boolean isAllowedContentType(String contentType) {
        for (String allowed : ALLOWED_CONTENT_TYPES) {
            if (allowed.equalsIgnoreCase(contentType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Génère un nom de fichier unique avec UUID.
     */
    private String generateUniqueFileName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    /**
     * Récupère le SHA d'un fichier existant sur GitHub.
     * 
     * @return SHA du fichier ou null si le fichier n'existe pas
     */
    private String getFileSha(String path) {
        try {
            String url = String.format("%s/repos/%s/%s/contents/%s?ref=%s",
                    gitHubProperties.getApiUrl(),
                    gitHubProperties.getOwner(),
                    gitHubProperties.getRepo(),
                    path,
                    gitHubProperties.getBranch());

            HttpHeaders headers = createAuthHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("sha").asText();
        } catch (HttpClientErrorException.NotFound e) {
            // Le fichier n'existe pas
            return null;
        } catch (Exception e) {
            log.warn("Erreur lors de la vérification du fichier existant: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Upload ou met à jour un fichier sur GitHub.
     */
    private void uploadToGitHub(MultipartFile file, String path, String sha) throws IOException {
        String url = String.format("%s/repos/%s/%s/contents/%s",
                gitHubProperties.getApiUrl(),
                gitHubProperties.getOwner(),
                gitHubProperties.getRepo(),
                path);

        // Encoder le contenu en Base64
        String base64Content = Base64.getEncoder().encodeToString(file.getBytes());

        // Construire le body de la requête
        Map<String, Object> body = new HashMap<>();
        body.put("message", sha != null ? "Mise à jour de l'image: " + path : "Ajout de l'image: " + path);
        body.put("content", base64Content);
        body.put("branch", gitHubProperties.getBranch());
        
        if (sha != null) {
            body.put("sha", sha);
        }

        HttpHeaders headers = createAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
        } catch (HttpClientErrorException e) {
            // Log sans exposer de détails sensibles de l'API GitHub
            log.error("Erreur lors de l'upload vers GitHub. Code statut: {}", e.getStatusCode());
            throw new RuntimeException("Erreur lors de l'upload de l'image vers GitHub");
        }
    }

    /**
     * Crée les headers d'authentification pour l'API GitHub.
     * Le token est récupéré depuis les propriétés (variable d'environnement).
     */
    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        // Le token est passé directement dans le header sans concaténation dans les logs
        String token = gitHubProperties.getToken();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    /**
     * Génère l'URL CDN jsDelivr pour un fichier.
     * Format: https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}
     */
    private String generateJsDelivrUrl(String path) {
        return String.format("https://cdn.jsdelivr.net/gh/%s/%s@%s/%s",
                gitHubProperties.getOwner(),
                gitHubProperties.getRepo(),
                gitHubProperties.getBranch(),
                path);
    }
}
