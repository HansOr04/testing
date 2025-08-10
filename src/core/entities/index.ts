/**
 * ENTITIES INDEX
 * Exportación centralizada de todas las entidades del dominio
 */

// Entidad base
export { default as BaseEntity } from './base.entity';
export type { 
  IBaseEntity, 
  ICreateBaseEntityData, 
  IUpdateBaseEntityData 
} from './base.entity';

// Entidades principales
export { default as User } from './user.entity';
export type { 
  ICreateUserData, 
  IUpdateUserData, 
  IUserSession, 
  IUserPreferences 
} from './user.entity';

export { default as Employee } from './employee.entity';
export type { 
  ICreateEmployeeData, 
  IUpdateEmployeeData,
  IEmergencyContact,
  IEmployeeStats,
  ISucursalAssignment
} from './employee.entity';

export { default as Sucursal } from './sucursal.entity';
export type { 
  ICreateSucursalData, 
  IUpdateSucursalData,
  ISucursalStats,
  ISucursalOperation
} from './sucursal.entity';

export { default as Area } from './area.entity';
export type { 
  ICreateAreaData, 
  IUpdateAreaData,
  IAreaLimits,
  IAreaStats,
  IAreaOperation
} from './area.entity';

export { default as BiometricDevice } from './biometric-device.entity';
export type { 
  ICreateBiometricDeviceData, 
  IUpdateBiometricDeviceData,
  IDeviceConfiguration,
  IDeviceStats,
  IConnectionInfo,
  IDeviceOperationResult
} from './biometric-device.entity';

// Re-exportar tipos importantes de enums
export { UserRole } from '@core/enums/user-role.enum';
export { EmployeeType } from '@core/enums/employee-type.enum';
export { DeviceStatus } from '@core/enums/device-status.enum';