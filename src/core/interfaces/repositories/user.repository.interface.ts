// src/core/interfaces/repositories/user.repository.interface.ts

import { User } from '../../entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de usuarios
 * Define todas las operaciones de persistencia para la entidad User
 */
export interface IUserRepository {
  /**
   * Buscar usuario por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Buscar usuario por email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Buscar usuario por cédula
   */
  findByCedula(cedula: string): Promise<User | null>;

  /**
   * Obtener todos los usuarios con paginación
   */
  findAll(pagination: IPagination): Promise<IResponse<User[]>>;

  /**
   * Buscar usuarios por rol
   */
  findByRole(role: UserRole, pagination: IPagination): Promise<IResponse<User[]>>;

  /**
   * Buscar usuarios por sucursal (para encargados y empleados)
   */
  findBySucursal(sucursalId: string, pagination: IPagination): Promise<IResponse<User[]>>;

  /**
   * Buscar usuarios activos
   */
  findActive(pagination: IPagination): Promise<IResponse<User[]>>;

  /**
   * Crear nuevo usuario
   */
  create(user: User): Promise<User>;

  /**
   * Actualizar usuario existente
   */
  update(id: string, user: Partial<User>): Promise<User>;

  /**
   * Eliminar usuario (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Activar/desactivar usuario
   */
  toggleActive(id: string): Promise<User>;

  /**
   * Verificar si existe un usuario con el email dado
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Verificar si existe un usuario con la cédula dada
   */
  existsByCedula(cedula: string): Promise<boolean>;

  /**
   * Actualizar último login del usuario
   */
  updateLastLogin(id: string): Promise<void>;

  /**
   * Incrementar intentos fallidos de login
   */
  incrementFailedAttempts(id: string): Promise<void>;

  /**
   * Resetear intentos fallidos de login
   */
  resetFailedAttempts(id: string): Promise<void>;

  /**
   * Buscar usuarios bloqueados
   */
  findBlocked(): Promise<User[]>;

  /**
   * Desbloquear usuario
   */
  unblock(id: string): Promise<User>;

  /**
   * Cambiar contraseña del usuario
   */
  changePassword(id: string, hashedPassword: string): Promise<void>;

  /**
   * Obtener estadísticas de usuarios
   */
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    blocked: number;
  }>;
}