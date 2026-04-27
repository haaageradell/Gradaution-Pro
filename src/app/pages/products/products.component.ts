import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { FilterSidebarComponent } from '../../components/filter-sidebar/filter-sidebar.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import {
  ProductCardComponent,
  ProductItem,
} from '../../components/product-card/product-card.component';
import { Product, ProductsApiResponse } from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterSidebarComponent,
    ProductCardComponent,
    PaginationComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);

  tabs = [
    { label: 'All Glasses', categoryId: null as number | null },
    { label: 'Sunglasses', categoryId: 1 },
    { label: 'Eyeglasses', categoryId: 2 },
    { label: "Men's Glasses", categoryId: 3 },
    { label: "Women's Glasses", categoryId: 4 },
  ];
  activeTab = 'All Glasses';
  viewMode: 'gridA' | 'gridB' = 'gridA';
  selectedBrandId: number | null = null;
  currentPage = 1;
  isLoading = false;
  errorMessage = '';
  totalCount = 0;

  products: ProductItem[] = [];

  ngOnInit(): void {
    this.loadAllProducts();
  }

  setPage(page: number): void {
    if (page < 1 || page > 3) {
      return;
    }
    this.currentPage = page;
  }

  onCategoryChange(tab: { label: string; categoryId: number | null }): void {
    this.activeTab = tab.label;
    if (tab.categoryId === null) {
      this.loadAllProducts();
      return;
    }
    this.fetchProducts(
      this.productService.getProductsByCategory(tab.categoryId),
    );
  }

  onBrandChange(brandIdValue: number | null): void {
    const brandId = Number(brandIdValue);
    if (!brandId) {
      this.selectedBrandId = null;
      this.loadAllProducts();
      return;
    }
    this.selectedBrandId = brandId;
    this.fetchProducts(this.productService.getProductsByBrand(brandId));
  }

  private loadAllProducts(): void {
    this.fetchProducts(this.productService.getAllProducts());
  }

  private fetchProducts(
    request$: Observable<Product[] | ProductsApiResponse>,
  ): void {
    this.isLoading = true;
    this.errorMessage = '';

    request$.subscribe({
      next: (response) => {
        const productsArray = this.extractProducts(response);
        console.log('Products:', productsArray);
        console.log('First Product:', productsArray[0] ?? null);

        this.products = productsArray.map((product) =>
          this.mapProductToCardItem(product),
        );

        this.totalCount = Array.isArray(response)
          ? this.products.length
          : response.totalCount ?? this.products.length;

        this.isLoading = false;
      },

      error: () => {
        this.products = [];
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
      },
    });
  }

  private mapProductToCardItem(product: Product): ProductItem {
    const price = product?.price ?? 0;
    const oldPrice = product?.oldPrice ?? price;
    const rating = product?.rating ?? product?.averageRating ?? 0;
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
