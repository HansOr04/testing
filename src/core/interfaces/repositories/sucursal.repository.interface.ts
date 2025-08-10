// src/core/interfaces/repositories/sucursal.repository.interface.ts

import { Sucursal } from '../../entities/sucursal.entity';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de sucursales
 * Define todas las operaciones de persistencia para la entidad Sucursal
 */
export interface ISucursalRepository {
  /**
   * Buscar sucursal por ID
   */
  findById(id: string): Promise<Sucursal | null>;

  /**
   * Buscar sucursal por código
   */
  findByCode(code: string): Promise<Sucursal | null>;

  /**
   * Buscar sucursal por nombre
   */
  findByName(name: string): Promise<Sucursal | null>;

  /**
   * Obtener todas las sucursales
   */
  findAll(pagination: IPagination): Promise<IResponse<Sucursal[]>>;

  /**
   * Buscar sucursales activas
   */
  findActive(): Promise<Sucursal[]>;

  /**
   * Crear nueva sucursal
   */
  create(sucursal: Sucursal): Promise<Sucursal>;

  /**
   * Actualizar sucursal existente
   */
  update(id: string, sucursal: Partial<Sucursal>): Promise<Sucursal>;

  /**
   * Eliminar sucursal (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Activar/desactivar sucursal
   */
  toggleActive(id: string): Promise<Sucursal>;

  /**
   * Verificar si existe sucursal con el código dado
   */
  existsByCode(code: string): Promise<boolean>;

  /**
   * Verificar si existe sucursal con el nombre dado
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Obtener sucursales con estadísticas de empleados
   */
  findWithEmployeeStats(): Promise<Array<Sucursal & {
    totalEmployees: number;
    activeEmployees: number;
    administrativeEmployees: number;
    regularEmployees: number;
  }>>;

  /**
   * Obtener estadísticas de la sucursal
   */
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDevices: number;
    withoutDevices: number;
  }>;
}
