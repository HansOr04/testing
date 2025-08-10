/**
 * BIOMETRIC LOG ENTITY
 * Entidad de registro biométrico del sistema de asistencia
 * Maneja los logs de movimientos de dispositivos biométricos FACEID 360
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { WorkCode } from '@core/enums/work-code.enum';
import { VerificationType } from '@shared/types/biometric.types';
import { validateRequired, validateTextLength } from '@shared/utils/validation.util';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

/**
 * Datos para crear un log biométrico
 */
export interface ICreateBiometricLogData extends ICreateBaseEntityData {
  deviceId: string;
  employeeId: string;
  fecha: Date;
  hora: string;
  tipoMovimiento: WorkCode;
  tipoVerificacion: VerificationType;
  esProcesado?: boolean;
  esEfectivoParaCalculo?: boolean;
  observaciones?: string;
  confianza?: number;
  datosOriginales?: any;
  ubicacionDispositivo?: string;
  intentosFallidos?: number;
  tiempoRespuesta?: number;
}

/**
 * Datos para actualizar un log biométrico
 */
export interface IUpdateBiometricLogData extends IUpdateBaseEntityData {
  esProcesado?: boolean;
  esEfectivoParaCalculo?: boolean;
  observaciones?: string;
  confianza?: number;
  intentosFallidos?: number;
}

/**
 * Información del dispositivo para el log
 */
export interface IDeviceInfo {
  deviceId: string;
  nombre: string;
  modelo: string;
  sucursalId: string;
  ubicacionFisica: string;
  ip: string;
  puerto: number;
}

/**
 * Contexto del movimiento biométrico
 */
export interface IMovementContext {
  employeeId: string;
  tipoEmpleado: string;
  sucursalAsignada: string;
  horarioEsperado?: {
    entrada: string;
    salida: string;
  };
  esHorarioLaboral: boolean;
  esDiaLaboral: boolean;
}

/**
 * Estadísticas del log biométrico
 */
export interface IBiometricLogStats {
  totalMovimientos: number;
  movimientosProcesados: number;
  movimientosEfectivos: number;
  movimientosDescartados: number;
  confianzaPromedio: number;
  tiempoRespuestaPromedio: number;
  dispositivosUnicos: number;
  empleadosUnicos: number;
  fechaInicioRango: Date;
  fechaFinRango: Date;
}

/**
 * Resultado de procesamiento del log
 */
export interface IProcessingResult {
  wasProcessed: boolean;
  isEffective: boolean;
  calculatedHours?: number;
  conflicts: string[];
  warnings: string[];
  nextExpectedMovement?: WorkCode;
  processingTime: number;
}

export class BiometricLog extends BaseEntity {
  private _deviceId: string;
  private _employeeId: string;
  private _fecha: Date;
  private _hora: string;
  private _tipoMovimiento: WorkCode;
  private _tipoVerificacion: VerificationType;
  private _esProcesado: boolean;
  private _esEfectivoParaCalculo: boolean;
  private _observaciones?: string;
  private _confianza: number;
  private _datosOriginales?: any;
  private _ubicacionDispositivo?: string;
  private _intentosFallidos: number;
  private _tiempoRespuesta?: number;

  constructor(data: ICreateBiometricLogData) {
    super(data);
    
    this._deviceId = data.deviceId;
    this._employeeId = data.employeeId;
    this._fecha = new Date(data.fecha);
    this._hora = data.hora;
    this._tipoMovimiento = data.tipoMovimiento;
    this._tipoVerificacion = data.tipoVerificacion;
    this._esProcesado = data.esProcesado ?? false;
    this._esEfectivoParaCalculo = data.esEfectivoParaCalculo ?? false;
    this._observaciones = data.observaciones;
    this._confianza = data.confianza ?? 100;
    this._datosOriginales = data.datosOriginales;
    this._ubicacionDispositivo = data.ubicacionDispositivo;
    this._intentosFallidos = data.intentosFallidos ?? 0;
    this._tiempoRespuesta = data.tiempoRespuesta;

    logger.info(`BiometricLog creado para empleado ${this._employeeId} en dispositivo ${this._deviceId}`);
  }

