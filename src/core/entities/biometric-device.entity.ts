/**
 * BIOMETRIC DEVICE ENTITY
 * Entidad de dispositivo biométrico FACEID 360
 * Maneja configuración y estado de dispositivos
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { DeviceStatus } from '@core/enums/device-status.enum';
import { validateRequired, validateIP, validatePort } from '@shared/utils/validation.util';

/**
 * Datos para crear un dispositivo biométrico
 */
export interface ICreateBiometricDeviceData extends ICreateBaseEntityData {
  nombre: string;
  sucursalId: string;
  ip: string;
  puerto: number;
  modelo: string;
  numeroSerie?: string;
  firmwareVersion?: string; // Cambiado de 'version' para evitar conflicto
  estado: DeviceStatus;
  ubicacionFisica?: string;
  configuracion?: IDeviceConfiguration;
}

/**
 * Datos para actualizar un dispositivo biométrico
 */
export interface IUpdateBiometricDeviceData extends IUpdateBaseEntityData {
  nombre?: string;
  ip?: string;
  puerto?: number;
  modelo?: string;
  numeroSerie?: string;
  firmwareVersion?: string; // Cambiado de 'version' para evitar conflicto
  estado?: DeviceStatus;
  ubicacionFisica?: string;
  configuracion?: IDeviceConfiguration;
  ultimaConexion?: Date;
  ultimaSincronizacion?: Date;
  ultimoError?: string;
}

/**
 * Configuración específica del dispositivo
 */
export interface IDeviceConfiguration {
  timeoutConexion: number;
  timeoutRequest: number;
  intentosReconexion: number;
  intervaloSincronizacion: number;
  modoDebug: boolean;
  compresionDatos: boolean;
  nivelConfianza: number;
  capacidadUsuarios: number;
  capacidadRegistros: number;
}

/**
 * Estadísticas del dispositivo
 */
export interface IDeviceStats {
  totalUsuarios: number;
  totalRegistros: number;
  registrosHoy: number;
  ultimoRegistro?: Date;
  uptimeHoras: number;
  errorCount: number;
  memoriaUsada: number;
  almacenamientoUsado: number;
  temperaturaOperacion?: number;
}

/**
 * Información de conectividad
 */
export interface IConnectionInfo {
  estaConectado: boolean;
  ultimaConexion?: Date;
  ultimaDesconexion?: Date;
  intentosConexion: number;
  ultimoError?: string;
  tiempoRespuesta?: number;
  estadoRed: 'GOOD' | 'FAIR' | 'POOR' | 'NO_CONNECTION';
}

/**
 * Resultado de operación del dispositivo
 */
export interface IDeviceOperationResult {
  exito: boolean;
  mensaje: string;
  tiempoEjecucion: number;
  datos?: any;
  error?: string;
}

export class BiometricDevice extends BaseEntity {
  private _nombre: string;
  private _sucursalId: string;
  private _ip: string;
  private _puerto: number;
  private _modelo: string;
  private _numeroSerie?: string;
  private _firmwareVersion?: string; // Cambiado de '_version' para evitar conflicto
  private _estado: DeviceStatus;
  private _ubicacionFisica?: string;
  private _configuracion: IDeviceConfiguration;
  private _ultimaConexion?: Date;
  private _ultimaSincronizacion?: Date;
  private _ultimoError?: string;

  constructor(data: ICreateBiometricDeviceData) {
    super(data);

    this._nombre = data.nombre.trim();
    this._sucursalId = data.sucursalId;
    this._ip = data.ip.trim();
    this._puerto = data.puerto;
    this._modelo = data.modelo.trim();
    this._numeroSerie = data.numeroSerie?.trim();
    this._firmwareVersion = data.firmwareVersion?.trim(); // Cambiado de '_version'
    this._estado = data.estado;
    this._ubicacionFisica = data.ubicacionFisica?.trim();
    this._configuracion = data.configuracion || this.getDefaultConfiguration();
  }

  /**
   * Obtiene el nombre del dispositivo
   */
  get nombre(): string {
    return this._nombre;
  }

  /**
   * Obtiene el ID de la sucursal
   */
  get sucursalId(): string {
    return this._sucursalId;
  }

  /**
   * Obtiene la dirección IP
   */
  get ip(): string {
    return this._ip;
  }

  /**
   * Obtiene el puerto de conexión
   */
  get puerto(): number {
    return this._puerto;
  }

  /**
   * Obtiene la dirección completa de conexión
   */
  get direccionConexion(): string {
    return `${this._ip}:${this._puerto}`;
  }

  /**
   * Obtiene el modelo del dispositivo
   */
  get modelo(): string {
    return this._modelo;
  }

