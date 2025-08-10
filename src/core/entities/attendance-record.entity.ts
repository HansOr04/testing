/**
 * ATTENDANCE RECORD ENTITY
 * Entidad de registro de asistencia
 * Maneja registros diarios de empleados con cálculos automáticos
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { AttendanceStatus } from '@core/enums/attendance-status.enum';
import { WorkCode } from '@core/enums/work-code.enum';
import { OvertimeCalculation, IDayContext } from '@core/value-objects/overtime-calculation.vo';
import { EmployeeType } from '@core/enums/employee-type.enum';
import { validateRequired } from '@shared/utils/validation.util';

/**
 * Datos para crear un registro de asistencia
 */
export interface ICreateAttendanceRecordData extends ICreateBaseEntityData {
  employeeId: string;
  fecha: Date;
  entrada?: Date;
  salida?: Date;
  entrada2?: Date; // Para empleados con horarios partidos
  salida2?: Date;
  tiempoAlmuerzo?: number; // En minutos
  horasRegulares: number;
  horasExtras: number;
  horasRecargo?: number;
  horasSupplementarias?: number;
  horasExtraordinarias?: number;
  horasNocturnas?: number;
  estado: AttendanceStatus;
  esManual: boolean;
  observaciones?: string;
  modificadoPor?: string;
  fechaModificacion?: Date;
}

/**
 * Datos para actualizar un registro de asistencia
 */
export interface IUpdateAttendanceRecordData extends IUpdateBaseEntityData {
  entrada?: Date;
  salida?: Date;
  entrada2?: Date;
  salida2?: Date;
  tiempoAlmuerzo?: number;
  horasRegulares?: number;
  horasExtras?: number;
  horasRecargo?: number;
  horasSupplementarias?: number;
  horasExtraordinarias?: number;
  horasNocturnas?: number;
  estado?: AttendanceStatus;
  esManual?: boolean;
  observaciones?: string;
  modificadoPor?: string;
  fechaModificacion?: Date;
}

/**
 * Movimiento individual del día
 */
export interface IAttendanceMovement {
  hora: Date;
  tipo: WorkCode;
  origen: 'MANUAL' | 'BIOMETRICO';
  dispositivoId?: string;
}

/**
 * Resumen del día laboral
 */
export interface IDaySummary {
  fecha: Date;
  totalHoras: number;
  horasEfectivas: number;
  tiempoDescansos: number;
  esCompleto: boolean;
  tieneFaltas: boolean;
  requiereRevision: boolean;
}

/**
 * Cálculo detallado de horas
 */
export interface IHoursBreakdown {
  regulares: number;
  recargo25: number;
  suplementarias50: number;
  extraordinarias100: number;
  nocturnas: number;
  totalExtras: number;
  totalPagables: number;
}

export class AttendanceRecord extends BaseEntity {
  private _employeeId: string;
  private _fecha: Date;
  private _entrada?: Date;
  private _salida?: Date;
  private _entrada2?: Date;
  private _salida2?: Date;
  private _tiempoAlmuerzo: number;
  private _horasRegulares: number;
  private _horasExtras: number;
  private _horasRecargo: number;
  private _horasSupplementarias: number;
  private _horasExtraordinarias: number;
  private _horasNocturnas: number;
  private _estado: AttendanceStatus;
  private _esManual: boolean;
  private _observaciones?: string;
  private _modificadoPor?: string;
  private _fechaModificacion?: Date;
  private _movimientos: IAttendanceMovement[];

