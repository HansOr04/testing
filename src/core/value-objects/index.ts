/**
 * VALUE OBJECTS INDEX
 * Exportación centralizada de todos los value objects del sistema
 */

// Value Objects principales
export { default as Cedula } from './cedula.vo';
export { default as TimeRange } from './time-range.vo';
export { default as WorkSchedule } from './work-schedule.vo';
export { default as OvertimeCalculation } from './overtime-calculation.vo';
export { default as EmployeeTypeVO } from './employee-type.vo';

// Re-exportar tipos e interfaces importantes
export type {
  IWeeklySchedule
} from './work-schedule.vo';

export type {
  IOvertimeRates,
  IOvertimeBreakdown,
  IDayContext
} from './overtime-calculation.vo';

export type {
  IEmployeeTypeConfiguration,
  IEmployeeTypePermissions,
  IEmployeeTypeSchedule,
  IEmployeeTypeOvertime,
  IEmployeeTypeValidationRules
} from './employee-type.vo';
export type {
  ITimeRangeValidationResult
} from './time-range.vo';