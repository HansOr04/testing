/**
 * SUCURSAL ENTITY
 * Entidad de sucursal del sistema de asistencia
 * Maneja información de ubicaciones de trabajo
 */

import BaseEntity, { ICreateBaseEntityData, IUpdateBaseEntityData } from './base.entity';
import { validateRequired, validateTextLength } from '@shared/utils/validation.util';

/**
 * Datos para crear una sucursal
 */
export interface ICreateSucursalData extends ICreateBaseEntityData {
  nombre: string;
  codigo: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  telefono?: string;
  email?: string;
  gerente?: string;
  capacidadEmpleados?: number;
  horarioApertura?: string;
  horarioCierre?: string;
  timezone?: string;
  descripcion?: string;
}

/**
 * Datos para actualizar una sucursal
 */
export interface IUpdateSucursalData extends IUpdateBaseEntityData {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  gerente?: string;
  capacidadEmpleados?: number;
  horarioApertura?: string;
  horarioCierre?: string;
  timezone?: string;
  descripcion?: string;
}

/**
 * Estadísticas de la sucursal
 */
export interface ISucursalStats {
  totalEmpleados: number;
  empleadosActivos: number;
  empleadosRegulares: number;
  empleadosAdministrativos: number;
  totalAreas: number;
  dispositivosBiometricos: number;
  promedioAsistenciaMensual: number;
  horasTrabajadasMes: number;
}

/**
 * Información de operación de la sucursal
 */
export interface ISucursalOperation {
  horarioApertura?: string;
  horarioCierre?: string;
  timezone: string;
  estaAbierta: boolean;
  horasOperacion?: number;
  proximaApertura?: Date;
  proximoCierre?: Date;
}

export class Sucursal extends BaseEntity {
  private _nombre: string;
  private _codigo: string;
  private _direccion: string;
  private _ciudad: string;
  private _provincia: string;
  private _telefono?: string;
  private _email?: string;
  private _gerente?: string;
  private _capacidadEmpleados?: number;
  private _horarioApertura?: string;
  private _horarioCierre?: string;
  private _timezone: string;
  private _descripcion?: string;

  constructor(data: ICreateSucursalData) {
    super(data);

    this._nombre = data.nombre.trim();
    this._codigo = data.codigo.toUpperCase().trim();
    this._direccion = data.direccion.trim();
    this._ciudad = data.ciudad.trim();
    this._provincia = data.provincia.trim();
    this._telefono = data.telefono?.trim();
    this._email = data.email?.toLowerCase().trim();
    this._gerente = data.gerente?.trim();
    this._capacidadEmpleados = data.capacidadEmpleados;
    this._horarioApertura = data.horarioApertura?.trim();
    this._horarioCierre = data.horarioCierre?.trim();
    this._timezone = data.timezone || 'America/Guayaquil';
    this._descripcion = data.descripcion?.trim();
  }

  /**
   * Obtiene el nombre de la sucursal
   */
  get nombre(): string {
    return this._nombre;
  }

  /**
   * Obtiene el código único de la sucursal
   */
  get codigo(): string {
    return this._codigo;
  }

  /**
   * Obtiene la dirección completa
   */
  get direccion(): string {
    return this._direccion;
  }

  /**
   * Obtiene la ciudad
   */
  get ciudad(): string {
    return this._ciudad;
  }

  /**
   * Obtiene la provincia
   */
  get provincia(): string {
    return this._provincia;
  }

  /**
   * Obtiene la dirección completa formateada
   */
  get direccionCompleta(): string {
    return `${this._direccion}, ${this._ciudad}, ${this._provincia}`;
  }

  /**
   * Obtiene el teléfono
   */
  get telefono(): string | undefined {
    return this._telefono;
  }

  /**
   * Obtiene el email
   */
  get email(): string | undefined {
    return this._email;
  }

  /**
   * Obtiene el gerente
   */
  get gerente(): string | undefined {
    return this._gerente;
  }

  /**
   * Obtiene la capacidad de empleados
   */
  get capacidadEmpleados(): number | undefined {
    return this._capacidadEmpleados;
  }

