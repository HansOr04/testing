/**
 * ATTENDANCE STATUS ENUM
 * Estados de registros de asistencia
 */

export enum AttendanceStatus {
  /**
   * Registro completo y válido
   */
  COMPLETO = 'COMPLETO',

  /**
   * Registro pendiente (falta salida)
   */
  PENDIENTE = 'PENDIENTE',

  /**
   * Registro con inconsistencias
   */
  INCONSISTENTE = 'INCONSISTENTE',

  /**
   * Día de ausencia
   */
  AUSENTE = 'AUSENTE',

  /**
   * Día de vacaciones
   */
  VACACIONES = 'VACACIONES',

  /**
   * Día de permiso
   */
  PERMISO = 'PERMISO',

  /**
   * Día de incapacidad médica
   */
  INCAPACIDAD = 'INCAPACIDAD',

  /**
   * Día feriado
   */
  FERIADO = 'FERIADO',

  /**
   * Registro modificado manualmente
   */
  MODIFICADO = 'MODIFICADO',

  /**
   * Registro bajo revisión
   */
  REVISION = 'REVISION'
}

/**
 * Descripción de estados
 */
export const ATTENDANCE_STATUS_DESCRIPTIONS = {
  [AttendanceStatus.COMPLETO]: 'Completo',
  [AttendanceStatus.PENDIENTE]: 'Pendiente',
  [AttendanceStatus.INCONSISTENTE]: 'Inconsistente',
  [AttendanceStatus.AUSENTE]: 'Ausente',
  [AttendanceStatus.VACACIONES]: 'Vacaciones',
  [AttendanceStatus.PERMISO]: 'Permiso',
  [AttendanceStatus.INCAPACIDAD]: 'Incapacidad',
  [AttendanceStatus.FERIADO]: 'Feriado',
  [AttendanceStatus.MODIFICADO]: 'Modificado',
  [AttendanceStatus.REVISION]: 'En Revisión'
} as const;

/**
 * Estados que cuentan como tiempo trabajado
 */
export const WORK_TIME_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.COMPLETO,
  AttendanceStatus.PENDIENTE,
  AttendanceStatus.MODIFICADO
];

/**
 * Estados que son ausencias justificadas
 */
export const JUSTIFIED_ABSENCE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.VACACIONES,
  AttendanceStatus.PERMISO,
  AttendanceStatus.INCAPACIDAD,
  AttendanceStatus.FERIADO
];

/**
 * Estados que requieren atención
 */
export const ATTENTION_REQUIRED_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.PENDIENTE,
  AttendanceStatus.INCONSISTENTE,
  AttendanceStatus.REVISION
];

/**
 * Estados finales (no se pueden modificar automáticamente)
 */
export const FINAL_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.COMPLETO,
  AttendanceStatus.VACACIONES,
  AttendanceStatus.PERMISO,
  AttendanceStatus.INCAPACIDAD,
  AttendanceStatus.FERIADO
];

/**
 * Colores para UI
 */
export const ATTENDANCE_STATUS_COLORS = {
  [AttendanceStatus.COMPLETO]: '#10B981', // Verde
  [AttendanceStatus.PENDIENTE]: '#F59E0B', // Amarillo
  [AttendanceStatus.INCONSISTENTE]: '#EF4444', // Rojo
  [AttendanceStatus.AUSENTE]: '#DC2626', // Rojo oscuro
  [AttendanceStatus.VACACIONES]: '#3B82F6', // Azul
  [AttendanceStatus.PERMISO]: '#8B5CF6', // Púrpura
  [AttendanceStatus.INCAPACIDAD]: '#F97316', // Naranja
  [AttendanceStatus.FERIADO]: '#06B6D4', // Cian
  [AttendanceStatus.MODIFICADO]: '#84CC16', // Lima
  [AttendanceStatus.REVISION]: '#6B7280' // Gris
} as const;

/**
 * Iconos para cada estado
 */
export const ATTENDANCE_STATUS_ICONS = {
  [AttendanceStatus.COMPLETO]: 'check-circle',
  [AttendanceStatus.PENDIENTE]: 'clock',
  [AttendanceStatus.INCONSISTENTE]: 'alert-triangle',
  [AttendanceStatus.AUSENTE]: 'x-circle',
  [AttendanceStatus.VACACIONES]: 'umbrella',
  [AttendanceStatus.PERMISO]: 'user-check',
  [AttendanceStatus.INCAPACIDAD]: 'heart',
  [AttendanceStatus.FERIADO]: 'calendar',
  [AttendanceStatus.MODIFICADO]: 'edit',
  [AttendanceStatus.REVISION]: 'search'
} as const;

/**
 * Prioridad para ordenamiento
 */
export const ATTENDANCE_STATUS_PRIORITY = {
  [AttendanceStatus.INCONSISTENTE]: 1,
  [AttendanceStatus.PENDIENTE]: 2,
  [AttendanceStatus.REVISION]: 3,
  [AttendanceStatus.AUSENTE]: 4,
  [AttendanceStatus.MODIFICADO]: 5,
  [AttendanceStatus.COMPLETO]: 6,
  [AttendanceStatus.INCAPACIDAD]: 7,
  [AttendanceStatus.PERMISO]: 8,
  [AttendanceStatus.VACACIONES]: 9,
  [AttendanceStatus.FERIADO]: 10
} as const;

