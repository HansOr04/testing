/**
 * BIOMETRIC LOG POSTGRESQL REPOSITORY
 * Implementación de repositorio de logs biométricos para PostgreSQL
 * Maneja todas las operaciones de persistencia para la entidad BiometricLog
 */

import { Pool, PoolClient } from 'pg';
import { BiometricLog } from '@core/entities/biometric-log.entity';
import { WorkCode } from '@core/enums/work-code.enum';
import { IBiometricLogRepository } from '@core/interfaces/repositories/biometric-log.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { VerificationType } from '@shared/types/biometric.types';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

export class BiometricLogPostgresRepository implements IBiometricLogRepository {
  constructor(private pool: Pool) {}

  /**
   * Buscar log biométrico por ID
   */
  async findById(id: string): Promise<BiometricLog | null> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBiometricLog(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando log biométrico por ID', 'BiometricLogPostgresRepository', { id }, error as Error);
      throw new Error(`Error al buscar log: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs por empleado y fecha
   */
  async findByEmployeeAndDate(employeeId: string, date: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE employee_id = $1 AND fecha = $2 AND deleted_at IS NULL
        ORDER BY hora ASC
      `;
      
      const result = await this.pool.query(query, [employeeId, date]);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs por empleado y fecha', 'BiometricLogPostgresRepository', { employeeId, date }, error as Error);
      throw new Error(`Error al buscar logs: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs por empleado en un rango de fechas
   */
  async findByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE employee_id = $1 AND fecha BETWEEN $2 AND $3 AND deleted_at IS NULL
        ORDER BY fecha ASC, hora ASC
      `;
      
      const result = await this.pool.query(query, [employeeId, startDate, endDate]);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs por empleado y rango', 'BiometricLogPostgresRepository', { employeeId, startDate, endDate }, error as Error);
      throw new Error(`Error al buscar logs: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs por dispositivo y fecha
   */
  async findByDeviceAndDate(deviceId: string, date: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE device_id = $1 AND fecha = $2 AND deleted_at IS NULL
        ORDER BY hora ASC
      `;
      
      const result = await this.pool.query(query, [deviceId, date]);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs por dispositivo y fecha', 'BiometricLogPostgresRepository', { deviceId, date }, error as Error);
      throw new Error(`Error al buscar logs: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs por dispositivo en un rango de fechas
   */
  async findByDeviceAndDateRange(
    deviceId: string, 
    startDate: Date, 
    endDate: Date,
    pagination: IPagination
  ): Promise<IResponse<BiometricLog[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM biometric_logs 
        WHERE device_id = $1 AND fecha BETWEEN $2 AND $3 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE device_id = $1 AND fecha BETWEEN $2 AND $3 AND deleted_at IS NULL
        ORDER BY fecha DESC, hora DESC
        LIMIT $4 OFFSET $5
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [deviceId, startDate, endDate]),
        this.pool.query(query, [deviceId, startDate, endDate, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const logs = dataResult.rows.map(row => this.mapRowToBiometricLog(row));

      return {
        success: true,
        message: 'Logs biométricos obtenidos exitosamente',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando logs por dispositivo y rango', 'BiometricLogPostgresRepository', { deviceId, startDate, endDate }, error as Error);
      throw new Error(`Error al buscar logs: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs no procesados
   */
  async findUnprocessed(pagination: IPagination): Promise<IResponse<BiometricLog[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM biometric_logs 
        WHERE es_procesado = false AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE es_procesado = false AND deleted_at IS NULL
        ORDER BY fecha ASC, hora ASC
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const logs = dataResult.rows.map(row => this.mapRowToBiometricLog(row));

      return {
        success: true,
        message: 'Logs no procesados obtenidos exitosamente',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando logs no procesados', 'BiometricLogPostgresRepository', pagination, error as Error);
      throw new Error(`Error al buscar logs no procesados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs por sucursal y fecha
   */
  async findBySucursalAndDate(sucursalId: string, date: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          bl.id, bl.device_id, bl.employee_id, bl.fecha, bl.hora, bl.tipo_movimiento,
          bl.tipo_verificacion, bl.es_procesado, bl.es_efectivo_para_calculo,
          bl.observaciones, bl.confianza, bl.datos_originales, bl.ubicacion_dispositivo,
          bl.intentos_fallidos, bl.tiempo_respuesta, bl.is_active,
          bl.created_at, bl.updated_at, bl.deleted_at, bl.version
        FROM biometric_logs bl
        INNER JOIN biometric_devices bd ON bl.device_id = bd.id
        WHERE bd.sucursal_id = $1 AND bl.fecha = $2 AND bl.deleted_at IS NULL
        ORDER BY bl.hora ASC
      `;
      
      const result = await this.pool.query(query, [sucursalId, date]);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs por sucursal y fecha', 'BiometricLogPostgresRepository', { sucursalId, date }, error as Error);
      throw new Error(`Error al buscar logs: ${(error as Error).message}`);
    }
  }

  /**
   * Crear nuevo log biométrico
   */
  async create(log: BiometricLog): Promise<BiometricLog> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO biometric_logs (
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING *
      `;

      const values = [
        log.id,
        log.deviceId,
        log.employeeId,
        log.fecha,
        log.hora,
        log.tipoMovimiento,
        log.tipoVerificacion,
        log.esProcesado,
        log.esEfectivoParaCalculo,
        log.observaciones || null,
        log.confianza,
        log.datosOriginales ? JSON.stringify(log.datosOriginales) : null,
        log.ubicacionDispositivo || null,
        log.intentosFallidos,
        log.tiempoRespuesta || null,
        log.isActive,
        log.createdAt,
        log.updatedAt,
        log.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Log biométrico creado exitosamente', 'BiometricLogPostgresRepository', { 
        id: log.id, 
        employeeId: log.employeeId,
        deviceId: log.deviceId
      });
      
      return this.mapRowToBiometricLog(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando log biométrico', 'BiometricLogPostgresRepository', { 
        employeeId: log.employeeId,
        deviceId: log.deviceId
      }, error as Error);
      
      throw new Error(`Error al crear log biométrico: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Crear múltiples logs biométricos (bulk insert)
   */
  async bulkCreate(logs: BiometricLog[]): Promise<BiometricLog[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const values: any[] = [];
      const placeholders: string[] = [];
      
      logs.forEach((log, index) => {
        const baseIndex = index * 19;
        placeholders.push(`(${Array.from({length: 19}, (_, i) => `$${baseIndex + i + 1}`).join(', ')})`);
        
        values.push(
          log.id,
          log.deviceId,
          log.employeeId,
          log.fecha,
          log.hora,
          log.tipoMovimiento,
          log.tipoVerificacion,
          log.esProcesado,
          log.esEfectivoParaCalculo,
          log.observaciones || null,
          log.confianza,
          log.datosOriginales ? JSON.stringify(log.datosOriginales) : null,
          log.ubicacionDispositivo || null,
          log.intentosFallidos,
          log.tiempoRespuesta || null,
          log.isActive,
          log.createdAt,
          log.updatedAt,
          log.version
        );
      });

      const query = `
        INSERT INTO biometric_logs (
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, version
        ) VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Logs biométricos creados en lote', 'BiometricLogPostgresRepository', { count: logs.length });
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando logs biométricos en lote', 'BiometricLogPostgresRepository', { count: logs.length }, error as Error);
      throw new Error(`Error al crear logs en lote: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar log biométrico existente
   */
  async update(id: string, logData: Partial<BiometricLog>): Promise<BiometricLog> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const existingLog = await this.findById(id);
      if (!existingLog) {
        throw new Error('Log biométrico no encontrado');
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (logData.esProcesado !== undefined) {
        updateFields.push(`es_procesado = $${paramIndex++}`);
        values.push(logData.esProcesado);
      }

      if (logData.esEfectivoParaCalculo !== undefined) {
        updateFields.push(`es_efectivo_para_calculo = $${paramIndex++}`);
        values.push(logData.esEfectivoParaCalculo);
      }

      if (logData.observaciones !== undefined) {
        updateFields.push(`observaciones = $${paramIndex++}`);
        values.push(logData.observaciones);
      }

      if (logData.confianza !== undefined) {
        updateFields.push(`confianza = $${paramIndex++}`);
        values.push(logData.confianza);
      }

      if (logData.intentosFallidos !== undefined) {
        updateFields.push(`intentos_fallidos = $${paramIndex++}`);
        values.push(logData.intentosFallidos);
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      updateFields.push(`version = $${paramIndex++}`);
      values.push(existingLog.version + 1);

      // ID para WHERE
      values.push(id);

      const query = `
        UPDATE biometric_logs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Log biométrico no encontrado para actualizar');
      }

      logger.info('Log biométrico actualizado', 'BiometricLogPostgresRepository', { id });
      return this.mapRowToBiometricLog(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando log biométrico', 'BiometricLogPostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar log: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar log biométrico
   */
  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE biometric_logs 
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Log biométrico no encontrado para eliminar');
      }

      logger.info('Log biométrico eliminado', 'BiometricLogPostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando log biométrico', 'BiometricLogPostgresRepository', { id }, error as Error);
      throw new Error(`Error al eliminar log: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Marcar log como procesado
   */
  async markAsProcessed(id: string, attendanceRecordId: string): Promise<BiometricLog> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE biometric_logs 
        SET es_procesado = true, 
            attendance_record_id = $1,
            updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [attendanceRecordId, new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Log biométrico no encontrado');
      }

      logger.info('Log marcado como procesado', 'BiometricLogPostgresRepository', { id, attendanceRecordId });
      return this.mapRowToBiometricLog(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error marcando log como procesado', 'BiometricLogPostgresRepository', { id }, error as Error);
      throw new Error(`Error al marcar como procesado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Marcar múltiples logs como procesados
   */
  async markMultipleAsProcessed(updates: Array<{ logId: string; attendanceRecordId: string; }>): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const update of updates) {
        const query = `
          UPDATE biometric_logs 
          SET es_procesado = true, 
              attendance_record_id = $1,
              updated_at = $2
          WHERE id = $3 AND deleted_at IS NULL
        `;

        await client.query(query, [update.attendanceRecordId, new Date(), update.logId]);
      }

      await client.query('COMMIT');
      logger.info('Múltiples logs marcados como procesados', 'BiometricLogPostgresRepository', { count: updates.length });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error marcando múltiples logs como procesados', 'BiometricLogPostgresRepository', { count: updates.length }, error as Error);
      throw new Error(`Error al marcar logs como procesados: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Buscar logs duplicados
   */
  async findDuplicates(timeThresholdMinutes: number): Promise<BiometricLog[]> {
    try {
      const query = `
        WITH duplicates AS (
          SELECT 
            id, employee_id, device_id, fecha, hora, tipo_movimiento,
            ROW_NUMBER() OVER (
              PARTITION BY employee_id, device_id, tipo_movimiento, fecha
              ORDER BY created_at DESC
            ) as rn
          FROM biometric_logs 
          WHERE deleted_at IS NULL
            AND ABS(EXTRACT(EPOCH FROM (hora::time - LAG(hora::time) OVER (
              PARTITION BY employee_id, device_id, tipo_movimiento, fecha
              ORDER BY hora
            ))) / 60) < $1
        )
        SELECT 
          bl.id, bl.device_id, bl.employee_id, bl.fecha, bl.hora, bl.tipo_movimiento,
          bl.tipo_verificacion, bl.es_procesado, bl.es_efectivo_para_calculo,
          bl.observaciones, bl.confianza, bl.datos_originales, bl.ubicacion_dispositivo,
          bl.intentos_fallidos, bl.tiempo_respuesta, bl.is_active,
          bl.created_at, bl.updated_at, bl.deleted_at, bl.version
        FROM biometric_logs bl
        INNER JOIN duplicates d ON bl.id = d.id
        WHERE d.rn > 1
        ORDER BY bl.fecha DESC, bl.hora DESC
      `;
      
      const result = await this.pool.query(query, [timeThresholdMinutes]);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs duplicados', 'BiometricLogPostgresRepository', { timeThresholdMinutes }, error as Error);
      throw new Error(`Error al buscar duplicados: ${(error as Error).message}`);
    }
  }

  /**
   * Eliminar logs duplicados
   */
  async removeDuplicates(timeThresholdMinutes: number): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        WITH duplicates AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY employee_id, device_id, tipo_movimiento, fecha
              ORDER BY created_at DESC
            ) as rn
          FROM biometric_logs 
          WHERE deleted_at IS NULL
            AND ABS(EXTRACT(EPOCH FROM (hora::time - LAG(hora::time) OVER (
              PARTITION BY employee_id, device_id, tipo_movimiento, fecha
              ORDER BY hora
            ))) / 60) < $1
        )
        UPDATE biometric_logs 
        SET deleted_at = $2, updated_at = $2
        FROM duplicates
        WHERE biometric_logs.id = duplicates.id AND duplicates.rn > 1
      `;

      const result = await client.query(query, [timeThresholdMinutes, new Date()]);
      await client.query('COMMIT');

      const deletedCount = result.rowCount || 0;
      logger.info('Logs duplicados eliminados', 'BiometricLogPostgresRepository', { deletedCount });
      return deletedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando duplicados', 'BiometricLogPostgresRepository', { timeThresholdMinutes }, error as Error);
      throw new Error(`Error al eliminar duplicados: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener último log de un empleado
   */
  async findLastByEmployee(employeeId: string): Promise<BiometricLog | null> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE employee_id = $1 AND deleted_at IS NULL
        ORDER BY fecha DESC, hora DESC
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [employeeId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBiometricLog(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando último log de empleado', 'BiometricLogPostgresRepository', { employeeId }, error as Error);
      throw new Error(`Error al buscar último log: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs por rango de timestamp
   */
  async findByTimestampRange(startTimestamp: Date, endTimestamp: Date): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE created_at BETWEEN $1 AND $2 AND deleted_at IS NULL
        ORDER BY created_at ASC
      `;
      
      const result = await this.pool.query(query, [startTimestamp, endTimestamp]);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs por timestamp', 'BiometricLogPostgresRepository', { startTimestamp, endTimestamp }, error as Error);
      throw new Error(`Error al buscar logs por timestamp: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener logs para auditoría
   */
  async findForAudit(filters: {
    employeeIds?: string[];
    deviceIds?: string[];
    sucursalIds?: string[];
    startDate?: Date;
    endDate?: Date;
    processed?: boolean;
    hasAttendanceRecord?: boolean;
  }): Promise<BiometricLog[]> {
    try {
      const conditions: string[] = ['bl.deleted_at IS NULL'];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.employeeIds && filters.employeeIds.length > 0) {
        const placeholders = filters.employeeIds.map(() => `$${paramIndex++}`).join(',');
        conditions.push(`bl.employee_id IN (${placeholders})`);
        values.push(...filters.employeeIds);
      }

      if (filters.deviceIds && filters.deviceIds.length > 0) {
        const placeholders = filters.deviceIds.map(() => `$${paramIndex++}`).join(',');
        conditions.push(`bl.device_id IN (${placeholders})`);
        values.push(...filters.deviceIds);
      }

      if (filters.sucursalIds && filters.sucursalIds.length > 0) {
        const placeholders = filters.sucursalIds.map(() => `$${paramIndex++}`).join(',');
        conditions.push(`bd.sucursal_id IN (${placeholders})`);
        values.push(...filters.sucursalIds);
      }

      if (filters.startDate) {
        conditions.push(`bl.fecha >= $${paramIndex++}`);
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push(`bl.fecha <= ${paramIndex++}`);
        values.push(filters.endDate);
      }

      if (filters.processed !== undefined) {
        conditions.push(`bl.es_procesado = ${paramIndex++}`);
        values.push(filters.processed);
      }

      if (filters.hasAttendanceRecord !== undefined) {
        if (filters.hasAttendanceRecord) {
          conditions.push(`bl.attendance_record_id IS NOT NULL`);
        } else {
          conditions.push(`bl.attendance_record_id IS NULL`);
        }
      }

      const query = `
        SELECT 
          bl.id, bl.device_id, bl.employee_id, bl.fecha, bl.hora, bl.tipo_movimiento,
          bl.tipo_verificacion, bl.es_procesado, bl.es_efectivo_para_calculo,
          bl.observaciones, bl.confianza, bl.datos_originales, bl.ubicacion_dispositivo,
          bl.intentos_fallidos, bl.tiempo_respuesta, bl.is_active,
          bl.created_at, bl.updated_at, bl.deleted_at, bl.version
        FROM biometric_logs bl
        LEFT JOIN biometric_devices bd ON bl.device_id = bd.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY bl.fecha DESC, bl.hora DESC
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs para auditoría', 'BiometricLogPostgresRepository', filters, error as Error);
      throw new Error(`Error al buscar logs para auditoría: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener estadísticas de logs biométricos
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<{
    totalLogs: number;
    processedLogs: number;
    unprocessedLogs: number;
    byDevice: Record<string, { total: number; processed: number; unprocessed: number; }>;
    bySucursal: Record<string, { total: number; processed: number; unprocessed: number; }>;
    duplicatesFound: number;
    averageProcessingTime: number;
  }> {
    try {
      const queries = [
        'SELECT COUNT(*) as total FROM biometric_logs WHERE fecha BETWEEN $1 AND $2 AND deleted_at IS NULL',
        'SELECT COUNT(*) as processed FROM biometric_logs WHERE fecha BETWEEN $1 AND $2 AND es_procesado = true AND deleted_at IS NULL',
        'SELECT COUNT(*) as unprocessed FROM biometric_logs WHERE fecha BETWEEN $1 AND $2 AND es_procesado = false AND deleted_at IS NULL',
        `SELECT 
           bl.device_id, 
           COUNT(*) as total,
           COUNT(CASE WHEN bl.es_procesado = true THEN 1 END) as processed,
           COUNT(CASE WHEN bl.es_procesado = false THEN 1 END) as unprocessed
         FROM biometric_logs bl
         WHERE bl.fecha BETWEEN $1 AND $2 AND bl.deleted_at IS NULL
         GROUP BY bl.device_id`,
        `SELECT 
           bd.sucursal_id, 
           COUNT(*) as total,
           COUNT(CASE WHEN bl.es_procesado = true THEN 1 END) as processed,
           COUNT(CASE WHEN bl.es_procesado = false THEN 1 END) as unprocessed
         FROM biometric_logs bl
         INNER JOIN biometric_devices bd ON bl.device_id = bd.id
         WHERE bl.fecha BETWEEN $1 AND $2 AND bl.deleted_at IS NULL
         GROUP BY bd.sucursal_id`,
        `SELECT COUNT(*) as duplicates 
         FROM (
           SELECT employee_id, device_id, fecha, hora, COUNT(*) 
           FROM biometric_logs 
           WHERE fecha BETWEEN $1 AND $2 AND deleted_at IS NULL
           GROUP BY employee_id, device_id, fecha, hora 
           HAVING COUNT(*) > 1
         ) as dup`,
        `SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_minutes
         FROM biometric_logs 
         WHERE fecha BETWEEN $1 AND $2 AND es_procesado = true AND deleted_at IS NULL`
      ];

      const [totalResult, processedResult, unprocessedResult, deviceResult, sucursalResult, duplicatesResult, avgTimeResult] = await Promise.all([
        this.pool.query(queries[0], [startDate, endDate]),
        this.pool.query(queries[1], [startDate, endDate]),
        this.pool.query(queries[2], [startDate, endDate]),
        this.pool.query(queries[3], [startDate, endDate]),
        this.pool.query(queries[4], [startDate, endDate]),
        this.pool.query(queries[5], [startDate, endDate]),
        this.pool.query(queries[6], [startDate, endDate])
      ]);

      const byDevice: Record<string, { total: number; processed: number; unprocessed: number; }> = {};
      deviceResult.rows.forEach(row => {
        byDevice[row.device_id] = {
          total: parseInt(row.total),
          processed: parseInt(row.processed),
          unprocessed: parseInt(row.unprocessed)
        };
      });

      const bySucursal: Record<string, { total: number; processed: number; unprocessed: number; }> = {};
      sucursalResult.rows.forEach(row => {
        bySucursal[row.sucursal_id] = {
          total: parseInt(row.total),
          processed: parseInt(row.processed),
          unprocessed: parseInt(row.unprocessed)
        };
      });

      return {
        totalLogs: parseInt(totalResult.rows[0].total),
        processedLogs: parseInt(processedResult.rows[0].processed),
        unprocessedLogs: parseInt(unprocessedResult.rows[0].unprocessed),
        byDevice,
        bySucursal,
        duplicatesFound: parseInt(duplicatesResult.rows[0].duplicates),
        averageProcessingTime: parseFloat(avgTimeResult.rows[0].avg_minutes) || 0
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de logs', 'BiometricLogPostgresRepository', { startDate, endDate }, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs sin empleado asociado
   */
  async findOrphanLogs(): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          bl.id, bl.device_id, bl.employee_id, bl.fecha, bl.hora, bl.tipo_movimiento,
          bl.tipo_verificacion, bl.es_procesado, bl.es_efectivo_para_calculo,
          bl.observaciones, bl.confianza, bl.datos_originales, bl.ubicacion_dispositivo,
          bl.intentos_fallidos, bl.tiempo_respuesta, bl.is_active,
          bl.created_at, bl.updated_at, bl.deleted_at, bl.version
        FROM biometric_logs bl
        LEFT JOIN employees e ON bl.employee_id = e.id
        WHERE e.id IS NULL AND bl.deleted_at IS NULL
        ORDER BY bl.fecha DESC, bl.hora DESC
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs huérfanos', 'BiometricLogPostgresRepository', {}, error as Error);
      throw new Error(`Error al buscar logs huérfanos: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar logs con errores de sincronización
   */
  async findSyncErrors(): Promise<BiometricLog[]> {
    try {
      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, datos_originales, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, is_active,
          created_at, updated_at, deleted_at, version
        FROM biometric_logs 
        WHERE (observaciones ILIKE '%error%' OR observaciones ILIKE '%fallo%' OR intentos_fallidos > 0)
          AND deleted_at IS NULL
        ORDER BY fecha DESC, hora DESC
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => this.mapRowToBiometricLog(row));
    } catch (error) {
      logger.error('Error buscando logs con errores', 'BiometricLogPostgresRepository', {}, error as Error);
      throw new Error(`Error al buscar logs con errores: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener reporte de actividad por dispositivo
   */
  async getDeviceActivityReport(deviceId: string, startDate: Date, endDate: Date): Promise<{
    deviceInfo: { id: string; name: string; location: string; sucursalId: string; };
    dailyActivity: Array<{ date: string; totalScans: number; uniqueEmployees: number; firstScan: Date; lastScan: Date; averageScansPerEmployee: number; }>;
    summary: { totalScans: number; uniqueEmployees: number; averageDaily: number; peakDay: { date: string; scans: number; }; };
  }> {
    try {
      const deviceQuery = `
        SELECT id, nombre, ubicacion_fisica, sucursal_id
        FROM biometric_devices 
        WHERE id = $1
      `;
      
      const activityQuery = `
        SELECT 
          fecha::date as date,
          COUNT(*) as total_scans,
          COUNT(DISTINCT employee_id) as unique_employees,
          MIN(hora::time) as first_scan,
          MAX(hora::time) as last_scan
        FROM biometric_logs 
        WHERE device_id = $1 AND fecha BETWEEN $2 AND $3 AND deleted_at IS NULL
        GROUP BY fecha::date
        ORDER BY fecha::date
      `;

      const summaryQuery = `
        SELECT 
          COUNT(*) as total_scans,
          COUNT(DISTINCT employee_id) as unique_employees
        FROM biometric_logs 
        WHERE device_id = $1 AND fecha BETWEEN $2 AND $3 AND deleted_at IS NULL
      `;

      const [deviceResult, activityResult, summaryResult] = await Promise.all([
        this.pool.query(deviceQuery, [deviceId]),
        this.pool.query(activityQuery, [deviceId, startDate, endDate]),
        this.pool.query(summaryQuery, [deviceId, startDate, endDate])
      ]);

      if (deviceResult.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      const deviceInfo = {
        id: deviceResult.rows[0].id,
        name: deviceResult.rows[0].nombre,
        location: deviceResult.rows[0].ubicacion_fisica || 'No especificada',
        sucursalId: deviceResult.rows[0].sucursal_id
      };

      const dailyActivity = activityResult.rows.map(row => ({
        date: row.date,
        totalScans: parseInt(row.total_scans),
        uniqueEmployees: parseInt(row.unique_employees),
        firstScan: row.first_scan,
        lastScan: row.last_scan,
        averageScansPerEmployee: parseFloat((parseInt(row.total_scans) / parseInt(row.unique_employees)).toFixed(2))
      }));

      const totalScans = parseInt(summaryResult.rows[0].total_scans);
      const uniqueEmployees = parseInt(summaryResult.rows[0].unique_employees);
      const averageDaily = dailyActivity.length > 0 ? totalScans / dailyActivity.length : 0;
      
      const peakDay = dailyActivity.reduce((max, current) => 
        current.totalScans > max.scans ? { date: current.date, scans: current.totalScans } : max,
        { date: '', scans: 0 }
      );

      return {
        deviceInfo,
        dailyActivity,
        summary: {
          totalScans,
          uniqueEmployees,
          averageDaily: parseFloat(averageDaily.toFixed(2)),
          peakDay
        }
      };
    } catch (error) {
      logger.error('Error generando reporte de actividad', 'BiometricLogPostgresRepository', { deviceId, startDate, endDate }, error as Error);
      throw new Error(`Error al generar reporte: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener trazabilidad completa de un empleado
   */
  async getEmployeeTrace(employeeId: string, startDate: Date, endDate: Date): Promise<Array<{
    timestamp: Date;
    deviceId: string;
    deviceName: string;
    sucursalId: string;
    sucursalName: string;
    processed: boolean;
    attendanceRecordId?: string;
    verificationType: string;
    quality: number;
  }>> {
    try {
      const query = `
        SELECT 
          bl.created_at as timestamp,
          bl.device_id,
          bd.nombre as device_name,
          bd.sucursal_id,
          s.nombre as sucursal_name,
          bl.es_procesado as processed,
          bl.attendance_record_id,
          bl.tipo_verificacion as verification_type,
          bl.confianza as quality
        FROM biometric_logs bl
        INNER JOIN biometric_devices bd ON bl.device_id = bd.id
        INNER JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bl.employee_id = $1 AND bl.fecha BETWEEN $2 AND $3 AND bl.deleted_at IS NULL
        ORDER BY bl.fecha ASC, bl.hora ASC
      `;
      
      const result = await this.pool.query(query, [employeeId, startDate, endDate]);
      
      return result.rows.map(row => ({
        timestamp: row.timestamp,
        deviceId: row.device_id,
        deviceName: row.device_name,
        sucursalId: row.sucursal_id,
        sucursalName: row.sucursal_name,
        processed: row.processed,
        attendanceRecordId: row.attendance_record_id,
        verificationType: row.verification_type,
        quality: row.quality
      }));
    } catch (error) {
      logger.error('Error obteniendo trazabilidad de empleado', 'BiometricLogPostgresRepository', { employeeId, startDate, endDate }, error as Error);
      throw new Error(`Error al obtener trazabilidad: ${(error as Error).message}`);
    }
  }

  /**
   * Limpiar logs antiguos
   */
  async cleanOldLogs(retentionDays: number): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const query = `
        DELETE FROM biometric_logs 
        WHERE created_at < $1
      `;

      const result = await client.query(query, [cutoffDate]);
      await client.query('COMMIT');

      const deletedCount = result.rowCount || 0;
      logger.info('Logs antiguos limpiados', 'BiometricLogPostgresRepository', { deletedCount, retentionDays });
      return deletedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error limpiando logs antiguos', 'BiometricLogPostgresRepository', { retentionDays }, error as Error);
      throw new Error(`Error al limpiar logs: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Verificar integridad de logs
   */
  async verifyIntegrity(deviceId: string, date: Date): Promise<{
    hasGaps: boolean;
    missingSequences: Array<{ expectedSequence: number; actualSequence: number; gap: number; }>;
    totalGaps: number;
  }> {
    try {
      const query = `
        WITH log_sequences AS (
          SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY hora) as expected_sequence,
            EXTRACT(EPOCH FROM hora::time) / 60 as actual_sequence
          FROM biometric_logs 
          WHERE device_id = $1 AND fecha = $2 AND deleted_at IS NULL
          ORDER BY hora
        ),
        gaps AS (
          SELECT 
            expected_sequence,
            actual_sequence,
            actual_sequence - LAG(actual_sequence) OVER (ORDER BY expected_sequence) as gap
          FROM log_sequences
          WHERE actual_sequence - LAG(actual_sequence) OVER (ORDER BY expected_sequence) > 5
        )
        SELECT 
          expected_sequence,
          actual_sequence,
          gap
        FROM gaps
        ORDER BY expected_sequence
      `;
      
      const result = await this.pool.query(query, [deviceId, date]);
      
      const missingSequences = result.rows.map(row => ({
        expectedSequence: parseInt(row.expected_sequence),
        actualSequence: parseFloat(row.actual_sequence),
        gap: parseFloat(row.gap)
      }));

      return {
        hasGaps: missingSequences.length > 0,
        missingSequences,
        totalGaps: missingSequences.length
      };
    } catch (error) {
      logger.error('Error verificando integridad', 'BiometricLogPostgresRepository', { deviceId, date }, error as Error);
      throw new Error(`Error al verificar integridad: ${(error as Error).message}`);
    }
  }

  /**
   * Exportar logs
   */
  async exportLogs(filters: {
    startDate: Date;
    endDate: Date;
    deviceIds?: string[];
    format: 'json' | 'csv';
  }): Promise<string> {
    try {
      const conditions: string[] = ['deleted_at IS NULL'];
      const values: any[] = [filters.startDate, filters.endDate];
      let paramIndex = 3;

      conditions.push('fecha BETWEEN $1 AND $2');

      if (filters.deviceIds && filters.deviceIds.length > 0) {
        const placeholders = filters.deviceIds.map(() => `${paramIndex++}`).join(',');
        conditions.push(`device_id IN (${placeholders})`);
        values.push(...filters.deviceIds);
      }

      const query = `
        SELECT 
          id, device_id, employee_id, fecha, hora, tipo_movimiento,
          tipo_verificacion, es_procesado, es_efectivo_para_calculo,
          observaciones, confianza, ubicacion_dispositivo,
          intentos_fallidos, tiempo_respuesta, created_at
        FROM biometric_logs 
        WHERE ${conditions.join(' AND ')}
        ORDER BY fecha ASC, hora ASC
      `;
      
      const result = await this.pool.query(query, values);
      
      if (filters.format === 'json') {
        return JSON.stringify(result.rows, null, 2);
      } else {
        // Formato CSV
        if (result.rows.length === 0) return '';
        
        const headers = Object.keys(result.rows[0]).join(',');
        const rows = result.rows.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          ).join(',')
        );
        
        return [headers, ...rows].join('\n');
      }
    } catch (error) {
      logger.error('Error exportando logs', 'BiometricLogPostgresRepository', filters, error as Error);
      throw new Error(`Error al exportar logs: ${(error as Error).message}`);
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto BiometricLog
   */
  private mapRowToBiometricLog(row: any): BiometricLog {
    const logData = {
      id: row.id,
      deviceId: row.device_id,
      employeeId: row.employee_id,
      fecha: row.fecha,
      hora: row.hora,
      tipoMovimiento: row.tipo_movimiento,
      tipoVerificacion: row.tipo_verificacion,
      esProcesado: row.es_procesado,
      esEfectivoParaCalculo: row.es_efectivo_para_calculo,
      observaciones: row.observaciones,
      confianza: row.confianza,
      datosOriginales: row.datos_originales ? (typeof row.datos_originales === 'string' ? JSON.parse(row.datos_originales) : row.datos_originales) : undefined,
      ubicacionDispositivo: row.ubicacion_dispositivo,
      intentosFallidos: row.intentos_fallidos,
      tiempoRespuesta: row.tiempo_respuesta,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };

    return new BiometricLog(logData);
  }
}

export default BiometricLogPostgresRepository;