  /**
   * Obtiene el horario de apertura
   */
  get horarioApertura(): string | undefined {
    return this._horarioApertura;
  }

  /**
   * Obtiene el horario de cierre
   */
  get horarioCierre(): string | undefined {
    return this._horarioCierre;
  }

  /**
   * Obtiene la zona horaria
   */
  get timezone(): string {
    return this._timezone;
  }

  /**
   * Obtiene la descripción
   */
  get descripcion(): string | undefined {
    return this._descripcion;
  }

  /**
   * Verifica si tiene horarios de operación definidos
   */
  get tieneHorarioOperacion(): boolean {
    return !!(this._horarioApertura && this._horarioCierre);
  }

  /**
   * Calcula las horas de operación diarias
   */
  get horasOperacionDiarias(): number | undefined {
    if (!this.tieneHorarioOperacion) return undefined;

    const apertura = this.parseTime(this._horarioApertura!);
    const cierre = this.parseTime(this._horarioCierre!);
    
    if (!apertura || !cierre) return undefined;

    let diff = cierre - apertura;
    if (diff < 0) diff += 24 * 60; // Manejo de horarios que cruzan medianoche

    return diff / 60; // Retornar en horas
  }

  /**
   * Obtiene el nombre para mostrar
   */
  get displayName(): string {
    return `${this._codigo} - ${this._nombre}`;
  }

  /**
   * Obtiene información de ubicación
   */
  get ubicacion(): { direccion: string; ciudad: string; provincia: string; direccionCompleta: string } {
    return {
      direccion: this._direccion,
      ciudad: this._ciudad,
      provincia: this._provincia,
      direccionCompleta: this.direccionCompleta
    };
  }

  /**
   * Actualiza información de la sucursal
   */
  update(data: IUpdateSucursalData): void {
    if (data.nombre !== undefined) {
      if (!data.nombre.trim()) {
        throw new Error('Nombre de sucursal es requerido');
      }
      this._nombre = data.nombre.trim();
    }

    if (data.direccion !== undefined) {
      if (!data.direccion.trim()) {
        throw new Error('Dirección es requerida');
      }
      this._direccion = data.direccion.trim();
    }

    if (data.ciudad !== undefined) {
      if (!data.ciudad.trim()) {
        throw new Error('Ciudad es requerida');
      }
      this._ciudad = data.ciudad.trim();
    }

    if (data.provincia !== undefined) {
      if (!data.provincia.trim()) {
        throw new Error('Provincia es requerida');
      }
      this._provincia = data.provincia.trim();
    }

    if (data.telefono !== undefined) {
      this._telefono = data.telefono?.trim();
    }

    if (data.email !== undefined) {
      this._email = data.email?.toLowerCase().trim();
    }

    if (data.gerente !== undefined) {
      this._gerente = data.gerente?.trim();
    }

    if (data.capacidadEmpleados !== undefined) {
      if (data.capacidadEmpleados !== null && data.capacidadEmpleados < 1) {
        throw new Error('Capacidad de empleados debe ser mayor a 0');
      }
      this._capacidadEmpleados = data.capacidadEmpleados || undefined;
    }

    if (data.horarioApertura !== undefined) {
      this._horarioApertura = data.horarioApertura?.trim();
    }

    if (data.horarioCierre !== undefined) {
      this._horarioCierre = data.horarioCierre?.trim();
    }

    if (data.timezone !== undefined) {
      this._timezone = data.timezone || 'America/Guayaquil';
    }

    if (data.descripcion !== undefined) {
      this._descripcion = data.descripcion?.trim();
    }

    this.updateEntity(data);
  }

  /**
   * Establece horarios de operación
   */
  setHorarioOperacion(apertura: string, cierre: string): void {
    if (!this.isValidTimeFormat(apertura)) {
      throw new Error('Formato de hora de apertura inválido (usar HH:MM)');
    }

    if (!this.isValidTimeFormat(cierre)) {
      throw new Error('Formato de hora de cierre inválido (usar HH:MM)');
    }

    this._horarioApertura = apertura;
    this._horarioCierre = cierre;
    this.touch();
  }

