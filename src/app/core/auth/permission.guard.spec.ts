import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionGuard, RoutePermissions } from './permission.guard';
import { UserStore } from './user.store';
import { GlobalMessageService } from '../message/global-message.service';
import { RoleName, PermissionName } from '../../models/user.model';

describe('PermissionGuard', () => {
    let guard: PermissionGuard;
    let userStore: jasmine.SpyObj<UserStore>;
    let router: jasmine.SpyObj<Router>;
    let messageService: jasmine.SpyObj<GlobalMessageService>;

    beforeEach(() => {
        const userStoreSpy = jasmine.createSpyObj('UserStore', [
            'isAuthenticated', 'hasAnyRole', 'hasAllRoles',
            'hasAnyPermission', 'hasAllPermissions'
        ]);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const messageServiceSpy = jasmine.createSpyObj('GlobalMessageService', ['info', 'error']);

        TestBed.configureTestingModule({
            providers: [
                PermissionGuard,
                { provide: UserStore, useValue: userStoreSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GlobalMessageService, useValue: messageServiceSpy }
            ]
        });

        guard = TestBed.inject(PermissionGuard);
        userStore = TestBed.inject(UserStore) as jasmine.SpyObj<UserStore>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        messageService = TestBed.inject(GlobalMessageService) as jasmine.SpyObj<GlobalMessageService>;
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });

    describe('canActivate', () => {
        let route: ActivatedRouteSnapshot;
        let state: RouterStateSnapshot;

        beforeEach(() => {
            route = new ActivatedRouteSnapshot();
            state = { url: '/test' } as RouterStateSnapshot;
        });

        it('should redirect to login if user is not authenticated', (done) => {
            userStore.isAuthenticated.and.returnValue(false);
            route.data = { roles: [RoleName.ADMIN] } as RoutePermissions;

            guard.canActivate(route, state).subscribe(result => {
                expect(result).toBeFalse();
                expect(messageService.info).toHaveBeenCalledWith('請先登入系統');
                expect(router.navigate).toHaveBeenCalledWith(['/login'], {
                    queryParams: { returnUrl: '/test' }
                });
                done();
            });
        });

        it('should allow access if user has required role', (done) => {
            userStore.isAuthenticated.and.returnValue(true);
            userStore.hasAnyRole.and.returnValue(true);
            route.data = { roles: [RoleName.ADMIN] } as RoutePermissions;

            guard.canActivate(route, state).subscribe(result => {
                expect(result).toBeTrue();
                expect(userStore.hasAnyRole).toHaveBeenCalledWith([RoleName.ADMIN]);
                done();
            });
        });

        it('should deny access if user lacks required role', (done) => {
            userStore.isAuthenticated.and.returnValue(true);
            userStore.hasAnyRole.and.returnValue(false);
            route.data = { roles: [RoleName.ADMIN] } as RoutePermissions;

            guard.canActivate(route, state).subscribe(result => {
                expect(result).toBeFalse();
                expect(messageService.error).toHaveBeenCalledWith('權限不足：您沒有所需的角色權限');
                expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
                done();
            });
        });

        it('should allow access if user has required permission', (done) => {
            userStore.isAuthenticated.and.returnValue(true);
            userStore.hasAnyPermission.and.returnValue(true);
            route.data = { permissions: [PermissionName.USER_CREATE] } as RoutePermissions;

            guard.canActivate(route, state).subscribe(result => {
                expect(result).toBeTrue();
                expect(userStore.hasAnyPermission).toHaveBeenCalledWith([PermissionName.USER_CREATE]);
                done();
            });
        });

        it('should check all roles when requireAll is true', (done) => {
            userStore.isAuthenticated.and.returnValue(true);
            userStore.hasAllRoles.and.returnValue(true);
            route.data = {
                roles: [RoleName.ADMIN, RoleName.MANAGER],
                requireAll: true
            } as RoutePermissions;

            guard.canActivate(route, state).subscribe(result => {
                expect(result).toBeTrue();
                expect(userStore.hasAllRoles).toHaveBeenCalledWith([RoleName.ADMIN, RoleName.MANAGER]);
                done();
            });
        });
    });
});
