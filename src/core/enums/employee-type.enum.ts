/**
 * EMPLOYEE TYPE ENUM
 * Tipos de empleados en el sistema con diferentes reglas de cálculo
 */

export enum EmployeeType {
  /**
   * Empleado regular
   * - Horario fijo asignado
   * - Cálculo de horas basado en entradas/salidas
   * - Asignado a una sucursal específica
   */
  REGULAR = 'REGULAR',

  /**
   * Empleado administrativo
   * - Horario flexible
   * - Cálculo basado en primer y último movimiento del día
   * - Puede registrarse en múltiples sucursales
   * - Solo se cuentan días con al menos 4 horas
   */
  ADMINISTRATIVO = 'ADMINISTRATIVO'
}

/**
 * Descripción de tipos de empleado
 */
export const EMPLOYEE_TYPE_DESCRIPTIONS = {
  [EmployeeType.REGULAR]: 'Empleado Regular',
  [EmployeeType.ADMINISTRATIVO]: 'Empleado Administrativo'
} as const;

/**
 * Configuración de cálculo por tipo de empleado
 */
export const EMPLOYEE_TYPE_CONFIG = {
  [EmployeeType.REGULAR]: {
    hasFixedSchedule: true,
    canWorkMultipleSucursales: false,
    calculationMethod: 'ENTRY_EXIT',
    minimumHoursPerDay: 0,
    requiresExactTimeTracking: true,
    allowsManualTimeAdjustment: true,
    overtimeCalculation: 'STANDARD'
  },
  [EmployeeType.ADMINISTRATIVO]: {
    hasFixedSchedule: false,
    canWorkMultipleSucursales: true,
    calculationMethod: 'FIRST_LAST_MOVEMENT',
    minimumHoursPerDay: 4,
    requiresExactTimeTracking: false,
    allowsManualTimeAdjustment: false,
    overtimeCalculation: 'EFFECTIVE_HOURS'
  }
} as const;

/**
 * Horarios típicos por tipo de empleado
 */
export const EMPLOYEE_TYPE_SCHEDULES = {
  [EmployeeType.REGULAR]: {
    defaultStartTime: '08:00',
    defaultEndTime: '17:00',
    breakDuration: 60, // minutos
    flexibilityMinutes: 15
  },
  [EmployeeType.ADMINISTRATIVO]: {
    defaultStartTime: '09:00',
    defaultEndTime: '18:00',
    breakDuration: 60,
    flexibilityMinutes: 120 // 2 horas de flexibilidad
  }
} as const;

/**
 * Reglas de overtime por tipo de empleado
 */
export const OVERTIME_RULES = {
  [EmployeeType.REGULAR]: {
    dailyThreshold: 8, // horas
    weeklyThreshold: 40, // horas
    calculatesRecargo: true, // 25% (horas 9-10)
    calculatesSupplementary: true, // 50% (horas 11-12)
    calculatesExtraordinary: true, // 100% (fines de semana/feriados)
    maxOvertimePerDay: 4
  },
  [EmployeeType.ADMINISTRATIVO]: {
    dailyThreshold: 8,
    weeklyThreshold: 40,
    calculatesRecargo: false,
    calculatesSupplementary: false,
    calculatesExtraordinary: true,
    maxOvertimePerDay: 6,
    effectiveHoursOnly: true // Solo contar días con mínimo 4 horas
  }
} as const;

/**
 * Obtiene la configuración para un tipo de empleado
 */
export function getEmployeeTypeConfig(type: EmployeeType) {
  return EMPLOYEE_TYPE_CONFIG[type];
}

/**
 * Obtiene el horario por defecto para un tipo de empleado
 */
export function getDefaultSchedule(type: EmployeeType) {
  return EMPLOYEE_TYPE_SCHEDULES[type];
}

/**
 * Obtiene las reglas de overtime para un tipo de empleado
 */
export function getOvertimeRules(type: EmployeeType) {
  return OVERTIME_RULES[type];
}

/**
 * Verifica si un tipo de empleado puede trabajar en múltiples sucursales
 */
export function canWorkMultipleSucursales(type: EmployeeType): boolean {
  return EMPLOYEE_TYPE_CONFIG[type].canWorkMultipleSucursales;
}

/**
 * Obtiene el método de cálculo para un tipo de empleado
 */
export function getCalculationMethod(type: EmployeeType): string {
  return EMPLOYEE_TYPE_CONFIG[type].calculationMethod;
}

/**
 * Obtiene las horas mínimas requeridas por día para un tipo de empleado
 */
export function getMinimumHoursPerDay(type: EmployeeType): number {
  return EMPLOYEE_TYPE_CONFIG[type].minimumHoursPerDay;
}

/**
 * Verifica si un tipo de empleado requiere seguimiento exacto de tiempo
 */
export function requiresExactTimeTracking(type: EmployeeType): boolean {
  return EMPLOYEE_TYPE_CONFIG[type].requiresExactTimeTracking;
}

export default EmployeeType;