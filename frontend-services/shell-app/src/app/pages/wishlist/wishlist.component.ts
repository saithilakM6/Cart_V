import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private productService: ProductService
  ) {
    console.log('WishlistComponent constructor called');
  }

  ngOnInit(): void {
    console.log('WishlistComponent initialized');
    
    this.wishlistService.wishlistItems$.subscribe(productIds => {
      console.log('WishlistComponent - productIds received:', productIds);
      console.log('WishlistComponent - productIds type:', typeof productIds);
      console.log('WishlistComponent - productIds length:', productIds?.length);
      
      if (productIds && productIds.length > 0) {
        // Handle both array of IDs and array of objects with id property
        const ids = productIds; // Already cleaned numbers from service
        console.log('WishlistComponent - Processing IDs:', ids);
        
        const requests = ids.map(id => {
          const numId = Number(id);
          console.log('WishlistComponent - Fetching product with ID:', numId, typeof numId);
          if (isNaN(numId) || numId <= 0) {
            console.error('Invalid product ID:', id);
            return null;
          }
          return this.productService.getProductById(numId);
        }).filter(req => req !== null);
        
        console.log('WishlistComponent - Making', requests.length, 'requests');
        
        if (requests.length > 0) {
          forkJoin(requests).subscribe({
            next: (products) => {
              console.log('WishlistComponent - Fetched products:', products);
              this.wishlistItems = products.filter(p => p !== null);
              console.log('WishlistComponent - Final wishlistItems:', this.wishlistItems);
            },
            error: (error) => {
              console.error('WishlistComponent - Error loading wishlist products:', error);
              this.wishlistItems = [];
            }
          });
        } else {
          console.log('WishlistComponent - No requests to make');
          this.wishlistItems = [];
        }
      } else {
        console.log('WishlistComponent - No productIds, setting empty array');
        this.wishlistItems = [];
      }
    });
  }

  removeFromWishlist(productId: number): void {
    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: () => {
        // Remove from local array immediately for better UX
        this.wishlistItems = this.wishlistItems.filter(item => item.id !== productId);
      },
      error: (error) => {
        console.error('Error removing from wishlist:', error);
        // The service handles local storage fallback
      }
    });
  }

  addToCart(product: any): void {
    this.cartService.addToCart(product);
    this.removeFromWishlist(product.id);
  }


}
