// src/core/interfaces/services/auth.service.interface.ts

import { User } from '../../entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';

/**
 * Contrato para el servicio de autenticación
 * Define todas las operaciones relacionadas con autenticación y autorización
 */
export interface IAuthService {
  /**
   * Autenticar usuario con email y contraseña
   */
  login(email: string, password: string): Promise<{
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  }>;

  /**
   * Refrescar token de acceso
   */
  refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
    expiresIn: number;
  }>;

  /**
   * Cerrar sesión del usuario
   */
  logout(userId: string, token: string): Promise<void>;

  /**
   * Registrar nuevo usuario
   */
  register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    cedula: string;
    role: UserRole;
    sucursalId?: string;
  }): Promise<{
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  }>;

  /**
   * Verificar token de acceso
   */
  verifyToken(token: string): Promise<{
    isValid: boolean;
    user?: User;
    error?: string;
  }>;

  /**
   * Verificar si el usuario tiene permisos para una acción específica
   */
  checkPermission(userId: string, action: string, resource?: string): Promise<boolean>;

  /**
   * Verificar si el usuario tiene acceso a una sucursal específica
   */
  checkSucursalAccess(userId: string, sucursalId: string): Promise<boolean>;

  /**
   * Obtener permisos del usuario
   */
  getUserPermissions(userId: string): Promise<{
    role: UserRole;
    sucursales: string[];
    permissions: string[];
    canAccessAllSucursales: boolean;
  }>;

  /**
   * Cambiar contraseña del usuario
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;

  /**
   * Solicitar restablecimiento de contraseña
   */
  requestPasswordReset(email: string): Promise<{
    resetToken: string;
    expiresAt: Date;
  }>;

  /**
   * Restablecer contraseña con token
   */
  resetPassword(resetToken: string, newPassword: string): Promise<void>;

  /**
   * Bloquear usuario por intentos fallidos
   */
  blockUser(userId: string, reason: string): Promise<void>;

  /**
   * Desbloquear usuario
   */
  unblockUser(userId: string, unlockedBy: string): Promise<void>;

  /**
   * Obtener información de la sesión actual
   */
  getCurrentSession(token: string): Promise<{
    user: User;
    loginTime: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
  }>;

  /**
   * Invalidar todas las sesiones del usuario
   */
  invalidateAllSessions(userId: string): Promise<void>;

  /**
   * Registrar actividad del usuario
   */
  logActivity(userId: string, activity: {
    action: string;
    resource?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;

  /**
   * Obtener historial de actividad del usuario
   */
  getActivityHistory(userId: string, days: number): Promise<Array<{
    timestamp: Date;
    action: string;
    resource?: string;
    details?: any;
    ipAddress?: string;
    success: boolean;
  }>>;

  /**
   * Validar reglas de contraseña
   */
  validatePassword(password: string): Promise<{
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  }>;

  /**
   * Generar token de sesión única (SSO)
   */
  generateSSOToken(userId: string, targetService: string): Promise<{
    ssoToken: string;
    expiresIn: number;
  }>;

  /**
   * Verificar token de sesión única (SSO)
   */
  verifySSOToken(ssoToken: string, service: string): Promise<{
    isValid: boolean;
    user?: User;
  }>;

  /**
   * Configurar autenticación de dos factores
   */
  setup2FA(userId: string): Promise<{
    qrCode: string;
    backupCodes: string[];
  }>;

  /**
   * Verificar código de autenticación de dos factores
   */
  verify2FA(userId: string, code: string): Promise<boolean>;

  /**
   * Deshabilitar autenticación de dos factores
   */
  disable2FA(userId: string, password: string): Promise<void>;
}