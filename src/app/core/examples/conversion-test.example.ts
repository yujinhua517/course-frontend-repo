/**
 * 測試轉換工具的功能
 */

import { keysToSnakeCase, keysToCamelCase } from '../utils/object-case.util';

// 測試資料
const camelCaseData = {
    firstIndexInPage: 1,
    lastIndexInPage: 10,
    sortColumn: 'jobRoleCode',
    sortDirection: 'asc',
    isActive: true,
    jobRoleId: 123
};

const snakeCaseData = {
    first_index_in_page: 1,
    last_index_in_page: 10,
    sort_column: 'job_role_code',
    sort_direction: 'asc',
    is_active: true,
    job_role_id: 123
};

console.log('=== 轉換測試 ===');
console.log('原始 camelCase:', camelCaseData);
console.log('轉換為 snake_case:', keysToSnakeCase(camelCaseData));
console.log('');
console.log('原始 snake_case:', snakeCaseData);
console.log('轉換為 camelCase:', keysToCamelCase(snakeCaseData));

/**
 * 預期結果：
 * 
 * 轉換為 snake_case:
 * {
 *   first_index_in_page: 1,
 *   last_index_in_page: 10,
 *   sort_column: 'jobRoleCode', // 注意：這裡的值不會被轉換，只有 key 會轉換
 *   sort_direction: 'asc',
 *   is_active: true,
 *   job_role_id: 123
 * }
 * 
 * 轉換為 camelCase:
 * {
 *   firstIndexInPage: 1,
 *   lastIndexInPage: 10,
 *   sortColumn: 'job_role_code', // 注意：這裡的值不會被轉換，只有 key 會轉換
 *   sortDirection: 'asc',
 *   isActive: true,
 *   jobRoleId: 123
 * }
 */
