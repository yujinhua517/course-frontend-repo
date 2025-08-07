import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserStore } from './user.store';
import { GlobalMessageService } from '../message/global-message.service';
import { LoginService, LoginResponse } from '../../features/login/services/login.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly userStore = inject(UserStore);
    private readonly router = inject(Router);
    private readonly messageService = inject(GlobalMessageService);
    private readonly loginService = inject(LoginService);

    // App 啟動時自動還原 user 狀態
    constructor() {
        this.restoreUserFromStorage();
    }

    private restoreUserFromStorage(): void {
        // 使用 sessionStorage 替代 localStorage，頁面關閉後自動清除
        const token = sessionStorage.getItem('auth-token');
        const userStr = sessionStorage.getItem('current-user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);

                // 檢查用戶對象是否有效
                if (!user || !user.id || !user.username) {
                    throw new Error('Invalid user data structure');
                }

                // roles/permissions 欄位強制為陣列
                user.roles = Array.isArray(user.roles) ? user.roles : [];
                user.permissions = Array.isArray(user.permissions) ? user.permissions : [];

                // 只有在 UserStore 還沒設定用戶時才恢復
                if (!this.userStore.isAuthenticated()) {
                    this.userStore.setUser(user);
                    //console.log('已從 sessionStorage 恢復用戶狀態:', user.username);
                }
            } catch (error) {
                // 若解析失敗則清除所有相關資料
                console.error('恢復用戶狀態失敗:', error);
                sessionStorage.removeItem('current-user');
                sessionStorage.removeItem('auth-token');
                sessionStorage.removeItem('refresh-token');
                sessionStorage.removeItem('current-username');
            }
        }
    }

    login(username: string, password: string, returnUrl: string = '/'): Observable<LoginResponse> {
        this.userStore.setLoading(true);

        // 直接呼叫後端 API 取得 JWT token
        return this.loginService.login(username, password).pipe(
            tap({
                next: (response) => {
                    // 儲存 token
                    if (response.token) {
                        sessionStorage.setItem('auth-token', response.token);
                    }
                    if (response.refreshToken) {
                        sessionStorage.setItem('refresh-token', response.refreshToken);
                    }
                    // 記錄當前登入的用戶名
                    if (response.user?.username) {
                        sessionStorage.setItem('current-username', response.user.username);
                    }
                    // 儲存完整 user 物件，roles/permissions 欄位強制為陣列
                    if (response.user) {
                        // 確保用戶對象有效且有必要的欄位
                        if (!response.user.id || !response.user.username) {
                            throw new Error('Invalid user data: missing required fields');
                        }

                        const user = {
                            ...response.user,
                            roles: Array.isArray(response.user.roles) ? response.user.roles : [],
                            permissions: Array.isArray(response.user.permissions) ? response.user.permissions : []
                        };
                        sessionStorage.setItem('current-user', JSON.stringify(user));
                        this.userStore.setUser(user);
                    }
                    // 顯示歡迎消息
                    this.messageService.success(
                        `歡迎回來，${response.user?.firstName || response.user?.username || username}！`,
                        '登入成功'
                    );
                    this.userStore.setLoading(false);
                },
                error: (error) => {
                    this.userStore.setError(error.message || '登入失敗');
                    this.messageService.error(error.message || '登入失敗，請檢查帳號密碼', '登入失敗');
                }
            })
        );
    }

    logout(showMessage: boolean = true): void {
        try {
            // 清除會話儲存的 tokens
            sessionStorage.removeItem('auth-token');
            sessionStorage.removeItem('refresh-token');
            sessionStorage.removeItem('current-username');
            sessionStorage.removeItem('current-user');

            // 清除用戶狀態
            this.userStore.clearUser();

            if (showMessage) {
                this.messageService.info('您已成功登出', '登出');
            }

            // 重定向到登入頁
            this.router.navigate(['/login']);

        } catch (error) {
            console.error('登出時發生錯誤:', error);
            this.messageService.error('登出時發生錯誤', '錯誤');
        }
    }

    // 檢查 token 是否存在（用於應用啟動時檢查）
    // checkStoredAuth(): void {
    //     const token = sessionStorage.getItem('auth-token');
    //     const username = sessionStorage.getItem('current-username');

    //     if (token && username) {
    //         // 由於我們沒有 /api/auth/me endpoint，暫時跳過自動登入
    //         // 用戶需要重新登入以取得完整資料
    //         console.log('找到存儲的認證令牌，但需要重新登入以取得用戶資料');
    //     }
    // }

    // 獲取當前 token
    getToken(): string | null {
        return sessionStorage.getItem('auth-token');
    }

    // 檢查是否已認證
    isAuthenticated(): boolean {
        // 首先檢查 UserStore 的狀態
        if (this.userStore.isAuthenticated() && this.getToken()) {
            return true;
        }

        // 如果 UserStore 狀態不正確，但 sessionStorage 中有有效的 token 和用戶資料
        // 嘗試恢復狀態
        const token = this.getToken();
        const userStr = sessionStorage.getItem('current-user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);

                // 檢查用戶對象是否有效
                if (!user || !user.id || !user.username) {
                    throw new Error('Invalid user data structure');
                }

                // 確保 roles/permissions 是陣列
                user.roles = Array.isArray(user.roles) ? user.roles : [];
                user.permissions = Array.isArray(user.permissions) ? user.permissions : [];
                this.userStore.setUser(user);
                return true;
            } catch (error) {
                // 解析失敗，清除無效資料
                console.error('用戶狀態驗證失敗:', error);
                this.logout(false);
                return false;
            }
        }

        return false;
    }
}
