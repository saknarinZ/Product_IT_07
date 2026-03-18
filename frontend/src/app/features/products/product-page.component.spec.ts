import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ProductPageComponent } from './product-page.component';
import { ProductStore } from './state/product.store';

// ─── Stub child components ───────────────────────────────────────────────────
@Component({ selector: 'app-product-form', standalone: true, template: '' })
class ProductFormStub {
  setLoading = vi.fn();
  resetForm = vi.fn();
  @Output() add = new EventEmitter<string>();
}

@Component({ selector: 'app-product-table', standalone: true, template: '' })
class ProductTableStub {
  @Input() products: any[] = [];
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() limit = 50;
  @Output() delete = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();
  @Output() viewQr = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();
}

@Component({ selector: 'app-qr-modal', standalone: true, template: '' })
class QrModalStub {
  @Input() isOpen = false;
  @Input() productCode = '';
  @Output() close = new EventEmitter<void>();
}

describe('ProductPageComponent', () => {
  let component: ProductPageComponent;
  let fixture: ComponentFixture<ProductPageComponent>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      products: vi.fn().mockReturnValue([]),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      currentPage: vi.fn().mockReturnValue(1),
      limit: vi.fn().mockReturnValue(50),
      totalItems: vi.fn().mockReturnValue(0),
      loadProducts: vi.fn().mockResolvedValue(undefined),
      addProduct: vi.fn().mockResolvedValue(undefined),
      deleteProduct: vi.fn().mockResolvedValue(undefined),
      loadMore: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ProductPageComponent],
      providers: [{ provide: ProductStore, useValue: mockStore }],
    })
      .overrideComponent(ProductPageComponent, {
        set: { imports: [CommonModule, ProductFormStub, ProductTableStub, QrModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call store.loadProducts on init', () => {
    expect(mockStore.loadProducts).toHaveBeenCalledWith(1, '');
  });

  // ─── onSearch ────────────────────────────────────────────────────────────────
  describe('onSearch', () => {
    it('should call store.loadProducts with page 1 and query', () => {
      component.onSearch('ABC');
      expect(mockStore.loadProducts).toHaveBeenCalledWith(1, 'ABC');
    });
  });

  // ─── onViewQr ────────────────────────────────────────────────────────────────
  describe('onViewQr', () => {
    it('should set selectedQrCode and open modal', () => {
      component.onViewQr('QR-CODE-123');
      expect(component.selectedQrCode).toBe('QR-CODE-123');
      expect(component.isQrModalOpen).toBe(true);
    });
  });

  // ─── closeQrModal ────────────────────────────────────────────────────────────
  describe('closeQrModal', () => {
    it('should set isQrModalOpen to false', () => {
      component.isQrModalOpen = true;
      component.closeQrModal();
      expect(component.isQrModalOpen).toBe(false);
    });
  });

  // ─── onLoadMore ──────────────────────────────────────────────────────────────
  describe('onLoadMore', () => {
    it('should call store.loadMore', () => {
      component.onLoadMore();
      expect(mockStore.loadMore).toHaveBeenCalled();
    });
  });

  // ─── onAddProduct ────────────────────────────────────────────────────────────
  describe('onAddProduct', () => {
    it('should call store.addProduct and show success message', async () => {
      await component.onAddProduct('ABCDEABCDE');

      expect(mockStore.addProduct).toHaveBeenCalledWith('ABCDEABCDE');
      expect(component.successMessage()).toBe('เพิ่มสินค้าสำเร็จแล้ว!');
    });

    it('should show duplicate error message on ERR_DUP_PRODUCT_CODE error', async () => {
      mockStore.addProduct.mockRejectedValueOnce({
        error: { error_code: 'ERR_DUP_PRODUCT_CODE' },
      });

      await component.onAddProduct('DUPE');

      expect(component.errorMessage()).toBe('รหัสสินค้านี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
    });

    it('should show generic error message on unknown error', async () => {
      mockStore.addProduct.mockRejectedValueOnce(new Error('Unknown'));

      await component.onAddProduct('CODE');

      expect(component.errorMessage()).toBe('เกิดข้อผิดพลาดในการเพิ่มสินค้า กรุณาตรวจสอบข้อมูล');
    });
  });

  // ─── onDeleteProduct ─────────────────────────────────────────────────────────
  describe('onDeleteProduct', () => {
    it('should call store.deleteProduct when user confirms', async () => {
      await component.onDeleteProduct('id-1');

      expect(mockStore.deleteProduct).toHaveBeenCalledWith('id-1');
    });

    it('should show success message after deleting', async () => {
      await component.onDeleteProduct('id-1');

      expect(component.successMessage()).toBe('ลบสินค้าสำเร็จแล้ว!');
    });

    it('should show error message when deleteProduct throws', async () => {
      mockStore.deleteProduct.mockRejectedValueOnce(new Error('fail'));

      await component.onDeleteProduct('id-1');

      expect(component.errorMessage()).toBe('ไม่สามารถลบสินค้าได้');
    });
  });
});
