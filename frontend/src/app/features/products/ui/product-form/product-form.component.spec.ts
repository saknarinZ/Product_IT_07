import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { ProductService } from '../../api/product.service';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let productServiceMock: { getProducts: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productServiceMock = {
      getProducts: vi.fn().mockReturnValue(of({ data: [], total_items: 0 })),
    };

    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [{ provide: ProductService, useValue: productServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form Validation ──────────────────────────────────────────────────────
  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.productForm.invalid).toBe(true);
    });

    it('should be valid with correct pattern XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', () => {
      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF');
      expect(component.productForm.valid).toBe(true);
    });

    it('should be invalid with lowercase code', () => {
      component.productForm.get('product_code')?.setValue('aaaaa-bbbbb-ccccc-ddddd-eeeee-fffff');
      expect(component.productForm.invalid).toBe(true);
    });

    it('should be invalid with too short code', () => {
      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB');
      expect(component.productForm.invalid).toBe(true);
    });

    it('should be invalid with extra segment', () => {
      component.productForm
        .get('product_code')
        ?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF-GGGGG');
      expect(component.productForm.invalid).toBe(true);
    });
  });

  // ─── onInput formatting (synchronous) ──────────────────────────────────────
  describe('onInput', () => {
    function simulateInput(value: string) {
      const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('should uppercase and insert dashes every 5 chars', () => {
      simulateInput('abcdeabcde');
      expect(component.productForm.get('product_code')?.value).toBe('ABCDE-ABCDE');
    });

    it('should strip non-alphanumeric characters', () => {
      simulateInput('abc!@#def');
      expect(component.productForm.get('product_code')?.value).toBe('ABCDE-F');
    });

    it('should limit raw input to 30 chars', () => {
      simulateInput('ABCDEABCDEABCDEABCDEABCDEABCDE12345'); // > 30 raw chars
      const raw = (component.productForm.get('product_code')?.value as string).replace(/-/g, '');
      expect(raw.length).toBeLessThanOrEqual(30);
    });

    it('should set isChecking=true immediately when rawLength reaches 30', () => {
      simulateInput('ABCDEABCDEABCDEABCDEABCDEABCDE');
      expect(component.isChecking).toBe(true);
    });

    it('should keep isChecking=false when raw length is below 30', () => {
      simulateInput('ABCDEABCDE');
      expect(component.isChecking).toBe(false);
    });

    it('should call checkDuplicate after debounce fires', async () => {
      vi.useFakeTimers();
      const checkSpy = vi.spyOn(component, 'checkDuplicate').mockResolvedValue();

      simulateInput('ABCDEABCDEABCDEABCDEABCDEABCDE');

      await vi.advanceTimersByTimeAsync(500);

      expect(checkSpy).toHaveBeenCalledWith('ABCDEABCDEABCDEABCDEABCDEABCDE');
    });
  });

  // ─── onSubmit ──────────────────────────────────────────────────────────────
  describe('onSubmit', () => {
    it('should emit raw (no-dash) code when form is valid', () => {
      let emitted: string | undefined;
      component.add.subscribe((v: string) => (emitted = v));

      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF');
      component.isDuplicate = false;
      component.isChecking = false;
      component.onSubmit();

      expect(emitted).toBe('AAAAABBBBBCCCCCDDDDDEEEEEFFFFF');
    });

    it('should not emit when form is invalid', () => {
      let emitted = false;
      component.add.subscribe(() => (emitted = true));

      component.productForm.get('product_code')?.setValue('BAD');
      component.onSubmit();

      expect(emitted).toBe(false);
    });

    it('should not emit when isDuplicate is true', () => {
      let emitted = false;
      component.add.subscribe(() => (emitted = true));

      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF');
      component.isDuplicate = true;
      component.onSubmit();

      expect(emitted).toBe(false);
    });

    it('should not emit when isChecking is true', () => {
      let emitted = false;
      component.add.subscribe(() => (emitted = true));

      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF');
      component.isChecking = true;
      component.onSubmit();

      expect(emitted).toBe(false);
    });

    it('should mark form as touched when submitting invalid', () => {
      component.productForm.get('product_code')?.setValue('BAD');
      component.onSubmit();

      expect(component.productForm.get('product_code')?.touched).toBe(true);
    });
  });

  // ─── resetForm ─────────────────────────────────────────────────────────────
  describe('resetForm', () => {
    it('should clear form value and reset flags', () => {
      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF');
      component.isDuplicate = true;
      component.isChecking = true;

      component.resetForm();

      expect(component.productForm.get('product_code')?.value).toBeNull();
      expect(component.isDuplicate).toBe(false);
      expect(component.isChecking).toBe(false);
    });
  });

  // ─── setLoading ────────────────────────────────────────────────────────────
  describe('setLoading', () => {
    it('should set isLoading=true', () => {
      component.setLoading(true);
      expect(component.isLoading).toBe(true);
    });

    it('should set isLoading=false', () => {
      component.setLoading(true);
      component.setLoading(false);
      expect(component.isLoading).toBe(false);
    });

    it('should disable submit button while loading', () => {
      component.productForm.get('product_code')?.setValue('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF');
      component.setLoading(true);
      fixture.detectChanges();

      const btn: HTMLButtonElement = fixture.debugElement.query(
        By.css('button[type="submit"]'),
      ).nativeElement;
      expect(btn.disabled).toBe(true);
    });
  });

  // ─── checkDuplicate ────────────────────────────────────────────────────────
  describe('checkDuplicate', () => {
    it('should set isDuplicate=true when product already exists', async () => {
      productServiceMock.getProducts.mockReturnValue(
        of({
          data: [{ id: '1', product_code: 'ABCDEABCDE', created_at: '', updated_at: '' }],
          total_items: 1,
        }),
      );

      await component.checkDuplicate('ABCDEABCDE');

      expect(component.isDuplicate).toBe(true);
      expect(component.isChecking).toBe(false);
    });

    it('should set isDuplicate=false when product does not exist', async () => {
      productServiceMock.getProducts.mockReturnValue(of({ data: [], total_items: 0 }));

      await component.checkDuplicate('NEWCODE123');

      expect(component.isDuplicate).toBe(false);
      expect(component.isChecking).toBe(false);
    });
  });
});
