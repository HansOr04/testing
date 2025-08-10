// src/infrastructure/database/repositories/sqlserver/sucursal.sqlserver.repository.ts

import { ISucursalRepository } from '@/core/interfaces/repositories/sucursal.repository.interface';
import { Sucursal } from '@/core/entities/sucursal.entity';
import { SqlServerConnection } from '@/infrastructure/database/connections/sqlserver.connection';
import { IResponse, IPagination } from '@/shared/types/common.types';
import { getLogger } from '@/shared/utils/logger.util';

const logger = getLogger();

/**
 * 🏢 SQL Server Repository para Sucursales
 * Implementación completa para gestión de sucursales
 */
export class SucursalSqlServerRepository implements ISucursalRepository {
  constructor(private connection: SqlServerConnection) {}

  async findById(id: string): Promise<Sucursal | null> {
    try {
      const query = `
        SELECT s.*,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM sucursales s
        LEFT JOIN employees e ON s.id = e.sucursal_id AND e.deleted_at IS NULL
        WHERE s.id = @param0 AND s.deleted_at IS NULL
        GROUP BY s.id, s.nombre, s.codigo, s.direccion, s.ciudad, s.provincia,
                 s.telefono, s.email, s.gerente, s.capacidad_empleados,
                 s.horario_apertura, s.horario_cierre, s.timezone, s.descripcion,
                 s.created_at, s.updated_at, s.is_active
      `;

      const result = await this.connection.queryOne<any>(query, [id]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando sucursal por ID', 'SucursalRepository', { id }, error as Error);
      throw new Error(`Error buscando sucursal: ${error}`);
    }
  }

  async findByCode(code: string): Promise<Sucursal | null> {
    try {
      const query = `
        SELECT * FROM sucursales 
        WHERE codigo = @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [code.toUpperCase()]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando sucursal por código', 'SucursalRepository', { code }, error as Error);
      throw new Error(`Error buscando sucursal: ${error}`);
    }
  }

  async findByName(name: string): Promise<Sucursal | null> {
    try {
      const query = `
        SELECT * FROM sucursales 
        WHERE nombre = @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [name]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando sucursal por nombre', 'SucursalRepository', { name }, error as Error);
      throw new Error(`Error buscando sucursal: ${error}`);
    }
  }

  async findAll(pagination: IPagination): Promise<IResponse<Sucursal[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM sucursales 
        WHERE deleted_at IS NULL
      `;

      const totalResult = await this.connection.queryOne<{ total: number }>(countQuery);
      const total = totalResult?.total || 0;

      const dataQuery = `
        SELECT s.*,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM sucursales s
        LEFT JOIN employees e ON s.id = e.sucursal_id AND e.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
        GROUP BY s.id, s.nombre, s.codigo, s.direccion, s.ciudad, s.provincia,
                 s.telefono, s.email, s.gerente, s.capacidad_empleados,
                 s.horario_apertura, s.horario_cierre, s.timezone, s.descripcion,
                 s.created_at, s.updated_at, s.is_active
        ORDER BY s.nombre ASC
        OFFSET @param0 ROWS FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(dataQuery, [offset, pagination.limit]);
      const sucursales = results.map(r => this.mapToEntity(r));

      return {
        success: true,
        message: 'Sucursales encontradas',
        data: sucursales,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando todas las sucursales', 'SucursalRepository', {}, error as Error);
      throw new Error(`Error buscando sucursales: ${error}`);
    }
  }

  async findActive(): Promise<Sucursal[]> {
    try {
      const query = `
        SELECT s.*,
               COUNT(DISTINCT e.id) as total_employees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as active_employees
        FROM sucursales s
        LEFT JOIN employees e ON s.id = e.sucursal_id AND e.deleted_at IS NULL
        WHERE s.is_active = 1 AND s.deleted_at IS NULL
        GROUP BY s.id, s.nombre, s.codigo, s.direccion, s.ciudad, s.provincia,
                 s.telefono, s.email, s.gerente, s.capacidad_empleados,
                 s.horario_apertura, s.horario_cierre, s.timezone, s.descripcion,
                 s.created_at, s.updated_at, s.is_active
        ORDER BY s.nombre ASC
      `;

      const results = await this.connection.query<any>(query);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando sucursales activas', 'SucursalRepository', {}, error as Error);
      throw new Error(`Error buscando sucursales activas: ${error}`);
    }
  }

  async create(sucursal: Sucursal): Promise<Sucursal> {
    try {
      const query = `
        INSERT INTO sucursales (
          id, nombre, codigo, direccion, ciudad, provincia,
          telefono, email, gerente, capacidad_empleados,
          horario_apertura, horario_cierre, timezone, descripcion,
          created_at, updated_at, is_active
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5,
          @param6, @param7, @param8, @param9, @param10, @param11,
          @param12, @param13, @param14, @param15, @param16
        )
      `;

      const sucursalData = sucursal.toJSON() as any;

      await this.connection.query(query, [
        sucursal.id,
        sucursalData.nombre,
        sucursalData.codigo,
        sucursalData.direccion,
        sucursalData.ciudad,
        sucursalData.provincia,
        sucursalData.telefono,
        sucursalData.email,
        sucursalData.gerente,
        sucursalData.capacidadEmpleados,
        sucursalData.horarioApertura,
        sucursalData.horarioCierre,
        sucursalData.timezone,
        sucursalData.descripcion,
        new Date(),
        new Date(),
        1
      ]);

      logger.info('Sucursal creada', 'SucursalRepository', { sucursalId: sucursal.id });
      return sucursal;
    } catch (error) {
      logger.error('Error creando sucursal', 'SucursalRepository', { sucursalId: sucursal.id }, error as Error);
      throw new Error(`Error creando sucursal: ${error}`);
    }
  }

  async update(id: string, sucursal: Partial<Sucursal>): Promise<Sucursal> {
    try {
      const sucursalData = sucursal as any;
      const query = `
        UPDATE sucursales SET
          nombre = COALESCE(@param1, nombre),
          direccion = COALESCE(@param2, direccion),
          ciudad = COALESCE(@param3, ciudad),
          provincia = COALESCE(@param4, provincia),
          telefono = COALESCE(@param5, telefono),
          email = COALESCE(@param6, email),
          gerente = COALESCE(@param7, gerente),
          capacidad_empleados = COALESCE(@param8, capacidad_empleados),
          horario_apertura = COALESCE(@param9, horario_apertura),
          horario_cierre = COALESCE(@param10, horario_cierre),
          timezone = COALESCE(@param11, timezone),
          descripcion = COALESCE(@param12, descripcion),
          updated_at = @param13
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [
        id,
        sucursalData.nombre,
        sucursalData.direccion,
        sucursalData.ciudad,
        sucursalData.provincia,
        sucursalData.telefono,
        sucursalData.email,
        sucursalData.gerente,
        sucursalData.capacidadEmpleados,
        sucursalData.horarioApertura,
        sucursalData.horarioCierre,
        sucursalData.timezone,
        sucursalData.descripcion,
        new Date()
      ]);

      const updatedSucursal = await this.findById(id);
      if (!updatedSucursal) {
        throw new Error('Sucursal no encontrada después de actualizar');
      }

      logger.info('Sucursal actualizada', 'SucursalRepository', { sucursalId: id });
      return updatedSucursal;
    } catch (error) {
      logger.error('Error actualizando sucursal', 'SucursalRepository', { sucursalId: id }, error as Error);
      throw new Error(`Error actualizando sucursal: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        UPDATE sucursales 
        SET deleted_at = @param1, updated_at = @param1, is_active = 0
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);
      logger.info('Sucursal eliminada', 'SucursalRepository', { sucursalId: id });
    } catch (error) {
      logger.error('Error eliminando sucursal', 'SucursalRepository', { sucursalId: id }, error as Error);
      throw new Error(`Error eliminando sucursal: ${error}`);
    }
  }