  /**
   * Actualiza información de contacto
   */
  updateContacto(telefono?: string, email?: string): void {
    if (telefono !== undefined) {
      this._telefono = telefono?.trim();
    }

    if (email !== undefined) {
      this._email = email?.toLowerCase().trim();
    }

    this.touch();
  }

  /**
   * Asigna un gerente
   */
  assignGerente(gerente: string): void {
    this._gerente = gerente.trim();
    this.touch();
  }

  /**
   * Remueve el gerente
   */
  removeGerente(): void {
    this._gerente = undefined;
    this.touch();
  }

  /**
   * Establece la capacidad de empleados
   */
  setCapacidadEmpleados(capacidad: number): void {
    if (capacidad < 1) {
      throw new Error('Capacidad debe ser mayor a 0');
    }
    this._capacidadEmpleados = capacidad;
    this.touch();
  }

  /**
   * Verifica si está actualmente abierta
   */
  estaAbierta(fecha: Date = new Date()): boolean {
    if (!this.tieneHorarioOperacion) return true; // Sin horarios = siempre abierta

    const horaActual = fecha.getHours() * 60 + fecha.getMinutes();
    const apertura = this.parseTime(this._horarioApertura!);
    const cierre = this.parseTime(this._horarioCierre!);

    if (!apertura || !cierre) return true;

    // Manejar horarios que cruzan medianoche
    if (cierre < apertura) {
      return horaActual >= apertura || horaActual <= cierre;
    }

    return horaActual >= apertura && horaActual <= cierre;
  }

  /**
   * Obtiene información de operación
   */
  getOperationInfo(fecha: Date = new Date()): ISucursalOperation {
    return {
      horarioApertura: this._horarioApertura,
      horarioCierre: this._horarioCierre,
      timezone: this._timezone,
      estaAbierta: this.estaAbierta(fecha),
      horasOperacion: this.horasOperacionDiarias,
      proximaApertura: this.getProximaApertura(fecha),
      proximoCierre: this.getProximoCierre(fecha)
    };
  }

  /**
   * Obtiene la próxima apertura
   */
  private getProximaApertura(fecha: Date): Date | undefined {
    if (!this._horarioApertura) return undefined;

    const apertura = this.parseTime(this._horarioApertura);
    if (!apertura) return undefined;

    const proximaApertura = new Date(fecha);
    proximaApertura.setHours(Math.floor(apertura / 60), apertura % 60, 0, 0);

    // Si ya pasó la hora de apertura hoy, calcular para mañana
    if (proximaApertura <= fecha) {
      proximaApertura.setDate(proximaApertura.getDate() + 1);
    }

    return proximaApertura;
  }

  /**
   * Obtiene el próximo cierre
   */
  private getProximoCierre(fecha: Date): Date | undefined {
    if (!this._horarioCierre) return undefined;

    const cierre = this.parseTime(this._horarioCierre);
    if (!cierre) return undefined;

    const proximoCierre = new Date(fecha);
    proximoCierre.setHours(Math.floor(cierre / 60), cierre % 60, 0, 0);

    // Si ya pasó la hora de cierre hoy, calcular para mañana
    if (proximoCierre <= fecha) {
      proximoCierre.setDate(proximoCierre.getDate() + 1);
    }

    return proximoCierre;
  }

  /**
   * Parsea un string de tiempo HH:MM a minutos desde medianoche
   */
  private parseTime(timeStr: string): number | null {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }

