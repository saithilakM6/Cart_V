import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl: string;
  private wishlistItems = new BehaviorSubject<any[]>([]);
  public wishlistItems$ = this.wishlistItems.asObservable();
  private notificationSubject = new BehaviorSubject<{show: boolean, message: string}>({show: false, message: ''});
  public notification$ = this.notificationSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private apiConfig: ApiConfigService) {
    this.apiUrl = this.apiConfig.getApiUrl('wishlist');
    this.loadWishlist();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getUserId(): number {
    const user = this.authService.getCurrentUser();
    return user?.id || 1;
  }

  loadWishlist(): void {
    // Load from localStorage as fallback
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const parsed = JSON.parse(savedWishlist);
        this.wishlistItems.next(parsed);
      } catch (e) {
        localStorage.removeItem('wishlist');
        this.wishlistItems.next([]);
      }
    }

    // Try to load from server
    const userId = this.getUserId();
    this.http.get<any>(`${this.apiUrl}/${userId}`).subscribe({
      next: (response) => {
        this.wishlistItems.next(response.productIds || []);
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        // Keep local wishlist if server fails
      }
    });
  }

  addToWishlist(productId: number): Observable<any> {
    const userId = this.getUserId();
    const request = this.http.post(`${this.apiUrl}/${userId}/add/${productId}`, {});
    request.subscribe({
      next: () => {
        this.loadWishlist();
        this.showNotification('Added to wishlist!');
      },
      error: () => {
        // Fallback to local storage
        this.addToLocalWishlist(productId);
        this.showNotification('Added to wishlist!');
      }
    });
    return request;
  }

  private addToLocalWishlist(productId: number): void {
    const currentItems = [...this.wishlistItems.value];
    if (!currentItems.find(item => item.id === productId)) {
      currentItems.push({ id: productId });
      this.updateLocalWishlist(currentItems);
    }
  }

  private updateLocalWishlist(items: any[]): void {
    this.wishlistItems.next(items);
    localStorage.setItem('wishlist', JSON.stringify(items));
  }

  showNotification(message: string): void {
    this.notificationSubject.next({show: true, message});
    setTimeout(() => this.notificationSubject.next({show: false, message: ''}), 3000);
  }

  removeFromWishlist(productId: number): Observable<any> {
    const userId = this.getUserId();
    const request = this.http.delete(`${this.apiUrl}/${userId}/remove/${productId}`);
    request.subscribe({
      next: () => this.loadWishlist(),
      error: () => {
        // Fallback to local storage
        const currentItems = this.wishlistItems.value.filter(item => item.id !== productId);
        this.updateLocalWishlist(currentItems);
      }
    });
    return request;
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItems.value.some(item => item.id === productId);
  }

  getWishlistCount(): number {
    return this.wishlistItems.value.length;
  }
}
