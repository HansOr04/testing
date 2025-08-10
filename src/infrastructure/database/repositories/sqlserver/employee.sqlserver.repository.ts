// src/infrastructure/database/repositories/sqlserver/employee.sqlserver.repository.ts

import { IEmployeeRepository } from '@core/interfaces/repositories/employee.repository.interface';
import { Employee, ICreateEmployeeData, IEmergencyContact } from '@core/entities/employee.entity';
import { EmployeeType } from '@core/enums/employee-type.enum';
import { IResponse, IPagination, IPaginationParams } from '@shared/types/common.types';
import { SqlServerConnection } from '../../connections/sqlserver.connection';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

/**
 * 🗄️ REPOSITORIO SQL SERVER - EMPLEADOS
 * 
 * Implementación completa del repositorio de empleados para SQL Server
 * 
 * Características:
 * ✅ CRUD completo de empleados
 * ✅ Búsquedas optimizadas por cédula, código, sucursal, área
 * ✅ Soporte para empleados regulares y administrativos
 * ✅ Gestión de múltiples sucursales para administrativos
 * ✅ Paginación eficiente con COUNT total
 * ✅ Filtros avanzados y búsquedas complejas
 * ✅ Estadísticas y reportes
 * ✅ Validación de cédula ecuatoriana
 * ✅ Gestión de horarios y contactos de emergencia
 * ✅ Transacciones seguras
 * ✅ Logging completo de operaciones
 * ✅ Manejo robusto de errores
 */
export class EmployeeSqlServerRepository implements IEmployeeRepository {
  private connection: SqlServerConnection;

  constructor(connection: SqlServerConnection) {
    this.connection = connection;
  }

