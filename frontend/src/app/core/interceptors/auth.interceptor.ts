import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor — เตรียมไว้สำหรับระบบ Authentication ในอนาคต
 *
 * TODO: เมื่อมี Auth ให้ทำสิ่งต่อไปนี้:
 *  1. inject AuthService
 *  2. อ่าน token จาก AuthService (หรือ localStorage)
 *  3. clone request แล้วใส่ Authorization header
 *  4. จัดการ 401 → redirect ไปหน้า login หรือ refresh token
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // const authService = inject(AuthService);
  // const token = authService.getToken();

  // if (token) {
  //   const authReq = req.clone({
  //     setHeaders: { Authorization: `Bearer ${token}` },
  //   });
  //   return next(authReq);
  // }

  return next(req);
};
