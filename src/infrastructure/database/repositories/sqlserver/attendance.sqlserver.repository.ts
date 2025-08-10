// src/infrastructure/database/repositories/sqlserver/attendance.sqlserver.repository.ts

import { IAttendanceRepository } from '@/core/interfaces/repositories/attendance.repository.interface';
import { AttendanceRecord, ICreateAttendanceRecordData } from '@/core/entities/attendance-record.entity';
import { AttendanceStatus } from '@/core/enums/attendance-status.enum';
import { SqlServerConnection } from '@/infrastructure/database/connections/sqlserver.connection';
import { IResponse, IPagination, IPaginationParams, IPaginatedResponse } from '@/shared/types/common.types';
import { getLogger } from '@/shared/utils/logger.util';
import { formatDate, startOfDay, endOfDay } from '@/shared/utils/date.util';

const logger = getLogger();

/**
 * 🗂️ ATTENDANCE SQL SERVER REPOSITORY
 * Implementación del repositorio de asistencia para SQL Server
 * 
 * Características:
 * - CRUD completo para registros de asistencia
 * - Consultas optimizadas con índices
 * - Transacciones seguras
 * - Reportes y estadísticas
 * - Sincronización masiva desde dispositivos biométricos
 * - Cálculos de horas según normativa ecuatoriana
 */
export class AttendanceSqlServerRepository implements IAttendanceRepository {
  private connection: SqlServerConnection;

  constructor(connection: SqlServerConnection) {
    this.connection = connection;
  }

