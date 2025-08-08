export interface User {
    readonly id: string;
    readonly username: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roles: readonly Role[];
    readonly permissions: readonly Permission[];
    readonly isActive: boolean;
    readonly lastLoginAt?: Date;
    readonly createdAt: Date;
}

export interface Role {
    readonly id: string;
    readonly name: RoleName;
    readonly description: string;
    readonly permissions: readonly Permission[];
}

export interface Permission {
    readonly id: string;
    readonly name: PermissionName;
    readonly resource: string;
    readonly action: string;
    readonly description: string;
}

export enum RoleName {
    // SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    USER = 'USER',
    SUPERVISOR = 'SUPERVISOR',
    // INSTRUCTOR = 'INSTRUCTOR',
    // EMPLOYEE = 'EMPLOYEE',
    // GUEST = 'GUEST'
}

export enum PermissionName {
    // User Management
    USER_CREATE = 'USER_CREATE',
    USER_READ = 'USER_READ',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',

    // Course Event Management  
    COURSE_EVENT_CREATE = 'COURSE_EVENT_CREATE',
    COURSE_EVENT_READ = 'COURSE_EVENT_READ',
    COURSE_EVENT_UPDATE = 'COURSE_EVENT_UPDATE',
    COURSE_EVENT_DELETE = 'COURSE_EVENT_DELETE',

    // Department Management
    DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
    DEPARTMENT_READ = 'DEPARTMENT_READ',
    DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
    DEPARTMENT_DELETE = 'DEPARTMENT_DELETE',

    // Employee Management
    EMPLOYEE_CREATE = 'EMPLOYEE_CREATE',
    EMPLOYEE_READ = 'EMPLOYEE_READ',
    EMPLOYEE_UPDATE = 'EMPLOYEE_UPDATE',
    EMPLOYEE_DELETE = 'EMPLOYEE_DELETE',

    // Competency Management (Legacy - 保留向後兼容)
    COMPETENCY_CREATE = 'COMPETENCY_CREATE',
    COMPETENCY_READ = 'COMPETENCY_READ',
    COMPETENCY_UPDATE = 'COMPETENCY_UPDATE',
    COMPETENCY_DELETE = 'COMPETENCY_DELETE',

    // Job Role Management (New)
    JOBROLE_CREATE = 'JOBROLE_CREATE',
    JOBROLE_READ = 'JOBROLE_READ',
    JOBROLE_UPDATE = 'JOBROLE_UPDATE',
    JOBROLE_DELETE = 'JOBROLE_DELETE',

    // System Administration
    SYSTEM_ADMIN = 'SYSTEM_ADMIN',
    SYSTEM_CONFIG = 'SYSTEM_CONFIG'
}

export interface AuthState {
    readonly user: User | null;
    readonly isAuthenticated: boolean;
    readonly isLoading: boolean;
    readonly error: string | null;
}
