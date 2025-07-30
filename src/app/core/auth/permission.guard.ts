import { Injectable, inject } from '@angular/core';
import { CanActivate, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { UserStore } from './user.store';
import { AuthService } from './auth.service';
import { GlobalMessageService } from '../message/global-message.service';
import { RoleName, PermissionName } from '../../models/user.model';

export interface RoutePermissions {
    readonly roles?: readonly RoleName[];
    readonly permissions?: readonly PermissionName[];
    readonly requireAll?: boolean; // true = ALL roles/permissions required, false = ANY required
}

@Injectable({
    providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanLoad {
    private readonly userStore = inject(UserStore);
    private readonly router = inject(Router);
    private readonly messageService = inject(GlobalMessageService);
    private readonly authService = inject(AuthService);

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.checkPermissions(route.data as RoutePermissions, state.url);
    }

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
        const url = segments.map(segment => segment.path).join('/');
        return this.checkPermissions(route.data as RoutePermissions, url);
    }

    private checkPermissions(permissions: RoutePermissions, url: string): Observable<boolean> {
        // 使用 AuthService 的 isAuthenticated() 方法，它包含了自動恢復邏輯
        if (!this.authService.isAuthenticated()) {
            this.redirectToLogin(url);
            return of(false);
        }

        const { roles, permissions: requiredPermissions, requireAll = false } = permissions;

        // 如果只是需要認證但沒有特定角色或權限要求，直接允許
        if ((!roles || roles.length === 0) && (!requiredPermissions || requiredPermissions.length === 0)) {
            return of(true);
        }

        // Check roles if specified
        if (roles && roles.length > 0) {
            const hasRoleAccess = requireAll
                ? this.userStore.hasAllRoles(roles)
                : this.userStore.hasAnyRole(roles);

            if (!hasRoleAccess) {
                this.handleAccessDenied('權限不足：您沒有所需的角色權限');
                return of(false);
            }
        }

        // Check permissions if specified
        if (requiredPermissions && requiredPermissions.length > 0) {
            const hasPermissionAccess = requireAll
                ? this.userStore.hasAllPermissions(requiredPermissions)
                : this.userStore.hasAnyPermission(requiredPermissions);

            if (!hasPermissionAccess) {
                this.handleAccessDenied('權限不足：您沒有所需的操作權限');
                return of(false);
            }
        }

        return of(true);
    }

    private redirectToLogin(returnUrl: string): void {
        this.messageService.info('請先登入系統');
        this.router.navigate(['/login'], {
            queryParams: { returnUrl }
        });
    }

    private handleAccessDenied(message: string): void {
        this.messageService.error(message);
        this.router.navigate(['/unauthorized']);
    }
}
