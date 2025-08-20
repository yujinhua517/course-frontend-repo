import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpErrorHandlerService {
  private readonly ERROR_CODES =
    {
      GENERAL_ERROR: -1,      //一般錯誤
      TIMEOUT_ERROR: -2,      //請求超時
      NETWORK_ERROR: -3,      //網路錯誤
      CANCELLED_ERROR: -4     //請求被取消
    } as const;
  /**
   * A) 回復型（推薦預設）：錯誤時回傳 fallback，不中斷資料流
   * 用法：catchError(this.httpErrorHandler.handleError<T>('操作名稱', fallback))
   */
  /**
   * 主要目的：
    1. 統一錯誤處理 - 提供一致的錯誤處理方式
    2. 資料流不中斷 - 錯誤時回傳fallback 值而非中斷 Observable
    3. 用戶友善 - 將 HTTP狀態碼轉換成中文錯誤訊息
 */
  handleError<T>(operation = 'operation', fallback: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      // 1. 建立錯誤訊息
      const message = this.buildMessage(error);
      // 2. 記錄錯誤
      this.logError(operation, error, message);
      // 3. 回傳 fallback 值，保持資料流
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
        code: error.status || this.ERROR_CODES.GENERAL_ERROR,
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
      case 400:
        return '請求參數錯誤，請檢查輸入資料';
      case 401:
        return '未授權訪問，請重新登入';
      case 403:
        return '權限不足，無法執行此操作';
      case 404:
        return '請求的資源不存在';
      case 409:
        return '資料衝突，請重新整理後再試';
      case 422:
        return '資料驗證失敗，請檢查輸入內容';
      case 429:
        return '請求過於頻繁，請稍後再試';
      case 500:
        return '伺服器內部錯誤，請聯繫系統管理員';
      case 502:
        return '伺服器暫時無法處理請求';
      case 503:
        return '服務暫時不可用，請稍後再試';
      case 504:
        return '請求超時，請重新嘗試';
      default:
        return `伺服器錯誤 (${error.status}): ${error.message}`;
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
   * 處理超時錯誤的快捷方法
   */
  timeoutError(operation: string): Observable<never> {
    return throwError(() => ({
      code: this.ERROR_CODES.TIMEOUT_ERROR,
      message: '請求超時，請稍後再試',
      operation
    }));
  }

  /**
   * 處理網路錯誤的快捷方法
   */
  networkError(operation: string): Observable<never> {
    return throwError(() => ({
      code: this.ERROR_CODES.NETWORK_ERROR,
      message: '網路連線錯誤，請檢查您的網路狀態',
      operation
    }));
  }
}