// src/infrastructure/database/repositories/sqlserver/area.sqlserver.repository.ts

import { IAreaRepository } from '@/core/interfaces/repositories/area.repository.interface';
import { Area } from '@/core/entities/area.entity';
import { SqlServerConnection } from '@/infrastructure/database/connections/sqlserver.connection';
import { IResponse, IPagination } from '@/shared/types/common.types';
import { getLogger } from '@/shared/utils/logger.util';

const logger = getLogger();

/**
 * 🏭 SQL Server Repository para Áreas
 * Implementación completa para gestión de áreas de trabajo
 */
export class AreaSqlServerRepository implements IAreaRepository {
  constructor(private connection: SqlServerConnection) {}

  async findById(id: string): Promise<Area | null> {
    try {
      const query = `
        SELECT a.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        LEFT JOIN employees e ON a.id = e.area_id AND e.deleted_at IS NULL
        WHERE a.id = @param0 AND a.deleted_at IS NULL
        GROUP BY a.id, a.nombre, a.codigo, a.sucursal_id, a.descripcion,
                 a.supervisor, a.limite_horas_semanales, a.limite_horas_extras_semanales,
                 a.requiere_aprobacion_extras, a.color, a.orden,
                 a.created_at, a.updated_at, a.is_active, s.nombre
      `;

      const result = await this.connection.queryOne<any>(query, [id]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando área por ID', 'AreaRepository', { id }, error as Error);
      throw new Error(`Error buscando área: ${error}`);
    }
  }

  async findByCode(code: string): Promise<Area | null> {
    try {
      const query = `
        SELECT a.*, s.nombre as sucursal_name
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        WHERE a.codigo = @param0 AND a.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [code.toUpperCase()]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando área por código', 'AreaRepository', { code }, error as Error);
      throw new Error(`Error buscando área: ${error}`);
    }
  }

  async findByName(name: string): Promise<Area | null> {
    try {
      const query = `
        SELECT a.*, s.nombre as sucursal_name
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        WHERE a.nombre = @param0 AND a.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [name]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando área por nombre', 'AreaRepository', { name }, error as Error);
      throw new Error(`Error buscando área: ${error}`);
    }
  }

  async findBySucursal(sucursalId: string): Promise<Area[]> {
    try {
      const query = `
        SELECT a.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        LEFT JOIN employees e ON a.id = e.area_id AND e.deleted_at IS NULL
        WHERE a.sucursal_id = @param0 AND a.deleted_at IS NULL
        GROUP BY a.id, a.nombre, a.codigo, a.sucursal_id, a.descripcion,
                 a.supervisor, a.limite_horas_semanales, a.limite_horas_extras_semanales,
                 a.requiere_aprobacion_extras, a.color, a.orden,
                 a.created_at, a.updated_at, a.is_active, s.nombre
        ORDER BY a.orden ASC, a.nombre ASC
      `;

      const results = await this.connection.query<any>(query, [sucursalId]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando áreas por sucursal', 'AreaRepository', { sucursalId }, error as Error);
      throw new Error(`Error buscando áreas: ${error}`);
    }
  }

  async findAll(pagination: IPagination): Promise<IResponse<Area[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM areas 
        WHERE deleted_at IS NULL
      `;

      const totalResult = await this.connection.queryOne<{ total: number }>(countQuery);
      const total = totalResult?.total || 0;

      const dataQuery = `
        SELECT a.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        LEFT JOIN employees e ON a.id = e.area_id AND e.deleted_at IS NULL
        WHERE a.deleted_at IS NULL
        GROUP BY a.id, a.nombre, a.codigo, a.sucursal_id, a.descripcion,
                 a.supervisor, a.limite_horas_semanales, a.limite_horas_extras_semanales,
                 a.requiere_aprobacion_extras, a.color, a.orden,
                 a.created_at, a.updated_at, a.is_active, s.nombre
        ORDER BY s.nombre ASC, a.orden ASC, a.nombre ASC
        OFFSET @param0 ROWS FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(dataQuery, [offset, pagination.limit]);
      const areas = results.map(r => this.mapToEntity(r));

      return {
        success: true,
        message: 'Áreas encontradas',
        data: areas,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando todas las áreas', 'AreaRepository', {}, error as Error);
      throw new Error(`Error buscando áreas: ${error}`);
    }
  }

  async findActive(): Promise<Area[]> {
    try {
      const query = `
        SELECT a.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        LEFT JOIN employees e ON a.id = e.area_id AND e.deleted_at IS NULL
        WHERE a.is_active = 1 AND a.deleted_at IS NULL
        GROUP BY a.id, a.nombre, a.codigo, a.sucursal_id, a.descripcion,
                 a.supervisor, a.limite_horas_semanales, a.limite_horas_extras_semanales,
                 a.requiere_aprobacion_extras, a.color, a.orden,
                 a.created_at, a.updated_at, a.is_active, s.nombre
        ORDER BY s.nombre ASC, a.orden ASC, a.nombre ASC
      `;

      const results = await this.connection.query<any>(query);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando áreas activas', 'AreaRepository', {}, error as Error);
      throw new Error(`Error buscando áreas activas: ${error}`);
    }
  }

  async create(area: Area): Promise<Area> {
    try {
      const query = `
        INSERT INTO areas (
          id, nombre, codigo, sucursal_id, descripcion, supervisor,
          limite_horas_semanales, limite_horas_extras_semanales,
          requiere_aprobacion_extras, color, orden,
          created_at, updated_at, is_active
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5,
          @param6, @param7, @param8, @param9, @param10,
          @param11, @param12, @param13
        )
      `;

      const areaData = area.toJSON() as any;

      await this.connection.query(query, [
        area.id,
        areaData.nombre,
        areaData.codigo,
        areaData.sucursalId,
        areaData.descripcion,
        areaData.supervisor,
        areaData.limiteHorasSemanales,
        areaData.limiteHorasExtrasSemanales,
        areaData.requiereAprobacionExtras ? 1 : 0,
        areaData.color,
        areaData.orden,
        new Date(),
        new Date(),
        1
      ]);

      logger.info('Área creada', 'AreaRepository', { areaId: area.id });
      return area;
    } catch (error) {
      logger.error('Error creando área', 'AreaRepository', { areaId: area.id }, error as Error);
      throw new Error(`Error creando área: ${error}`);
    }
  }

  async update(id: string, area: Partial<Area>): Promise<Area> {
    try {
      const areaData = area as any;
      const query = `
        UPDATE areas SET
          nombre = COALESCE(@param1, nombre),
          descripcion = COALESCE(@param2, descripcion),
          supervisor = COALESCE(@param3, supervisor),
          limite_horas_semanales = COALESCE(@param4, limite_horas_semanales),
          limite_horas_extras_semanales = COALESCE(@param5, limite_horas_extras_semanales),
          requiere_aprobacion_extras = COALESCE(@param6, requiere_aprobacion_extras),
          color = COALESCE(@param7, color),
          orden = COALESCE(@param8, orden),
          updated_at = @param9
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [
        id,
        areaData.nombre,
        areaData.descripcion,
        areaData.supervisor,
        areaData.limiteHorasSemanales,
        areaData.limiteHorasExtrasSemanales,
        areaData.requiereAprobacionExtras !== undefined ? (areaData.requiereAprobacionExtras ? 1 : 0) : null,
        areaData.color,
        areaData.orden,
        new Date()
      ]);

      const updatedArea = await this.findById(id);
      if (!updatedArea) {
        throw new Error('Área no encontrada después de actualizar');
      }

      logger.info('Área actualizada', 'AreaRepository', { areaId: id });
      return updatedArea;
    } catch (error) {
      logger.error('Error actualizando área', 'AreaRepository', { areaId: id }, error as Error);
      throw new Error(`Error actualizando área: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        UPDATE areas 
        SET deleted_at = @param1, updated_at = @param1, is_active = 0
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);
      logger.info('Área eliminada', 'AreaRepository', { areaId: id });
    } catch (error) {
      logger.error('Error eliminando área', 'AreaRepository', { areaId: id }, error as Error);
      throw new Error(`Error eliminando área: ${error}`);
    }
  }

  async toggleActive(id: string): Promise<Area> {
    try {
      const query = `
        UPDATE areas 
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = @param1
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);

      const updatedArea = await this.findById(id);
      if (!updatedArea) {
        throw new Error('Área no encontrada después de actualizar estado');
      }

      logger.info('Estado de área actualizado', 'AreaRepository', { areaId: id });
      return updatedArea;
    } catch (error) {
      logger.error('Error actualizando estado de área', 'AreaRepository', { areaId: id }, error as Error);
      throw new Error(`Error actualizando estado de área: ${error}`);
    }
  }

  async existsByCodeInSucursal(code: string, sucursalId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM areas 
        WHERE codigo = @param0 AND sucursal_id = @param1 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [code.toUpperCase(), sucursalId]);
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error verificando existencia por código en sucursal', 'AreaRepository', { code, sucursalId }, error as Error);
      throw new Error(`Error verificando código: ${error}`);
    }
  }

  async existsByNameInSucursal(name: string, sucursalId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM areas 
        WHERE nombre = @param0 AND sucursal_id = @param1 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [name, sucursalId]);
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error verificando existencia por nombre en sucursal', 'AreaRepository', { name, sucursalId }, error as Error);
      throw new Error(`Error verificando nombre: ${error}`);
    }
  }

  async findWithEmployeeStats(sucursalId?: string): Promise<Array<Area & {
    totalEmployees: number;
    activeEmployees: number;
  }>> {
    try {
      let whereClause = 'a.deleted_at IS NULL';
      const params: any[] = [];
      
      if (sucursalId) {
        whereClause += ' AND a.sucursal_id = @param0';
        params.push(sucursalId);
      }

      const query = `
        SELECT a.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT e.id) as totalEmployees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as activeEmployees
        FROM areas a
        LEFT JOIN sucursales s ON a.sucursal_id = s.id
        LEFT JOIN employees e ON a.id = e.area_id AND e.deleted_at IS NULL
        WHERE ${whereClause}
        GROUP BY a.id, a.nombre, a.codigo, a.sucursal_id, a.descripcion,
                 a.supervisor, a.limite_horas_semanales, a.limite_horas_extras_semanales,
                 a.requiere_aprobacion_extras, a.color, a.orden,
                 a.created_at, a.updated_at, a.is_active, s.nombre
        ORDER BY s.nombre ASC, a.orden ASC, a.nombre ASC
      `;

      const results = await this.connection.query<any>(query, params);
      return results.map(r => {
        const area = this.mapToEntity(r);
        return {
          ...area,
          totalEmployees: r.totalEmployees || 0,
          activeEmployees: r.activeEmployees || 0
        } as Area & {
          totalEmployees: number;
          activeEmployees: number;
        };
      });
    } catch (error) {
      logger.error('Error buscando áreas con estadísticas', 'AreaRepository', { sucursalId }, error as Error);
      throw new Error(`Error buscando áreas con estadísticas: ${error}`);
    }
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    bySucursal: Record<string, number>;
    withEmployees: number;
    withoutEmployees: number;
  }> {
    try {
      const mainQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
          COUNT(DISTINCT CASE WHEN e.id IS NOT NULL THEN a.id END) as withEmployees,
          COUNT(DISTINCT CASE WHEN e.id IS NULL THEN a.id END) as withoutEmployees
        FROM areas a
        LEFT JOIN employees e ON a.id = e.area_id AND e.deleted_at IS NULL
        WHERE a.deleted_at IS NULL
      `;

      const sucursalQuery = `
        SELECT s.nombre, COUNT(a.id) as count
        FROM sucursales s
        LEFT JOIN areas a ON s.id = a.sucursal_id AND a.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
        GROUP BY s.id, s.nombre
      `;

      const mainResult = await this.connection.queryOne<any>(mainQuery);
      const sucursalResults = await this.connection.query<any>(sucursalQuery);

      const bySucursal: Record<string, number> = {};
      sucursalResults.forEach(r => {
        bySucursal[r.nombre] = r.count || 0;
      });

      return {
        total: mainResult?.total || 0,
        active: mainResult?.active || 0,
        inactive: mainResult?.inactive || 0,
        bySucursal,
        withEmployees: mainResult?.withEmployees || 0,
        withoutEmployees: mainResult?.withoutEmployees || 0
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de áreas', 'AreaRepository', {}, error as Error);
      throw new Error(`Error obteniendo estadísticas: ${error}`);
    }
  }

  private mapToEntity(row: any): Area {
    try {
      return Area.createBasic(
        row.nombre,
        row.codigo,
        row.sucursal_id,
        row.supervisor
      );
    } catch (error) {
      logger.error('Error mapeando fila a entidad Area', 'AreaRepository', { row }, error as Error);
      throw new Error(`Error mapeando datos: ${error}`);
    }
  }
}

export default AreaSqlServerRepository;