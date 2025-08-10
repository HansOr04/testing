// src/core/interfaces/services/biometric-device.service.interface.ts

import { BiometricDevice } from '../../entities/biometric-device.entity';
import { DeviceStatus } from '../../enums/device-status.enum';
import { Employee } from '../../entities/employee.entity';

/**
 * Contrato para el servicio de dispositivos biométricos
 * Define todas las operaciones para la gestión de dispositivos FACEID 360
 */
export interface IBiometricDeviceService {
  /**
   * Conectar a dispositivo biométrico
   */
  connectToDevice(deviceId: string): Promise<{
    success: boolean;
    deviceInfo?: {
      model: string;
      serialNumber: string;
      firmwareVersion: string;
      totalUsers: number;
      totalRecords: number;
      freeMemory: number;
    };
    error?: string;
  }>;

  /**
   * Desconectar de dispositivo biométrico
   */
  disconnectFromDevice(deviceId: string): Promise<void>;

  /**
   * Obtener estado del dispositivo
   */
  getDeviceStatus(deviceId: string): Promise<{
    status: DeviceStatus;
    isOnline: boolean;
    lastConnection: Date;
    lastSync: Date;
    deviceInfo: {
      model: string;
      serialNumber: string;
      firmwareVersion: string;
      ipAddress: string;
      port: number;
    };
    statistics: {
      totalUsers: number;
      totalRecords: number;
      usedMemory: number;
      freeMemory: number;
      cpuUsage: number;
      temperature?: number;
    };
  }>;

  /**
   * Sincronizar datos de asistencia desde dispositivo
   */
  syncAttendanceData(deviceId: string, since?: Date): Promise<{
    success: boolean;
    recordsSynced: number;
    lastRecord?: Date;
    errors: Array<{
      record: any;
      error: string;
    }>;
  }>;

  /**
   * Sincronizar empleado al dispositivo
   */
  syncEmployeeToDevice(deviceId: string, employee: Employee): Promise<{
    success: boolean;
    employeeId: string;
    biometricId?: number;
    error?: string;
  }>;

  /**
   * Sincronizar múltiples empleados al dispositivo
   */
  syncMultipleEmployeesToDevice(deviceId: string, employees: Employee[]): Promise<{
    totalEmployees: number;
    synced: number;
    failed: number;
    results: Array<{
      employeeId: string;
      success: boolean;
      biometricId?: number;
      error?: string;
    }>;
  }>;

  /**
   * Remover empleado del dispositivo
   */
  removeEmployeeFromDevice(deviceId: string, employeeId: string): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Obtener lista de empleados en el dispositivo
   */
  getDeviceEmployees(deviceId: string): Promise<Array<{
    biometricId: number;
    employeeCode: string;
    name: string;
    hasFingerprint: boolean;
    hasFace: boolean;
    lastAccess?: Date;
  }>>;

  /**
   * Limpiar datos del dispositivo
   */
  clearDeviceData(deviceId: string, dataType: 'users' | 'records' | 'all'): Promise<{
    success: boolean;
    clearedRecords: number;
    error?: string;
  }>;

  /**
   * Configurar dispositivo
   */
  configureDevice(deviceId: string, configuration: {
    timeZone?: string;
    dateTimeFormat?: string;
    volume?: number;
    brightness?: number;
    lockDelay?: number;
    verificationType?: 'fingerprint' | 'face' | 'both';
    accessControl?: boolean;
  }): Promise<{
    success: boolean;
    appliedSettings: string[];
    error?: string;
  }>;

  /**
   * Actualizar firmware del dispositivo
   */
  updateDeviceFirmware(deviceId: string, firmwareFile: Buffer): Promise<{
    success: boolean;
    oldVersion: string;
    newVersion: string;
    updateDuration: number;
    error?: string;
  }>;

  /**
   * Reiniciar dispositivo
   */
  restartDevice(deviceId: string): Promise<{
    success: boolean;
    restartTime: Date;
    error?: string;
  }>;

  /**
   * Obtener logs del dispositivo
   */
  getDeviceLogs(deviceId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  }>>;

  /**
   * Monitorear dispositivos en tiempo real
   */
  startDeviceMonitoring(deviceIds: string[]): Promise<void>;

  /**
   * Detener monitoreo de dispositivos
   */
  stopDeviceMonitoring(deviceIds?: string[]): Promise<void>;

  /**
   * Obtener métricas de rendimiento del dispositivo
   */
  getDevicePerformanceMetrics(deviceId: string, period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    uptime: number;
    averageResponseTime: number;
    totalScans: number;
    successfulScans: number;
    failedScans: number;
    errorRate: number;
    peakUsage: {
      hour: number;
      scans: number;
    };
    dailyStats: Array<{
      date: string;
      scans: number;
      uptime: number;
      errors: number;
    }>;
  }>;

  /**
   * Backup de configuración del dispositivo
   */
  backupDeviceConfiguration(deviceId: string): Promise<{
    success: boolean;
    backupData: any;
    backupDate: Date;
    error?: string;
  }>;

  /**
   * Restaurar configuración del dispositivo
   */
  restoreDeviceConfiguration(deviceId: string, backupData: any): Promise<{
    success: boolean;
    restoredSettings: string[];
    error?: string;
  }>;
}