  constructor(data: ICreateAttendanceRecordData) {
    super(data);

    this._employeeId = data.employeeId;
    this._fecha = new Date(data.fecha);
    this._entrada = data.entrada;
    this._salida = data.salida;
    this._entrada2 = data.entrada2;
    this._salida2 = data.salida2;
    this._tiempoAlmuerzo = data.tiempoAlmuerzo || 0;
    this._horasRegulares = data.horasRegulares;
    this._horasExtras = data.horasExtras;
    this._horasRecargo = data.horasRecargo || 0;
    this._horasSupplementarias = data.horasSupplementarias || 0;
    this._horasExtraordinarias = data.horasExtraordinarias || 0;
    this._horasNocturnas = data.horasNocturnas || 0;
    this._estado = data.estado;
    this._esManual = data.esManual;
    this._observaciones = data.observaciones;
    this._modificadoPor = data.modificadoPor;
    this._fechaModificacion = data.fechaModificacion;
    this._movimientos = [];
  }

  /**
   * Obtiene el ID del empleado
   */
  get employeeId(): string {
    return this._employeeId;
  }

  /**
   * Obtiene la fecha del registro
   */
  get fecha(): Date {
    return new Date(this._fecha);
  }

  /**
   * Obtiene la fecha formateada (YYYY-MM-DD)
   */
  get fechaFormateada(): string {
    return this._fecha.toISOString().split('T')[0];
  }

  /**
   * Obtiene la hora de entrada
   */
  get entrada(): Date | undefined {
    return this._entrada ? new Date(this._entrada) : undefined;
  }

  /**
   * Obtiene la hora de salida
   */
  get salida(): Date | undefined {
    return this._salida ? new Date(this._salida) : undefined;
  }

  /**
   * Obtiene la segunda entrada (horarios partidos)
   */
  get entrada2(): Date | undefined {
    return this._entrada2 ? new Date(this._entrada2) : undefined;
  }

  /**
   * Obtiene la segunda salida (horarios partidos)
   */
  get salida2(): Date | undefined {
    return this._salida2 ? new Date(this._salida2) : undefined;
  }

  /**
   * Obtiene el tiempo de almuerzo en minutos
   */
  get tiempoAlmuerzo(): number {
    return this._tiempoAlmuerzo;
  }

  /**
   * Obtiene las horas regulares
   */
  get horasRegulares(): number {
    return this._horasRegulares;
  }

  /**
   * Obtiene las horas extras totales
   */
  get horasExtras(): number {
    return this._horasExtras;
  }

  /**
   * Obtiene las horas de recargo (25%)
   */
  get horasRecargo(): number {
    return this._horasRecargo;
  }

  /**
   * Obtiene las horas suplementarias (50%)
   */
  get horasSupplementarias(): number {
    return this._horasSupplementarias;
  }

  /**
   * Obtiene las horas extraordinarias (100%)
   */
  get horasExtraordinarias(): number {
    return this._horasExtraordinarias;
  }

  /**
   * Obtiene las horas nocturnas
   */
  get horasNocturnas(): number {
    return this._horasNocturnas;
  }

  /**
   * Obtiene el estado del registro
   */
  get estado(): AttendanceStatus {
    return this._estado;
  }

  /**
   * Verifica si es un registro manual
   */
  get esManual(): boolean {
    return this._esManual;
  }

  /**
   * Obtiene las observaciones
   */
  get observaciones(): string | undefined {
    return this._observaciones;
  }

  /**
   * Obtiene quién modificó el registro
   */
  get modificadoPor(): string | undefined {
    return this._modificadoPor;
  }

  /**
   * Obtiene la fecha de modificación
   */
  get fechaModificacion(): Date | undefined {
    return this._fechaModificacion ? new Date(this._fechaModificacion) : undefined;
  }

  /**
   * Obtiene los movimientos del día
   */
  get movimientos(): IAttendanceMovement[] {
    return [...this._movimientos];
  }

  /**
   * Calcula el total de horas trabajadas
   */
  get totalHoras(): number {
    return this._horasRegulares + this._horasExtras;
  }

  /**
   * Verifica si tiene entrada registrada
   */
  get tieneEntrada(): boolean {
    return !!this._entrada;
  }

  /**
   * Verifica si tiene salida registrada
   */
  get tieneSalida(): boolean {
    return !!this._salida;
  }

