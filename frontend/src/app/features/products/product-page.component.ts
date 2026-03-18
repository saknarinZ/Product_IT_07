import { Component, OnInit, inject, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductStore } from './state/product.store';

import { ProductTableComponent } from './ui/product-table/product-table.component';
import { QrModalComponent } from './ui/qr-modal/qr-modal.component';
import { ProductFormComponent } from './ui/product-form/product-form.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, ProductFormComponent, ProductTableComponent, QrModalComponent],
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.scss'],
})
export class ProductPageComponent implements OnInit {
  // Domain Layer (State Management)
  store = inject(ProductStore);

  @ViewChild(ProductFormComponent) productForm!: ProductFormComponent;

  isQrModalOpen = false;
  selectedQrCode = '';
  isPendingDelete = signal(false);

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.store.loadProducts(1, '');
  }

  private showSuccess(msg: string) {
    this.successMessage.set(msg);
    this.errorMessage.set(null);
    this.resetTimer(() => this.successMessage.set(null));
  }

  private showError(msg: string) {
    this.errorMessage.set(msg);
    this.successMessage.set(null);
    this.resetTimer(() => this.errorMessage.set(null));
  }

  private resetTimer(fn: () => void) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(fn, 3000);
  }

  async onAddProduct(code: string) {
    if (this.productForm) {
      this.productForm.setLoading(true);
    }

    try {
      await this.store.addProduct(code);
      this.showSuccess('เพิ่มสินค้าสำเร็จแล้ว!');
      if (this.productForm) {
        this.productForm.resetForm();
      }
    } catch (err: any) {
      if (err.error?.error_code === 'ERR_DUP_PRODUCT_CODE') {
        this.showError('รหัสสินค้านี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
      } else {
        this.showError('เกิดข้อผิดพลาดในการเพิ่มสินค้า กรุณาตรวจสอบข้อมูล');
      }
    } finally {
      if (this.productForm) {
        this.productForm.setLoading(false);
      }
    }
  }

  async onDeleteProduct(id: string) {
    try {
      await this.store.deleteProduct(id);
      this.showSuccess('ลบสินค้าสำเร็จแล้ว!');
    } catch {
      this.showError('ไม่สามารถลบสินค้าได้');
    }
  }

  onSearch(query: string) {
    this.store.loadProducts(1, query);
  }

  onViewQr(code: string) {
    this.selectedQrCode = code;
    this.isQrModalOpen = true;
  }

  onLoadMore() {
    this.store.loadMore();
  }

  closeQrModal() {
    this.isQrModalOpen = false;
  }
}
