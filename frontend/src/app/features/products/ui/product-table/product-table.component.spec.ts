import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from '../../models/product.interface';
import { ProductTableComponent } from './product-table.component';

describe('ProductTableComponent', () => {
  let component: ProductTableComponent;
  let fixture: ComponentFixture<ProductTableComponent>;

  const mockProducts: Product[] = Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
    product_code: `CODE${i}`,
    created_at: '',
    updated_at: '',
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Default inputs ──────────────────────────────────────────────────────────
  describe('default inputs', () => {
    it('should default products to empty array', () => {
      expect(component.products()).toEqual([]);
    });

    it('should default isLoading to false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should default currentPage to 1', () => {
      expect(component.currentPage()).toBe(1);
    });

    it('should default limit to 50', () => {
      expect(component.limit()).toBe(50);
    });
  });

  // ─── trackById ───────────────────────────────────────────────────────────────
  describe('trackById', () => {
    it('should return the product id', () => {
      expect(component.trackById(0, mockProducts[0])).toBe('1');
      expect(component.trackById(1, mockProducts[1])).toBe('2');
    });
  });

  // ─── checkScrollPosition ─────────────────────────────────────────────────────
  describe('checkScrollPosition', () => {
    it('should emit loadMore when within 200px of the bottom', () => {
      let emitted = false;
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(50); // 50px from bottom < 200 threshold

      expect(emitted).toBe(true);
    });

    it('should emit loadMore when exactly at threshold boundary (199px)', () => {
      let emitted = false;
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(199);

      expect(emitted).toBe(true);
    });

    it('should NOT emit loadMore when more than 200px from the bottom', () => {
      let emitted = false;
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(500); // 500px from bottom > 200 threshold

      expect(emitted).toBe(false);
    });

    it('should NOT emit loadMore when exactly at 200px', () => {
      let emitted = false;
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(200); // not < 200

      expect(emitted).toBe(false);
    });

    it('should NOT emit loadMore when isLoading is true', () => {
      let emitted = false;
      fixture = TestBed.createComponent(ProductTableComponent);
      fixture.componentRef.setInput('isLoading', true);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(50);

      expect(emitted).toBe(false);
    });
  });

  // ─── Outputs ─────────────────────────────────────────────────────────────────
  describe('outputs', () => {
    it('should emit delete event with product id', () => {
      let deletedId: string | undefined;
      component.delete.subscribe((id: string) => (deletedId = id));

      component.delete.emit('id-99');

      expect(deletedId).toBe('id-99');
    });

    it('should emit viewQr event with product code', () => {
      let qrCode: string | undefined;
      component.viewQr.subscribe((code: string) => (qrCode = code));

      component.viewQr.emit('ABCDE12345');

      expect(qrCode).toBe('ABCDE12345');
    });

    it('should emit filterChange event via onSearch', () => {
      let searched: string | undefined;
      component.filterChange.subscribe((v: string) => (searched = v));

      const fakeEvent = { target: { value: 'TEST' } } as unknown as Event;
      component.onSearch(fakeEvent);

      expect(searched).toBe('TEST');
    });
  });

  // ─── Large dataset (10,000+ items) ───────────────────────────────────────────
  describe('large dataset (10,000+ items)', () => {
    const BIG = 10_000;
    let bigProducts: Product[];

    beforeEach(() => {
      bigProducts = Array.from({ length: BIG }, (_, i) => ({
        id: String(i + 1),
        product_code: String(i).padStart(30, '0'),
        created_at: '',
        updated_at: '',
      }));
      fixture.componentRef.setInput('products', bigProducts);
      fixture.detectChanges();
    });

    it('should hold all 10,000 products in memory', () => {
      expect(component.products().length).toBe(BIG);
    });

    it('should trackById correctly for first and last item', () => {
      expect(component.trackById(0, bigProducts[0])).toBe('1');
      expect(component.trackById(BIG - 1, bigProducts[BIG - 1])).toBe(String(BIG));
    });

    it('should emit loadMore when within 200px of bottom (large list)', () => {
      let emitted = false;
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(100); // 100px < 200 threshold

      expect(emitted).toBe(true);
    });

    it('should NOT emit loadMore when far from bottom (large list)', () => {
      let emitted = false;
      component.loadMore.subscribe(() => (emitted = true));

      component.checkScrollPosition(1000); // 1000px from bottom → no emit

      expect(emitted).toBe(false);
    });

    it('confirmDelete should set pendingDelete correctly in large list', () => {
      const target = bigProducts[5000];
      component.confirmDelete(target);
      expect(component.pendingDelete).toBe(target);
    });

    it('confirmDeleteAction should emit delete and clear pendingDelete', () => {
      const target = bigProducts[9999];
      let deletedId: string | undefined;
      component.delete.subscribe((id) => (deletedId = id));

      component.confirmDelete(target);
      component.confirmDeleteAction();

      expect(deletedId).toBe(target.id);
      expect(component.pendingDelete).toBeNull();
    });

    it('cancelDelete should clear pendingDelete', () => {
      component.confirmDelete(bigProducts[0]);
      component.cancelDelete();
      expect(component.pendingDelete).toBeNull();
    });
  });
});
