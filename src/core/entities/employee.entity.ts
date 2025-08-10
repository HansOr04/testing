/**
 * EMPLOYEE ENTITY
 * Entidad de empleado del sistema de asistencia
 * Maneja información personal, tipo de empleado y asignaciones
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { EmployeeType } from '@core/enums/employee-type.enum';
import { Cedula } from '@core/value-objects/cedula.vo';
import { EmployeeTypeVO } from '@core/value-objects/employee-type.vo';
import { WorkSchedule } from '@core/value-objects/work-schedule.vo';
import { validateRequired, validateTextLength } from '@shared/utils/validation.util';

/**
 * Datos para crear un empleado
 */
export interface ICreateEmployeeData extends ICreateBaseEntityData {
  cedula: string;
  firstName: string;
  lastName: string;
  employeeType: EmployeeType;
  primarySucursalId: string;
  areaId: string;
  additionalSucursales?: string[];
  schedule?: WorkSchedule;
  phoneNumber?: string;
  email?: string;
  address?: string;
  emergencyContact?: IEmergencyContact;
  hireDate?: Date;
  salary?: number;
  position?: string;
  notes?: string;
}

/**
 * Datos para actualizar un empleado
 */
export interface IUpdateEmployeeData extends IUpdateBaseEntityData {
  firstName?: string;
  lastName?: string;
  employeeType?: EmployeeType;
  primarySucursalId?: string;
  areaId?: string;
  additionalSucursales?: string[];
  schedule?: WorkSchedule;
  phoneNumber?: string;
  email?: string;
  address?: string;
  emergencyContact?: IEmergencyContact;
  salary?: number;
  position?: string;
  notes?: string;
}

/**
 * Contacto de emergencia
 */
export interface IEmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  alternatePhone?: string;
}

/**
 * Estadísticas del empleado
 */
export interface IEmployeeStats {
  totalWorkingDays: number;
  totalHoursWorked: number;
  averageDailyHours: number;
  totalOvertimeHours: number;
  attendanceRate: number;
  punctualityRate: number;
  lastAttendanceDate?: Date;
}

/**
 * Información de asignación de sucursales
 */
export interface ISucursalAssignment {
  primarySucursalId: string;
  additionalSucursales: string[];
  canAccessAllSucursales: boolean;
  totalSucursalesAccess: number;
}

export class Employee extends BaseEntity {
  private _cedula: Cedula;
  private _firstName: string;
  private _lastName: string;
  private _employeeType: EmployeeTypeVO;
  private _primarySucursalId: string;
  private _areaId: string;
  private _additionalSucursales: string[];
  private _schedule?: WorkSchedule;
  private _phoneNumber?: string;
  private _email?: string;
  private _address?: string;
  private _emergencyContact?: IEmergencyContact;
  private _hireDate: Date;
  private _salary?: number;
  private _position?: string;
  private _notes?: string;

  constructor(data: ICreateEmployeeData) {
    super(data);

    this._cedula = new Cedula(data.cedula);
    this._firstName = data.firstName.trim();
    this._lastName = data.lastName.trim();
    this._employeeType = new EmployeeTypeVO(data.employeeType);
    this._primarySucursalId = data.primarySucursalId;
    this._areaId = data.areaId;
    this._additionalSucursales = data.additionalSucursales || [];
    this._schedule = data.schedule;
    this._phoneNumber = data.phoneNumber?.trim();
    this._email = data.email?.toLowerCase().trim();
    this._address = data.address?.trim();
    this._emergencyContact = data.emergencyContact;
    this._hireDate = data.hireDate || new Date();
    this._salary = data.salary;
    this._position = data.position?.trim();
    this._notes = data.notes?.trim();

    // Crear horario por defecto si no se proporciona
    if (!this._schedule) {
      this._schedule = this._employeeType.createDefaultSchedule();
    }
  }

  /**
   * Obtiene la cédula del empleado
   */
  get cedula(): Cedula {
    return this._cedula;
  }

