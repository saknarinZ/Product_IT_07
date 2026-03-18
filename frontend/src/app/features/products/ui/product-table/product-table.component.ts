import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProductCodeFormatterPipe } from '../../../../shared/pipes/product-code-formatter.pipe';
import { Product } from '../../models/product.interface';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule, ProductCodeFormatterPipe],
  templateUrl: './product-table.component.html',
  styleUrls: ['./product-table.component.scss'],
})
export class ProductTableComponent {
  products = input<Product[]>([]);
  isLoading = input(false);
  currentPage = input(1);
  limit = input(50);

  delete = output<string>();
  filterChange = output<string>();
  viewQr = output<string>();
  loadMore = output<void>();
  deletePending = output<boolean>();

  pendingDelete: Product | null = null;

  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    const offsetFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.checkScrollPosition(offsetFromBottom);
  }

  checkScrollPosition(offsetFromBottom: number) {
    if (offsetFromBottom < 200 && !this.isLoading()) {
      console.log('Offset from bottom:', offsetFromBottom);

      this.loadMore.emit();
    }
  }

  confirmDelete(product: Product) {
    this.pendingDelete = product;
    this.deletePending.emit(true);
  }

  confirmDeleteAction() {
    if (this.pendingDelete) {
      this.delete.emit(this.pendingDelete.id);
      this.pendingDelete = null;
      this.deletePending.emit(false);
    }
  }

  cancelDelete() {
    this.pendingDelete = null;
    this.deletePending.emit(false);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit(value);
  }

  trackById(index: number, product: Product): string {
    return product.id;
  }
}
