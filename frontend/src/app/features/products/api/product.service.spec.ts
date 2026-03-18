import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:8080/api/v1/products';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should GET products with default page=1 limit=50', () => {
      const mockResponse = { data: [], total_items: 0 };

      service.getProducts().subscribe((res) => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(
        (r) =>
          r.url === API_URL &&
          r.params.get('page') === '1' &&
          r.params.get('limit') === '50' &&
          !r.params.has('search'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include search param when provided', () => {
      service.getProducts(1, 50, 'ABCDE').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === API_URL &&
          r.params.get('page') === '1' &&
          r.params.get('limit') === '50' &&
          r.params.get('search') === 'ABCDE',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('should NOT include search param when empty string is passed', () => {
      service.getProducts(1, 50, '').subscribe();

      const req = httpMock.expectOne((r) => r.url === API_URL && !r.params.has('search'));
      req.flush({ data: [] });
    });

    it('should support custom page and limit', () => {
      service.getProducts(3, 20).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === API_URL && r.params.get('page') === '3' && r.params.get('limit') === '20',
      );
      req.flush({ data: [] });
    });
  });

  describe('createProduct', () => {
    it('should POST body to API and return product', () => {
      const mockProduct = {
        id: 'uuid-1',
        product_code: 'ABCDEABCDE',
        created_at: '',
        updated_at: '',
      };

      service.createProduct({ product_code: 'ABCDEABCDE' }).subscribe((res) => {
        expect(res.data).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ product_code: 'ABCDEABCDE' });
      req.flush({ data: mockProduct });
    });
  });

  describe('deleteProduct', () => {
    it('should DELETE product by id', () => {
      service.deleteProduct('uuid-123').subscribe();

      const req = httpMock.expectOne(`${API_URL}/uuid-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
