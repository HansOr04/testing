/**
 * TIPOS COMUNES DEL SISTEMA
 * Tipos base utilizados en toda la aplicación
 */

// Respuesta estándar de API
export interface IResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// Paginación
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface IPaginatedResponse<T> extends IResponse<T[]> {
  pagination: IPagination;
}

// Error personalizado
export interface IError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Timestamp base para entidades
export interface ITimestamp {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Filtros base
export interface IBaseFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isActive?: boolean;
}

// Usuario básico
export interface IUser extends ITimestamp {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
}

// Roles de usuario
export enum UserRole {
  ADMIN = 'ADMIN',
  ENCARGADO_SUCURSAL = 'ENCARGADO_SUCURSAL',
  EMPLEADO = 'EMPLEADO'
}

// Empleado básico
export interface IEmployee extends ITimestamp {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  tipoEmpleado: EmployeeType;
  sucursalId: string;
  areaId: string;
  isActive: boolean;
}

// Tipos de empleado
export enum EmployeeType {
  REGULAR = 'REGULAR',
  ADMINISTRATIVO = 'ADMINISTRATIVO'
}

// Sucursal básica
export interface ISucursal extends ITimestamp {
  id: string;
  nombre: string;
  direccion: string;
  codigo: string;
  isActive: boolean;
}

// Área básica
export interface IArea extends ITimestamp {
  id: string;
  nombre: string;
  codigo: string;
  sucursalId: string;
  horarioInicio: string;
  horarioFin: string;
  limiteSemanalHoras: number;
  isActive: boolean;
}

// Rango de tiempo
export interface ITimeRange {
  inicio: string;
  fin: string;
}

// Configuración de horario laboral
export interface IWorkSchedule {
  lunes: ITimeRange;
  martes: ITimeRange;
  miercoles: ITimeRange;
  jueves: ITimeRange;
  viernes: ITimeRange;
  sabado?: ITimeRange;
  domingo?: ITimeRange;
}

// Status genérico
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  DELETED = 'DELETED'
}

// Configuración de logs
export interface ILogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  maxSize?: string;
  maxFiles?: number;
}

// Resultados de validación
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[] | undefined;
}

// Configuración de base de datos
export interface IDatabaseConfig {
  type: 'sqlserver' | 'postgresql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}