  /**
   * Valida formato de tiempo HH:MM
   */
  private isValidTimeFormat(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  /**
   * Obtiene un resumen de la sucursal
   */
  getSummary(): string {
    const status = this.isActive ? 'Activa' : 'Inactiva';
    const ubicacion = `${this._ciudad}, ${this._provincia}`;
    const horario = this.tieneHorarioOperacion ? 
      `${this._horarioApertura}-${this._horarioCierre}` : 
      'Sin horarios';
    
    return `${this.displayName} - ${ubicacion} - ${horario} (${status})`;
  }

  /**
   * Validación específica del dominio
   */
  protected validateDomain(): void {
    // Validar nombre
    const nombreValidation = validateRequired(this._nombre, 'Nombre de sucursal');
    if (!nombreValidation.isValid) {
      throw new Error(nombreValidation.errors[0]);
    }

    const nombreLength = validateTextLength(this._nombre, 2, 100, 'Nombre');
    if (!nombreLength.isValid) {
      throw new Error(nombreLength.errors[0]);
    }

    // Validar código
    const codigoValidation = validateRequired(this._codigo, 'Código de sucursal');
    if (!codigoValidation.isValid) {
      throw new Error(codigoValidation.errors[0]);
    }

    const codigoLength = validateTextLength(this._codigo, 2, 20, 'Código');
    if (!codigoLength.isValid) {
      throw new Error(codigoLength.errors[0]);
    }

    // Validar dirección
    const direccionValidation = validateRequired(this._direccion, 'Dirección');
    if (!direccionValidation.isValid) {
      throw new Error(direccionValidation.errors[0]);
    }

    const direccionLength = validateTextLength(this._direccion, 5, 200, 'Dirección');
    if (!direccionLength.isValid) {
      throw new Error(direccionLength.errors[0]);
    }

    // Validar ciudad
    const ciudadValidation = validateRequired(this._ciudad, 'Ciudad');
    if (!ciudadValidation.isValid) {
      throw new Error(ciudadValidation.errors[0]);
    }

    const ciudadLength = validateTextLength(this._ciudad, 2, 50, 'Ciudad');
    if (!ciudadLength.isValid) {
      throw new Error(ciudadLength.errors[0]);
    }

    // Validar provincia
    const provinciaValidation = validateRequired(this._provincia, 'Provincia');
    if (!provinciaValidation.isValid) {
      throw new Error(provinciaValidation.errors[0]);
    }

    const provinciaLength = validateTextLength(this._provincia, 2, 50, 'Provincia');
    if (!provinciaLength.isValid) {
      throw new Error(provinciaLength.errors[0]);
    }

    // Validar capacidad de empleados
    if (this._capacidadEmpleados !== undefined && this._capacidadEmpleados < 1) {
      throw new Error('Capacidad de empleados debe ser mayor a 0');
    }

    // Validar horarios si están definidos
    if (this._horarioApertura && !this.isValidTimeFormat(this._horarioApertura)) {
      throw new Error('Formato de hora de apertura inválido');
    }

    if (this._horarioCierre && !this.isValidTimeFormat(this._horarioCierre)) {
      throw new Error('Formato de hora de cierre inválido');
    }

    // Validar que ambos horarios estén definidos o ambos sean undefined
    const tieneApertura = !!this._horarioApertura;
    const tieneCierre = !!this._horarioCierre;
    
    if (tieneApertura !== tieneCierre) {
      throw new Error('Debe especificar tanto horario de apertura como de cierre, o ninguno');
    }

    // Validar email si está definido
    if (this._email && this._email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this._email)) {
        throw new Error('Formato de email inválido');
      }
    }

