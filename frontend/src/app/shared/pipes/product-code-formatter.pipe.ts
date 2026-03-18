import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'productCodeFormatter',
  standalone: true
})
export class ProductCodeFormatterPipe implements PipeTransform {

  transform(value: string | undefined | null): string {
    if (!value) return '';

    // ลบตัวอักษรที่ไม่ใช่ตัวเลข/ตัวหนังสือเผื่อไว้ (เอาเฉพาะ A-Z, 0-9)
    const cleanStr = value.replace(/[^a-zA-Z0-9]/g, '');

    // แบ่งเป็นกลุ่ม กลุ่มละ 5 ตัวอักษร 
    // ใช้ Regex Match: /.{1,5}/g แปลว่า จับกลุ่มละ 1-5 ตัว
    const chunks = cleanStr.match(/.{1,5}/g);

    if (!chunks) return value;

    // นำมาต่อกันด้วยเครื่องหมาย -
    return chunks.join('-');
  }

}
