import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {
    this.apiUrl = this.apiConfig.getApiUrl('coupons');
  }

  validateCoupon(code: string, orderAmount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate`, { code, orderAmount })
      .pipe(
        catchError(error => {
          console.error('Coupon validation API error, using fallback validation:', error);
          // Fallback validation logic
          return this.validateCouponFallback(code, orderAmount);
        })
      );
  }

  private validateCouponFallback(code: string, orderAmount: number): Observable<any> {
    const coupons = [
      { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 500, maxDiscountAmount: 100 },
      { code: 'SAVE20', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 1000, maxDiscountAmount: 200 },
      { code: 'FLAT100', discountType: 'FIXED', discountValue: 100, minOrderAmount: 800, maxDiscountAmount: 100 },
      { code: 'MEGA50', discountType: 'PERCENTAGE', discountValue: 50, minOrderAmount: 2000, maxDiscountAmount: 500 },
      { code: 'NEWUSER', discountType: 'FIXED', discountValue: 200, minOrderAmount: 1500, maxDiscountAmount: 200 },
      { code: 'FESTIVAL25', discountType: 'PERCENTAGE', discountValue: 25, minOrderAmount: 1200, maxDiscountAmount: 300 }
    ];

    const coupon = coupons.find(c => c.code === code.toUpperCase());
    
    if (!coupon) {
      return of({ valid: false, message: 'Invalid coupon code' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return of({ valid: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.min((orderAmount * coupon.discountValue) / 100, coupon.maxDiscountAmount);
    } else {
      discount = coupon.discountValue;
    }

    return of({ valid: true, discount: Math.round(discount), message: 'Coupon applied successfully' });
  }

  getAllCoupons(): Observable<any[]> {
    // Always use fallback coupons for now
    console.log('Using fallback coupons');
    return of([
      {
        id: 1,
        code: 'WELCOME10',
        description: 'Welcome discount for new users',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 500,
        maxDiscountAmount: 100,
        active: true
      },
      {
        id: 2,
        code: 'SAVE20',
        description: 'Save 20% on your order',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 1000,
        maxDiscountAmount: 200,
        active: true
      },
      {
        id: 3,
        code: 'FLAT100',
        description: 'Flat ₹100 off on orders above ₹800',
        discountType: 'FIXED',
        discountValue: 100,
        minOrderAmount: 800,
        maxDiscountAmount: 100,
        active: true
      },
      {
        id: 4,
        code: 'MEGA50',
        description: 'Mega sale - 50% off',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minOrderAmount: 2000,
        maxDiscountAmount: 500,
        active: true
      },
      {
        id: 5,
        code: 'NEWUSER',
        description: 'New user special discount',
        discountType: 'FIXED',
        discountValue: 200,
        minOrderAmount: 1500,
        maxDiscountAmount: 200,
        active: true
      },
      {
        id: 6,
        code: 'FESTIVAL25',
        description: 'Festival special - 25% off',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        minOrderAmount: 1200,
        maxDiscountAmount: 300,
        active: true
      }
    ]);
  }

  createCoupon(coupon: any): Observable<any> {
    return this.http.post(this.apiUrl, coupon);
  }
}
