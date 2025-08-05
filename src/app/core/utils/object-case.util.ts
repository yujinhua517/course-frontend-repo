/**
 * 物件大小寫轉換工具
 * 統一處理前端 camelCase 與後端 snake_case 之間的轉換
 */

/**
 * 將 snake_case 字串轉換為 camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 將 camelCase 字串轉換為 snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 將物件的所有 key 從 snake_case 轉換為 camelCase
 */
export function keysToCamelCase<T = any>(obj: any, depth = 0): T {
  // 防止過深遞歸
  if (depth > 10) {
    console.warn('keysToCamelCase: 遞歸層級過深，停止轉換');
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item, depth + 1)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const camelObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = snakeToCamel(key);
        camelObj[camelKey] = keysToCamelCase(obj[key], depth + 1);
      }
    }
    return camelObj as T;
  }

  return obj;
}

/**
 * 將物件的所有 key 從 camelCase 轉換為 snake_case
 */
export function keysToSnakeCase<T = any>(obj: any, depth = 0): T {
  // 防止過深遞歸
  if (depth > 10) {
    console.warn('keysToSnakeCase: 遞歸層級過深，停止轉換');
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToSnakeCase(item, depth + 1)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const snakeObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = camelToSnake(key);
        snakeObj[snakeKey] = keysToSnakeCase(obj[key], depth + 1);
      }
    }
    return snakeObj as T;
  }

  return obj;
}

/**
 * API Response 轉換器
 * 將後端回傳的 snake_case 格式轉換為前端的 camelCase 格式
 */
export class ApiResponseTransformer {
  static transformResponse<T>(response: any): T {
    return keysToCamelCase<T>(response);
  }

  static transformRequest<T>(request: any): T {
    return keysToSnakeCase<T>(request);
  }
}
