/**
 * EMPLOYEE TYPE VALUE OBJECT
 * Maneja el tipo de empleado con sus reglas específicas de negocio
 * Incluye validaciones y configuraciones para Regular y Administrativo
 */

import { EmployeeType, getEmployeeTypeConfig, getDefaultSchedule, getOvertimeRules } from '@core/enums/employee-type.enum';
import TimeRange from './time-range.vo';
import WorkSchedule, { IWeeklySchedule } from './work-schedule.vo';

/**
 * Configuración específica del tipo de empleado
 */
export interface IEmployeeTypeConfiguration {
  type: EmployeeType;
  hasFixedSchedule: boolean;
  canWorkMultipleSucursales: boolean;
  calculationMethod: 'ENTRY_EXIT' | 'FIRST_LAST_MOVEMENT';
  minimumHoursPerDay: number;
  requiresExactTimeTracking: boolean;
  allowsManualTimeAdjustment: boolean;
  overtimeCalculation: 'STANDARD' | 'EFFECTIVE_HOURS';
  permissions: IEmployeeTypePermissions;
  schedule: IEmployeeTypeSchedule;
  overtime: IEmployeeTypeOvertime;
}

/**
 * Permisos específicos del tipo de empleado
 */
export interface IEmployeeTypePermissions {
  canAccessMultipleSucursales: boolean;
  canModifyOwnAttendance: boolean;
  requiresApprovalForChanges: boolean;
  canViewOthersAttendance: boolean;
  canGenerateReports: boolean;
  maxSucursalesAccess: number;
}

/**
 * Configuración de horarios del tipo de empleado
 */
export interface IEmployeeTypeSchedule {
  defaultStartTime: string;
  defaultEndTime: string;
  breakDuration: number;
  flexibilityMinutes: number;
  canHaveFlexibleSchedule: boolean;
  requiresFixedSchedule: boolean;
}

/**
 * Configuración de overtime del tipo de empleado
 */
export interface IEmployeeTypeOvertime {
  dailyThreshold: number;
  weeklyThreshold: number;
  calculatesRecargo: boolean;
  calculatesSupplementary: boolean;
  calculatesExtraordinary: boolean;
  maxOvertimePerDay: number;
  effectiveHoursOnly?: boolean;
}

/**
 * Reglas de validación para el tipo de empleado
 */
export interface IEmployeeTypeValidationRules {
  minimumAge?: number;
  maximumAge?: number;
  requiredEducation?: string[];
  requiredExperience?: number;
  requiredCertifications?: string[];
  backgroundCheckRequired?: boolean;
}

export class EmployeeTypeVO {
  private readonly _type: EmployeeType;
  private readonly _configuration: IEmployeeTypeConfiguration;
  private readonly _isValid: boolean;
  private readonly _errors: string[];

  constructor(type: EmployeeType) {
    this._type = type;
    this._errors = [];
    this._configuration = this.buildConfiguration();
    this._isValid = this.validate();

    if (!this._isValid) {
      throw new Error(`Tipo de empleado inválido: ${this._errors.join(', ')}`);
    }
  }

  /**
   * Obtiene el tipo de empleado
   */
  get type(): EmployeeType {
    return this._type;
  }

  /**
   * Obtiene la configuración completa
   */
  get configuration(): IEmployeeTypeConfiguration {
    return { ...this._configuration };
  }

  /**
   * Verifica si es válido
   */
  get isValid(): boolean {
    return this._isValid;
  }

  /**
   * Obtiene errores de validación
   */
  get errors(): string[] {
    return [...this._errors];
  }

  /**
   * Verifica si es empleado regular
   */
  get isRegular(): boolean {
    return this._type === EmployeeType.REGULAR;
  }

  /**
   * Verifica si es empleado administrativo
   */
  get isAdministrative(): boolean {
    return this._type === EmployeeType.ADMINISTRATIVO;
  }

  /**
   * Verifica si tiene horario fijo
   */
  get hasFixedSchedule(): boolean {
    return this._configuration.hasFixedSchedule;
  }

  /**
   * Verifica si puede trabajar en múltiples sucursales
   */
  get canWorkMultipleSucursales(): boolean {
    return this._configuration.canWorkMultipleSucursales;
  }

  /**
   * Obtiene el método de cálculo de horas
   */
  get calculationMethod(): string {
    return this._configuration.calculationMethod;
  }

  /**
   * Obtiene las horas mínimas por día
   */
  get minimumHoursPerDay(): number {
    return this._configuration.minimumHoursPerDay;
  }

  /**
   * Verifica si requiere seguimiento exacto de tiempo
   */
  get requiresExactTimeTracking(): boolean {
    return this._configuration.requiresExactTimeTracking;
  }