  /**
   * Obtiene el número de serie
   */
  get numeroSerie(): string | undefined {
    return this._numeroSerie;
  }

  /**
   * Obtiene la versión del firmware
   */
  get firmwareVersion(): string | undefined {
    return this._firmwareVersion;
  }

  /**
   * Obtiene el estado actual
   */
  get estado(): DeviceStatus {
    return this._estado;
  }

  /**
   * Obtiene la ubicación física
   */
  get ubicacionFisica(): string | undefined {
    return this._ubicacionFisica;
  }

  /**
   * Obtiene la configuración del dispositivo
   */
  get configuracion(): IDeviceConfiguration {
    return { ...this._configuracion };
  }

  /**
   * Obtiene la fecha de última conexión
   */
  get ultimaConexion(): Date | undefined {
    return this._ultimaConexion ? new Date(this._ultimaConexion) : undefined;
  }

  /**
   * Obtiene la fecha de última sincronización
   */
  get ultimaSincronizacion(): Date | undefined {
    return this._ultimaSincronizacion ? new Date(this._ultimaSincronizacion) : undefined;
  }

  /**
   * Obtiene el último error registrado
   */
  get ultimoError(): string | undefined {
    return this._ultimoError;
  }

  /**
   * Verifica si está conectado
   */
  get estaConectado(): boolean {
    return this._estado === DeviceStatus.CONECTADO || this._estado === DeviceStatus.SINCRONIZANDO;
  }

  /**
   * Verifica si está operativo
   */
  get estaOperativo(): boolean {
    return this.estaConectado && this.isActive;
  }

  /**
   * Verifica si requiere atención
   */
  get requiereAtencion(): boolean {
    return this._estado === DeviceStatus.ERROR || 
           this._estado === DeviceStatus.DESCONECTADO ||
           this._estado === DeviceStatus.MANTENIMIENTO;
  }

  /**
   * Calcula minutos desde última conexión
   */
  get minutosSinConexion(): number | undefined {
    if (!this._ultimaConexion) return undefined;
    
    const ahora = new Date();
    const diffMs = ahora.getTime() - this._ultimaConexion.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Calcula minutos desde última sincronización
   */
  get minutosSinSincronizacion(): number | undefined {
    if (!this._ultimaSincronizacion) return undefined;
    
    const ahora = new Date();
    const diffMs = ahora.getTime() - this._ultimaSincronizacion.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Verifica si la sincronización está atrasada
   */
  get sincronizacionAtrasada(): boolean {
    if (!this._ultimaSincronizacion) return true;
    
    const minutosAtraso = this.minutosSinSincronizacion || 0;
    return minutosAtraso > this._configuracion.intervaloSincronizacion / (1000 * 60) * 2;
  }

  /**
   * Actualiza información del dispositivo
   */
  update(data: IUpdateBiometricDeviceData): void {
    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) {
        throw new Error('Nombre del dispositivo es requerido');
      }
      this._nombre = data.nombre.trim();
    }

    if (data.ip !== undefined) {
      const ipValidation = validateIP(data.ip);
      if (!ipValidation.isValid) {
        throw new Error(`IP inválida: ${ipValidation.errors.join(', ')}`);
      }
      this._ip = data.ip.trim();
    }

    if (data.puerto !== undefined) {
      const puertoValidation = validatePort(data.puerto);
      if (!puertoValidation.isValid) {
        throw new Error(`Puerto inválido: ${puertoValidation.errors.join(', ')}`);
      }
      this._puerto = data.puerto;
    }

    if (data.modelo !== undefined) {
      this._modelo = data.modelo.trim();
    }

    if (data.numeroSerie !== undefined) {
      this._numeroSerie = data.numeroSerie?.trim();
    }

    if (data.firmwareVersion !== undefined) {
      this._firmwareVersion = data.firmwareVersion?.trim();
    }

    if (data.estado !== undefined) {
      this._estado = data.estado;
    }

    if (data.ubicacionFisica !== undefined) {
      this._ubicacionFisica = data.ubicacionFisica?.trim();
    }

    if (data.configuracion !== undefined) {
      this._configuracion = { ...data.configuracion };
    }

    if (data.ultimaConexion !== undefined) {
      this._ultimaConexion = data.ultimaConexion;
    }

    if (data.ultimaSincronizacion !== undefined) {
      this._ultimaSincronizacion = data.ultimaSincronizacion;
    }

    if (data.ultimoError !== undefined) {
      this._ultimoError = data.ultimoError;
    }

    this.updateEntity(data);
  }

