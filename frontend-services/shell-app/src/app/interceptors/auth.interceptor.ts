import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 🔹 Skip auth endpoints (login/signup)
  if (req.url.includes('/auth/login') || req.url.includes('/auth/signup')) {
    return next(req);
  }

  // Get token directly from localStorage to avoid DI issues
  const token = localStorage.getItem('token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
