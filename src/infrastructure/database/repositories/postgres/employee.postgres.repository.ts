/**
 * EMPLOYEE POSTGRESQL REPOSITORY
 * Implementación de repositorio de empleados para PostgreSQL
 * Maneja todas las operaciones de persistencia para la entidad Employee
 */

import { Pool, PoolClient } from 'pg';
import { Employee } from '@core/entities/employee.entity';
import { EmployeeType } from '@core/enums/employee-type.enum';
import { IEmployeeRepository } from '@core/interfaces/repositories/employee.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { getLogger } from '@shared/utils/logger.util';
import { Cedula } from '@core/value-objects/cedula.vo';

const logger = getLogger();

export class EmployeePostgresRepository implements IEmployeeRepository {
  constructor(private pool: Pool) {}

  /**
   * Buscar empleado por ID
   */
  async findById(id: string): Promise<Employee | null> {
    try {
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando empleado por ID', 'EmployeePostgresRepository', { id }, error as Error);
      throw new Error(`Error al buscar empleado: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleado por cédula
   */
  async findByCedula(cedula: string): Promise<Employee | null> {
    try {
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE cedula = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [cedula]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando empleado por cédula', 'EmployeePostgresRepository', { cedula }, error as Error);
      throw new Error(`Error al buscar empleado: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleado por código de empleado
   */
  async findByEmployeeCode(code: string): Promise<Employee | null> {
    try {
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE employee_code = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [code]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando empleado por código', 'EmployeePostgresRepository', { code }, error as Error);
      throw new Error(`Error al buscar empleado: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleado por user ID
   */
  async findByUserId(userId: string): Promise<Employee | null> {
    try {
      const query = `
        SELECT 
          e.id, e.cedula, e.first_name, e.last_name, e.employee_type,
          e.primary_sucursal_id, e.area_id, e.additional_sucursales,
          e.schedule, e.phone_number, e.email, e.address, e.emergency_contact,
          e.hire_date, e.salary, e.position, e.notes, e.is_active,
          e.created_at, e.updated_at, e.deleted_at, e.version
        FROM employees e
        INNER JOIN users u ON u.employee_id = e.id
        WHERE u.id = $1 AND e.deleted_at IS NULL AND u.deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando empleado por user ID', 'EmployeePostgresRepository', { userId }, error as Error);
      throw new Error(`Error al buscar empleado: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todos los empleados con paginación
   */
  async findAll(pagination: IPagination): Promise<IResponse<Employee[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE deleted_at IS NULL
        ORDER BY last_name, first_name
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const employees = dataResult.rows.map(row => this.mapRowToEmployee(row));

      return {
        success: true,
        message: 'Empleados obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo todos los empleados', 'EmployeePostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener empleados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados por sucursal
   */
  async findBySucursal(sucursalId: string, pagination: IPagination): Promise<IResponse<Employee[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE (primary_sucursal_id = $1 OR $1 = ANY(additional_sucursales))
          AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE (primary_sucursal_id = $1 OR $1 = ANY(additional_sucursales))
          AND deleted_at IS NULL
        ORDER BY last_name, first_name
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [sucursalId]),
        this.pool.query(query, [sucursalId, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const employees = dataResult.rows.map(row => this.mapRowToEmployee(row));

      return {
        success: true,
        message: 'Empleados por sucursal obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando empleados por sucursal', 'EmployeePostgresRepository', { sucursalId }, error as Error);
      throw new Error(`Error al buscar empleados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados por área
   */
  async findByArea(areaId: string, pagination: IPagination): Promise<IResponse<Employee[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE area_id = $1 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE area_id = $1 AND deleted_at IS NULL
        ORDER BY last_name, first_name
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [areaId]),
        this.pool.query(query, [areaId, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const employees = dataResult.rows.map(row => this.mapRowToEmployee(row));

      return {
        success: true,
        message: 'Empleados por área obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando empleados por área', 'EmployeePostgresRepository', { areaId }, error as Error);
      throw new Error(`Error al buscar empleados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados por tipo
   */
  async findByType(type: EmployeeType, pagination: IPagination): Promise<IResponse<Employee[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE employee_type = $1 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE employee_type = $1 AND deleted_at IS NULL
        ORDER BY last_name, first_name
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [type]),
        this.pool.query(query, [type, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const employees = dataResult.rows.map(row => this.mapRowToEmployee(row));

      return {
        success: true,
        message: `Empleados ${type} obtenidos exitosamente`,
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando empleados por tipo', 'EmployeePostgresRepository', { type }, error as Error);
      throw new Error(`Error al buscar empleados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados administrativos
   */
  async findAdministrative(pagination: IPagination): Promise<IResponse<Employee[]>> {
    return this.findByType(EmployeeType.ADMINISTRATIVO, pagination);
  }

  /**
   * Buscar empleados regulares
   */
  async findRegular(pagination: IPagination): Promise<IResponse<Employee[]>> {
    return this.findByType(EmployeeType.REGULAR, pagination);
  }

  /**
   * Buscar empleados activos
   */
  async findActive(pagination: IPagination): Promise<IResponse<Employee[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE is_active = true AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY last_name, first_name
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const employees = dataResult.rows.map(row => this.mapRowToEmployee(row));

      return {
        success: true,
        message: 'Empleados activos obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo empleados activos', 'EmployeePostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener empleados activos: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados por rango de fechas de contratación
   */
  async findByHireDateRange(startDate: Date, endDate: Date, pagination: IPagination): Promise<IResponse<Employee[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM employees 
        WHERE hire_date BETWEEN $1 AND $2 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE hire_date BETWEEN $1 AND $2 AND deleted_at IS NULL
        ORDER BY hire_date DESC
        LIMIT $3 OFFSET $4
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [startDate, endDate]),
        this.pool.query(query, [startDate, endDate, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const employees = dataResult.rows.map(row => this.mapRowToEmployee(row));

      return {
        success: true,
        message: 'Empleados por rango de fecha obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando empleados por rango de fecha', 'EmployeePostgresRepository', { startDate, endDate }, error as Error);
      throw new Error(`Error al buscar empleados: ${(error as Error).message}`);
    }
  }

  /**
   * Crear nuevo empleado
   */
  async create(employee: Employee): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO employees (
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `;

      const values = [
        employee.id,
        employee.cedulaNumber,
        employee.firstName,
        employee.lastName,
        employee.employeeTypeEnum,
        employee.primarySucursalId,
        employee.areaId,
        employee.additionalSucursales,
        employee.schedule ? JSON.stringify(employee.schedule.toJSON()) : null,
        employee.phoneNumber || null,
        employee.email || null,
        employee.address || null,
        employee.emergencyContact ? JSON.stringify(employee.emergencyContact) : null,
        employee.hireDate,
        employee.salary || null,
        employee.position || null,
        employee.notes || null,
        employee.isActive,
        employee.createdAt,
        employee.updatedAt,
        employee.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Empleado creado exitosamente', 'EmployeePostgresRepository', { 
        id: employee.id, 
        cedula: employee.cedulaNumber 
      });
      
      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando empleado', 'EmployeePostgresRepository', { 
        cedula: employee.cedulaNumber 
      }, error as Error);
      
      if ((error as any)?.code === '23505') {
        throw new Error('La cédula ya está registrada');
      }
      
      throw new Error(`Error al crear empleado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar empleado existente
   */
  async update(id: string, employeeData: Partial<Employee>): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Primero verificar que el empleado existe
      const existingEmployee = await this.findById(id);
      if (!existingEmployee) {
        throw new Error('Empleado no encontrado');
      }

      // Construir query dinámicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (employeeData.firstName !== undefined) {
        updateFields.push(`first_name = ${paramIndex++}`);
        values.push(employeeData.firstName);
      }

      if (employeeData.lastName !== undefined) {
        updateFields.push(`last_name = ${paramIndex++}`);
        values.push(employeeData.lastName);
      }

      if (employeeData.employeeTypeEnum !== undefined) {
        updateFields.push(`employee_type = ${paramIndex++}`);
        values.push(employeeData.employeeTypeEnum);
      }

      if (employeeData.primarySucursalId !== undefined) {
        updateFields.push(`primary_sucursal_id = ${paramIndex++}`);
        values.push(employeeData.primarySucursalId);
      }

      if (employeeData.areaId !== undefined) {
        updateFields.push(`area_id = ${paramIndex++}`);
        values.push(employeeData.areaId);
      }

      if (employeeData.additionalSucursales !== undefined) {
        updateFields.push(`additional_sucursales = ${paramIndex++}`);
        values.push(employeeData.additionalSucursales);
      }

      if (employeeData.schedule !== undefined) {
        updateFields.push(`schedule = ${paramIndex++}`);
        values.push(employeeData.schedule ? JSON.stringify(employeeData.schedule) : null);
      }

      if (employeeData.phoneNumber !== undefined) {
        updateFields.push(`phone_number = ${paramIndex++}`);
        values.push(employeeData.phoneNumber);
      }

      if (employeeData.email !== undefined) {
        updateFields.push(`email = ${paramIndex++}`);
        values.push(employeeData.email);
      }

      if (employeeData.address !== undefined) {
        updateFields.push(`address = ${paramIndex++}`);
        values.push(employeeData.address);
      }

      if (employeeData.emergencyContact !== undefined) {
        updateFields.push(`emergency_contact = ${paramIndex++}`);
        values.push(employeeData.emergencyContact ? JSON.stringify(employeeData.emergencyContact) : null);
      }

      if (employeeData.salary !== undefined) {
        updateFields.push(`salary = ${paramIndex++}`);
        values.push(employeeData.salary);
      }

      if (employeeData.position !== undefined) {
        updateFields.push(`position = ${paramIndex++}`);
        values.push(employeeData.position);
      }

      if (employeeData.notes !== undefined) {
        updateFields.push(`notes = ${paramIndex++}`);
        values.push(employeeData.notes);
      }

      if (employeeData.isActive !== undefined) {
        updateFields.push(`is_active = ${paramIndex++}`);
        values.push(employeeData.isActive);
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = ${paramIndex++}`);
      values.push(new Date());

      updateFields.push(`version = ${paramIndex++}`);
      values.push(existingEmployee.version + 1);

      // ID para WHERE
      values.push(id);

      const query = `
        UPDATE employees 
        SET ${updateFields.join(', ')}
        WHERE id = ${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado para actualizar');
      }

      logger.info('Empleado actualizado exitosamente', 'EmployeePostgresRepository', { id });
      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando empleado', 'EmployeePostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar empleado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar empleado (soft delete)
   */
  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE employees 
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Empleado no encontrado para eliminar');
      }

      logger.info('Empleado eliminado exitosamente', 'EmployeePostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando empleado', 'EmployeePostgresRepository', { id }, error as Error);
      throw new Error(`Error al eliminar empleado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Activar/desactivar empleado
   */
  async toggleActive(id: string): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE employees 
        SET is_active = NOT is_active, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado');
      }

      logger.info('Estado de empleado cambiado', 'EmployeePostgresRepository', { id });
      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando estado de empleado', 'EmployeePostgresRepository', { id }, error as Error);
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si existe un empleado con la cédula dada
   */
  async existsByCedula(cedula: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM employees 
        WHERE cedula = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [cedula]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por cédula', 'EmployeePostgresRepository', { cedula }, error as Error);
      throw new Error(`Error al verificar cédula: ${(error as Error).message}`);
    }
  }

  /**
   * Verificar si existe un empleado con el código dado
   */
  async existsByEmployeeCode(code: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM employees 
        WHERE employee_code = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [code]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por código', 'EmployeePostgresRepository', { code }, error as Error);
      throw new Error(`Error al verificar código: ${(error as Error).message}`);
    }
  }

  /**
   * Asignar empleado a sucursal adicional
   */
  async assignToSucursal(employeeId: string, sucursalId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      if (!employee.canWorkMultipleSucursales) {
        throw new Error('Este tipo de empleado no puede trabajar en múltiples sucursales');
      }

      const additionalSucursales = [...employee.additionalSucursales];
      if (!additionalSucursales.includes(sucursalId) && employee.primarySucursalId !== sucursalId) {
        additionalSucursales.push(sucursalId);
      }

      const query = `
        UPDATE employees 
        SET additional_sucursales = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
      `;

      await client.query(query, [additionalSucursales, new Date(), employeeId]);
      await client.query('COMMIT');

      logger.info('Empleado asignado a sucursal adicional', 'EmployeePostgresRepository', { employeeId, sucursalId });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error asignando empleado a sucursal', 'EmployeePostgresRepository', { employeeId, sucursalId }, error as Error);
      throw new Error(`Error al asignar a sucursal: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Remover empleado de sucursal adicional
   */
  async removeFromSucursal(employeeId: string, sucursalId: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      const additionalSucursales = employee.additionalSucursales.filter(id => id !== sucursalId);

      const query = `
        UPDATE employees 
        SET additional_sucursales = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
      `;

      await client.query(query, [additionalSucursales, new Date(), employeeId]);
      await client.query('COMMIT');

      logger.info('Empleado removido de sucursal adicional', 'EmployeePostgresRepository', { employeeId, sucursalId });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error removiendo empleado de sucursal', 'EmployeePostgresRepository', { employeeId, sucursalId }, error as Error);
      throw new Error(`Error al remover de sucursal: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener sucursales asignadas al empleado
   */
  async getAssignedSucursales(employeeId: string): Promise<string[]> {
    try {
      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      return employee.allSucursales;
    } catch (error) {
      logger.error('Error obteniendo sucursales asignadas', 'EmployeePostgresRepository', { employeeId }, error as Error);
      throw new Error(`Error al obtener sucursales: ${(error as Error).message}`);
    }
  }

  /**
   * Cambiar área del empleado
   */
  async changeArea(employeeId: string, newAreaId: string): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE employees 
        SET area_id = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [newAreaId, new Date(), employeeId]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado');
      }

      logger.info('Área de empleado cambiada', 'EmployeePostgresRepository', { employeeId, newAreaId });
      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando área de empleado', 'EmployeePostgresRepository', { employeeId, newAreaId }, error as Error);
      throw new Error(`Error al cambiar área: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Cambiar tipo de empleado
   */
  async changeType(employeeId: string, newType: EmployeeType): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      // Si cambia a regular, limpiar sucursales adicionales
      const additionalSucursales = newType === EmployeeType.REGULAR ? [] : employee.additionalSucursales;

      const query = `
        UPDATE employees 
        SET employee_type = $1, additional_sucursales = $2, updated_at = $3
        WHERE id = $4 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [newType, additionalSucursales, new Date(), employeeId]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado');
      }

      logger.info('Tipo de empleado cambiado', 'EmployeePostgresRepository', { employeeId, newType });
      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando tipo de empleado', 'EmployeePostgresRepository', { employeeId, newType }, error as Error);
      throw new Error(`Error al cambiar tipo: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar horario de trabajo del empleado
   */
  async updateWorkSchedule(employeeId: string, schedule: any): Promise<Employee> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE employees 
        SET schedule = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [JSON.stringify(schedule), new Date(), employeeId]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado');
      }

      logger.info('Horario de empleado actualizado', 'EmployeePostgresRepository', { employeeId });
      return this.mapRowToEmployee(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando horario de empleado', 'EmployeePostgresRepository', { employeeId }, error as Error);
      throw new Error(`Error al actualizar horario: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Buscar empleados que necesitan sincronización biométrica
   */
  async findPendingBiometricSync(): Promise<Employee[]> {
    try {
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE is_active = true 
          AND deleted_at IS NULL
          AND (biometric_synced = false OR biometric_synced IS NULL)
        ORDER BY created_at ASC
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => this.mapRowToEmployee(row));
    } catch (error) {
      logger.error('Error buscando empleados pendientes de sincronización', 'EmployeePostgresRepository', {}, error as Error);
      throw new Error(`Error al buscar empleados pendientes: ${(error as Error).message}`);
    }
  }

  /**
   * Marcar empleado como sincronizado en dispositivos biométricos
   */
  async markAsBiometricSynced(employeeId: string, deviceIds: string[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE employees 
        SET biometric_synced = true, 
            biometric_devices = $1,
            updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
      `;

      await client.query(query, [deviceIds, new Date(), employeeId]);
      await client.query('COMMIT');

      logger.info('Empleado marcado como sincronizado', 'EmployeePostgresRepository', { employeeId, deviceIds });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error marcando empleado como sincronizado', 'EmployeePostgresRepository', { employeeId }, error as Error);
      throw new Error(`Error al marcar como sincronizado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener empleados por IDs múltiples
   */
  async findByIds(ids: string[]): Promise<Employee[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      const placeholders = ids.map((_, index) => `${index + 1}`).join(',');
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE id IN (${placeholders}) AND deleted_at IS NULL
        ORDER BY last_name, first_name
      `;
      
      const result = await this.pool.query(query, ids);
      return result.rows.map(row => this.mapRowToEmployee(row));
    } catch (error) {
      logger.error('Error buscando empleados por IDs', 'EmployeePostgresRepository', { ids }, error as Error);
      throw new Error(`Error al buscar empleados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados con cumpleaños en un rango de fechas
   */
  async findBirthdayRange(startDate: Date, endDate: Date): Promise<Employee[]> {
    try {
      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE DATE_PART('month', hire_date) BETWEEN DATE_PART('month', $1) AND DATE_PART('month', $2)
          AND DATE_PART('day', hire_date) BETWEEN DATE_PART('day', $1) AND DATE_PART('day', $2)
          AND is_active = true 
          AND deleted_at IS NULL
        ORDER BY DATE_PART('month', hire_date), DATE_PART('day', hire_date)
      `;
      
      const result = await this.pool.query(query, [startDate, endDate]);
      return result.rows.map(row => this.mapRowToEmployee(row));
    } catch (error) {
      logger.error('Error buscando empleados por cumpleaños', 'EmployeePostgresRepository', { startDate, endDate }, error as Error);
      throw new Error(`Error al buscar cumpleaños: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener estadísticas de empleados
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<EmployeeType, number>;
    bySucursal: Record<string, number>;
    byArea: Record<string, number>;
    recentHires: number;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const queries = [
        'SELECT COUNT(*) as total FROM employees WHERE deleted_at IS NULL',
        'SELECT COUNT(*) as active FROM employees WHERE is_active = true AND deleted_at IS NULL',
        'SELECT COUNT(*) as inactive FROM employees WHERE is_active = false AND deleted_at IS NULL',
        'SELECT employee_type, COUNT(*) as count FROM employees WHERE deleted_at IS NULL GROUP BY employee_type',
        'SELECT primary_sucursal_id, COUNT(*) as count FROM employees WHERE deleted_at IS NULL GROUP BY primary_sucursal_id',
        'SELECT area_id, COUNT(*) as count FROM employees WHERE deleted_at IS NULL GROUP BY area_id',
        'SELECT COUNT(*) as recent FROM employees WHERE hire_date >= $1 AND deleted_at IS NULL'
      ];

      const [totalResult, activeResult, inactiveResult, typeResult, sucursalResult, areaResult, recentResult] = await Promise.all([
        this.pool.query(queries[0]),
        this.pool.query(queries[1]),
        this.pool.query(queries[2]),
        this.pool.query(queries[3]),
        this.pool.query(queries[4]),
        this.pool.query(queries[5]),
        this.pool.query(queries[6], [thirtyDaysAgo])
      ]);

      const byType: Record<EmployeeType, number> = {
        [EmployeeType.REGULAR]: 0,
        [EmployeeType.ADMINISTRATIVO]: 0
      };

      typeResult.rows.forEach(row => {
        byType[row.employee_type as EmployeeType] = parseInt(row.count);
      });

      const bySucursal: Record<string, number> = {};
      sucursalResult.rows.forEach(row => {
        bySucursal[row.primary_sucursal_id] = parseInt(row.count);
      });

      const byArea: Record<string, number> = {};
      areaResult.rows.forEach(row => {
        byArea[row.area_id] = parseInt(row.count);
      });

      return {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        inactive: parseInt(inactiveResult.rows[0].inactive),
        byType,
        bySucursal,
        byArea,
        recentHires: parseInt(recentResult.rows[0].recent)
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de empleados', 'EmployeePostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar empleados para reportes
   */
  async findForReports(filters: {
    sucursalIds?: string[];
    areaIds?: string[];
    employeeTypes?: EmployeeType[];
    active?: boolean;
    hireDateFrom?: Date;
    hireDateTo?: Date;
  }): Promise<Employee[]> {
    try {
      const conditions: string[] = ['deleted_at IS NULL'];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters.sucursalIds && filters.sucursalIds.length > 0) {
        const placeholders = filters.sucursalIds.map(() => `${paramIndex++}`).join(',');
        conditions.push(`primary_sucursal_id IN (${placeholders})`);
        values.push(...filters.sucursalIds);
      }

      if (filters.areaIds && filters.areaIds.length > 0) {
        const placeholders = filters.areaIds.map(() => `${paramIndex++}`).join(',');
        conditions.push(`area_id IN (${placeholders})`);
        values.push(...filters.areaIds);
      }

      if (filters.employeeTypes && filters.employeeTypes.length > 0) {
        const placeholders = filters.employeeTypes.map(() => `${paramIndex++}`).join(',');
        conditions.push(`employee_type IN (${placeholders})`);
        values.push(...filters.employeeTypes);
      }

      if (filters.active !== undefined) {
        conditions.push(`is_active = ${paramIndex++}`);
        values.push(filters.active);
      }

      if (filters.hireDateFrom) {
        conditions.push(`hire_date >= ${paramIndex++}`);
        values.push(filters.hireDateFrom);
      }

      if (filters.hireDateTo) {
        conditions.push(`hire_date <= ${paramIndex++}`);
        values.push(filters.hireDateTo);
      }

      const query = `
        SELECT 
          id, cedula, first_name, last_name, employee_type,
          primary_sucursal_id, area_id, additional_sucursales,
          schedule, phone_number, email, address, emergency_contact,
          hire_date, salary, position, notes, is_active,
          created_at, updated_at, deleted_at, version
        FROM employees 
        WHERE ${conditions.join(' AND ')}
        ORDER BY last_name, first_name
      `;
      
      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToEmployee(row));
    } catch (error) {
      logger.error('Error buscando empleados para reportes', 'EmployeePostgresRepository', filters, error as Error);
      throw new Error(`Error al buscar empleados para reportes: ${(error as Error).message}`);
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto Employee
   */
  private mapRowToEmployee(row: any): Employee {
    const employeeData = {
      id: row.id,
      cedula: row.cedula,
      firstName: row.first_name,
      lastName: row.last_name,
      employeeType: row.employee_type,
      primarySucursalId: row.primary_sucursal_id,
      areaId: row.area_id,
      additionalSucursales: row.additional_sucursales || [],
      schedule: row.schedule ? (typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule) : undefined,
      phoneNumber: row.phone_number,
      email: row.email,
      address: row.address,
      emergencyContact: row.emergency_contact ? (typeof row.emergency_contact === 'string' ? JSON.parse(row.emergency_contact) : row.emergency_contact) : undefined,
      hireDate: row.hire_date,
      salary: row.salary,
      position: row.position,
      notes: row.notes,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };

    return new Employee(employeeData);
  }
}

export default EmployeePostgresRepository;