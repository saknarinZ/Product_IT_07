import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductStore } from './product.store';
import { ProductService } from '../api/product.service';
import { Product } from '../models/product.interface';

describe('ProductStore', () => {
  let store: ProductStore;
  let productServiceMock: {
    getProducts: ReturnType<typeof vi.fn>;
    createProduct: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
  };

  const mockProducts: Product[] = [
    { id: '1', product_code: 'AAAAA', created_at: '', updated_at: '' },
    { id: '2', product_code: 'BBBBB', created_at: '', updated_at: '' },
  ];

  beforeEach(() => {
    productServiceMock = {
      getProducts: vi.fn().mockReturnValue(of({ data: mockProducts, meta: { total_items: 2 } })),
      createProduct: vi.fn().mockReturnValue(of({ data: mockProducts[0] })),
      deleteProduct: vi.fn().mockReturnValue(of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [ProductStore, { provide: ProductService, useValue: productServiceMock }],
    });

    store = TestBed.inject(ProductStore);
  });

  it('should be created with initial state', () => {
    expect(store).toBeTruthy();
    expect(store.products()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.currentPage()).toBe(1);
    expect(store.limit()).toBe(1000);
  });

  describe('loadProducts', () => {
    it('should load products and update state', async () => {
      await store.loadProducts(1, '');

      expect(store.products()).toEqual(mockProducts);
      expect(store.totalItems()).toBe(2);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should call getProducts with correct params', async () => {
      await store.loadProducts(2, 'abc');

      expect(productServiceMock.getProducts).toHaveBeenCalledWith(2, 1000, 'abc');
    });

    it('should update currentPage and searchQuery', async () => {
      await store.loadProducts(3, 'xyz');

      expect(store.currentPage()).toBe(3);
    });

    it('should set error state on network failure', async () => {
      productServiceMock.getProducts.mockReturnValueOnce(
        throwError(() => new Error('Network error')),
      );

      await store.loadProducts(1, '');

      expect(store.error()).toBe('Failed to load products');
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('addProduct', () => {
    it('should call createProduct with correct payload', async () => {
      await store.addProduct('ABCDEABCDE');

      expect(productServiceMock.createProduct).toHaveBeenCalledWith({
        product_code: 'ABCDEABCDE',
      });
    });

    it('should reload products (page 1) after adding', async () => {
      await store.addProduct('ABCDEABCDE');

      // createProduct + getProducts for reload
      expect(productServiceMock.getProducts).toHaveBeenCalledWith(1, 1000, '');
    });

    it('should throw the original error on failure', async () => {
      const apiError = { error: { error_code: 'ERR_DUP_PRODUCT_CODE' } };
      productServiceMock.createProduct.mockReturnValueOnce(throwError(() => apiError));

      await expect(store.addProduct('DUPE')).rejects.toEqual(apiError);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('deleteProduct', () => {
    it('should call deleteProduct with correct id', async () => {
      await store.deleteProduct('id-1');

      expect(productServiceMock.deleteProduct).toHaveBeenCalledWith('id-1');
    });

    it('should reload products after deleting', async () => {
      await store.deleteProduct('id-1');

      expect(productServiceMock.getProducts).toHaveBeenCalled();
    });

    it('should throw error and set error state on failure', async () => {
      productServiceMock.deleteProduct.mockReturnValueOnce(
        throwError(() => new Error('Server error')),
      );

      await expect(store.deleteProduct('id-1')).rejects.toThrow();
      expect(store.error()).toBe('Failed to delete product');
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('loadMore', () => {
    it('should append products and increment page when more items remain', async () => {
      // First load: 2 items, total=10
      productServiceMock.getProducts.mockReturnValueOnce(
        of({ data: mockProducts, meta: { total_items: 10 } }),
      );
      await store.loadProducts(1, '');

      // Load more: 1 extra item
      const extra: Product[] = [{ id: '3', product_code: 'CCCCC', created_at: '', updated_at: '' }];
      productServiceMock.getProducts.mockReturnValueOnce(
        of({ data: extra, meta: { total_items: 10 } }),
      );
      await store.loadMore();

      expect(store.currentPage()).toBe(2);
      expect(store.products().length).toBe(3);
      expect(store.products()[2]).toEqual(extra[0]);
    });

    it('should NOT load more if isLoading is already true', async () => {
      // Trigger a stalled load so isLoading = true
      let resolve!: (v: any) => void;
      productServiceMock.getProducts.mockReturnValueOnce(new Promise((r) => (resolve = r)));

      // Manually force isLoading via state signal (cast to any for private access)
      (store as any).state.update((s: any) => ({ ...s, isLoading: true }));
      const callsBefore = productServiceMock.getProducts.mock.calls.length;

      await store.loadMore();

      expect(productServiceMock.getProducts.mock.calls.length).toBe(callsBefore);
    });

    it('should NOT load more when all items are already loaded', async () => {
      // products.length (2) === total_items (2)
      await store.loadProducts(1, '');

      const callsBefore = productServiceMock.getProducts.mock.calls.length;
      await store.loadMore();

      expect(productServiceMock.getProducts.mock.calls.length).toBe(callsBefore);
    });

    it('should revert page and set error on failure', async () => {
      productServiceMock.getProducts.mockReturnValueOnce(
        of({ data: mockProducts, meta: { total_items: 10 } }),
      );
      await store.loadProducts(1, '');

      productServiceMock.getProducts.mockReturnValueOnce(
        throwError(() => new Error('Load more failed')),
      );
      await store.loadMore();

      expect(store.currentPage()).toBe(1);
      expect(store.error()).toBe('Failed to load more products');
    });
  });
});
