// src/core/interfaces/services/attendance.service.interface.ts

import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { AttendanceStatus } from '../../enums/attendance-status.enum';
import { WorkCode } from '../../enums/work-code.enum';
import { OvertimeCalculation } from '../../value-objects/overtime-calculation.vo';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el servicio de asistencia
 * Define todas las operaciones de negocio para la gestión de asistencias
 */
export interface IAttendanceService {
  /**
   * Registrar asistencia manual
   */
  recordManualAttendance(attendanceData: {
    employeeId: string;
    timestamp: Date;
    workCode: WorkCode;
    sucursalId: string;
    notes?: string;
    recordedBy: string;
  }): Promise<AttendanceRecord>;

  /**
   * Procesar registro biométrico automático
   */
  processBiometricRecord(biometricData: {
    employeeId: string;
    deviceId: string;
    timestamp: Date;
    verificationType: string;
    quality: number;
    logId: string;
  }): Promise<AttendanceRecord>;

  /**
   * Obtener registros de asistencia por empleado y fecha
   */
  getAttendanceByEmployeeAndDate(
    employeeId: string, 
    date: Date, 
    requestingUserId: string
  ): Promise<AttendanceRecord[]>;

  /**
   * Obtener registros de asistencia por empleado en rango de fechas
   */
  getAttendanceByEmployeeAndDateRange(
    employeeId: string, 
    startDate: Date, 
    endDate: Date,
    requestingUserId: string
  ): Promise<AttendanceRecord[]>;

  /**
   * Obtener registros de asistencia por sucursal
   */
  getAttendanceBySucursal(
    sucursalId: string, 
    date: Date,
    pagination: IPagination,
    requestingUserId: string
  ): Promise<IResponse<AttendanceRecord[]>>;

  /**
   * Calcular horas trabajadas para un empleado en un período
   */
  calculateWorkedHours(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{
    regularHours: number;
    overtimeHours: number;
    overtimeCalculation: OvertimeCalculation;
    totalDays: number;
    daysWorked: number;
    daysAbsent: number;
    lateArrivals: number;
    earlyDepartures: number;
    attendanceRate: number;
  }>;

  /**
   * Generar reporte mensual de asistencia
   */
  generateMonthlyReport(
    year: number, 
    month: number, 
    filters?: {
      sucursalIds?: string[];
      areaIds?: string[];
      employeeIds?: string[];
    }
  ): Promise<{
    reportDate: Date;
    period: string;
    employees: Array<{
      employeeId: string;
      employeeName: string;
      employeeCode: string;
      sucursal: string;
      area: string;
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
      attendanceRate: number;
      totalSalary: number;
    }>;
    summary: {
      totalEmployees: number;
      totalRegularHours: number;
      totalOvertimeHours: number;
      averageAttendanceRate: number;
      totalSalaryExpense: number;
    };
  }>;

  /**
   * Aprobar registro de asistencia
   */
  approveAttendance(
    attendanceId: string, 
    approvedBy: string, 
    notes?: string
  ): Promise<AttendanceRecord>;

  /**
   * Rechazar registro de asistencia
   */
  rejectAttendance(
    attendanceId: string, 
    rejectedBy: string, 
    reason: string
  ): Promise<AttendanceRecord>;

  /**
   * Obtener registros pendientes de aprobación
   */
  getPendingApprovals(
    pagination: IPagination,
    requestingUserId: string
  ): Promise<IResponse<AttendanceRecord[]>>;

  /**
   * Corregir registro de asistencia
   */
  correctAttendance(
    attendanceId: string, 
    corrections: {
      timestamp?: Date;
      workCode?: WorkCode;
      notes?: string;
    },
    correctedBy: string,
    reason: string
  ): Promise<AttendanceRecord>;

  /**
   * Detectar anomalías en registros de asistencia
   */
  detectAnomalies(
    startDate: Date, 
    endDate: Date
  ): Promise<Array<{
    type: 'duplicate' | 'missing_exit' | 'missing_entry' | 'impossible_time' | 'excessive_hours';
    severity: 'low' | 'medium' | 'high';
    employeeId: string;
    attendanceId?: string;
    message: string;
    suggestedAction: string;
    detectedAt: Date;
  }>>;

  /**
   * Procesar ausencias automáticamente
   */
  processAbsences(date: Date): Promise<{
    processedAbsences: number;
    employeesProcessed: string[];
    errors: Array<{
      employeeId: string;
      error: string;
    }>;
  }>;

  /**
   * Calcular horas extras con tarifas ecuatorianas
   */
  calculateOvertimeWithRates(
    employeeId: string, 
    workPeriod: {
      startTime: Date;
      endTime: Date;
    }
  ): Promise<{
    calculation: OvertimeCalculation;
    rates: {
      regular: number;
      recargo25: number;
      suplementario50: number;
      extraordinario100: number;
    };
    amounts: {
      regularAmount: number;
      recargoAmount: number;
      suplementarioAmount: number;
      extraordinarioAmount: number;
      totalAmount: number;
    };
  }>;

  /**
   * Obtener estadísticas de asistencia
   */
  getAttendanceStatistics(
    startDate: Date, 
    endDate: Date,
    filters?: {
      sucursalIds?: string[];
      areaIds?: string[];
    }
  ): Promise<{
    totalRecords: number;
    approvedRecords: number;
    pendingRecords: number;
    rejectedRecords: number;
    averageAttendanceRate: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    bySucursal: Record<string, {
      attendanceRate: number;
      regularHours: number;
      overtimeHours: number;
      employeesCount: number;
    }>;
    topPerformers: Array<{
      employeeId: string;
      employeeName: string;
      attendanceRate: number;
      regularHours: number;
      overtimeHours: number;
    }>;
    trends: Array<{
      date: string;
      attendanceRate: number;
      totalHours: number;
      overtimeHours: number;
    }>;
  }>;

  /**
   * Exportar datos de asistencia
   */
  exportAttendanceData(
    format: 'excel' | 'csv' | 'pdf',
    filters: {
      startDate: Date;
      endDate: Date;
      sucursalIds?: string[];
      areaIds?: string[];
      employeeIds?: string[];
      includeOvertimeCalculations?: boolean;
    },
    requestingUserId: string
  ): Promise<{
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
  }>;

  /**
   * Sincronizar registros desde dispositivos biométricos
   */
  syncFromBiometricDevices(
    deviceIds?: string[]
  ): Promise<{
    totalSynced: number;
    byDevice: Record<string, {
      synced: number;
      errors: number;
      lastSync: Date;
    }>;
    errors: Array<{
      deviceId: string;
      error: string;
    }>;
  }>;

  /**
   * Validar consistencia de registros de asistencia
   */
  validateAttendanceConsistency(
    startDate: Date, 
    endDate: Date
  ): Promise<{
    isConsistent: boolean;
    issues: Array<{
      type: string;
      employeeId: string;
      date: Date;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    fixableIssues: number;
    manualReviewRequired: number;
  }>;

  /**
   * Aplicar correcciones automáticas
   */
  applyAutomaticCorrections(
    validationResults: any,
    appliedBy: string
  ): Promise<{
    corrected: number;
    errors: Array<{
      issue: string;
      error: string;
    }>;
  }>;
}