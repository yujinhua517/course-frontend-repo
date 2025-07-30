import { TestBed } from '@angular/core/testing';
import { UserStore } from './user.store';
import { RoleName, PermissionName, User } from '../../models/user.model';

describe('UserStore', () => {
    let store: UserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        store = TestBed.inject(UserStore);
    });

    it('should be created', () => {
        expect(store).toBeTruthy();
    });

    it('should have initial state', () => {
        const authState = store.authState();

        expect(authState.user).toBeNull();
        expect(authState.isAuthenticated).toBeFalse();
        expect(authState.isLoading).toBeFalse();
        expect(authState.error).toBeNull();
    });

    it('should set user and update authentication state', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [{
                id: '1',
                name: RoleName.ADMIN,
                description: 'Admin role',
                permissions: []
            }],
            permissions: [{
                id: '1',
                name: PermissionName.USER_READ,
                resource: 'user',
                action: 'read',
                description: 'Read users'
            }],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);

        expect(store.user()).toEqual(mockUser);
        expect(store.isAuthenticated()).toBeTrue();
        expect(store.error()).toBeNull();
    });

    it('should clear user and reset authentication state', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [],
            permissions: [],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);
        expect(store.isAuthenticated()).toBeTrue();

        store.clearUser();
        expect(store.user()).toBeNull();
        expect(store.isAuthenticated()).toBeFalse();
        expect(store.error()).toBeNull();
    });

    it('should check role correctly', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [{
                id: '1',
                name: RoleName.ADMIN,
                description: 'Admin role',
                permissions: []
            }],
            permissions: [],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);

        expect(store.hasRole(RoleName.ADMIN)).toBeTrue();
        expect(store.hasRole(RoleName.EMPLOYEE)).toBeFalse();
    });

    it('should check any role correctly', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [{
                id: '1',
                name: RoleName.MANAGER,
                description: 'Manager role',
                permissions: []
            }],
            permissions: [],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);

        expect(store.hasAnyRole([RoleName.ADMIN, RoleName.MANAGER])).toBeTrue();
        expect(store.hasAnyRole([RoleName.ADMIN, RoleName.EMPLOYEE])).toBeFalse();
    });

    it('should check all roles correctly', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [
                {
                    id: '1',
                    name: RoleName.ADMIN,
                    description: 'Admin role',
                    permissions: []
                },
                {
                    id: '2',
                    name: RoleName.MANAGER,
                    description: 'Manager role',
                    permissions: []
                }
            ],
            permissions: [],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);

        expect(store.hasAllRoles([RoleName.ADMIN, RoleName.MANAGER])).toBeTrue();
        expect(store.hasAllRoles([RoleName.ADMIN, RoleName.EMPLOYEE])).toBeFalse();
    });

    it('should check permission correctly', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [],
            permissions: [{
                id: '1',
                name: PermissionName.USER_READ,
                resource: 'user',
                action: 'read',
                description: 'Read users'
            }],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);

        expect(store.hasPermission(PermissionName.USER_READ)).toBeTrue();
        expect(store.hasPermission(PermissionName.USER_CREATE)).toBeFalse();
    });

    it('should check any permission correctly', () => {
        const mockUser: User = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: [],
            permissions: [{
                id: '1',
                name: PermissionName.USER_UPDATE,
                resource: 'user',
                action: 'update',
                description: 'Update users'
            }],
            isActive: true,
            createdAt: new Date()
        };

        store.setUser(mockUser);

        expect(store.hasAnyPermission([PermissionName.USER_READ, PermissionName.USER_UPDATE])).toBeTrue();
        expect(store.hasAnyPermission([PermissionName.USER_CREATE, PermissionName.USER_DELETE])).toBeFalse();
    });

    it('should set loading state', () => {
        store.setLoading(true);
        expect(store.isLoading()).toBeTrue();

        store.setLoading(false);
        expect(store.isLoading()).toBeFalse();
    });

    it('should set error state', () => {
        const errorMessage = 'Authentication failed';

        store.setError(errorMessage);
        expect(store.error()).toBe(errorMessage);
        expect(store.isLoading()).toBeFalse();
    });

    it('should return empty arrays for roles and permissions when no user', () => {
        expect(store.userRoles()).toEqual([]);
        expect(store.userPermissions()).toEqual([]);
    });
});
