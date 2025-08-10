// src/core/interfaces/repositories/attendance.repository.interface.ts

import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { AttendanceStatus } from '../../enums/attendance-status.enum';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de registros de asistencia
 * Define todas las operaciones de persistencia para la entidad AttendanceRecord
 */
export interface IAttendanceRepository {
  /**
   * Buscar registro de asistencia por ID
   */
  findById(id: string): Promise<AttendanceRecord | null>;

  /**
   * Buscar registros de asistencia por empleado y fecha
   */
  findByEmployeeAndDate(employeeId: string, date: Date): Promise<AttendanceRecord[]>;

  /**
   * Buscar registros de asistencia por empleado en un rango de fechas
   */
  findByEmployeeAndDateRange(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AttendanceRecord[]>;

  /**
   * Buscar registros de asistencia por sucursal y fecha
   */
  findBySucursalAndDate(sucursalId: string, date: Date): Promise<AttendanceRecord[]>;

  /**
   * Buscar registros de asistencia por sucursal en un rango de fechas
   */
  findBySucursalAndDateRange(
    sucursalId: string, 
    startDate: Date, 
    endDate: Date,
    pagination: IPagination
  ): Promise<IResponse<AttendanceRecord[]>>;

  /**
   * Buscar registros de asistencia por área y fecha
   */
  findByAreaAndDate(areaId: string, date: Date): Promise<AttendanceRecord[]>;

  /**
   * Buscar registros de asistencia por estado
   */
  findByStatus(
    status: AttendanceStatus, 
    pagination: IPagination
  ): Promise<IResponse<AttendanceRecord[]>>;

  /**
   * Buscar registros pendientes de aprobación
   */
  findPendingApproval(pagination: IPagination): Promise<IResponse<AttendanceRecord[]>>;

  /**
   * Buscar registros con horas extras
   */
  findWithOvertime(
    startDate: Date, 
    endDate: Date,
    pagination: IPagination
  ): Promise<IResponse<AttendanceRecord[]>>;

  /**
   * Crear nuevo registro de asistencia
   */
  create(attendance: AttendanceRecord): Promise<AttendanceRecord>;

  /**
   * Actualizar registro de asistencia existente
   */
  update(id: string, attendance: Partial<AttendanceRecord>): Promise<AttendanceRecord>;

  /**
   * Eliminar registro de asistencia
   */
  delete(id: string): Promise<void>;

  /**
   * Aprobar registro de asistencia
   */
  approve(id: string, approvedBy: string): Promise<AttendanceRecord>;

  /**
   * Rechazar registro de asistencia
   */
  reject(id: string, rejectedBy: string, reason: string): Promise<AttendanceRecord>;

  /**
   * Calcular horas trabajadas por empleado en un mes
   */
  calculateMonthlyHours(employeeId: string, year: number, month: number): Promise<{
    regularHours: number;
    overtimeHours: number;
    overtimeBreakdown: {
      recargo25: number;  // 19:00-24:00
      suplementario50: number;  // 24:00-06:00 y domingos
      extraordinario100: number;  // feriados
    };
    daysWorked: number;
    daysAbsent: number;
    lateArrivals: number;
    earlyDepartures: number;
  }>;

  /**
   * Generar reporte de asistencia por sucursal
   */
  generateSucursalReport(
    sucursalId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
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
  }>;

  /**
   * Generar reporte de asistencia por área
   */
  generateAreaReport(
    areaId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
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
  }>;

  /**
   * Buscar registros duplicados (mismo empleado, fecha y hora similar)
   */
  findDuplicates(timeThreshold: number): Promise<AttendanceRecord[]>;

  /**
   * Obtener último registro de asistencia de un empleado
   */
  findLastByEmployee(employeeId: string): Promise<AttendanceRecord | null>;

  /**
   * Verificar si existe registro de entrada para empleado en fecha específica
   */
  hasEntryRecord(employeeId: string, date: Date): Promise<boolean>;

  /**
   * Verificar si existe registro de salida para empleado en fecha específica
   */
  hasExitRecord(employeeId: string, date: Date): Promise<boolean>;

  /**
   * Buscar registros inconsistentes (entrada sin salida, etc.)
   */
  findInconsistentRecords(date?: Date): Promise<AttendanceRecord[]>;

  /**
   * Obtener estadísticas de asistencia
   */
  getStatistics(startDate: Date, endDate: Date): Promise<{
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
  }>;

  /**
   * Buscar registros para auditoría
   */
  findForAudit(filters: {
    employeeIds?: string[];
    sucursalIds?: string[];
    areaIds?: string[];
    startDate?: Date;
    endDate?: Date;
    status?: AttendanceStatus[];
    hasOvertime?: boolean;
    isManual?: boolean;
  }): Promise<AttendanceRecord[]>;

  /**
   * Bulk insert para sincronización masiva desde dispositivos biométricos
   */
  bulkCreate(attendances: AttendanceRecord[]): Promise<AttendanceRecord[]>;

  /**
   * Actualizar registros procesados por el sistema biométrico
   */
  markAsProcessed(ids: string[]): Promise<void>;
}