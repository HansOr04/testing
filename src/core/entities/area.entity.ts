/**
 * AREA ENTITY
 * Entidad de área de trabajo del sistema de asistencia
 * Maneja departamentos y áreas dentro de las sucursales
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { WorkSchedule } from '@core/value-objects/work-schedule.vo';
import { validateRequired, validateTextLength, validateNumberRange } from '@shared/utils/validation.util';

/**
 * Datos para crear un área
 */
export interface ICreateAreaData extends ICreateBaseEntityData {
  nombre: string;
  codigo: string;
  sucursalId: string;
  descripcion?: string;
  supervisor?: string;
  schedule?: WorkSchedule;
  limiteHorasSemanales?: number;
  limiteHorasExtrasSemanales?: number;
  requiereAprobacionExtras?: boolean;
  color?: string;
  orden?: number;
}

/**
 * Datos para actualizar un área
 */
export interface IUpdateAreaData extends IUpdateBaseEntityData {
  nombre?: string;
  descripcion?: string;
  supervisor?: string;
  schedule?: WorkSchedule;
  limiteHorasSemanales?: number;
  limiteHorasExtrasSemanales?: number;
  requiereAprobacionExtras?: boolean;
  color?: string;
  orden?: number;
}

/**
 * Configuración de límites del área
 */
export interface IAreaLimits {
  limiteHorasSemanales?: number;
  limiteHorasExtrasSemanales?: number;
  requiereAprobacionExtras: boolean;
  maxEmpleadosPorArea?: number;
}

/**
 * Estadísticas del área
 */
export interface IAreaStats {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosRegulares: number;
  empleadosAdministrativos: number;
  promedioHorasSemanales: number;
  totalHorasExtrasMes: number;
  promedioAsistencia: number;
  supervisorAsignado: boolean;
}

/**
 * Resumen de operación del área
 */
export interface IAreaOperation {
  tieneHorarioDefinido: boolean;
  horasSemanalesTotales?: number;
  diasLaborales: string[];
  requiereSupervision: boolean;
  empleadosEnLimite: boolean;
  extrasEnLimite: boolean;
}

export class Area extends BaseEntity {
  private _nombre: string;
  private _codigo: string;
  private _sucursalId: string;
  private _descripcion?: string;
  private _supervisor?: string;
  private _schedule?: WorkSchedule;
  private _limiteHorasSemanales?: number;
  private _limiteHorasExtrasSemanales?: number;
  private _requiereAprobacionExtras: boolean;
  private _color?: string;
  private _orden: number;

  constructor(data: ICreateAreaData) {
    super(data);

    this._nombre = data.nombre.trim();
    this._codigo = data.codigo.toUpperCase().trim();
    this._sucursalId = data.sucursalId;
    this._descripcion = data.descripcion?.trim();
    this._supervisor = data.supervisor?.trim();
    this._schedule = data.schedule;
    this._limiteHorasSemanales = data.limiteHorasSemanales;
    this._limiteHorasExtrasSemanales = data.limiteHorasExtrasSemanales;
    this._requiereAprobacionExtras = data.requiereAprobacionExtras || false;
    this._color = data.color?.trim();
    this._orden = data.orden || 0;
  }

  /**
   * Obtiene el nombre del área
   */
  get nombre(): string {
    return this._nombre;
  }

  /**
   * Obtiene el código único del área
   */
  get codigo(): string {
    return this._codigo;
  }

  /**
   * Obtiene el ID de la sucursal
   */
  get sucursalId(): string {
    return this._sucursalId;
  }

  /**
   * Obtiene la descripción
   */
  get descripcion(): string | undefined {
    return this._descripcion;
  }

  /**
   * Obtiene el supervisor asignado
   */
  get supervisor(): string | undefined {
    return this._supervisor;
  }

  /**
   * Obtiene el horario del área
   */
  get schedule(): WorkSchedule | undefined {
    return this._schedule;
  }

  /**
   * Obtiene el límite de horas semanales
   */
  get limiteHorasSemanales(): number | undefined {
    return this._limiteHorasSemanales;
  }

  /**
   * Obtiene el límite de horas extras semanales
   */
  get limiteHorasExtrasSemanales(): number | undefined {
    return this._limiteHorasExtrasSemanales;
  }

  /**
   * Verifica si requiere aprobación para horas extras
   */
  get requiereAprobacionExtras(): boolean {
    return this._requiereAprobacionExtras;
  }

  /**
   * Obtiene el color asociado al área
   */
  get color(): string | undefined {
    return this._color;
  }

