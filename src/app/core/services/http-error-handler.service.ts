import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpErrorHandlerService {
  /**
   * A) 回復型（推薦預設）：錯誤時回傳 fallback，不中斷資料流
   * 用法：catchError(this.httpErrorHandler.handleError<T>('操作名稱', fallback))
   */
  handleError<T>(operation = 'operation', fallback: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      const message = this.buildMessage(error);
      this.logError(operation, error, message);
      return of(fallback);
    };
  }

  /**
   * B) 拋錯型（必要時用）：錯誤時拋出統一錯誤物件
   * 用法：catchError(this.httpErrorHandler.handleErrorRethrow('操作名稱'))
   */
  handleErrorRethrow(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      const message = this.buildMessage(error);
      this.logError(operation, error, message);
      return throwError(() => ({
        code: error.status || -1,
        message,
        originalError: error,
        operation,
      }));
    };
  }

  // ========== 私有工具 ==========
  private buildMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `客戶端錯誤: ${error.error.message}`;
    }
    switch (error.status) {
      case 400: return '請求參數錯誤';
      case 401: return '未授權，請重新登入';
      case 403: return '權限不足';
      case 404: return '請求的資源不存在';
      case 500: return '伺服器內部錯誤';
      default: return `伺服器錯誤 (${error.status}): ${error.message}`;
    }
  }

  private logError(operation: string, error: HttpErrorResponse, message: string): void {
    console.group(`🚨 HTTP Error - ${operation}`);
    console.error('狀態:', error.status);
    console.error('訊息:', message);
    console.error('詳細:', error);
    console.groupEnd();
  }

  /**
   * 處理網路錯誤的快捷方法
   */
  networkError(operation: string): Observable<never> {
    return throwError(() => ({
      code: -1,
      message: '網路連線錯誤，請檢查您的網路狀態',
      operation
    }));
  }

  /**
   * 處理超時錯誤的快捷方法
   */
  timeoutError(operation: string): Observable<never> {
    return throwError(() => ({
      code: -2,
      message: '請求超時，請稍後再試',
      operation
    }));
  }
}