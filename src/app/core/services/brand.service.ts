import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Brand,
  buildBrandLookupMap,
  enrichProductWithBrand,
  enrichProductsWithBrands,
  normalizeBrandList,
} from '../models/brand.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  private readonly http = inject(HttpClient);
  private readonly brandsEndpoint = `${environment.apiUrl.replace(/\/$/, '')}/api/Brand`;
  private brandLookupRequest$: Observable<Map<number, string>> | null = null;

  getBrands(): Observable<Brand[]> {
    return this.http
      .get<unknown>(this.brandsEndpoint)
      .pipe(map((response) => normalizeBrandList(response)));
  }

  getBrandLookupMap(): Observable<Map<number, string>> {
    if (!this.brandLookupRequest$) {
      this.brandLookupRequest$ = this.getBrands().pipe(
        map((brands) => buildBrandLookupMap(brands)),
        shareReplay(1),
      );
    }

    return this.brandLookupRequest$;
  }

  enrichProduct(product: Product): Observable<Product> {
    return this.getBrandLookupMap().pipe(
      map((brandMap) => {
        const enriched = enrichProductWithBrand(product, brandMap);
        return enriched;
      }),
    );
  }

  enrichProducts(products: Product[]): Observable<Product[]> {
    return this.getBrandLookupMap().pipe(
      map((brandMap) => {
        const enriched = enrichProductsWithBrands(products, brandMap);
        return enriched;
      }),
    );
  }
}
