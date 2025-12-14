package com.revcart.cart.controller;

import com.revcart.cart.entity.Coupon;
import com.revcart.cart.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllActiveCoupons() {
        return ResponseEntity.ok(couponRepository.findByActiveTrue());
    }

    @GetMapping("/{code}")
    public ResponseEntity<Coupon> getCouponByCode(@PathVariable String code) {
        return couponRepository.findByCodeAndActiveTrue(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateCoupon(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        BigDecimal orderAmount = new BigDecimal(request.get("orderAmount").toString());
        
        return couponRepository.findByCodeAndActiveTrue(code)
                .map(coupon -> {
                    Map<String, Object> response = Map.of(
                        "valid", isValidCoupon(coupon, orderAmount),
                        "coupon", coupon,
                        "discount", calculateDiscount(coupon, orderAmount)
                    );
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.ok(Map.of("valid", false, "message", "Invalid coupon code")));
    }

    private boolean isValidCoupon(Coupon coupon, BigDecimal orderAmount) {
        return coupon.getActive() && 
               orderAmount.compareTo(coupon.getMinOrderAmount()) >= 0 &&
               LocalDateTime.now().isBefore(coupon.getValidUntil());
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal orderAmount) {
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            BigDecimal discount = orderAmount.multiply(coupon.getDiscountValue()).divide(new BigDecimal(100));
            return coupon.getMaxDiscountAmount() != null ? 
                   discount.min(coupon.getMaxDiscountAmount()) : discount;
        } else {
            return coupon.getDiscountValue();
        }
    }
}