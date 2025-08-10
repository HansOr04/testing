/**
 * USER POSTGRESQL REPOSITORY
 * Implementación de repositorio de usuarios para PostgreSQL
 * Maneja todas las operaciones de persistencia para la entidad User
 */

import { Pool, PoolClient } from 'pg';
import { User } from '@core/entities/user.entity';
import { UserRole } from '@core/enums/user-role.enum';
import { IUserRepository } from '@core/interfaces/repositories/user.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { IQueryResult } from '@shared/types/database.types';
import { getLogger } from '@shared/utils/logger.util';
import { validateEmail } from '@shared/utils/validation.util';

const logger = getLogger();

export class UserPostgresRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  /**
   * Buscar usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando usuario por ID', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al buscar usuario: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        throw new Error(`Email inválido: ${validation.errors.join(', ')}`);
      }

      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando usuario por email', 'UserPostgresRepository', { email }, error as Error);
      throw new Error(`Error al buscar usuario: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar usuario por cédula (a través de empleado)
   */
  async findByCedula(cedula: string): Promise<User | null> {
    try {
      const query = `
        SELECT 
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role,
          u.sucursal_id, u.employee_id, u.is_email_verified, u.last_login,
          u.login_attempts, u.locked_until, u.preferences, u.is_active,
          u.created_at, u.updated_at, u.deleted_at, u.version
        FROM users u
        INNER JOIN employees e ON u.employee_id = e.id
        WHERE e.cedula = $1 AND u.deleted_at IS NULL AND e.deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [cedula]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando usuario por cédula', 'UserPostgresRepository', { cedula }, error as Error);
      throw new Error(`Error al buscar usuario: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todos los usuarios con paginación
   */
  async findAll(pagination: IPagination): Promise<IResponse<User[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = dataResult.rows.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: users,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo todos los usuarios', 'UserPostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener usuarios: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar usuarios por rol
   */
  async findByRole(role: UserRole, pagination: IPagination): Promise<IResponse<User[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE role = $1 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE role = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [role]),
        this.pool.query(query, [role, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = dataResult.rows.map(row => this.mapRowToUser(row));

      return {
        success: true,
        message: `Usuarios con rol ${role} obtenidos exitosamente`,
        data: users,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando usuarios por rol', 'UserPostgresRepository', { role }, error as Error);
      throw new Error(`Error al buscar usuarios: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar usuarios por sucursal
   */
  async findBySucursal(sucursalId: string, pagination: IPagination): Promise<IResponse<User[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE sucursal_id = $1 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE sucursal_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [sucursalId]),
        this.pool.query(query, [sucursalId, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = dataResult.rows.map(row => this.mapRowToUser(row));

      return {
        success: true,
        message: 'Usuarios por sucursal obtenidos exitosamente',
        data: users,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando usuarios por sucursal', 'UserPostgresRepository', { sucursalId }, error as Error);
      throw new Error(`Error al buscar usuarios: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar usuarios activos
   */
  async findActive(pagination: IPagination): Promise<IResponse<User[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        WHERE is_active = true AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = dataResult.rows.map(row => this.mapRowToUser(row));

      return {
        success: true,
        message: 'Usuarios activos obtenidos exitosamente',
        data: users,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo usuarios activos', 'UserPostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener usuarios activos: ${(error as Error).message}`);
    }
  }

  /**
   * Crear nuevo usuario
   */
  async create(user: User): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO users (
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING *
      `;

      const values = [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.role,
        user.sucursalId || null,
        user.employeeId || null,
        user.isEmailVerified,
        user.lastLogin || null,
        user.loginAttempts,
        user.lockedUntil || null,
        JSON.stringify(user.preferences),
        user.isActive,
        user.createdAt,
        user.updatedAt,
        user.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Usuario creado exitosamente', 'UserPostgresRepository', { id: user.id, email: user.email });
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando usuario', 'UserPostgresRepository', { email: user.email }, error as Error);
      
      if ((error as any)?.code === '23505') {
        throw new Error('El email ya está registrado');
      }
      
      throw new Error(`Error al crear usuario: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar usuario existente
   */
  async update(id: string, userData: Partial<User>): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Primero verificar que el usuario existe
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Construir query dinámicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (userData.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        values.push(userData.email.toLowerCase());
      }

      if (userData.firstName !== undefined) {
        updateFields.push(`first_name = $${paramIndex++}`);
        values.push(userData.firstName);
      }

      if (userData.lastName !== undefined) {
        updateFields.push(`last_name = $${paramIndex++}`);
        values.push(userData.lastName);
      }

      if (userData.role !== undefined) {
        updateFields.push(`role = $${paramIndex++}`);
        values.push(userData.role);
      }

      if (userData.sucursalId !== undefined) {
        updateFields.push(`sucursal_id = $${paramIndex++}`);
        values.push(userData.sucursalId);
      }

      if (userData.employeeId !== undefined) {
        updateFields.push(`employee_id = $${paramIndex++}`);
        values.push(userData.employeeId);
      }

      if (userData.isEmailVerified !== undefined) {
        updateFields.push(`is_email_verified = $${paramIndex++}`);
        values.push(userData.isEmailVerified);
      }

      if (userData.lastLogin !== undefined) {
        updateFields.push(`last_login = $${paramIndex++}`);
        values.push(userData.lastLogin);
      }

      if (userData.loginAttempts !== undefined) {
        updateFields.push(`login_attempts = $${paramIndex++}`);
        values.push(userData.loginAttempts);
      }

      if (userData.lockedUntil !== undefined) {
        updateFields.push(`locked_until = $${paramIndex++}`);
        values.push(userData.lockedUntil);
      }

      if (userData.preferences !== undefined) {
        updateFields.push(`preferences = $${paramIndex++}`);
        values.push(JSON.stringify(userData.preferences));
      }

      if (userData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(userData.isActive);
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      updateFields.push(`version = $${paramIndex++}`);
      values.push(existingUser.version + 1);

      // ID para WHERE
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado para actualizar');
      }

      logger.info('Usuario actualizado exitosamente', 'UserPostgresRepository', { id });
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando usuario', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar usuario: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado para eliminar');
      }

      logger.info('Usuario eliminado exitosamente', 'UserPostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando usuario', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al eliminar usuario: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Activar/desactivar usuario
   */
  async toggleActive(id: string): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET is_active = NOT is_active, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      logger.info('Estado de usuario cambiado', 'UserPostgresRepository', { id });
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando estado de usuario', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si existe un usuario con el email dado
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [email.toLowerCase()]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por email', 'UserPostgresRepository', { email }, error as Error);
      throw new Error(`Error al verificar email: ${(error as Error).message}`);
    }
  }

  /**
   * Verificar si existe un usuario con la cédula dada
   */
  async existsByCedula(cedula: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM users u
        INNER JOIN employees e ON u.employee_id = e.id
        WHERE e.cedula = $1 AND u.deleted_at IS NULL AND e.deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [cedula]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por cédula', 'UserPostgresRepository', { cedula }, error as Error);
      throw new Error(`Error al verificar cédula: ${(error as Error).message}`);
    }
  }

  /**
   * Actualizar último login del usuario
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET last_login = $1, login_attempts = 0, locked_until = NULL, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      await this.pool.query(query, [new Date(), id]);
      logger.info('Último login actualizado', 'UserPostgresRepository', { id });
    } catch (error) {
      logger.error('Error actualizando último login', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar login: ${(error as Error).message}`);
    }
  }

  /**
   * Incrementar intentos fallidos de login
   */
  async incrementFailedAttempts(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET login_attempts = login_attempts + 1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      await this.pool.query(query, [new Date(), id]);
      logger.info('Intentos fallidos incrementados', 'UserPostgresRepository', { id });
    } catch (error) {
      logger.error('Error incrementando intentos fallidos', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al incrementar intentos: ${(error as Error).message}`);
    }
  }

  /**
   * Resetear intentos fallidos de login
   */
  async resetFailedAttempts(id: string): Promise<void> {
    try {
      const query = `
        UPDATE users 
        SET login_attempts = 0, locked_until = NULL, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      await this.pool.query(query, [new Date(), id]);
      logger.info('Intentos fallidos reseteados', 'UserPostgresRepository', { id });
    } catch (error) {
      logger.error('Error reseteando intentos fallidos', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al resetear intentos: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar usuarios bloqueados
   */
  async findBlocked(): Promise<User[]> {
    try {
      const query = `
        SELECT 
          id, email, password_hash, first_name, last_name, role,
          sucursal_id, employee_id, is_email_verified, last_login,
          login_attempts, locked_until, preferences, is_active,
          created_at, updated_at, deleted_at, version
        FROM users 
        WHERE locked_until > $1 AND deleted_at IS NULL
        ORDER BY locked_until DESC
      `;
      
      const result = await this.pool.query(query, [new Date()]);
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      logger.error('Error buscando usuarios bloqueados', 'UserPostgresRepository', {}, error as Error);
      throw new Error(`Error al buscar usuarios bloqueados: ${(error as Error).message}`);
    }
  }

  /**
   * Desbloquear usuario
   */
  async unblock(id: string): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET login_attempts = 0, locked_until = NULL, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      logger.info('Usuario desbloqueado exitosamente', 'UserPostgresRepository', { id });
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error desbloqueando usuario', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al desbloquear usuario: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(id: string, hashedPassword: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [hashedPassword, new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
      }

      logger.info('Contraseña cambiada exitosamente', 'UserPostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando contraseña', 'UserPostgresRepository', { id }, error as Error);
      throw new Error(`Error al cambiar contraseña: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    blocked: number;
  }> {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL',
        'SELECT COUNT(*) as active FROM users WHERE is_active = true AND deleted_at IS NULL',
        'SELECT COUNT(*) as inactive FROM users WHERE is_active = false AND deleted_at IS NULL',
        'SELECT role, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY role',
        'SELECT COUNT(*) as blocked FROM users WHERE locked_until > $1 AND deleted_at IS NULL'
      ];

      const [totalResult, activeResult, inactiveResult, roleResult, blockedResult] = await Promise.all([
        this.pool.query(queries[0]),
        this.pool.query(queries[1]),
        this.pool.query(queries[2]),
        this.pool.query(queries[3]),
        this.pool.query(queries[4], [new Date()])
      ]);

      const byRole: Record<UserRole, number> = {
        [UserRole.ADMIN]: 0,
        [UserRole.ENCARGADO_SUCURSAL]: 0,
        [UserRole.EMPLEADO]: 0
      };

      roleResult.rows.forEach(row => {
        byRole[row.role as UserRole] = parseInt(row.count);
      });

      return {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        inactive: parseInt(inactiveResult.rows[0].inactive),
        byRole,
        blocked: parseInt(blockedResult.rows[0].blocked)
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de usuarios', 'UserPostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto User
   */
  private mapRowToUser(row: any): User {
    const userData = {
      id: row.id,
      email: row.email,
      password: '', // Se establecerá desde passwordHash
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      sucursalId: row.sucursal_id,
      employeeId: row.employee_id,
      isEmailVerified: row.is_email_verified,
      lastLogin: row.last_login,
      loginAttempts: row.login_attempts,
      lockedUntil: row.locked_until,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };

    const user = new User(userData);
    
    // Establecer el hash de password directamente
    (user as any)._passwordHash = row.password_hash;
    
    // Establecer preferencias si existen
    if (row.preferences) {
      try {
        const preferences = typeof row.preferences === 'string' 
          ? JSON.parse(row.preferences) 
          : row.preferences;
        user.updatePreferences(preferences);
      } catch (error) {
        logger.warn('Error parseando preferencias de usuario', 'UserPostgresRepository', { userId: row.id });
      }
    }

    return user;
  }
}

export default UserPostgresRepository;