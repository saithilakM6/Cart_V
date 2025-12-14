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
          console.error('Coupon validation error:', error);
          return of({ valid: false, message: 'Service unavailable' });
        })
      );
  }

  getAllCoupons(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Coupon error:', error);
          return of([]);
        })
      );
  }

  createCoupon(coupon: any): Observable<any> {
    return this.http.post(this.apiUrl, coupon);
  }
}
