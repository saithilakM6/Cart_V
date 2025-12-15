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
  public initialized = false;
  private processingIds = new Set<number>();

  constructor(private http: HttpClient, private authService: AuthService, private apiConfig: ApiConfigService) {
    this.apiUrl = this.apiConfig.getApiUrl('wishlist');
    console.log('WishlistService initialized - localStorage only mode');
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
    if (this.initialized) {
      console.log('Wishlist already initialized, skipping...');
      return;
    }
    
    console.log('Loading wishlist...');
    
    // Load from localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    console.log('Raw localStorage data:', savedWishlist);
    
    if (savedWishlist) {
      try {
        const parsed = JSON.parse(savedWishlist);
        console.log('Parsed localStorage data:', parsed);
        // Ensure all items are valid numbers and remove duplicates
        const cleanedIds = [...new Set(parsed.filter((item: any) => {
          const num = Number(item);
          return !isNaN(num) && num > 0 && Number.isInteger(num);
        }).map((item: any) => Number(item)))];
        console.log('Cleaned IDs:', cleanedIds);
        this.wishlistItems.next(cleanedIds);
      } catch (e) {
        console.error('Error parsing localStorage:', e);
        localStorage.removeItem('wishlist');
        this.wishlistItems.next([]);
      }
    } else {
      console.log('No localStorage data found');
      this.wishlistItems.next([]);
    }
    
    this.initialized = true;
  }

  addToWishlist(productId: number): Observable<any> {
    console.log('Adding to wishlist:', productId, typeof productId);
    
    // Convert to number and validate
    const id = Number(productId);
    if (isNaN(id) || id <= 0) {
      console.error('Invalid product ID:', productId);
      return new Observable(observer => {
        observer.error('Invalid product ID');
      });
    }
    
    // Prevent duplicate processing
    if (this.processingIds.has(id)) {
      console.log('Already processing this ID:', id);
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }
    
    this.processingIds.add(id);
    
    // Add to local storage
    this.addToLocalWishlist(id);
    this.showNotification('Added to wishlist!');
    
    // Clear processing flag after a short delay
    setTimeout(() => this.processingIds.delete(id), 500);
    
    // Return success observable
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  private addToLocalWishlist(productId: number): void {
    console.log('Adding to local wishlist:', productId);
    const currentItems = [...this.wishlistItems.value];
    console.log('Current items before add:', currentItems);
    
    // Check if item already exists using strict comparison
    if (!currentItems.includes(productId)) {
      currentItems.push(productId);
      console.log('Updated items after add:', currentItems);
      this.updateLocalWishlist(currentItems);
    } else {
      console.log('Item already exists in wishlist');
    }
  }

  private updateLocalWishlist(items: any[]): void {
    console.log('Updating local wishlist with:', items);
    this.wishlistItems.next(items);
    localStorage.setItem('wishlist', JSON.stringify(items));
    console.log('localStorage updated');
  }

  showNotification(message: string): void {
    this.notificationSubject.next({show: true, message});
    setTimeout(() => this.notificationSubject.next({show: false, message: ''}), 3000);
  }

  removeFromWishlist(productId: number): Observable<any> {
    console.log('Removing from wishlist:', productId);
    
    // Remove from local storage
    const currentItems = this.wishlistItems.value.filter((item: any) => Number(item) !== Number(productId));
    this.updateLocalWishlist(currentItems);
    
    // Return success observable
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItems.value.some((item: any) => Number(item) === Number(productId));
  }

  getWishlistCount(): number {
    return this.wishlistItems.value.length;
  }
}
