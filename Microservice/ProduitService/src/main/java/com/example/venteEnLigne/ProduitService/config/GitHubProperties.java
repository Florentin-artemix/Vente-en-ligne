package com.example.venteEnLigne.ProduitService.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "github")
@Data
public class GitHubProperties {
    private String token;
    private String owner;
    private String repo;
    private String branch;
    private String apiUrl;
}
