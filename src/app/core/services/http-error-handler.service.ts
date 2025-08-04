import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/**
 * 全域 HTTP 錯誤處理服務
 * 統一處理所有 HTTP 請求的錯誤回應
 */
@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerService {

  /**
   * 處理 HTTP 錯誤
   */
  handleError = (operation = 'operation', result?: any) => {
    return (error: HttpErrorResponse): Observable<any> => {
      console.error(`${operation} failed:`, error);

      // 根據錯誤狀態碼進行不同處理
      let errorMessage = '';
      
      if (error.error instanceof ErrorEvent) {
        // 客戶端錯誤
        errorMessage = `客戶端錯誤: ${error.error.message}`;
      } else {
        // 伺服器端錯誤
        switch (error.status) {
          case 400:
            errorMessage = '請求參數錯誤';
            break;
          case 401:
            errorMessage = '未授權，請重新登入';
            break;
          case 403:
            errorMessage = '權限不足';
            break;
          case 404:
            errorMessage = '請求的資源不存在';
            break;
          case 500:
            errorMessage = '伺服器內部錯誤';
            break;
          default:
            errorMessage = `伺服器錯誤 (${error.status}): ${error.message}`;
        }
      }

      // 記錄錯誤到控制台 (可以擴展為發送到日誌系統)
      this.logError(operation, error, errorMessage);

      // 回傳使用者友善的錯誤訊息
      return throwError(() => ({
        code: error.status || -1,
        message: errorMessage,
        originalError: error
      }));
    };
  };

  /**
   * 記錄錯誤到控制台或日誌系統
   */
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
