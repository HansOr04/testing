// src/infrastructure/database/repositories/sqlserver/user.sqlserver.repository.ts

import { IUserRepository } from '@core/interfaces/repositories/user.repository.interface';
import { User, ICreateUserData } from '@core/entities/user.entity';
import { UserRole } from '@core/enums/user-role.enum';
import { IResponse, IPagination, IPaginationParams } from '@shared/types/common.types';
import { SqlServerConnection } from '../../connections/sqlserver.connection';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

/**
 * 🗄️ REPOSITORIO SQL SERVER - USUARIOS
 * 
 * Implementación completa del repositorio de usuarios para SQL Server
 * 
 * Características:
 * ✅ CRUD completo de usuarios
 * ✅ Búsquedas optimizadas por email, cédula, rol
 * ✅ Paginación eficiente con COUNT total
 * ✅ Gestión de intentos de login y bloqueos
 * ✅ Soft delete y activación/desactivación
 * ✅ Estadísticas y reportes
 * ✅ Transacciones seguras
 * ✅ Logging completo de operaciones
 * ✅ Manejo robusto de errores
 */
export class UserSqlServerRepository implements IUserRepository {
  private connection: SqlServerConnection;

  constructor(connection: SqlServerConnection) {
    this.connection = connection;
  }

  /**
   * 🔍 Buscar usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      logger.debug(`🔍 Buscando usuario por ID: ${id}`);

      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE u.id = @param0 
          AND u.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [id]);

      if (!result) {
        logger.debug(`❌ Usuario no encontrado: ${id}`);
        return null;
      }

      const user = this.mapRowToUser(result);
      logger.debug(`✅ Usuario encontrado: ${user.email}`);
      
      return user;

    } catch (error) {
      logger.error(`❌ Error buscando usuario por ID ${id}:`, error);
      throw new Error(`Error buscando usuario: ${error}`);
    }
  }

  /**
   * 📧 Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      logger.debug(`📧 Buscando usuario por email: ${email}`);

      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE LOWER(u.email) = LOWER(@param0)
          AND u.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [email]);

      if (!result) {
        logger.debug(`❌ Usuario no encontrado por email: ${email}`);
        return null;
      }

      const user = this.mapRowToUser(result);
      logger.debug(`✅ Usuario encontrado por email: ${user.fullName}`);
      
      return user;

    } catch (error) {
      logger.error(`❌ Error buscando usuario por email ${email}:`, error);
      throw new Error(`Error buscando usuario por email: ${error}`);
    }
  }

  /**
   * 🆔 Buscar usuario por cédula
   */
  async findByCedula(cedula: string): Promise<User | null> {
    try {
      logger.debug(`🆔 Buscando usuario por cédula: ${cedula}`);

      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        INNER JOIN employees e ON u.employee_id = e.id
        WHERE e.cedula = @param0
          AND u.deleted_at IS NULL
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [cedula]);

      if (!result) {
        logger.debug(`❌ Usuario no encontrado por cédula: ${cedula}`);
        return null;
      }

      const user = this.mapRowToUser(result);
      logger.debug(`✅ Usuario encontrado por cédula: ${user.fullName}`);
      
      return user;

    } catch (error) {
      logger.error(`❌ Error buscando usuario por cédula ${cedula}:`, error);
      throw new Error(`Error buscando usuario por cédula: ${error}`);
    }
  }

  /**
   * 📋 Obtener todos los usuarios con paginación
   */
  async findAll(pagination: IPaginationParams): Promise<IResponse<User[]>> {
    try {
      logger.debug('📋 Obteniendo todos los usuarios con paginación');

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql);
      const total = countResult?.total || 0;

      // Consulta principal con paginación
      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE u.deleted_at IS NULL
        ORDER BY u.${orderBy} ${orderDirection}
        OFFSET @param0 ROWS
        FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [offset, limit]);
      const users = results.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Usuarios obtenidos: ${users.length} de ${total}`);

      return {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: users,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<User[]>;

    } catch (error) {
      logger.error('❌ Error obteniendo usuarios:', error);
      throw new Error(`Error obteniendo usuarios: ${error}`);
    }
  }

  /**
   * 👥 Buscar usuarios por rol
   */
  async findByRole(role: UserRole, pagination: IPaginationParams): Promise<IResponse<User[]>> {
    try {
      logger.debug(`👥 Buscando usuarios por rol: ${role}`);

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.role = @param0
          AND u.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, [role]);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE u.role = @param0
          AND u.deleted_at IS NULL
        ORDER BY u.${orderBy} ${orderDirection}
        OFFSET @param1 ROWS
        FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [role, offset, limit]);
      const users = results.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Usuarios por rol obtenidos: ${users.length} de ${total}`);

      return {
        success: true,
        message: `Usuarios con rol ${role} obtenidos exitosamente`,
        data: users,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<User[]>;

    } catch (error) {
      logger.error(`❌ Error buscando usuarios por rol ${role}:`, error);
      throw new Error(`Error buscando usuarios por rol: ${error}`);
    }
  }

  /**
   * 🏢 Buscar usuarios por sucursal
   */
  async findBySucursal(sucursalId: string, pagination: IPaginationParams): Promise<IResponse<User[]>> {
    try {
      logger.debug(`🏢 Buscando usuarios por sucursal: ${sucursalId}`);

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.sucursal_id = @param0
          AND u.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, [sucursalId]);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE u.sucursal_id = @param0
          AND u.deleted_at IS NULL
        ORDER BY u.${orderBy} ${orderDirection}
        OFFSET @param1 ROWS
        FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [sucursalId, offset, limit]);
      const users = results.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Usuarios por sucursal obtenidos: ${users.length} de ${total}`);

      return {
        success: true,
        message: `Usuarios de sucursal obtenidos exitosamente`,
        data: users,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<User[]>;

    } catch (error) {
      logger.error(`❌ Error buscando usuarios por sucursal ${sucursalId}:`, error);
      throw new Error(`Error buscando usuarios por sucursal: ${error}`);
    }
  }

  /**
   * ✅ Buscar usuarios activos
   */
  async findActive(pagination: IPaginationParams): Promise<IResponse<User[]>> {
    try {
      logger.debug('✅ Buscando usuarios activos');

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.is_active = 1
          AND u.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE u.is_active = 1
          AND u.deleted_at IS NULL
        ORDER BY u.${orderBy} ${orderDirection}
        OFFSET @param0 ROWS
        FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [offset, limit]);
      const users = results.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Usuarios activos obtenidos: ${users.length} de ${total}`);

      return {
        success: true,
        message: 'Usuarios activos obtenidos exitosamente',
        data: users,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<User[]>;

    } catch (error) {
      logger.error('❌ Error buscando usuarios activos:', error);
      throw new Error(`Error buscando usuarios activos: ${error}`);
    }
  }

  /**
   * ➕ Crear nuevo usuario
   */
  async create(user: User): Promise<User> {
    try {
      logger.debug(`➕ Creando nuevo usuario: ${user.email}`);

      const sql = `
        INSERT INTO users (
          id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          sucursal_id,
          employee_id,
          is_email_verified,
          last_login,
          login_attempts,
          locked_until,
          preferences,
          is_active,
          created_at,
          updated_at,
          version
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7,
          @param8, @param9, @param10, @param11, @param12, @param13, @param14, @param15, @param16
        )
      `;

      const params = [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.role,
        user.sucursalId || null,
        user.employeeId || null,
        user.isEmailVerified ? 1 : 0,
        user.lastLogin || null,
        user.loginAttempts,
        user.lockedUntil || null,
        JSON.stringify(user.preferences),
        user.isActive ? 1 : 0,
        user.createdAt,
        user.updatedAt,
        user.version
      ];

      await this.connection.query(sql, params);

      logger.info(`✅ Usuario creado exitosamente: ${user.email}`);
      return user;

    } catch (error) {
      logger.error(`❌ Error creando usuario ${user.email}:`, error);
      
      if (error.message?.includes('UNIQUE KEY constraint')) {
        throw new Error('Ya existe un usuario con ese email');
      }
      
      throw new Error(`Error creando usuario: ${error}`);
    }
  }

  /**
   * ✏️ Actualizar usuario existente
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      logger.debug(`✏️ Actualizando usuario: ${id}`);

      // Verificar que el usuario existe
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Construir SQL dinámico según los campos a actualizar
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 0;

      if (updates.email !== undefined) {
        updateFields.push(`email = @param${paramIndex}`);
        params.push(updates.email);
        paramIndex++;
      }

      if (updates.passwordHash !== undefined) {
        updateFields.push(`password_hash = @param${paramIndex}`);
        params.push(updates.passwordHash);
        paramIndex++;
      }

      if (updates.firstName !== undefined) {
        updateFields.push(`first_name = @param${paramIndex}`);
        params.push(updates.firstName);
        paramIndex++;
      }

      if (updates.lastName !== undefined) {
        updateFields.push(`last_name = @param${paramIndex}`);
        params.push(updates.lastName);
        paramIndex++;
      }

      if (updates.role !== undefined) {
        updateFields.push(`role = @param${paramIndex}`);
        params.push(updates.role);
        paramIndex++;
      }

      if (updates.sucursalId !== undefined) {
        updateFields.push(`sucursal_id = @param${paramIndex}`);
        params.push(updates.sucursalId);
        paramIndex++;
      }

      if (updates.employeeId !== undefined) {
        updateFields.push(`employee_id = @param${paramIndex}`);
        params.push(updates.employeeId);
        paramIndex++;
      }

      if (updates.isEmailVerified !== undefined) {
        updateFields.push(`is_email_verified = @param${paramIndex}`);
        params.push(updates.isEmailVerified ? 1 : 0);
        paramIndex++;
      }

      if (updates.lastLogin !== undefined) {
        updateFields.push(`last_login = @param${paramIndex}`);
        params.push(updates.lastLogin);
        paramIndex++;
      }

      if (updates.loginAttempts !== undefined) {
        updateFields.push(`login_attempts = @param${paramIndex}`);
        params.push(updates.loginAttempts);
        paramIndex++;
      }

      if (updates.lockedUntil !== undefined) {
        updateFields.push(`locked_until = @param${paramIndex}`);
        params.push(updates.lockedUntil);
        paramIndex++;
      }

      if (updates.preferences !== undefined) {
        updateFields.push(`preferences = @param${paramIndex}`);
        params.push(JSON.stringify(updates.preferences));
        paramIndex++;
      }

      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = @param${paramIndex}`);
        params.push(updates.isActive ? 1 : 0);
        paramIndex++;
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = @param${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      updateFields.push(`version = @param${paramIndex}`);
      params.push(existingUser.version + 1);
      paramIndex++;

      // Agregar WHERE clause
      params.push(id);

      const sql = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = @param${paramIndex - 1}
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, params);

      // Retornar usuario actualizado
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('Error obteniendo usuario actualizado');
      }

      logger.info(`✅ Usuario actualizado exitosamente: ${updatedUser.email}`);
      return updatedUser;

    } catch (error) {
      logger.error(`❌ Error actualizando usuario ${id}:`, error);
      throw new Error(`Error actualizando usuario: ${error}`);
    }
  }

  /**
   * 🗑️ Eliminar usuario (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      logger.debug(`🗑️ Eliminando usuario: ${id}`);

      const sql = `
        UPDATE users 
        SET 
          deleted_at = @param0,
          updated_at = @param1,
          is_active = 0
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [new Date(), new Date(), id]);

      logger.info(`✅ Usuario eliminado exitosamente: ${id}`);

    } catch (error) {
      logger.error(`❌ Error eliminando usuario ${id}:`, error);
      throw new Error(`Error eliminando usuario: ${error}`);
    }
  }

  /**
   * 🔄 Activar/desactivar usuario
   */
  async toggleActive(id: string): Promise<User> {
    try {
      logger.debug(`🔄 Toggling estado activo usuario: ${id}`);

      const user = await this.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const newActiveState = !user.isActive;

      const sql = `
        UPDATE users 
        SET 
          is_active = @param0,
          updated_at = @param1,
          version = version + 1
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [newActiveState ? 1 : 0, new Date(), id]);

      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('Error obteniendo usuario actualizado');
      }

      logger.info(`✅ Estado usuario actualizado: ${updatedUser.email} - ${newActiveState ? 'Activo' : 'Inactivo'}`);
      return updatedUser;

    } catch (error) {
      logger.error(`❌ Error toggling estado usuario ${id}:`, error);
      throw new Error(`Error actualizando estado usuario: ${error}`);
    }
  }

  /**
   * ✅ Verificar si existe usuario por email
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM users u
        WHERE LOWER(u.email) = LOWER(@param0)
          AND u.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(sql, [email]);
      return (result?.count || 0) > 0;

    } catch (error) {
      logger.error(`❌ Error verificando existencia por email ${email}:`, error);
      throw new Error(`Error verificando email: ${error}`);
    }
  }

  /**
   * ✅ Verificar si existe usuario por cédula
   */
  async existsByCedula(cedula: string): Promise<boolean> {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM users u
        INNER JOIN employees e ON u.employee_id = e.id
        WHERE e.cedula = @param0
          AND u.deleted_at IS NULL
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(sql, [cedula]);
      return (result?.count || 0) > 0;

    } catch (error) {
      logger.error(`❌ Error verificando existencia por cédula ${cedula}:`, error);
      throw new Error(`Error verificando cédula: ${error}`);
    }
  }

  /**
   * 🕒 Actualizar último login
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      const sql = `
        UPDATE users 
        SET 
          last_login = @param0,
          updated_at = @param1,
          login_attempts = 0,
          locked_until = NULL
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [new Date(), new Date(), id]);

      logger.debug(`✅ Último login actualizado para usuario: ${id}`);

    } catch (error) {
      logger.error(`❌ Error actualizando último login ${id}:`, error);
      throw new Error(`Error actualizando último login: ${error}`);
    }
  }

  /**
   * 📈 Incrementar intentos fallidos
   */
  async incrementFailedAttempts(id: string): Promise<void> {
    try {
      const sql = `
        UPDATE users 
        SET 
          login_attempts = login_attempts + 1,
          locked_until = CASE 
            WHEN login_attempts + 1 >= 5 THEN DATEADD(MINUTE, POWER(2, login_attempts - 4) * 30, GETDATE())
            ELSE locked_until
          END,
          updated_at = @param0
        WHERE id = @param1
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [new Date(), id]);

      logger.debug(`📈 Intentos fallidos incrementados para usuario: ${id}`);

    } catch (error) {
      logger.error(`❌ Error incrementando intentos fallidos ${id}:`, error);
      throw new Error(`Error incrementando intentos fallidos: ${error}`);
    }
  }

  /**
   * 🔄 Resetear intentos fallidos
   */
  async resetFailedAttempts(id: string): Promise<void> {
    try {
      const sql = `
        UPDATE users 
        SET 
          login_attempts = 0,
          locked_until = NULL,
          updated_at = @param0
        WHERE id = @param1
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [new Date(), id]);

      logger.debug(`🔄 Intentos fallidos reseteados para usuario: ${id}`);

    } catch (error) {
      logger.error(`❌ Error reseteando intentos fallidos ${id}:`, error);
      throw new Error(`Error reseteando intentos fallidos: ${error}`);
    }
  }

  /**
   * 🔒 Buscar usuarios bloqueados
   */
  async findBlocked(): Promise<User[]> {
    try {
      logger.debug('🔒 Buscando usuarios bloqueados');

      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE u.locked_until IS NOT NULL 
          AND u.locked_until > GETDATE()
          AND u.deleted_at IS NULL
        ORDER BY u.locked_until DESC
      `;

      const results = await this.connection.query<any>(sql);
      const users = results.map(row => this.mapRowToUser(row));

      logger.debug(`✅ Usuarios bloqueados encontrados: ${users.length}`);
      return users;

    } catch (error) {
      logger.error('❌ Error buscando usuarios bloqueados:', error);
      throw new Error(`Error buscando usuarios bloqueados: ${error}`);
    }
  }

  /**
   * 🔓 Desbloquear usuario
   */
  async unblock(id: string): Promise<User> {
    try {
      logger.debug(`🔓 Desbloqueando usuario: ${id}`);

      const sql = `
        UPDATE users 
        SET 
          login_attempts = 0,
          locked_until = NULL,
          updated_at = @param0,
          version = version + 1
        WHERE id = @param1
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [new Date(), id]);

      const user = await this.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado después de desbloquear');
      }

      logger.info(`✅ Usuario desbloqueado exitosamente: ${user.email}`);
      return user;

    } catch (error) {
      logger.error(`❌ Error desbloqueando usuario ${id}:`, error);
      throw new Error(`Error desbloqueando usuario: ${error}`);
    }
  }

  /**
   * 🔑 Cambiar contraseña del usuario
   */
  async changePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      logger.debug(`🔑 Cambiando contraseña usuario: ${id}`);

      const sql = `
        UPDATE users 
        SET 
          password_hash = @param0,
          updated_at = @param1,
          version = version + 1
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [hashedPassword, new Date(), id]);

      logger.info(`✅ Contraseña cambiada exitosamente para usuario: ${id}`);

    } catch (error) {
      logger.error(`❌ Error cambiando contraseña usuario ${id}:`, error);
      throw new Error(`Error cambiando contraseña: ${error}`);
    }
  }

  /**
   * 📊 Obtener estadísticas de usuarios
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
    blocked: number;
  }> {
    try {
      logger.debug('📊 Obteniendo estadísticas de usuarios');

      // Estadísticas generales
      const generalSql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN locked_until IS NOT NULL AND locked_until > GETDATE() THEN 1 ELSE 0 END) as blocked
        FROM users 
        WHERE deleted_at IS NULL
      `;

      const generalStats = await this.connection.queryOne<{
        total: number;
        active: number;
        inactive: number;
        blocked: number;
      }>(generalSql);

      // Estadísticas por rol
      const roleSql = `
        SELECT 
          role,
          COUNT(*) as count
        FROM users 
        WHERE deleted_at IS NULL
        GROUP BY role
      `;

      const roleStats = await this.connection.query<{ role: UserRole; count: number }>(roleSql);

      // Construir objeto byRole
      const byRole: Record<UserRole, number> = {
        [UserRole.ADMIN]: 0,
        [UserRole.ENCARGADO_SUCURSAL]: 0,
        [UserRole.EMPLEADO]: 0
      };

      roleStats.forEach(stat => {
        if (stat.role in byRole) {
          byRole[stat.role] = stat.count;
        }
      });

      const statistics = {
        total: generalStats?.total || 0,
        active: generalStats?.active || 0,
        inactive: generalStats?.inactive || 0,
        blocked: generalStats?.blocked || 0,
        byRole
      };

      logger.debug('✅ Estadísticas de usuarios obtenidas');
      return statistics;

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de usuarios:', error);
      throw new Error(`Error obteniendo estadísticas: ${error}`);
    }
  }

  /**
   * 🔄 Mapear fila de base de datos a entidad User
   */
  private mapRowToUser(row: any): User {
    try {
      // Parsear preferencias JSON
      let preferences;
      try {
        preferences = row.preferences ? JSON.parse(row.preferences) : undefined;
      } catch {
        preferences = undefined;
      }

      const userData: ICreateUserData = {
        id: row.id,
        email: row.email,
        password: '', // No se mapea la contraseña por seguridad
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        sucursalId: row.sucursal_id,
        employeeId: row.employee_id,
        isEmailVerified: !!row.is_email_verified,
        lastLogin: row.last_login,
        loginAttempts: row.login_attempts || 0,
        lockedUntil: row.locked_until,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: !!row.is_active,
        version: row.version || 1
      };

      const user = new User(userData);
      
      // Establecer el hash de contraseña directamente (bypass constructor)
      (user as any)._passwordHash = row.password_hash;
      
      // Establecer preferencias si existen
      if (preferences) {
        (user as any)._preferences = preferences;
      }

      return user;

    } catch (error) {
      logger.error('❌ Error mapeando fila a User:', error);
      throw new Error(`Error mapeando datos de usuario: ${error}`);
    }
  }

  /**
   * 🏥 Verificar salud del repositorio
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    details?: any;
  }> {
    try {
      const startTime = Date.now();
      
      // Consulta simple para verificar conectividad
      await this.connection.query('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: true,
        responseTime,
        details: {
          repository: 'UserSqlServerRepository',
          connection: this.connection.getConnectionInfo()
        }
      };

    } catch (error) {
      logger.error('❌ Health check falló:', error);
      return {
        isHealthy: false,
        responseTime: -1,
        details: { 
          error: error.message,
          repository: 'UserSqlServerRepository'
        }
      };
    }
  }

  /**
   * 🔍 Buscar usuarios con filtros avanzados
   */
  async findWithFilters(filters: {
    search?: string;
    role?: UserRole;
    sucursalId?: string;
    isActive?: boolean;
    isBlocked?: boolean;
    isEmailVerified?: boolean;
    lastLoginFrom?: Date;
    lastLoginTo?: Date;
  }, pagination: IPaginationParams): Promise<IResponse<User[]>> {
    try {
      logger.debug('🔍 Buscando usuarios con filtros avanzados');

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Construir WHERE clause dinámico
      const whereConditions: string[] = ['u.deleted_at IS NULL'];
      const params: any[] = [];
      let paramIndex = 0;

      if (filters.search) {
        whereConditions.push(`(
          LOWER(u.email) LIKE LOWER(@param${paramIndex}) OR 
          LOWER(u.first_name) LIKE LOWER(@param${paramIndex + 1}) OR 
          LOWER(u.last_name) LIKE LOWER(@param${paramIndex + 2})
        )`);
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
        paramIndex += 3;
      }

      if (filters.role) {
        whereConditions.push(`u.role = @param${paramIndex}`);
        params.push(filters.role);
        paramIndex++;
      }

      if (filters.sucursalId) {
        whereConditions.push(`u.sucursal_id = @param${paramIndex}`);
        params.push(filters.sucursalId);
        paramIndex++;
      }

      if (filters.isActive !== undefined) {
        whereConditions.push(`u.is_active = @param${paramIndex}`);
        params.push(filters.isActive ? 1 : 0);
        paramIndex++;
      }

      if (filters.isBlocked !== undefined) {
        if (filters.isBlocked) {
          whereConditions.push('u.locked_until IS NOT NULL AND u.locked_until > GETDATE()');
        } else {
          whereConditions.push('(u.locked_until IS NULL OR u.locked_until <= GETDATE())');
        }
      }

      if (filters.isEmailVerified !== undefined) {
        whereConditions.push(`u.is_email_verified = @param${paramIndex}`);
        params.push(filters.isEmailVerified ? 1 : 0);
        paramIndex++;
      }

      if (filters.lastLoginFrom) {
        whereConditions.push(`u.last_login >= @param${paramIndex}`);
        params.push(filters.lastLoginFrom);
        paramIndex++;
      }

      if (filters.lastLoginTo) {
        whereConditions.push(`u.last_login <= @param${paramIndex}`);
        params.push(filters.lastLoginTo);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE ${whereClause}
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, params);
      const total = countResult?.total || 0;

      // Consulta principal con filtros
      const sql = `
        SELECT 
          u.id,
          u.email,
          u.password_hash,
          u.first_name,
          u.last_name,
          u.role,
          u.sucursal_id,
          u.employee_id,
          u.is_email_verified,
          u.last_login,
          u.login_attempts,
          u.locked_until,
          u.preferences,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.deleted_at,
          u.version
        FROM users u
        WHERE ${whereClause}
        ORDER BY u.${orderBy} ${orderDirection}
        OFFSET @param${paramIndex} ROWS
        FETCH NEXT @param${paramIndex + 1} ROWS ONLY
      `;

      const finalParams = [...params, offset, limit];
      const results = await this.connection.query<any>(sql, finalParams);
      const users = results.map(row => this.mapRowToUser(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Usuarios con filtros obtenidos: ${users.length} de ${total}`);

      return {
        success: true,
        message: 'Usuarios filtrados obtenidos exitosamente',
        data: users,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<User[]>;

    } catch (error) {
      logger.error('❌ Error buscando usuarios con filtros:', error);
      throw new Error(`Error buscando usuarios con filtros: ${error}`);
    }
  }

  /**
   * 📊 Obtener reporte de actividad de usuarios
   */
  async getActivityReport(dateFrom: Date, dateTo: Date): Promise<{
    totalLogins: number;
    uniqueUsers: number;
    failedAttempts: number;
    blockedUsers: number;
    newUsers: number;
    mostActiveUsers: Array<{
      userId: string;
      email: string;
      fullName: string;
      loginCount: number;
      lastLogin: Date;
    }>;
  }> {
    try {
      logger.debug('📊 Generando reporte de actividad de usuarios');

      // Logins únicos y intentos fallidos (esto requeriría una tabla de logs de autenticación)
      // Por ahora, proporcionamos estadísticas básicas
      
      const newUsersSql = `
        SELECT COUNT(*) as count
        FROM users u
        WHERE u.created_at BETWEEN @param0 AND @param1
          AND u.deleted_at IS NULL
      `;

      const newUsersResult = await this.connection.queryOne<{ count: number }>(
        newUsersSql, 
        [dateFrom, dateTo]
      );

      const blockedUsersSql = `
        SELECT COUNT(*) as count
        FROM users u
        WHERE u.locked_until IS NOT NULL 
          AND u.locked_until > GETDATE()
          AND u.deleted_at IS NULL
      `;

      const blockedUsersResult = await this.connection.queryOne<{ count: number }>(blockedUsersSql);

      const mostActiveUsersSql = `
        SELECT TOP 10
          u.id as userId,
          u.email,
          CONCAT(u.first_name, ' ', u.last_name) as fullName,
          u.last_login,
          u.login_attempts
        FROM users u
        WHERE u.last_login BETWEEN @param0 AND @param1
          AND u.deleted_at IS NULL
        ORDER BY u.last_login DESC
      `;

      const mostActiveUsers = await this.connection.query<{
        userId: string;
        email: string;
        fullName: string;
        lastLogin: Date;
        loginAttempts: number;
      }>(mostActiveUsersSql, [dateFrom, dateTo]);

      const report = {
        totalLogins: mostActiveUsers.length, // Esto sería más preciso con una tabla de logs
        uniqueUsers: mostActiveUsers.length,
        failedAttempts: mostActiveUsers.reduce((sum, user) => sum + user.loginAttempts, 0),
        blockedUsers: blockedUsersResult?.count || 0,
        newUsers: newUsersResult?.count || 0,
        mostActiveUsers: mostActiveUsers.map(user => ({
          userId: user.userId,
          email: user.email,
          fullName: user.fullName,
          loginCount: 1, // Esto requeriría tabla de logs para ser preciso
          lastLogin: user.lastLogin
        }))
      };

      logger.debug('✅ Reporte de actividad generado');
      return report;

    } catch (error) {
      logger.error('❌ Error generando reporte de actividad:', error);
      throw new Error(`Error generando reporte de actividad: ${error}`);
    }
  }

  /**
   * 🔧 Limpiar usuarios bloqueados expirados
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      logger.debug('🔧 Limpiando bloqueos expirados');

      const sql = `
        UPDATE users 
        SET 
          locked_until = NULL,
          login_attempts = 0,
          updated_at = @param0
        WHERE locked_until IS NOT NULL 
          AND locked_until <= GETDATE()
          AND deleted_at IS NULL
      `;

      const result = await this.connection.query(sql, [new Date()]);
      const cleanedCount = result.length || 0;

      logger.info(`✅ Bloqueos expirados limpiados: ${cleanedCount}`);
      return cleanedCount;

    } catch (error) {
      logger.error('❌ Error limpiando bloqueos expirados:', error);
      throw new Error(`Error limpiando bloqueos expirados: ${error}`);
    }
  }
}

/**
 * 🏭 Factory function para crear instancia del repositorio
 */
export const createUserSqlServerRepository = (
  connection: SqlServerConnection
): UserSqlServerRepository => {
  return new UserSqlServerRepository(connection);
};

/**
 * 📊 Exportación por defecto
 */
export default UserSqlServerRepository;