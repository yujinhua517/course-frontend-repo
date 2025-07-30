import { Injectable, computed, signal } from '@angular/core';
import { User, AuthState, RoleName, PermissionName } from '../../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserStore {
    private readonly _authState = signal<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
    });

    readonly authState = this._authState.asReadonly();
    readonly user = computed(() => this._authState().user);
    readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
    readonly isLoading = computed(() => this._authState().isLoading);
    readonly error = computed(() => this._authState().error);

    readonly userRoles = computed(() => this.user()?.roles?.map(role => role.name) ?? []);
    readonly userPermissions = computed(() => this.user()?.permissions?.map(permission => permission.name) ?? []);

    setUser(user: User): void {
        this._authState.update(state => ({
            ...state,
            user,
            isAuthenticated: true,
            error: null
        }));
    }

    clearUser(): void {
        this._authState.update(state => ({
            ...state,
            user: null,
            isAuthenticated: false,
            error: null
        }));
    }

    setLoading(isLoading: boolean): void {
        this._authState.update(state => ({
            ...state,
            isLoading
        }));
    }

    setError(error: string): void {
        this._authState.update(state => ({
            ...state,
            error,
            isLoading: false
        }));
    }

    hasRole(role: RoleName): boolean {
        return this.userRoles().includes(role);
    }

    hasAnyRole(roles: readonly RoleName[]): boolean {
        const userRoles = this.userRoles();
        return roles.some(role => userRoles.includes(role));
    }

    hasAllRoles(roles: readonly RoleName[]): boolean {
        const userRoles = this.userRoles();
        return roles.every(role => userRoles.includes(role));
    }

    hasPermission(permission: PermissionName): boolean {
        return this.userPermissions().includes(permission);
    }

    hasAnyPermission(permissions: readonly PermissionName[]): boolean {
        const userPermissions = this.userPermissions();
        return permissions.some(permission => userPermissions.includes(permission));
    }

    hasAllPermissions(permissions: readonly PermissionName[]): boolean {
        const userPermissions = this.userPermissions();
        return permissions.every(permission => userPermissions.includes(permission));
    }
}