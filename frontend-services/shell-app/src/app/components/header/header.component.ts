import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;
  cartCount = 0;
  wishlistCount = 0;
  isAdmin = false;
  searchTerm = '';
  showDropdown = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit() {
    // Check initial auth state
    this.isLoggedIn = this.authService.isAuthenticated();
    this.currentUser = this.authService.getCurrentUser();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = user ? this.authService.isAdmin() : false;
    });

    this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce((count, item) => count + item.quantity, 0);
    });

    this.wishlistService.wishlistItems$.subscribe(items => {
      this.wishlistCount = items.length;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.isAdmin = false;
    this.showDropdown = false;
  }
}