  /**
   * Obtiene el ID del dispositivo
   */
  get deviceId(): string {
    return this._deviceId;
  }

  /**
   * Obtiene el ID del empleado
   */
  get employeeId(): string {
    return this._employeeId;
  }

  /**
   * Obtiene la fecha del movimiento
   */
  get fecha(): Date {
    return new Date(this._fecha);
  }

  /**
   * Obtiene la hora del movimiento
   */
  get hora(): string {
    return this._hora;
  }

  /**
   * Obtiene el tipo de movimiento
   */
  get tipoMovimiento(): WorkCode {
    return this._tipoMovimiento;
  }

  /**
   * Obtiene el tipo de verificación
   */
  get tipoVerificacion(): VerificationType {
    return this._tipoVerificacion;
  }

  /**
   * Verifica si el log ha sido procesado
   */
  get esProcesado(): boolean {
    return this._esProcesado;
  }

  /**
   * Verifica si es efectivo para el cálculo de horas
   */
  get esEfectivoParaCalculo(): boolean {
    return this._esEfectivoParaCalculo;
  }

  /**
   * Obtiene las observaciones
   */
  get observaciones(): string | undefined {
    return this._observaciones;
  }

  /**
   * Obtiene el nivel de confianza del reconocimiento
   */
  get confianza(): number {
    return this._confianza;
  }

  /**
   * Obtiene los datos originales del dispositivo
   */
  get datosOriginales(): any {
    return this._datosOriginales ? { ...this._datosOriginales } : undefined;
  }

  /**
   * Obtiene la ubicación del dispositivo
   */
  get ubicacionDispositivo(): string | undefined {
    return this._ubicacionDispositivo;
  }

  /**
   * Obtiene el número de intentos fallidos
   */
  get intentosFallidos(): number {
    return this._intentosFallidos;
  }

  /**
   * Obtiene el tiempo de respuesta del dispositivo
   */
  get tiempoRespuesta(): number | undefined {
    return this._tiempoRespuesta;
  }

  /**
   * Obtiene la fecha y hora completa del movimiento
   */
  get fechaHoraCompleta(): Date {
    const [hours, minutes, seconds] = this._hora.split(':').map(Number);
    const fechaCompleta = new Date(this._fecha);
    fechaCompleta.setHours(hours, minutes, seconds || 0, 0);
    return fechaCompleta;
  }

  /**
   * Verifica si es un movimiento de entrada
   */
  get esEntrada(): boolean {
    return this._tipoMovimiento === WorkCode.ENTRADA;
  }

  /**
   * Verifica si es un movimiento de salida
   */
  get esSalida(): boolean {
    return this._tipoMovimiento === WorkCode.SALIDA;
  }

  /**
   * Verifica si es un movimiento de descanso
   */
  get esDescanso(): boolean {
    return [WorkCode.INICIO_DESCANSO, WorkCode.FIN_DESCANSO].includes(this._tipoMovimiento);
  }

  /**
   * Verifica si es un movimiento de almuerzo
   */
  get esAlmuerzo(): boolean {
    return [WorkCode.INICIO_ALMUERZO, WorkCode.FIN_ALMUERZO].includes(this._tipoMovimiento);
  }

  /**
   * Verifica si el reconocimiento es confiable
   */
  get esConfiable(): boolean {
    return this._confianza >= 85; // Umbral de confianza del 85%
  }

  /**
   * Verifica si es un log de alta prioridad para procesamiento
   */
  get esAltaPrioridad(): boolean {
    return (this.esEntrada || this.esSalida) && this.esConfiable && !this._esProcesado;
  }

