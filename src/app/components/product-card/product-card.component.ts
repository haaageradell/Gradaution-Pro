import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { ToastrService } from 'ngx-toastr';

export interface ProductItem {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  rating: number;
  image: string;
}

@Component({
  selector: 'app-shared-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductItem;

  private readonly cartService = inject(CartService);
  private readonly toastr = inject(ToastrService);

  wished = false;
  isAdding = false;

  readonly fallbackImage = 'https://picsum.photos/200';

  get stars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  toggleWishlist(): void {
    this.wished = !this.wished;
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;

    if (target) {
      target.src = this.fallbackImage;
    }
  }

  addToCart(): void {
    if (!this.product?.id || this.isAdding) {
      return;
    }

    this.isAdding = true;

    const body = {
      productId: this.product.id,
      quantity: 1,
    };

    console.log('Adding to cart:', body);

    this.cartService.addToCart(body).subscribe({
      next: (response) => {
        console.log('Added to cart successfully:', response);

        this.cartService.getCart().subscribe({
          next: (cart) => {
            this.cartService.updateCartCountFromItems(cart.items);
          },
        });

        this.toastr.success(`${this.product.name} added to cart`, 'Success', {
          positionClass: 'toast-bottom-left',
        });
        this.isAdding = false;
      },

      error: (error) => {
        console.error('Add to cart error:', error);

        this.isAdding = false;
      },
    });
  }
}
