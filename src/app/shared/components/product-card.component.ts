import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface SharedProductCardItem {
  id: number;
  name: string;
  image: string;
  price: number;
}

@Component({
  selector: 'app-shared-product-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="rounded-2xl border border-[#ECE8F3] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <img
        [src]="product.image"
        [alt]="product.name"
        class="h-44 w-full rounded-xl bg-[#F6F3FA] object-contain p-2"
      />
      <h3 class="mt-3 text-sm font-semibold text-[#2D2340]">{{ product.name }}</h3>
      <p class="mt-2 text-lg font-bold text-[#2D2340]">
        {{ product.price | currency: 'EGP ' : 'symbol' : '1.0-0' }}
      </p>
    </article>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: SharedProductCardItem;
}
