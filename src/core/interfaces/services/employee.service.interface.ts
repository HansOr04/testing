// src/core/interfaces/services/employee.service.interface.ts

import { Employee } from '../../entities/employee.entity';
import { EmployeeType } from '../../enums/employee-type.enum';
import { WorkSchedule } from '../../value-objects/work-schedule.vo';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el servicio de empleados
 * Define todas las operaciones de negocio para la gestión de empleados
 */
export interface IEmployeeService {
  /**
   * Crear nuevo empleado con validaciones de negocio
   */
  createEmployee(employeeData: {
    firstName: string;
    lastName: string;
    cedula: string;
    email: string;
    phone?: string;
    employeeCode: string;
    employeeType: EmployeeType;
    sucursalId: string;
    areaId: string;
    hireDate: Date;
    workSchedule: WorkSchedule;
    salary?: number;
    position?: string;
  }): Promise<Employee>;

  /**
   * Actualizar empleado existente
   */
  updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee>;

  /**
   * Obtener empleado por ID con validaciones de acceso
   */
  getEmployeeById(employeeId: string, requestingUserId: string): Promise<Employee>;

  /**
   * Obtener todos los empleados con filtros y paginación
   */
  getEmployees(filters: {
    sucursalIds?: string[];
    areaIds?: string[];
    employeeTypes?: EmployeeType[];
    active?: boolean;
    search?: string;
  }, pagination: IPagination, requestingUserId: string): Promise<IResponse<Employee[]>>;

  /**
   * Obtener empleados por sucursal
   */
  getEmployeesBySucursal(sucursalId: string, requestingUserId: string): Promise<Employee[]>;

  /**
   * Obtener empleados administrativos (acceso multi-sucursal)
   */
  getAdministrativeEmployees(requestingUserId: string): Promise<Employee[]>;

  /**
   * Asignar empleado administrativo a sucursal adicional
   */
  assignToSucursal(employeeId: string, sucursalId: string, assignedBy: string): Promise<void>;

  /**
   * Remover empleado administrativo de sucursal
   */
  removeFromSucursal(employeeId: string, sucursalId: string, removedBy: string): Promise<void>;

  /**
   * Cambiar tipo de empleado (Regular <-> Administrativo)
   */
  changeEmployeeType(employeeId: string, newType: EmployeeType, changedBy: string): Promise<Employee>;

  /**
   * Cambiar área del empleado
   */
  changeEmployeeArea(employeeId: string, newAreaId: string, changedBy: string): Promise<Employee>;

  /**
   * Actualizar horario de trabajo del empleado
   */
  updateWorkSchedule(employeeId: string, newSchedule: WorkSchedule, updatedBy: string): Promise<Employee>;

  /**
   * Activar/desactivar empleado
   */
  toggleEmployeeStatus(employeeId: string, toggledBy: string): Promise<Employee>;

  /**
   * Sincronizar empleado con dispositivos biométricos
   */
  syncWithBiometricDevices(employeeId: string): Promise<{
    success: boolean;
    syncedDevices: string[];
    failedDevices: string[];
    errors: Array<{
      deviceId: string;
      error: string;
    }>;
  }>;

  /**
   * Remover empleado de dispositivos biométricos
   */
  removeFromBiometricDevices(employeeId: string): Promise<{
    success: boolean;
    removedFromDevices: string[];
    failedDevices: string[];
    errors: Array<{
      deviceId: string;
      error: string;
    }>;
  }>;

  /**
   * Validar datos del empleado
   */
  validateEmployeeData(employeeData: Partial<Employee>): Promise<{
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
    }>;
  }>;

  /**
   * Verificar disponibilidad de código de empleado
   */
  checkEmployeeCodeAvailability(code: string): Promise<boolean>;

  /**
   * Verificar disponibilidad de cédula
   */
  checkCedulaAvailability(cedula: string): Promise<boolean>;

  /**
   * Generar código de empleado automático
   */
  generateEmployeeCode(sucursalId: string, areaId: string): Promise<string>;

  /**
   * Obtener empleados con cumpleaños próximos
   */
  getUpcomingBirthdays(days: number): Promise<Array<Employee & {
    daysUntilBirthday: number;
    birthday: Date;
  }>>;

  /**
   * Obtener empleados con aniversarios de trabajo próximos
   */
  getUpcomingWorkAnniversaries(days: number): Promise<Array<Employee & {
    daysUntilAnniversary: number;
    anniversaryDate: Date;
    yearsOfService: number;
  }>>;

  /**
   * Obtener estadísticas de empleados
   */
  getEmployeeStatistics(filters?: {
    sucursalIds?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<EmployeeType, number>;
    bySucursal: Record<string, {
      total: number;
      active: number;
      regular: number;
      administrative: number;
    }>;
    byArea: Record<string, number>;
    recentHires: number;
    recentTerminations: number;
    avgTenure: number;
    turnoverRate: number;
  }>;

  /**
   * Buscar empleados por criterios específicos
   */
  searchEmployees(criteria: {
    query?: string;
    sucursalIds?: string[];
    areaIds?: string[];
    employeeTypes?: EmployeeType[];
    hireDateFrom?: Date;
    hireDateTo?: Date;
    active?: boolean;
  }, pagination: IPagination, requestingUserId: string): Promise<IResponse<Employee[]>>;

  /**
   * Exportar datos de empleados
   */
  exportEmployees(format: 'excel' | 'csv' | 'pdf', filters?: {
    sucursalIds?: string[];
    areaIds?: string[];
    employeeTypes?: EmployeeType[];
    active?: boolean;
  }, requestingUserId?: string): Promise<{
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
  }>;

  /**
   * Importar empleados desde archivo
   */
  importEmployees(fileBuffer: Buffer, format: 'excel' | 'csv', importedBy: string): Promise<{
    imported: number;
    updated: number;
    errors: Array<{
      row: number;
      field?: string;
      message: string;
      data?: any;
    }>;
  }>;

  /**
   * Obtener empleados que requieren atención
   */
  getEmployeesRequiringAttention(): Promise<Array<{
    employee: Employee;
    issues: Array<{
      type: 'missing_biometric' | 'schedule_conflict' | 'document_expiring' | 'performance_review_due';
      severity: 'low' | 'medium' | 'high';
      message: string;
      dueDate?: Date;
    }>;
  }>>;

  /**
   * Calcular métricas de rendimiento del empleado
   */
  calculateEmployeePerformance(employeeId: string, period: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    attendanceRate: number;
    punctualityRate: number;
    overtimeHours: number;
    productivityScore: number;
    rank: number;
    totalEmployeesInComparison: number;
  }>;

  /**
   * Programar revisión de rendimiento
   */
  schedulePerformanceReview(employeeId: string, reviewDate: Date, reviewerId: string): Promise<void>;

  /**
   * Obtener historial de cambios del empleado
   */
  getEmployeeChangeHistory(employeeId: string): Promise<Array<{
    timestamp: Date;
    changedBy: string;
    changeType: string;
    fieldChanged: string;
    oldValue: any;
    newValue: any;
    reason?: string;
  }>>;
}