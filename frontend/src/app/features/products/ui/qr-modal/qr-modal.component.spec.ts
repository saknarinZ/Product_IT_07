import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { QrModalComponent } from './qr-modal.component';

// Stub angularx-qrcode — must declare all bound inputs to avoid NG0303
@Component({ selector: 'qrcode', standalone: true, template: '<div class="qrcode-stub"></div>' })
class QrCodeStub {
  @Input() qrdata: string = '';
  @Input() width: number = 200;
  @Input() errorCorrectionLevel: string = 'M';
  @Input() cssClass: string = '';
}

describe('QrModalComponent', () => {
  let component: QrModalComponent;
  let fixture: ComponentFixture<QrModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrModalComponent],
    })
      .overrideComponent(QrModalComponent, {
        set: { imports: [CommonModule, QrCodeStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(QrModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('visibility', () => {
    it('should not render modal when isOpen is false (default)', () => {
      expect(fixture.nativeElement.querySelector('.fixed')).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.fixed')).not.toBeNull();
    });
  });

  describe('formattedCode', () => {
    it('should format plain code into groups of 5 separated by dashes', () => {
      component.productCode = 'ABCDEABCDEABCDE';
      expect(component.formattedCode).toBe('ABCDE-ABCDE-ABCDE');
    });

    it('should strip existing dashes before reformatting', () => {
      component.productCode = 'ABCDE-ABCDE-ABCDE';
      expect(component.formattedCode).toBe('ABCDE-ABCDE-ABCDE');
    });

    it('should handle code with length not divisible by 5', () => {
      component.productCode = 'ABCDEFGH';
      expect(component.formattedCode).toBe('ABCDE-FGH');
    });

    it('should return original productCode when it is empty', () => {
      component.productCode = '';
      expect(component.formattedCode).toBe('');
    });

    it('should format 30-char code into 6 groups', () => {
      component.productCode = 'ABCDEABCDEABCDEABCDEABCDEABCDE';
      expect(component.formattedCode).toBe('ABCDE-ABCDE-ABCDE-ABCDE-ABCDE-ABCDE');
    });
  });

  describe('close output', () => {
    it('should emit close event when Close button is clicked', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      let emitted = false;
      component.close.subscribe(() => (emitted = true));

      const btn = fixture.debugElement.query(By.css('button'));
      btn.nativeElement.click();

      expect(emitted).toBe(true);
    });
  });

  describe('QR code binding', () => {
    it('should render qrcode stub when modal is open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('productCode', 'ABCDEABCDE');
      fixture.detectChanges();

      const qr = fixture.debugElement.query(By.css('qrcode'));
      expect(qr).not.toBeNull();
    });
  });
});
