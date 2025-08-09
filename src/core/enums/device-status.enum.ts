/**
 * DEVICE STATUS ENUM
 * Estados de los dispositivos biométricos FACEID 360
 */

export enum DeviceStatus {
  /**
   * Dispositivo conectado y funcionando
   */
  CONECTADO = 'CONECTADO',

  /**
   * Dispositivo desconectado
   */
  DESCONECTADO = 'DESCONECTADO',

  /**
   * Dispositivo con error
   */
  ERROR = 'ERROR',

  /**
   * Dispositivo en mantenimiento
   */
  MANTENIMIENTO = 'MANTENIMIENTO',

  /**
   * Dispositivo sincronizando datos
   */
  SINCRONIZANDO = 'SINCRONIZANDO',

  /**
   * Dispositivo en configuración
   */
  CONFIGURANDO = 'CONFIGURANDO',

  /**
   * Dispositivo inactivo/pausado
   */
  INACTIVO = 'INACTIVO'
}

/**
 * Descripción de estados
 */
export const DEVICE_STATUS_DESCRIPTIONS = {
  [DeviceStatus.CONECTADO]: 'Conectado',
  [DeviceStatus.DESCONECTADO]: 'Desconectado',
  [DeviceStatus.ERROR]: 'Error',
  [DeviceStatus.MANTENIMIENTO]: 'En Mantenimiento',
  [DeviceStatus.SINCRONIZANDO]: 'Sincronizando',
  [DeviceStatus.CONFIGURANDO]: 'Configurando',
  [DeviceStatus.INACTIVO]: 'Inactivo'
} as const;

/**
 * Estados que permiten operación normal
 */
export const OPERATIONAL_STATUSES: DeviceStatus[] = [
  DeviceStatus.CONECTADO,
  DeviceStatus.SINCRONIZANDO
];

/**
 * Estados que requieren atención
 */
export const ATTENTION_REQUIRED_STATUSES: DeviceStatus[] = [
  DeviceStatus.DESCONECTADO,
  DeviceStatus.ERROR,
  DeviceStatus.MANTENIMIENTO
];

/**
 * Estados temporales
 */
export const TEMPORARY_STATUSES: DeviceStatus[] = [
  DeviceStatus.SINCRONIZANDO,
  DeviceStatus.CONFIGURANDO
];

/**
 * Configuración de colores para UI
 */
export const DEVICE_STATUS_COLORS = {
  [DeviceStatus.CONECTADO]: '#10B981', // Verde
  [DeviceStatus.DESCONECTADO]: '#EF4444', // Rojo
  [DeviceStatus.ERROR]: '#DC2626', // Rojo oscuro
  [DeviceStatus.MANTENIMIENTO]: '#F59E0B', // Amarillo
  [DeviceStatus.SINCRONIZANDO]: '#3B82F6', // Azul
  [DeviceStatus.CONFIGURANDO]: '#8B5CF6', // Púrpura
  [DeviceStatus.INACTIVO]: '#6B7280' // Gris
} as const;

/**
 * Iconos para cada estado
 */
export const DEVICE_STATUS_ICONS = {
  [DeviceStatus.CONECTADO]: 'check-circle',
  [DeviceStatus.DESCONECTADO]: 'x-circle',
  [DeviceStatus.ERROR]: 'alert-circle',
  [DeviceStatus.MANTENIMIENTO]: 'tool',
  [DeviceStatus.SINCRONIZANDO]: 'refresh-cw',
  [DeviceStatus.CONFIGURANDO]: 'settings',
  [DeviceStatus.INACTIVO]: 'pause-circle'
} as const;

/**
 * Prioridad de estados (1 = más crítico)
 */
export const DEVICE_STATUS_PRIORITY = {
  [DeviceStatus.ERROR]: 1,
  [DeviceStatus.DESCONECTADO]: 2,
  [DeviceStatus.MANTENIMIENTO]: 3,
  [DeviceStatus.CONFIGURANDO]: 4,
  [DeviceStatus.SINCRONIZANDO]: 5,
  [DeviceStatus.INACTIVO]: 6,
  [DeviceStatus.CONECTADO]: 7
} as const;

/**
 * Acciones permitidas por estado
 */
