package com.example.venteEnLigne.ProduitService.service;

import com.example.venteEnLigne.ProduitService.config.GitHubProperties;
import com.example.venteEnLigne.ProduitService.dto.ImageUploadResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageUploadServiceTest {

    @Mock
    private GitHubProperties gitHubProperties;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ImageUploadService imageUploadService;

    @BeforeEach
    void setUp() {
        // Lenient stubs to avoid unnecessary stubbing exceptions if not used in all tests
        org.mockito.Mockito.lenient().when(gitHubProperties.getApiUrl()).thenReturn("https://api.github.com");
        org.mockito.Mockito.lenient().when(gitHubProperties.getOwner()).thenReturn("owner");
        org.mockito.Mockito.lenient().when(gitHubProperties.getRepo()).thenReturn("repo");
        org.mockito.Mockito.lenient().when(gitHubProperties.getBranch()).thenReturn("main");
        org.mockito.Mockito.lenient().when(gitHubProperties.getToken()).thenReturn("token");
    }

    @Test
    void uploadImage_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "test".getBytes());
        
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.NOT_FOUND));
        
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok("success"));

        ImageUploadResponse response = imageUploadService.uploadImage(file);

        assertNotNull(response);
        assertNotNull(response.getUrl());
        assertTrue(response.getUrl().contains("jsdelivr"));
        assertFalse(response.isReplaced());
    }

    @Test
    void uploadImage_InvalidType() {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "test".getBytes());
        
        assertThrows(IllegalArgumentException.class, () -> imageUploadService.uploadImage(file));
    }

    @Test
    void uploadImage_EmptyFile() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);
        
        assertThrows(IllegalArgumentException.class, () -> imageUploadService.uploadImage(file));
    }
}