  /**
   * Obtiene el orden de visualización
   */
  get orden(): number {
    return this._orden;
  }

  /**
   * Obtiene el nombre para mostrar
   */
  get displayName(): string {
    return `${this._codigo} - ${this._nombre}`;
  }

  /**
   * Verifica si tiene supervisor asignado
   */
  get tieneSupervisor(): boolean {
    return !!this._supervisor;
  }

  /**
   * Verifica si tiene horario definido
   */
  get tieneHorarioDefinido(): boolean {
    return !!this._schedule;
  }

  /**
   * Verifica si tiene límites de horas configurados
   */
  get tieneLimitesHoras(): boolean {
    return !!(this._limiteHorasSemanales || this._limiteHorasExtrasSemanales);
  }

  /**
   * Obtiene las horas semanales del horario
   */
  get horasSemanalesTotales(): number | undefined {
    return this._schedule?.weeklyHours;
  }

  /**
   * Obtiene los días laborales del horario
   */
  get diasLaborales(): string[] {
    return this._schedule?.workingDays || [];
  }

  /**
   * Actualiza información del área
   */
  update(data: IUpdateAreaData): void {
    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) {
        throw new Error('Nombre del área es requerido');
      }
      this._nombre = data.nombre.trim();
    }

    if (data.descripcion !== undefined) {
      this._descripcion = data.descripcion?.trim();
    }

    if (data.supervisor !== undefined) {
      this._supervisor = data.supervisor?.trim();
    }

    if (data.schedule !== undefined) {
      this._schedule = data.schedule;
    }

    if (data.limiteHorasSemanales !== undefined) {
      if (data.limiteHorasSemanales !== null && data.limiteHorasSemanales < 1) {
        throw new Error('Límite de horas semanales debe ser mayor a 0');
      }
      this._limiteHorasSemanales = data.limiteHorasSemanales || undefined;
    }

    if (data.limiteHorasExtrasSemanales !== undefined) {
      if (data.limiteHorasExtrasSemanales !== null && data.limiteHorasExtrasSemanales < 0) {
        throw new Error('Límite de horas extras no puede ser negativo');
      }
      this._limiteHorasExtrasSemanales = data.limiteHorasExtrasSemanales || undefined;
    }

    if (data.requiereAprobacionExtras !== undefined) {
      this._requiereAprobacionExtras = data.requiereAprobacionExtras;
    }

    if (data.color !== undefined) {
      this._color = data.color?.trim();
    }

    if (data.orden !== undefined) {
      this._orden = data.orden;
    }

    this.updateEntity(data);
  }

  /**
   * Asigna un supervisor
   */
  assignSupervisor(supervisor: string): void {
    this._supervisor = supervisor.trim();
    this.touch();
  }

  /**
   * Remueve el supervisor
   */
  removeSupervisor(): void {
    this._supervisor = undefined;
    this.touch();
  }

  /**
   * Establece el horario del área
   */
  setSchedule(schedule: WorkSchedule): void {
    this._schedule = schedule;
    this.touch();
  }

  /**
   * Remueve el horario del área
   */
  removeSchedule(): void {
    this._schedule = undefined;
    this.touch();
  }

  /**
   * Configura límites de horas
   */
  setLimites(data: {
    limiteHorasSemanales?: number;
    limiteHorasExtrasSemanales?: number;
    requiereAprobacionExtras?: boolean;
  }): void {
    if (data.limiteHorasSemanales !== undefined) {
      if (data.limiteHorasSemanales < 1) {
        throw new Error('Límite de horas semanales debe ser mayor a 0');
      }
      this._limiteHorasSemanales = data.limiteHorasSemanales;
    }

    if (data.limiteHorasExtrasSemanales !== undefined) {
      if (data.limiteHorasExtrasSemanales < 0) {
        throw new Error('Límite de horas extras no puede ser negativo');
      }
      this._limiteHorasExtrasSemanales = data.limiteHorasExtrasSemanales;
    }

    if (data.requiereAprobacionExtras !== undefined) {
      this._requiereAprobacionExtras = data.requiereAprobacionExtras;
    }

    this.touch();
  }

  /**
   * Establece configuración visual
   */
  setConfiguracionVisual(color?: string, orden?: number): void {
    if (color !== undefined) {
      this._color = color?.trim();
    }

    if (orden !== undefined) {
      this._orden = orden;
    }

    this.touch();
  }

  /**
   * Verifica si las horas semanales están dentro del límite
   */
  validarLimiteHoras(horasSemanales: number): boolean {
    if (!this._limiteHorasSemanales) return true;
    return horasSemanales <= this._limiteHorasSemanales;
  }

  /**
   * Verifica si las horas extras están dentro del límite
   */
  validarLimiteExtras(horasExtras: number): boolean {
    if (!this._limiteHorasExtrasSemanales) return true;
    return horasExtras <= this._limiteHorasExtrasSemanales;
  }

  /**
   * Obtiene la configuración de límites
   */
  getLimits(): IAreaLimits {
    return {
      limiteHorasSemanales: this._limiteHorasSemanales,
      limiteHorasExtrasSemanales: this._limiteHorasExtrasSemanales,
      requiereAprobacionExtras: this._requiereAprobacionExtras
    };
  }

  /**
   * Obtiene información de operación
   */
  getOperationInfo(): IAreaOperation {
    return {
      tieneHorarioDefinido: this.tieneHorarioDefinido,
      horasSemanalesTotales: this.horasSemanalesTotales,
      diasLaborales: this.diasLaborales,
      requiereSupervision: this._requiereAprobacionExtras,
      empleadosEnLimite: false, // Se calcularía con datos reales
      extrasEnLimite: false // Se calcularía con datos reales
    };
  }

  /**
   * Verifica si es compatible con un horario específico
   */
  isCompatibleWithSchedule(employeeSchedule: WorkSchedule): boolean {
    if (!this._schedule) return true; // Sin restricciones

    // Verificar que los días laborales del empleado estén dentro del área
    const areaDays = new Set(this.diasLaborales);
    const employeeDays = employeeSchedule.workingDays;

    return employeeDays.every(day => areaDays.has(day));
  }

  /**
   * Obtiene un resumen del área
   */
  getSummary(): string {
    const supervisor = this.tieneSupervisor ? ` (Sup: ${this._supervisor})` : '';
    const horario = this.tieneHorarioDefinido ? ` - ${this.horasSemanalesTotales}h/sem` : '';
    const limites = this.tieneLimitesHoras ? ' - Con límites' : '';
    
    return `${this.displayName}${supervisor}${horario}${limites}`;
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    // Validar nombre
    const nombreValidation = validateRequired(this._nombre, 'Nombre del área');
    if (!nombreValidation.isValid) {
      throw new Error(nombreValidation.errors[0]);
    }

    const nombreLength = validateTextLength(this._nombre, 2, 100, 'Nombre');
    if (!nombreLength.isValid) {
      throw new Error(nombreLength.errors[0]);
    }

    // Validar código
    const codigoValidation = validateRequired(this._codigo, 'Código del área');
    if (!codigoValidation.isValid) {
      throw new Error(codigoValidation.errors[0]);
    }

    const codigoLength = validateTextLength(this._codigo, 2, 20, 'Código');
    if (!codigoLength.isValid) {
      throw new Error(codigoLength.errors[0]);
    }

    // Validar sucursal ID
    const sucursalValidation = validateRequired(this._sucursalId, 'ID de sucursal');
    if (!sucursalValidation.isValid) {
      throw new Error(sucursalValidation.errors[0]);
    }

    // Validar límites de horas
    if (this._limiteHorasSemanales !== undefined) {
      const horasValidation = validateNumberRange(this._limiteHorasSemanales, 1, 168, 'Límite de horas semanales');
      if (!horasValidation.isValid) {
        throw new Error(horasValidation.errors[0]);
      }
    }

    if (this._limiteHorasExtrasSemanales !== undefined) {
      const extrasValidation = validateNumberRange(this._limiteHorasExtrasSemanales, 0, 60, 'Límite de horas extras semanales');
      if (!extrasValidation.isValid) {
        throw new Error(extrasValidation.errors[0]);
      }
    }

    // Validar orden
    if (this._orden < 0) {
      throw new Error('Orden no puede ser negativo');
    }

    // Validar color si está definido
    if (this._color && this._color.length > 0) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(this._color)) {
        throw new Error('Color debe estar en formato hexadecimal (#RRGGBB o #RGB)');
      }
    }

    // Validar consistencia entre límites
    if (this._limiteHorasSemanales && this._limiteHorasExtrasSemanales) {
      if (this._limiteHorasExtrasSemanales > this._limiteHorasSemanales) {
        throw new Error('Límite de horas extras no puede ser mayor al límite de horas semanales');
      }
    }
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      ...this.toBaseObject(),
      nombre: this._nombre,
      codigo: this._codigo,
      sucursalId: this._sucursalId,
      descripcion: this._descripcion,
      supervisor: this._supervisor,
      schedule: this._schedule?.toJSON(),
      limiteHorasSemanales: this._limiteHorasSemanales,
      limiteHorasExtrasSemanales: this._limiteHorasExtrasSemanales,
      requiereAprobacionExtras: this._requiereAprobacionExtras,
      color: this._color,
      orden: this._orden,
      displayName: this.displayName,
      tieneSupervisor: this.tieneSupervisor,
      tieneHorarioDefinido: this.tieneHorarioDefinido,
      tieneLimitesHoras: this.tieneLimitesHoras,
      horasSemanalesTotales: this.horasSemanalesTotales,
      diasLaborales: this.diasLaborales,
      limits: this.getLimits(),
      operationInfo: this.getOperationInfo()
    };
  }

  /**
   * Convierte a JSON básico
   */
  toBasicJSON(): object {
    return {
      id: this.id,
      nombre: this._nombre,
      codigo: this._codigo,
      sucursalId: this._sucursalId,
      displayName: this.displayName,
      supervisor: this._supervisor,
      isActive: this.isActive,
      orden: this._orden,
      color: this._color
    };
  }

  /**
   * Crea una copia superficial
   */
  protected shallowCopy(): Area {
    const data: ICreateAreaData = {
      ...this.cloneBaseData(),
      nombre: this._nombre,
      codigo: this._codigo,
      sucursalId: this._sucursalId,
      descripcion: this._descripcion,
      supervisor: this._supervisor,
      schedule: this._schedule,
      limiteHorasSemanales: this._limiteHorasSemanales,
      limiteHorasExtrasSemanales: this._limiteHorasExtrasSemanales,
      requiereAprobacionExtras: this._requiereAprobacionExtras,
      color: this._color,
      orden: this._orden
    };

    return new Area(data);
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateAreaData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar nombre
    const nombreValidation = validateRequired(data.nombre, 'Nombre del área');
    if (!nombreValidation.isValid) {
      errors.push(...nombreValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.nombre, 2, 100, 'Nombre');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    // Validar código
    const codigoValidation = validateRequired(data.codigo, 'Código del área');
    if (!codigoValidation.isValid) {
      errors.push(...codigoValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.codigo, 2, 20, 'Código');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    // Validar sucursal ID
    const sucursalValidation = validateRequired(data.sucursalId, 'ID de sucursal');
    if (!sucursalValidation.isValid) {
      errors.push(...sucursalValidation.errors);
    }

    // Validar límites
    if (data.limiteHorasSemanales !== undefined && data.limiteHorasSemanales < 1) {
      errors.push('Límite de horas semanales debe ser mayor a 0');
    }

    if (data.limiteHorasExtrasSemanales !== undefined && data.limiteHorasExtrasSemanales < 0) {
      errors.push('Límite de horas extras no puede ser negativo');
    }

    // Validar orden
    if (data.orden !== undefined && data.orden < 0) {
      errors.push('Orden no puede ser negativo');
    }

    // Validar color
    if (data.color && data.color.length > 0) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(data.color)) {
        errors.push('Color debe estar en formato hexadecimal (#RRGGBB o #RGB)');
      }
    }

    // Validar consistencia
    if (data.limiteHorasSemanales && data.limiteHorasExtrasSemanales) {
      if (data.limiteHorasExtrasSemanales > data.limiteHorasSemanales) {
        errors.push('Límite de horas extras no puede ser mayor al límite de horas semanales');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crea un área básica
   */
  static createBasic(
    nombre: string,
    codigo: string,
    sucursalId: string,
    supervisor?: string
  ): Area {
    return new Area({
      nombre,
      codigo,
      sucursalId,
      supervisor
    });
  }

  /**
   * Crea un área con horario
   */
  static createWithSchedule(
    nombre: string,
    codigo: string,
    sucursalId: string,
    schedule: WorkSchedule,
    supervisor?: string
  ): Area {
    return new Area({
      nombre,
      codigo,
      sucursalId,
      schedule,
      supervisor
    });
  }

  /**
   * Crea un área con límites de horas
   */
  static createWithLimits(
    nombre: string,
    codigo: string,
    sucursalId: string,
    limiteHorasSemanales: number,
    limiteHorasExtrasSemanales?: number,
    requiereAprobacionExtras: boolean = false
  ): Area {
    return new Area({
      nombre,
      codigo,
      sucursalId,
      limiteHorasSemanales,
      limiteHorasExtrasSemanales,
      requiereAprobacionExtras
    });
  }
}

export default Area;