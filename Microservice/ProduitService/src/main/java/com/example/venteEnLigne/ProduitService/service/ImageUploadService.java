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
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageUploadService {

    private final GitHubProperties gitHubProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png", "image/gif");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public ImageUploadResponse uploadImage(MultipartFile file) throws IOException {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";
        
        String fileName = UUID.randomUUID().toString() + extension;
        String path = "images/" + fileName; // Store in images folder
        
        String url = String.format("%s/repos/%s/%s/contents/%s",
                gitHubProperties.getApiUrl(),
                gitHubProperties.getOwner(),
                gitHubProperties.getRepo(),
                path);

        log.info("Uploading image to GitHub: {}", url);

        // Check if file exists (should not happen with UUID but good practice for the "replacement" requirement logic)
        String sha = null;
        try {
            ResponseEntity<String> existingFile = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createHeaders()),
                    String.class
            );
            if (existingFile.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(existingFile.getBody());
                sha = root.path("sha").asText();
                log.info("File exists, sha: {}", sha);
            }
        } catch (HttpClientErrorException.NotFound e) {
            // File doesn't exist, proceed
        }

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Upload image " + fileName);
        body.put("content", Base64.getEncoder().encodeToString(file.getBytes()));
        body.put("branch", gitHubProperties.getBranch());
        if (sha != null) {
            body.put("sha", sha);
        }

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, createHeaders());
        
        try {
            restTemplate.exchange(url, HttpMethod.PUT, requestEntity, String.class);
        } catch (Exception e) {
            log.error("Error uploading to GitHub", e);
            throw new RuntimeException("Failed to upload image to GitHub: " + e.getMessage());
        }

        // Generate jsDelivr URL
        String cdnUrl = String.format("https://cdn.jsdelivr.net/gh/%s/%s@%s/%s",
                gitHubProperties.getOwner(),
                gitHubProperties.getRepo(),
                gitHubProperties.getBranch(),
                path);

        return ImageUploadResponse.builder()
                .url(cdnUrl)
                .fileName(fileName)
                .message("Image uploaded successfully")
                .replaced(sha != null)
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Invalid file type. Allowed: JPG, PNG, GIF");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds limit of 10MB");
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "token " + gitHubProperties.getToken());
        headers.set("Accept", "application/vnd.github.v3+json");
        return headers;
    }
}
