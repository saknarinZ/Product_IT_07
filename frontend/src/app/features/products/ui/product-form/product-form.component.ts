import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../api/product.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnDestroy {
  @Output() add = new EventEmitter<string>();

  productForm: FormGroup;
  isLoading = false;
  isDuplicate = false;
  isChecking = false;

  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  private codeInputSubject = new Subject<string>();
  private sub: Subscription;

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      product_code: [
        '',
        [
          Validators.required,
          // 35 ตัวอักษร (รวมขีด 5 ตัว)
          Validators.pattern('^([A-Z0-9]{5}-){5}[A-Z0-9]{5}$'),
        ],
      ],
    });

    // Subscript การเปลี่ยนแปลงข้อมูล (debounce ป้องกันการยิงรัวเกินไป)
    this.sub = this.codeInputSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(async (rawCode) => {
        console.log(rawCode);

        if (rawCode.length === 30) {
          await this.checkDuplicate(rawCode);
        } else {
          this.isDuplicate = false;
          this.isChecking = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onInput(event: Event) {
    console.log(event);

    const input = event.target as HTMLInputElement;
    // 1. ลบทุกอย่างที่ไม่ใช่ A-Z หรือ 0-9 ออก และเปลี่ยนเป็นพิมพ์ใหญ่
    let rawValue = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 2. จำกัดความยาวสูงสุด 30 ตัวอักษร
    if (rawValue.length > 30) {
      rawValue = rawValue.substring(0, 30);
    }

    // 3. ใส่ขีด "-" ทุกๆ 5 ตัวอักษร
    let formattedValue = '';
    for (let i = 0; i < rawValue.length; i++) {
      if (i > 0 && i % 5 === 0) {
        formattedValue += '-';
      }
      formattedValue += rawValue[i];
    }

    // 4. อัปเดตค่ากลับเข้าไปใน Input Form
    this.productForm.get('product_code')?.setValue(formattedValue, { emitEvent: false });

    // ถ้าพิมพ์ครบ 30 ให้เริ่มการหน่วงเวลาเพื่อเช็คข้อมูลซ้ำ (เปลี่ยน UI)
    if (rawValue.length === 30) {
      this.isChecking = true;
    } else {
      this.isChecking = false;
    }

    this.cdr.markForCheck();

    this.codeInputSubject.next(rawValue);
  }

  async checkDuplicate(rawCode: string) {
    try {
      this.isChecking = true;
      this.cdr.markForCheck();

      // ยิงเช็คโดยใช้ search แบบ exact/partial เพื่อหาว่ามีโค้ดนี้หรือยัง
      this.productService.getProducts(1, 10, rawCode).subscribe({
        next: (response) => {
          const found = response.data?.some((p) => p.product_code === rawCode);
          this.isDuplicate = !!found;
          this.isChecking = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isChecking = false;
          this.cdr.markForCheck();
        },
      });
    } catch (e) {
      this.isChecking = false;
      this.cdr.markForCheck();
    }
  }

  onSubmit() {
    // ห้ามเซฟถ้าตรวจพบว่าซ้ำ หรือระบบกำลังเช็คอยู่
    if (this.isDuplicate || this.isChecking) return;

    // ดึงค่าแบบเอาขีดออก
    const rawCode = this.productForm.get('product_code')?.value.replace(/-/g, '') || '';

    // ตรวจสอบความถูกต้องของรหัส 30 หลักก่อนส่ง
    const isValid = /^[A-Z0-9]{30}$/.test(rawCode);

    if (isValid && this.productForm.get('product_code')?.value) {
      // ส่งรหัส 30 หลักติดกัน
      this.add.emit(rawCode);
    } else {
      // บังคับโชว์ Error
      this.productForm.get('product_code')?.setErrors({ pattern: true });
      this.productForm.markAllAsTouched();
    }
  }

  resetForm() {
    this.productForm.reset();
    this.isDuplicate = false;
    this.isChecking = false;
    this.codeInputSubject.next(''); // ล้างความจำ distinct เพื่อให้เพิ่มซ้ำได้ (ถ้าต้องการ)
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
    this.cdr.markForCheck();
  }
}