  /**
   * Obtiene una descripción legible del tipo de movimiento
   */
  get descripcionMovimiento(): string {
    const descripciones = {
      [WorkCode.ENTRADA]: 'Entrada',
      [WorkCode.SALIDA]: 'Salida',
      [WorkCode.INICIO_DESCANSO]: 'Inicio de Descanso',
      [WorkCode.FIN_DESCANSO]: 'Fin de Descanso',
      [WorkCode.INICIO_ALMUERZO]: 'Inicio de Almuerzo',
      [WorkCode.FIN_ALMUERZO]: 'Fin de Almuerzo'
    };
    return descripciones[this._tipoMovimiento] || 'Movimiento Desconocido';
  }

  /**
   * Obtiene información del dispositivo
   */
  getDeviceInfo(): IDeviceInfo | null {
    if (!this._datosOriginales?.deviceInfo) {
      return null;
    }

    return {
      deviceId: this._deviceId,
      nombre: this._datosOriginales.deviceInfo.nombre || 'FACEID-360',
      modelo: this._datosOriginales.deviceInfo.modelo || 'FACEID 360',
      sucursalId: this._datosOriginales.deviceInfo.sucursalId || '',
      ubicacionFisica: this._ubicacionDispositivo || 'No especificada',
      ip: this._datosOriginales.deviceInfo.ip || '',
      puerto: this._datosOriginales.deviceInfo.puerto || 4370
    };
  }

  /**
   * Marca el log como procesado
   */
  markAsProcessed(observaciones?: string): void {
    this._esProcesado = true;
    this._observaciones = observaciones || this._observaciones;
    this.updateEntity({ updatedAt: new Date() });
    
    logger.info(`BiometricLog ${this.id} marcado como procesado para empleado ${this._employeeId}`);
  }

  /**
   * Marca el log como efectivo para cálculo
   */
  markAsEffective(observaciones?: string): void {
    this._esEfectivoParaCalculo = true;
    this._esProcesado = true;
    this._observaciones = observaciones || this._observaciones;
    this.updateEntity({ updatedAt: new Date() });
    
    logger.info(`BiometricLog ${this.id} marcado como efectivo para empleado ${this._employeeId}`);
  }

  /**
   * Marca el log como no efectivo para cálculo
   */
  markAsNonEffective(razon: string): void {
    this._esEfectivoParaCalculo = false;
    this._esProcesado = true;
    this._observaciones = razon;
    this.updateEntity({ updatedAt: new Date() });
    
    logger.warn(`BiometricLog ${this.id} marcado como no efectivo: ${razon}`);
  }

  /**
   * Actualiza el nivel de confianza
   */
  updateConfidence(nuevaConfianza: number): void {
    if (nuevaConfianza < 0 || nuevaConfianza > 100) {
      throw new Error('Nivel de confianza debe estar entre 0 y 100');
    }
    
    this._confianza = nuevaConfianza;
    this.updateEntity({ updatedAt: new Date() });
  }

  /**
   * Añade observaciones al log
   */
  addObservation(observacion: string): void {
    const timestamp = new Date().toISOString();
    const nuevaObservacion = `[${timestamp}] ${observacion}`;
    
    if (this._observaciones) {
      this._observaciones += `\n${nuevaObservacion}`;
    } else {
      this._observaciones = nuevaObservacion;
    }
    
    this.updateEntity({ updatedAt: new Date() });
  }

  /**
   * Registra un intento fallido adicional
   */
  addFailedAttempt(): void {
    this._intentosFallidos++;
    this.addObservation(`Intento fallido #${this._intentosFallidos}`);
  }

  /**
   * Verifica si el log coincide con un contexto dado
   */
  matchesContext(context: IMovementContext): boolean {
    return this._employeeId === context.employeeId;
  }

