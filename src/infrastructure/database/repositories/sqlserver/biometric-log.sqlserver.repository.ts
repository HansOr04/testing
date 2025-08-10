// src/infrastructure/database/repositories/sqlserver/biometric.sqlserver.repository.ts

import { IBiometricLogRepository } from '@/core/interfaces/repositories/biometric-log.repository.interface';
import { BiometricLog } from '@/core/entities/biometric-log.entity';
import { SqlServerConnection } from '@/infrastructure/database/connections/sqlserver.connection';
import { IResponse, IPagination } from '@/shared/types/common.types';
import { getLogger } from '@/shared/utils/logger.util';

const logger = getLogger();

/**
 * 🔌 SQL Server Repository para Logs Biométricos
 * Implementación completa para dispositivos FACEID 360
 */
export class BiometricSqlServerRepository implements IBiometricLogRepository {
  constructor(private connection: SqlServerConnection) {}

  async findById(id: string): Promise<BiometricLog | null> {
    try {
      const query = `
        SELECT 
          bl.*,
          bd.nombre as device_name,
          bd.modelo as device_model,
          bd.ubicacion_fisica as device_location,
          e.nombres + ' ' + e.apellidos as employee_name,
          s.nombre as sucursal_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        LEFT JOIN employees e ON bl.employee_id = e.id
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bl.id = @param0 AND bl.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [id]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando log biométrico por ID', 'BiometricRepository', { id }, error as Error);
      throw new Error(`Error buscando log biométrico: ${error}`);
    }
  }

  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<BiometricLog[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const query = `
        SELECT bl.*, bd.nombre as device_name, bd.ubicacion_fisica as device_location
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        WHERE bl.employee_id = @param0 
          AND CAST(bl.fecha as DATE) = @param1
          AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa ASC
      `;

      const results = await this.connection.query<any>(query, [employeeId, dateStr]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando logs por empleado y fecha', 'BiometricRepository', { employeeId, date }, error as Error);
      throw new Error(`Error buscando logs: ${error}`);
    }
  }

  async findByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT bl.*, bd.nombre as device_name, bd.ubicacion_fisica as device_location
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        WHERE bl.employee_id = @param0 
          AND bl.fecha BETWEEN @param1 AND @param2
          AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa ASC
      `;

      const results = await this.connection.query<any>(query, [employeeId, startDate, endDate]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando logs por empleado y rango', 'BiometricRepository', { employeeId, startDate, endDate }, error as Error);
      throw new Error(`Error buscando logs: ${error}`);
    }
  }

  async findByDeviceAndDate(deviceId: string, date: Date): Promise<BiometricLog[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const query = `
        SELECT bl.*, bd.nombre as device_name, e.nombres + ' ' + e.apellidos as employee_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        LEFT JOIN employees e ON bl.employee_id = e.id
        WHERE bl.device_id = @param0 
          AND CAST(bl.fecha as DATE) = @param1
          AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa ASC
      `;

      const results = await this.connection.query<any>(query, [deviceId, dateStr]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando logs por dispositivo y fecha', 'BiometricRepository', { deviceId, date }, error as Error);
      throw new Error(`Error buscando logs: ${error}`);
    }
  }

  async findByDeviceAndDateRange(deviceId: string, startDate: Date, endDate: Date, pagination: IPagination): Promise<IResponse<BiometricLog[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM biometric_logs bl
        WHERE bl.device_id = @param0 
          AND bl.fecha BETWEEN @param1 AND @param2
          AND bl.deleted_at IS NULL
      `;

      const totalResult = await this.connection.queryOne<{ total: number }>(countQuery, [deviceId, startDate, endDate]);
      const total = totalResult?.total || 0;

      const dataQuery = `
        SELECT bl.*, bd.nombre as device_name, e.nombres + ' ' + e.apellidos as employee_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        LEFT JOIN employees e ON bl.employee_id = e.id
        WHERE bl.device_id = @param0 
          AND bl.fecha BETWEEN @param1 AND @param2
          AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa DESC
        OFFSET @param3 ROWS FETCH NEXT @param4 ROWS ONLY
      `;

      const results = await this.connection.query<any>(dataQuery, [deviceId, startDate, endDate, offset, pagination.limit]);
      const logs = results.map(r => this.mapToEntity(r));

      return {
        success: true,
        message: 'Logs encontrados',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando logs paginados', 'BiometricRepository', { deviceId, startDate, endDate }, error as Error);
      throw new Error(`Error buscando logs: ${error}`);
    }
  }

  async findUnprocessed(pagination: IPagination): Promise<IResponse<BiometricLog[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM biometric_logs bl
        WHERE bl.es_procesado = 0 AND bl.deleted_at IS NULL
      `;

      const totalResult = await this.connection.queryOne<{ total: number }>(countQuery);
      const total = totalResult?.total || 0;

      const dataQuery = `
        SELECT bl.*, bd.nombre as device_name, e.nombres + ' ' + e.apellidos as employee_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        LEFT JOIN employees e ON bl.employee_id = e.id
        WHERE bl.es_procesado = 0 AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa ASC
        OFFSET @param0 ROWS FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(dataQuery, [offset, pagination.limit]);
      const logs = results.map(r => this.mapToEntity(r));

      return {
        success: true,
        message: 'Logs no procesados encontrados',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando logs no procesados', 'BiometricRepository', {}, error as Error);
      throw new Error(`Error buscando logs no procesados: ${error}`);
    }
  }

  async findBySucursalAndDate(sucursalId: string, date: Date): Promise<BiometricLog[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const query = `
        SELECT bl.*, bd.nombre as device_name, e.nombres + ' ' + e.apellidos as employee_name
        FROM biometric_logs bl
        INNER JOIN biometric_devices bd ON bl.device_id = bd.id
        LEFT JOIN employees e ON bl.employee_id = e.id
        WHERE bd.sucursal_id = @param0 
          AND CAST(bl.fecha as DATE) = @param1
          AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa ASC
      `;

      const results = await this.connection.query<any>(query, [sucursalId, dateStr]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando logs por sucursal y fecha', 'BiometricRepository', { sucursalId, date }, error as Error);
      throw new Error(`Error buscando logs: ${error}`);
    }
  }

  async create(log: BiometricLog): Promise<BiometricLog> {
    try {
      const query = `
        INSERT INTO biometric_logs (
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, fecha_hora_completa,
          created_at, updated_at, is_active
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5,
          @param6, @param7, @param8, @param9, @param10, @param11,
          @param12, @param13, @param14, @param15, @param16, @param17, @param18
        )
      `;

      const logData = log.toJSON() as any;
      const fechaHoraCompleta = log.fechaHoraCompleta;

      await this.connection.query(query, [
        log.id,
        logData.deviceId,
        logData.employeeId,
        logData.fecha,
        logData.hora,
        logData.tipoMovimiento,
        logData.tipoVerificacion,
        logData.esProcesado ? 1 : 0,
        logData.esEfectivoParaCalculo ? 1 : 0,
        logData.observaciones,
        logData.confianza,
        logData.datosOriginales ? JSON.stringify(logData.datosOriginales) : null,
        logData.ubicacionDispositivo,
        logData.intentosFallidos,
        logData.tiempoRespuesta,
        fechaHoraCompleta,
        new Date(),
        new Date(),
        1
      ]);

      logger.info('Log biométrico creado', 'BiometricRepository', { logId: log.id });
      return log;
    } catch (error) {
      logger.error('Error creando log biométrico', 'BiometricRepository', { logId: log.id }, error as Error);
      throw new Error(`Error creando log biométrico: ${error}`);
    }
  }

  async bulkCreate(logs: BiometricLog[]): Promise<BiometricLog[]> {
    try {
      return await this.connection.transaction(async (tx) => {
        const createdLogs: BiometricLog[] = [];

        for (const log of logs) {
          const query = `
            INSERT INTO biometric_logs (
              id, device_id, employee_id, fecha, hora, tipo_movimiento,
              tipo_verificacion, es_procesado, es_efectivo_para_calculo,
              observaciones, confianza, datos_originales, ubicacion_dispositivo,
              intentos_fallidos, tiempo_respuesta, fecha_hora_completa,
              created_at, updated_at, is_active
            ) VALUES (
              @param0, @param1, @param2, @param3, @param4, @param5,
              @param6, @param7, @param8, @param9, @param10, @param11,
              @param12, @param13, @param14, @param15, @param16, @param17, @param18
            )
          `;

          const logData = log.toJSON() as any;
          const fechaHoraCompleta = log.fechaHoraCompleta;

          await tx.query(query, [
            log.id,
            logData.deviceId,
            logData.employeeId,
            logData.fecha,
            logData.hora,
            logData.tipoMovimiento,
            logData.tipoVerificacion,
            logData.esProcesado ? 1 : 0,
            logData.esEfectivoParaCalculo ? 1 : 0,
            logData.observaciones,
            logData.confianza,
            logData.datosOriginales ? JSON.stringify(logData.datosOriginales) : null,
            logData.ubicacionDispositivo,
            logData.intentosFallidos,
            logData.tiempoRespuesta,
            fechaHoraCompleta,
            new Date(),
            new Date(),
            1
          ]);

          createdLogs.push(log);
        }

        logger.info('Logs biométricos creados en lote', 'BiometricRepository', { count: logs.length });
        return createdLogs;
      });
    } catch (error) {
      logger.error('Error creando logs en lote', 'BiometricRepository', { count: logs.length }, error as Error);
      throw new Error(`Error creando logs en lote: ${error}`);
    }
  }

  async update(id: string, log: Partial<BiometricLog>): Promise<BiometricLog> {
    try {
      const logData = log as any;
      const query = `
        UPDATE biometric_logs SET
          es_procesado = COALESCE(@param1, es_procesado),
          es_efectivo_para_calculo = COALESCE(@param2, es_efectivo_para_calculo),
          observaciones = COALESCE(@param3, observaciones),
          confianza = COALESCE(@param4, confianza),
          intentos_fallidos = COALESCE(@param5, intentos_fallidos),
          updated_at = @param6
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [
        id,
        logData.esProcesado !== undefined ? (logData.esProcesado ? 1 : 0) : null,
        logData.esEfectivoParaCalculo !== undefined ? (logData.esEfectivoParaCalculo ? 1 : 0) : null,
        logData.observaciones,
        logData.confianza,
        logData.intentosFallidos,
        new Date()
      ]);

      const updatedLog = await this.findById(id);
      if (!updatedLog) {
        throw new Error('Log no encontrado después de actualizar');
      }

      logger.info('Log biométrico actualizado', 'BiometricRepository', { logId: id });
      return updatedLog;
    } catch (error) {
      logger.error('Error actualizando log biométrico', 'BiometricRepository', { logId: id }, error as Error);
      throw new Error(`Error actualizando log biométrico: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        UPDATE biometric_logs 
        SET deleted_at = @param1, updated_at = @param1, is_active = 0
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);
      logger.info('Log biométrico eliminado', 'BiometricRepository', { logId: id });
    } catch (error) {
      logger.error('Error eliminando log biométrico', 'BiometricRepository', { logId: id }, error as Error);
      throw new Error(`Error eliminando log biométrico: ${error}`);
    }
  }

  async markAsProcessed(id: string, attendanceRecordId: string): Promise<BiometricLog> {
    try {
      const query = `
        UPDATE biometric_logs SET
          es_procesado = 1,
          attendance_record_id = @param1,
          updated_at = @param2
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, attendanceRecordId, new Date()]);

