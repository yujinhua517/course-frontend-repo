import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationError, Event } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { UserStore } from '../../../core/auth/user.store';
import { AuthService } from '../../../core/auth/auth.service';
import { GlobalMessageService } from '../../../core/message/global-message.service';

@Component({
    selector: 'app-main-page',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterModule],
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPageComponent {
    private readonly router = inject(Router);
    private readonly userStore = inject(UserStore);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(GlobalMessageService);

    dropdownOpen = false;
    readonly sidebarOpen = signal(false);
    isIconOnly = false;
    showNotificationDropdown = false;
    showMessageTooltip = false;
    readonly pendingRoute = signal('');

    // 用戶相關 signals
    readonly user = this.userStore.user;
    readonly isAuthenticated = this.userStore.isAuthenticated;

    constructor() {
        // 檢查儲存的認證狀態
        // this.authService.checkStoredAuth();

        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                //console.log.log('[Router] NavigationStart:', event.url);
            }
            if (event instanceof NavigationEnd) {
                //console.log.log('[Router] NavigationEnd:', event.url);
            }
            if (event instanceof NavigationError) {
                //console.log.error('[Router] NavigationError:', event.error);
            }
        });
    }

    onLogout(): void {
        this.dropdownOpen = false;
        this.authService.logout();
    }

    onProfileClick(): void {
        this.dropdownOpen = false;
        this.messageService.info('個人設定功能開發中...', '提示');
    }

    getUserDisplayName(): string {
        const currentUser = this.user();
        if (!currentUser) return '訪客';

        return currentUser.username || '用戶';
    }

    getUserRole(): string {
        const currentUser = this.user();
        if (!currentUser || !currentUser.roles || currentUser.roles.length === 0) {
            return '訪客';
        }

        // 返回第一個角色的名稱
        const roleNames = {
            'SUPER_ADMIN': '超級管理員',
            'ADMIN': '管理員',
            'MANAGER': '經理',
            'INSTRUCTOR': '講師',
            'EMPLOYEE': '員工',
            'GUEST': '訪客'
        };

        const roleName = currentUser.roles[0].name;
        return roleNames[roleName as keyof typeof roleNames] || roleName;
    }

    debugSidebarClick(route: string): void {
        // let route = '';
        // if (msg.includes('首頁')) route = '/home';
        // else if (msg.includes('部門資料')) route = '/department';
        // else if (msg.includes('設定')) route = '/settings';
        // console.log(`${msg}，即將跳轉到: ${route}`);
        this.pendingRoute.set(route);
    }
}
