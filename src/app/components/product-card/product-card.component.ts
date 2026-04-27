import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ProductItem {
  id: number;
  name: string;
  price: number;
  oldPrice: number;
  rating: number;
  image: string;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductItem;
  wished = false;
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
}