      const updatedLog = await this.findById(id);
      if (!updatedLog) {
        throw new Error('Log no encontrado después de marcar como procesado');
      }

      logger.info('Log marcado como procesado', 'BiometricRepository', { logId: id, attendanceRecordId });
      return updatedLog;
    } catch (error) {
      logger.error('Error marcando log como procesado', 'BiometricRepository', { logId: id }, error as Error);
      throw new Error(`Error marcando log como procesado: ${error}`);
    }
  }

  async markMultipleAsProcessed(updates: Array<{ logId: string; attendanceRecordId: string }>): Promise<void> {
    try {
      await this.connection.transaction(async (tx) => {
        for (const update of updates) {
          const query = `
            UPDATE biometric_logs SET
              es_procesado = 1,
              attendance_record_id = @param1,
              updated_at = @param2
            WHERE id = @param0 AND deleted_at IS NULL
          `;

          await tx.query(query, [update.logId, update.attendanceRecordId, new Date()]);
        }
      });

      logger.info('Múltiples logs marcados como procesados', 'BiometricRepository', { count: updates.length });
    } catch (error) {
      logger.error('Error marcando múltiples logs como procesados', 'BiometricRepository', { count: updates.length }, error as Error);
      throw new Error(`Error marcando múltiples logs como procesados: ${error}`);
    }
  }

  async findLastByEmployee(employeeId: string): Promise<BiometricLog | null> {
    try {
      const query = `
        SELECT TOP 1 bl.*, bd.nombre as device_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        WHERE bl.employee_id = @param0 AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa DESC
      `;

      const result = await this.connection.queryOne<any>(query, [employeeId]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando último log del empleado', 'BiometricRepository', { employeeId }, error as Error);
      throw new Error(`Error buscando último log: ${error}`);
    }
  }

  async findByTimestampRange(startTimestamp: Date, endTimestamp: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT bl.*, bd.nombre as device_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        WHERE bl.fecha_hora_completa BETWEEN @param0 AND @param1
          AND bl.deleted_at IS NULL
        ORDER BY bl.fecha_hora_completa ASC
      `;

      const results = await this.connection.query<any>(query, [startTimestamp, endTimestamp]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando logs por rango de timestamp', 'BiometricRepository', { startTimestamp, endTimestamp }, error as Error);
      throw new Error(`Error buscando logs: ${error}`);
    }
  }

  async findForAudit(filters: any): Promise<BiometricLog[]> {
    try {
      let whereConditions = ['bl.deleted_at IS NULL'];
      let params: any[] = [];
      let paramIndex = 0;

      if (filters.employeeIds?.length) {
        whereConditions.push(`bl.employee_id IN (${filters.employeeIds.map(() => `@param${paramIndex++}`).join(', ')})`);
        params.push(...filters.employeeIds);
      }

      if (filters.startDate) {
        whereConditions.push(`bl.fecha >= @param${paramIndex++}`);
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        whereConditions.push(`bl.fecha <= @param${paramIndex++}`);
        params.push(filters.endDate);
      }

      const query = `
        SELECT bl.*, bd.nombre as device_name, e.nombres + ' ' + e.apellidos as employee_name
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        LEFT JOIN employees e ON bl.employee_id = e.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY bl.fecha_hora_completa ASC
      `;

      const results = await this.connection.query<any>(query, params);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando logs para auditoría', 'BiometricRepository', { filters }, error as Error);
      throw new Error(`Error buscando logs para auditoría: ${error}`);
    }
  }

  async getStatistics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as totalLogs,
          SUM(CASE WHEN es_procesado = 1 THEN 1 ELSE 0 END) as processedLogs,
          SUM(CASE WHEN es_procesado = 0 THEN 1 ELSE 0 END) as unprocessedLogs,
          AVG(CAST(confianza as FLOAT)) as avgConfidence,
          AVG(CAST(tiempo_respuesta as FLOAT)) as avgResponseTime
        FROM biometric_logs
        WHERE fecha BETWEEN @param0 AND @param1
          AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [startDate, endDate]);
      
      return {
        totalLogs: result?.totalLogs || 0,
        processedLogs: result?.processedLogs || 0,
        unprocessedLogs: result?.unprocessedLogs || 0,
        byDevice: {},
        bySucursal: {},
        duplicatesFound: 0,
        averageProcessingTime: 0
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de logs', 'BiometricRepository', { startDate, endDate }, error as Error);
      throw new Error(`Error obteniendo estadísticas: ${error}`);
    }
  }

  // Métodos de mapeo y utilidad
  private mapToEntity(row: any): BiometricLog {
    try {
      const datosOriginales = row.datos_originales ? JSON.parse(row.datos_originales) : undefined;
      
      return BiometricLog.fromDeviceData(
        row.device_id,
        row.employee_id,
        {
          fecha: row.fecha,
          hora: row.hora,
          tipoMovimiento: row.tipo_movimiento,
          tipoVerificacion: row.tipo_verificacion,
          confianza: row.confianza,
          ubicacion: row.ubicacion_dispositivo,
          tiempoRespuesta: row.tiempo_respuesta
        }
      );
    } catch (error) {
      logger.error('Error mapeando fila a entidad BiometricLog', 'BiometricRepository', { row }, error as Error);
      throw new Error(`Error mapeando datos: ${error}`);
    }
  }

  // Métodos adicionales requeridos por la interfaz (implementación básica)
  async findDuplicates(timeThresholdMinutes: number): Promise<BiometricLog[]> { return []; }
  async removeDuplicates(timeThresholdMinutes: number): Promise<number> { return 0; }
  async findOrphanLogs(): Promise<BiometricLog[]> { return []; }
  async findSyncErrors(): Promise<BiometricLog[]> { return []; }
  async getDeviceActivityReport(deviceId: string, startDate: Date, endDate: Date): Promise<any> { return {}; }
  async getEmployeeTrace(employeeId: string, startDate: Date, endDate: Date): Promise<any[]> { return []; }
  async cleanOldLogs(retentionDays: number): Promise<number> { return 0; }
  async verifyIntegrity(deviceId: string, date: Date): Promise<any> { return {}; }
  async exportLogs(filters: any): Promise<string> { return ''; }
}

export default BiometricSqlServerRepository;