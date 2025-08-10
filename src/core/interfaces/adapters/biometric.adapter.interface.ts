// src/core/interfaces/adapters/biometric.adapter.interface.ts

/**
 * Contrato para adaptadores de dispositivos biométricos
 * Define operaciones para integración con dispositivos FACEID 360
 */
export interface IBiometricAdapter {
  /**
   * Conectar al dispositivo biométrico
   */
  connect(deviceConfig: {
    ipAddress: string;
    port: number;
    timeout?: number;
  }): Promise<{
    success: boolean;
    deviceInfo?: {
      model: string;
      serialNumber: string;
      firmwareVersion: string;
    };
    error?: string;
  }>;

  /**
   * Desconectar del dispositivo
   */
  disconnect(): Promise<void>;

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean;

  /**
   * Obtener información del dispositivo
   */
  getDeviceInfo(): Promise<{
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    totalUsers: number;
    totalRecords: number;
    freeMemory: number;
    usedMemory: number;
    deviceTime: Date;
  }>;

  /**
   * Sincronizar tiempo del dispositivo
   */
  syncTime(time?: Date): Promise<{
    success: boolean;
    oldTime: Date;
    newTime: Date;
    error?: string;
  }>;

  /**
   * Obtener registros de asistencia desde el dispositivo
   */
  getAttendanceRecords(since?: Date): Promise<Array<{
    userId: number;
    timestamp: Date;
    verificationType: number;
    status: number;
    workCode: number;
  }>>;

  /**
   * Agregar usuario al dispositivo
   */
  addUser(user: {
    userId: number;
    name: string;
    privilege: number;
    enabled: boolean;
    fingerTemplates?: Buffer[];
    faceTemplate?: Buffer;
  }): Promise<{
    success: boolean;
    userId: number;
    error?: string;
  }>;

  /**
   * Actualizar usuario en el dispositivo
   */
  updateUser(userId: number, updates: {
    name?: string;
    privilege?: number;
    enabled?: boolean;
  }): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Eliminar usuario del dispositivo
   */
  deleteUser(userId: number): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Obtener lista de usuarios en el dispositivo
   */
  getUsers(): Promise<Array<{
    userId: number;
    name: string;
    privilege: number;
    enabled: boolean;
    hasFingerprint: boolean;
    hasFace: boolean;
  }>>;

  /**
   * Limpiar datos del dispositivo
   */
  clearData(dataType: 'users' | 'records' | 'all'): Promise<{
    success: boolean;
    deletedRecords: number;
    error?: string;
  }>;

  /**
   * Reiniciar dispositivo
   */
  restart(): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Configurar parámetros del dispositivo
   */
  setParameters(params: {
    volume?: number;
    language?: string;
    sleepTime?: number;
    lockTime?: number;
  }): Promise<{
    success: boolean;
    appliedParams: string[];
    error?: string;
  }>;

  /**
   * Obtener parámetros del dispositivo
   */
  getParameters(): Promise<{
    volume: number;
    language: string;
    sleepTime: number;
    lockTime: number;
    [key: string]: any;
  }>;

  /**
   * Habilitar/deshabilitar notificaciones en tiempo real
   */
  enableRealTimeEvents(enable: boolean): Promise<{
    success: boolean;
    error?: string;
  }>;

  /**
   * Escuchar eventos en tiempo real
   */
  onRealTimeEvent(callback: (event: {
    type: 'attendance' | 'alarm' | 'user_verification';
    userId?: number;
    timestamp: Date;
    status: number;
    data?: any;
  }) => void): void;

  /**
   * Actualizar firmware del dispositivo
   */
  updateFirmware(firmwareBuffer: Buffer): Promise<{
    success: boolean;
    progress?: number;
    error?: string;
  }>;

  /**
   * Hacer backup de la configuración
   */
  backupConfiguration(): Promise<{
    success: boolean;
    configData: Buffer;
    error?: string;
  }>;

  /**
   * Restaurar configuración desde backup
   */
  restoreConfiguration(configData: Buffer): Promise<{
    success: boolean;
    error?: string;
  }>;
}

