import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { GlobalMessageService } from '../message/global-message.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(GlobalMessageService);

    // 獲取 token
    const token = authService.getToken();

    // 如果有 token，加入到請求 header 中
    let authReq = req;
    if (token) {
        authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    }

    return next(authReq).pipe(
        catchError(error => {
            // 處理 401 未授權錯誤
            if (error.status === 401) {
                messageService.error('登入已過期，請重新登入', '認證失敗');
                authService.logout(false); // 不顯示登出消息
                router.navigate(['/login']);
            }

            // 處理 403 權限不足錯誤
            if (error.status === 403) {
                messageService.error('權限不足，無法執行此操作', '權限錯誤');
                router.navigate(['/unauthorized']);
            }

            return throwError(() => error);
        })
    );
};
