/**
 * AREA POSTGRESQL REPOSITORY
 * Implementación de repositorio de áreas para PostgreSQL
 * Maneja todas las operaciones de persistencia para la entidad Area
 */

import { Pool, PoolClient } from 'pg';
import { Area } from '@core/entities/area.entity';
import { IAreaRepository } from '@core/interfaces/repositories/area.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

export class AreaPostgresRepository implements IAreaRepository {
  constructor(private pool: Pool) {}

  /**
   * Buscar área por ID
   */
  async findById(id: string): Promise<Area | null> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, deleted_at, version
        FROM areas 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToArea(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando área por ID', 'AreaPostgresRepository', { id }, error as Error);
      throw new Error(`Error al buscar área: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar área por código
   */
  async findByCode(code: string): Promise<Area | null> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, deleted_at, version
        FROM areas 
        WHERE codigo = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [code.toUpperCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToArea(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando área por código', 'AreaPostgresRepository', { code }, error as Error);
      throw new Error(`Error al buscar área: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar área por nombre
   */
  async findByName(name: string): Promise<Area | null> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, deleted_at, version
        FROM areas 
        WHERE LOWER(nombre) = LOWER($1) AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [name]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToArea(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando área por nombre', 'AreaPostgresRepository', { name }, error as Error);
      throw new Error(`Error al buscar área: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar áreas por sucursal
   */
  async findBySucursal(sucursalId: string): Promise<Area[]> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, deleted_at, version
        FROM areas 
        WHERE sucursal_id = $1 AND deleted_at IS NULL
        ORDER BY orden, nombre
      `;
      
      const result = await this.pool.query(query, [sucursalId]);
      return result.rows.map(row => this.mapRowToArea(row));
    } catch (error) {
      logger.error('Error buscando áreas por sucursal', 'AreaPostgresRepository', { sucursalId }, error as Error);
      throw new Error(`Error al buscar áreas: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todas las áreas
   */
  async findAll(pagination: IPagination): Promise<IResponse<Area[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM areas 
        WHERE deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, deleted_at, version
        FROM areas 
        WHERE deleted_at IS NULL
        ORDER BY orden, nombre
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const areas = dataResult.rows.map(row => this.mapRowToArea(row));

      return {
        success: true,
        message: 'Áreas obtenidas exitosamente',
        data: areas,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo todas las áreas', 'AreaPostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener áreas: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar áreas activas
   */
  async findActive(): Promise<Area[]> {
    try {
      const query = `
        SELECT 
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, deleted_at, version
        FROM areas 
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY orden, nombre
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => this.mapRowToArea(row));
    } catch (error) {
      logger.error('Error obteniendo áreas activas', 'AreaPostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener áreas activas: ${(error as Error).message}`);
    }
  }

  /**
   * Crear nueva área
   */
  async create(area: Area): Promise<Area> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO areas (
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          schedule, limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden, is_active,
          created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16
        )
        RETURNING *
      `;

      const values = [
        area.id,
        area.nombre,
        area.codigo,
        area.sucursalId,
        area.descripcion || null,
        area.supervisor || null,
        area.schedule ? JSON.stringify(area.schedule.toJSON()) : null,
        area.limiteHorasSemanales || null,
        area.limiteHorasExtrasSemanales || null,
        area.requiereAprobacionExtras,
        area.color || null,
        area.orden,
        area.isActive,
        area.createdAt,
        area.updatedAt,
        area.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Área creada exitosamente', 'AreaPostgresRepository', { 
        id: area.id, 
        codigo: area.codigo 
      });
      
      return this.mapRowToArea(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando área', 'AreaPostgresRepository', { 
        codigo: area.codigo 
      }, error as Error);
      
      if ((error as any)?.code === '23505') {
        throw new Error('El código de área ya está registrado en esta sucursal');
      }
      
      throw new Error(`Error al crear área: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar área existente
   */
  async update(id: string, areaData: Partial<Area>): Promise<Area> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar que el área existe
      const existingArea = await this.findById(id);
      if (!existingArea) {
        throw new Error('Área no encontrada');
      }

      // Construir query dinámicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (areaData.nombre !== undefined) {
        updateFields.push(`nombre = $${paramIndex++}`);
        values.push(areaData.nombre);
      }

      if (areaData.descripcion !== undefined) {
        updateFields.push(`descripcion = $${paramIndex++}`);
        values.push(areaData.descripcion);
      }

      if (areaData.supervisor !== undefined) {
        updateFields.push(`supervisor = $${paramIndex++}`);
        values.push(areaData.supervisor);
      }

      if (areaData.schedule !== undefined) {
        updateFields.push(`schedule = $${paramIndex++}`);
        values.push(areaData.schedule ? JSON.stringify(areaData.schedule) : null);
      }

      if (areaData.limiteHorasSemanales !== undefined) {
        updateFields.push(`limite_horas_semanales = $${paramIndex++}`);
        values.push(areaData.limiteHorasSemanales);
      }

      if (areaData.limiteHorasExtrasSemanales !== undefined) {
        updateFields.push(`limite_horas_extras_semanales = $${paramIndex++}`);
        values.push(areaData.limiteHorasExtrasSemanales);
      }

      if (areaData.requiereAprobacionExtras !== undefined) {
        updateFields.push(`requiere_aprobacion_extras = $${paramIndex++}`);
        values.push(areaData.requiereAprobacionExtras);
      }

      if (areaData.color !== undefined) {
        updateFields.push(`color = $${paramIndex++}`);
        values.push(areaData.color);
      }

      if (areaData.orden !== undefined) {
        updateFields.push(`orden = $${paramIndex++}`);
        values.push(areaData.orden);
      }

      if (areaData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(areaData.isActive);
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      updateFields.push(`version = $${paramIndex++}`);
      values.push(existingArea.version + 1);

      // ID para WHERE
      values.push(id);

      const query = `
        UPDATE areas 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Área no encontrada para actualizar');
      }

      logger.info('Área actualizada exitosamente', 'AreaPostgresRepository', { id });
      return this.mapRowToArea(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando área', 'AreaPostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar área: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar área (soft delete)
   */
  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE areas 
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Área no encontrada para eliminar');
      }

      logger.info('Área eliminada exitosamente', 'AreaPostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando área', 'AreaPostgresRepository', { id }, error as Error);
      throw new Error(`Error al eliminar área: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Activar/desactivar área
   */
  async toggleActive(id: string): Promise<Area> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE areas 
        SET is_active = NOT is_active, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Área no encontrada');
      }

      logger.info('Estado de área cambiado', 'AreaPostgresRepository', { id });
      return this.mapRowToArea(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando estado de área', 'AreaPostgresRepository', { id }, error as Error);
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si existe área con el código dado en la sucursal
   */
  async existsByCodeInSucursal(code: string, sucursalId: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM areas 
        WHERE codigo = $1 AND sucursal_id = $2 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [code.toUpperCase(), sucursalId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por código en sucursal', 'AreaPostgresRepository', { code, sucursalId }, error as Error);
      throw new Error(`Error al verificar código: ${(error as Error).message}`);
    }
  }

  /**
   * Verificar si existe área con el nombre dado en la sucursal
   */
  async existsByNameInSucursal(name: string, sucursalId: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM areas 
        WHERE LOWER(nombre) = LOWER($1) AND sucursal_id = $2 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [name, sucursalId]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por nombre en sucursal', 'AreaPostgresRepository', { name, sucursalId }, error as Error);
      throw new Error(`Error al verificar nombre: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener áreas con estadísticas de empleados
   */
  async findWithEmployeeStats(sucursalId?: string): Promise<Array<Area & {
    totalEmployees: number;
    activeEmployees: number;
  }>> {
    try {
      const whereClause = sucursalId ? 'WHERE a.sucursal_id = $1 AND a.deleted_at IS NULL' : 'WHERE a.deleted_at IS NULL';
      const params = sucursalId ? [sucursalId] : [];

      const query = `
        SELECT 
          a.id, a.nombre, a.codigo, a.sucursal_id, a.descripcion, a.supervisor,
          a.schedule, a.limite_horas_semanales, a.limite_horas_extras_semanales,
          a.requiere_aprobacion_extras, a.color, a.orden, a.is_active,
          a.created_at, a.updated_at, a.deleted_at, a.version,
          COALESCE(emp_stats.total_employees, 0) as total_employees,
          COALESCE(emp_stats.active_employees, 0) as active_employees
        FROM areas a
        LEFT JOIN (
          SELECT 
            area_id,
            COUNT(*) as total_employees,
            SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_employees
          FROM employees 
          WHERE deleted_at IS NULL
          GROUP BY area_id
        ) emp_stats ON a.id = emp_stats.area_id
        ${whereClause}
        ORDER BY a.orden, a.nombre
      `;
      
      const result = await this.pool.query(query, params);
      return result.rows.map(row => {
        const area = this.mapRowToArea(row);
        return Object.assign(area, {
          totalEmployees: parseInt(row.total_employees) || 0,
          activeEmployees: parseInt(row.active_employees) || 0,
        });
      });
    } catch (error) {
      logger.error('Error obteniendo áreas con estadísticas', 'AreaPostgresRepository', { sucursalId }, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener estadísticas de áreas
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    bySucursal: Record<string, number>;
    withEmployees: number;
    withoutEmployees: number;
  }> {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM areas WHERE deleted_at IS NULL',
        'SELECT COUNT(*) as active FROM areas WHERE is_active = true AND deleted_at IS NULL',
        'SELECT COUNT(*) as inactive FROM areas WHERE is_active = false AND deleted_at IS NULL',
        'SELECT sucursal_id, COUNT(*) as count FROM areas WHERE deleted_at IS NULL GROUP BY sucursal_id',
        `SELECT COUNT(DISTINCT a.id) as with_employees 
         FROM areas a 
         INNER JOIN employees e ON e.area_id = a.id 
         WHERE a.deleted_at IS NULL AND e.deleted_at IS NULL`,
        `SELECT COUNT(*) as without_employees 
         FROM areas a 
         WHERE a.deleted_at IS NULL 
         AND NOT EXISTS (
           SELECT 1 FROM employees e 
           WHERE e.area_id = a.id AND e.deleted_at IS NULL
         )`
      ];

      const [totalResult, activeResult, inactiveResult, bySucursalResult, withEmployeesResult, withoutEmployeesResult] = await Promise.all([
        this.pool.query(queries[0]),
        this.pool.query(queries[1]),
        this.pool.query(queries[2]),
        this.pool.query(queries[3]),
        this.pool.query(queries[4]),
        this.pool.query(queries[5])
      ]);

      const bySucursal: Record<string, number> = {};
      bySucursalResult.rows.forEach(row => {
        bySucursal[row.sucursal_id] = parseInt(row.count);
      });

      return {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        inactive: parseInt(inactiveResult.rows[0].inactive),
        bySucursal,
        withEmployees: parseInt(withEmployeesResult.rows[0].with_employees),
        withoutEmployees: parseInt(withoutEmployeesResult.rows[0].without_employees)
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de áreas', 'AreaPostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto Area
   */
  private mapRowToArea(row: any): Area {
    const areaData = {
      id: row.id,
      nombre: row.nombre,
      codigo: row.codigo,
      sucursalId: row.sucursal_id,
      descripcion: row.descripcion,
      supervisor: row.supervisor,
      schedule: row.schedule ? (typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule) : undefined,
      limiteHorasSemanales: row.limite_horas_semanales,
      limiteHorasExtrasSemanales: row.limite_horas_extras_semanales,
      requiereAprobacionExtras: row.requiere_aprobacion_extras,
      color: row.color,
      orden: row.orden,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };

    return new Area(areaData);
  }
}

export default AreaPostgresRepository;