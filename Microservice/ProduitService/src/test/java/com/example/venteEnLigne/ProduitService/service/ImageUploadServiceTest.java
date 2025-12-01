package com.example.venteEnLigne.ProduitService.service;

import com.example.venteEnLigne.ProduitService.config.GitHubProperties;
import com.example.venteEnLigne.ProduitService.dto.ImageUploadResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImageUploadServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private GitHubProperties gitHubProperties;

    private ObjectMapper objectMapper;

    private ImageUploadService imageUploadService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        imageUploadService = new ImageUploadService(gitHubProperties, restTemplate, objectMapper);
        
        // Configuration des propriétés GitHub par défaut
        when(gitHubProperties.getToken()).thenReturn("test-token");
        when(gitHubProperties.getOwner()).thenReturn("test-owner");
        when(gitHubProperties.getRepo()).thenReturn("test-repo");
        when(gitHubProperties.getBranch()).thenReturn("main");
        when(gitHubProperties.getApiUrl()).thenReturn("https://api.github.com");
    }

    @Test
    void uploadImage_Success() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.png",
                "image/png",
                "test image content".getBytes()
        );

        // Mock: fichier n'existe pas (404)
        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND));

        // Mock: upload réussi
        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>("{}", HttpStatus.CREATED));

        // When
        ImageUploadResponse response = imageUploadService.uploadImage(file);

        // Then
        assertNotNull(response);
        assertNotNull(response.getUrl());
        assertTrue(response.getUrl().startsWith("https://cdn.jsdelivr.net/gh/"));
        assertTrue(response.getUrl().contains("test-owner/test-repo@main/images/"));
        assertTrue(response.getFileName().endsWith(".png"));
        assertFalse(response.isReplaced());
    }

    @Test
    void uploadImage_ReplacesExistingFile() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        // Mock: fichier existe avec SHA
        String existingFileResponse = "{\"sha\": \"abc123\"}";
        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(existingFileResponse, HttpStatus.OK));

        // Mock: upload réussi (mise à jour)
        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>("{}", HttpStatus.OK));

        // When
        ImageUploadResponse response = imageUploadService.uploadImage(file);

        // Then
        assertNotNull(response);
        assertTrue(response.isReplaced());
        assertEquals("Image remplacée avec succès", response.getMessage());
    }

    @Test
    void uploadImage_ThrowsException_WhenFileIsEmpty() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> imageUploadService.uploadImage(emptyFile)
        );
        assertEquals("Le fichier est vide ou null", exception.getMessage());
    }

    @Test
    void uploadImage_ThrowsException_WhenFileIsNull() {
        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> imageUploadService.uploadImage(null)
        );
        assertEquals("Le fichier est vide ou null", exception.getMessage());
    }

    @Test
    void uploadImage_ThrowsException_WhenContentTypeNotAllowed() {
        // Given
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "pdf content".getBytes()
        );

        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> imageUploadService.uploadImage(pdfFile)
        );
        assertTrue(exception.getMessage().contains("Type de fichier non supporté"));
    }

    @Test
    void uploadImage_ThrowsException_WhenFileTooLarge() {
        // Given
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11 MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large-image.png",
                "image/png",
                largeContent
        );

        // When & Then
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> imageUploadService.uploadImage(largeFile)
        );
        assertTrue(exception.getMessage().contains("10 MB"));
    }

    @Test
    void uploadImage_AcceptsJpegFile() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "jpeg content".getBytes()
        );

        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND));

        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>("{}", HttpStatus.CREATED));

        // When
        ImageUploadResponse response = imageUploadService.uploadImage(file);

        // Then
        assertNotNull(response);
        assertTrue(response.getFileName().endsWith(".jpg"));
    }

    @Test
    void uploadImage_AcceptsGifFile() throws IOException {
        // Given
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.gif",
                "image/gif",
                "gif content".getBytes()
        );

        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND));

        when(restTemplate.exchange(
                contains("/contents/"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>("{}", HttpStatus.CREATED));

        // When
        ImageUploadResponse response = imageUploadService.uploadImage(file);

        // Then
        assertNotNull(response);
        assertTrue(response.getFileName().endsWith(".gif"));
    }
}
