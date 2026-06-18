import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, normalizeCategoryList } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly categoriesEndpoint = `${environment.apiUrl.replace(/\/$/, '')}/api/Category`;

  getCategories(): Observable<Category[]> {
    return this.http
      .get<unknown>(this.categoriesEndpoint)
      .pipe(map((response) => normalizeCategoryList(response)));
  }
}
