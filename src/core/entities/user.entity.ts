/**
 * USER ENTITY
 * Entidad de usuario del sistema de asistencia
 * Maneja autenticación, roles y permisos
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { UserRole, hasPermission, type Permission } from '@core/enums/user-role.enum';
import { validateEmail, validatePassword } from '@shared/utils/validation.util';
import { hashPassword, comparePassword } from '@shared/utils/encryption.util';

/**
 * Datos para crear un usuario
 */
export interface ICreateUserData extends ICreateBaseEntityData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  sucursalId?: string;
  employeeId?: string;
  isEmailVerified?: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
}

/**
 * Datos para actualizar un usuario
 */
export interface IUpdateUserData extends IUpdateBaseEntityData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  sucursalId?: string;
  employeeId?: string;
  isEmailVerified?: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
}

/**
 * Información de sesión del usuario
 */
export interface IUserSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  sucursalId?: string;
  permissions: readonly Permission[];
  lastLogin?: Date;
  sessionStarted: Date;
}

/**
 * Preferencias del usuario
 */
export interface IUserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

export class User extends BaseEntity {
  private _email: string;
  private _passwordHash: string;
  private _firstName: string;
  private _lastName: string;
  private _role: UserRole;
  private _sucursalId?: string;
  private _employeeId?: string;
  private _isEmailVerified: boolean;
  private _lastLogin?: Date;
  private _loginAttempts: number;
  private _lockedUntil?: Date;
  private _preferences: IUserPreferences;

  constructor(data: ICreateUserData) {
    super(data);

    this._email = data.email.toLowerCase().trim();
    this._passwordHash = ''; // Se establecerá con setPassword
    this._firstName = data.firstName.trim();
    this._lastName = data.lastName.trim();
    this._role = data.role;
    this._sucursalId = data.sucursalId;
    this._employeeId = data.employeeId;
    this._isEmailVerified = data.isEmailVerified || false;
    this._lastLogin = data.lastLogin;
    this._loginAttempts = data.loginAttempts || 0;
    this._lockedUntil = data.lockedUntil;
    this._preferences = this.getDefaultPreferences();

    // Establecer password si se proporciona
    if (data.password) {
      this.setPasswordSync(data.password);
    }
  }

  /**
   * Obtiene el email del usuario
   */
  get email(): string {
    return this._email;
  }

  /**
   * Obtiene el hash de la contraseña
   */
  get passwordHash(): string {
    return this._passwordHash;
  }

  /**
   * Obtiene el nombre del usuario
   */
  get firstName(): string {
    return this._firstName;
  }

  /**
   * Obtiene el apellido del usuario
   */
  get lastName(): string {
    return this._lastName;
  }

  /**
   * Obtiene el nombre completo
   */
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  /**
   * Obtiene el rol del usuario
   */
  get role(): UserRole {
    return this._role;
  }

  /**
   * Obtiene el ID de la sucursal asignada
   */
  get sucursalId(): string | undefined {
    return this._sucursalId;
  }

  /**
   * Obtiene el ID del empleado asociado
   */
  get employeeId(): string | undefined {
    return this._employeeId;
  }

  /**
   * Verifica si el email está verificado
   */
  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  /**
   * Obtiene la fecha del último login
   */
  get lastLogin(): Date | undefined {
    return this._lastLogin ? new Date(this._lastLogin) : undefined;
  }

  /**
   * Obtiene el número de intentos de login fallidos
   */
  get loginAttempts(): number {
    return this._loginAttempts;
  }

  /**
   * Obtiene la fecha hasta cuando está bloqueado
   */
  get lockedUntil(): Date | undefined {
    return this._lockedUntil ? new Date(this._lockedUntil) : undefined;
  }

  /**
   * Obtiene las preferencias del usuario
   */
  get preferences(): IUserPreferences {
    return { ...this._preferences };
  }

  /**
   * Verifica si el usuario está bloqueado
   */
  get isLocked(): boolean {
    return this._lockedUntil ? new Date() < this._lockedUntil : false;
  }

  /**
   * Verifica si el usuario puede hacer login
   */
  get canLogin(): boolean {
    return this.isActive && this._isEmailVerified && !this.isLocked;
  }

