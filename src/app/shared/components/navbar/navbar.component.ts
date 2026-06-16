import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FlowbiteService } from '../../../core/services/flowbite.service';
import { initFlowbite } from 'flowbite';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly platformId = inject(PLATFORM_ID);

  cartCount = 0;
  wishlistCount = 0;
  constructor(private flowbiteService: FlowbiteService) {}

  ngOnInit(): void {
    this.flowbiteService.loadFlowbite(() => {
      initFlowbite();
    });

    this.cartService.cartCount$.subscribe({
      next: (count) => {
        this.cartCount = count;
      },
    });

    this.wishlistService.wishlistItems$.subscribe({
      next: (items) => {
        this.wishlistCount = items.length;
      },
    });

    if (
      isPlatformBrowser(this.platformId) &&
      Boolean(localStorage.getItem('token')?.trim())
    ) {
      this.wishlistService.ensureLoaded();
    }
  }
}
