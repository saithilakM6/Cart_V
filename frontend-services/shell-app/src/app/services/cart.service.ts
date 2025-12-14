import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl!: string;
  private cartItems = new BehaviorSubject<any[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private apiConfig: ApiConfigService) {
    // Remove hardcoded apiUrl - use apiConfig throughout
    // Load cart based on authentication status
    if (this.authService.isAuthenticated()) {
      this.loadCartFromServer();
    } else {
      // Load cart from localStorage for offline support
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          this.cartItems.next([...parsed]);
        } catch (e) {
          localStorage.removeItem('cart');
          this.cartItems.next([]);
        }
      }
    }
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

  getCart(): Observable<any> {
    const userId = this.getUserId();
    return this.http.get(this.apiConfig.getApiUrl(`cart/${userId}`));
  }

  addToCart(product: any, quantity: number = 1): void {
    if (this.authService.isAdmin()) {
      console.warn('Admin users cannot add items to cart');
      return;
    }
    
    const userId = this.getUserId();
    const cartRequest = { 
      productId: product.id, 
      productName: product.name,
      quantity, 
      price: product.price 
    };
    
    console.log('Adding to cart:', cartRequest, 'for user:', userId);
    console.log('API URL:', this.apiConfig.getApiUrl(`cart/${userId}/add`));
    
    // Try without authentication headers first since cart service doesn't require auth
    this.http.post(this.apiConfig.getApiUrl(`cart/${userId}/add`), cartRequest).subscribe({
      next: (response) => {
        console.log('Item added to cart successfully:', response);
        setTimeout(() => this.loadCartFromServer(), 500);
        this.showAddToCartNotification(product.name, quantity);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        // Fallback to local cart when backend is down
        this.addToLocalCart(product, quantity);
      }
    });
  }

  private addToLocalCart(product: any, quantity: number): void {
    const currentItems = [...this.cartItems.value];
    const existingItem = currentItems.find(item => item.id === product.id && item.size === product.size);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      currentItems.push({ ...product, quantity });
    }

    this.updateLocalCart(currentItems);
    this.showAddToCartNotification(product.name, quantity);
  }

  private loadCartFromServer(): void {
    const userId = this.getUserId();
    console.log('Loading cart for user:', userId);
    
    this.http.get(this.apiConfig.getApiUrl(`cart/${userId}`)).subscribe({
      next: (response: any) => {
        console.log('Cart response:', response);
        const items = response.items || [];
        if (items.length > 0) {
          const productRequests = items.map((item: any) => 
            this.http.get(this.apiConfig.getApiUrl(`products/${item.productId}`))
          );
          (forkJoin(productRequests) as Observable<any[]>).subscribe({
            next: (products: any[]) => {
              const enrichedItems = items.map((item: any, index: number) => ({
                ...products[index],
                quantity: item.quantity,
                cartItemId: item.id
              }));
              this.cartItems.next(enrichedItems);
            },
            error: () => this.cartItems.next([])
          });
        } else {
          this.cartItems.next([]);
        }
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.cartItems.next([]);
      }
    });
  }

  updateCartItem(productId: number, quantity: number): Observable<any> | void {
    if (this.authService.isAuthenticated()) {
      return this.http.put(this.apiConfig.getApiUrl('cart/update'), 
        { productId, quantity }, 
        { headers: this.getHeaders() }
      );
    } else {
      const currentItems = this.cartItems.value;
      const item = currentItems.find(item => item.id === productId);
      
      if (item) {
        if (quantity <= 0) {
          this.removeFromCart(productId);
        } else {
          item.quantity = quantity;
          this.updateLocalCart(currentItems);
        }
      }
    }
  }

  removeFromCart(productId: number, size?: string): void {
    const userId = this.getUserId();
    this.http.delete(this.apiConfig.getApiUrl(`cart/${userId}/remove/${productId}`)).subscribe({
      next: () => this.loadCartFromServer(),
      error: (error) => console.error('Error removing from cart:', error)
    });
  }

  clearCart(): void {
    const userId = this.getUserId();
    this.http.delete(this.apiConfig.getApiUrl(`cart/${userId}/clear`)).subscribe({
      next: () => {
        this.cartItems.next([]);
      },
      error: (error) => console.error('Error clearing cart:', error)
    });
  }

  getCartTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartItems.value.reduce((count, item) => count + item.quantity, 0);
  }

  private updateLocalCart(items: any[]): void {
    const newItems = [...items];
    this.cartItems.next(newItems);
    if (newItems.length === 0) {
      localStorage.removeItem('cart');
    } else {
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  }

  updateQuantity(productId: number, quantity: number, size?: string): void {
    if (quantity <= 0) {
      this.removeFromCart(productId, size);
    } else {
      // Remove and re-add with new quantity
      const userId = this.getUserId();
      this.http.delete(this.apiConfig.getApiUrl(`cart/${userId}/remove/${productId}`)).subscribe({
        next: () => {
          const item = this.cartItems.value.find(i => i.id === productId);
          if (item) {
            const cartRequest = { 
              productId: item.id, 
              productName: item.name,
              quantity, 
              price: item.price 
            };
            this.http.post(this.apiConfig.getApiUrl(`cart/${userId}/add`), cartRequest).subscribe({
              next: () => this.loadCartFromServer(),
              error: (error) => console.error('Error updating quantity:', error)
            });
          }
        },
        error: (error) => console.error('Error updating quantity:', error)
      });
    }
  }

  // Sync local cart with server when user logs in
  syncCartWithServer(): void {
    if (this.authService.isAuthenticated() && this.cartItems.value.length > 0) {
      this.cartItems.value.forEach(item => {
        this.addToCart(item, item.quantity);
      });
      this.updateLocalCart([]);
    }
  }

  private showAddToCartNotification(productName: string, quantity: number): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="bi bi-check-circle-fill text-success me-2"></i>
        <span><strong>${productName}</strong> ${quantity > 1 ? `(${quantity})` : ''} added to cart!</span>
        <i class="bi bi-cart-fill ms-2"></i>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #D6A99D, #FBF3D5);
      color: #2c3e50;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 9999;
      font-weight: 600;
      border: 2px solid #9CAFAA;
      backdrop-filter: blur(10px);
      animation: slideInRight 0.4s ease-out;
      max-width: 300px;
    `;
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#cart-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'cart-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .cart-notification .notification-content {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.4s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 400);
    }, 3000);
  }
}