  async toggleActive(id: string): Promise<Sucursal> {
    try {
      const query = `
        UPDATE sucursales 
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = @param1
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);

      const updatedSucursal = await this.findById(id);
      if (!updatedSucursal) {
        throw new Error('Sucursal no encontrada después de actualizar estado');
      }

      logger.info('Estado de sucursal actualizado', 'SucursalRepository', { sucursalId: id });
      return updatedSucursal;
    } catch (error) {
      logger.error('Error actualizando estado de sucursal', 'SucursalRepository', { sucursalId: id }, error as Error);
      throw new Error(`Error actualizando estado de sucursal: ${error}`);
    }
  }

  async existsByCode(code: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM sucursales 
        WHERE codigo = @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [code.toUpperCase()]);
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error verificando existencia por código', 'SucursalRepository', { code }, error as Error);
      throw new Error(`Error verificando código: ${error}`);
    }
  }

  async existsByName(name: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM sucursales 
        WHERE nombre = @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [name]);
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error verificando existencia por nombre', 'SucursalRepository', { name }, error as Error);
      throw new Error(`Error verificando nombre: ${error}`);
    }
  }

  async findWithEmployeeStats(): Promise<Array<Sucursal & {
    totalEmployees: number;
    activeEmployees: number;
    administrativeEmployees: number;
    regularEmployees: number;
  }>> {
    try {
      const query = `
        SELECT s.*,
               COUNT(DISTINCT e.id) as totalEmployees,
               COUNT(DISTINCT CASE WHEN e.is_active = 1 THEN e.id END) as activeEmployees,
               COUNT(DISTINCT CASE WHEN e.tipo_empleado = 'ADMINISTRATIVO' AND e.is_active = 1 THEN e.id END) as administrativeEmployees,
               COUNT(DISTINCT CASE WHEN e.tipo_empleado = 'REGULAR' AND e.is_active = 1 THEN e.id END) as regularEmployees
        FROM sucursales s
        LEFT JOIN employees e ON s.id = e.sucursal_id AND e.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
        GROUP BY s.id, s.nombre, s.codigo, s.direccion, s.ciudad, s.provincia,
                 s.telefono, s.email, s.gerente, s.capacidad_empleados,
                 s.horario_apertura, s.horario_cierre, s.timezone, s.descripcion,
                 s.created_at, s.updated_at, s.is_active
        ORDER BY s.nombre ASC
      `;

      const results = await this.connection.query<any>(query);
      return results.map(r => {
        const sucursal = this.mapToEntity(r);
        return {
          ...sucursal,
          totalEmployees: r.totalEmployees || 0,
          activeEmployees: r.activeEmployees || 0,
          administrativeEmployees: r.administrativeEmployees || 0,
          regularEmployees: r.regularEmployees || 0
        } as Sucursal & {
          totalEmployees: number;
          activeEmployees: number;
          administrativeEmployees: number;
          regularEmployees: number;
        };
      });
    } catch (error) {
      logger.error('Error buscando sucursales con estadísticas', 'SucursalRepository', {}, error as Error);
      throw new Error(`Error buscando sucursales con estadísticas: ${error}`);
    }
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDevices: number;
    withoutDevices: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
          COUNT(DISTINCT bd.sucursal_id) as withDevices,
          COUNT(*) - COUNT(DISTINCT bd.sucursal_id) as withoutDevices
        FROM sucursales s
        LEFT JOIN biometric_devices bd ON s.id = bd.sucursal_id AND bd.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query);
      
      return {
        total: result?.total || 0,
        active: result?.active || 0,
        inactive: result?.inactive || 0,
        withDevices: result?.withDevices || 0,
        withoutDevices: result?.withoutDevices || 0
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de sucursales', 'SucursalRepository', {}, error as Error);
      throw new Error(`Error obteniendo estadísticas: ${error}`);
    }
  }

  private mapToEntity(row: any): Sucursal {
    try {
      return Sucursal.createBasic(
        row.nombre,
        row.codigo,
        row.direccion,
        row.ciudad,
        row.provincia
      );
    } catch (error) {
      logger.error('Error mapeando fila a entidad Sucursal', 'SucursalRepository', { row }, error as Error);
      throw new Error(`Error mapeando datos: ${error}`);
    }
  }
}

export default SucursalSqlServerRepository;