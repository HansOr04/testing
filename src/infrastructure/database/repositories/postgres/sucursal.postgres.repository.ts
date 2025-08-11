/**
 * SUCURSAL POSTGRESQL REPOSITORY
 * Implementación de repositorio de sucursales para PostgreSQL
 * Maneja todas las operaciones de persistencia para la entidad Sucursal
 */

import { Pool, PoolClient } from 'pg';
import { Sucursal } from '@core/entities/sucursal.entity';
import { ISucursalRepository } from '@core/interfaces/repositories/sucursal.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

export class SucursalPostgresRepository implements ISucursalRepository {
  constructor(private pool: Pool) {}

  /**
   * Buscar sucursal por ID
   */
  async findById(id: string): Promise<Sucursal | null> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, direccion, ciudad, provincia, telefono,
          email, gerente, capacidad_empleados, horario_apertura, 
          horario_cierre, timezone, descripcion, is_active,
          created_at, updated_at, deleted_at, version
        FROM sucursales 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToSucursal(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando sucursal por ID', 'SucursalPostgresRepository', { id }, error as Error);
      throw new Error(`Error al buscar sucursal: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar sucursal por código
   */
  async findByCode(code: string): Promise<Sucursal | null> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, direccion, ciudad, provincia, telefono,
          email, gerente, capacidad_empleados, horario_apertura, 
          horario_cierre, timezone, descripcion, is_active,
          created_at, updated_at, deleted_at, version
        FROM sucursales 
        WHERE codigo = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [code.toUpperCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToSucursal(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando sucursal por código', 'SucursalPostgresRepository', { code }, error as Error);
      throw new Error(`Error al buscar sucursal: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar sucursal por nombre
   */
  async findByName(name: string): Promise<Sucursal | null> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, direccion, ciudad, provincia, telefono,
          email, gerente, capacidad_empleados, horario_apertura, 
          horario_cierre, timezone, descripcion, is_active,
          created_at, updated_at, deleted_at, version
        FROM sucursales 
        WHERE LOWER(nombre) = LOWER($1) AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [name]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToSucursal(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando sucursal por nombre', 'SucursalPostgresRepository', { name }, error as Error);
      throw new Error(`Error al buscar sucursal: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todas las sucursales
   */
  async findAll(pagination: IPagination): Promise<IResponse<Sucursal[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM sucursales 
        WHERE deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, nombre, codigo, direccion, ciudad, provincia, telefono,
          email, gerente, capacidad_empleados, horario_apertura, 
          horario_cierre, timezone, descripcion, is_active,
          created_at, updated_at, deleted_at, version
        FROM sucursales 
        WHERE deleted_at IS NULL
        ORDER BY nombre
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const sucursales = dataResult.rows.map(row => this.mapRowToSucursal(row));

      return {
        success: true,
        message: 'Sucursales obtenidas exitosamente',
        data: sucursales,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo todas las sucursales', 'SucursalPostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener sucursales: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar sucursales activas
   */
  async findActive(): Promise<Sucursal[]> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, direccion, ciudad, provincia, telefono,
          email, gerente, capacidad_empleados, horario_apertura, 
          horario_cierre, timezone, descripcion, is_active,
          created_at, updated_at, deleted_at, version
        FROM sucursales 
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY nombre
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => this.mapRowToSucursal(row));
    } catch (error) {
      logger.error('Error obteniendo sucursales activas', 'SucursalPostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener sucursales activas: ${(error as Error).message}`);
    }
  }

  /**
   * Crear nueva sucursal
   */
  async create(sucursal: Sucursal): Promise<Sucursal> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO sucursales (
          id, nombre, codigo, direccion, ciudad, provincia, telefono,
          email, gerente, capacidad_empleados, horario_apertura, 
          horario_cierre, timezone, descripcion, is_active,
          created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING *
      `;

      const values = [
        sucursal.id,
        sucursal.nombre,
        sucursal.codigo,
        sucursal.direccion,
        sucursal.ciudad,
        sucursal.provincia,
        sucursal.telefono || null,
        sucursal.email || null,
        sucursal.gerente || null,
        sucursal.capacidadEmpleados || null,
        sucursal.horarioApertura || null,
        sucursal.horarioCierre || null,
        sucursal.timezone,
        sucursal.descripcion || null,
        sucursal.isActive,
        sucursal.createdAt,
        sucursal.updatedAt,
        sucursal.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Sucursal creada exitosamente', 'SucursalPostgresRepository', { 
        id: sucursal.id, 
        codigo: sucursal.codigo 
      });
      
      return this.mapRowToSucursal(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando sucursal', 'SucursalPostgresRepository', { 
        codigo: sucursal.codigo 
      }, error as Error);
      
      if ((error as any)?.code === '23505') {
        throw new Error('El código de sucursal ya está registrado');
      }
      
      throw new Error(`Error al crear sucursal: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar sucursal existente
   */
  async update(id: string, sucursalData: Partial<Sucursal>): Promise<Sucursal> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar que la sucursal existe
      const existingSucursal = await this.findById(id);
      if (!existingSucursal) {
        throw new Error('Sucursal no encontrada');
      }

      // Construir query dinámicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (sucursalData.nombre !== undefined) {
        updateFields.push(`nombre = ${paramIndex++}`);
        values.push(sucursalData.nombre);
      }

      if (sucursalData.direccion !== undefined) {
        updateFields.push(`direccion = ${paramIndex++}`);
        values.push(sucursalData.direccion);
      }

      if (sucursalData.ciudad !== undefined) {
        updateFields.push(`ciudad = ${paramIndex++}`);
        values.push(sucursalData.ciudad);
      }

      if (sucursalData.provincia !== undefined) {
        updateFields.push(`provincia = ${paramIndex++}`);
        values.push(sucursalData.provincia);
      }

      if (sucursalData.telefono !== undefined) {
        updateFields.push(`telefono = ${paramIndex++}`);
        values.push(sucursalData.telefono);
      }

      if (sucursalData.email !== undefined) {
        updateFields.push(`email = ${paramIndex++}`);
        values.push(sucursalData.email);
      }

      if (sucursalData.gerente !== undefined) {
        updateFields.push(`gerente = ${paramIndex++}`);
        values.push(sucursalData.gerente);
      }

      if (sucursalData.capacidadEmpleados !== undefined) {
        updateFields.push(`capacidad_empleados = ${paramIndex++}`);
        values.push(sucursalData.capacidadEmpleados);
      }

      if (sucursalData.horarioApertura !== undefined) {
        updateFields.push(`horario_apertura = ${paramIndex++}`);
        values.push(sucursalData.horarioApertura);
      }

      if (sucursalData.horarioCierre !== undefined) {
        updateFields.push(`horario_cierre = ${paramIndex++}`);
        values.push(sucursalData.horarioCierre);
      }

      if (sucursalData.timezone !== undefined) {
        updateFields.push(`timezone = ${paramIndex++}`);
        values.push(sucursalData.timezone);
      }

      if (sucursalData.descripcion !== undefined) {
        updateFields.push(`descripcion = ${paramIndex++}`);
        values.push(sucursalData.descripcion);
      }

      if (sucursalData.isActive !== undefined) {
        updateFields.push(`is_active = ${paramIndex++}`);
        values.push(sucursalData.isActive);
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = ${paramIndex++}`);
      values.push(new Date());

      updateFields.push(`version = ${paramIndex++}`);
      values.push(existingSucursal.version + 1);

      // ID para WHERE
      values.push(id);

      const query = `
        UPDATE sucursales 
        SET ${updateFields.join(', ')}
        WHERE id = ${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Sucursal no encontrada para actualizar');
      }

      logger.info('Sucursal actualizada exitosamente', 'SucursalPostgresRepository', { id });
      return this.mapRowToSucursal(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando sucursal', 'SucursalPostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar sucursal: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar sucursal (soft delete)
   */
  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE sucursales 
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Sucursal no encontrada para eliminar');
      }

      logger.info('Sucursal eliminada exitosamente', 'SucursalPostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando sucursal', 'SucursalPostgresRepository', { id }, error as Error);
      throw new Error(`Error al eliminar sucursal: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Activar/desactivar sucursal
   */
  async toggleActive(id: string): Promise<Sucursal> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE sucursales 
        SET is_active = NOT is_active, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Sucursal no encontrada');
      }

      logger.info('Estado de sucursal cambiado', 'SucursalPostgresRepository', { id });
      return this.mapRowToSucursal(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando estado de sucursal', 'SucursalPostgresRepository', { id }, error as Error);
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si existe sucursal con el código dado
   */
  async existsByCode(code: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM sucursales 
        WHERE codigo = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [code.toUpperCase()]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por código', 'SucursalPostgresRepository', { code }, error as Error);
      throw new Error(`Error al verificar código: ${(error as Error).message}`);
    }
  }

  /**
   * Verificar si existe sucursal con el nombre dado
   */
  async existsByName(name: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM sucursales 
        WHERE LOWER(nombre) = LOWER($1) AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [name]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por nombre', 'SucursalPostgresRepository', { name }, error as Error);
      throw new Error(`Error al verificar nombre: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener sucursales con estadísticas de empleados
   */
  async findWithEmployeeStats(): Promise<Array<Sucursal & {
    totalEmployees: number;
    activeEmployees: number;
    administrativeEmployees: number;
    regularEmployees: number;
  }>> {
    try {
      const query = `
        SELECT 
          s.id, s.nombre, s.codigo, s.direccion, s.ciudad, s.provincia, s.telefono,
          s.email, s.gerente, s.capacidad_empleados, s.horario_apertura, 
          s.horario_cierre, s.timezone, s.descripcion, s.is_active,
          s.created_at, s.updated_at, s.deleted_at, s.version,
          COALESCE(emp_stats.total_employees, 0) as total_employees,
          COALESCE(emp_stats.active_employees, 0) as active_employees,
          COALESCE(emp_stats.administrative_employees, 0) as administrative_employees,
          COALESCE(emp_stats.regular_employees, 0) as regular_employees
        FROM sucursales s
        LEFT JOIN (
          SELECT 
            primary_sucursal_id,
            COUNT(*) as total_employees,
            SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_employees,
            SUM(CASE WHEN employee_type = 'ADMINISTRATIVO' THEN 1 ELSE 0 END) as administrative_employees,
            SUM(CASE WHEN employee_type = 'REGULAR' THEN 1 ELSE 0 END) as regular_employees
          FROM employees 
          WHERE deleted_at IS NULL
          GROUP BY primary_sucursal_id
        ) emp_stats ON s.id = emp_stats.primary_sucursal_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.nombre
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => {
        const sucursal = this.mapRowToSucursal(row);
        return Object.assign(sucursal, {
          totalEmployees: parseInt(row.total_employees) || 0,
          activeEmployees: parseInt(row.active_employees) || 0,
          administrativeEmployees: parseInt(row.administrative_employees) || 0,
          regularEmployees: parseInt(row.regular_employees) || 0,
        });
      });
    } catch (error) {
      logger.error('Error obteniendo sucursales con estadísticas', 'SucursalPostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener estadísticas de la sucursal
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDevices: number;
    withoutDevices: number;
  }> {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM sucursales WHERE deleted_at IS NULL',
        'SELECT COUNT(*) as active FROM sucursales WHERE is_active = true AND deleted_at IS NULL',
        'SELECT COUNT(*) as inactive FROM sucursales WHERE is_active = false AND deleted_at IS NULL',
        `SELECT COUNT(DISTINCT s.id) as with_devices 
         FROM sucursales s 
         INNER JOIN biometric_devices bd ON bd.sucursal_id = s.id 
         WHERE s.deleted_at IS NULL AND bd.deleted_at IS NULL`,
        `SELECT COUNT(*) as without_devices 
         FROM sucursales s 
         WHERE s.deleted_at IS NULL 
         AND NOT EXISTS (
           SELECT 1 FROM biometric_devices bd 
           WHERE bd.sucursal_id = s.id AND bd.deleted_at IS NULL
         )`
      ];

      const [totalResult, activeResult, inactiveResult, withDevicesResult, withoutDevicesResult] = await Promise.all([
        this.pool.query(queries[0]),
        this.pool.query(queries[1]),
        this.pool.query(queries[2]),
        this.pool.query(queries[3]),
        this.pool.query(queries[4])
      ]);

      return {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        inactive: parseInt(inactiveResult.rows[0].inactive),
        withDevices: parseInt(withDevicesResult.rows[0].with_devices),
        withoutDevices: parseInt(withoutDevicesResult.rows[0].without_devices)
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de sucursales', 'SucursalPostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto Sucursal
   */
  private mapRowToSucursal(row: any): Sucursal {
    const sucursalData = {
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      direccion: row.direccion,
      ciudad: row.ciudad,
      provincia: row.provincia,
      telefono: row.telefono,
      email: row.email,
      gerente: row.gerente,
      capacidadEmpleados: row.capacidad_empleados,
      horarioApertura: row.horario_apertura,
      horarioCierre: row.horario_cierre,
      timezone: row.timezone,
      descripcion: row.descripcion,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };

    return new Sucursal(sucursalData);
  }
}

export default SucursalPostgresRepository;