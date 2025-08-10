/**
 * BASE ENTITY
 * Entidad base para todas las entidades del dominio
 * Incluye campos comunes y funcionalidades base
 */

import { generateUniqueId } from '@shared/utils/encryption.util';

/**
 * Interface base para todas las entidades
 */
export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isActive: boolean;
  version: number;
}

/**
 * Datos para crear una entidad base
 */
export interface ICreateBaseEntityData {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  version?: number;
}

/**
 * Datos para actualizar una entidad base
 */
export interface IUpdateBaseEntityData {
  updatedAt?: Date;
  isActive?: boolean;
  version?: number;
}

export abstract class BaseEntity implements IBaseEntity {
  private _id: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date;
  private _isActive: boolean;
  private _version: number;

  constructor(data: ICreateBaseEntityData = {}) {
    this._id = data.id || generateUniqueId();
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
    this._isActive = data.isActive ?? true;
    this._version = data.version || 1;
    
    this.validate();
  }

  /**
   * Obtiene el ID único de la entidad
   */
  get id(): string {
    return this._id;
  }

  /**
   * Obtiene la fecha de creación
   */
  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  /**
   * Obtiene la fecha de última actualización
   */
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Obtiene la fecha de eliminación lógica
   */
  get deletedAt(): Date | undefined {
    return this._deletedAt ? new Date(this._deletedAt) : undefined;
  }

  /**
   * Verifica si la entidad está activa
   */
  get isActive(): boolean {
    return this._isActive && !this._deletedAt;
  }

  /**
   * Obtiene la versión para control de concurrencia optimista
   */
  get version(): number {
    return this._version;
  }

  /**
   * Verifica si la entidad está eliminada lógicamente
   */
  get isDeleted(): boolean {
    return !!this._deletedAt;
  }