  /**
   * Cambia el estado del dispositivo
   */
  changeStatus(nuevoEstado: DeviceStatus, mensaje?: string): void {
    const estadoAnterior = this._estado;
    this._estado = nuevoEstado;

    // Actualizar timestamps según el estado
    const ahora = new Date();
    
    if (nuevoEstado === DeviceStatus.CONECTADO) {
      this._ultimaConexion = ahora;
      this._ultimoError = undefined;
    } else if (nuevoEstado === DeviceStatus.ERROR && mensaje) {
      this._ultimoError = mensaje;
    }

    this.touch();
  }

  /**
   * Registra una conexión exitosa
   */
  recordConnection(): void {
    this._ultimaConexion = new Date();
    this._ultimoError = undefined;
    
    if (this._estado !== DeviceStatus.CONECTADO) {
      this._estado = DeviceStatus.CONECTADO;
    }
    
    this.touch();
  }

  /**
   * Registra una sincronización exitosa
   */
  recordSyncronization(): void {
    this._ultimaSincronizacion = new Date();
    this.touch();
  }

  /**
   * Registra un error
   */
  recordError(error: string): void {
    this._ultimoError = error;
    this._estado = DeviceStatus.ERROR;
    this.touch();
  }

  /**
   * Actualiza la configuración
   */
  updateConfiguration(config: Partial<IDeviceConfiguration>): void {
    this._configuracion = {
      ...this._configuracion,
      ...config
    };
    this.touch();
  }

  /**
   * Resetea el dispositivo
   */
  reset(): void {
    this._estado = DeviceStatus.DESCONECTADO;
    this._ultimoError = undefined;
    this.touch();
  }

  /**
   * Pone el dispositivo en mantenimiento
   */
  setMaintenance(motivo?: string): void {
    this._estado = DeviceStatus.MANTENIMIENTO;
    if (motivo) {
      this._ultimoError = `Mantenimiento: ${motivo}`;
    }
    this.touch();
  }

  /**
   * Saca el dispositivo de mantenimiento
   */
  endMaintenance(): void {
    this._estado = DeviceStatus.DESCONECTADO;
    this._ultimoError = undefined;
    this.touch();
  }

  /**
   * Obtiene información de conectividad
   */
  getConnectionInfo(): IConnectionInfo {
    const minutosSinConexion = this.minutosSinConexion || 0;
    
    let estadoRed: 'GOOD' | 'FAIR' | 'POOR' | 'NO_CONNECTION';
    if (!this.estaConectado) {
      estadoRed = 'NO_CONNECTION';
    } else if (minutosSinConexion < 5) {
      estadoRed = 'GOOD';
    } else if (minutosSinConexion < 15) {
      estadoRed = 'FAIR';
    } else {
      estadoRed = 'POOR';
    }

    return {
      estaConectado: this.estaConectado,
      ultimaConexion: this.ultimaConexion,
      ultimaDesconexion: undefined, // Se calcularía con logs
      intentosConexion: 0, // Se obtendría de logs
      ultimoError: this._ultimoError,
      tiempoRespuesta: undefined, // Se mediría en tiempo real
      estadoRed
    };
  }

  /**
   * Obtiene la configuración por defecto
   */
  private getDefaultConfiguration(): IDeviceConfiguration {
    return {
      timeoutConexion: 10000, // 10 segundos
      timeoutRequest: 30000,  // 30 segundos
      intentosReconexion: 3,
      intervaloSincronizacion: 300000, // 5 minutos
      modoDebug: false,
      compresionDatos: true,
      nivelConfianza: 75,
      capacidadUsuarios: 3000,
      capacidadRegistros: 100000
    };
  }

  /**
   * Valida la configuración
   */
  private validateConfiguration(config: IDeviceConfiguration): void {
    if (config.timeoutConexion < 1000 || config.timeoutConexion > 60000) {
      throw new Error('Timeout de conexión debe estar entre 1 y 60 segundos');
    }

    if (config.timeoutRequest < 5000 || config.timeoutRequest > 300000) {
      throw new Error('Timeout de request debe estar entre 5 segundos y 5 minutos');
    }

    if (config.intentosReconexion < 1 || config.intentosReconexion > 10) {
      throw new Error('Intentos de reconexión debe estar entre 1 y 10');
    }

    if (config.intervaloSincronizacion < 60000 || config.intervaloSincronizacion > 3600000) {
      throw new Error('Intervalo de sincronización debe estar entre 1 minuto y 1 hora');
    }

    if (config.nivelConfianza < 1 || config.nivelConfianza > 100) {
      throw new Error('Nivel de confianza debe estar entre 1 y 100');
    }
  }

