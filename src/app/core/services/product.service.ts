import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductsApiResponse } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly productsEndpoint = `${environment.apiUrl}/api/Product`;

  constructor(private readonly http: HttpClient) {}

  getAllProducts(): Observable<Product[] | ProductsApiResponse> {
    return this.http.get<Product[] | ProductsApiResponse>(this.productsEndpoint);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.productsEndpoint}/${id}`);
  }

  getProductsByCategory(
    categoryId: number,
  ): Observable<Product[] | ProductsApiResponse> {
    return this.http.get<Product[] | ProductsApiResponse>(
      `${this.productsEndpoint}/category/${categoryId}`,
    );
  }

  getProductsByBrand(
    brandId: number,
  ): Observable<Product[] | ProductsApiResponse> {
    return this.http.get<Product[] | ProductsApiResponse>(
      `${this.productsEndpoint}/brand/${brandId}`,
    );
  }

  getSimilarProducts(productId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.productsEndpoint}/${productId}/similar`);
  }
}
