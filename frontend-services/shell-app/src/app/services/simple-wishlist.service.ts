import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimpleWishlistService {
  private wishlistItems = new BehaviorSubject<number[]>([]);
  public wishlistItems$ = this.wishlistItems.asObservable();

  constructor() {
    console.log('SimpleWishlistService initialized');
    this.loadWishlist();
  }

  loadWishlist(): void {
    const saved = localStorage.getItem('simple-wishlist');
    if (saved) {
      try {
        const items = JSON.parse(saved).map((id: any) => Number(id)).filter((id: number) => id > 0);
        console.log('Loaded wishlist:', items);
        this.wishlistItems.next(items);
      } catch (e) {
        console.error('Error loading wishlist:', e);
        this.wishlistItems.next([]);
      }
    } else {
      this.wishlistItems.next([]);
    }
  }

  addToWishlist(productId: number): Observable<any> {
    const id = Number(productId);
    const current = [...this.wishlistItems.value];
    
    if (!current.includes(id)) {
      current.push(id);
      this.saveWishlist(current);
    }
    
    return of({ success: true });
  }

  removeFromWishlist(productId: number): Observable<any> {
    const id = Number(productId);
    const current = this.wishlistItems.value.filter(item => item !== id);
    this.saveWishlist(current);
    return of({ success: true });
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistItems.value.includes(Number(productId));
  }

  getWishlistCount(): number {
    return this.wishlistItems.value.length;
  }

  private saveWishlist(items: number[]): void {
    console.log('Saving wishlist:', items);
    this.wishlistItems.next(items);
    localStorage.setItem('simple-wishlist', JSON.stringify(items));
  }
}