  /**
   * Obtiene la edad de la entidad en días
   */
  get ageInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene el tiempo desde la última actualización en minutos
   */
  get minutesSinceLastUpdate(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._updatedAt.getTime());
    return Math.floor(diffTime / (1000 * 60));
  }

  /**
   * Actualiza la entidad con nuevos datos
   */
  protected updateEntity(data: IUpdateBaseEntityData): void {
    this._updatedAt = data.updatedAt || new Date();
    
    if (data.isActive !== undefined) {
      this._isActive = data.isActive;
    }
    
    if (data.version !== undefined) {
      this._version = data.version;
    } else {
      this._version++;
    }

    this.validate();
  }

  /**
   * Marca la entidad como inactiva
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Reactiva la entidad
   */
  activate(): void {
    this._isActive = true;
    this._deletedAt = undefined;
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Elimina lógicamente la entidad
   */
  softDelete(): void {
    this._deletedAt = new Date();
    this._isActive = false;
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Restaura una entidad eliminada lógicamente
   */
  restore(): void {
    this._deletedAt = undefined;
    this._isActive = true;
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Actualiza solo el timestamp de modificación
   */
  touch(): void {
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Verifica si la entidad ha sido modificada recientemente
   */
  isRecentlyModified(minutes: number = 30): boolean {
    return this.minutesSinceLastUpdate <= minutes;
  }

  /**
   * Verifica si la entidad es nueva
   */
  isNew(hours: number = 24): boolean {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._createdAt.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= hours;
  }

  /**
   * Compara versiones para control de concurrencia optimista
   */
  checkVersion(expectedVersion: number): boolean {
    return this._version === expectedVersion;
  }

  /**
   * Verifica si otra entidad tiene la misma ID
   */
  hasSameId(other: BaseEntity): boolean {
    return this._id === other._id;
  }

  /**
   * Compara dos entidades por ID
   */
  equals(other: BaseEntity): boolean {
    return this.hasSameId(other);
  }

  /**
   * Clona los datos base de la entidad
   */
  protected cloneBaseData(): ICreateBaseEntityData {
    return {
      id: this._id,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
      isActive: this._isActive,
      version: this._version
    };
  }

  /**
   * Convierte la entidad base a objeto plano
   */
  toBaseObject(): IBaseEntity {
    return {
      id: this._id,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
      deletedAt: this._deletedAt ? new Date(this._deletedAt) : undefined,
      isActive: this._isActive,
      version: this._version
    };
  }

  /**
   * Convierte la entidad completa a JSON
   */
  abstract toJSON(): object;

  /**
   * Valida la entidad - debe ser implementado por las clases derivadas
   */
  protected validate(): void {
    this.validateBase();
    this.validateDomain();
  }

  /**
   * Validación base común a todas las entidades
   */
  private validateBase(): void {
    if (!this._id || this._id.trim() === '') {
      throw new Error('ID de entidad es requerido');
    }

    if (!this._createdAt || isNaN(this._createdAt.getTime())) {
      throw new Error('Fecha de creación debe ser válida');
    }

    if (!this._updatedAt || isNaN(this._updatedAt.getTime())) {
      throw new Error('Fecha de actualización debe ser válida');
    }

    if (this._updatedAt < this._createdAt) {
      throw new Error('Fecha de actualización no puede ser anterior a fecha de creación');
    }

    if (this._deletedAt && this._deletedAt < this._createdAt) {
      throw new Error('Fecha de eliminación no puede ser anterior a fecha de creación');
    }

    if (this._version < 1) {
      throw new Error('Versión debe ser mayor a 0');
    }

    if (this._deletedAt && this._isActive) {
      throw new Error('Entidad eliminada no puede estar activa');
    }
  }

  /**
   * Validación específica del dominio - debe ser implementada por las clases derivadas
   */
  protected abstract validateDomain(): void;

  /**
   * Obtiene información de auditoría
   */
  getAuditInfo(): {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    isActive: boolean;
    isDeleted: boolean;
    version: number;
    ageInDays: number;
    minutesSinceLastUpdate: number;
    isNew: boolean;
    isRecentlyModified: boolean;
  } {
    return {
      id: this._id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      isActive: this.isActive,
      isDeleted: this.isDeleted,
      version: this._version,
      ageInDays: this.ageInDays,
      minutesSinceLastUpdate: this.minutesSinceLastUpdate,
      isNew: this.isNew(),
      isRecentlyModified: this.isRecentlyModified()
    };
  }

  /**
   * Obtiene un resumen textual de la entidad
   */
  getSummary(): string {
    const type = this.constructor.name;
    const status = this.isActive ? 'Activa' : 'Inactiva';
    const deleted = this.isDeleted ? ' (Eliminada)' : '';
    return `${type}[${this._id}] - ${status}${deleted} (v${this._version})`;
  }

  /**
   * Crea una copia superficial de la entidad base
   */
  protected shallowCopy(): BaseEntity {
    // Esta función debe ser sobrescrita por las clases derivadas
    throw new Error('shallowCopy debe ser implementado por la clase derivada');
  }

  /**
   * Método estático para validar datos de entrada
   */
  static validateCreateData(data: ICreateBaseEntityData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.id && (typeof data.id !== 'string' || data.id.trim() === '')) {
      errors.push('ID debe ser una cadena no vacía');
    }

    if (data.createdAt && (!(data.createdAt instanceof Date) || isNaN(data.createdAt.getTime()))) {
      errors.push('Fecha de creación debe ser una fecha válida');
    }

    if (data.updatedAt && (!(data.updatedAt instanceof Date) || isNaN(data.updatedAt.getTime()))) {
      errors.push('Fecha de actualización debe ser una fecha válida');
    }

    if (data.createdAt && data.updatedAt && data.updatedAt < data.createdAt) {
      errors.push('Fecha de actualización no puede ser anterior a fecha de creación');
    }

    if (data.version !== undefined && (typeof data.version !== 'number' || data.version < 1)) {
      errors.push('Versión debe ser un número mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Genera información para logging
   */
  getLogInfo(): { entityType: string; id: string; version: number; isActive: boolean } {
    return {
      entityType: this.constructor.name,
      id: this._id,
      version: this._version,
      isActive: this._isActive
    };
  }
}

export default BaseEntity;