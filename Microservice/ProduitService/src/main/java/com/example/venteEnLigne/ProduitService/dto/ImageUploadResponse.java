package com.example.venteEnLigne.ProduitService.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageUploadResponse {
    private String url;
    private String fileName;
    private String message;
    private boolean replaced;
}
