// import { inject, Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { User, RoleName, PermissionName } from '../../../models/user.model';

// export interface LoginRequest {
//   username: string;
//   password: string;
// }

// export interface LoginResponse {
//   user: User;
//   token?: string;
//   refreshToken?: string;
// }

// // 後端 API 回應格式
// interface BackendAuthResponse {
//   code: number;
//   message: string;
//   data: {
//     access_token: string;
//     token_type: string;
//     expires_in: number;
//     user_id: number;
//     username: string;
//     role: string;
//     last_login_time: string;
//   };
// }

// @Injectable({ providedIn: 'root' })
// export class LoginService {
//   private readonly http = inject(HttpClient);
//   private readonly useMockData = true; // 設定為 false 時使用真實 API

//   login(username: string, password: string): Observable<LoginResponse> {
//     // --- mock start ---
//     // 原本API呼叫註解如下：
//     // const loginRequest: LoginRequest = { username, password };
//     // return this.http.post<BackendAuthResponse>('/api/auth/login', loginRequest).pipe(
//     //   map(response => { ... })
//     // );

//     // mock admin
//     if (username === 'admin') {
//       const permissions = Object.values(PermissionName).map((name, idx) => ({
//         id: (idx + 1).toString(),
//         name,
//         resource: name.split('_')[0].toLowerCase(),
//         action: name.split('_')[1]?.toLowerCase() || 'all',
//         description: name.replace(/_/g, ' ').toLowerCase()
//       }));
//       const roles = [{
//         id: '1',
//         name: RoleName.ADMIN,
//         description: 'Administrator',
//         permissions
//       }];
//       const user: User = {
//         id: '1',
//         username: 'admin',
//         email: 'admin@example.com',
//         firstName: 'Super',
//         lastName: 'Admin',
//         roles,
//         permissions,
//         isActive: true,
//         lastLoginAt: new Date(),
//         createdAt: new Date()
//       };
//       return new Observable<LoginResponse>(observer => {
//         setTimeout(() => {
//           observer.next({ user, token: 'mock-token-admin', refreshToken: undefined });
//           observer.complete();
//         }, 300);
//       });
//     }
//     // mock 一般員工
//     const permissions = [
//       {
//         id: '1',
//         name: PermissionName.COURSE_READ,
//         resource: 'course',
//         action: 'read',
//         description: 'course read'
//       },
//       {
//         id: '2',
//         name: PermissionName.COMPETENCY_READ,
//         resource: 'competency',
//         action: 'read',
//         description: 'competency read'
//       },
//       {
//         id: '3',
//         name: PermissionName.EMPLOYEE_READ,
//         resource: 'employee',
//         action: 'read',
//         description: 'employee read'
//       },
//       {
//         id: '4',
//         name: PermissionName.DEPARTMENT_READ,
//         resource: 'department',
//         action: 'read',
//         description: 'department read'
//       },
//       {
//         id: '5',
//         name: PermissionName.USER_READ,
//         resource: 'user',
//         action: 'read',
//         description: 'user read'
//       }
//     ];
//     const roles = [{
//       id: '2',
//       name: RoleName.EMPLOYEE,
//       description: 'Employee',
//       permissions
//     }];
//     const user: User = {
//       id: '2',
//       username,
//       email: `${username}@example.com`,
//       firstName: 'Normal',
//       lastName: 'User',
//       roles,
//       permissions,
//       isActive: true,
//       lastLoginAt: new Date(),
//       createdAt: new Date()
//     };
//     return new Observable<LoginResponse>(observer => {
//       setTimeout(() => {
//         observer.next({ user, token: 'mock-token-employee', refreshToken: undefined });
//         observer.complete();
//       }, 300);
//     });
//     // --- mock end ---
//   }
// }

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, RoleName, PermissionName } from '../../../models/user.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