  /**
   * Determina si es efectivo para cálculo basado en reglas de negocio
   */
  isEffectiveForCalculation(previousLog?: BiometricLog, nextLog?: BiometricLog): IProcessingResult {
    const result: IProcessingResult = {
      wasProcessed: this._esProcesado,
      isEffective: false,
      conflicts: [],
      warnings: [],
      processingTime: 0
    };

    const startTime = Date.now();

    // Verificar confianza mínima
    if (!this.esConfiable) {
      result.conflicts.push(`Confianza insuficiente: ${this._confianza}%`);
      result.processingTime = Date.now() - startTime;
      return result;
    }

    // Verificar duplicados
    if (previousLog && this.isDuplicateOf(previousLog)) {
      result.conflicts.push('Movimiento duplicado detectado');
      result.processingTime = Date.now() - startTime;
      return result;
    }

    // Verificar secuencia lógica
    if (previousLog && !this.isValidSequenceAfter(previousLog)) {
      result.warnings.push('Secuencia de movimientos inusual');
    }

    // Determinar efectividad
    if (this.esEntrada || this.esSalida) {
      result.isEffective = true;
      result.nextExpectedMovement = this.esEntrada ? WorkCode.SALIDA : WorkCode.ENTRADA;
    } else if (this.esDescanso || this.esAlmuerzo) {
      result.isEffective = true; // Para tracking de descansos/almuerzos
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Verifica si es duplicado de otro log
   */
  isDuplicateOf(otherLog: BiometricLog): boolean {
    const timeDiff = Math.abs(this.fechaHoraCompleta.getTime() - otherLog.fechaHoraCompleta.getTime());
    const sameEmployee = this._employeeId === otherLog._employeeId;
    const sameDevice = this._deviceId === otherLog._deviceId;
    const sameMovement = this._tipoMovimiento === otherLog._tipoMovimiento;
    
    // Considerar duplicado si es mismo empleado, dispositivo, movimiento y menos de 2 minutos de diferencia
    return sameEmployee && sameDevice && sameMovement && timeDiff < 120000; // 2 minutos
  }

  /**
   * Verifica si es una secuencia válida después de otro log
   */
  isValidSequenceAfter(previousLog: BiometricLog): boolean {
    const validSequences = {
      [WorkCode.ENTRADA]: [WorkCode.SALIDA, WorkCode.INICIO_DESCANSO, WorkCode.INICIO_ALMUERZO],
      [WorkCode.SALIDA]: [WorkCode.ENTRADA],
      [WorkCode.INICIO_DESCANSO]: [WorkCode.FIN_DESCANSO],
      [WorkCode.FIN_DESCANSO]: [WorkCode.INICIO_DESCANSO, WorkCode.INICIO_ALMUERZO, WorkCode.SALIDA],
      [WorkCode.INICIO_ALMUERZO]: [WorkCode.FIN_ALMUERZO],
      [WorkCode.FIN_ALMUERZO]: [WorkCode.INICIO_ALMUERZO, WorkCode.INICIO_DESCANSO, WorkCode.SALIDA]
    };

    const validNext = validSequences[previousLog._tipoMovimiento] || [];
    return validNext.includes(this._tipoMovimiento);
  }

  /**
   * Calcula la duración entre este log y otro
   */
  calculateDurationWith(otherLog: BiometricLog): number {
    const timeDiff = Math.abs(this.fechaHoraCompleta.getTime() - otherLog.fechaHoraCompleta.getTime());
    return Math.round(timeDiff / 60000); // Duración en minutos
  }

  /**
   * Actualiza el log con nuevos datos
   */
  update(data: IUpdateBiometricLogData): void {
    if (data.esProcesado !== undefined) {
      this._esProcesado = data.esProcesado;
    }
    
    if (data.esEfectivoParaCalculo !== undefined) {
      this._esEfectivoParaCalculo = data.esEfectivoParaCalculo;
    }
    
    if (data.observaciones !== undefined) {
      this._observaciones = data.observaciones;
    }
    
    if (data.confianza !== undefined) {
      this._confianza = data.confianza;
    }
    
    if (data.intentosFallidos !== undefined) {
      this._intentosFallidos = data.intentosFallidos;
    }

    this.updateEntity(data);
    logger.info(`BiometricLog ${this.id} actualizado`);
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    const errors: string[] = [];

    // Validar device ID
    if (!this._deviceId?.trim()) {
      errors.push('ID del dispositivo es requerido');
    }

    // Validar employee ID
    if (!this._employeeId?.trim()) {
      errors.push('ID del empleado es requerido');
    }

    // Validar fecha
    if (!this._fecha || isNaN(this._fecha.getTime())) {
      errors.push('Fecha debe ser válida');
    }

    // Validar hora
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!this._hora || !horaRegex.test(this._hora)) {
      errors.push('Hora debe tener formato HH:MM o HH:MM:SS');
    }

    // Validar tipo de movimiento
    if (!Object.values(WorkCode).includes(this._tipoMovimiento)) {
      errors.push('Tipo de movimiento inválido');
    }

    // Validar tipo de verificación
    if (!Object.values(VerificationType).includes(this._tipoVerificacion)) {
      errors.push('Tipo de verificación inválido');
    }

    // Validar confianza
    if (this._confianza < 0 || this._confianza > 100) {
      errors.push('Nivel de confianza debe estar entre 0 y 100');
    }

    // Validar intentos fallidos
    if (this._intentosFallidos < 0) {
      errors.push('Intentos fallidos no puede ser negativo');
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  /**
   * Convierte a JSON para serialización
   */
  toJSON(): object {
    return {
      ...this.toBaseObject(),
      deviceId: this._deviceId,
      employeeId: this._employeeId,
      fecha: this._fecha.toISOString().split('T')[0],
      hora: this._hora,
      fechaHoraCompleta: this.fechaHoraCompleta.toISOString(),
      tipoMovimiento: this._tipoMovimiento,
      descripcionMovimiento: this.descripcionMovimiento,
      tipoVerificacion: this._tipoVerificacion,
      esProcesado: this._esProcesado,
      esEfectivoParaCalculo: this._esEfectivoParaCalculo,
      observaciones: this._observaciones,
      confianza: this._confianza,
      esConfiable: this.esConfiable,
      datosOriginales: this._datosOriginales,
      ubicacionDispositivo: this._ubicacionDispositivo,
      intentosFallidos: this._intentosFallidos,
      tiempoRespuesta: this._tiempoRespuesta,
      esEntrada: this.esEntrada,
      esSalida: this.esSalida,
      esDescanso: this.esDescanso,
      esAlmuerzo: this.esAlmuerzo,
      esAltaPrioridad: this.esAltaPrioridad,
      deviceInfo: this.getDeviceInfo()
    };
  }

  /**
   * Crea un BiometricLog desde datos del dispositivo FACEID 360
   */
  static fromDeviceData(
    deviceId: string,
    employeeId: string,
    rawData: {
      fecha: string;
      hora: string;
      tipoMovimiento: string;
      tipoVerificacion: string;
      confianza?: number;
      ubicacion?: string;
      tiempoRespuesta?: number;
    }
  ): BiometricLog {
    return new BiometricLog({
      deviceId,
      employeeId,
      fecha: new Date(rawData.fecha),
      hora: rawData.hora,
      tipoMovimiento: rawData.tipoMovimiento as WorkCode,
      tipoVerificacion: rawData.tipoVerificacion as VerificationType,
      confianza: rawData.confianza,
      ubicacionDispositivo: rawData.ubicacion,
      tiempoRespuesta: rawData.tiempoRespuesta,
      datosOriginales: { rawData }
    });
  }

  /**
   * Crea múltiples logs en lote
   */
  static createBatch(logs: ICreateBiometricLogData[]): BiometricLog[] {
    return logs.map(logData => new BiometricLog(logData));
  }

  /**
   * Filtra logs por criterios específicos
   */
  static filterLogs(
    logs: BiometricLog[],
    criteria: {
      deviceId?: string;
      employeeId?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      soloEfectivos?: boolean;
      soloProcesados?: boolean;
      tipoMovimiento?: WorkCode[];
      confianzaMinima?: number;
    }
  ): BiometricLog[] {
    return logs.filter(log => {
      if (criteria.deviceId && log.deviceId !== criteria.deviceId) return false;
      if (criteria.employeeId && log.employeeId !== criteria.employeeId) return false;
      if (criteria.fechaInicio && log.fecha < criteria.fechaInicio) return false;
      if (criteria.fechaFin && log.fecha > criteria.fechaFin) return false;
      if (criteria.soloEfectivos && !log.esEfectivoParaCalculo) return false;
      if (criteria.soloProcesados && !log.esProcesado) return false;
      if (criteria.tipoMovimiento && !criteria.tipoMovimiento.includes(log.tipoMovimiento)) return false;
      if (criteria.confianzaMinima && log.confianza < criteria.confianzaMinima) return false;
      
      return true;
    });
  }

  /**
   * Calcula estadísticas de un conjunto de logs
   */
  static calculateStats(logs: BiometricLog[]): IBiometricLogStats {
    if (logs.length === 0) {
      return {
        totalMovimientos: 0,
        movimientosProcesados: 0,
        movimientosEfectivos: 0,
        movimientosDescartados: 0,
        confianzaPromedio: 0,
        tiempoRespuestaPromedio: 0,
        dispositivosUnicos: 0,
        empleadosUnicos: 0,
        fechaInicioRango: new Date(),
        fechaFinRango: new Date()
      };
    }

    const fechas = logs.map(log => log.fecha).sort((a, b) => a.getTime() - b.getTime());
    const tiemposRespuesta = logs.filter(log => log.tiempoRespuesta).map(log => log.tiempoRespuesta!);

    return {
      totalMovimientos: logs.length,
      movimientosProcesados: logs.filter(log => log.esProcesado).length,
      movimientosEfectivos: logs.filter(log => log.esEfectivoParaCalculo).length,
      movimientosDescartados: logs.filter(log => log.esProcesado && !log.esEfectivoParaCalculo).length,
      confianzaPromedio: logs.reduce((sum, log) => sum + log.confianza, 0) / logs.length,
      tiempoRespuestaPromedio: tiemposRespuesta.length > 0 
        ? tiemposRespuesta.reduce((sum, tiempo) => sum + tiempo, 0) / tiemposRespuesta.length 
        : 0,
      dispositivosUnicos: new Set(logs.map(log => log.deviceId)).size,
      empleadosUnicos: new Set(logs.map(log => log.employeeId)).size,
      fechaInicioRango: fechas[0],
      fechaFinRango: fechas[fechas.length - 1]
    };
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateBiometricLogData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar campos requeridos
    const deviceIdValidation = validateRequired(data.deviceId, 'ID del dispositivo');
    if (!deviceIdValidation.isValid) {
      errors.push(...deviceIdValidation.errors);
    }

    const employeeIdValidation = validateRequired(data.employeeId, 'ID del empleado');
    if (!employeeIdValidation.isValid) {
      errors.push(...employeeIdValidation.errors);
    }

    const horaValidation = validateRequired(data.hora, 'Hora');
    if (!horaValidation.isValid) {
      errors.push(...horaValidation.errors);
    }

    // Validar fecha
    if (!data.fecha || isNaN(data.fecha.getTime())) {
      errors.push('Fecha debe ser válida');
    }

    // Validar hora formato
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (data.hora && !horaRegex.test(data.hora)) {
      errors.push('Hora debe tener formato HH:MM o HH:MM:SS');
    }

    // Validar enums
    if (!Object.values(WorkCode).includes(data.tipoMovimiento)) {
      errors.push('Tipo de movimiento inválido');
    }

    if (!Object.values(VerificationType).includes(data.tipoVerificacion)) {
      errors.push('Tipo de verificación inválido');
    }

    // Validar confianza
    if (data.confianza !== undefined && (data.confianza < 0 || data.confianza > 100)) {
      errors.push('Nivel de confianza debe estar entre 0 y 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BiometricLog;