  /**
   * Obtiene un resumen del dispositivo
   */
  getSummary(): string {
    const estado = this._estado;
    const conexion = this.estaConectado ? 'Conectado' : 'Desconectado';
    const ubicacion = this._ubicacionFisica ? ` (${this._ubicacionFisica})` : '';
    
    return `${this._nombre} - ${this.direccionConexion} - ${estado} (${conexion})${ubicacion}`;
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    // Validar nombre
    const nombreValidation = validateRequired(this._nombre, 'Nombre del dispositivo');
    if (!nombreValidation.isValid) {
      throw new Error(nombreValidation.errors[0]);
    }

    // Validar sucursal ID
    const sucursalValidation = validateRequired(this._sucursalId, 'ID de sucursal');
    if (!sucursalValidation.isValid) {
      throw new Error(sucursalValidation.errors[0]);
    }

    // Validar IP
    const ipValidation = validateIP(this._ip);
    if (!ipValidation.isValid) {
      throw new Error(`IP inválida: ${ipValidation.errors.join(', ')}`);
    }

    // Validar puerto
    const puertoValidation = validatePort(this._puerto);
    if (!puertoValidation.isValid) {
      throw new Error(`Puerto inválido: ${puertoValidation.errors.join(', ')}`);
    }

    // Validar modelo
    const modeloValidation = validateRequired(this._modelo, 'Modelo del dispositivo');
    if (!modeloValidation.isValid) {
      throw new Error(modeloValidation.errors[0]);
    }

    // Validar estado
    if (!Object.values(DeviceStatus).includes(this._estado)) {
      throw new Error('Estado del dispositivo inválido');
    }

    // Validar configuración
    this.validateConfiguration(this._configuracion);
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      ...this.toBaseObject(),
      nombre: this._nombre,
      sucursalId: this._sucursalId,
      ip: this._ip,
      puerto: this._puerto,
      direccionConexion: this.direccionConexion,
      modelo: this._modelo,
      numeroSerie: this._numeroSerie,
      firmwareVersion: this._firmwareVersion,
      estado: this._estado,
      ubicacionFisica: this._ubicacionFisica,
      configuracion: this._configuracion,
      ultimaConexion: this._ultimaConexion,
      ultimaSincronizacion: this._ultimaSincronizacion,
      ultimoError: this._ultimoError,
      estaConectado: this.estaConectado,
      estaOperativo: this.estaOperativo,
      requiereAtencion: this.requiereAtencion,
      minutosSinConexion: this.minutosSinConexion,
      minutosSinSincronizacion: this.minutosSinSincronizacion,
      sincronizacionAtrasada: this.sincronizacionAtrasada,
      connectionInfo: this.getConnectionInfo()
    };
  }

  /**
   * Crea una copia superficial
   */
  protected shallowCopy(): BiometricDevice {
    const data: ICreateBiometricDeviceData = {
      ...this.cloneBaseData(),
      nombre: this._nombre,
      sucursalId: this._sucursalId,
      ip: this._ip,
      puerto: this._puerto,
      modelo: this._modelo,
      numeroSerie: this._numeroSerie,
      firmwareVersion: this._firmwareVersion,
      estado: this._estado,
      ubicacionFisica: this._ubicacionFisica,
      configuracion: { ...this._configuracion }
    };

    const copy = new BiometricDevice(data);
    copy._ultimaConexion = this._ultimaConexion;
    copy._ultimaSincronizacion = this._ultimaSincronizacion;
    copy._ultimoError = this._ultimoError;
    
    return copy;
  }

  /**
   * Crea un dispositivo FACEID 360
   */
  static createFaceID360(
    nombre: string,
    sucursalId: string,
    ip: string,
    puerto: number = 4370,
    ubicacionFisica?: string
  ): BiometricDevice {
    return new BiometricDevice({
      nombre,
      sucursalId,
      ip,
      puerto,
      modelo: 'FACEID 360',
      estado: DeviceStatus.DESCONECTADO,
      ubicacionFisica
    });
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateBiometricDeviceData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar campos requeridos
    const nombreValidation = validateRequired(data.nombre, 'Nombre del dispositivo');
    if (!nombreValidation.isValid) {
      errors.push(...nombreValidation.errors);
    }

    const sucursalValidation = validateRequired(data.sucursalId, 'ID de sucursal');
    if (!sucursalValidation.isValid) {
      errors.push(...sucursalValidation.errors);
    }

    const modeloValidation = validateRequired(data.modelo, 'Modelo del dispositivo');
    if (!modeloValidation.isValid) {
      errors.push(...modeloValidation.errors);
    }

    // Validar IP
    const ipValidation = validateIP(data.ip);
    if (!ipValidation.isValid) {
      errors.push(...ipValidation.errors);
    }

    // Validar puerto
    const puertoValidation = validatePort(data.puerto);
    if (!puertoValidation.isValid) {
      errors.push(...puertoValidation.errors);
    }

    // Validar estado
    if (!Object.values(DeviceStatus).includes(data.estado)) {
      errors.push('Estado del dispositivo inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BiometricDevice;