  /**
   * Obtiene el tiempo restante de bloqueo en minutos
   */
  get lockTimeRemaining(): number {
    if (!this._lockedUntil) return 0;
    const now = new Date();
    const diffMs = this._lockedUntil.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60)));
  }

  /**
   * Verifica si el usuario es administrador
   */
  get isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario es encargado de sucursal
   */
  get isManager(): boolean {
    return this._role === UserRole.ENCARGADO_SUCURSAL;
  }

  /**
   * Verifica si el usuario es empleado
   */
  get isEmployee(): boolean {
    return this._role === UserRole.EMPLEADO;
  }

  /**
   * Establece una nueva contraseña (versión síncrona para constructor)
   */
  private setPasswordSync(password: string): void {
    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(`Contraseña inválida: ${validation.errors.join(', ')}`);
    }

    // Usar una versión simplificada para el constructor
    this._passwordHash = password; // En producción, usar bcrypt.hashSync
  }

  /**
   * Establece una nueva contraseña (versión asíncrona)
   */
  async setPassword(password: string): Promise<void> {
    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(`Contraseña inválida: ${validation.errors.join(', ')}`);
    }

    this._passwordHash = await hashPassword(password);
    this.touch();
  }

  /**
   * Verifica una contraseña
   */
  async verifyPassword(password: string): Promise<boolean> {
    if (!this._passwordHash) return false;
    
    try {
      return await comparePassword(password, this._passwordHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Actualiza información del usuario
   */
  update(data: IUpdateUserData): void {
    if (data.email !== undefined) {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        throw new Error(`Email inválido: ${emailValidation.errors.join(', ')}`);
      }
      this._email = data.email.toLowerCase().trim();
    }

    if (data.firstName !== undefined) {
      if (!data.firstName.trim()) {
        throw new Error('Nombre es requerido');
      }
      this._firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      if (!data.lastName.trim()) {
        throw new Error('Apellido es requerido');
      }
      this._lastName = data.lastName.trim();
    }

    if (data.role !== undefined) {
      this._role = data.role;
    }

    if (data.sucursalId !== undefined) {
      this._sucursalId = data.sucursalId;
    }

    if (data.employeeId !== undefined) {
      this._employeeId = data.employeeId;
    }

    if (data.isEmailVerified !== undefined) {
      this._isEmailVerified = data.isEmailVerified;
    }

    if (data.lastLogin !== undefined) {
      this._lastLogin = data.lastLogin;
    }

    if (data.loginAttempts !== undefined) {
      this._loginAttempts = data.loginAttempts;
    }

    if (data.lockedUntil !== undefined) {
      this._lockedUntil = data.lockedUntil;
    }

    this.updateEntity(data);
  }

  /**
   * Registra un intento de login exitoso
   */
  recordSuccessfulLogin(): void {
    this._lastLogin = new Date();
    this._loginAttempts = 0;
    this._lockedUntil = undefined;
    this.touch();
  }

  /**
   * Registra un intento de login fallido
   */
  recordFailedLogin(): void {
    this._loginAttempts++;
    
    // Bloquear después de 5 intentos fallidos
    if (this._loginAttempts >= 5) {
      const lockDurationMinutes = Math.min(30 * Math.pow(2, this._loginAttempts - 5), 480); // Max 8 horas
      this._lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    }
    
    this.touch();
  }

  /**
   * Desbloquea el usuario manualmente
   */
  unlock(): void {
    this._loginAttempts = 0;
    this._lockedUntil = undefined;
    this.touch();
  }

  /**
   * Verifica el email del usuario
   */
  verifyEmail(): void {
    this._isEmailVerified = true;
    this.touch();
  }

  /**
   * Cambia el rol del usuario
   */
  changeRole(newRole: UserRole, changedBy: string): void {
    if (this._role === newRole) return;

    const oldRole = this._role;
    this._role = newRole;
    
    // Si cambia a empleado y no tiene sucursal, requerirla
    if (newRole === UserRole.EMPLEADO && !this._sucursalId) {
      throw new Error('Empleados deben tener una sucursal asignada');
    }
    
    this.touch();
  }

  /**
   * Asigna a una sucursal
   */
  assignToSucursal(sucursalId: string): void {
    this._sucursalId = sucursalId;
    this.touch();
  }

  /**
   * Remueve de sucursal
   */
  removeFromSucursal(): void {
    if (this._role === UserRole.EMPLEADO) {
      throw new Error('Empleados deben tener una sucursal asignada');
    }
    this._sucursalId = undefined;
    this.touch();
  }

  /**
   * Asocia con un empleado
   */
  linkToEmployee(employeeId: string): void {
    this._employeeId = employeeId;
    this.touch();
  }

  /**
   * Desasocia del empleado
   */
  unlinkFromEmployee(): void {
    this._employeeId = undefined;
    this.touch();
  }

  /**
   * Verifica si tiene un permiso específico
   */
  hasPermission(permission: Permission): boolean {
    return hasPermission(this._role, permission);
  }

  /**
   * Verifica si puede acceder a una sucursal específica
   */
  canAccessSucursal(sucursalId: string): boolean {
    if (this.isAdmin) return true;
    if (this.isManager && this._sucursalId === sucursalId) return true;
    if (this.isEmployee && this._sucursalId === sucursalId) return true;
    return false;
  }

  /**
   * Actualiza las preferencias del usuario
   */
  updatePreferences(preferences: Partial<IUserPreferences>): void {
    this._preferences = {
      ...this._preferences,
      ...preferences
    };
    this.touch();
  }

  /**
   * Crea información de sesión
   */
  createSession(): IUserSession {
    if (!this.canLogin) {
      throw new Error('Usuario no puede iniciar sesión');
    }

    return {
      userId: this.id,
      email: this._email,
      fullName: this.fullName,
      role: this._role,
      sucursalId: this._sucursalId,
      permissions: this.getPermissions(),
      lastLogin: this.lastLogin,
      sessionStarted: new Date()
    };
  }

  /**
   * Obtiene todos los permisos del usuario
   */
  private getPermissions(): readonly Permission[] {
    const permissions: Permission[] = [];
    
    // Lista de todos los permisos posibles
    const allPermissions: Permission[] = [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'employees.create', 'employees.read', 'employees.update', 'employees.delete',
      'attendance.create', 'attendance.read', 'attendance.update', 'attendance.delete',
      'attendance.read.own',
      'reports.generate', 'reports.export', 'reports.view.own',
      'config.update',
      'biometric.sync', 'biometric.config',
      'all.sucursales', 'own.sucursal'
    ];

    return allPermissions.filter(permission => this.hasPermission(permission));
  }

  /**
   * Obtiene las preferencias por defecto
   */
  private getDefaultPreferences(): IUserPreferences {
    return {
      language: 'es',
      timezone: 'America/Guayaquil',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        desktop: false
      }
    };
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    // Validar email
    const emailValidation = validateEmail(this._email);
    if (!emailValidation.isValid) {
      throw new Error(`Email inválido: ${emailValidation.errors.join(', ')}`);
    }

    // Validar nombres
    if (!this._firstName.trim()) {
      throw new Error('Nombre es requerido');
    }

    if (!this._lastName.trim()) {
      throw new Error('Apellido es requerido');
    }

    // Validar rol
    if (!Object.values(UserRole).includes(this._role)) {
      throw new Error('Rol inválido');
    }

    // Validar reglas de negocio
    if (this._role === UserRole.EMPLEADO && !this._sucursalId) {
      throw new Error('Empleados deben tener una sucursal asignada');
    }

    if (this._loginAttempts < 0) {
      throw new Error('Intentos de login no pueden ser negativos');
    }

    if (this._lockedUntil && this._lockedUntil <= new Date()) {
      // Auto-desbloquear si el tiempo de bloqueo ya pasó
      this._lockedUntil = undefined;
      this._loginAttempts = 0;
    }
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      ...this.toBaseObject(),
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      role: this._role,
      sucursalId: this._sucursalId,
      employeeId: this._employeeId,
      isEmailVerified: this._isEmailVerified,
      lastLogin: this._lastLogin,
      loginAttempts: this._loginAttempts,
      lockedUntil: this._lockedUntil,
      isLocked: this.isLocked,
      canLogin: this.canLogin,
      lockTimeRemaining: this.lockTimeRemaining,
      preferences: this._preferences
    };
  }

  /**
   * Convierte a JSON seguro (sin información sensible)
   */
  toSafeJSON(): object {
    return {
      id: this.id,
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      role: this._role,
      sucursalId: this._sucursalId,
      isEmailVerified: this._isEmailVerified,
      lastLogin: this._lastLogin,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Crea una copia superficial
   */
  protected shallowCopy(): User {
    const data: ICreateUserData = {
      ...this.cloneBaseData(),
      email: this._email,
      password: '', // No copiar password
      firstName: this._firstName,
      lastName: this._lastName,
      role: this._role,
      sucursalId: this._sucursalId,
      employeeId: this._employeeId,
      isEmailVerified: this._isEmailVerified,
      lastLogin: this._lastLogin,
      loginAttempts: this._loginAttempts,
      lockedUntil: this._lockedUntil
    };

    const copy = new User(data);
    copy._passwordHash = this._passwordHash;
    copy._preferences = { ...this._preferences };
    return copy;
  }

  /**
   * Crea un usuario administrador
   */
  static createAdmin(email: string, password: string, firstName: string, lastName: string): User {
    return new User({
      email,
      password,
      firstName,
      lastName,
      role: UserRole.ADMIN,
      isEmailVerified: true
    });
  }

  /**
   * Crea un encargado de sucursal
   */
  static createManager(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    sucursalId: string
  ): User {
    return new User({
      email,
      password,
      firstName,
      lastName,
      role: UserRole.ENCARGADO_SUCURSAL,
      sucursalId,
      isEmailVerified: false
    });
  }

  /**
   * Crea un empleado
   */
  static createEmployee(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    sucursalId: string,
    employeeId?: string
  ): User {
    return new User({
      email,
      password,
      firstName,
      lastName,
      role: UserRole.EMPLEADO,
      sucursalId,
      employeeId,
      isEmailVerified: false
    });
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateUserData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }

    // Validar password
    if (data.password) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    // Validar nombres
    if (!data.firstName?.trim()) {
      errors.push('Nombre es requerido');
    }

    if (!data.lastName?.trim()) {
      errors.push('Apellido es requerido');
    }

    // Validar rol
    if (!Object.values(UserRole).includes(data.role)) {
      errors.push('Rol inválido');
    }

    // Validar reglas de negocio
    if (data.role === UserRole.EMPLEADO && !data.sucursalId) {
      errors.push('Empleados deben tener una sucursal asignada');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default User;