  /**
   * Verifica si permite ajustes manuales de tiempo
   */
  get allowsManualTimeAdjustment(): boolean {
    return this._configuration.allowsManualTimeAdjustment;
  }

  /**
   * Obtiene el tipo de cálculo de overtime
   */
  get overtimeCalculation(): string {
    return this._configuration.overtimeCalculation;
  }

  /**
   * Obtiene los permisos del tipo de empleado
   */
  get permissions(): IEmployeeTypePermissions {
    return { ...this._configuration.permissions };
  }

  /**
   * Obtiene la configuración de horarios
   */
  get schedule(): IEmployeeTypeSchedule {
    return { ...this._configuration.schedule };
  }

  /**
   * Obtiene la configuración de overtime
   */
  get overtime(): IEmployeeTypeOvertime {
    return { ...this._configuration.overtime };
  }

  /**
   * Obtiene el número máximo de sucursales permitidas
   */
  get maxSucursalesAccess(): number {
    return this._configuration.permissions.maxSucursalesAccess;
  }

  /**
   * Crea un horario por defecto para este tipo de empleado
   */
  createDefaultSchedule(): WorkSchedule {
    const timeRange = new TimeRange(
      this._configuration.schedule.defaultStartTime,
      this._configuration.schedule.defaultEndTime
    );

    if (this.isRegular) {
      // Empleados regulares: Lunes a Viernes
      const schedule: IWeeklySchedule = {
        lunes: timeRange,
        martes: timeRange,
        miercoles: timeRange,
        jueves: timeRange,
        viernes: timeRange
      };
      return new WorkSchedule(schedule);
    } else {
      // Empleados administrativos: Horario más flexible
      const schedule: IWeeklySchedule = {
        lunes: timeRange,
        martes: timeRange,
        miercoles: timeRange,
        jueves: timeRange,
        viernes: timeRange
      };
      return new WorkSchedule(schedule);
    }
  }

  /**
   * Crea un horario flexible para este tipo de empleado
   */
  createFlexibleSchedule(): WorkSchedule | null {
    if (!this._configuration.schedule.canHaveFlexibleSchedule) {
      return null;
    }

    const coreHours = new TimeRange(
      this._configuration.schedule.defaultStartTime,
      this._configuration.schedule.defaultEndTime
    );

    return WorkSchedule.createFlexibleSchedule(
      coreHours,
      this._configuration.schedule.flexibilityMinutes
    );
  }

