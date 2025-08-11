/**
* ATTENDANCE POSTGRESQL REPOSITORY
* Implementación de repositorio de registros de asistencia para PostgreSQL
* Maneja todas las operaciones de persistencia para la entidad AttendanceRecord
*/

import { Pool, PoolClient } from 'pg';
import { AttendanceRecord } from '@core/entities/attendance-record.entity';
import { AttendanceStatus } from '@core/enums/attendance-status.enum';
import { IAttendanceRepository } from '@core/interfaces/repositories/attendance.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { getLogger } from '@shared/utils/logger.util';
import { formatDate, startOfDay, endOfDay } from '@shared/utils/date.util';

const logger = getLogger();

export class AttendancePostgresRepository implements IAttendanceRepository {
 constructor(private pool: Pool) {}

 /**
  * Buscar registro de asistencia por ID
  */
 async findById(id: string): Promise<AttendanceRecord | null> {
   try {
     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE id = $1 AND deleted_at IS NULL
     `;
     
     const result = await this.pool.query(query, [id]);
     
     if (result.rows.length === 0) {
       return null;
     }

     return this.mapRowToAttendanceRecord(result.rows[0]);
   } catch (error) {
     logger.error('Error buscando registro de asistencia por ID', 'AttendancePostgresRepository', { id }, error as Error);
     throw new Error(`Error al buscar registro: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros de asistencia por empleado y fecha
  */
 async findByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceRecord[]> {
   try {
     const startDate = startOfDay(date);
     const endDate = endOfDay(date);

     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE employee_id = $1 
         AND fecha BETWEEN $2 AND $3
         AND deleted_at IS NULL
       ORDER BY fecha ASC
     `;
     
     const result = await this.pool.query(query, [employeeId, startDate, endDate]);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros por empleado y fecha', 'AttendancePostgresRepository', { employeeId, date }, error as Error);
     throw new Error(`Error al buscar registros: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros de asistencia por empleado en un rango de fechas
  */
 async findByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
   try {
     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE employee_id = $1 
         AND fecha BETWEEN $2 AND $3
         AND deleted_at IS NULL
       ORDER BY fecha ASC
     `;
     
     const result = await this.pool.query(query, [employeeId, startOfDay(startDate), endOfDay(endDate)]);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros por empleado y rango', 'AttendancePostgresRepository', { employeeId, startDate, endDate }, error as Error);
     throw new Error(`Error al buscar registros: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros de asistencia por sucursal y fecha
  */
 async findBySucursalAndDate(sucursalId: string, date: Date): Promise<AttendanceRecord[]> {
   try {
     const startDate = startOfDay(date);
     const endDate = endOfDay(date);

     const query = `
       SELECT 
         ar.id, ar.employee_id, ar.fecha, ar.entrada, ar.salida, ar.entrada2, ar.salida2,
         ar.tiempo_almuerzo, ar.horas_regulares, ar.horas_extras, ar.horas_recargo,
         ar.horas_suplementarias, ar.horas_extraordinarias, ar.horas_nocturnas,
         ar.estado, ar.es_manual, ar.observaciones, ar.modificado_por, ar.fecha_modificacion,
         ar.is_active, ar.created_at, ar.updated_at, ar.deleted_at, ar.version
       FROM attendance_records ar
       INNER JOIN employees e ON ar.employee_id = e.id
       WHERE (e.primary_sucursal_id = $1 OR $1 = ANY(e.additional_sucursales))
         AND ar.fecha BETWEEN $2 AND $3
         AND ar.deleted_at IS NULL
         AND e.deleted_at IS NULL
       ORDER BY ar.fecha ASC, e.last_name, e.first_name
     `;
     
     const result = await this.pool.query(query, [sucursalId, startDate, endDate]);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros por sucursal y fecha', 'AttendancePostgresRepository', { sucursalId, date }, error as Error);
     throw new Error(`Error al buscar registros: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros de asistencia por sucursal en un rango de fechas
  */
 async findBySucursalAndDateRange(sucursalId: string, startDate: Date, endDate: Date, pagination: IPagination): Promise<IResponse<AttendanceRecord[]>> {
   try {
     const offset = (pagination.page - 1) * pagination.limit;
     
     const countQuery = `
       SELECT COUNT(*) as total 
       FROM attendance_records ar
       INNER JOIN employees e ON ar.employee_id = e.id
       WHERE (e.primary_sucursal_id = $1 OR $1 = ANY(e.additional_sucursales))
         AND ar.fecha BETWEEN $2 AND $3
         AND ar.deleted_at IS NULL
         AND e.deleted_at IS NULL
     `;
     
     const query = `
       SELECT 
         ar.id, ar.employee_id, ar.fecha, ar.entrada, ar.salida, ar.entrada2, ar.salida2,
         ar.tiempo_almuerzo, ar.horas_regulares, ar.horas_extras, ar.horas_recargo,
         ar.horas_suplementarias, ar.horas_extraordinarias, ar.horas_nocturnas,
         ar.estado, ar.es_manual, ar.observaciones, ar.modificado_por, ar.fecha_modificacion,
         ar.is_active, ar.created_at, ar.updated_at, ar.deleted_at, ar.version
       FROM attendance_records ar
       INNER JOIN employees e ON ar.employee_id = e.id
       WHERE (e.primary_sucursal_id = $1 OR $1 = ANY(e.additional_sucursales))
         AND ar.fecha BETWEEN $2 AND $3
         AND ar.deleted_at IS NULL
         AND e.deleted_at IS NULL
       ORDER BY ar.fecha DESC, e.last_name, e.first_name
       LIMIT $4 OFFSET $5
     `;

     const [countResult, dataResult] = await Promise.all([
       this.pool.query(countQuery, [sucursalId, startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(query, [sucursalId, startOfDay(startDate), endOfDay(endDate), pagination.limit, offset])
     ]);

     const total = parseInt(countResult.rows[0].total);
     const records = dataResult.rows.map(row => this.mapRowToAttendanceRecord(row));

     return {
       success: true,
       message: 'Registros de asistencia obtenidos exitosamente',
       data: records,
       timestamp: new Date().toISOString()
     };
   } catch (error) {
     logger.error('Error buscando registros por sucursal y rango', 'AttendancePostgresRepository', { sucursalId, startDate, endDate }, error as Error);
     throw new Error(`Error al buscar registros: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros de asistencia por área y fecha
  */
 async findByAreaAndDate(areaId: string, date: Date): Promise<AttendanceRecord[]> {
   try {
     const startDate = startOfDay(date);
     const endDate = endOfDay(date);

     const query = `
       SELECT 
         ar.id, ar.employee_id, ar.fecha, ar.entrada, ar.salida, ar.entrada2, ar.salida2,
         ar.tiempo_almuerzo, ar.horas_regulares, ar.horas_extras, ar.horas_recargo,
         ar.horas_suplementarias, ar.horas_extraordinarias, ar.horas_nocturnas,
         ar.estado, ar.es_manual, ar.observaciones, ar.modificado_por, ar.fecha_modificacion,
         ar.is_active, ar.created_at, ar.updated_at, ar.deleted_at, ar.version
       FROM attendance_records ar
       INNER JOIN employees e ON ar.employee_id = e.id
       WHERE e.area_id = $1
         AND ar.fecha BETWEEN $2 AND $3
         AND ar.deleted_at IS NULL
         AND e.deleted_at IS NULL
       ORDER BY ar.fecha ASC, e.last_name, e.first_name
     `;
     
     const result = await this.pool.query(query, [areaId, startDate, endDate]);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros por área y fecha', 'AttendancePostgresRepository', { areaId, date }, error as Error);
     throw new Error(`Error al buscar registros: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros de asistencia por estado
  */
 async findByStatus(status: AttendanceStatus, pagination: IPagination): Promise<IResponse<AttendanceRecord[]>> {
   try {
     const offset = (pagination.page - 1) * pagination.limit;
     
     const countQuery = `
       SELECT COUNT(*) as total 
       FROM attendance_records 
       WHERE estado = $1 AND deleted_at IS NULL
     `;
     
     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE estado = $1 AND deleted_at IS NULL
       ORDER BY fecha DESC
       LIMIT $2 OFFSET $3
     `;

     const [countResult, dataResult] = await Promise.all([
       this.pool.query(countQuery, [status]),
       this.pool.query(query, [status, pagination.limit, offset])
     ]);

     const total = parseInt(countResult.rows[0].total);
     const records = dataResult.rows.map(row => this.mapRowToAttendanceRecord(row));

     return {
       success: true,
       message: `Registros con estado ${status} obtenidos exitosamente`,
       data: records,
       timestamp: new Date().toISOString()
     };
   } catch (error) {
     logger.error('Error buscando registros por estado', 'AttendancePostgresRepository', { status }, error as Error);
     throw new Error(`Error al buscar registros: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros pendientes de aprobación
  */
 async findPendingApproval(pagination: IPagination): Promise<IResponse<AttendanceRecord[]>> {
   try {
     const offset = (pagination.page - 1) * pagination.limit;
     
     const pendingStatuses = [AttendanceStatus.PENDIENTE, AttendanceStatus.REVISION];
     
     const countQuery = `
       SELECT COUNT(*) as total 
       FROM attendance_records 
       WHERE estado = ANY($1) AND deleted_at IS NULL
     `;
     
     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE estado = ANY($1) AND deleted_at IS NULL
       ORDER BY fecha DESC
       LIMIT $2 OFFSET $3
     `;

     const [countResult, dataResult] = await Promise.all([
       this.pool.query(countQuery, [pendingStatuses]),
       this.pool.query(query, [pendingStatuses, pagination.limit, offset])
     ]);

     const total = parseInt(countResult.rows[0].total);
     const records = dataResult.rows.map(row => this.mapRowToAttendanceRecord(row));

     return {
       success: true,
       message: 'Registros pendientes de aprobación obtenidos exitosamente',
       data: records,
       timestamp: new Date().toISOString()
     };
   } catch (error) {
     logger.error('Error buscando registros pendientes', 'AttendancePostgresRepository', {}, error as Error);
     throw new Error(`Error al buscar registros pendientes: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros con horas extras
  */
 async findWithOvertime(startDate: Date, endDate: Date, pagination: IPagination): Promise<IResponse<AttendanceRecord[]>> {
   try {
     const offset = (pagination.page - 1) * pagination.limit;
     
     const countQuery = `
       SELECT COUNT(*) as total 
       FROM attendance_records 
       WHERE horas_extras > 0 
         AND fecha BETWEEN $1 AND $2
         AND deleted_at IS NULL
     `;
     
     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE horas_extras > 0 
         AND fecha BETWEEN $1 AND $2
         AND deleted_at IS NULL
       ORDER BY horas_extras DESC, fecha DESC
       LIMIT $3 OFFSET $4
     `;

     const [countResult, dataResult] = await Promise.all([
       this.pool.query(countQuery, [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(query, [startOfDay(startDate), endOfDay(endDate), pagination.limit, offset])
     ]);

     const total = parseInt(countResult.rows[0].total);
     const records = dataResult.rows.map(row => this.mapRowToAttendanceRecord(row));

     return {
       success: true,
       message: 'Registros con horas extras obtenidos exitosamente',
       data: records,
       timestamp: new Date().toISOString()
     };
   } catch (error) {
     logger.error('Error buscando registros con horas extras', 'AttendancePostgresRepository', { startDate, endDate }, error as Error);
     throw new Error(`Error al buscar registros con horas extras: ${(error as Error).message}`);
   }
 }

 /**
  * Crear nuevo registro de asistencia
  */
 async create(attendance: AttendanceRecord): Promise<AttendanceRecord> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     const query = `
       INSERT INTO attendance_records (
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, version
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
       )
       RETURNING *
     `;

     const values = [
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
       attendance.isActive,
       attendance.createdAt,
       attendance.updatedAt,
       attendance.version
     ];

     const result = await client.query(query, values);
     await client.query('COMMIT');

     logger.info('Registro de asistencia creado exitosamente', 'AttendancePostgresRepository', { 
       id: attendance.id, 
       employeeId: attendance.employeeId,
       fecha: attendance.fechaFormateada
     });
     
     return this.mapRowToAttendanceRecord(result.rows[0]);
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error creando registro de asistencia', 'AttendancePostgresRepository', { 
       employeeId: attendance.employeeId,
       fecha: attendance.fechaFormateada
     }, error as Error);
     
     if ((error as any)?.code === '23505') {
       throw new Error('Ya existe un registro para este empleado en esta fecha');
     }
     
     throw new Error(`Error al crear registro: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Actualizar registro de asistencia existente
  */
 async update(id: string, attendanceData: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     // Primero verificar que el registro existe
     const existingRecord = await this.findById(id);
     if (!existingRecord) {
       throw new Error('Registro de asistencia no encontrado');
     }

     // Construir query dinámicamente
     const updateFields: string[] = [];
     const values: any[] = [];
     let paramIndex = 1;

     if (attendanceData.entrada !== undefined) {
       updateFields.push(`entrada = $${paramIndex++}`);
       values.push(attendanceData.entrada);
     }

     if (attendanceData.salida !== undefined) {
       updateFields.push(`salida = $${paramIndex++}`);
       values.push(attendanceData.salida);
     }

     if (attendanceData.entrada2 !== undefined) {
       updateFields.push(`entrada2 = $${paramIndex++}`);
       values.push(attendanceData.entrada2);
     }

     if (attendanceData.salida2 !== undefined) {
       updateFields.push(`salida2 = $${paramIndex++}`);
       values.push(attendanceData.salida2);
     }

     if (attendanceData.tiempoAlmuerzo !== undefined) {
       updateFields.push(`tiempo_almuerzo = $${paramIndex++}`);
       values.push(attendanceData.tiempoAlmuerzo);
     }

     if (attendanceData.horasRegulares !== undefined) {
       updateFields.push(`horas_regulares = $${paramIndex++}`);
       values.push(attendanceData.horasRegulares);
     }

     if (attendanceData.horasExtras !== undefined) {
       updateFields.push(`horas_extras = $${paramIndex++}`);
       values.push(attendanceData.horasExtras);
     }

     if (attendanceData.horasRecargo !== undefined) {
       updateFields.push(`horas_recargo = $${paramIndex++}`);
       values.push(attendanceData.horasRecargo);
     }

     if (attendanceData.horasSupplementarias !== undefined) {
       updateFields.push(`horas_suplementarias = $${paramIndex++}`);
       values.push(attendanceData.horasSupplementarias);
     }

     if (attendanceData.horasExtraordinarias !== undefined) {
       updateFields.push(`horas_extraordinarias = $${paramIndex++}`);
       values.push(attendanceData.horasExtraordinarias);
     }

     if (attendanceData.horasNocturnas !== undefined) {
       updateFields.push(`horas_nocturnas = $${paramIndex++}`);
       values.push(attendanceData.horasNocturnas);
     }

     if (attendanceData.estado !== undefined) {
       updateFields.push(`estado = $${paramIndex++}`);
       values.push(attendanceData.estado);
     }

     if (attendanceData.esManual !== undefined) {
       updateFields.push(`es_manual = $${paramIndex++}`);
       values.push(attendanceData.esManual);
     }

     if (attendanceData.observaciones !== undefined) {
       updateFields.push(`observaciones = $${paramIndex++}`);
       values.push(attendanceData.observaciones);
     }

     if (attendanceData.modificadoPor !== undefined) {
       updateFields.push(`modificado_por = $${paramIndex++}`);
       values.push(attendanceData.modificadoPor);
       
       updateFields.push(`fecha_modificacion = $${paramIndex++}`);
       values.push(new Date());
     }

     // Siempre actualizar updated_at y version
     updateFields.push(`updated_at = $${paramIndex++}`);
     values.push(new Date());

     updateFields.push(`version = $${paramIndex++}`);
     values.push(existingRecord.version + 1);

     // ID para WHERE
     values.push(id);

     const query = `
       UPDATE attendance_records 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *
     `;

     const result = await client.query(query, values);
     await client.query('COMMIT');

     if (result.rows.length === 0) {
       throw new Error('Registro de asistencia no encontrado para actualizar');
     }

     logger.info('Registro de asistencia actualizado exitosamente', 'AttendancePostgresRepository', { id });
     return this.mapRowToAttendanceRecord(result.rows[0]);
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error actualizando registro de asistencia', 'AttendancePostgresRepository', { id }, error as Error);
     throw new Error(`Error al actualizar registro: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Eliminar registro de asistencia (soft delete)
  */
 async delete(id: string): Promise<void> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     const query = `
       UPDATE attendance_records 
       SET deleted_at = $1, updated_at = $1
       WHERE id = $2 AND deleted_at IS NULL
     `;

     const result = await client.query(query, [new Date(), id]);
     await client.query('COMMIT');

     if (result.rowCount === 0) {
       throw new Error('Registro de asistencia no encontrado para eliminar');
     }

     logger.info('Registro de asistencia eliminado exitosamente', 'AttendancePostgresRepository', { id });
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error eliminando registro de asistencia', 'AttendancePostgresRepository', { id }, error as Error);
     throw new Error(`Error al eliminar registro: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Aprobar registro de asistencia
  */
 async approve(id: string, approvedBy: string): Promise<AttendanceRecord> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     const query = `
       UPDATE attendance_records 
       SET estado = $1, modificado_por = $2, fecha_modificacion = $3, updated_at = $3
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING *
     `;

     const now = new Date();
     const result = await client.query(query, [AttendanceStatus.COMPLETO, approvedBy, now, id]);
     await client.query('COMMIT');

     if (result.rows.length === 0) {
       throw new Error('Registro de asistencia no encontrado');
     }

     logger.info('Registro de asistencia aprobado', 'AttendancePostgresRepository', { id, approvedBy });
     return this.mapRowToAttendanceRecord(result.rows[0]);
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error aprobando registro', 'AttendancePostgresRepository', { id }, error as Error);
     throw new Error(`Error al aprobar registro: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Rechazar registro de asistencia
  */
 async reject(id: string, rejectedBy: string, reason: string): Promise<AttendanceRecord> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     const query = `
       UPDATE attendance_records 
       SET estado = $1, modificado_por = $2, fecha_modificacion = $3, 
           observaciones = $4, updated_at = $3
       WHERE id = $5 AND deleted_at IS NULL
       RETURNING *
     `;

     const now = new Date();
     const result = await client.query(query, [AttendanceStatus.INCONSISTENTE, rejectedBy, now, reason, id]);
     await client.query('COMMIT');

     if (result.rows.length === 0) {
       throw new Error('Registro de asistencia no encontrado');
     }

     logger.info('Registro de asistencia rechazado', 'AttendancePostgresRepository', { id, rejectedBy });
     return this.mapRowToAttendanceRecord(result.rows[0]);
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error rechazando registro', 'AttendancePostgresRepository', { id }, error as Error);
     throw new Error(`Error al rechazar registro: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Calcular horas trabajadas por empleado en un mes
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
     const startDate = new Date(year, month - 1, 1);
     const endDate = new Date(year, month, 0, 23, 59, 59, 999);

     const query = `
       SELECT 
         COALESCE(SUM(horas_regulares), 0) as regular_hours,
         COALESCE(SUM(horas_extras), 0) as overtime_hours,
         COALESCE(SUM(horas_recargo), 0) as recargo_hours,
         COALESCE(SUM(horas_suplementarias), 0) as suplementary_hours,
         COALESCE(SUM(horas_extraordinarias), 0) as extraordinary_hours,
         COUNT(CASE WHEN estado != 'AUSENTE' THEN 1 END) as days_worked,
         COUNT(CASE WHEN estado = 'AUSENTE' THEN 1 END) as days_absent,
         COUNT(CASE WHEN entrada > TIMESTAMP fecha + INTERVAL '9 hours' THEN 1 END) as late_arrivals,
         COUNT(CASE WHEN salida < TIMESTAMP fecha + INTERVAL '17 hours' THEN 1 END) as early_departures
       FROM attendance_records 
       WHERE employee_id = $1 
         AND fecha BETWEEN $2 AND $3
         AND deleted_at IS NULL
     `;

     const result = await this.pool.query(query, [employeeId, startDate, endDate]);
     const row = result.rows[0];

     return {
       regularHours: parseFloat(row.regular_hours) || 0,
       overtimeHours: parseFloat(row.overtime_hours) || 0,
       overtimeBreakdown: {
         recargo25: parseFloat(row.recargo_hours) || 0,
         suplementario50: parseFloat(row.suplementary_hours) || 0,
         extraordinario100: parseFloat(row.extraordinary_hours) || 0
       },
       daysWorked: parseInt(row.days_worked) || 0,
       daysAbsent: parseInt(row.days_absent) || 0,
       lateArrivals: parseInt(row.late_arrivals) || 0,
       earlyDepartures: parseInt(row.early_departures) || 0
     };
   } catch (error) {
     logger.error('Error calculando horas mensuales', 'AttendancePostgresRepository', { employeeId, year, month }, error as Error);
     throw new Error(`Error al calcular horas mensuales: ${(error as Error).message}`);
   }
 }

 /**
  * Generar reporte de asistencia por sucursal
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
     const query = `
       SELECT 
         e.id as employee_id,
         CONCAT(e.first_name, ' ', e.last_name) as employee_name,
         COALESCE(SUM(ar.horas_regulares + ar.horas_extras), 0) as total_hours,
         COALESCE(SUM(ar.horas_regulares), 0) as regular_hours,
         COALESCE(SUM(ar.horas_extras), 0) as overtime_hours,
         COUNT(CASE WHEN ar.estado != 'AUSENTE' AND ar.estado IS NOT NULL THEN 1 END) as days_worked,
         COUNT(CASE WHEN ar.estado = 'AUSENTE' THEN 1 END) as days_absent,
         COUNT(ar.id) as total_days
       FROM employees e
       LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
         AND ar.fecha BETWEEN $2 AND $3
         AND ar.deleted_at IS NULL
       WHERE (e.primary_sucursal_id = $1 OR $1 = ANY(e.additional_sucursales))
         AND e.deleted_at IS NULL
         AND e.is_active = true
       GROUP BY e.id, e.first_name, e.last_name
       ORDER BY e.last_name, e.first_name
     `;

     const result = await this.pool.query(query, [sucursalId, startOfDay(startDate), endOfDay(endDate)]);

     const employeeReports = result.rows.map(row => {
       const totalDays = parseInt(row.total_days) || 1;
       const daysWorked = parseInt(row.days_worked) || 0;
       const attendancePercentage = totalDays > 0 ? (daysWorked / totalDays) * 100 : 0;

       return {
         employeeId: row.employee_id,
         employeeName: row.employee_name,
         totalHours: parseFloat(row.total_hours) || 0,
         regularHours: parseFloat(row.regular_hours) || 0,
         overtimeHours: parseFloat(row.overtime_hours) || 0,
         daysWorked,
         daysAbsent: parseInt(row.days_absent) || 0,
         attendancePercentage: Math.round(attendancePercentage * 100) / 100
       };
     });

     const summary = {
       totalEmployees: employeeReports.length,
       averageAttendance: employeeReports.length > 0 
         ? employeeReports.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / employeeReports.length 
         : 0,
       totalRegularHours: employeeReports.reduce((sum, emp) => sum + emp.regularHours, 0),
       totalOvertimeHours: employeeReports.reduce((sum, emp) => sum + emp.overtimeHours, 0)
     };

     return { employeeReports, summary };
   } catch (error) {
     logger.error('Error generando reporte de sucursal', 'AttendancePostgresRepository', { sucursalId, startDate, endDate }, error as Error);
     throw new Error(`Error al generar reporte: ${(error as Error).message}`);
   }
 }

 /**
  * Generar reporte de asistencia por área
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
     const query = `
       SELECT 
         e.id as employee_id,
         CONCAT(e.first_name, ' ', e.last_name) as employee_name,
         COALESCE(SUM(ar.horas_regulares + ar.horas_extras), 0) as total_hours,
         COALESCE(SUM(ar.horas_regulares), 0) as regular_hours,
         COALESCE(SUM(ar.horas_extras), 0) as overtime_hours,
         COUNT(CASE WHEN ar.estado != 'AUSENTE' AND ar.estado IS NOT NULL THEN 1 END) as days_worked,
         COUNT(CASE WHEN ar.estado = 'AUSENTE' THEN 1 END) as days_absent,
         COUNT(ar.id) as total_days
       FROM employees e
       LEFT JOIN attendance_records ar ON e.id = ar.employee_id 
         AND ar.fecha BETWEEN $2 AND $3
         AND ar.deleted_at IS NULL
       WHERE e.area_id = $1
         AND e.deleted_at IS NULL
         AND e.is_active = true
       GROUP BY e.id, e.first_name, e.last_name
       ORDER BY e.last_name, e.first_name
     `;

     const result = await this.pool.query(query, [areaId, startOfDay(startDate), endOfDay(endDate)]);

     const employeeReports = result.rows.map(row => {
       const totalDays = parseInt(row.total_days) || 1;
       const daysWorked = parseInt(row.days_worked) || 0;
       const attendancePercentage = totalDays > 0 ? (daysWorked / totalDays) * 100 : 0;

       return {
         employeeId: row.employee_id,
         employeeName: row.employee_name,
         totalHours: parseFloat(row.total_hours) || 0,
         regularHours: parseFloat(row.regular_hours) || 0,
         overtimeHours: parseFloat(row.overtime_hours) || 0,
         daysWorked,
         daysAbsent: parseInt(row.days_absent) || 0,
         attendancePercentage: Math.round(attendancePercentage * 100) / 100
       };
     });

     const summary = {
       totalEmployees: employeeReports.length,
       averageAttendance: employeeReports.length > 0 
         ? employeeReports.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / employeeReports.length 
         : 0,
       totalRegularHours: employeeReports.reduce((sum, emp) => sum + emp.regularHours, 0),
       totalOvertimeHours: employeeReports.reduce((sum, emp) => sum + emp.overtimeHours, 0)
     };

     return { employeeReports, summary };
   } catch (error) {
     logger.error('Error generando reporte de área', 'AttendancePostgresRepository', { areaId, startDate, endDate }, error as Error);
     throw new Error(`Error al generar reporte: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros duplicados
  */
 async findDuplicates(timeThreshold: number): Promise<AttendanceRecord[]> {
   try {
     const query = `
       SELECT DISTINCT ar1.id, ar1.employee_id, ar1.fecha, ar1.entrada, ar1.salida, ar1.entrada2, ar1.salida2,
              ar1.tiempo_almuerzo, ar1.horas_regulares, ar1.horas_extras, ar1.horas_recargo,
              ar1.horas_suplementarias, ar1.horas_extraordinarias, ar1.horas_nocturnas,
              ar1.estado, ar1.es_manual, ar1.observaciones, ar1.modificado_por, ar1.fecha_modificacion,
              ar1.is_active, ar1.created_at, ar1.updated_at, ar1.deleted_at, ar1.version
       FROM attendance_records ar1
       INNER JOIN attendance_records ar2 ON ar1.employee_id = ar2.employee_id
         AND ar1.id != ar2.id
         AND ar1.fecha = ar2.fecha
         AND ar1.deleted_at IS NULL
         AND ar2.deleted_at IS NULL
         AND (
           ABS(EXTRACT(EPOCH FROM ar1.entrada) - EXTRACT(EPOCH FROM ar2.entrada)) < $1
           OR ABS(EXTRACT(EPOCH FROM ar1.salida) - EXTRACT(EPOCH FROM ar2.salida)) < $1
         )
       ORDER BY ar1.employee_id, ar1.fecha
     `;

     const result = await this.pool.query(query, [timeThreshold]);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros duplicados', 'AttendancePostgresRepository', { timeThreshold }, error as Error);
     throw new Error(`Error al buscar duplicados: ${(error as Error).message}`);
   }
 }

 /**
  * Obtener último registro de asistencia de un empleado
  */
 async findLastByEmployee(employeeId: string): Promise<AttendanceRecord | null> {
   try {
     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE employee_id = $1 AND deleted_at IS NULL
       ORDER BY fecha DESC, created_at DESC
       LIMIT 1
     `;
     
     const result = await this.pool.query(query, [employeeId]);
     
     if (result.rows.length === 0) {
       return null;
     }

     return this.mapRowToAttendanceRecord(result.rows[0]);
   } catch (error) {
     logger.error('Error buscando último registro', 'AttendancePostgresRepository', { employeeId }, error as Error);
     throw new Error(`Error al buscar último registro: ${(error as Error).message}`);
   }
 }

 /**
  * Verificar si existe registro de entrada para empleado en fecha específica
  */
 async hasEntryRecord(employeeId: string, date: Date): Promise<boolean> {
   try {
     const startDate = startOfDay(date);
     const endDate = endOfDay(date);

     const query = `
       SELECT 1 FROM attendance_records 
       WHERE employee_id = $1 
         AND fecha BETWEEN $2 AND $3
         AND entrada IS NOT NULL
         AND deleted_at IS NULL
       LIMIT 1
     `;
     
     const result = await this.pool.query(query, [employeeId, startDate, endDate]);
     return result.rows.length > 0;
   } catch (error) {
     logger.error('Error verificando registro de entrada', 'AttendancePostgresRepository', { employeeId, date }, error as Error);
     throw new Error(`Error al verificar entrada: ${(error as Error).message}`);
   }
 }

 /**
  * Verificar si existe registro de salida para empleado en fecha específica
  */
 async hasExitRecord(employeeId: string, date: Date): Promise<boolean> {
   try {
     const startDate = startOfDay(date);
     const endDate = endOfDay(date);

     const query = `
       SELECT 1 FROM attendance_records 
       WHERE employee_id = $1 
         AND fecha BETWEEN $2 AND $3
         AND salida IS NOT NULL
         AND deleted_at IS NULL
       LIMIT 1
     `;
     
     const result = await this.pool.query(query, [employeeId, startDate, endDate]);
     return result.rows.length > 0;
   } catch (error) {
     logger.error('Error verificando registro de salida', 'AttendancePostgresRepository', { employeeId, date }, error as Error);
     throw new Error(`Error al verificar salida: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros inconsistentes
  */
 async findInconsistentRecords(date?: Date): Promise<AttendanceRecord[]> {
   try {
     let dateCondition = '';
     const values: any[] = [];
     let paramIndex = 1;

     if (date) {
       const startDate = startOfDay(date);
       const endDate = endOfDay(date);
       dateCondition = `AND fecha BETWEEN $${paramIndex++} AND $${paramIndex++}`;
       values.push(startDate, endDate);
     }

     const query = `
       SELECT 
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, deleted_at, version
       FROM attendance_records 
       WHERE deleted_at IS NULL
         AND (
           (entrada IS NOT NULL AND salida IS NULL AND estado != 'PENDIENTE')
           OR (entrada IS NULL AND salida IS NOT NULL)
           OR (entrada IS NOT NULL AND salida IS NOT NULL AND entrada >= salida)
           OR estado = 'INCONSISTENTE'
         )
         ${dateCondition}
       ORDER BY fecha DESC, employee_id
     `;
     
     const result = await this.pool.query(query, values);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros inconsistentes', 'AttendancePostgresRepository', { date }, error as Error);
     throw new Error(`Error al buscar inconsistencias: ${(error as Error).message}`);
   }
 }

 /**
  * Obtener estadísticas de asistencia
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
     const baseQuery = `
       FROM attendance_records ar
       INNER JOIN employees e ON ar.employee_id = e.id
       WHERE ar.fecha BETWEEN $1 AND $2
         AND ar.deleted_at IS NULL
         AND e.deleted_at IS NULL
     `;

     const queries = [
       `SELECT COUNT(*) as total ${baseQuery}`,
       `SELECT COUNT(*) as approved ${baseQuery} AND ar.estado = 'APROBADO'`,
       `SELECT COUNT(*) as pending ${baseQuery} AND ar.estado IN ('PENDIENTE', 'REVISION')`,
       `SELECT COUNT(*) as rejected ${baseQuery} AND ar.estado = 'RECHAZADO'`,
       `SELECT COALESCE(SUM(ar.horas_regulares), 0) as total_regular ${baseQuery}`,
       `SELECT COALESCE(SUM(ar.horas_extras), 0) as total_overtime ${baseQuery}`,
       `SELECT 
         e.primary_sucursal_id as sucursal_id,
         COUNT(CASE WHEN ar.estado != 'AUSENTE' THEN 1 END) * 100.0 / COUNT(*) as attendance_rate
        ${baseQuery}
        GROUP BY e.primary_sucursal_id
        HAVING COUNT(*) > 0
        ORDER BY attendance_rate DESC
        LIMIT 5`
     ];

     const [totalResult, approvedResult, pendingResult, rejectedResult, regularResult, overtimeResult, sucursalResult] = await Promise.all([
       this.pool.query(queries[0], [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(queries[1], [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(queries[2], [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(queries[3], [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(queries[4], [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(queries[5], [startOfDay(startDate), endOfDay(endDate)]),
       this.pool.query(queries[6], [startOfDay(startDate), endOfDay(endDate)])
     ]);

     const totalRecords = parseInt(totalResult.rows[0].total);
     const approvedRecords = parseInt(approvedResult.rows[0].approved);
     const averageAttendanceRate = totalRecords > 0 ? (approvedRecords / totalRecords) * 100 : 0;

     const topPerformingSucursales = sucursalResult.rows.map(row => ({
       sucursalId: row.sucursal_id,
       attendanceRate: parseFloat(row.attendance_rate) || 0
     }));

     return {
       totalRecords,
       approvedRecords,
       pendingRecords: parseInt(pendingResult.rows[0].pending),
       rejectedRecords: parseInt(rejectedResult.rows[0].rejected),
       totalRegularHours: parseFloat(regularResult.rows[0].total_regular) || 0,
       totalOvertimeHours: parseFloat(overtimeResult.rows[0].total_overtime) || 0,
       averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
       topPerformingSucursales
     };
   } catch (error) {
     logger.error('Error obteniendo estadísticas de asistencia', 'AttendancePostgresRepository', { startDate, endDate }, error as Error);
     throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
   }
 }

 /**
  * Buscar registros para auditoría
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
     const conditions: string[] = ['ar.deleted_at IS NULL', 'e.deleted_at IS NULL'];
     const values: any[] = [];
     let paramIndex = 1;

     if (filters.employeeIds && filters.employeeIds.length > 0) {
       const placeholders = filters.employeeIds.map(() => `$${paramIndex++}`).join(',');
       conditions.push(`ar.employee_id IN (${placeholders})`);
       values.push(...filters.employeeIds);
     }

     if (filters.sucursalIds && filters.sucursalIds.length > 0) {
       const sucursalConditions = filters.sucursalIds.map(() => {
         const placeholder = `$${paramIndex++}`;
         return `(e.primary_sucursal_id = ${placeholder} OR ${placeholder} = ANY(e.additional_sucursales))`;
       }).join(' OR ');
       conditions.push(`(${sucursalConditions})`);
       filters.sucursalIds.forEach(id => {
         values.push(id, id);
       });
     }

     if (filters.areaIds && filters.areaIds.length > 0) {
       const placeholders = filters.areaIds.map(() => `$${paramIndex++}`).join(',');
       conditions.push(`e.area_id IN (${placeholders})`);
       values.push(...filters.areaIds);
     }

     if (filters.startDate) {
       conditions.push(`ar.fecha >= $${paramIndex++}`);
       values.push(startOfDay(filters.startDate));
     }

     if (filters.endDate) {
       conditions.push(`ar.fecha <= $${paramIndex++}`);
       values.push(endOfDay(filters.endDate));
     }

     if (filters.status && filters.status.length > 0) {
       const placeholders = filters.status.map(() => `$${paramIndex++}`).join(',');
       conditions.push(`ar.estado IN (${placeholders})`);
       values.push(...filters.status);
     }

     if (filters.hasOvertime !== undefined) {
       if (filters.hasOvertime) {
         conditions.push('ar.horas_extras > 0');
       } else {
         conditions.push('ar.horas_extras = 0');
       }
     }

     if (filters.isManual !== undefined) {
       conditions.push(`ar.es_manual = $${paramIndex++}`);
       values.push(filters.isManual);
     }

     const query = `
       SELECT 
         ar.id, ar.employee_id, ar.fecha, ar.entrada, ar.salida, ar.entrada2, ar.salida2,
         ar.tiempo_almuerzo, ar.horas_regulares, ar.horas_extras, ar.horas_recargo,
         ar.horas_suplementarias, ar.horas_extraordinarias, ar.horas_nocturnas,
         ar.estado, ar.es_manual, ar.observaciones, ar.modificado_por, ar.fecha_modificacion,
         ar.is_active, ar.created_at, ar.updated_at, ar.deleted_at, ar.version
       FROM attendance_records ar
       INNER JOIN employees e ON ar.employee_id = e.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ar.fecha DESC, e.last_name, e.first_name
     `;
     
     const result = await this.pool.query(query, values);
     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     logger.error('Error buscando registros para auditoría', 'AttendancePostgresRepository', filters, error as Error);
     throw new Error(`Error al buscar registros para auditoría: ${(error as Error).message}`);
   }
 }

 /**
  * Bulk insert para sincronización masiva
  */
 async bulkCreate(attendances: AttendanceRecord[]): Promise<AttendanceRecord[]> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     if (attendances.length === 0) {
       await client.query('COMMIT');
       return [];
     }

     // Construir query de inserción masiva
     const valueGroups: string[] = [];
     const allValues: any[] = [];
     let paramIndex = 1;

     for (const attendance of attendances) {
       const valueGroup = `(${Array.from({length: 23}, () => `$${paramIndex++}`).join(', ')})`;
       valueGroups.push(valueGroup);

       allValues.push(
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
         attendance.isActive,
         attendance.createdAt,
         attendance.updatedAt,
         attendance.version
       );
     }

     const query = `
       INSERT INTO attendance_records (
         id, employee_id, fecha, entrada, salida, entrada2, salida2,
         tiempo_almuerzo, horas_regulares, horas_extras, horas_recargo,
         horas_suplementarias, horas_extraordinarias, horas_nocturnas,
         estado, es_manual, observaciones, modificado_por, fecha_modificacion,
         is_active, created_at, updated_at, version
       ) VALUES ${valueGroups.join(', ')}
       ON CONFLICT (employee_id, fecha) DO UPDATE SET
         entrada = EXCLUDED.entrada,
         salida = EXCLUDED.salida,
         horas_regulares = EXCLUDED.horas_regulares,
         horas_extras = EXCLUDED.horas_extras,
         estado = EXCLUDED.estado,
         updated_at = EXCLUDED.updated_at
       RETURNING *
     `;

     const result = await client.query(query, allValues);
     await client.query('COMMIT');

     logger.info('Bulk insert de registros completado', 'AttendancePostgresRepository', { 
       count: attendances.length,
       inserted: result.rows.length 
     });

     return result.rows.map(row => this.mapRowToAttendanceRecord(row));
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error en bulk insert de registros', 'AttendancePostgresRepository', { 
       count: attendances.length 
     }, error as Error);
     throw new Error(`Error en inserción masiva: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Actualizar registros procesados por el sistema biométrico
  */
 async markAsProcessed(ids: string[]): Promise<void> {
   const client = await this.pool.connect();
   
   try {
     await client.query('BEGIN');

     if (ids.length === 0) {
       await client.query('COMMIT');
       return;
     }

     const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
     const query = `
       UPDATE attendance_records 
       SET processed_at = $${ids.length + 1}, updated_at = $${ids.length + 1}
       WHERE id IN (${placeholders}) AND deleted_at IS NULL
     `;

     const now = new Date();
     await client.query(query, [...ids, now]);
     await client.query('COMMIT');

     logger.info('Registros marcados como procesados', 'AttendancePostgresRepository', { 
       count: ids.length 
     });
   } catch (error) {
     await client.query('ROLLBACK');
     logger.error('Error marcando registros como procesados', 'AttendancePostgresRepository', { 
       count: ids.length 
     }, error as Error);
     throw new Error(`Error al marcar como procesados: ${(error as Error).message}`);
   } finally {
     client.release();
   }
 }

 /**
  * Mapea una fila de la base de datos a un objeto AttendanceRecord
  */
 private mapRowToAttendanceRecord(row: any): AttendanceRecord {
   const attendanceData = {
     id: row.id,
     employeeId: row.employee_id,
     fecha: row.fecha,
     entrada: row.entrada,
     salida: row.salida,
     entrada2: row.entrada2,
     salida2: row.salida2,
     tiempoAlmuerzo: row.tiempo_almuerzo || 0,
     horasRegulares: row.horas_regulares || 0,
     horasExtras: row.horas_extras || 0,
     horasRecargo: row.horas_recargo || 0,
     horasSupplementarias: row.horas_suplementarias || 0,
     horasExtraordinarias: row.horas_extraordinarias || 0,
     horasNocturnas: row.horas_nocturnas || 0,
     estado: row.estado,
     esManual: row.es_manual || false,
     observaciones: row.observaciones,
     modificadoPor: row.modificado_por,
     fechaModificacion: row.fecha_modificacion,
     isActive: row.is_active,
     createdAt: row.created_at,
     updatedAt: row.updated_at,
     version: row.version
   };

   return new AttendanceRecord(attendanceData);
 }
}

export default AttendancePostgresRepository;