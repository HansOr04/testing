// src/core/interfaces/services/index.ts

/**
 * Índice de todas las interfaces de servicios
 * Facilita la importación y exportación de contratos de servicios de negocio
 */

// Service interfaces
export type { IAuthService } from './auth.service.interface';
export type { IEmployeeService } from './employee.service.interface';
export type { IAttendanceService } from './attendance.service.interface';
export type { IBiometricDeviceService } from './biometric-device.service.interface';
export type { IAttendanceCalculatorService } from './attendance-calculator.service.interface';
export type { IReportService } from './report.service.interface';

// Re-export types for use in union types
import type { IAuthService } from './auth.service.interface';
import type { IEmployeeService } from './employee.service.interface';
import type { IAttendanceService } from './attendance.service.interface';
import type { IBiometricDeviceService } from './biometric-device.service.interface';
import type { IAttendanceCalculatorService } from './attendance-calculator.service.interface';
import type { IReportService } from './report.service.interface';

/**
 * Tipo unión de todos los servicios disponibles
 * Útil para inyección de dependencias y factory patterns
 */
export type AnyService = 
  | IAuthService
  | IEmployeeService
  | IAttendanceService
  | IBiometricDeviceService
  | IAttendanceCalculatorService
  | IReportService;

/**
 * Mapa de nombres de servicios a sus interfaces
 * Útil para registro dinámico de dependencias
 */
export interface ServiceMap {
  authService: IAuthService;
  employeeService: IEmployeeService;
  attendanceService: IAttendanceService;
  biometricDeviceService: IBiometricDeviceService;
  attendanceCalculatorService: IAttendanceCalculatorService;
  reportService: IReportService;
}

/**
 * Tipo para obtener el tipo de servicio por su nombre
 */
export type ServiceType<T extends keyof ServiceMap> = ServiceMap[T];

/**
 * Constantes para identificadores de servicios
 * Útil para sistemas de inyección de dependencias
 */
export const SERVICE_TOKENS = {
  AUTH_SERVICE: 'AuthService',
  EMPLOYEE_SERVICE: 'EmployeeService',
  ATTENDANCE_SERVICE: 'AttendanceService',
  BIOMETRIC_DEVICE_SERVICE: 'BiometricDeviceService',
  ATTENDANCE_CALCULATOR_SERVICE: 'AttendanceCalculatorService',
  REPORT_SERVICE: 'ReportService',
} as const;

/**
 * Tipo para los tokens de servicios
 */
export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];

/**
 * Interfaz base para todos los servicios
 * Define métodos comunes que todos los servicios deben implementar
 */
export interface IBaseService {
  /**
   * Inicializar el servicio
   */
  initialize?(): Promise<void>;

  /**
   * Limpiar recursos del servicio
   */
  dispose?(): Promise<void>;

  /**
   * Verificar salud del servicio
   */
  healthCheck?(): Promise<{
    isHealthy: boolean;
    message?: string;
    details?: any;
  }>;
}

/**
 * Interfaz para servicios que requieren configuración
 */
export interface IConfigurableService extends IBaseService {
  /**
   * Configurar el servicio
   */
  configure(config: any): Promise<void>;

  /**
   * Obtener configuración actual
   */
  getConfiguration(): any;
}

/**
 * Interfaz para servicios con capacidades de cache
 */
export interface ICacheableService extends IBaseService {
  /**
   * Limpiar cache del servicio
   */
  clearCache(): Promise<void>;

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats(): {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
}