    // Validar timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: this._timezone });
    } catch (error) {
      throw new Error(`Timezone inválido: ${this._timezone}`);
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
      direccion: this._direccion,
      ciudad: this._ciudad,
      provincia: this._provincia,
      direccionCompleta: this.direccionCompleta,
      telefono: this._telefono,
      email: this._email,
      gerente: this._gerente,
      capacidadEmpleados: this._capacidadEmpleados,
      horarioApertura: this._horarioApertura,
      horarioCierre: this._horarioCierre,
      timezone: this._timezone,
      descripcion: this._descripcion,
      displayName: this.displayName,
      tieneHorarioOperacion: this.tieneHorarioOperacion,
      horasOperacionDiarias: this.horasOperacionDiarias,
      estaAbierta: this.estaAbierta(),
      operationInfo: this.getOperationInfo(),
      ubicacion: this.ubicacion
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
      ciudad: this._ciudad,
      provincia: this._provincia,
      displayName: this.displayName,
      isActive: this.isActive,
      tieneHorarioOperacion: this.tieneHorarioOperacion
    };
  }

  /**
   * Crea una copia superficial
   */
  protected shallowCopy(): Sucursal {
    const data: ICreateSucursalData = {
      ...this.cloneBaseData(),
      nombre: this._nombre,
      codigo: this._codigo,
      direccion: this._direccion,
      ciudad: this._ciudad,
      provincia: this._provincia,
      telefono: this._telefono,
      email: this._email,
      gerente: this._gerente,
      capacidadEmpleados: this._capacidadEmpleados,
      horarioApertura: this._horarioApertura,
      horarioCierre: this._horarioCierre,
      timezone: this._timezone,
      descripcion: this._descripcion
    };

    return new Sucursal(data);
  }

  /**
   * Valida datos de creación
   */
  static validateCreateData(data: ICreateSucursalData): { isValid: boolean; errors: string[] } {
    const baseValidation = BaseEntity.validateCreateData(data);
    const errors = [...baseValidation.errors];

    // Validar campos requeridos
    const nombreValidation = validateRequired(data.nombre, 'Nombre de sucursal');
    if (!nombreValidation.isValid) {
      errors.push(...nombreValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.nombre, 2, 100, 'Nombre');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    const codigoValidation = validateRequired(data.codigo, 'Código de sucursal');
    if (!codigoValidation.isValid) {
      errors.push(...codigoValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.codigo, 2, 20, 'Código');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    const direccionValidation = validateRequired(data.direccion, 'Dirección');
    if (!direccionValidation.isValid) {
      errors.push(...direccionValidation.errors);
    } else {
      const lengthValidation = validateTextLength(data.direccion, 5, 200, 'Dirección');
      if (!lengthValidation.isValid) {
        errors.push(...lengthValidation.errors);
      }
    }

    const ciudadValidation = validateRequired(data.ciudad, 'Ciudad');
    if (!ciudadValidation.isValid) {
      errors.push(...ciudadValidation.errors);
    }

    const provinciaValidation = validateRequired(data.provincia, 'Provincia');
    if (!provinciaValidation.isValid) {
      errors.push(...provinciaValidation.errors);
    }

    // Validar capacidad si está definida
    if (data.capacidadEmpleados !== undefined && data.capacidadEmpleados < 1) {
      errors.push('Capacidad de empleados debe ser mayor a 0');
    }

    // Validar horarios
    const tieneApertura = !!data.horarioApertura;
    const tieneCierre = !!data.horarioCierre;
    
    if (tieneApertura !== tieneCierre) {
      errors.push('Debe especificar tanto horario de apertura como de cierre, o ninguno');
    }

    if (data.horarioApertura && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.horarioApertura)) {
      errors.push('Formato de hora de apertura inválido');
    }

    if (data.horarioCierre && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.horarioCierre)) {
      errors.push('Formato de hora de cierre inválido');
    }

    // Validar email
    if (data.email && data.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Formato de email inválido');
      }
    }

    // Validar timezone
    if (data.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: data.timezone });
      } catch (error) {
        errors.push(`Timezone inválido: ${data.timezone}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crea una sucursal con valores mínimos
   */
  static createBasic(
    nombre: string,
    codigo: string,
    direccion: string,
    ciudad: string,
    provincia: string
  ): Sucursal {
    return new Sucursal({
      nombre,
      codigo,
      direccion,
      ciudad,
      provincia
    });
  }

  /**
   * Crea una sucursal con horarios de operación
   */
  static createWithHorarios(
    nombre: string,
    codigo: string,
    direccion: string,
    ciudad: string,
    provincia: string,
    horarioApertura: string,
    horarioCierre: string
  ): Sucursal {
    return new Sucursal({
      nombre,
      codigo,
      direccion,
      ciudad,
      provincia,
      horarioApertura,
      horarioCierre
    });
  }
}

export default Sucursal;