  /**
   * Obtiene el número de cédula como string
   */
  get cedulaNumber(): string {
    return this._cedula.value;
  }

  /**
   * Obtiene el nombre del empleado
   */
  get firstName(): string {
    return this._firstName;
  }

  /**
   * Obtiene el apellido del empleado
   */
  get lastName(): string {
    return this._lastName;
  }

  /**
   * Obtiene el nombre completo
   */
  get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  /**
   * Obtiene el nombre para mostrar (Apellido, Nombre)
   */
  get displayName(): string {
    return `${this._lastName}, ${this._firstName}`;
  }

  /**
   * Obtiene el tipo de empleado
   */
  get employeeType(): EmployeeTypeVO {
    return this._employeeType;
  }

  /**
   * Obtiene el tipo de empleado como enum
   */
  get employeeTypeEnum(): EmployeeType {
    return this._employeeType.type;
  }

  /**
   * Obtiene la sucursal principal
   */
  get primarySucursalId(): string {
    return this._primarySucursalId;
  }

  /**
   * Obtiene el área de trabajo
   */
  get areaId(): string {
    return this._areaId;
  }

  /**
   * Obtiene las sucursales adicionales
   */
  get additionalSucursales(): string[] {
    return [...this._additionalSucursales];
  }

  /**
   * Obtiene todas las sucursales a las que tiene acceso
   */
  get allSucursales(): string[] {
    return [this._primarySucursalId, ...this._additionalSucursales];
  }

  /**
   * Obtiene el horario de trabajo
   */
  get schedule(): WorkSchedule | undefined {
    return this._schedule;
  }

  /**
   * Obtiene el número de teléfono
   */
  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  /**
   * Obtiene el email del empleado
   */
  get email(): string | undefined {
    return this._email;
  }

  /**
   * Obtiene la dirección
   */
  get address(): string | undefined {
    return this._address;
  }

  /**
   * Obtiene el contacto de emergencia
   */
  get emergencyContact(): IEmergencyContact | undefined {
    return this._emergencyContact ? { ...this._emergencyContact } : undefined;
  }

  /**
   * Obtiene la fecha de contratación
   */
  get hireDate(): Date {
    return new Date(this._hireDate);
  }

  /**
   * Obtiene el salario
   */
  get salary(): number | undefined {
    return this._salary;
  }

  /**
   * Obtiene la posición/cargo
   */
  get position(): string | undefined {
    return this._position;
  }

  /**
   * Obtiene las notas
   */
  get notes(): string | undefined {
    return this._notes;
  }

  /**
   * Verifica si es empleado regular
   */
  get isRegular(): boolean {
    return this._employeeType.isRegular;
  }

  /**
   * Verifica si es empleado administrativo
   */
  get isAdministrative(): boolean {
    return this._employeeType.isAdministrative;
  }

  /**
   * Verifica si puede trabajar en múltiples sucursales
   */
  get canWorkMultipleSucursales(): boolean {
    return this._employeeType.canWorkMultipleSucursales;
  }

  /**
   * Obtiene el número total de sucursales con acceso
   */
  get totalSucursalesAccess(): number {
    return this.allSucursales.length;
  }

  /**
   * Calcula los años de servicio
   */
  get yearsOfService(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._hireDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  }