  /**
   * Verifica si el registro está completo
   */
  get estaCompleto(): boolean {
    return this.tieneEntrada && this.tieneSalida;
  }

  /**
   * Verifica si es un horario partido
   */
  get esHorarioPartido(): boolean {
    return !!(this._entrada2 || this._salida2);
  }

  /**
   * Verifica si fue modificado manualmente
   */
  get fueModificado(): boolean {
    return !!(this._modificadoPor && this._fechaModificacion);
  }

  /**
   * Verifica si requiere revisión
   */
  get requiereRevision(): boolean {
    return this._estado === AttendanceStatus.PENDIENTE || 
           this._estado === AttendanceStatus.INCONSISTENTE ||
           this._estado === AttendanceStatus.REVISION;
  }

  /**
   * Obtiene el nombre del día de la semana
   */
  get diaSemana(): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[this._fecha.getDay()];
  }

  /**
   * Verifica si es fin de semana
   */
  get esFinDeSemana(): boolean {
    const dia = this._fecha.getDay();
    return dia === 0 || dia === 6; // Domingo o Sábado
  }

  /**
   * Actualiza el registro de asistencia
   */
  update(data: IUpdateAttendanceRecordData): void {
    if (data.entrada !== undefined) {
      this._entrada = data.entrada;
    }

    if (data.salida !== undefined) {
      this._salida = data.salida;
    }

    if (data.entrada2 !== undefined) {
      this._entrada2 = data.entrada2;
    }

    if (data.salida2 !== undefined) {
      this._salida2 = data.salida2;
    }

    if (data.tiempoAlmuerzo !== undefined) {
      this._tiempoAlmuerzo = data.tiempoAlmuerzo;
    }

    if (data.horasRegulares !== undefined) {
      this._horasRegulares = data.horasRegulares;
    }

    if (data.horasExtras !== undefined) {
      this._horasExtras = data.horasExtras;
    }

    if (data.horasRecargo !== undefined) {
      this._horasRecargo = data.horasRecargo;
    }

    if (data.horasSupplementarias !== undefined) {
      this._horasSupplementarias = data.horasSupplementarias;
    }

    if (data.horasExtraordinarias !== undefined) {
      this._horasExtraordinarias = data.horasExtraordinarias;
    }

    if (data.horasNocturnas !== undefined) {
      this._horasNocturnas = data.horasNocturnas;
    }

    if (data.estado !== undefined) {
      this._estado = data.estado;
    }

    if (data.esManual !== undefined) {
      this._esManual = data.esManual;
    }

    if (data.observaciones !== undefined) {
      this._observaciones = data.observaciones;
    }

    if (data.modificadoPor !== undefined) {
      this._modificadoPor = data.modificadoPor;
      this._fechaModificacion = new Date();
    }

    this.updateEntity(data);
  }

  /**
   * Registra entrada manual
   */
  registrarEntrada(hora: Date, modificadoPor?: string): void {
    this._entrada = hora;
    this._esManual = true;
    
    if (modificadoPor) {
      this._modificadoPor = modificadoPor;
      this._fechaModificacion = new Date();
    }
    
    this.actualizarEstado();
    this.touch();
  }

  /**
   * Registra salida manual
   */
  registrarSalida(hora: Date, modificadoPor?: string): void {
    this._salida = hora;
    this._esManual = true;
    
    if (modificadoPor) {
      this._modificadoPor = modificadoPor;
      this._fechaModificacion = new Date();
    }
    
    this.actualizarEstado();
    this.recalcularHoras();
    this.touch();
  }

  /**
   * Añade un movimiento al registro
   */
  addMovimiento(movimiento: IAttendanceMovement): void {
    this._movimientos.push({ ...movimiento });
    this._movimientos.sort((a, b) => a.hora.getTime() - b.hora.getTime());
    
    // Actualizar entrada/salida basado en movimientos
    this.procesarMovimientos();
    this.touch();
  }

  /**
   * Procesa movimientos para determinar entrada/salida
   */
  private procesarMovimientos(): void {
    if (this._movimientos.length === 0) return;

    const entradas = this._movimientos.filter(m => 
      m.tipo === WorkCode.ENTRADA || m.tipo === WorkCode.FIN_DESCANSO || m.tipo === WorkCode.FIN_ALMUERZO
    );
    
    const salidas = this._movimientos.filter(m => 
      m.tipo === WorkCode.SALIDA || m.tipo === WorkCode.INICIO_DESCANSO || m.tipo === WorkCode.INICIO_ALMUERZO
    );

    if (entradas.length > 0) {
      this._entrada = entradas[0].hora;
    }

    if (salidas.length > 0) {
      this._salida = salidas[salidas.length - 1].hora;
    }

    this.actualizarEstado();
    this.recalcularHoras();
  }

  /**
   * Recalcula las horas trabajadas
   */
  recalcularHoras(): void {
    if (!this.estaCompleto) {
      this._horasRegulares = 0;
      this._horasExtras = 0;
      this._horasRecargo = 0;
      this._horasSupplementarias = 0;
      this._horasExtraordinarias = 0;
      this._horasNocturnas = 0;
      return;
    }

    // Calcular horas totales trabajadas
    const totalMinutos = this.calcularMinutosTrabajados();
    const totalHoras = totalMinutos / 60;

    // Usar OvertimeCalculation para cálculos precisos
    const dayContext: IDayContext = {
      date: this._fecha,
      isWeekend: this.esFinDeSemana,
      isHoliday: false, // Se determinaría con calendario de feriados
      employeeType: EmployeeType.REGULAR, // Se obtendría del empleado
      scheduledHours: 8
    };

    const calculation = new OvertimeCalculation(totalHoras, dayContext);
    const breakdown = calculation.breakdown;

    this._horasRegulares = breakdown.regularHours;
    this._horasRecargo = breakdown.recargoHours;
    this._horasSupplementarias = breakdown.suplementariasHours;
    this._horasExtraordinarias = breakdown.extraordinariasHours;
    this._horasNocturnas = breakdown.nightHours;
    this._horasExtras = breakdown.totalOvertimeHours;
  }

  /**
   * Calcula los minutos trabajados considerando descansos
   */
  private calcularMinutosTrabajados(): number {
    if (!this._entrada || !this._salida) return 0;

    let totalMinutos = (this._salida.getTime() - this._entrada.getTime()) / (1000 * 60);
    
    // Restar tiempo de almuerzo
    totalMinutos -= this._tiempoAlmuerzo;
    
    // Si hay horario partido, sumar el segundo período
    if (this._entrada2 && this._salida2) {
      const segundoPeriodo = (this._salida2.getTime() - this._entrada2.getTime()) / (1000 * 60);
      totalMinutos += segundoPeriodo;
    }

    return Math.max(0, totalMinutos);
  }

  /**
   * Actualiza el estado del registro
   */
  private actualizarEstado(): void {
    if (!this.tieneEntrada && !this.tieneSalida) {
      this._estado = AttendanceStatus.AUSENTE;
    } else if (this.tieneEntrada && !this.tieneSalida) {
      this._estado = AttendanceStatus.PENDIENTE;
    } else if (this.estaCompleto) {
      this._estado = AttendanceStatus.COMPLETO;
    } else {
      this._estado = AttendanceStatus.INCONSISTENTE;
    }
  }

  /**
   * Marca como vacaciones
   */
  marcarVacaciones(modificadoPor: string): void {
    this._estado = AttendanceStatus.VACACIONES;
    this._modificadoPor = modificadoPor;
    this._fechaModificacion = new Date();
    this._entrada = undefined;
    this._salida = undefined;
    this._horasRegulares = 0;
    this._horasExtras = 0;
    this.touch();
  }

  /**
   * Marca como permiso
   */
  marcarPermiso(modificadoPor: string, observaciones?: string): void {
    this._estado = AttendanceStatus.PERMISO;
    this._modificadoPor = modificadoPor;
    this._fechaModificacion = new Date();
    this._observaciones = observaciones;
    this._entrada = undefined;
    this._salida = undefined;
    this._horasRegulares = 0;
    this._horasExtras = 0;
    this.touch();
  }

  /**
   * Marca como incapacidad
   */
  marcarIncapacidad(modificadoPor: string, observaciones?: string): void {
    this._estado = AttendanceStatus.INCAPACIDAD;
    this._modificadoPor = modificadoPor;
    this._fechaModificacion = new Date();
    this._observaciones = observaciones;
    this._entrada = undefined;
    this._salida = undefined;
    this._horasRegulares = 0;
    this._horasExtras = 0;
    this.touch();
  }

  /**
   * Obtiene resumen del día
   */
  getDaySummary(): IDaySummary {
    return {
      fecha: this.fecha,
      totalHoras: this.totalHoras,
      horasEfectivas: this._horasRegulares + this._horasExtras,
      tiempoDescansos: this._tiempoAlmuerzo,
      esCompleto: this.estaCompleto,
      tieneFaltas: this._estado === AttendanceStatus.AUSENTE,
      requiereRevision: this.requiereRevision
    };
  }

  /**
   * Obtiene desglose detallado de horas
   */
  getHoursBreakdown(): IHoursBreakdown {
    return {
      regulares: this._horasRegulares,
      recargo25: this._horasRecargo,
      suplementarias50: this._horasSupplementarias,
      extraordinarias100: this._horasExtraordinarias,
      nocturnas: this._horasNocturnas,
      totalExtras: this._horasExtras,
      totalPagables: this.totalHoras
    };
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    // Validar employee ID
    const employeeValidation = validateRequired(this._employeeId, 'ID de empleado');
    if (!employeeValidation.isValid) {
      throw new Error(employeeValidation.errors[0]);
    }

    // Validar fecha
    if (!this._fecha || isNaN(this._fecha.getTime())) {
      throw new Error('Fecha del registro debe ser válida');
    }

    // Validar que la fecha no sea futura
    if (this._fecha > new Date()) {
      throw new Error('Fecha del registro no puede ser futura');
    }

    // Validar horas no negativas
    if (this._horasRegulares < 0) {
      throw new Error('Horas regulares no pueden ser negativas');
    }

    if (this._horasExtras < 0) {
      throw new Error('Horas extras no pueden ser negativas');
    }

    // Validar que entrada sea anterior a salida
    if (this._entrada && this._salida && this._entrada >= this._salida) {
      throw new Error('Hora de entrada debe ser anterior a hora de salida');
    }

    // Validar horario partido
    if (this._entrada2 && this._salida2 && this._entrada2 >= this._salida2) {
      throw new Error('Segunda entrada debe ser anterior a segunda salida');
    }

    // Validar tiempo de almuerzo
    if (this._tiempoAlmuerzo < 0 || this._tiempoAlmuerzo > 240) {
      throw new Error('Tiempo de almuerzo debe estar entre 0 y 240 minutos');
    }

    // Validar estado
    if (!Object.values(AttendanceStatus).includes(this._estado)) {
      throw new Error('Estado de asistencia inválido');
    }
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      ...this.toBaseObject(),
      employeeId: this._employeeId,
      fecha: this._fecha,
      fechaFormateada: this.fechaFormateada,
      entrada: this._entrada,
      salida: this._salida,
      entrada2: this._entrada2,
      salida2: this._salida2,
      tiempoAlmuerzo: this._tiempoAlmuerzo,
      horasRegulares: this._horasRegulares,
      horasExtras: this._horasExtras,
      horasRecargo: this._horasRecargo,
      horasSupplementarias: this._horasSupplementarias,
      horasExtraordinarias: this._horasExtraordinarias,
      horasNocturnas: this._horasNocturnas,
      totalHoras: this.totalHoras,
      estado: this._estado,
      esManual: this._esManual,
      observaciones: this._observaciones,
      modificadoPor: this._modificadoPor,
      fechaModificacion: this._fechaModificacion,
      movimientos: this._movimientos,
      tieneEntrada: this.tieneEntrada,
      tieneSalida: this.tieneSalida,
      estaCompleto: this.estaCompleto,
      esHorarioPartido: this.esHorarioPartido,
      fueModificado: this.fueModificado,
      requiereRevision: this.requiereRevision,
      diaSemana: this.diaSemana,
      esFinDeSemana: this.esFinDeSemana,
      daySummary: this.getDaySummary(),
      hoursBreakdown: this.getHoursBreakdown()
    };
  }

  /**
   * Crea una copia superficial
   */
  protected shallowCopy(): AttendanceRecord {
    const data: ICreateAttendanceRecordData = {
      ...this.cloneBaseData(),
      employeeId: this._employeeId,
      fecha: new Date(this._fecha),
      entrada: this._entrada,
      salida: this._salida,
      entrada2: this._entrada2,
      salida2: this._salida2,
      tiempoAlmuerzo: this._tiempoAlmuerzo,
      horasRegulares: this._horasRegulares,
      horasExtras: this._horasExtras,
      horasRecargo: this._horasRecargo,
      horasSupplementarias: this._horasSupplementarias,
      horasExtraordinarias: this._horasExtraordinarias,
      horasNocturnas: this._horasNocturnas,
      estado: this._estado,
      esManual: this._esManual,
      observaciones: this._observaciones,
      modificadoPor: this._modificadoPor,
      fechaModificacion: this._fechaModificacion
    };

    const copy = new AttendanceRecord(data);
    copy._movimientos = [...this._movimientos];
    return copy;
  }

  /**
   * Crea un registro de asistencia vacío
   */
  static createEmpty(employeeId: string, fecha: Date): AttendanceRecord {
    return new AttendanceRecord({
      employeeId,
      fecha,
      horasRegulares: 0,
      horasExtras: 0,
      estado: AttendanceStatus.AUSENTE,
      esManual: false
    });
  }

  /**
   * Crea un registro completo
   */
  static createComplete(
    employeeId: string,
    fecha: Date,
    entrada: Date,
    salida: Date,
    tiempoAlmuerzo: number = 60
  ): AttendanceRecord {
    const record = new AttendanceRecord({
      employeeId,
      fecha,
      entrada,
      salida,
      tiempoAlmuerzo,
      horasRegulares: 0,
      horasExtras: 0,
      estado: AttendanceStatus.COMPLETO,
      esManual: false
    });

    record.recalcularHoras();
    return record;
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateAttendanceRecordData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar campos requeridos
    const employeeValidation = validateRequired(data.employeeId, 'ID de empleado');
    if (!employeeValidation.isValid) {
      errors.push(...employeeValidation.errors);
    }

    // Validar fecha
    if (!data.fecha || isNaN(data.fecha.getTime())) {
      errors.push('Fecha debe ser válida');
    } else if (data.fecha > new Date()) {
      errors.push('Fecha no puede ser futura');
    }

    // Validar horas
    if (data.horasRegulares < 0) {
      errors.push('Horas regulares no pueden ser negativas');
    }

    if (data.horasExtras < 0) {
      errors.push('Horas extras no pueden ser negativas');
    }

    // Validar entrada/salida
    if (data.entrada && data.salida && data.entrada >= data.salida) {
      errors.push('Hora de entrada debe ser anterior a hora de salida');
    }

    // Validar estado
    if (!Object.values(AttendanceStatus).includes(data.estado)) {
      errors.push('Estado de asistencia inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default AttendanceRecord;