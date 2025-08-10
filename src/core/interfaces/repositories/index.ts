// src/core/interfaces/repositories/index.ts

/**
 * Índice de todas las interfaces de repositorios
 * Facilita la importación y exportación de contratos de persistencia
 */

// Repository interfaces
export type { IUserRepository } from './user.repository.interface';
export type { IEmployeeRepository } from './employee.repository.interface';
export type { ISucursalRepository } from './sucursal.repository.interface';
export type { IAreaRepository } from './area.repository.interface';
export type { IAttendanceRepository } from './attendance.repository.interface';
export type { IBiometricLogRepository } from './biometric-log.repository.interface';
export type { IBiometricDeviceRepository } from './biometric-device.repository.interface';

// Re-export types for use in union types
import type { IUserRepository } from './user.repository.interface';
import type { IEmployeeRepository } from './employee.repository.interface';
import type { ISucursalRepository } from './sucursal.repository.interface';
import type { IAreaRepository } from './area.repository.interface';
import type { IAttendanceRepository } from './attendance.repository.interface';
import type { IBiometricLogRepository } from './biometric-log.repository.interface';
import type { IBiometricDeviceRepository } from './biometric-device.repository.interface';

/**
 * Tipo unión de todos los repositorios disponibles
 * Útil para inyección de dependencias y factory patterns
 */
export type AnyRepository = 
  | IUserRepository
  | IEmployeeRepository
  | ISucursalRepository
  | IAreaRepository
  | IAttendanceRepository
  | IBiometricLogRepository
  | IBiometricDeviceRepository;

/**
 * Mapa de nombres de repositorios a sus interfaces
 * Útil para registro dinámico de dependencias
 */
export interface RepositoryMap {
  userRepository: IUserRepository;
  employeeRepository: IEmployeeRepository;
  sucursalRepository: ISucursalRepository;
  areaRepository: IAreaRepository;
  attendanceRepository: IAttendanceRepository;
  biometricLogRepository: IBiometricLogRepository;
  biometricDeviceRepository: IBiometricDeviceRepository;
}

/**
 * Tipo para obtener el tipo de repositorio por su nombre
 */
export type RepositoryType<T extends keyof RepositoryMap> = RepositoryMap[T];

/**
 * Constantes para identificadores de repositorios
 * Útil para sistemas de inyección de dependencias
 */
export const REPOSITORY_TOKENS = {
  USER_REPOSITORY: 'UserRepository',
  EMPLOYEE_REPOSITORY: 'EmployeeRepository',
  SUCURSAL_REPOSITORY: 'SucursalRepository',
  AREA_REPOSITORY: 'AreaRepository',
  ATTENDANCE_REPOSITORY: 'AttendanceRepository',
  BIOMETRIC_LOG_REPOSITORY: 'BiometricLogRepository',
  BIOMETRIC_DEVICE_REPOSITORY: 'BiometricDeviceRepository',
} as const;

/**
 * Tipo para los tokens de repositorios
 */
export type RepositoryToken = typeof REPOSITORY_TOKENS[keyof typeof REPOSITORY_TOKENS];