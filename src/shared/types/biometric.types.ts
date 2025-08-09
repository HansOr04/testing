/**
 * TIPOS BIOMÉTRICOS
 * Interfaces y tipos para integración con dispositivos FACEID 360
 * y manejo de datos biométricos
 */

// Información del dispositivo biométrico
export interface IBiometricDevice {
  id: string;
  nombre: string;
  ip: string;
  puerto: number;
  sucursalId: string;
  modelo: string;
  version: string;
  estado: DeviceStatus;
  ultimaConexion?: Date;
  ultimaSincronizacion?: Date;
  configuracion: IDeviceConfig;
}

// Estados del dispositivo
export enum DeviceStatus {
  CONECTADO = 'CONECTADO',
  DESCONECTADO = 'DESCONECTADO',
  ERROR = 'ERROR',
  MANTENIMIENTO = 'MANTENIMIENTO',
  SINCRONIZANDO = 'SINCRONIZANDO'
}

// Configuración del dispositivo
export interface IDeviceConfig {
  timeoutConexion: number;
  timeoutRequest: number;
  intentosReconexion: number;
  intervaloSincronizacion: number;
  modoDebug: boolean;
  compresionDatos: boolean;
}

// Registro biométrico crudo del dispositivo
export interface IBiometricRecord {
  deviceId: string;
  employeeId: string;
  cedula: string;
  timestamp: Date;
  verificationType: VerificationType;
  workCode: WorkCode;
  deviceTimestamp: string;
  photoPath?: string;
  confidence?: number;
  rawData?: any;
}

// Tipo de verificación biométrica
export enum VerificationType {
  FACE = 'FACE',
  FINGERPRINT = 'FINGERPRINT',
  CARD = 'CARD',
  PASSWORD = 'PASSWORD',
  COMBINED = 'COMBINED'
}

// Códigos de trabajo (entrada/salida)
export enum WorkCode {
  ENTRADA = '0',
  SALIDA = '1',
  INICIO_DESCANSO = '2',
  FIN_DESCANSO = '3',
  INICIO_ALMUERZO = '4',
  FIN_ALMUERZO = '5'
}

// Log de movimientos procesados
export interface IBiometricLog {
  id: string;
  deviceId: string;
  employeeId: string;
  fecha: Date;
  hora: string;
  tipoMovimiento: WorkCode;
  tipoVerificacion: VerificationType;
  esProcesado: boolean;
  esEfectivoParaCalculo: boolean;
  observaciones?: string;
  creadoEn: Date;
}

// Resultado de sincronización
export interface ISyncResult {
  deviceId: string;
  success: boolean;
  recordsFound: number;
  recordsProcessed: number;
  recordsSkipped: number;
  errors: string[];
  warnings: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

// Estado de sincronización
export interface ISyncStatus {
  isRunning: boolean;
  deviceId?: string;
  progress: number;
  currentStep: string;
  totalSteps: number;
  startedAt?: Date;
  estimatedCompletion?: Date;
}

// Configuración de sincronización
export interface ISyncConfig {
  autoSync: boolean;
  interval: number; // milisegundos
  batchSize: number;
  maxRetries: number;
  parallelDevices: boolean;
  syncOnStartup: boolean;
}

// Datos del empleado para sincronizar con dispositivo
export interface IEmployeeBiometricData {
  userId: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  sucursalId: string;
  tipoEmpleado: string;
  isActive: boolean;
  faceTemplate?: string;
  fingerprintTemplate?: string;
}

// Estadísticas del dispositivo
export interface IDeviceStats {
  totalUsers: number;
  totalRecords: number;
  todayRecords: number;
  lastSyncTime?: Date;
  uptimeHours: number;
  errorCount: number;
  memoryUsage: number;
  storageUsage: number;
}

// Evento del dispositivo
export interface IDeviceEvent {
  id: string;
  deviceId: string;
  type: DeviceEventType;
  message: string;
  severity: EventSeverity;
  timestamp: Date;
  metadata?: any;
}

// Tipos de eventos del dispositivo
export enum DeviceEventType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  SYNC_STARTED = 'SYNC_STARTED',
  SYNC_COMPLETED = 'SYNC_COMPLETED',
  SYNC_FAILED = 'SYNC_FAILED',
  USER_ADDED = 'USER_ADDED',
  USER_REMOVED = 'USER_REMOVED',
  ATTENDANCE_RECORDED = 'ATTENDANCE_RECORDED',
  DEVICE_ERROR = 'DEVICE_ERROR',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

// Severidad del evento
export enum EventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Comando para dispositivo
export interface IDeviceCommand {
  command: DeviceCommandType;
  params?: any;
  timeout?: number;
}

// Tipos de comandos
export enum DeviceCommandType {
  GET_TIME = 'GET_TIME',
  SET_TIME = 'SET_TIME',
  GET_DEVICE_INFO = 'GET_DEVICE_INFO',
  GET_USERS = 'GET_USERS',
  ADD_USER = 'ADD_USER',
  DELETE_USER = 'DELETE_USER',
  GET_ATTENDANCE = 'GET_ATTENDANCE',
  CLEAR_ATTENDANCE = 'CLEAR_ATTENDANCE',
  RESTART_DEVICE = 'RESTART_DEVICE',
  ENABLE_DEVICE = 'ENABLE_DEVICE',
  DISABLE_DEVICE = 'DISABLE_DEVICE'
}

// Respuesta del dispositivo
export interface IDeviceResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

// Configuración de red del dispositivo
export interface INetworkConfig {
  ip: string;
  mask: string;
  gateway: string;
  dns1?: string;
  dns2?: string;
  dhcp: boolean;
}

// Información de conexión del dispositivo
export interface IConnectionInfo {
  isConnected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  connectionAttempts: number;
  lastError?: string;
  responseTime?: number;
}

// Filtros para consultas biométricas
export interface IBiometricFilters {
  deviceId?: string;
  employeeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  workCode?: WorkCode;
  processed?: boolean;
  effective?: boolean;
}

// Configuración de procesamiento de movimientos administrativos
export interface IAdministrativeProcessingConfig {
  enabled: boolean;
  considerAllMovements: boolean;
  minimumHoursPerDay: number;
  maximumHoursPerDay: number;
  effectiveHoursCalculation: 'FIRST_LAST' | 'ALL_MOVEMENTS';
  ignoreWeekends: boolean;
  holidayCalendarId?: string;
}

// Auditoria de movimientos biométricos
export interface IBiometricAudit {
  id: string;
  action: string;
  deviceId: string;
  employeeId?: string;
  oldValue?: any;
  newValue?: any;
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

