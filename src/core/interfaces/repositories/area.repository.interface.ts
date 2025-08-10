
// src/core/interfaces/repositories/area.repository.interface.ts

import { Area } from '../../entities/area.entity';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de áreas
 * Define todas las operaciones de persistencia para la entidad Area
 */
export interface IAreaRepository {
  /**
   * Buscar área por ID
   */
  findById(id: string): Promise<Area | null>;

  /**
   * Buscar área por código
   */
  findByCode(code: string): Promise<Area | null>;

  /**
   * Buscar área por nombre
   */
  findByName(name: string): Promise<Area | null>;

  /**
   * Buscar áreas por sucursal
   */
  findBySucursal(sucursalId: string): Promise<Area[]>;

  /**
   * Obtener todas las áreas
   */
  findAll(pagination: IPagination): Promise<IResponse<Area[]>>;

  /**
   * Buscar áreas activas
   */
  findActive(): Promise<Area[]>;

  /**
   * Crear nueva área
   */
  create(area: Area): Promise<Area>;

  /**
   * Actualizar área existente
   */
  update(id: string, area: Partial<Area>): Promise<Area>;

  /**
   * Eliminar área (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Activar/desactivar área
   */
  toggleActive(id: string): Promise<Area>;

  /**
   * Verificar si existe área con el código dado en la sucursal
   */
  existsByCodeInSucursal(code: string, sucursalId: string): Promise<boolean>;

  /**
   * Verificar si existe área con el nombre dado en la sucursal
   */
  existsByNameInSucursal(name: string, sucursalId: string): Promise<boolean>;

  /**
   * Obtener áreas con estadísticas de empleados
   */
  findWithEmployeeStats(sucursalId?: string): Promise<Array<Area & {
    totalEmployees: number;
    activeEmployees: number;
  }>>;

  /**
   * Obtener estadísticas de áreas
   */
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    bySucursal: Record<string, number>;
    withEmployees: number;
    withoutEmployees: number;
  }>;
}