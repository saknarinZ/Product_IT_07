import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-modal',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './qr-modal.component.html',
  styleUrls: ['./qr-modal.component.scss'],
})
export class QrModalComponent {
  @Input() isOpen = false;
  @Input() productCode: string = '';

  @Output() close = new EventEmitter<void>();

  get formattedCode(): string {
    const clean = this.productCode.replace(/-/g, '');
    return clean.match(/.{1,5}/g)?.join('-') ?? this.productCode;
  }
}
