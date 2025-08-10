// src/core/interfaces/repositories/biometric-log.repository.interface.ts

import { BiometricLog } from '../../entities/biometric-log.entity';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de logs biométricos
 * Define todas las operaciones de persistencia para la entidad BiometricLog
 */
export interface IBiometricLogRepository {
  /**
   * Buscar log biométrico por ID
   */
  findById(id: string): Promise<BiometricLog | null>;

  /**
   * Buscar logs por empleado y fecha
   */
  findByEmployeeAndDate(employeeId: string, date: Date): Promise<BiometricLog[]>;

  /**
   * Buscar logs por empleado en un rango de fechas
   */
  findByEmployeeAndDateRange(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<BiometricLog[]>;

  /**
   * Buscar logs por dispositivo y fecha
   */
  findByDeviceAndDate(deviceId: string, date: Date): Promise<BiometricLog[]>;

  /**
   * Buscar logs por dispositivo en un rango de fechas
   */
  findByDeviceAndDateRange(
    deviceId: string, 
    startDate: Date, 
    endDate: Date,
    pagination: IPagination
  ): Promise<IResponse<BiometricLog[]>>;

  /**
   * Buscar logs no procesados (pendientes de convertir a AttendanceRecord)
   */
  findUnprocessed(pagination: IPagination): Promise<IResponse<BiometricLog[]>>;

  /**
   * Buscar logs por sucursal y fecha
   */
  findBySucursalAndDate(sucursalId: string, date: Date): Promise<BiometricLog[]>;

  /**
   * Crear nuevo log biométrico
   */
  create(log: BiometricLog): Promise<BiometricLog>;

  /**
   * Crear múltiples logs biométricos (bulk insert)
   */
  bulkCreate(logs: BiometricLog[]): Promise<BiometricLog[]>;

  /**
   * Actualizar log biométrico existente
   */
  update(id: string, log: Partial<BiometricLog>): Promise<BiometricLog>;

  /**
   * Eliminar log biométrico
   */
  delete(id: string): Promise<void>;

  /**
   * Marcar log como procesado
   */
  markAsProcessed(id: string, attendanceRecordId: string): Promise<BiometricLog>;

  /**
   * Marcar múltiples logs como procesados
   */
  markMultipleAsProcessed(updates: Array<{
    logId: string;
    attendanceRecordId: string;
  }>): Promise<void>;

  /**
   * Buscar logs duplicados (mismo empleado, dispositivo, timestamp similar)
   */
  findDuplicates(timeThresholdMinutes: number): Promise<BiometricLog[]>;

  /**
   * Eliminar logs duplicados manteniendo el más reciente
   */
  removeDuplicates(timeThresholdMinutes: number): Promise<number>;

  /**
   * Obtener último log de un empleado
   */
  findLastByEmployee(employeeId: string): Promise<BiometricLog | null>;

  /**
   * Buscar logs por rango de timestamp para sincronización
   */
  findByTimestampRange(
    startTimestamp: Date, 
    endTimestamp: Date
  ): Promise<BiometricLog[]>;

  /**
   * Obtener logs para auditoría
   */
  findForAudit(filters: {
    employeeIds?: string[];
    deviceIds?: string[];
    sucursalIds?: string[];
    startDate?: Date;
    endDate?: Date;
    processed?: boolean;
    hasAttendanceRecord?: boolean;
  }): Promise<BiometricLog[]>;

  /**
   * Obtener estadísticas de logs biométricos
   */
  getStatistics(startDate: Date, endDate: Date): Promise<{
    totalLogs: number;
    processedLogs: number;
    unprocessedLogs: number;
    byDevice: Record<string, {
      total: number;
      processed: number;
      unprocessed: number;
    }>;
    bySucursal: Record<string, {
      total: number;
      processed: number;
      unprocessed: number;
    }>;
    duplicatesFound: number;
    averageProcessingTime: number; // en minutos
  }>;

  /**
   * Buscar logs sin empleado asociado (empleado no encontrado en el sistema)
   */
  findOrphanLogs(): Promise<BiometricLog[]>;

  /**
   * Buscar logs con errores de sincronización
   */
  findSyncErrors(): Promise<BiometricLog[]>;

  /**
   * Obtener logs para reporte de actividad por dispositivo
   */
  getDeviceActivityReport(
    deviceId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
    deviceInfo: {
      id: string;
      name: string;
      location: string;
      sucursalId: string;
    };
    dailyActivity: Array<{
      date: string;
      totalScans: number;
      uniqueEmployees: number;
      firstScan: Date;
      lastScan: Date;
      averageScansPerEmployee: number;
    }>;
    summary: {
      totalScans: number;
      uniqueEmployees: number;
      averageDaily: number;
      peakDay: {
        date: string;
        scans: number;
      };
    };
  }>;

  /**
   * Obtener trazabilidad completa de un empleado
   */
  getEmployeeTrace(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Array<{
    timestamp: Date;
    deviceId: string;
    deviceName: string;
    sucursalId: string;
    sucursalName: string;
    processed: boolean;
    attendanceRecordId?: string;
    verificationType: string;
    quality: number;
  }>>;

  /**
   * Limpiar logs antiguos (según política de retención)
   */
  cleanOldLogs(retentionDays: number): Promise<number>;

  /**
   * Verificar integridad de logs (detectar gaps en secuencia)
   */
  verifyIntegrity(deviceId: string, date: Date): Promise<{
    hasGaps: boolean;
    missingSequences: Array<{
      expectedSequence: number;
      actualSequence: number;
      gap: number;
    }>;
    totalGaps: number;
  }>;

  /**
   * Exportar logs para backup o migración
   */
  exportLogs(filters: {
    startDate: Date;
    endDate: Date;
    deviceIds?: string[];
    format: 'json' | 'csv';
  }): Promise<string>;
}