/**
 * Acciones permitidas por estado
 */
export const ATTENDANCE_STATUS_ACTIONS = {
  [AttendanceStatus.COMPLETO]: ['view', 'export', 'edit_manual'],
  [AttendanceStatus.PENDIENTE]: ['complete', 'mark_absent', 'edit'],
  [AttendanceStatus.INCONSISTENTE]: ['fix', 'mark_absent', 'manual_entry'],
  [AttendanceStatus.AUSENTE]: ['justify', 'mark_present', 'add_permission'],
  [AttendanceStatus.VACACIONES]: ['view', 'cancel_vacation'],
  [AttendanceStatus.PERMISO]: ['view', 'cancel_permission'],
  [AttendanceStatus.INCAPACIDAD]: ['view', 'extend_incapacity'],
  [AttendanceStatus.FERIADO]: ['view'],
  [AttendanceStatus.MODIFICADO]: ['view', 'revert', 'audit'],
  [AttendanceStatus.REVISION]: ['approve', 'reject', 'request_info']
} as const;

/**
 * Obtiene la descripción de un estado
 */
export function getAttendanceStatusDescription(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_DESCRIPTIONS[status];
}

/**
 * Obtiene el color de un estado
 */
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_COLORS[status];
}

/**
 * Obtiene el icono de un estado
 */
export function getAttendanceStatusIcon(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_ICONS[status];
}

/**
 * Verifica si un estado cuenta como tiempo trabajado
 */
export function countsAsWorkTime(status: AttendanceStatus): boolean {
  return WORK_TIME_STATUSES.includes(status);
}

/**
 * Verifica si un estado es una ausencia justificada
 */
export function isJustifiedAbsence(status: AttendanceStatus): boolean {
  return JUSTIFIED_ABSENCE_STATUSES.includes(status);
}

/**
 * Verifica si un estado requiere atención
 */
export function requiresAttention(status: AttendanceStatus): boolean {
  return ATTENTION_REQUIRED_STATUSES.includes(status);
}

/**
 * Verifica si un estado es final
 */
export function isFinalStatus(status: AttendanceStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/**
 * Obtiene la prioridad de un estado
 */
export function getStatusPriority(status: AttendanceStatus): number {
  return ATTENDANCE_STATUS_PRIORITY[status];
}

/**
 * Obtiene las acciones permitidas para un estado
 */
export function getAllowedActions(status: AttendanceStatus): string[] {
  return [...(ATTENDANCE_STATUS_ACTIONS[status] || [])];
}

/**
 * Verifica si una acción está permitida para un estado
 */
export function isActionAllowed(status: AttendanceStatus, action: string): boolean {
  return getAllowedActions(status).includes(action);
}

/**
 * Determina el estado basado en condiciones
 */
export function determineAttendanceStatus(conditions: {
  hasEntry: boolean;
  hasExit: boolean;
  isHoliday: boolean;
  hasVacation: boolean;
  hasPermission: boolean;
  hasIncapacity: boolean;
  isInconsistent: boolean;
  isManuallyModified: boolean;
}): AttendanceStatus {
  const {
    hasEntry,
    hasExit,
    isHoliday,
    hasVacation,
    hasPermission,
    hasIncapacity,
    isInconsistent,
    isManuallyModified
  } = conditions;

  // Estados especiales primero
  if (isHoliday) return AttendanceStatus.FERIADO;
  if (hasVacation) return AttendanceStatus.VACACIONES;
  if (hasPermission) return AttendanceStatus.PERMISO;
  if (hasIncapacity) return AttendanceStatus.INCAPACIDAD;

  // Estados de trabajo
  if (isManuallyModified) return AttendanceStatus.MODIFICADO;
  if (isInconsistent) return AttendanceStatus.INCONSISTENTE;
  if (hasEntry && hasExit) return AttendanceStatus.COMPLETO;
  if (hasEntry && !hasExit) return AttendanceStatus.PENDIENTE;
  if (!hasEntry && !hasExit) return AttendanceStatus.AUSENTE;

  return AttendanceStatus.INCONSISTENTE;
}

/**
 * Obtiene estados válidos para transición
 */
export function getValidTransitions(currentStatus: AttendanceStatus): AttendanceStatus[] {
  switch (currentStatus) {
    case AttendanceStatus.PENDIENTE:
      return [AttendanceStatus.COMPLETO, AttendanceStatus.AUSENTE, AttendanceStatus.INCONSISTENTE];
    case AttendanceStatus.INCONSISTENTE:
      return [AttendanceStatus.COMPLETO, AttendanceStatus.AUSENTE, AttendanceStatus.MODIFICADO];
    case AttendanceStatus.AUSENTE:
      return [AttendanceStatus.COMPLETO, AttendanceStatus.VACACIONES, AttendanceStatus.PERMISO, AttendanceStatus.INCAPACIDAD];
    case AttendanceStatus.REVISION:
      return [AttendanceStatus.COMPLETO, AttendanceStatus.INCONSISTENTE, AttendanceStatus.AUSENTE];
    default:
      return [];
  }
}

export default AttendanceStatus;