  /**
   * Valida si un horario es compatible con este tipo de empleado
   */
  validateSchedule(schedule: WorkSchedule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar horas semanales
    if (this.isRegular && schedule.weeklyHours > 40) {
      errors.push('Empleados regulares no pueden exceder 40 horas semanales programadas');
    }

    if (this.isAdministrative && schedule.weeklyHours > 50) {
      errors.push('Empleados administrativos no pueden exceder 50 horas semanales programadas');
    }

    // Validar horas diarias
    schedule.workingDays.forEach(day => {
      const daySchedule = schedule.getScheduleForDay(day as keyof IWeeklySchedule);
      if (daySchedule && daySchedule.durationHours > this._configuration.overtime.maxOvertimePerDay + 8) {
        errors.push(`Día ${day}: Excede el máximo de horas diarias permitidas`);
      }
    });

    // Validar horario fijo para empleados regulares
    if (this.isRegular && this._configuration.hasFixedSchedule && !schedule.hasConsistentSchedule) {
      errors.push('Empleados regulares requieren horario consistente');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica si puede acceder a una sucursal específica
   */
  canAccessSucursal(sucursalId: string, assignedSucursales: string[]): boolean {
    if (this.isRegular) {
      // Empleados regulares solo pueden acceder a su sucursal asignada
      return assignedSucursales.includes(sucursalId);
    }

    if (this.isAdministrative) {
      // Empleados administrativos pueden acceder a múltiples sucursales
      return assignedSucursales.length <= this.maxSucursalesAccess;
    }

    return false;
  }

  /**
   * Calcula si un día cumple con los requisitos mínimos
   */
  meetsDailyRequirements(hoursWorked: number): boolean {
    return hoursWorked >= this.minimumHoursPerDay;
  }

  /**
   * Determina si se debe procesar un registro de asistencia
   */
  shouldProcessAttendanceRecord(hoursWorked: number, date: Date): boolean {
    // Para empleados administrativos, solo procesar si cumple horas mínimas
    if (this.isAdministrative) {
      return this.meetsDailyRequirements(hoursWorked);
    }

    // Para empleados regulares, procesar todos los registros
    return true;
  }

  /**
   * Obtiene las reglas de validación específicas
   */
  getValidationRules(): IEmployeeTypeValidationRules {
    const baseRules: IEmployeeTypeValidationRules = {
      minimumAge: 18,
      backgroundCheckRequired: false
    };

    if (this.isAdministrative) {
      return {
        ...baseRules,
        minimumAge: 21,
        requiredEducation: ['Bachillerato', 'Universidad'],
        requiredExperience: 2,
        backgroundCheckRequired: true
      };
    }

    return baseRules;
  }

  /**
   * Construye la configuración específica del tipo de empleado
   */
  private buildConfiguration(): IEmployeeTypeConfiguration {
    const enumConfig = getEmployeeTypeConfig(this._type);
    const scheduleConfig = getDefaultSchedule(this._type);
    const overtimeConfig = getOvertimeRules(this._type);

    const permissions: IEmployeeTypePermissions = {
      canAccessMultipleSucursales: enumConfig.canWorkMultipleSucursales,
      canModifyOwnAttendance: this._type === EmployeeType.REGULAR,
      requiresApprovalForChanges: this._type === EmployeeType.ADMINISTRATIVO,
      canViewOthersAttendance: this._type === EmployeeType.ADMINISTRATIVO,
      canGenerateReports: this._type === EmployeeType.ADMINISTRATIVO,
      maxSucursalesAccess: this._type === EmployeeType.ADMINISTRATIVO ? 10 : 1
    };

    const schedule: IEmployeeTypeSchedule = {
      defaultStartTime: scheduleConfig.defaultStartTime,
      defaultEndTime: scheduleConfig.defaultEndTime,
      breakDuration: scheduleConfig.breakDuration,
      flexibilityMinutes: scheduleConfig.flexibilityMinutes,
      canHaveFlexibleSchedule: this._type === EmployeeType.ADMINISTRATIVO,
      requiresFixedSchedule: this._type === EmployeeType.REGULAR
    };

    const overtime: IEmployeeTypeOvertime = {
      dailyThreshold: overtimeConfig.dailyThreshold,
      weeklyThreshold: overtimeConfig.weeklyThreshold,
      calculatesRecargo: overtimeConfig.calculatesRecargo,
      calculatesSupplementary: overtimeConfig.calculatesSupplementary,
      calculatesExtraordinary: overtimeConfig.calculatesExtraordinary,
      maxOvertimePerDay: overtimeConfig.maxOvertimePerDay,
      effectiveHoursOnly: overtimeConfig.effectiveHoursOnly
    };

    return {
      type: this._type,
      hasFixedSchedule: enumConfig.hasFixedSchedule,
      canWorkMultipleSucursales: enumConfig.canWorkMultipleSucursales,
      calculationMethod: enumConfig.calculationMethod as 'ENTRY_EXIT' | 'FIRST_LAST_MOVEMENT',
      minimumHoursPerDay: enumConfig.minimumHoursPerDay,
      requiresExactTimeTracking: enumConfig.requiresExactTimeTracking,
      allowsManualTimeAdjustment: enumConfig.allowsManualTimeAdjustment,
      overtimeCalculation: enumConfig.overtimeCalculation as 'STANDARD' | 'EFFECTIVE_HOURS',
      permissions,
      schedule,
      overtime
    };
  }

  /**
   * Valida el tipo de empleado
   */
  private validate(): boolean {
    if (!Object.values(EmployeeType).includes(this._type)) {
      this._errors.push('Tipo de empleado no reconocido');
      return false;
    }

    return true;
  }

  /**
   * Compara con otro tipo de empleado
   */
  equals(other: EmployeeTypeVO): boolean {
    return this._type === other._type;
  }

  /**
   * Determina si un tipo es superior a otro en jerarquía
   */
  isHigherThan(other: EmployeeTypeVO): boolean {
    const hierarchy = {
      [EmployeeType.ADMINISTRATIVO]: 2,
      [EmployeeType.REGULAR]: 1
    };

    return hierarchy[this._type] > hierarchy[other._type];
  }

  /**
   * Obtiene la descripción del tipo de empleado
   */
  getDescription(): string {
    switch (this._type) {
      case EmployeeType.REGULAR:
        return 'Empleado Regular - Horario fijo, asignado a una sucursal específica';
      case EmployeeType.ADMINISTRATIVO:
        return 'Empleado Administrativo - Horario flexible, acceso multi-sucursal';
      default:
        return 'Tipo de empleado desconocido';
    }
  }

  /**
   * Obtiene las características principales
   */
  getKeyFeatures(): string[] {
    const features: string[] = [];

    if (this.hasFixedSchedule) {
      features.push('Horario fijo');
    } else {
      features.push('Horario flexible');
    }

    if (this.canWorkMultipleSucursales) {
      features.push('Multi-sucursal');
    } else {
      features.push('Sucursal única');
    }

    features.push(`Método: ${this.calculationMethod}`);
    features.push(`Mínimo: ${this.minimumHoursPerDay}h/día`);

    if (this.overtime.calculatesRecargo) {
      features.push('Recargo 25%');
    }

    if (this.overtime.calculatesSupplementary) {
      features.push('Suplementarias 50%');
    }

    if (this.overtime.calculatesExtraordinary) {
      features.push('Extraordinarias 100%');
    }

    return features;
  }

  /**
   * Convierte a string representativo
   */
  toString(): string {
    return `${this._type} - ${this.getDescription()}`;
  }

  /**
   * Convierte a JSON para serialización
   */
  toJSON(): object {
    return {
      type: this._type,
      configuration: this._configuration,
      isValid: this._isValid,
      description: this.getDescription(),
      keyFeatures: this.getKeyFeatures()
    };
  }

  /**
   * Crea instancia para empleado regular
   */
  static createRegular(): EmployeeTypeVO {
    return new EmployeeTypeVO(EmployeeType.REGULAR);
  }

  /**
   * Crea instancia para empleado administrativo
   */
  static createAdministrative(): EmployeeTypeVO {
    return new EmployeeTypeVO(EmployeeType.ADMINISTRATIVO);
  }

  /**
   * Crea instancia desde string
   */
  static fromString(typeString: string): EmployeeTypeVO {
    const upperType = typeString.toUpperCase();
    
    if (upperType === 'REGULAR' || upperType === 'R') {
      return EmployeeTypeVO.createRegular();
    }
    
    if (upperType === 'ADMINISTRATIVO' || upperType === 'ADMIN' || upperType === 'A') {
      return EmployeeTypeVO.createAdministrative();
    }
    
    throw new Error(`Tipo de empleado no reconocido: ${typeString}`);
  }

  /**
   * Valida si un string es un tipo válido
   */
  static isValidType(typeString: string): boolean {
    try {
      EmployeeTypeVO.fromString(typeString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene todos los tipos disponibles
   */
  static getAllTypes(): EmployeeTypeVO[] {
    return Object.values(EmployeeType).map(type => new EmployeeTypeVO(type));
  }

  /**
   * Compara configuraciones de dos tipos
   */
  static compareConfigurations(type1: EmployeeTypeVO, type2: EmployeeTypeVO): {
    similarities: string[];
    differences: string[];
  } {
    const similarities: string[] = [];
    const differences: string[] = [];

    const config1 = type1.configuration;
    const config2 = type2.configuration;

    // Comparar características principales
    if (config1.hasFixedSchedule === config2.hasFixedSchedule) {
      similarities.push(`Ambos ${config1.hasFixedSchedule ? 'tienen' : 'no tienen'} horario fijo`);
    } else {
      differences.push(`Horario: ${type1.type} ${config1.hasFixedSchedule ? 'fijo' : 'flexible'} vs ${type2.type} ${config2.hasFixedSchedule ? 'fijo' : 'flexible'}`);
    }

    if (config1.canWorkMultipleSucursales === config2.canWorkMultipleSucursales) {
      similarities.push(`Ambos ${config1.canWorkMultipleSucursales ? 'pueden' : 'no pueden'} trabajar en múltiples sucursales`);
    } else {
      differences.push(`Sucursales: ${type1.type} ${config1.canWorkMultipleSucursales ? 'multi' : 'única'} vs ${type2.type} ${config2.canWorkMultipleSucursales ? 'multi' : 'única'}`);
    }

    if (config1.minimumHoursPerDay === config2.minimumHoursPerDay) {
      similarities.push(`Ambos requieren ${config1.minimumHoursPerDay}h mínimas por día`);
    } else {
      differences.push(`Horas mínimas: ${type1.type} ${config1.minimumHoursPerDay}h vs ${type2.type} ${config2.minimumHoursPerDay}h`);
    }

    // Comparar overtime
    const ot1 = config1.overtime;
    const ot2 = config2.overtime;

    if (ot1.calculatesRecargo === ot2.calculatesRecargo) {
      similarities.push(`Ambos ${ot1.calculatesRecargo ? 'calculan' : 'no calculan'} recargo`);
    } else {
      differences.push(`Recargo: ${type1.type} ${ot1.calculatesRecargo ? 'sí' : 'no'} vs ${type2.type} ${ot2.calculatesRecargo ? 'sí' : 'no'}`);
    }

    return { similarities, differences };
  }
}

export default EmployeeTypeVO;