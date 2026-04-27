import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ProductCardComponent,
  SharedProductCardItem,
} from '../../../shared/components/product-card.component';

@Component({
  selector: 'app-similar-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <section class="mt-10">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-[#2D2340]">Similar Products</h2>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-shared-product-card
          *ngFor="let product of products"
          [product]="product"
        ></app-shared-product-card>
      </div>
    </section>
  `,
})
export class SimilarProductsComponent {
  @Input() products: SharedProductCardItem[] = [];
}
