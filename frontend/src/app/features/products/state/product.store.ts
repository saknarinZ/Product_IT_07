import { Injectable, signal, computed, inject } from '@angular/core';
import { Product } from '../models/product.interface';
import { ProductService } from '../api/product.service';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  limit: number;
  searchQuery: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductStore {
  private productService = inject(ProductService);

  // State (Signals)
  private state = signal<ProductState>({
    products: [],
    isLoading: false,
    error: null,
    totalItems: 0,
    currentPage: 1,
    limit: 1000,
    searchQuery: '',
  });

  // Selectors (Computed)
  products = computed(() => this.state().products);
  isLoading = computed(() => this.state().isLoading);
  error = computed(() => this.state().error);
  totalItems = computed(() => this.state().totalItems);
  currentPage = computed(() => this.state().currentPage);
  limit = computed(() => this.state().limit);

  // Load Products
  async loadProducts(
    page: number = this.state().currentPage,
    search: string = this.state().searchQuery,
  ) {
    this.updateState({ isLoading: true, error: null, currentPage: page, searchQuery: search });

    try {
      const response = await firstValueFrom(
        this.productService.getProducts(page, this.state().limit, search),
      );
      this.updateState({
        products: response.data || [],
        totalItems: response.meta?.total_items || 0,
        isLoading: false,
      });
    } catch (err: any) {
      this.updateState({ error: 'Failed to load products', isLoading: false });
    }
  }

  // Load More Products (Infinite Scroll)
  async loadMore() {
    if (this.state().isLoading) return;
    if (this.state().products.length >= this.state().totalItems) return; // All data loaded

    const nextPage = this.state().currentPage + 1;
    this.updateState({ isLoading: true, error: null, currentPage: nextPage });

    try {
      const response = await firstValueFrom(
        this.productService.getProducts(nextPage, this.state().limit, this.state().searchQuery),
      );
      this.updateState({
        products: [...this.state().products, ...(response.data || [])],
        totalItems: response.meta?.total_items || 0,
        isLoading: false,
      });
    } catch (err: any) {
      // Revert loading state if failed
      this.updateState({
        error: 'Failed to load more products',
        isLoading: false,
        currentPage: nextPage - 1,
      });
    }
  }

  // Create Product
  async addProduct(productCode: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      await firstValueFrom(this.productService.createProduct({ product_code: productCode }));
      // Reload page 1 after adding
      await this.loadProducts(1, '');
    } catch (err: any) {
      this.updateState({ isLoading: false });
      // Throw เพื่อให้ UI (Form) จัดการต่อ เช่น โชว์ error_code เป็นภาษาไทย
      throw err;
    }
  }

  // Delete Product
  async deleteProduct(id: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    try {
      await firstValueFrom(this.productService.deleteProduct(id));
      // Reload current page after deleting
      await this.loadProducts(this.state().currentPage, this.state().searchQuery);
    } catch (err: any) {
      this.updateState({ error: 'Failed to delete product', isLoading: false });
      throw err;
    }
  }

  // Utility เพื่ออัปเดต State บางส่วน
  private updateState(partialState: Partial<ProductState>) {
    this.state.update((currentState) => ({ ...currentState, ...partialState }));
  }
}
