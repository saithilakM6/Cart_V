package com.revcart.cart.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    private String description;
    
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;
    
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private Integer usedCount = 0;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Boolean active = true;
    private LocalDateTime createdAt;
    
    public enum DiscountType {
        PERCENTAGE, FIXED
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}