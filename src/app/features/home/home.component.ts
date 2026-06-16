import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ProductCardComponent,
  ProductItem,
} from '../../components/product-card/product-card.component';
import { Product, ProductsApiResponse } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

type Category = {
  readonly name: string;
  readonly slug: string;
  readonly imageUrl: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ProductCardComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);

  protected featuredProducts: ProductItem[] = [];

  protected readonly categories: readonly Category[] = [
    {
      name: 'Eyeglasses',
      slug: 'eyeglasses',
      imageUrl: '/images/home-3.png',
    },
    {
      name: 'Sunglasses',
      slug: 'sunglasses',
      imageUrl: '/images/home-4.png',
    },
  ];

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        const list = this.extractProducts(response)
          .map((p) => this.mapProductToCardItem(p))
          .slice(0, 4);
        this.featuredProducts = list;
      },
      error: () => {
        this.featuredProducts = [];
      },
    });
  }

  private mapProductToCardItem(product: Product): ProductItem {
    const price = product?.price ?? 0;
    const oldPrice = product?.oldPrice ?? price;
    const rating = product?.rating ?? product?.averageRating ?? 2.5;
    const image =
      product.imageUrl?.trim() ||
      product.thumbnailUrl?.trim() ||
      'https://picsum.photos/200';

    return {
      id: product?.id ?? 0,
      name: product?.name ?? 'Unnamed Product',
      price,
      oldPrice,
      rating,
      image,
      mediaUrl: product?.mediaUrl || '',
      twoDImageUrl: product?.twoDImageUrl || '',
    };
  }

  private extractProducts(
    response: Product[] | ProductsApiResponse,
  ): Product[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response?.data ?? [];
  }
}