export const DEVICE_STATUS_ACTIONS = {
  [DeviceStatus.CONECTADO]: ['sync', 'maintenance', 'configure', 'deactivate'],
  [DeviceStatus.DESCONECTADO]: ['connect', 'maintenance'],
  [DeviceStatus.ERROR]: ['reset', 'maintenance', 'diagnostics'],
  [DeviceStatus.MANTENIMIENTO]: ['complete_maintenance', 'extend_maintenance'],
  [DeviceStatus.SINCRONIZANDO]: ['cancel_sync'],
  [DeviceStatus.CONFIGURANDO]: ['save_config', 'cancel_config'],
  [DeviceStatus.INACTIVO]: ['activate', 'maintenance']
} as const;

/**
 * Obtiene la descripción de un estado
 */
export function getDeviceStatusDescription(status: DeviceStatus): string {
  return DEVICE_STATUS_DESCRIPTIONS[status];
}

/**
 * Obtiene el color de un estado
 */
export function getDeviceStatusColor(status: DeviceStatus): string {
  return DEVICE_STATUS_COLORS[status];
}

/**
 * Obtiene el icono de un estado
 */
export function getDeviceStatusIcon(status: DeviceStatus): string {
  return DEVICE_STATUS_ICONS[status];
}

/**
 * Verifica si un estado permite operación normal
 */
export function isOperational(status: DeviceStatus): boolean {
  return OPERATIONAL_STATUSES.includes(status);
}

/**
 * Verifica si un estado requiere atención
 */
export function requiresAttention(status: DeviceStatus): boolean {
  return ATTENTION_REQUIRED_STATUSES.includes(status);
}

/**
 * Verifica si un estado es temporal
 */
export function isTemporaryStatus(status: DeviceStatus): boolean {
  return TEMPORARY_STATUSES.includes(status);
}

/**
 * Obtiene la prioridad de un estado
 */
export function getStatusPriority(status: DeviceStatus): number {
  return DEVICE_STATUS_PRIORITY[status];
}

/**
 * Obtiene las acciones permitidas para un estado
 */
export function getAllowedActions(status: DeviceStatus): string[] {
  return [...(DEVICE_STATUS_ACTIONS[status] || [])];
}

/**
 * Verifica si una acción está permitida para un estado
 */
export function isActionAllowed(status: DeviceStatus, action: string): boolean {
  return getAllowedActions(status).includes(action);
}

/**
 * Obtiene el siguiente estado recomendado
 */
export function getRecommendedNextStatus(currentStatus: DeviceStatus): DeviceStatus[] {
  switch (currentStatus) {
    case DeviceStatus.DESCONECTADO:
      return [DeviceStatus.CONECTADO, DeviceStatus.MANTENIMIENTO];
    case DeviceStatus.ERROR:
      return [DeviceStatus.CONECTADO, DeviceStatus.MANTENIMIENTO];
    case DeviceStatus.MANTENIMIENTO:
      return [DeviceStatus.CONECTADO];
    case DeviceStatus.SINCRONIZANDO:
      return [DeviceStatus.CONECTADO, DeviceStatus.ERROR];
    case DeviceStatus.CONFIGURANDO:
      return [DeviceStatus.CONECTADO, DeviceStatus.ERROR];
    case DeviceStatus.INACTIVO:
      return [DeviceStatus.CONECTADO, DeviceStatus.MANTENIMIENTO];
    case DeviceStatus.CONECTADO:
      return [DeviceStatus.SINCRONIZANDO, DeviceStatus.CONFIGURANDO, DeviceStatus.MANTENIMIENTO];
    default:
      return [DeviceStatus.CONECTADO];
  }
}

/**
 * Valida transición de estado
 */
export function isValidStatusTransition(from: DeviceStatus, to: DeviceStatus): boolean {
  const allowedTransitions = getRecommendedNextStatus(from);
  return allowedTransitions.includes(to);
}

/**
 * Obtiene mensaje de estado para notificaciones
 */
export function getStatusMessage(status: DeviceStatus, deviceName: string): string {
  switch (status) {
    case DeviceStatus.CONECTADO:
      return `${deviceName} está conectado y funcionando correctamente`;
    case DeviceStatus.DESCONECTADO:
      return `${deviceName} se ha desconectado`;
    case DeviceStatus.ERROR:
      return `${deviceName} tiene un error y requiere atención`;
    case DeviceStatus.MANTENIMIENTO:
      return `${deviceName} está en mantenimiento`;
    case DeviceStatus.SINCRONIZANDO:
      return `${deviceName} está sincronizando datos`;
    case DeviceStatus.CONFIGURANDO:
      return `${deviceName} está siendo configurado`;
    case DeviceStatus.INACTIVO:
      return `${deviceName} está inactivo`;
    default:
      return `${deviceName} tiene estado desconocido`;
  }
}

export default DeviceStatus;