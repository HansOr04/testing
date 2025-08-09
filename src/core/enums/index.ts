/**
 * ENUMS INDEX
 * Exportación centralizada de todos los enums del sistema
 */

// Enums principales
export { default as UserRole } from './user-role.enum';
export { default as EmployeeType } from './employee-type.enum';
export { default as WorkCode } from './work-code.enum';
export { default as DeviceStatus } from './device-status.enum';
export { default as AttendanceStatus } from './attendance-status.enum';

// Re-exportar tipos y funciones útiles
export {
  USER_ROLE_DESCRIPTIONS,
  USER_ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  canAccessAllSucursales,
  isRoleHigherThan
} from './user-role.enum';

export {
  EMPLOYEE_TYPE_DESCRIPTIONS,
  EMPLOYEE_TYPE_CONFIG,
  getEmployeeTypeConfig,
  getDefaultSchedule,
  getOvertimeRules,
  canWorkMultipleSucursales,
  getCalculationMethod,
  getMinimumHoursPerDay,
  requiresExactTimeTracking
} from './employee-type.enum';

export {
  WORK_CODE_DESCRIPTIONS,
  ENTRY_CODES,
  EXIT_CODES,
  MAIN_CODES,
  BREAK_CODES,
  getWorkCodeDescription,
  isEntryCode,
  isExitCode,
  isBreakCode,
  countsAsWorkTime,
  validateCodeSequence,
  getExpectedNextCodes
} from './work-code.enum';

export {
  DEVICE_STATUS_DESCRIPTIONS,
  DEVICE_STATUS_COLORS,
  DEVICE_STATUS_ICONS,
  getDeviceStatusDescription,
  getDeviceStatusColor,
  getDeviceStatusIcon,
  isOperational,
  requiresAttention as deviceRequiresAttention,
  isTemporaryStatus,
  isValidStatusTransition,
  getStatusMessage
} from './device-status.enum';

export {
  ATTENDANCE_STATUS_DESCRIPTIONS,
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_ICONS,
  getAttendanceStatusDescription,
  getAttendanceStatusColor,
  getAttendanceStatusIcon,
  countsAsWorkTime as attendanceCountsAsWorkTime,
  isJustifiedAbsence,
  requiresAttention as attendanceRequiresAttention,
  isFinalStatus,
  determineAttendanceStatus,
  getValidTransitions
} from './attendance-status.enum';