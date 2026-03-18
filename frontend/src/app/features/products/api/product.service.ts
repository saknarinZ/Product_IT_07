import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, PaginatedResponse, CreateProductRequest } from '../models/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/products'; // สามารถย้ายไป environment.ts ภายหลังได้

  getProducts(page: number = 1, limit: number = 50, search?: string): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params });
  }

  createProduct(data: CreateProductRequest): Observable<{ data: Product }> {
    return this.http.post<{ data: Product }>(this.apiUrl, data);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
