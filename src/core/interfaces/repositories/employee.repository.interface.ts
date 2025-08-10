// src/core/interfaces/repositories/employee.repository.interface.ts

import { Employee } from '../../entities/employee.entity';
import { EmployeeType } from '../../enums/employee-type.enum';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de empleados
 * Define todas las operaciones de persistencia para la entidad Employee
 */
export interface IEmployeeRepository {
  /**
   * Buscar empleado por ID
   */
  findById(id: string): Promise<Employee | null>;

  /**
   * Buscar empleado por cédula
   */
  findByCedula(cedula: string): Promise<Employee | null>;

  /**
   * Buscar empleado por código de empleado
   */
  findByEmployeeCode(code: string): Promise<Employee | null>;

  /**
   * Buscar empleado por user ID
   */
  findByUserId(userId: string): Promise<Employee | null>;

  /**
   * Obtener todos los empleados con paginación
   */
  findAll(pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados por sucursal
   */
  findBySucursal(sucursalId: string, pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados por área
   */
  findByArea(areaId: string, pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados por tipo (Regular/Administrativo)
   */
  findByType(type: EmployeeType, pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados administrativos (acceso a múltiples sucursales)
   */
  findAdministrative(pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados regulares (una sola sucursal)
   */
  findRegular(pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados activos
   */
  findActive(pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Buscar empleados por rango de fechas de contratación
   */
  findByHireDateRange(startDate: Date, endDate: Date, pagination: IPagination): Promise<IResponse<Employee[]>>;

  /**
   * Crear nuevo empleado
   */
  create(employee: Employee): Promise<Employee>;

  /**
   * Actualizar empleado existente
   */
  update(id: string, employee: Partial<Employee>): Promise<Employee>;

  /**
   * Eliminar empleado (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Activar/desactivar empleado
   */
  toggleActive(id: string): Promise<Employee>;

  /**
   * Verificar si existe un empleado con la cédula dada
   */
  existsByCedula(cedula: string): Promise<boolean>;

  /**
   * Verificar si existe un empleado con el código dado
   */
  existsByEmployeeCode(code: string): Promise<boolean>;

  /**
   * Asignar empleado a sucursal adicional (solo administrativos)
   */
  assignToSucursal(employeeId: string, sucursalId: string): Promise<void>;

  /**
   * Remover empleado de sucursal (solo administrativos)
   */
  removeFromSucursal(employeeId: string, sucursalId: string): Promise<void>;

  /**
   * Obtener sucursales asignadas al empleado
   */
  getAssignedSucursales(employeeId: string): Promise<string[]>;

  /**
   * Cambiar área del empleado
   */
  changeArea(employeeId: string, newAreaId: string): Promise<Employee>;

  /**
   * Cambiar tipo de empleado (Regular <-> Administrativo)
   */
  changeType(employeeId: string, newType: EmployeeType): Promise<Employee>;

  /**
   * Actualizar horario de trabajo del empleado
   */
  updateWorkSchedule(employeeId: string, schedule: any): Promise<Employee>;

  /**
   * Buscar empleados que necesitan sincronización biométrica
   */
  findPendingBiometricSync(): Promise<Employee[]>;

  /**
   * Marcar empleado como sincronizado en dispositivos biométricos
   */
  markAsBiometricSynced(employeeId: string, deviceIds: string[]): Promise<void>;

  /**
   * Obtener empleados por IDs múltiples
   */
  findByIds(ids: string[]): Promise<Employee[]>;

  /**
   * Buscar empleados con cumpleaños en un rango de fechas
   */
  findBirthdayRange(startDate: Date, endDate: Date): Promise<Employee[]>;

  /**
   * Obtener estadísticas de empleados
   */
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<EmployeeType, number>;
    bySucursal: Record<string, number>;
    byArea: Record<string, number>;
    recentHires: number; // últimos 30 días
  }>;

  /**
   * Buscar empleados para reportes (con joins optimizados)
   */
  findForReports(filters: {
    sucursalIds?: string[];
    areaIds?: string[];
    employeeTypes?: EmployeeType[];
    active?: boolean;
    hireDateFrom?: Date;
    hireDateTo?: Date;
  }): Promise<Employee[]>;
}