  /**
   * Calcula los días de servicio
   */
  get daysOfService(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._hireDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica si es un empleado nuevo (menos de 90 días)
   */
  get isNewEmployee(): boolean {
    return this.daysOfService <= 90;
  }

  /**
   * Verifica si tiene horario asignado
   */
  get hasSchedule(): boolean {
    return !!this._schedule;
  }

  /**
   * Actualiza información del empleado
   */
  update(data: IUpdateEmployeeData): void {
    if (data.firstName !== undefined) {
      if (!data.firstName.trim()) {
        throw new Error('Nombre es requerido');
      }
      this._firstName = data.firstName.trim();
    }

    if (data.lastName !== undefined) {
      if (!data.lastName.trim()) {
        throw new Error('Apellido es requerido');
      }
      this._lastName = data.lastName.trim();
    }

    if (data.employeeType !== undefined) {
      this._employeeType = new EmployeeTypeVO(data.employeeType);
    }

    if (data.primarySucursalId !== undefined) {
      this._primarySucursalId = data.primarySucursalId;
    }

    if (data.areaId !== undefined) {
      this._areaId = data.areaId;
    }

    if (data.additionalSucursales !== undefined) {
      this._additionalSucursales = [...data.additionalSucursales];
    }

    if (data.schedule !== undefined) {
      this._schedule = data.schedule;
    }

    if (data.phoneNumber !== undefined) {
      this._phoneNumber = data.phoneNumber?.trim();
    }

    if (data.email !== undefined) {
      this._email = data.email?.toLowerCase().trim();
    }

    if (data.address !== undefined) {
      this._address = data.address?.trim();
    }

    if (data.emergencyContact !== undefined) {
      this._emergencyContact = data.emergencyContact;
    }

    if (data.salary !== undefined) {
      this._salary = data.salary;
    }

    if (data.position !== undefined) {
      this._position = data.position?.trim();
    }

    if (data.notes !== undefined) {
      this._notes = data.notes?.trim();
    }

    this.updateEntity(data);
  }

  /**
   * Cambia el tipo de empleado
   */
  changeEmployeeType(newType: EmployeeType): void {
    if (this._employeeType.type === newType) return;

    const oldType = this._employeeType;
    this._employeeType = new EmployeeTypeVO(newType);

    // Si cambia a regular y tiene múltiples sucursales, limpiar adicionales
    if (newType === EmployeeType.REGULAR && this._additionalSucursales.length > 0) {
      this._additionalSucursales = [];
    }

    // Actualizar horario si es necesario
    if (!this._schedule || !this._employeeType.validateSchedule(this._schedule).isValid) {
      this._schedule = this._employeeType.createDefaultSchedule();
    }

    this.touch();
  }

  /**
   * Asigna a una sucursal principal
   */
  assignToPrimarySucursal(sucursalId: string): void {
    this._primarySucursalId = sucursalId;
    
    // Remover de adicionales si estaba ahí
    this._additionalSucursales = this._additionalSucursales.filter(id => id !== sucursalId);
    
    this.touch();
  }

  /**
   * Añade una sucursal adicional
   */
  addAdditionalSucursal(sucursalId: string): void {
    if (!this.canWorkMultipleSucursales) {
      throw new Error('Este tipo de empleado no puede trabajar en múltiples sucursales');
    }

    if (sucursalId === this._primarySucursalId) {
      throw new Error('No se puede añadir la sucursal principal como adicional');
    }

    if (!this._additionalSucursales.includes(sucursalId)) {
      if (this.totalSucursalesAccess >= this._employeeType.maxSucursalesAccess) {
        throw new Error(`Empleado ya tiene acceso al máximo de sucursales permitidas (${this._employeeType.maxSucursalesAccess})`);
      }
      
      this._additionalSucursales.push(sucursalId);
      this.touch();
    }
  }

  /**
   * Remueve una sucursal adicional
   */
  removeAdditionalSucursal(sucursalId: string): void {
    const index = this._additionalSucursales.indexOf(sucursalId);
    if (index > -1) {
      this._additionalSucursales.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Verifica si puede acceder a una sucursal específica
   */
  canAccessSucursal(sucursalId: string): boolean {
    return this.allSucursales.includes(sucursalId);
  }

  /**
   * Asigna a un área de trabajo
   */
  assignToArea(areaId: string): void {
    this._areaId = areaId;
    this.touch();
  }

  /**
   * Establece un nuevo horario de trabajo
   */
  setSchedule(schedule: WorkSchedule): void {
    const validation = this._employeeType.validateSchedule(schedule);
    if (!validation.isValid) {
      throw new Error(`Horario inválido: ${validation.errors.join(', ')}`);
    }

    this._schedule = schedule;
    this.touch();
  }

  /**
   * Actualiza información de contacto
   */
  updateContactInfo(data: {
    phoneNumber?: string;
    email?: string;
    address?: string;
  }): void {
    if (data.phoneNumber !== undefined) {
      this._phoneNumber = data.phoneNumber?.trim();
    }

    if (data.email !== undefined) {
      this._email = data.email?.toLowerCase().trim();
    }

    if (data.address !== undefined) {
      this._address = data.address?.trim();
    }

    this.touch();
  }

  /**
   * Actualiza contacto de emergencia
   */
  updateEmergencyContact(contact: IEmergencyContact): void {
    if (!contact.name.trim()) {
      throw new Error('Nombre del contacto de emergencia es requerido');
    }

    if (!contact.phoneNumber.trim()) {
      throw new Error('Teléfono del contacto de emergencia es requerido');
    }

    this._emergencyContact = { ...contact };
    this.touch();
  }

  /**
   * Actualiza información laboral
   */
  updateJobInfo(data: {
    salary?: number;
    position?: string;
    notes?: string;
  }): void {
    if (data.salary !== undefined) {
      if (data.salary < 0) {
        throw new Error('Salario no puede ser negativo');
      }
      this._salary = data.salary;
    }

    if (data.position !== undefined) {
      this._position = data.position?.trim();
    }

    if (data.notes !== undefined) {
      this._notes = data.notes?.trim();
    }

    this.touch();
  }

  /**
   * Obtiene información de asignación de sucursales
   */
  getSucursalAssignment(): ISucursalAssignment {
    return {
      primarySucursalId: this._primarySucursalId,
      additionalSucursales: [...this._additionalSucursales],
      canAccessAllSucursales: this.canWorkMultipleSucursales,
      totalSucursalesAccess: this.totalSucursalesAccess
    };
  }

  /**
   * Obtiene el método de cálculo de horas para este empleado
   */
  getCalculationMethod(): 'ENTRY_EXIT' | 'FIRST_LAST_MOVEMENT' {
    return this._employeeType.calculationMethod as 'ENTRY_EXIT' | 'FIRST_LAST_MOVEMENT';
  }

  /**
   * Obtiene las horas mínimas por día para este empleado
   */
  getMinimumHoursPerDay(): number {
    return this._employeeType.minimumHoursPerDay;
  }

  /**
   * Verifica si un día cumple con los requisitos mínimos
   */
  meetsDailyRequirements(hoursWorked: number): boolean {
    return this._employeeType.meetsDailyRequirements(hoursWorked);
  }

  /**
   * Determina si se debe procesar un registro de asistencia
   */
  shouldProcessAttendanceRecord(hoursWorked: number, date: Date): boolean {
    return this._employeeType.shouldProcessAttendanceRecord(hoursWorked, date);
  }

  /**
   * Obtiene información para el cálculo de overtime
   */
  getOvertimeConfig(): {
    dailyThreshold: number;
    weeklyThreshold: number;
    calculatesRecargo: boolean;
    calculatesSupplementary: boolean;
    calculatesExtraordinary: boolean;
    maxOvertimePerDay: number;
    effectiveHoursOnly?: boolean;
  } {
    return this._employeeType.overtime;
  }

  /**
   * Crea estadísticas básicas del empleado
   */
  createBasicStats(): Omit<IEmployeeStats, 'totalWorkingDays' | 'totalHoursWorked' | 'averageDailyHours' | 'totalOvertimeHours' | 'attendanceRate' | 'punctualityRate' | 'lastAttendanceDate'> {
    return {
      // Las estadísticas reales se calcularían con datos de asistencia
      // Aquí solo retornamos la estructura base
    };
  }

  /**
   * Obtiene un resumen del empleado
   */
  getSummary(): string {
    const type = this.isAdministrative ? 'Administrativo' : 'Regular';
    const sucursales = this.totalSucursalesAccess > 1 ? ` (${this.totalSucursalesAccess} sucursales)` : '';
    return `${this.displayName} - ${type}${sucursales} - ${this._position || 'Sin cargo'}`;
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    // Validar nombres
    const firstNameValidation = validateRequired(this._firstName, 'Nombre');
    if (!firstNameValidation.isValid) {
      throw new Error(firstNameValidation.errors[0]);
    }

    const lastNameValidation = validateRequired(this._lastName, 'Apellido');
    if (!lastNameValidation.isValid) {
      throw new Error(lastNameValidation.errors[0]);
    }

    // Validar longitud de nombres
    const firstNameLength = validateTextLength(this._firstName, 2, 50, 'Nombre');
    if (!firstNameLength.isValid) {
      throw new Error(firstNameLength.errors[0]);
    }

    const lastNameLength = validateTextLength(this._lastName, 2, 50, 'Apellido');
    if (!lastNameLength.isValid) {
      throw new Error(lastNameLength.errors[0]);
    }

    // Validar IDs requeridos
    if (!this._primarySucursalId.trim()) {
      throw new Error('Sucursal principal es requerida');
    }

    if (!this._areaId.trim()) {
      throw new Error('Área de trabajo es requerida');
    }

    // Validar reglas de negocio para tipo de empleado
    if (this.isRegular && this._additionalSucursales.length > 0) {
      throw new Error('Empleados regulares no pueden tener sucursales adicionales');
    }

    if (this.isAdministrative && this.totalSucursalesAccess > this._employeeType.maxSucursalesAccess) {
      throw new Error(`Empleado administrativo excede el máximo de sucursales permitidas (${this._employeeType.maxSucursalesAccess})`);
    }

    // Validar horario si existe
    if (this._schedule) {
      const scheduleValidation = this._employeeType.validateSchedule(this._schedule);
      if (!scheduleValidation.isValid) {
        throw new Error(`Horario inválido: ${scheduleValidation.errors.join(', ')}`);
      }
    }

    // Validar salario si existe
    if (this._salary !== undefined && this._salary < 0) {
      throw new Error('Salario no puede ser negativo');
    }

    // Validar fecha de contratación
    if (this._hireDate > new Date()) {
      throw new Error('Fecha de contratación no puede ser futura');
    }

    // Validar contacto de emergencia si existe
    if (this._emergencyContact) {
      if (!this._emergencyContact.name.trim()) {
        throw new Error('Nombre del contacto de emergencia es requerido');
      }
      if (!this._emergencyContact.phoneNumber.trim()) {
        throw new Error('Teléfono del contacto de emergencia es requerido');
      }
    }

    // Validar que no haya sucursales duplicadas
    const allSucursalesSet = new Set(this.allSucursales);
    if (allSucursalesSet.size !== this.allSucursales.length) {
      throw new Error('No puede haber sucursales duplicadas');
    }
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      ...this.toBaseObject(),
      cedula: this._cedula.toJSON(),
      cedulaNumber: this._cedula.value,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      displayName: this.displayName,
      employeeType: this._employeeType.toJSON(),
      employeeTypeEnum: this._employeeType.type,
      primarySucursalId: this._primarySucursalId,
      areaId: this._areaId,
      additionalSucursales: this._additionalSucursales,
      allSucursales: this.allSucursales,
      totalSucursalesAccess: this.totalSucursalesAccess,
      schedule: this._schedule?.toJSON(),
      phoneNumber: this._phoneNumber,
      email: this._email,
      address: this._address,
      emergencyContact: this._emergencyContact,
      hireDate: this._hireDate,
      salary: this._salary,
      position: this._position,
      notes: this._notes,
      yearsOfService: this.yearsOfService,
      daysOfService: this.daysOfService,
      isNewEmployee: this.isNewEmployee,
      isRegular: this.isRegular,
      isAdministrative: this.isAdministrative,
      canWorkMultipleSucursales: this.canWorkMultipleSucursales,
      hasSchedule: this.hasSchedule,
      calculationMethod: this.getCalculationMethod(),
      minimumHoursPerDay: this.getMinimumHoursPerDay(),
      overtimeConfig: this.getOvertimeConfig()
    };
  }

  /**
   * Convierte a JSON básico (solo información esencial)
   */
  toBasicJSON(): object {
    return {
      id: this.id,
      cedula: this._cedula.value,
      fullName: this.fullName,
      displayName: this.displayName,
      employeeType: this._employeeType.type,
      primarySucursalId: this._primarySucursalId,
      areaId: this._areaId,
      position: this._position,
      isActive: this.isActive,
      canWorkMultipleSucursales: this.canWorkMultipleSucursales,
      totalSucursalesAccess: this.totalSucursalesAccess
    };
  }

  /**
   * Crea una copia superficial
   */
  protected shallowCopy(): Employee {
    const data: ICreateEmployeeData = {
      ...this.cloneBaseData(),
      cedula: this._cedula.value,
      firstName: this._firstName,
      lastName: this._lastName,
      employeeType: this._employeeType.type,
      primarySucursalId: this._primarySucursalId,
      areaId: this._areaId,
      additionalSucursales: [...this._additionalSucursales],
      schedule: this._schedule,
      phoneNumber: this._phoneNumber,
      email: this._email,
      address: this._address,
      emergencyContact: this._emergencyContact ? { ...this._emergencyContact } : undefined,
      hireDate: new Date(this._hireDate),
      salary: this._salary,
      position: this._position,
      notes: this._notes
    };

    return new Employee(data);
  }

  /**
   * Crea un empleado regular
   */
  static createRegular(data: {
    cedula: string;
    firstName: string;
    lastName: string;
    primarySucursalId: string;
    areaId: string;
    schedule?: WorkSchedule;
    hireDate?: Date;
    position?: string;
  }): Employee {
    return new Employee({
      ...data,
      employeeType: EmployeeType.REGULAR,
      hireDate: data.hireDate || new Date()
    });
  }

  /**
   * Crea un empleado administrativo
   */
  static createAdministrative(data: {
    cedula: string;
    firstName: string;
    lastName: string;
    primarySucursalId: string;
    areaId: string;
    additionalSucursales?: string[];
    schedule?: WorkSchedule;
    hireDate?: Date;
    position?: string;
  }): Employee {
    return new Employee({
      ...data,
      employeeType: EmployeeType.ADMINISTRATIVO,
      hireDate: data.hireDate || new Date()
    });
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateEmployeeData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar cédula
    try {
      new Cedula(data.cedula);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Cédula inválida');
    }

    // Validar nombres
    const firstNameValidation = validateRequired(data.firstName, 'Nombre');
    if (!firstNameValidation.isValid) {
      errors.push(...firstNameValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.firstName, 2, 50, 'Nombre');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    const lastNameValidation = validateRequired(data.lastName, 'Apellido');
    if (!lastNameValidation.isValid) {
      errors.push(...lastNameValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.lastName, 2, 50, 'Apellido');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    // Validar tipo de empleado
    if (!Object.values(EmployeeType).includes(data.employeeType)) {
      errors.push('Tipo de empleado inválido');
    }

    // Validar IDs requeridos
    if (!data.primarySucursalId?.trim()) {
      errors.push('Sucursal principal es requerida');
    }

    if (!data.areaId?.trim()) {
      errors.push('Área de trabajo es requerida');
    }

    // Validar reglas de negocio
    if (data.employeeType === EmployeeType.REGULAR && data.additionalSucursales && data.additionalSucursales.length > 0) {
      errors.push('Empleados regulares no pueden tener sucursales adicionales');
    }

    // Validar fecha de contratación
    if (data.hireDate && data.hireDate > new Date()) {
      errors.push('Fecha de contratación no puede ser futura');
    }

    // Validar salario
    if (data.salary !== undefined && data.salary < 0) {
      errors.push('Salario no puede ser negativo');
    }

    // Validar contacto de emergencia
    if (data.emergencyContact) {
      if (!data.emergencyContact.name?.trim()) {
        errors.push('Nombre del contacto de emergencia es requerido');
      }
      if (!data.emergencyContact.phoneNumber?.trim()) {
        errors.push('Teléfono del contacto de emergencia es requerido');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default Employee;