  /**
   * 🔍 Buscar registro de asistencia por ID
   */
  async findById(id: string): Promise<AttendanceRecord | null> {
    try {
      logger.debug(`Buscando registro de asistencia por ID: ${id}`, 'AttendanceRepository');

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.id = @param0 AND ar.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [id]);
      
      if (!result) {
        logger.debug(`Registro de asistencia no encontrado: ${id}`, 'AttendanceRepository');
        return null;
      }

      return this.mapToEntity(result);
    } catch (error) {
      logger.error(`Error buscando registro de asistencia por ID: ${id}`, 'AttendanceRepository', { error });
      throw new Error(`Error al buscar registro de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros de asistencia por empleado y fecha
   */
  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros por empleado ${employeeId} y fecha ${formatDate(date)}`, 'AttendanceRepository');

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.employee_id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
        ORDER BY ar.fecha DESC, ar.entrada ASC
      `;

      const results = await this.connection.query<any>(query, [employeeId, startDate, endDate]);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros por empleado y fecha`, 'AttendanceRepository', { employeeId, date, error });
      throw new Error(`Error al buscar registros de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros de asistencia por empleado en un rango de fechas
   */
  async findByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros por empleado ${employeeId} desde ${formatDate(startDate)} hasta ${formatDate(endDate)}`, 'AttendanceRepository');

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.employee_id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
        ORDER BY ar.fecha DESC, ar.entrada ASC
      `;

      const results = await this.connection.query<any>(query, [employeeId, startOfDay(startDate), endOfDay(endDate)]);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros por empleado y rango de fechas`, 'AttendanceRepository', { employeeId, startDate, endDate, error });
      throw new Error(`Error al buscar registros de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros de asistencia por sucursal y fecha
   */
  async findBySucursalAndDate(sucursalId: string, date: Date): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros por sucursal ${sucursalId} y fecha ${formatDate(date)}`, 'AttendanceRepository');

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE s.id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
        ORDER BY a.nombre, e.apellidos, e.nombres, ar.entrada
      `;

      const results = await this.connection.query<any>(query, [sucursalId, startDate, endDate]);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros por sucursal y fecha`, 'AttendanceRepository', { sucursalId, date, error });
      throw new Error(`Error al buscar registros de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros de asistencia por sucursal en un rango de fechas
   */
  async findBySucursalAndDateRange(
    sucursalId: string, 
    startDate: Date, 
    endDate: Date,
    pagination: IPagination
  ): Promise<IPaginatedResponse<AttendanceRecord>> {
    try {
      logger.debug(`Buscando registros por sucursal con paginación`, 'AttendanceRepository', { sucursalId, startDate, endDate, pagination });

      const offset = (pagination.page - 1) * pagination.limit;

      // Consulta para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE s.id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countQuery, [sucursalId, startOfDay(startDate), endOfDay(endDate)]);
      const total = countResult?.total || 0;

      // Consulta principal con paginación
      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE s.id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
        ORDER BY ar.fecha DESC, a.nombre, e.apellidos, e.nombres
        OFFSET @param3 ROWS
        FETCH NEXT @param4 ROWS ONLY
      `;

      const results = await this.connection.query<any>(query, [sucursalId, startOfDay(startDate), endOfDay(endDate), offset, pagination.limit]);
      
      const records = results.map(result => this.mapToEntity(result));

      return {
        success: true,
        message: 'Registros encontrados exitosamente',
        data: records,
        timestamp: new Date().toISOString(),
        pagination: {
          ...pagination,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page < Math.ceil(total / pagination.limit),
          hasPrev: pagination.page > 1
        }
      };
    } catch (error) {
      logger.error(`Error buscando registros por sucursal con paginación`, 'AttendanceRepository', { sucursalId, startDate, endDate, error });
      throw new Error(`Error al buscar registros de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros de asistencia por área y fecha
   */
  async findByAreaAndDate(areaId: string, date: Date): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros por área ${areaId} y fecha ${formatDate(date)}`, 'AttendanceRepository');

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE a.id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
        ORDER BY e.apellidos, e.nombres, ar.entrada
      `;

      const results = await this.connection.query<any>(query, [areaId, startDate, endDate]);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros por área y fecha`, 'AttendanceRepository', { areaId, date, error });
      throw new Error(`Error al buscar registros de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros de asistencia por estado
   */
  async findByStatus(status: AttendanceStatus, pagination: IPagination): Promise<IPaginatedResponse<AttendanceRecord>> {
    try {
      logger.debug(`Buscando registros por estado: ${status}`, 'AttendanceRepository');

      const offset = (pagination.page - 1) * pagination.limit;

      // Consulta para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM attendance_records ar
        WHERE ar.estado = @param0 AND ar.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countQuery, [status]);
      const total = countResult?.total || 0;

      // Consulta principal con paginación
      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.estado = @param0 AND ar.deleted_at IS NULL
        ORDER BY ar.fecha DESC, ar.created_at DESC
        OFFSET @param1 ROWS
        FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(query, [status, offset, pagination.limit]);
      
      const records = results.map(result => this.mapToEntity(result));

      return {
        success: true,
        message: 'Registros encontrados exitosamente',
        data: records,
        timestamp: new Date().toISOString(),
        pagination: {
          ...pagination,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page < Math.ceil(total / pagination.limit),
          hasPrev: pagination.page > 1
        }
      };
    } catch (error) {
      logger.error(`Error buscando registros por estado`, 'AttendanceRepository', { status, error });
      throw new Error(`Error al buscar registros de asistencia: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros pendientes de aprobación
   */
  async findPendingApproval(pagination: IPagination): Promise<IPaginatedResponse<AttendanceRecord>> {
    try {
      logger.debug(`Buscando registros pendientes de aprobación`, 'AttendanceRepository');

      const pendingStatuses = [AttendanceStatus.PENDIENTE, AttendanceStatus.INCONSISTENTE, AttendanceStatus.REVISION];
      const offset = (pagination.page - 1) * pagination.limit;

      // Consulta para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM attendance_records ar
        WHERE ar.estado IN ('${pendingStatuses.join("','")}') AND ar.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countQuery);
      const total = countResult?.total || 0;

      // Consulta principal con paginación
      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.estado IN ('${pendingStatuses.join("','")}') AND ar.deleted_at IS NULL
        ORDER BY 
          CASE ar.estado 
            WHEN '${AttendanceStatus.INCONSISTENTE}' THEN 1
            WHEN '${AttendanceStatus.PENDIENTE}' THEN 2
            WHEN '${AttendanceStatus.REVISION}' THEN 3
            ELSE 4
          END,
          ar.fecha DESC
        OFFSET @param0 ROWS
        FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(query, [offset, pagination.limit]);
      
      const records = results.map(result => this.mapToEntity(result));

      return {
        success: true,
        message: 'Registros pendientes encontrados exitosamente',
        data: records,
        timestamp: new Date().toISOString(),
        pagination: {
          ...pagination,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page < Math.ceil(total / pagination.limit),
          hasPrev: pagination.page > 1
        }
      };
    } catch (error) {
      logger.error(`Error buscando registros pendientes de aprobación`, 'AttendanceRepository', { error });
      throw new Error(`Error al buscar registros pendientes: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros con horas extras
   */
  async findWithOvertime(startDate: Date, endDate: Date, pagination: IPagination): Promise<IPaginatedResponse<AttendanceRecord>> {
    try {
      logger.debug(`Buscando registros con horas extras`, 'AttendanceRepository', { startDate, endDate });

      const offset = (pagination.page - 1) * pagination.limit;

      // Consulta para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM attendance_records ar
        WHERE ar.horas_extras > 0 
          AND ar.fecha >= @param0 
          AND ar.fecha <= @param1
          AND ar.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countQuery, [startOfDay(startDate), endOfDay(endDate)]);
      const total = countResult?.total || 0;

      // Consulta principal con paginación
      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.horas_extras > 0 
          AND ar.fecha >= @param0 
          AND ar.fecha <= @param1
          AND ar.deleted_at IS NULL
        ORDER BY ar.horas_extras DESC, ar.fecha DESC
        OFFSET @param2 ROWS
        FETCH NEXT @param3 ROWS ONLY
      `;

      const results = await this.connection.query<any>(query, [startOfDay(startDate), endOfDay(endDate), offset, pagination.limit]);
      
      const records = results.map(result => this.mapToEntity(result));

      return {
        success: true,
        message: 'Registros con horas extras encontrados exitosamente',
        data: records,
        timestamp: new Date().toISOString(),
        pagination: {
          ...pagination,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page < Math.ceil(total / pagination.limit),
          hasPrev: pagination.page > 1
        }
      };
    } catch (error) {
      logger.error(`Error buscando registros con horas extras`, 'AttendanceRepository', { startDate, endDate, error });
      throw new Error(`Error al buscar registros con horas extras: ${error}`);
    }
  }

  /**
   * ➕ Crear nuevo registro de asistencia
   */
  async create(attendance: AttendanceRecord): Promise<AttendanceRecord> {
    try {
      logger.debug(`Creando nuevo registro de asistencia para empleado: ${attendance.employeeId}`, 'AttendanceRepository');

      const query = `
        INSERT INTO attendance_records (
          id, employee_id, fecha, entrada, salida, entrada_2, salida_2,
          tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
          horas_suplementarias, horas_extraordinarias, horas_nocturnas,
          estado, es_manual, observaciones, modificado_por, fecha_modificacion,
          created_at, updated_at, is_active, version
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5, @param6,
          @param7, @param8, @param9, @param10, @param11, @param12, @param13,
          @param14, @param15, @param16, @param17, @param18,
          @param19, @param20, @param21, @param22
        )
      `;

      const params = [
        attendance.id,
        attendance.employeeId,
        attendance.fecha,
        attendance.entrada || null,
        attendance.salida || null,
        attendance.entrada2 || null,
        attendance.salida2 || null,
        attendance.tiempoAlmuerzo,
        attendance.horasRegulares,
        attendance.horasExtras,
        attendance.horasRecargo,
        attendance.horasSupplementarias,
        attendance.horasExtraordinarias,
        attendance.horasNocturnas,
        attendance.estado,
        attendance.esManual,
        attendance.observaciones || null,
        attendance.modificadoPor || null,
        attendance.fechaModificacion || null,
        attendance.createdAt,
        attendance.updatedAt,
        attendance.isActive,
        attendance.version
      ];

      await this.connection.query(query, params);

      logger.info(`Registro de asistencia creado exitosamente: ${attendance.id}`, 'AttendanceRepository');
      
      return attendance;
    } catch (error) {
      logger.error(`Error creando registro de asistencia`, 'AttendanceRepository', { attendanceId: attendance.id, error });
      throw new Error(`Error al crear registro de asistencia: ${error}`);
    }
  }

  /**
   * ✏️ Actualizar registro de asistencia existente
   */
  async update(id: string, attendance: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      logger.debug(`Actualizando registro de asistencia: ${id}`, 'AttendanceRepository');

      // Construir la consulta de actualización dinámicamente
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 0;

      if (attendance.entrada !== undefined) {
        updateFields.push(`entrada = @param${paramIndex}`);
        params.push(attendance.entrada);
        paramIndex++;
      }

      if (attendance.salida !== undefined) {
        updateFields.push(`salida = @param${paramIndex}`);
        params.push(attendance.salida);
        paramIndex++;
      }

      if (attendance.entrada2 !== undefined) {
        updateFields.push(`entrada_2 = @param${paramIndex}`);
        params.push(attendance.entrada2);
        paramIndex++;
      }

      if (attendance.salida2 !== undefined) {
        updateFields.push(`salida_2 = @param${paramIndex}`);
        params.push(attendance.salida2);
        paramIndex++;
      }

      if (attendance.tiempoAlmuerzo !== undefined) {
        updateFields.push(`tiempo_almuerzo = @param${paramIndex}`);
        params.push(attendance.tiempoAlmuerzo);
        paramIndex++;
      }

      if (attendance.horasRegulares !== undefined) {
        updateFields.push(`horas_regulares = @param${paramIndex}`);
        params.push(attendance.horasRegulares);
        paramIndex++;
      }

      if (attendance.horasExtras !== undefined) {
        updateFields.push(`horas_extras = @param${paramIndex}`);
        params.push(attendance.horasExtras);
        paramIndex++;
      }

      if (attendance.horasRecargo !== undefined) {
        updateFields.push(`horas_recargo = @param${paramIndex}`);
        params.push(attendance.horasRecargo);
        paramIndex++;
      }

      if (attendance.horasSupplementarias !== undefined) {
        updateFields.push(`horas_suplementarias = @param${paramIndex}`);
        params.push(attendance.horasSupplementarias);
        paramIndex++;
      }

      if (attendance.horasExtraordinarias !== undefined) {
        updateFields.push(`horas_extraordinarias = @param${paramIndex}`);
        params.push(attendance.horasExtraordinarias);
        paramIndex++;
      }

      if (attendance.horasNocturnas !== undefined) {
        updateFields.push(`horas_nocturnas = @param${paramIndex}`);
        params.push(attendance.horasNocturnas);
        paramIndex++;
      }

      if (attendance.estado !== undefined) {
        updateFields.push(`estado = @param${paramIndex}`);
        params.push(attendance.estado);
        paramIndex++;
      }

      if (attendance.esManual !== undefined) {
        updateFields.push(`es_manual = @param${paramIndex}`);
        params.push(attendance.esManual);
        paramIndex++;
      }

      if (attendance.observaciones !== undefined) {
        updateFields.push(`observaciones = @param${paramIndex}`);
        params.push(attendance.observaciones);
        paramIndex++;
      }

      if (attendance.modificadoPor !== undefined) {
        updateFields.push(`modificado_por = @param${paramIndex}`);
        params.push(attendance.modificadoPor);
        paramIndex++;
        updateFields.push(`fecha_modificacion = @param${paramIndex}`);
        params.push(new Date());
        paramIndex++;
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = @param${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      updateFields.push(`version = version + 1`);

      // Agregar el ID al final
      params.push(id);

      const query = `
        UPDATE attendance_records 
        SET ${updateFields.join(', ')}
        WHERE id = @param${paramIndex} AND deleted_at IS NULL
      `;

      const result = await this.connection.query(query, params);

      if (result.length === 0) {
        throw new Error('Registro de asistencia no encontrado o ya eliminado');
      }

      logger.info(`Registro de asistencia actualizado exitosamente: ${id}`, 'AttendanceRepository');

      // Obtener el registro actualizado
      const updatedRecord = await this.findById(id);
      if (!updatedRecord) {
        throw new Error('Error al obtener registro actualizado');
      }

      return updatedRecord;
    } catch (error) {
      logger.error(`Error actualizando registro de asistencia: ${id}`, 'AttendanceRepository', { error });
      throw new Error(`Error al actualizar registro de asistencia: ${error}`);
    }
  }

  /**
   * 🗑️ Eliminar registro de asistencia (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      logger.debug(`Eliminando registro de asistencia: ${id}`, 'AttendanceRepository');

      const query = `
        UPDATE attendance_records 
        SET deleted_at = @param0, updated_at = @param1, version = version + 1
        WHERE id = @param2 AND deleted_at IS NULL
      `;

      const result = await this.connection.query(query, [new Date(), new Date(), id]);

      if (result.length === 0) {
        throw new Error('Registro de asistencia no encontrado');
      }

      logger.info(`Registro de asistencia eliminado exitosamente: ${id}`, 'AttendanceRepository');
    } catch (error) {
      logger.error(`Error eliminando registro de asistencia: ${id}`, 'AttendanceRepository', { error });
      throw new Error(`Error al eliminar registro de asistencia: ${error}`);
    }
  }

  /**
   * ✅ Aprobar registro de asistencia
   */
  async approve(id: string, approvedBy: string): Promise<AttendanceRecord> {
    try {
      logger.debug(`Aprobando registro de asistencia: ${id}`, 'AttendanceRepository');

      const query = `
        UPDATE attendance_records 
        SET estado = @param0, modificado_por = @param1, fecha_modificacion = @param2, 
            updated_at = @param3, version = version + 1
        WHERE id = @param4 AND deleted_at IS NULL
      `;

      const result = await this.connection.query(query, [
        AttendanceStatus.COMPLETO,
        approvedBy,
        new Date(),
        new Date(),
        id
      ]);

      if (result.length === 0) {
        throw new Error('Registro de asistencia no encontrado');
      }

      logger.info(`Registro de asistencia aprobado exitosamente: ${id}`, 'AttendanceRepository');

      const updatedRecord = await this.findById(id);
      if (!updatedRecord) {
        throw new Error('Error al obtener registro aprobado');
      }

      return updatedRecord;
    } catch (error) {
      logger.error(`Error aprobando registro de asistencia: ${id}`, 'AttendanceRepository', { error });
      throw new Error(`Error al aprobar registro de asistencia: ${error}`);
    }
  }

  /**
   * ❌ Rechazar registro de asistencia
   */
  async reject(id: string, rejectedBy: string, reason: string): Promise<AttendanceRecord> {
    try {
      logger.debug(`Rechazando registro de asistencia: ${id}`, 'AttendanceRepository');

      const query = `
        UPDATE attendance_records 
        SET estado = @param0, modificado_por = @param1, fecha_modificacion = @param2,
            observaciones = ISNULL(observaciones, '') + ' | RECHAZADO: ' + @param3,
            updated_at = @param4, version = version + 1
        WHERE id = @param5 AND deleted_at IS NULL
      `;

      const result = await this.connection.query(query, [
        AttendanceStatus.INCONSISTENTE,
        rejectedBy,
        new Date(),
        reason,
        new Date(),
        id
      ]);

      if (result.length === 0) {
        throw new Error('Registro de asistencia no encontrado');
      }

      logger.info(`Registro de asistencia rechazado exitosamente: ${id}`, 'AttendanceRepository');

      const updatedRecord = await this.findById(id);
      if (!updatedRecord) {
        throw new Error('Error al obtener registro rechazado');
      }

      return updatedRecord;
    } catch (error) {
      logger.error(`Error rechazando registro de asistencia: ${id}`, 'AttendanceRepository', { error });
      throw new Error(`Error al rechazar registro de asistencia: ${error}`);
    }
  }

  /**
   * 📊 Calcular horas trabajadas por empleado en un mes
   */
  async calculateMonthlyHours(employeeId: string, year: number, month: number): Promise<{
    regularHours: number;
    overtimeHours: number;
    overtimeBreakdown: {
      recargo25: number;
      suplementario50: number;
      extraordinario100: number;
    };
    daysWorked: number;
    daysAbsent: number;
    lateArrivals: number;
    earlyDepartures: number;
  }> {
    try {
      logger.debug(`Calculando horas mensuales para empleado: ${employeeId}`, 'AttendanceRepository', { year, month });

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const query = `
        SELECT 
          SUM(ar.horas_regulares) as total_regular_hours,
          SUM(ar.horas_extras) as total_overtime_hours,
          SUM(ar.horas_recargo) as total_recargo_hours,
          SUM(ar.horas_suplementarias) as total_suplementarias_hours,
          SUM(ar.horas_extraordinarias) as total_extraordinarias_hours,
          COUNT(CASE WHEN ar.estado IN ('${AttendanceStatus.COMPLETO}', '${AttendanceStatus.MODIFICADO}') THEN 1 END) as days_worked,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.AUSENTE}' THEN 1 END) as days_absent,
          COUNT(CASE WHEN ar.entrada > DATEADD(MINUTE, 15, '08:00:00') THEN 1 END) as late_arrivals,
          COUNT(CASE WHEN ar.salida < '17:00:00' AND ar.estado = '${AttendanceStatus.COMPLETO}' THEN 1 END) as early_departures
        FROM attendance_records ar
        WHERE ar.employee_id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [employeeId, startDate, endDate]);

      if (!result) {
        return {
          regularHours: 0,
          overtimeHours: 0,
          overtimeBreakdown: {
            recargo25: 0,
            suplementario50: 0,
            extraordinario100: 0
          },
          daysWorked: 0,
          daysAbsent: 0,
          lateArrivals: 0,
          earlyDepartures: 0
        };
      }

      return {
        regularHours: parseFloat(result.total_regular_hours) || 0,
        overtimeHours: parseFloat(result.total_overtime_hours) || 0,
        overtimeBreakdown: {
          recargo25: parseFloat(result.total_recargo_hours) || 0,
          suplementario50: parseFloat(result.total_suplementarias_hours) || 0,
          extraordinario100: parseFloat(result.total_extraordinarias_hours) || 0
        },
        daysWorked: parseInt(result.days_worked) || 0,
        daysAbsent: parseInt(result.days_absent) || 0,
        lateArrivals: parseInt(result.late_arrivals) || 0,
        earlyDepartures: parseInt(result.early_departures) || 0
      };
    } catch (error) {
      logger.error(`Error calculando horas mensuales`, 'AttendanceRepository', { employeeId, year, month, error });
      throw new Error(`Error al calcular horas mensuales: ${error}`);
    }
  }

  /**
   * 📈 Generar reporte de asistencia por sucursal
   */
  async generateSucursalReport(sucursalId: string, startDate: Date, endDate: Date): Promise<{
    employeeReports: Array<{
      employeeId: string;
      employeeName: string;
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      daysWorked: number;
      daysAbsent: number;
      attendancePercentage: number;
    }>;
    summary: {
      totalEmployees: number;
      averageAttendance: number;
      totalRegularHours: number;
      totalOvertimeHours: number;
    };
  }> {
    try {
      logger.debug(`Generando reporte de sucursal: ${sucursalId}`, 'AttendanceRepository', { startDate, endDate });

      const query = `
        SELECT 
          e.id as employee_id,
          e.nombres + ' ' + e.apellidos as employee_name,
          SUM(ar.horas_regulares + ar.horas_extras) as total_hours,
          SUM(ar.horas_regulares) as regular_hours,
          SUM(ar.horas_extras) as overtime_hours,
          COUNT(CASE WHEN ar.estado IN ('${AttendanceStatus.COMPLETO}', '${AttendanceStatus.MODIFICADO}') THEN 1 END) as days_worked,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.AUSENTE}' THEN 1 END) as days_absent,
          COUNT(*) as total_days
        FROM employees e
        INNER JOIN areas a ON e.area_id = a.id
        LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
          AND ar.fecha >= @param1 AND ar.fecha <= @param2 AND ar.deleted_at IS NULL
        WHERE a.sucursal_id = @param0 AND e.deleted_at IS NULL AND e.is_active = 1
        GROUP BY e.id, e.nombres, e.apellidos
        ORDER BY e.apellidos, e.nombres
      `;

      const results = await this.connection.query<any>(query, [sucursalId, startOfDay(startDate), endOfDay(endDate)]);

      const employeeReports = results.map(result => ({
        employeeId: result.employee_id,
        employeeName: result.employee_name,
        totalHours: parseFloat(result.total_hours) || 0,
        regularHours: parseFloat(result.regular_hours) || 0,
        overtimeHours: parseFloat(result.overtime_hours) || 0,
        daysWorked: parseInt(result.days_worked) || 0,
        daysAbsent: parseInt(result.days_absent) || 0,
        attendancePercentage: result.total_days > 0 
          ? Math.round(((parseInt(result.days_worked) || 0) / parseInt(result.total_days)) * 100)
          : 0
      }));

      const summary = {
        totalEmployees: employeeReports.length,
        averageAttendance: employeeReports.length > 0 
          ? Math.round(employeeReports.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / employeeReports.length)
          : 0,
        totalRegularHours: employeeReports.reduce((sum, emp) => sum + emp.regularHours, 0),
        totalOvertimeHours: employeeReports.reduce((sum, emp) => sum + emp.overtimeHours, 0)
      };

      return { employeeReports, summary };
    } catch (error) {
      logger.error(`Error generando reporte de sucursal`, 'AttendanceRepository', { sucursalId, startDate, endDate, error });
      throw new Error(`Error al generar reporte de sucursal: ${error}`);
    }
  }

  /**
   * 📈 Generar reporte de asistencia por área
   */
  async generateAreaReport(areaId: string, startDate: Date, endDate: Date): Promise<{
    employeeReports: Array<{
      employeeId: string;
      employeeName: string;
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      daysWorked: number;
      daysAbsent: number;
      attendancePercentage: number;
    }>;
    summary: {
      totalEmployees: number;
      averageAttendance: number;
      totalRegularHours: number;
      totalOvertimeHours: number;
    };
  }> {
    try {
      logger.debug(`Generando reporte de área: ${areaId}`, 'AttendanceRepository', { startDate, endDate });

      const query = `
        SELECT 
          e.id as employee_id,
          e.nombres + ' ' + e.apellidos as employee_name,
          SUM(ar.horas_regulares + ar.horas_extras) as total_hours,
          SUM(ar.horas_regulares) as regular_hours,
          SUM(ar.horas_extras) as overtime_hours,
          COUNT(CASE WHEN ar.estado IN ('${AttendanceStatus.COMPLETO}', '${AttendanceStatus.MODIFICADO}') THEN 1 END) as days_worked,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.AUSENTE}' THEN 1 END) as days_absent,
          COUNT(*) as total_days
        FROM employees e
        LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
          AND ar.fecha >= @param1 AND ar.fecha <= @param2 AND ar.deleted_at IS NULL
        WHERE e.area_id = @param0 AND e.deleted_at IS NULL AND e.is_active = 1
        GROUP BY e.id, e.nombres, e.apellidos
        ORDER BY e.apellidos, e.nombres
      `;

      const results = await this.connection.query<any>(query, [areaId, startOfDay(startDate), endOfDay(endDate)]);

      const employeeReports = results.map(result => ({
        employeeId: result.employee_id,
        employeeName: result.employee_name,
        totalHours: parseFloat(result.total_hours) || 0,
        regularHours: parseFloat(result.regular_hours) || 0,
        overtimeHours: parseFloat(result.overtime_hours) || 0,
        daysWorked: parseInt(result.days_worked) || 0,
        daysAbsent: parseInt(result.days_absent) || 0,
        attendancePercentage: result.total_days > 0 
          ? Math.round(((parseInt(result.days_worked) || 0) / parseInt(result.total_days)) * 100)
          : 0
      }));

      const summary = {
        totalEmployees: employeeReports.length,
        averageAttendance: employeeReports.length > 0 
          ? Math.round(employeeReports.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / employeeReports.length)
          : 0,
        totalRegularHours: employeeReports.reduce((sum, emp) => sum + emp.regularHours, 0),
        totalOvertimeHours: employeeReports.reduce((sum, emp) => sum + emp.overtimeHours, 0)
      };

      return { employeeReports, summary };
    } catch (error) {
      logger.error(`Error generando reporte de área`, 'AttendanceRepository', { areaId, startDate, endDate, error });
      throw new Error(`Error al generar reporte de área: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros duplicados
   */
  async findDuplicates(timeThreshold: number = 5): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros duplicados con umbral de ${timeThreshold} minutos`, 'AttendanceRepository');

      const query = `
        SELECT ar1.*
        FROM attendance_records ar1
        INNER JOIN attendance_records ar2 ON ar1.employee_id = ar2.employee_id
          AND ar1.fecha = ar2.fecha
          AND ar1.id != ar2.id
          AND ABS(DATEDIFF(MINUTE, ar1.entrada, ar2.entrada)) <= @param0
        WHERE ar1.deleted_at IS NULL AND ar2.deleted_at IS NULL
        ORDER BY ar1.employee_id, ar1.fecha, ar1.entrada
      `;

      const results = await this.connection.query<any>(query, [timeThreshold]);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros duplicados`, 'AttendanceRepository', { timeThreshold, error });
      throw new Error(`Error al buscar registros duplicados: ${error}`);
    }
  }

  /**
   * 🔍 Obtener último registro de asistencia de un empleado
   */
  async findLastByEmployee(employeeId: string): Promise<AttendanceRecord | null> {
    try {
      logger.debug(`Buscando último registro para empleado: ${employeeId}`, 'AttendanceRepository');

      const query = `
        SELECT TOP 1
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.employee_id = @param0 AND ar.deleted_at IS NULL
        ORDER BY ar.fecha DESC, ar.created_at DESC
      `;

      const result = await this.connection.queryOne<any>(query, [employeeId]);
      
      if (!result) {
        return null;
      }

      return this.mapToEntity(result);
    } catch (error) {
      logger.error(`Error buscando último registro de empleado`, 'AttendanceRepository', { employeeId, error });
      throw new Error(`Error al buscar último registro: ${error}`);
    }
  }

  /**
   * 🔍 Verificar si existe registro de entrada para empleado en fecha específica
   */
  async hasEntryRecord(employeeId: string, date: Date): Promise<boolean> {
    try {
      logger.debug(`Verificando registro de entrada para empleado: ${employeeId}`, 'AttendanceRepository', { date });

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      const query = `
        SELECT COUNT(*) as count
        FROM attendance_records ar
        WHERE ar.employee_id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.entrada IS NOT NULL
          AND ar.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [employeeId, startDate, endDate]);
      
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error(`Error verificando registro de entrada`, 'AttendanceRepository', { employeeId, date, error });
      throw new Error(`Error al verificar registro de entrada: ${error}`);
    }
  }

  /**
   * 🔍 Verificar si existe registro de salida para empleado en fecha específica
   */
  async hasExitRecord(employeeId: string, date: Date): Promise<boolean> {
    try {
      logger.debug(`Verificando registro de salida para empleado: ${employeeId}`, 'AttendanceRepository', { date });

      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      const query = `
        SELECT COUNT(*) as count
        FROM attendance_records ar
        WHERE ar.employee_id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.salida IS NOT NULL
          AND ar.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [employeeId, startDate, endDate]);
      
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error(`Error verificando registro de salida`, 'AttendanceRepository', { employeeId, date, error });
      throw new Error(`Error al verificar registro de salida: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros inconsistentes
   */
  async findInconsistentRecords(date?: Date): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros inconsistentes`, 'AttendanceRepository', { date });

      let dateFilter = '';
      const params: any[] = [];

      if (date) {
        dateFilter = 'AND ar.fecha >= @param0 AND ar.fecha <= @param1';
        params.push(startOfDay(date), endOfDay(date));
      }

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.deleted_at IS NULL ${dateFilter}
          AND (
            (ar.entrada IS NOT NULL AND ar.salida IS NULL AND ar.estado != '${AttendanceStatus.PENDIENTE}') OR
            (ar.entrada IS NULL AND ar.salida IS NOT NULL) OR
            (ar.entrada > ar.salida) OR
            (ar.horas_regulares < 0) OR
            (ar.horas_extras < 0) OR
            (ar.estado = '${AttendanceStatus.INCONSISTENTE}')
          )
        ORDER BY ar.fecha DESC, e.apellidos, e.nombres
      `;

      const results = await this.connection.query<any>(query, params);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros inconsistentes`, 'AttendanceRepository', { date, error });
      throw new Error(`Error al buscar registros inconsistentes: ${error}`);
    }
  }

  /**
   * 📊 Obtener estadísticas de asistencia
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<{
    totalRecords: number;
    approvedRecords: number;
    pendingRecords: number;
    rejectedRecords: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    averageAttendanceRate: number;
    topPerformingSucursales: Array<{
      sucursalId: string;
      attendanceRate: number;
    }>;
  }> {
    try {
      logger.debug(`Obteniendo estadísticas de asistencia`, 'AttendanceRepository', { startDate, endDate });

      // Estadísticas generales
      const statsQuery = `
        SELECT 
          COUNT(*) as total_records,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.COMPLETO}' THEN 1 END) as approved_records,
          COUNT(CASE WHEN ar.estado IN ('${AttendanceStatus.PENDIENTE}', '${AttendanceStatus.REVISION}') THEN 1 END) as pending_records,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.INCONSISTENTE}' THEN 1 END) as rejected_records,
          SUM(ar.horas_regulares) as total_regular_hours,
          SUM(ar.horas_extras) as total_overtime_hours
        FROM attendance_records ar
        WHERE ar.fecha >= @param0 AND ar.fecha <= @param1 AND ar.deleted_at IS NULL
      `;

      const statsResult = await this.connection.queryOne<any>(statsQuery, [startOfDay(startDate), endOfDay(endDate)]);

      // Top sucursales por asistencia
      const sucursalesQuery = `
        SELECT TOP 5
          s.id as sucursal_id,
          s.nombre as sucursal_nombre,
          CAST(
            CASE 
              WHEN COUNT(*) > 0 
              THEN (CAST(COUNT(CASE WHEN ar.estado = '${AttendanceStatus.COMPLETO}' THEN 1 END) AS FLOAT) / COUNT(*)) * 100
              ELSE 0 
            END AS DECIMAL(5,2)
          ) as attendance_rate
        FROM sucursales s
        INNER JOIN areas a ON s.id = a.sucursal_id
        INNER JOIN employees e ON a.id = e.area_id
        LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
          AND ar.fecha >= @param0 AND ar.fecha <= @param1 AND ar.deleted_at IS NULL
        WHERE s.deleted_at IS NULL AND s.is_active = 1
        GROUP BY s.id, s.nombre
        HAVING COUNT(*) > 0
        ORDER BY attendance_rate DESC
      `;

      const sucursalesResults = await this.connection.query<any>(sucursalesQuery, [startOfDay(startDate), endOfDay(endDate)]);

      const topPerformingSucursales = sucursalesResults.map(result => ({
        sucursalId: result.sucursal_id,
        attendanceRate: parseFloat(result.attendance_rate)
      }));

      // Calcular tasa de asistencia promedio
      const averageAttendanceRate = topPerformingSucursales.length > 0
        ? topPerformingSucursales.reduce((sum, s) => sum + s.attendanceRate, 0) / topPerformingSucursales.length
        : 0;

      return {
        totalRecords: parseInt(statsResult?.total_records) || 0,
        approvedRecords: parseInt(statsResult?.approved_records) || 0,
        pendingRecords: parseInt(statsResult?.pending_records) || 0,
        rejectedRecords: parseInt(statsResult?.rejected_records) || 0,
        totalRegularHours: parseFloat(statsResult?.total_regular_hours) || 0,
        totalOvertimeHours: parseFloat(statsResult?.total_overtime_hours) || 0,
        averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
        topPerformingSucursales
      };
    } catch (error) {
      logger.error(`Error obteniendo estadísticas de asistencia`, 'AttendanceRepository', { startDate, endDate, error });
      throw new Error(`Error al obtener estadísticas: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros para auditoría
   */
  async findForAudit(filters: {
    employeeIds?: string[];
    sucursalIds?: string[];
    areaIds?: string[];
    startDate?: Date;
    endDate?: Date;
    status?: AttendanceStatus[];
    hasOvertime?: boolean;
    isManual?: boolean;
  }): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros para auditoría`, 'AttendanceRepository', { filters });

      const whereConditions: string[] = ['ar.deleted_at IS NULL'];
      const params: any[] = [];
      let paramIndex = 0;

      if (filters.employeeIds && filters.employeeIds.length > 0) {
        whereConditions.push(`ar.employee_id IN ('${filters.employeeIds.join("','")}')`);
      }

      if (filters.sucursalIds && filters.sucursalIds.length > 0) {
        whereConditions.push(`s.id IN ('${filters.sucursalIds.join("','")}')`);
      }

      if (filters.areaIds && filters.areaIds.length > 0) {
        whereConditions.push(`a.id IN ('${filters.areaIds.join("','")}')`);
      }

      if (filters.startDate) {
        whereConditions.push(`ar.fecha >= @param${paramIndex}`);
        params.push(startOfDay(filters.startDate));
        paramIndex++;
      }

      if (filters.endDate) {
        whereConditions.push(`ar.fecha <= @param${paramIndex}`);
        params.push(endOfDay(filters.endDate));
        paramIndex++;
      }

      if (filters.status && filters.status.length > 0) {
        whereConditions.push(`ar.estado IN ('${filters.status.join("','")}')`);
      }

      if (filters.hasOvertime !== undefined) {
        if (filters.hasOvertime) {
          whereConditions.push('ar.horas_extras > 0');
        } else {
          whereConditions.push('ar.horas_extras = 0');
        }
      }

      if (filters.isManual !== undefined) {
        whereConditions.push(`ar.es_manual = @param${paramIndex}`);
        params.push(filters.isManual);
        paramIndex++;
      }

      const query = `
        SELECT 
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY ar.fecha DESC, s.nombre, a.nombre, e.apellidos, e.nombres
      `;

      const results = await this.connection.query<any>(query, params);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros para auditoría`, 'AttendanceRepository', { filters, error });
      throw new Error(`Error al buscar registros para auditoría: ${error}`);
    }
  }

  /**
   * 📥 Bulk insert para sincronización masiva desde dispositivos biométricos
   */
  async bulkCreate(attendances: AttendanceRecord[]): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Insertando ${attendances.length} registros de asistencia masivamente`, 'AttendanceRepository');

      if (attendances.length === 0) {
        return [];
      }

      // Usar transacción para operación masiva
      const result = await this.connection.transaction(async (tx) => {
        const insertedRecords: AttendanceRecord[] = [];

        // Insertar en lotes de 100 registros
        const batchSize = 100;
        for (let i = 0; i < attendances.length; i += batchSize) {
          const batch = attendances.slice(i, i + batchSize);
          
          // Construir valores para INSERT múltiple
          const values = batch.map((attendance, index) => {
            const baseIndex = i + index;
            return `(
              @param${baseIndex * 23}, @param${baseIndex * 23 + 1}, @param${baseIndex * 23 + 2}, 
              @param${baseIndex * 23 + 3}, @param${baseIndex * 23 + 4}, @param${baseIndex * 23 + 5}, 
              @param${baseIndex * 23 + 6}, @param${baseIndex * 23 + 7}, @param${baseIndex * 23 + 8}, 
              @param${baseIndex * 23 + 9}, @param${baseIndex * 23 + 10}, @param${baseIndex * 23 + 11}, 
              @param${baseIndex * 23 + 12}, @param${baseIndex * 23 + 13}, @param${baseIndex * 23 + 14}, 
              @param${baseIndex * 23 + 15}, @param${baseIndex * 23 + 16}, @param${baseIndex * 23 + 17}, 
              @param${baseIndex * 23 + 18}, @param${baseIndex * 23 + 19}, @param${baseIndex * 23 + 20}, 
              @param${baseIndex * 23 + 21}, @param${baseIndex * 23 + 22}
            )`;
          }).join(',');

          const query = `
            INSERT INTO attendance_records (
              id, employee_id, fecha, entrada, salida, entrada_2, salida_2,
              tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
              horas_suplementarias, horas_extraordinarias, horas_nocturnas,
              estado, es_manual, observaciones, modificado_por, fecha_modificacion,
              created_at, updated_at, is_active, version
            ) VALUES ${values}
          `;

          // Preparar parámetros para el lote
          const params: any[] = [];
          batch.forEach(attendance => {
            params.push(
              attendance.id,
              attendance.employeeId,
              attendance.fecha,
              attendance.entrada || null,
              attendance.salida || null,
              attendance.entrada2 || null,
              attendance.salida2 || null,
              attendance.tiempoAlmuerzo,
              attendance.horasRegulares,
              attendance.horasExtras,
              attendance.horasRecargo,
              attendance.horasSupplementarias,
              attendance.horasExtraordinarias,
              attendance.horasNocturnas,
              attendance.estado,
              attendance.esManual,
              attendance.observaciones || null,
              attendance.modificadoPor || null,
              attendance.fechaModificacion || null,
              attendance.createdAt,
              attendance.updatedAt,
              attendance.isActive,
              attendance.version
            );
          });

          await tx.query(query, params);
          insertedRecords.push(...batch);
        }

        return insertedRecords;
      });

      logger.info(`${result.length} registros de asistencia insertados masivamente`, 'AttendanceRepository');

      return result;
    } catch (error) {
      logger.error(`Error en inserción masiva de registros`, 'AttendanceRepository', { count: attendances.length, error });
      throw new Error(`Error en inserción masiva de registros: ${error}`);
    }
  }

  /**
   * ✅ Actualizar registros procesados por el sistema biométrico
   */
  async markAsProcessed(ids: string[]): Promise<void> {
    try {
      logger.debug(`Marcando ${ids.length} registros como procesados`, 'AttendanceRepository');

      if (ids.length === 0) {
        return;
      }

      const query = `
        UPDATE attendance_records 
        SET observaciones = ISNULL(observaciones, '') + ' | PROCESADO_BIOMETRICO: ' + CONVERT(VARCHAR, GETDATE(), 120),
            updated_at = GETDATE(),
            version = version + 1
        WHERE id IN ('${ids.join("','")}') AND deleted_at IS NULL
      `;

      await this.connection.query(query);

      logger.info(`${ids.length} registros marcados como procesados`, 'AttendanceRepository');
    } catch (error) {
      logger.error(`Error marcando registros como procesados`, 'AttendanceRepository', { ids, error });
      throw new Error(`Error al marcar registros como procesados: ${error}`);
    }
  }

  /**
   * 🔧 Mapear resultado de base de datos a entidad AttendanceRecord
   */
  private mapToEntity(dbResult: any): AttendanceRecord {
    try {
      const data: ICreateAttendanceRecordData = {
        id: dbResult.id,
        employeeId: dbResult.employee_id,
        fecha: new Date(dbResult.fecha),
        entrada: dbResult.entrada ? new Date(dbResult.entrada) : undefined,
        salida: dbResult.salida ? new Date(dbResult.salida) : undefined,
        entrada2: dbResult.entrada_2 ? new Date(dbResult.entrada_2) : undefined,
        salida2: dbResult.salida_2 ? new Date(dbResult.salida_2) : undefined,
        tiempoAlmuerzo: dbResult.tiempo_almuerzo || 0,
        horasRegulares: parseFloat(dbResult.horas_regulares) || 0,
        horasExtras: parseFloat(dbResult.horas_extras) || 0,
        horasRecargo: parseFloat(dbResult.horas_recargo) || 0,
        horasSupplementarias: parseFloat(dbResult.horas_suplementarias) || 0,
        horasExtraordinarias: parseFloat(dbResult.horas_extraordinarias) || 0,
        horasNocturnas: parseFloat(dbResult.horas_nocturnas) || 0,
        estado: dbResult.estado as AttendanceStatus,
        esManual: dbResult.es_manual || false,
        observaciones: dbResult.observaciones || undefined,
        modificadoPor: dbResult.modificado_por || undefined,
        fechaModificacion: dbResult.fecha_modificacion ? new Date(dbResult.fecha_modificacion) : undefined,
        createdAt: new Date(dbResult.created_at),
        updatedAt: new Date(dbResult.updated_at),
        isActive: dbResult.is_active,
        version: dbResult.version || 1
      };

      return new AttendanceRecord(data);
    } catch (error) {
      logger.error(`Error mapeando resultado de base de datos a entidad`, 'AttendanceRepository', { dbResult, error });
      throw new Error(`Error al mapear datos de asistencia: ${error}`);
    }
  }

  /**
   * 🧹 Limpiar registros antiguos (opcional - para mantenimiento)
   */
  async cleanupOldRecords(olderThanMonths: number = 24): Promise<number> {
    try {
      logger.debug(`Limpiando registros anteriores a ${olderThanMonths} meses`, 'AttendanceRepository');

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

      const query = `
        UPDATE attendance_records 
        SET deleted_at = GETDATE(), updated_at = GETDATE()
        WHERE fecha < @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.query(query, [cutoffDate]);

      logger.info(`${result.length} registros antiguos marcados para eliminación`, 'AttendanceRepository');
      
      return result.length;
    } catch (error) {
      logger.error(`Error limpiando registros antiguos`, 'AttendanceRepository', { olderThanMonths, error });
      throw new Error(`Error al limpiar registros antiguos: ${error}`);
    }
  }

  /**
   * 📊 Obtener resumen de horas por empleado en un período
   */
  async getEmployeeHoursSummary(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
    totalDays: number;
    workDays: number;
    absentDays: number;
    regularHours: number;
    overtimeHours: number;
    recargoHours: number;
    suplementariasHours: number;
    extraordinariasHours: number;
    nightHours: number;
    averageDailyHours: number;
  }> {
    try {
      logger.debug(`Obteniendo resumen de horas para empleado: ${employeeId}`, 'AttendanceRepository', { startDate, endDate });

      const query = `
        SELECT 
          COUNT(*) as total_days,
          COUNT(CASE WHEN ar.estado IN ('${AttendanceStatus.COMPLETO}', '${AttendanceStatus.MODIFICADO}') THEN 1 END) as work_days,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.AUSENTE}' THEN 1 END) as absent_days,
          SUM(ar.horas_regulares) as regular_hours,
          SUM(ar.horas_extras) as overtime_hours,
          SUM(ar.horas_recargo) as recargo_hours,
          SUM(ar.horas_suplementarias) as suplementarias_hours,
          SUM(ar.horas_extraordinarias) as extraordinarias_hours,
          SUM(ar.horas_nocturnas) as night_hours
        FROM attendance_records ar
        WHERE ar.employee_id = @param0 
          AND ar.fecha >= @param1 
          AND ar.fecha <= @param2
          AND ar.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [employeeId, startOfDay(startDate), endOfDay(endDate)]);

      if (!result) {
        return {
          totalDays: 0,
          workDays: 0,
          absentDays: 0,
          regularHours: 0,
          overtimeHours: 0,
          recargoHours: 0,
          suplementariasHours: 0,
          extraordinariasHours: 0,
          nightHours: 0,
          averageDailyHours: 0
        };
      }

      const totalHours = (parseFloat(result.regular_hours) || 0) + (parseFloat(result.overtime_hours) || 0);
      const workDays = parseInt(result.work_days) || 0;

      return {
        totalDays: parseInt(result.total_days) || 0,
        workDays,
        absentDays: parseInt(result.absent_days) || 0,
        regularHours: parseFloat(result.regular_hours) || 0,
        overtimeHours: parseFloat(result.overtime_hours) || 0,
        recargoHours: parseFloat(result.recargo_hours) || 0,
        suplementariasHours: parseFloat(result.suplementarias_hours) || 0,
        extraordinariasHours: parseFloat(result.extraordinarias_hours) || 0,
        nightHours: parseFloat(result.night_hours) || 0,
        averageDailyHours: workDays > 0 ? Math.round((totalHours / workDays) * 100) / 100 : 0
      };
    } catch (error) {
      logger.error(`Error obteniendo resumen de horas del empleado`, 'AttendanceRepository', { employeeId, startDate, endDate, error });
      throw new Error(`Error al obtener resumen de horas: ${error}`);
    }
  }

  /**
   * 🔍 Buscar registros que requieren sincronización
   */
  async findPendingSync(limit: number = 100): Promise<AttendanceRecord[]> {
    try {
      logger.debug(`Buscando registros pendientes de sincronización`, 'AttendanceRepository', { limit });

      const query = `
        SELECT TOP ${limit}
          ar.*,
          e.nombres + ' ' + e.apellidos as empleado_nombre,
          s.nombre as sucursal_nombre,
          a.nombre as area_nombre
        FROM attendance_records ar
        INNER JOIN employees e ON ar.employee_id = e.id
        INNER JOIN areas a ON e.area_id = a.id
        INNER JOIN sucursales s ON a.sucursal_id = s.id
        WHERE ar.deleted_at IS NULL
          AND ar.es_manual = 0
          AND (ar.observaciones IS NULL OR ar.observaciones NOT LIKE '%PROCESADO_BIOMETRICO%')
          AND ar.estado IN ('${AttendanceStatus.PENDIENTE}', '${AttendanceStatus.COMPLETO}')
        ORDER BY ar.created_at ASC
      `;

      const results = await this.connection.query<any>(query);
      
      return results.map(result => this.mapToEntity(result));
    } catch (error) {
      logger.error(`Error buscando registros pendientes de sincronización`, 'AttendanceRepository', { limit, error });
      throw new Error(`Error al buscar registros pendientes de sincronización: ${error}`);
    }
  }

  /**
   * 📈 Obtener tendencias de asistencia
   */
  async getAttendanceTrends(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<Array<{
    period: string;
    totalRecords: number;
    completedRecords: number;
    absentRecords: number;
    averageRegularHours: number;
    averageOvertimeHours: number;
    attendanceRate: number;
  }>> {
    try {
      logger.debug(`Obteniendo tendencias de asistencia`, 'AttendanceRepository', { startDate, endDate, groupBy });

      let dateFormat: string;
      let groupByClause: string;

      switch (groupBy) {
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          groupByClause = 'DATEPART(YEAR, ar.fecha), DATEPART(WEEK, ar.fecha)';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          groupByClause = 'DATEPART(YEAR, ar.fecha), DATEPART(MONTH, ar.fecha)';
          break;
        default: // daily
          dateFormat = 'YYYY-MM-DD';
          groupByClause = 'CAST(ar.fecha AS DATE)';
      }

      const query = `
        SELECT 
          FORMAT(ar.fecha, '${dateFormat}') as period,
          COUNT(*) as total_records,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.COMPLETO}' THEN 1 END) as completed_records,
          COUNT(CASE WHEN ar.estado = '${AttendanceStatus.AUSENTE}' THEN 1 END) as absent_records,
          AVG(ar.horas_regulares) as avg_regular_hours,
          AVG(ar.horas_extras) as avg_overtime_hours,
          CASE 
            WHEN COUNT(*) > 0 
            THEN CAST((COUNT(CASE WHEN ar.estado = '${AttendanceStatus.COMPLETO}' THEN 1 END) * 100.0 / COUNT(*)) AS DECIMAL(5,2))
            ELSE 0 
          END as attendance_rate
        FROM attendance_records ar
        WHERE ar.fecha >= @param0 AND ar.fecha <= @param1 AND ar.deleted_at IS NULL
        GROUP BY ${groupByClause}
        ORDER BY period
      `;

      const results = await this.connection.query<any>(query, [startOfDay(startDate), endOfDay(endDate)]);

      return results.map(result => ({
        period: result.period,
        totalRecords: parseInt(result.total_records) || 0,
        completedRecords: parseInt(result.completed_records) || 0,
        absentRecords: parseInt(result.absent_records) || 0,
        averageRegularHours: Math.round((parseFloat(result.avg_regular_hours) || 0) * 100) / 100,
        averageOvertimeHours: Math.round((parseFloat(result.avg_overtime_hours) || 0) * 100) / 100,
        attendanceRate: parseFloat(result.attendance_rate) || 0
      }));
    } catch (error) {
      logger.error(`Error obteniendo tendencias de asistencia`, 'AttendanceRepository', { startDate, endDate, groupBy, error });
      throw new Error(`Error al obtener tendencias de asistencia: ${error}`);
    }
  }

  /**
   * 🔧 Verificar integridad de datos
   */
  async verifyDataIntegrity(): Promise<{
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    issues: Array<{
      type: string;
      count: number;
      description: string;
    }>;
  }> {
    try {
      logger.debug(`Verificando integridad de datos`, 'AttendanceRepository');

      // Contar registros totales
      const totalQuery = `SELECT COUNT(*) as total FROM attendance_records WHERE deleted_at IS NULL`;
      const totalResult = await this.connection.queryOne<{ total: number }>(totalQuery);
      const totalRecords = totalResult?.total || 0;

      // Verificar diferentes tipos de problemas
      const issues = [];

      // 1. Registros con entrada pero sin salida (y no pendientes)
      const noExitQuery = `
        SELECT COUNT(*) as count 
        FROM attendance_records 
        WHERE entrada IS NOT NULL AND salida IS NULL 
          AND estado != '${AttendanceStatus.PENDIENTE}' 
          AND deleted_at IS NULL
      `;
      const noExitResult = await this.connection.queryOne<{ count: number }>(noExitQuery);
      if ((noExitResult?.count || 0) > 0) {
        issues.push({
          type: 'NO_EXIT',
          count: noExitResult!.count,
          description: 'Registros con entrada pero sin salida'
        });
      }

      // 2. Registros con salida anterior a entrada
      const invalidTimeQuery = `
        SELECT COUNT(*) as count 
        FROM attendance_records 
        WHERE entrada IS NOT NULL AND salida IS NOT NULL AND entrada > salida 
          AND deleted_at IS NULL
      `;
      const invalidTimeResult = await this.connection.queryOne<{ count: number }>(invalidTimeQuery);
      if ((invalidTimeResult?.count || 0) > 0) {
        issues.push({
          type: 'INVALID_TIME_ORDER',
          count: invalidTimeResult!.count,
          description: 'Registros con hora de salida anterior a entrada'
        });
      }

      // 3. Registros con horas negativas
      const negativeHoursQuery = `
        SELECT COUNT(*) as count 
        FROM attendance_records 
        WHERE (horas_regulares < 0 OR horas_extras < 0) 
          AND deleted_at IS NULL
      `;
      const negativeHoursResult = await this.connection.queryOne<{ count: number }>(negativeHoursQuery);
      if ((negativeHoursResult?.count || 0) > 0) {
        issues.push({
          type: 'NEGATIVE_HOURS',
          count: negativeHoursResult!.count,
          description: 'Registros con horas negativas'
        });
      }

      // 4. Registros duplicados (mismo empleado, fecha y hora similar)
      const duplicatesQuery = `
        SELECT COUNT(DISTINCT ar1.id) as count
        FROM attendance_records ar1
        INNER JOIN attendance_records ar2 ON ar1.employee_id = ar2.employee_id
          AND ar1.fecha = ar2.fecha
          AND ar1.id != ar2.id
          AND ABS(DATEDIFF(MINUTE, ar1.entrada, ar2.entrada)) <= 5
        WHERE ar1.deleted_at IS NULL AND ar2.deleted_at IS NULL
      `;
      const duplicatesResult = await this.connection.queryOne<{ count: number }>(duplicatesQuery);
      if ((duplicatesResult?.count || 0) > 0) {
        issues.push({
          type: 'DUPLICATES',
          count: duplicatesResult!.count,
          description: 'Registros duplicados'
        });
      }

      // 5. Empleados inexistentes
      const orphanedQuery = `
        SELECT COUNT(*) as count 
        FROM attendance_records ar
        LEFT JOIN employees e ON ar.employee_id = e.id
        WHERE e.id IS NULL AND ar.deleted_at IS NULL
      `;
      const orphanedResult = await this.connection.queryOne<{ count: number }>(orphanedQuery);
      if ((orphanedResult?.count || 0) > 0) {
        issues.push({
          type: 'ORPHANED_RECORDS',
          count: orphanedResult!.count,
          description: 'Registros de empleados inexistentes'
        });
      }

      const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);
      const validRecords = totalRecords - totalIssues;

      return {
        totalRecords,
        validRecords,
        invalidRecords: totalIssues,
        issues
      };
    } catch (error) {
      logger.error(`Error verificando integridad de datos`, 'AttendanceRepository', { error });
      throw new Error(`Error al verificar integridad de datos: ${error}`);
    }
  }

  /**
   * 🛠️ Reparar registros inconsistentes
   */
  async repairInconsistentRecords(): Promise<{
    repairedCount: number;
    repairActions: Array<{
      type: string;
      count: number;
      description: string;
    }>;
  }> {
    try {
      logger.debug(`Reparando registros inconsistentes`, 'AttendanceRepository');

      const repairActions = [];
      let totalRepaired = 0;

      // 1. Marcar registros con problemas de tiempo como inconsistentes
      const markInconsistentQuery = `
        UPDATE attendance_records 
        SET estado = '${AttendanceStatus.INCONSISTENTE}', updated_at = GETDATE()
        WHERE entrada IS NOT NULL AND salida IS NOT NULL AND entrada > salida 
          AND estado != '${AttendanceStatus.INCONSISTENTE}'
          AND deleted_at IS NULL
      `;
      const inconsistentResult = await this.connection.query(markInconsistentQuery);
      if (inconsistentResult.length > 0) {
        repairActions.push({
          type: 'MARK_INCONSISTENT',
          count: inconsistentResult.length,
          description: 'Marcados como inconsistentes por problemas de tiempo'
        });
        totalRepaired += inconsistentResult.length;
      }

      // 2. Corregir horas negativas a cero
      const fixNegativeHoursQuery = `
        UPDATE attendance_records 
        SET horas_regulares = 0, horas_extras = 0, updated_at = GETDATE()
        WHERE (horas_regulares < 0 OR horas_extras < 0) 
          AND deleted_at IS NULL
      `;
      const negativeResult = await this.connection.query(fixNegativeHoursQuery);
      if (negativeResult.length > 0) {
        repairActions.push({
          type: 'FIX_NEGATIVE_HOURS',
          count: negativeResult.length,
          description: 'Horas negativas corregidas a cero'
        });
        totalRepaired += negativeResult.length;
      }

      // 3. Marcar registros huérfanos para eliminación
      const markOrphanedQuery = `
        UPDATE ar SET deleted_at = GETDATE(), updated_at = GETDATE()
        FROM attendance_records ar
        LEFT JOIN employees e ON ar.employee_id = e.id
        WHERE e.id IS NULL AND ar.deleted_at IS NULL
      `;
      const orphanedResult = await this.connection.query(markOrphanedQuery);
      if (orphanedResult.length > 0) {
        repairActions.push({
          type: 'MARK_ORPHANED',
          count: orphanedResult.length,
          description: 'Registros huérfanos marcados para eliminación'
        });
        totalRepaired += orphanedResult.length;
      }

      logger.info(`${totalRepaired} registros reparados`, 'AttendanceRepository');

      return {
        repairedCount: totalRepaired,
        repairActions
      };
    } catch (error) {
      logger.error(`Error reparando registros inconsistentes`, 'AttendanceRepository', { error });
      throw new Error(`Error al reparar registros inconsistentes: ${error}`);
    }
  }
}

/**
 * 🏭 Factory function para crear instancia del repositorio
 */
export function createAttendanceSqlServerRepository(connection: SqlServerConnection): AttendanceSqlServerRepository {
  return new AttendanceSqlServerRepository(connection);
}

export default AttendanceSqlServerRepository;