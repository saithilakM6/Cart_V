import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  selectedCategory = '';
  maxPrice = 50000;
  searchTerm = '';

  constructor(
    private cartService: CartService,
    private route: ActivatedRoute,
    private productService: ProductService,
    public authService: AuthService,
    public wishlistService: WishlistService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.loadProductsByCategory(params['category']);
      } else {
        this.loadProducts();
      }
    });
  }

  loadProducts() {
    console.log('Loading all products...');
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        console.log('Received products:', products?.length || 0);
        this.products = products || [];
        this.filteredProducts = [...this.products];
        this.filterProducts();
      },
      error: (error) => {
        console.error('Error loading products from API:', error);
        this.products = [];
        this.filteredProducts = [];
      }
    });
  }

  loadProductsByCategory(category: string) {
    console.log('Loading products for category:', category);
    this.productService.getProductsByCategory(category).subscribe({
      next: (products) => {
        console.log('Received category products:', products?.length || 0);
        this.products = products || [];
        this.filteredProducts = [...this.products];
      },
      error: (error) => {
        console.error('Error loading products by category:', error);
        this.loadProducts(); // Fallback to all products
      }
    });
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      const matchesCategory = !this.selectedCategory || product.category === this.selectedCategory;
      const matchesPrice = product.price <= this.maxPrice;
      const matchesSearch = !this.searchTerm || product.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesCategory && matchesPrice && matchesSearch;
    });
  }

  clearFilters() {
    this.selectedCategory = '';
    this.maxPrice = 50000;
    this.searchTerm = '';
    this.filterProducts();
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  toggleWishlist(product: any): void {
    if (this.wishlistService.isInWishlist(product.id)) {
      this.wishlistService.removeFromWishlist(product.id).subscribe();
    } else {
      this.wishlistService.addToWishlist(product.id).subscribe();
    }
  }
}