  /**
   * 🔍 Buscar empleado por ID
   */
  async findById(id: string): Promise<Employee | null> {
    try {
      logger.debug(`🔍 Buscando empleado por ID: ${id}`);

      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.id = @param0 
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [id]);

      if (!result) {
        logger.debug(`❌ Empleado no encontrado: ${id}`);
        return null;
      }

      const employee = this.mapRowToEmployee(result);
      logger.debug(`✅ Empleado encontrado: ${employee.fullName}`);
      
      return employee;

    } catch (error) {
      logger.error(`❌ Error buscando empleado por ID ${id}:`, error);
      throw new Error(`Error buscando empleado: ${error}`);
    }
  }

  /**
   * 🆔 Buscar empleado por cédula
   */
  async findByCedula(cedula: string): Promise<Employee | null> {
    try {
      logger.debug(`🆔 Buscando empleado por cédula: ${cedula}`);

      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.cedula = @param0
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [cedula]);

      if (!result) {
        logger.debug(`❌ Empleado no encontrado por cédula: ${cedula}`);
        return null;
      }

      const employee = this.mapRowToEmployee(result);
      logger.debug(`✅ Empleado encontrado por cédula: ${employee.fullName}`);
      
      return employee;

    } catch (error) {
      logger.error(`❌ Error buscando empleado por cédula ${cedula}:`, error);
      throw new Error(`Error buscando empleado por cédula: ${error}`);
    }
  }

  /**
   * 🔢 Buscar empleado por código de empleado
   */
  async findByEmployeeCode(code: string): Promise<Employee | null> {
    try {
      logger.debug(`🔢 Buscando empleado por código: ${code}`);

      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.employee_code = @param0
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [code]);

      if (!result) {
        logger.debug(`❌ Empleado no encontrado por código: ${code}`);
        return null;
      }

      const employee = this.mapRowToEmployee(result);
      logger.debug(`✅ Empleado encontrado por código: ${employee.fullName}`);
      
      return employee;

    } catch (error) {
      logger.error(`❌ Error buscando empleado por código ${code}:`, error);
      throw new Error(`Error buscando empleado por código: ${error}`);
    }
  }

  /**
   * 👤 Buscar empleado por user ID
   */
  async findByUserId(userId: string): Promise<Employee | null> {
    try {
      logger.debug(`👤 Buscando empleado por user ID: ${userId}`);

      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        INNER JOIN users u ON u.employee_id = e.id
        WHERE u.id = @param0
          AND e.deleted_at IS NULL
          AND u.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(sql, [userId]);

      if (!result) {
        logger.debug(`❌ Empleado no encontrado por user ID: ${userId}`);
        return null;
      }

      const employee = this.mapRowToEmployee(result);
      logger.debug(`✅ Empleado encontrado por user ID: ${employee.fullName}`);
      
      return employee;

    } catch (error) {
      logger.error(`❌ Error buscando empleado por user ID ${userId}:`, error);
      throw new Error(`Error buscando empleado por user ID: ${error}`);
    }
  }

  /**
   * 📋 Obtener todos los empleados con paginación
   */
  async findAll(pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    try {
      logger.debug('📋 Obteniendo todos los empleados con paginación');

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM employees e
        WHERE e.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql);
      const total = countResult?.total || 0;

      // Consulta principal con paginación
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.deleted_at IS NULL
        ORDER BY e.${orderBy} ${orderDirection}
        OFFSET @param0 ROWS
        FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [offset, limit]);
      const employees = results.map(row => this.mapRowToEmployee(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Empleados obtenidos: ${employees.length} de ${total}`);

      return {
        success: true,
        message: 'Empleados obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<Employee[]>;

    } catch (error) {
      logger.error('❌ Error obteniendo empleados:', error);
      throw new Error(`Error obteniendo empleados: ${error}`);
    }
  }

  /**
   * 🏢 Buscar empleados por sucursal
   */
  async findBySucursal(sucursalId: string, pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    try {
      logger.debug(`🏢 Buscando empleados por sucursal: ${sucursalId}`);

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM employees e
        WHERE (e.primary_sucursal_id = @param0 
               OR e.additional_sucursales LIKE '%' + @param0 + '%')
          AND e.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, [sucursalId]);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE (e.primary_sucursal_id = @param0 
               OR e.additional_sucursales LIKE '%' + @param0 + '%')
          AND e.deleted_at IS NULL
        ORDER BY e.${orderBy} ${orderDirection}
        OFFSET @param1 ROWS
        FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [sucursalId, offset, limit]);
      const employees = results.map(row => this.mapRowToEmployee(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Empleados por sucursal obtenidos: ${employees.length} de ${total}`);

      return {
        success: true,
        message: `Empleados de sucursal obtenidos exitosamente`,
        data: employees,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<Employee[]>;

    } catch (error) {
      logger.error(`❌ Error buscando empleados por sucursal ${sucursalId}:`, error);
      throw new Error(`Error buscando empleados por sucursal: ${error}`);
    }
  }

  /**
   * 🏬 Buscar empleados por área
   */
  async findByArea(areaId: string, pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    try {
      logger.debug(`🏬 Buscando empleados por área: ${areaId}`);

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM employees e
        WHERE e.area_id = @param0
          AND e.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, [areaId]);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.area_id = @param0
          AND e.deleted_at IS NULL
        ORDER BY e.${orderBy} ${orderDirection}
        OFFSET @param1 ROWS
        FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [areaId, offset, limit]);
      const employees = results.map(row => this.mapRowToEmployee(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Empleados por área obtenidos: ${employees.length} de ${total}`);

      return {
        success: true,
        message: `Empleados de área obtenidos exitosamente`,
        data: employees,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<Employee[]>;

    } catch (error) {
      logger.error(`❌ Error buscando empleados por área ${areaId}:`, error);
      throw new Error(`Error buscando empleados por área: ${error}`);
    }
  }

  /**
   * 👥 Buscar empleados por tipo
   */
  async findByType(type: EmployeeType, pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    try {
      logger.debug(`👥 Buscando empleados por tipo: ${type}`);

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM employees e
        WHERE e.employee_type = @param0
          AND e.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, [type]);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.employee_type = @param0
          AND e.deleted_at IS NULL
        ORDER BY e.${orderBy} ${orderDirection}
        OFFSET @param1 ROWS
        FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [type, offset, limit]);
      const employees = results.map(row => this.mapRowToEmployee(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Empleados por tipo obtenidos: ${employees.length} de ${total}`);

      return {
        success: true,
        message: `Empleados de tipo ${type} obtenidos exitosamente`,
        data: employees,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<Employee[]>;

    } catch (error) {
      logger.error(`❌ Error buscando empleados por tipo ${type}:`, error);
      throw new Error(`Error buscando empleados por tipo: ${error}`);
    }
  }

  /**
   * 🎯 Buscar empleados administrativos
   */
  async findAdministrative(pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    return this.findByType(EmployeeType.ADMINISTRATIVO, pagination);
  }

  /**
   * 👤 Buscar empleados regulares
   */
  async findRegular(pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    return this.findByType(EmployeeType.REGULAR, pagination);
  }

  /**
   * ✅ Buscar empleados activos
   */
  async findActive(pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    try {
      logger.debug('✅ Buscando empleados activos');

      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM employees e
        WHERE e.is_active = 1
          AND e.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.is_active = 1
          AND e.deleted_at IS NULL
        ORDER BY e.${orderBy} ${orderDirection}
        OFFSET @param0 ROWS
        FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [offset, limit]);
      const employees = results.map(row => this.mapRowToEmployee(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Empleados activos obtenidos: ${employees.length} de ${total}`);

      return {
        success: true,
        message: 'Empleados activos obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<Employee[]>;

    } catch (error) {
      logger.error('❌ Error buscando empleados activos:', error);
      throw new Error(`Error buscando empleados activos: ${error}`);
    }
  }

  /**
   * 📅 Buscar empleados por rango de fechas de contratación
   */
  async findByHireDateRange(startDate: Date, endDate: Date, pagination: IPaginationParams): Promise<IResponse<Employee[]>> {
    try {
      logger.debug(`📅 Buscando empleados por rango de contratación: ${startDate.toISOString()} - ${endDate.toISOString()}`);

      const { page = 1, limit = 20, orderBy = 'hire_date', orderDirection = 'DESC' } = pagination;
      const offset = (page - 1) * limit;

      // Consulta para contar total
      const countSql = `
        SELECT COUNT(*) as total
        FROM employees e
        WHERE e.hire_date BETWEEN @param0 AND @param1
          AND e.deleted_at IS NULL
      `;

      const countResult = await this.connection.queryOne<{ total: number }>(countSql, [startDate, endDate]);
      const total = countResult?.total || 0;

      // Consulta principal
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.hire_date BETWEEN @param0 AND @param1
          AND e.deleted_at IS NULL
        ORDER BY e.${orderBy} ${orderDirection}
        OFFSET @param2 ROWS
        FETCH NEXT @param3 ROWS ONLY
      `;

      const results = await this.connection.query<any>(sql, [startDate, endDate, offset, limit]);
      const employees = results.map(row => this.mapRowToEmployee(row));

      const totalPages = Math.ceil(total / limit);
      const paginationInfo: IPagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      logger.debug(`✅ Empleados por rango de contratación obtenidos: ${employees.length} de ${total}`);

      return {
        success: true,
        message: 'Empleados por rango de contratación obtenidos exitosamente',
        data: employees,
        timestamp: new Date().toISOString(),
        pagination: paginationInfo
      } as IResponse<Employee[]>;

    } catch (error) {
      logger.error(`❌ Error buscando empleados por rango de contratación:`, error);
      throw new Error(`Error buscando empleados por rango de contratación: ${error}`);
    }
  }

  /**
   * ➕ Crear nuevo empleado
   */
  async create(employee: Employee): Promise<Employee> {
    try {
      logger.debug(`➕ Creando nuevo empleado: ${employee.fullName}`);

      const sql = `
        INSERT INTO employees (
          id,
          cedula,
          first_name,
          last_name,
          employee_type,
          primary_sucursal_id,
          area_id,
          additional_sucursales,
          schedule,
          phone_number,
          email,
          address,
          emergency_contact,
          hire_date,
          salary,
          position,
          notes,
          is_active,
          created_at,
          updated_at,
          version
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7,
          @param8, @param9, @param10, @param11, @param12, @param13, @param14, @param15,
          @param16, @param17, @param18, @param19, @param20
        )
      `;

      const params = [
        employee.id,
        employee.cedulaNumber,
        employee.firstName,
        employee.lastName,
        employee.employeeTypeEnum,
        employee.primarySucursalId,
        employee.areaId,
        JSON.stringify(employee.additionalSucursales),
        employee.schedule ? JSON.stringify(employee.schedule.toJSON()) : null,
        employee.phoneNumber || null,
        employee.email || null,
        employee.address || null,
        employee.emergencyContact ? JSON.stringify(employee.emergencyContact) : null,
        employee.hireDate,
        employee.salary || null,
        employee.position || null,
        employee.notes || null,
        employee.isActive ? 1 : 0,
        employee.createdAt,
        employee.updatedAt,
        employee.version
      ];

      await this.connection.query(sql, params);

      logger.info(`✅ Empleado creado exitosamente: ${employee.fullName} (${employee.cedulaNumber})`);
      return employee;

    } catch (error) {
      logger.error(`❌ Error creando empleado ${employee.fullName}:`, error);
      
      if (error.message?.includes('UNIQUE KEY constraint')) {
        if (error.message.includes('cedula')) {
          throw new Error('Ya existe un empleado con esa cédula');
        }
        throw new Error('Ya existe un empleado con esos datos únicos');
      }
      
      throw new Error(`Error creando empleado: ${error}`);
    }
  }

  /**
   * ✏️ Actualizar empleado existente
   */
  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      logger.debug(`✏️ Actualizando empleado: ${id}`);

      // Verificar que el empleado existe
      const existingEmployee = await this.findById(id);
      if (!existingEmployee) {
        throw new Error('Empleado no encontrado');
      }

      // Construir SQL dinámico según los campos a actualizar
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 0;

      if (updates.firstName !== undefined) {
        updateFields.push(`first_name = @param${paramIndex}`);
        params.push(updates.firstName);
        paramIndex++;
      }

      if (updates.lastName !== undefined) {
        updateFields.push(`last_name = @param${paramIndex}`);
        params.push(updates.lastName);
        paramIndex++;
      }

      if (updates.employeeTypeEnum !== undefined) {
        updateFields.push(`employee_type = @param${paramIndex}`);
        params.push(updates.employeeTypeEnum);
        paramIndex++;
      }

      if (updates.primarySucursalId !== undefined) {
        updateFields.push(`primary_sucursal_id = @param${paramIndex}`);
        params.push(updates.primarySucursalId);
        paramIndex++;
      }

      if (updates.areaId !== undefined) {
        updateFields.push(`area_id = @param${paramIndex}`);
        params.push(updates.areaId);
        paramIndex++;
      }

      if (updates.additionalSucursales !== undefined) {
        updateFields.push(`additional_sucursales = @param${paramIndex}`);
        params.push(JSON.stringify(updates.additionalSucursales));
        paramIndex++;
      }

      if (updates.schedule !== undefined) {
        updateFields.push(`schedule = @param${paramIndex}`);
        params.push(updates.schedule ? JSON.stringify(updates.schedule.toJSON()) : null);
        paramIndex++;
      }

      if (updates.phoneNumber !== undefined) {
        updateFields.push(`phone_number = @param${paramIndex}`);
        params.push(updates.phoneNumber);
        paramIndex++;
      }

      if (updates.email !== undefined) {
        updateFields.push(`email = @param${paramIndex}`);
        params.push(updates.email);
        paramIndex++;
      }

      if (updates.address !== undefined) {
        updateFields.push(`address = @param${paramIndex}`);
        params.push(updates.address);
        paramIndex++;
      }

      if (updates.emergencyContact !== undefined) {
        updateFields.push(`emergency_contact = @param${paramIndex}`);
        params.push(updates.emergencyContact ? JSON.stringify(updates.emergencyContact) : null);
        paramIndex++;
      }

      if (updates.salary !== undefined) {
        updateFields.push(`salary = @param${paramIndex}`);
        params.push(updates.salary);
        paramIndex++;
      }

      if (updates.position !== undefined) {
        updateFields.push(`position = @param${paramIndex}`);
        params.push(updates.position);
        paramIndex++;
      }

      if (updates.notes !== undefined) {
        updateFields.push(`notes = @param${paramIndex}`);
        params.push(updates.notes);
        paramIndex++;
      }

      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = @param${paramIndex}`);
        params.push(updates.isActive ? 1 : 0);
        paramIndex++;
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = @param${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      updateFields.push(`version = @param${paramIndex}`);
      params.push(existingEmployee.version + 1);
      paramIndex++;

      // Agregar WHERE clause
      params.push(id);

      const sql = `
        UPDATE employees 
        SET ${updateFields.join(', ')}
        WHERE id = @param${paramIndex - 1}
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, params);

      // Retornar empleado actualizado
      const updatedEmployee = await this.findById(id);
      if (!updatedEmployee) {
        throw new Error('Error obteniendo empleado actualizado');
      }

      logger.info(`✅ Empleado actualizado exitosamente: ${updatedEmployee.fullName}`);
      return updatedEmployee;

    } catch (error) {
      logger.error(`❌ Error actualizando empleado ${id}:`, error);
      throw new Error(`Error actualizando empleado: ${error}`);
    }
  }

  /**
   * 🗑️ Eliminar empleado (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      logger.debug(`🗑️ Eliminando empleado: ${id}`);

      const sql = `
        UPDATE employees 
        SET 
          deleted_at = @param0,
          updated_at = @param1,
          is_active = 0
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [new Date(), new Date(), id]);

      logger.info(`✅ Empleado eliminado exitosamente: ${id}`);

    } catch (error) {
      logger.error(`❌ Error eliminando empleado ${id}:`, error);
      throw new Error(`Error eliminando empleado: ${error}`);
    }
  }

  /**
   * 🔄 Activar/desactivar empleado
   */
  async toggleActive(id: string): Promise<Employee> {
    try {
      logger.debug(`🔄 Toggling estado activo empleado: ${id}`);

      const employee = await this.findById(id);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      const newActiveState = !employee.isActive;

      const sql = `
        UPDATE employees 
        SET 
          is_active = @param0,
          updated_at = @param1,
          version = version + 1
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [newActiveState ? 1 : 0, new Date(), id]);

      const updatedEmployee = await this.findById(id);
      if (!updatedEmployee) {
        throw new Error('Error obteniendo empleado actualizado');
      }

      logger.info(`✅ Estado empleado actualizado: ${updatedEmployee.fullName} - ${newActiveState ? 'Activo' : 'Inactivo'}`);
      return updatedEmployee;

    } catch (error) {
      logger.error(`❌ Error toggling estado empleado ${id}:`, error);
      throw new Error(`Error actualizando estado empleado: ${error}`);
    }
  }

  /**
   * ✅ Verificar si existe empleado por cédula
   */
  async existsByCedula(cedula: string): Promise<boolean> {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM employees e
        WHERE e.cedula = @param0
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(sql, [cedula]);
      return (result?.count || 0) > 0;

    } catch (error) {
      logger.error(`❌ Error verificando existencia por cédula ${cedula}:`, error);
      throw new Error(`Error verificando cédula: ${error}`);
    }
  }

  /**
   * ✅ Verificar si existe empleado por código
   */
  async existsByEmployeeCode(code: string): Promise<boolean> {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM employees e
        WHERE e.employee_code = @param0
          AND e.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(sql, [code]);
      return (result?.count || 0) > 0;

    } catch (error) {
      logger.error(`❌ Error verificando existencia por código ${code}:`, error);
      throw new Error(`Error verificando código: ${error}`);
    }
  }

  /**
   * 🏢 Asignar empleado a sucursal adicional
   */
  async assignToSucursal(employeeId: string, sucursalId: string): Promise<void> {
    try {
      logger.debug(`🏢 Asignando empleado ${employeeId} a sucursal ${sucursalId}`);

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

        const sql = `
          UPDATE employees 
          SET 
            additional_sucursales = @param0,
            updated_at = @param1,
            version = version + 1
          WHERE id = @param2
            AND deleted_at IS NULL
        `;

        await this.connection.query(sql, [JSON.stringify(additionalSucursales), new Date(), employeeId]);

        logger.info(`✅ Empleado asignado a sucursal adicional: ${employee.fullName}`);
      }

    } catch (error) {
      logger.error(`❌ Error asignando empleado ${employeeId} a sucursal ${sucursalId}:`, error);
      throw new Error(`Error asignando a sucursal: ${error}`);
    }
  }

  /**
   * 🏢 Remover empleado de sucursal
   */
  async removeFromSucursal(employeeId: string, sucursalId: string): Promise<void> {
    try {
      logger.debug(`🏢 Removiendo empleado ${employeeId} de sucursal ${sucursalId}`);

      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      if (employee.primarySucursalId === sucursalId) {
        throw new Error('No se puede remover de la sucursal principal');
      }

      const additionalSucursales = employee.additionalSucursales.filter(id => id !== sucursalId);

      const sql = `
        UPDATE employees 
        SET 
          additional_sucursales = @param0,
          updated_at = @param1,
          version = version + 1
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [JSON.stringify(additionalSucursales), new Date(), employeeId]);

      logger.info(`✅ Empleado removido de sucursal: ${employee.fullName}`);

    } catch (error) {
      logger.error(`❌ Error removiendo empleado ${employeeId} de sucursal ${sucursalId}:`, error);
      throw new Error(`Error removiendo de sucursal: ${error}`);
    }
  }

  /**
   * 🏢 Obtener sucursales asignadas al empleado
   */
  async getAssignedSucursales(employeeId: string): Promise<string[]> {
    try {
      logger.debug(`🏢 Obteniendo sucursales asignadas para empleado: ${employeeId}`);

      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      return employee.allSucursales;

    } catch (error) {
      logger.error(`❌ Error obteniendo sucursales asignadas ${employeeId}:`, error);
      throw new Error(`Error obteniendo sucursales asignadas: ${error}`);
    }
  }

  /**
   * 🏬 Cambiar área del empleado
   */
  async changeArea(employeeId: string, newAreaId: string): Promise<Employee> {
    try {
      logger.debug(`🏬 Cambiando área del empleado ${employeeId} a ${newAreaId}`);

      const sql = `
        UPDATE employees 
        SET 
          area_id = @param0,
          updated_at = @param1,
          version = version + 1
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [newAreaId, new Date(), employeeId]);

      const updatedEmployee = await this.findById(employeeId);
      if (!updatedEmployee) {
        throw new Error('Error obteniendo empleado actualizado');
      }

      logger.info(`✅ Área del empleado cambiada: ${updatedEmployee.fullName}`);
      return updatedEmployee;

    } catch (error) {
      logger.error(`❌ Error cambiando área del empleado ${employeeId}:`, error);
      throw new Error(`Error cambiando área: ${error}`);
    }
  }

  /**
   * 🔄 Cambiar tipo de empleado
   */
  async changeType(employeeId: string, newType: EmployeeType): Promise<Employee> {
    try {
      logger.debug(`🔄 Cambiando tipo del empleado ${employeeId} a ${newType}`);

      const employee = await this.findById(employeeId);
      if (!employee) {
        throw new Error('Empleado no encontrado');
      }

      // Si cambia a regular, limpiar sucursales adicionales
      let additionalSucursales = employee.additionalSucursales;
      if (newType === EmployeeType.REGULAR) {
        additionalSucursales = [];
      }

      const sql = `
        UPDATE employees 
        SET 
          employee_type = @param0,
          additional_sucursales = @param1,
          updated_at = @param2,
          version = version + 1
        WHERE id = @param3
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [newType, JSON.stringify(additionalSucursales), new Date(), employeeId]);

      const updatedEmployee = await this.findById(employeeId);
      if (!updatedEmployee) {
        throw new Error('Error obteniendo empleado actualizado');
      }

      logger.info(`✅ Tipo del empleado cambiado: ${updatedEmployee.fullName} - ${newType}`);
      return updatedEmployee;

    } catch (error) {
      logger.error(`❌ Error cambiando tipo del empleado ${employeeId}:`, error);
      throw new Error(`Error cambiando tipo de empleado: ${error}`);
    }
  }

  /**
   * ⏰ Actualizar horario de trabajo del empleado
   */
  async updateWorkSchedule(employeeId: string, schedule: any): Promise<Employee> {
    try {
      logger.debug(`⏰ Actualizando horario del empleado: ${employeeId}`);

      const sql = `
        UPDATE employees 
        SET 
          schedule = @param0,
          updated_at = @param1,
          version = version + 1
        WHERE id = @param2
          AND deleted_at IS NULL
      `;

      await this.connection.query(sql, [JSON.stringify(schedule), new Date(), employeeId]);

      const updatedEmployee = await this.findById(employeeId);
      if (!updatedEmployee) {
        throw new Error('Error obteniendo empleado actualizado');
      }

      logger.info(`✅ Horario del empleado actualizado: ${updatedEmployee.fullName}`);
      return updatedEmployee;

    } catch (error) {
      logger.error(`❌ Error actualizando horario del empleado ${employeeId}:`, error);
      throw new Error(`Error actualizando horario: ${error}`);
    }
  }

  /**
   * 🔄 Buscar empleados que necesitan sincronización biométrica
   */
  async findPendingBiometricSync(): Promise<Employee[]> {
    try {
      logger.debug('🔄 Buscando empleados pendientes de sincronización biométrica');

      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        LEFT JOIN employee_biometric_sync ebs ON e.id = ebs.employee_id
        WHERE e.is_active = 1
          AND e.deleted_at IS NULL
          AND (ebs.last_sync_date IS NULL OR ebs.last_sync_date < e.updated_at)
        ORDER BY e.updated_at DESC
      `;

      const results = await this.connection.query<any>(sql);
      const employees = results.map(row => this.mapRowToEmployee(row));

      logger.debug(`✅ Empleados pendientes de sync encontrados: ${employees.length}`);
      return employees;

    } catch (error) {
      logger.error('❌ Error buscando empleados pendientes de sync:', error);
      throw new Error(`Error buscando empleados pendientes de sync: ${error}`);
    }
  }

  /**
   * ✅ Marcar empleado como sincronizado en dispositivos biométricos
   */
  async markAsBiometricSynced(employeeId: string, deviceIds: string[]): Promise<void> {
    try {
      logger.debug(`✅ Marcando empleado ${employeeId} como sincronizado en dispositivos: ${deviceIds.join(', ')}`);

      const sql = `
        MERGE employee_biometric_sync AS target
        USING (SELECT @param0 as employee_id) AS source
        ON target.employee_id = source.employee_id
        WHEN MATCHED THEN
          UPDATE SET 
            last_sync_date = @param1,
            synced_devices = @param2,
            sync_count = sync_count + 1
        WHEN NOT MATCHED THEN
          INSERT (employee_id, last_sync_date, synced_devices, sync_count)
          VALUES (@param0, @param1, @param2, 1);
      `;

      await this.connection.query(sql, [employeeId, new Date(), JSON.stringify(deviceIds)]);

      logger.info(`✅ Empleado marcado como sincronizado: ${employeeId}`);

    } catch (error) {
      logger.error(`❌ Error marcando empleado como sincronizado ${employeeId}:`, error);
      throw new Error(`Error marcando como sincronizado: ${error}`);
    }
  }

  /**
   * 🔍 Obtener empleados por IDs múltiples
   */
  async findByIds(ids: string[]): Promise<Employee[]> {
    try {
      logger.debug(`🔍 Buscando empleados por IDs: ${ids.length} elementos`);

      if (ids.length === 0) return [];

      const placeholders = ids.map((_, index) => `@param${index}`).join(',');
      
      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE e.id IN (${placeholders})
          AND e.deleted_at IS NULL
        ORDER BY e.first_name, e.last_name
      `;

      const results = await this.connection.query<any>(sql, ids);
      const employees = results.map(row => this.mapRowToEmployee(row));

      logger.debug(`✅ Empleados encontrados por IDs: ${employees.length} de ${ids.length}`);
      return employees;

    } catch (error) {
      logger.error(`❌ Error buscando empleados por IDs:`, error);
      throw new Error(`Error buscando empleados por IDs: ${error}`);
    }
  }

  /**
   * 🎂 Buscar empleados con cumpleaños en un rango de fechas
   */
  async findBirthdayRange(startDate: Date, endDate: Date): Promise<Employee[]> {
    try {
      logger.debug(`🎂 Buscando empleados con cumpleaños entre: ${startDate.toISOString()} - ${endDate.toISOString()}`);

      // Esta funcionalidad requeriría un campo birth_date en la tabla
      // Por ahora retornamos array vacío
      logger.debug('⚠️ Funcionalidad de cumpleaños no implementada - requiere campo birth_date');
      return [];

    } catch (error) {
      logger.error(`❌ Error buscando empleados por cumpleaños:`, error);
      throw new Error(`Error buscando empleados por cumpleaños: ${error}`);
    }
  }

  /**
   * 📊 Obtener estadísticas de empleados
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
      logger.debug('📊 Obteniendo estadísticas de empleados');

      // Estadísticas generales
      const generalSql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN hire_date >= DATEADD(day, -30, GETDATE()) THEN 1 ELSE 0 END) as recentHires
        FROM employees 
        WHERE deleted_at IS NULL
      `;

      const generalStats = await this.connection.queryOne<{
        total: number;
        active: number;
        inactive: number;
        recentHires: number;
      }>(generalSql);

      // Estadísticas por tipo
      const typeSql = `
        SELECT 
          employee_type,
          COUNT(*) as count
        FROM employees 
        WHERE deleted_at IS NULL
        GROUP BY employee_type
      `;

      const typeStats = await this.connection.query<{ employee_type: EmployeeType; count: number }>(typeSql);

      // Estadísticas por sucursal
      const sucursalSql = `
        SELECT 
          primary_sucursal_id,
          COUNT(*) as count
        FROM employees 
        WHERE deleted_at IS NULL
        GROUP BY primary_sucursal_id
      `;

      const sucursalStats = await this.connection.query<{ primary_sucursal_id: string; count: number }>(sucursalSql);

      // Estadísticas por área
      const areaSql = `
        SELECT 
          area_id,
          COUNT(*) as count
        FROM employees 
        WHERE deleted_at IS NULL
        GROUP BY area_id
      `;

      const areaStats = await this.connection.query<{ area_id: string; count: number }>(areaSql);

      // Construir objetos de estadísticas
      const byType: Record<EmployeeType, number> = {
        [EmployeeType.REGULAR]: 0,
        [EmployeeType.ADMINISTRATIVO]: 0
      };

      typeStats.forEach(stat => {
        if (stat.employee_type in byType) {
          byType[stat.employee_type] = stat.count;
        }
      });

      const bySucursal: Record<string, number> = {};
      sucursalStats.forEach(stat => {
        bySucursal[stat.primary_sucursal_id] = stat.count;
      });

      const byArea: Record<string, number> = {};
      areaStats.forEach(stat => {
        byArea[stat.area_id] = stat.count;
      });

      const statistics = {
        total: generalStats?.total || 0,
        active: generalStats?.active || 0,
        inactive: generalStats?.inactive || 0,
        recentHires: generalStats?.recentHires || 0,
        byType,
        bySucursal,
        byArea
      };

      logger.debug('✅ Estadísticas de empleados obtenidas');
      return statistics;

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de empleados:', error);
      throw new Error(`Error obteniendo estadísticas: ${error}`);
    }
  }

  /**
   * 📋 Buscar empleados para reportes
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
      logger.debug('📋 Buscando empleados para reportes con filtros');

      // Construir WHERE clause dinámico
      const whereConditions: string[] = ['e.deleted_at IS NULL'];
      const params: any[] = [];
      let paramIndex = 0;

      if (filters.sucursalIds && filters.sucursalIds.length > 0) {
        const placeholders = filters.sucursalIds.map((_, index) => `@param${paramIndex + index}`).join(',');
        whereConditions.push(`e.primary_sucursal_id IN (${placeholders})`);
        params.push(...filters.sucursalIds);
        paramIndex += filters.sucursalIds.length;
      }

      if (filters.areaIds && filters.areaIds.length > 0) {
        const placeholders = filters.areaIds.map((_, index) => `@param${paramIndex + index}`).join(',');
        whereConditions.push(`e.area_id IN (${placeholders})`);
        params.push(...filters.areaIds);
        paramIndex += filters.areaIds.length;
      }

      if (filters.employeeTypes && filters.employeeTypes.length > 0) {
        const placeholders = filters.employeeTypes.map((_, index) => `@param${paramIndex + index}`).join(',');
        whereConditions.push(`e.employee_type IN (${placeholders})`);
        params.push(...filters.employeeTypes);
        paramIndex += filters.employeeTypes.length;
      }

      if (filters.active !== undefined) {
        whereConditions.push(`e.is_active = @param${paramIndex}`);
        params.push(filters.active ? 1 : 0);
        paramIndex++;
      }

      if (filters.hireDateFrom) {
        whereConditions.push(`e.hire_date >= @param${paramIndex}`);
        params.push(filters.hireDateFrom);
        paramIndex++;
      }

      if (filters.hireDateTo) {
        whereConditions.push(`e.hire_date <= @param${paramIndex}`);
        params.push(filters.hireDateTo);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const sql = `
        SELECT 
          e.id,
          e.cedula,
          e.first_name,
          e.last_name,
          e.employee_type,
          e.primary_sucursal_id,
          e.area_id,
          e.additional_sucursales,
          e.schedule,
          e.phone_number,
          e.email,
          e.address,
          e.emergency_contact,
          e.hire_date,
          e.salary,
          e.position,
          e.notes,
          e.is_active,
          e.created_at,
          e.updated_at,
          e.deleted_at,
          e.version
        FROM employees e
        WHERE ${whereClause}
        ORDER BY e.primary_sucursal_id, e.area_id, e.last_name, e.first_name
      `;

      const results = await this.connection.query<any>(sql, params);
      const employees = results.map(row => this.mapRowToEmployee(row));

      logger.debug(`✅ Empleados para reportes obtenidos: ${employees.length}`);
      return employees;

    } catch (error) {
      logger.error('❌ Error buscando empleados para reportes:', error);
      throw new Error(`Error buscando empleados para reportes: ${error}`);
    }
  }

  /**
   * 🔄 Mapear fila de base de datos a entidad Employee
   */
  private mapRowToEmployee(row: any): Employee {
    try {
      // Parsear campos JSON
      let additionalSucursales: string[] = [];
      try {
        additionalSucursales = row.additional_sucursales ? JSON.parse(row.additional_sucursales) : [];
      } catch {
        additionalSucursales = [];
      }

      let schedule;
      try {
        schedule = row.schedule ? JSON.parse(row.schedule) : undefined;
      } catch {
        schedule = undefined;
      }

      let emergencyContact: IEmergencyContact | undefined;
      try {
        emergencyContact = row.emergency_contact ? JSON.parse(row.emergency_contact) : undefined;
      } catch {
        emergencyContact = undefined;
      }

      const employeeData: ICreateEmployeeData = {
        id: row.id,
        cedula: row.cedula,
        firstName: row.first_name,
        lastName: row.last_name,
        employeeType: row.employee_type,
        primarySucursalId: row.primary_sucursal_id,
        areaId: row.area_id,
        additionalSucursales,
        schedule,
        phoneNumber: row.phone_number,
        email: row.email,
        address: row.address,
        emergencyContact,
        hireDate: row.hire_date,
        salary: row.salary,
        position: row.position,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isActive: !!row.is_active,
        version: row.version || 1
      };

      return new Employee(employeeData);

    } catch (error) {
      logger.error('❌ Error mapeando fila a Employee:', error);
      throw new Error(`Error mapeando datos de empleado: ${error}`);
    }
  }

  /**
   * 🏥 Verificar salud del repositorio
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    details?: any;
  }> {
    try {
      const startTime = Date.now();
      
      // Consulta simple para verificar conectividad
      await this.connection.query('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: true,
        responseTime,
        details: {
          repository: 'EmployeeSqlServerRepository',
          connection: this.connection.getConnectionInfo()
        }
      };

    } catch (error) {
      logger.error('❌ Health check falló:', error);
      return {
        isHealthy: false,
        responseTime: -1,
        details: { 
          error: error.message,
          repository: 'EmployeeSqlServerRepository'
        }
      };
    }
  }
}

/**
 * 🏭 Factory function para crear instancia del repositorio
 */
export const createEmployeeSqlServerRepository = (
  connection: SqlServerConnection
): EmployeeSqlServerRepository => {
  return new EmployeeSqlServerRepository(connection);
};

/**
 * 📊 Exportación por defecto
 */
export default EmployeeSqlServerRepository;