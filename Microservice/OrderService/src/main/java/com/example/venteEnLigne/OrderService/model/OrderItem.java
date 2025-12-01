package com.example.venteEnLigne.OrderService.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Entité représentant une ligne de commande (produit commandé)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String produitId;

    @Column(nullable = false)
    private String produitTitre;

    @Column(columnDefinition = "TEXT")
    private String produitImage;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(nullable = false)
    private int quantite;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sousTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @PrePersist
    @PreUpdate
    public void calculateSousTotal() {
        if (prixUnitaire != null && quantite > 0) {
            this.sousTotal = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
        }
    }
}
