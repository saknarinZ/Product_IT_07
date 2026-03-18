import { ProductCodeFormatterPipe } from './product-code-formatter.pipe';

describe('ProductCodeFormatterPipe', () => {
  let pipe: ProductCodeFormatterPipe;

  beforeEach(() => {
    pipe = new ProductCodeFormatterPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format 30-char code into 6 groups of 5 separated by dashes', () => {
    expect(pipe.transform('ABCDEABCDEABCDEABCDEABCDEABCDE')).toBe(
      'ABCDE-ABCDE-ABCDE-ABCDE-ABCDE-ABCDE',
    );
  });

  it('should strip existing dashes before formatting', () => {
    expect(pipe.transform('ABCDE-ABCDE-ABCDE-ABCDE-ABCDE-ABCDE')).toBe(
      'ABCDE-ABCDE-ABCDE-ABCDE-ABCDE-ABCDE',
    );
  });

  it('should handle code with length not divisible by 5', () => {
    expect(pipe.transform('ABCDEFGH')).toBe('ABCDE-FGH');
  });

  it('should return empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should normalize lowercase letters before formatting', () => {
    expect(pipe.transform('abcdeabcde')).toBe('abcde-abcde');
  });

  it('should handle exactly 5 chars (single group, no dash)', () => {
    expect(pipe.transform('ABCDE')).toBe('ABCDE');
  });
});
