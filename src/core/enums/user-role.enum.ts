/**
 * USER ROLE ENUM
 * Roles disponibles en el sistema de asistencia
 */

export enum UserRole {
  /**
   * Administrador del sistema
   * - Acceso completo a todas las funcionalidades
   * - Gestión de usuarios y configuración
   * - Acceso a todas las sucursales
   */
  ADMIN = 'ADMIN',

  /**
   * Encargado de sucursal
   * - Gestión de empleados de su sucursal
   * - Reportes de su sucursal
   * - Configuración limitada
   */
  ENCARGADO_SUCURSAL = 'ENCARGADO_SUCURSAL',

  /**
   * Empleado regular
   * - Solo visualización de su propia asistencia
   * - Sin permisos de gestión
   */
  EMPLEADO = 'EMPLEADO'
}

/**
 * Descripción de roles para UI
 */
export const USER_ROLE_DESCRIPTIONS = {
  [UserRole.ADMIN]: 'Administrador del Sistema',
  [UserRole.ENCARGADO_SUCURSAL]: 'Encargado de Sucursal',
  [UserRole.EMPLEADO]: 'Empleado'
} as const;

/**
 * Permisos por rol
 */
export const USER_ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'employees.create',
    'employees.read', 
    'employees.update',
    'employees.delete',
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'attendance.delete',
    'reports.generate',
    'reports.export',
    'config.update',
    'biometric.sync',
    'biometric.config',
    'all.sucursales'
  ] as const,
  [UserRole.ENCARGADO_SUCURSAL]: [
    'employees.create',
    'employees.read',
    'employees.update',
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'reports.generate',
    'reports.export',
    'biometric.sync',
    'own.sucursal'
  ] as const,
  [UserRole.EMPLEADO]: [
    'attendance.read.own',
    'reports.view.own'
  ] as const
};

/**
 * Tipo para permisos válidos
 */
export type Permission = 
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  | 'employees.create' | 'employees.read' | 'employees.update' | 'employees.delete'
  | 'attendance.create' | 'attendance.read' | 'attendance.update' | 'attendance.delete'
  | 'attendance.read.own'
  | 'reports.generate' | 'reports.export' | 'reports.view.own'
  | 'config.update'
  | 'biometric.sync' | 'biometric.config'
  | 'all.sucursales' | 'own.sucursal';

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = USER_ROLE_PERMISSIONS[role];
  return rolePermissions.some(p => p === permission);
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getRolePermissions(role: UserRole): readonly Permission[] {
  return USER_ROLE_PERMISSIONS[role];
}

/**
 * Verifica si un rol puede acceder a todas las sucursales
 */
export function canAccessAllSucursales(role: UserRole): boolean {
  return hasPermission(role, 'all.sucursales');
}

/**
 * Obtiene la jerarquía de roles (menor número = mayor jerarquía)
 */
export const USER_ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 1,
  [UserRole.ENCARGADO_SUCURSAL]: 2,
  [UserRole.EMPLEADO]: 3
} as const;

/**
 * Verifica si un rol es superior a otro en jerarquía
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return USER_ROLE_HIERARCHY[role1] < USER_ROLE_HIERARCHY[role2];
}

/**
 * Obtiene la descripción de un rol
 */
export function getRoleDescription(role: UserRole): string {
  return USER_ROLE_DESCRIPTIONS[role];
}

/**
 * Obtiene los roles disponibles
 */
export function getAllRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Verifica si un string es un rol válido
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Obtiene roles que pueden ser asignados por un rol específico
 */
export function getAssignableRoles(assignerRole: UserRole): UserRole[] {
  switch (assignerRole) {
    case UserRole.ADMIN:
      return [UserRole.ADMIN, UserRole.ENCARGADO_SUCURSAL, UserRole.EMPLEADO];
    case UserRole.ENCARGADO_SUCURSAL:
      return [UserRole.EMPLEADO];
    case UserRole.EMPLEADO:
      return []; // Los empleados no pueden asignar roles
    default:
      return [];
  }
}

/**
 * Verifica si un rol puede asignar otro rol
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  const assignableRoles = getAssignableRoles(assignerRole);
  return assignableRoles.includes(targetRole);
}

/**
 * Obtiene permisos de gestión de empleados por rol
 */
export function getEmployeeManagementPermissions(role: UserRole): {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  scope: 'all' | 'own_sucursal' | 'none';
} {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        scope: 'all'
      };
    case UserRole.ENCARGADO_SUCURSAL:
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
        scope: 'own_sucursal'
      };
    case UserRole.EMPLEADO:
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        scope: 'none'
      };
    default:
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        scope: 'none'
      };
  }
}

/**
 * Obtiene permisos de asistencia por rol
 */
export function getAttendancePermissions(role: UserRole): {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  scope: 'all' | 'own_sucursal' | 'own' | 'none';
} {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        scope: 'all'
      };
    case UserRole.ENCARGADO_SUCURSAL:
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
        scope: 'own_sucursal'
      };
    case UserRole.EMPLEADO:
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        scope: 'own'
      };
    default:
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        scope: 'none'
      };
  }
}

export default UserRole;