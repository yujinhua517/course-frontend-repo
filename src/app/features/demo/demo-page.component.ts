import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../core/auth/user.store';
import { GlobalMessageService } from '../../core/message/global-message.service';
import { RoleName, PermissionName } from '../../models/user.model';
import { MessageType } from '../../models/message.model';

@Component({
    selector: 'app-demo-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './demo-page.component.html',
    styleUrls: ['./demo-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemoPageComponent {
    private readonly userStore = inject(UserStore);
    private readonly messageService = inject(GlobalMessageService);

    readonly user = this.userStore.user;
    readonly isAuthenticated = this.userStore.isAuthenticated;
    readonly userRoles = this.userStore.userRoles;
    readonly userPermissions = this.userStore.userPermissions;
    readonly isLoading = this.userStore.isLoading;

    readonly RoleName = RoleName;
    readonly PermissionName = PermissionName;

    // loadMockUser(): void {
    //     this.userStore.loadMockUser();
    //     this.messageService.info('正在載入模擬用戶...', '系統');
    // }

    logout(): void {
        this.userStore.clearUser();
        this.messageService.success('已成功登出', '登出');
    }

    showSuccessMessage(): void {
        this.messageService.success('操作成功完成！', '成功');
    }

    showInfoMessage(): void {
        this.messageService.info('這是一條信息消息', '提示');
    }

    showWarningMessage(): void {
        this.messageService.warning('請注意此操作可能有風險', '警告');
    }

    showErrorMessage(): void {
        this.messageService.error('發生了錯誤，請稍後再試', '錯誤');
    }

    showCustomMessage(): void {
        this.messageService.success('操作完成！您可以查看結果或繼續其他操作。', '操作成功', {
            timeout: 0, // 不自動消失
            actions: [
                {
                    label: '查看結果',
                    action: () => {
                        this.messageService.info('正在跳轉到結果頁面...', '導航');
                    },
                    style: 'primary'
                },
                {
                    label: '繼續操作',
                    action: () => {
                        this.messageService.info('準備執行下一個操作...', '提示');
                    },
                    style: 'secondary'
                }
            ]
        });
    }

    dismissAllMessages(): void {
        this.messageService.dismissAll();
    }

    dismissErrorMessages(): void {
        this.messageService.dismissByType(MessageType.ERROR);
    }

    hasRole(role: RoleName): boolean {
        return this.userStore.hasRole(role);
    }

    hasPermission(permission: PermissionName): boolean {
        return this.userStore.hasPermission(permission);
    }

    hasAnyRole(roles: RoleName[]): boolean {
        return this.userStore.hasAnyRole(roles);
    }

    hasAnyPermission(permissions: PermissionName[]): boolean {
        return this.userStore.hasAnyPermission(permissions);
    }
}
