package com.example.venteEnLigne.ProduitService.controller;

import com.example.venteEnLigne.ProduitService.dto.ImageUploadResponse;
import com.example.venteEnLigne.ProduitService.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Contrôleur REST pour l'upload d'images.
 * 
 * Endpoint: POST /api/images/upload
 * - Accepte un fichier image multipart (JPG, PNG, GIF)
 * - Retourne l'URL CDN jsDelivr de l'image uploadée
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final ImageUploadService imageUploadService;

    /**
     * Upload une image et retourne l'URL CDN jsDelivr.
     *
     * @param file Fichier image (JPG, PNG, GIF, max 10MB)
     * @return ImageUploadResponse contenant l'URL CDN
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file) {
        
        log.info("Requête d'upload d'image reçue: {}", 
                file != null ? file.getOriginalFilename() : "null");
        
        try {
            ImageUploadResponse response = imageUploadService.uploadImage(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Erreur de validation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ImageUploadResponse.builder()
                            .message(e.getMessage())
                            .build());
        } catch (IOException e) {
            log.error("Erreur lors de l'upload de l'image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    ImageUploadResponse.builder()
                            .message("Erreur lors de la lecture du fichier")
                            .build());
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'upload vers GitHub", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    ImageUploadResponse.builder()
                            .message("Erreur lors de l'upload de l'image")
                            .build());
        }
    }

    /**
     * Endpoint de santé pour vérifier que le service d'upload est disponible.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "ImageUploadService"
        ));
    }
}
