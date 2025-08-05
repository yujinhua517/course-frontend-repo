import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { keysToSnakeCase, keysToCamelCase } from '../utils/object-case.util';
import { environment } from '../../../environments/environment';

/**
 * HTTP 攔截器：自動處理前後端資料格式轉換
 * 
 * 功能：
 * 1. 出站請求：將 camelCase 轉換為 snake_case
 * 2. 入站回應：將 snake_case 轉換為 camelCase
 */
export function caseConversionInterceptor(request: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  // 1. 處理出站請求：將請求 body 從 camelCase 轉換為 snake_case
  let modifiedRequest = request;

  if (request.body && shouldConvertRequest(request)) {
    const convertedBody = keysToSnakeCase(request.body);
    modifiedRequest = request.clone({
      body: convertedBody,
      headers: request.headers.set('X-Case-Converted', 'true')
    });

    // 僅在開發環境中記錄轉換日誌
    // if (!environment.production && request.url.includes('/auth/login')) {
    //   console.log('🔄 登入請求轉換:', {
    //     URL: request.url,
    //     原始: request.body,
    //     轉換後: convertedBody
    //   });
    // }
  }

  // 2. 處理入站回應：將回應 body 從 snake_case 轉換為 camelCase
  return next(modifiedRequest).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body && shouldConvertResponse(event)) {
        const convertedBody = keysToCamelCase(event.body);

        // // 僅在開發環境中記錄轉換日誌
        // if (!environment.production && event.url?.includes('/auth/login')) {
        //   console.log('🔄 登入回應轉換:', {
        //     URL: event.url,
        //     原始: event.body,
        //     轉換後: convertedBody
        //   });
        // }

        return event.clone({
          body: convertedBody,
          headers: event.headers.set('X-Response-Converted', 'true')
        });
      }
      return event;
    })
  );
}

/**
 * 判斷是否需要轉換請求
 */
function shouldConvertRequest(request: HttpRequest<any>): boolean {
  // 只對 API 請求進行轉換，並且避免重複轉換
  const apiPaths = ['/api/', '/job-roles', '/departments', '/employees'];
  const shouldConvert = apiPaths.some(path => request.url.includes(path));

  // 檢查請求是否已經被轉換過
  const alreadyConverted = request.headers.has('X-Case-Converted');

  return shouldConvert && !alreadyConverted;
}

/**
 * 判斷是否需要轉換回應
 */
function shouldConvertResponse(response: HttpResponse<any>): boolean {
  // 只對 JSON 回應進行轉換
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json') ?? false;

  // 檢查回應是否已經被轉換過
  const alreadyConverted = response.headers.has('X-Response-Converted');

  return isJson && !alreadyConverted;
}