// 後端 API 回應格式
interface BackendAuthResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user_id: number;
    username: string;
    role: string;
    last_login_time: string; // ISO 8601 date string
  };
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly useMockData = false; // 設定為 false 時使用真實 API

  login(username: string, password: string): Observable<LoginResponse> {
    if (this.useMockData) {
      return this.getMockLoginResponse(username, password);
    }


    //
    // 原本API呼叫註解如下：
    // const loginRequest: LoginRequest = { username, password };
    // return this.http.post<BackendAuthResponse>('/api/auth/login', loginRequest).pipe(
    //   map(response => { ... })
    // );

    // 真實 API 呼叫
    const loginRequest: LoginRequest = { username, password };
    return this.http.post<BackendAuthResponse>('/api/auth/login', loginRequest).pipe(
      map(response => {
        // 檢查後端回應是否成功
        if (response.code !== 1000) {
          throw new Error(response.message || 'Login failed');
        }

        // 將後端回應轉換為前端格式
        const { data } = response;

        // 根據角色設定權限（這裡需要根據實際業務邏輯調整）
        const permissions = this.mapRoleToPermissions(data.role);
        const roles = [{
          id: '1',
          name: data.role as RoleName,
          description: data.role,
          permissions
        }];

        const user: User = {
          id: data.user_id.toString(),
          username: data.username,
          email: `${data.username}@example.com`, // 如果後端沒有提供 email，使用預設格式
          firstName: 'User', // 如果後端沒有提供姓名，使用預設值
          lastName: 'Name', // 如果後端沒有提供姓名，使用預設值
          roles,
          permissions,
          isActive: true,
          lastLoginAt: new Date(data.last_login_time),
          createdAt: new Date() // 建立時間使用當前時間，如果後端有提供可以替換
        };

        return {
          user,
          token: data.access_token,
          refreshToken: undefined // 如果後端有提供 refresh token 可以加入
        };
      })
    );
  }

  private getMockLoginResponse(username: string, password: string): Observable<LoginResponse> {
    // mock admin
    if (username === 'admin') {
      const permissions = Object.values(PermissionName).map((name, idx) => ({
        id: (idx + 1).toString(),
        name,
        resource: name.split('_')[0].toLowerCase(),
        action: name.split('_')[1]?.toLowerCase() || 'all',
        description: name.replace(/_/g, ' ').toLowerCase()
      }));
      const roles = [{
        id: '1',
        name: RoleName.ADMIN,
        description: 'Administrator',
        permissions
      }];
      const user: User = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        roles,
        permissions,
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date()
      };
      return new Observable<LoginResponse>(observer => {
        setTimeout(() => {
          observer.next({ user, token: 'mock-token-admin', refreshToken: undefined });
          observer.complete();
        }, 300);
      });
    }

    // mock 一般員工
    const permissions = [
      {
        id: '1',
        name: PermissionName.COURSE_READ,
        resource: 'course',
        action: 'read',
        description: 'course read'
      },
      {
        id: '2',
        name: PermissionName.COMPETENCY_READ,
        resource: 'competency',
        action: 'read',
        description: 'competency read'
      },
      {
        id: '3',
        name: PermissionName.EMPLOYEE_READ,
        resource: 'employee',
        action: 'read',
        description: 'employee read'
      },
      {
        id: '4',
        name: PermissionName.DEPARTMENT_READ,
        resource: 'department',
        action: 'read',
        description: 'department read'
      },
      {
        id: '5',
        name: PermissionName.USER_READ,
        resource: 'user',
        action: 'read',
        description: 'user read'
      }
    ];
    const roles = [{
      id: '2',
      name: RoleName.EMPLOYEE,
      description: 'Employee',
      permissions
    }];
    const user: User = {
      id: '2',
      username,
      email: `${username}@example.com`,
      firstName: 'Normal',
      lastName: 'User',
      roles,
      permissions,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date()
    };
    return new Observable<LoginResponse>(observer => {
      setTimeout(() => {
        observer.next({ user, token: 'mock-token-employee', refreshToken: undefined });
        observer.complete();
      }, 300);
    });
  }

  private mapRoleToPermissions(role: string): Array<{ id: string, name: PermissionName, resource: string, action: string, description: string }> {
    // 根據角色對應權限的邏輯
    if (role === 'ADMIN') {
      // 管理員擁有所有權限
      return Object.values(PermissionName).map((name, idx) => ({
        id: (idx + 1).toString(),
        name,
        resource: name.split('_')[0].toLowerCase(),
        action: name.split('_')[1]?.toLowerCase() || 'all',
        description: name.replace(/_/g, ' ').toLowerCase()
      }));
    } else if (role === 'EMPLOYEE') {
      // 一般員工只有讀取權限
      return [
        {
          id: '1',
          name: PermissionName.COURSE_READ,
          resource: 'course',
          action: 'read',
          description: 'course read'
        },
        {
          id: '2',
          name: PermissionName.COMPETENCY_READ,
          resource: 'competency',
          action: 'read',
          description: 'competency read'
        },
        {
          id: '3',
          name: PermissionName.EMPLOYEE_READ,
          resource: 'employee',
          action: 'read',
          description: 'employee read'
        },
        {
          id: '4',
          name: PermissionName.DEPARTMENT_READ,
          resource: 'department',
          action: 'read',
          description: 'department read'
        },
        {
          id: '5',
          name: PermissionName.USER_READ,
          resource: 'user',
          action: 'read',
          description: 'user read'
        }
      ];
    }

    // 預設情況返回空陣列
    return [];
  }
}
