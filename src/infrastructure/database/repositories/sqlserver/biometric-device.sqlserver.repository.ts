// src/infrastructure/database/repositories/sqlserver/device.sqlserver.repository.ts

import { IBiometricDeviceRepository } from '@/core/interfaces/repositories/biometric-device.repository.interface';
import { BiometricDevice } from '@/core/entities/biometric-device.entity';
import { DeviceStatus } from '@/core/enums/device-status.enum';
import { SqlServerConnection } from '@/infrastructure/database/connections/sqlserver.connection';
import { IResponse, IPagination } from '@/shared/types/common.types';
import { getLogger } from '@/shared/utils/logger.util';

const logger = getLogger();

/**
 * 📱 SQL Server Repository para Dispositivos Biométricos FACEID 360
 * Implementación completa para gestión de dispositivos
 */
export class DeviceSqlServerRepository implements IBiometricDeviceRepository {
  constructor(private connection: SqlServerConnection) {}

  async findById(id: string): Promise<BiometricDevice | null> {
    try {
      const query = `
        SELECT bd.*,
               s.nombre as sucursal_name,
               s.codigo as sucursal_codigo,
               COUNT(DISTINCT bl.id) as total_logs_today
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        LEFT JOIN biometric_logs bl ON bd.id = bl.device_id 
          AND CAST(bl.fecha as DATE) = CAST(GETDATE() as DATE)
          AND bl.deleted_at IS NULL
        WHERE bd.id = @param0 AND bd.deleted_at IS NULL
        GROUP BY bd.id, bd.nombre, bd.sucursal_id, bd.ip, bd.puerto,
                 bd.modelo, bd.numero_serie, bd.firmware_version, bd.estado,
                 bd.ubicacion_fisica, bd.configuracion, bd.ultima_conexion,
                 bd.ultima_sincronizacion, bd.ultimo_error,
                 bd.created_at, bd.updated_at, bd.is_active,
                 s.nombre, s.codigo
      `;

      const result = await this.connection.queryOne<any>(query, [id]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando dispositivo por ID', 'DeviceRepository', { id }, error as Error);
      throw new Error(`Error buscando dispositivo: ${error}`);
    }
  }

  async findByIpAddress(ipAddress: string): Promise<BiometricDevice | null> {
    try {
      const query = `
        SELECT bd.*, s.nombre as sucursal_name
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.ip = @param0 AND bd.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [ipAddress]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando dispositivo por IP', 'DeviceRepository', { ipAddress }, error as Error);
      throw new Error(`Error buscando dispositivo: ${error}`);
    }
  }

  async findBySerialNumber(serialNumber: string): Promise<BiometricDevice | null> {
    try {
      const query = `
        SELECT bd.*, s.nombre as sucursal_name
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.numero_serie = @param0 AND bd.deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<any>(query, [serialNumber]);
      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      logger.error('Error buscando dispositivo por número de serie', 'DeviceRepository', { serialNumber }, error as Error);
      throw new Error(`Error buscando dispositivo: ${error}`);
    }
  }

  async findBySucursal(sucursalId: string): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT bd.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT bl.id) as total_logs_today
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        LEFT JOIN biometric_logs bl ON bd.id = bl.device_id 
          AND CAST(bl.fecha as DATE) = CAST(GETDATE() as DATE)
          AND bl.deleted_at IS NULL
        WHERE bd.sucursal_id = @param0 AND bd.deleted_at IS NULL
        GROUP BY bd.id, bd.nombre, bd.sucursal_id, bd.ip, bd.puerto,
                 bd.modelo, bd.numero_serie, bd.firmware_version, bd.estado,
                 bd.ubicacion_fisica, bd.configuracion, bd.ultima_conexion,
                 bd.ultima_sincronizacion, bd.ultimo_error,
                 bd.created_at, bd.updated_at, bd.is_active,
                 s.nombre
        ORDER BY bd.nombre ASC
      `;

      const results = await this.connection.query<any>(query, [sucursalId]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando dispositivos por sucursal', 'DeviceRepository', { sucursalId }, error as Error);
      throw new Error(`Error buscando dispositivos: ${error}`);
    }
  }

  async findByStatus(status: DeviceStatus, pagination: IPagination): Promise<IResponse<BiometricDevice[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM biometric_devices bd
        WHERE bd.estado = @param0 AND bd.deleted_at IS NULL
      `;

      const totalResult = await this.connection.queryOne<{ total: number }>(countQuery, [status]);
      const total = totalResult?.total || 0;

      const dataQuery = `
        SELECT bd.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT bl.id) as total_logs_today
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        LEFT JOIN biometric_logs bl ON bd.id = bl.device_id 
          AND CAST(bl.fecha as DATE) = CAST(GETDATE() as DATE)
          AND bl.deleted_at IS NULL
        WHERE bd.estado = @param0 AND bd.deleted_at IS NULL
        GROUP BY bd.id, bd.nombre, bd.sucursal_id, bd.ip, bd.puerto,
                 bd.modelo, bd.numero_serie, bd.firmware_version, bd.estado,
                 bd.ubicacion_fisica, bd.configuracion, bd.ultima_conexion,
                 bd.ultima_sincronizacion, bd.ultimo_error,
                 bd.created_at, bd.updated_at, bd.is_active,
                 s.nombre
        ORDER BY bd.nombre ASC
        OFFSET @param1 ROWS FETCH NEXT @param2 ROWS ONLY
      `;

      const results = await this.connection.query<any>(dataQuery, [status, offset, pagination.limit]);
      const devices = results.map(r => this.mapToEntity(r));

      return {
        success: true,
        message: `Dispositivos con estado ${status} encontrados`,
        data: devices,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando dispositivos por estado', 'DeviceRepository', { status }, error as Error);
      throw new Error(`Error buscando dispositivos: ${error}`);
    }
  }

  async findAll(pagination: IPagination): Promise<IResponse<BiometricDevice[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM biometric_devices 
        WHERE deleted_at IS NULL
      `;

      const totalResult = await this.connection.queryOne<{ total: number }>(countQuery);
      const total = totalResult?.total || 0;

      const dataQuery = `
        SELECT bd.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT bl.id) as total_logs_today
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        LEFT JOIN biometric_logs bl ON bd.id = bl.device_id 
          AND CAST(bl.fecha as DATE) = CAST(GETDATE() as DATE)
          AND bl.deleted_at IS NULL
        WHERE bd.deleted_at IS NULL
        GROUP BY bd.id, bd.nombre, bd.sucursal_id, bd.ip, bd.puerto,
                 bd.modelo, bd.numero_serie, bd.firmware_version, bd.estado,
                 bd.ubicacion_fisica, bd.configuracion, bd.ultima_conexion,
                 bd.ultima_sincronizacion, bd.ultimo_error,
                 bd.created_at, bd.updated_at, bd.is_active,
                 s.nombre
        ORDER BY s.nombre ASC, bd.nombre ASC
        OFFSET @param0 ROWS FETCH NEXT @param1 ROWS ONLY
      `;

      const results = await this.connection.query<any>(dataQuery, [offset, pagination.limit]);
      const devices = results.map(r => this.mapToEntity(r));

      return {
        success: true,
        message: 'Dispositivos encontrados',
        data: devices,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando todos los dispositivos', 'DeviceRepository', {}, error as Error);
      throw new Error(`Error buscando dispositivos: ${error}`);
    }
  }

  async findActive(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT bd.*,
               s.nombre as sucursal_name,
               COUNT(DISTINCT bl.id) as total_logs_today
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        LEFT JOIN biometric_logs bl ON bd.id = bl.device_id 
          AND CAST(bl.fecha as DATE) = CAST(GETDATE() as DATE)
          AND bl.deleted_at IS NULL
        WHERE bd.is_active = 1 AND bd.deleted_at IS NULL
        GROUP BY bd.id, bd.nombre, bd.sucursal_id, bd.ip, bd.puerto,
                 bd.modelo, bd.numero_serie, bd.firmware_version, bd.estado,
                 bd.ubicacion_fisica, bd.configuracion, bd.ultima_conexion,
                 bd.ultima_sincronizacion, bd.ultimo_error,
                 bd.created_at, bd.updated_at, bd.is_active,
                 s.nombre
        ORDER BY s.nombre ASC, bd.nombre ASC
      `;

      const results = await this.connection.query<any>(query);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando dispositivos activos', 'DeviceRepository', {}, error as Error);
      throw new Error(`Error buscando dispositivos activos: ${error}`);
    }
  }

  async findConnected(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT bd.*, s.nombre as sucursal_name
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.estado = @param0 AND bd.deleted_at IS NULL
        ORDER BY s.nombre ASC, bd.nombre ASC
      `;

      const results = await this.connection.query<any>(query, [DeviceStatus.CONECTADO]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando dispositivos conectados', 'DeviceRepository', {}, error as Error);
      throw new Error(`Error buscando dispositivos conectados: ${error}`);
    }
  }

  async findDisconnected(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT bd.*, s.nombre as sucursal_name
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.estado = @param0 AND bd.deleted_at IS NULL
        ORDER BY s.nombre ASC, bd.nombre ASC
      `;

      const results = await this.connection.query<any>(query, [DeviceStatus.DESCONECTADO]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando dispositivos desconectados', 'DeviceRepository', {}, error as Error);
      throw new Error(`Error buscando dispositivos desconectados: ${error}`);
    }
  }

  async create(device: BiometricDevice): Promise<BiometricDevice> {
    try {
      const query = `
        INSERT INTO biometric_devices (
          id, nombre, sucursal_id, ip, puerto, modelo, numero_serie,
          firmware_version, estado, ubicacion_fisica, configuracion,
          ultima_conexion, ultima_sincronizacion, ultimo_error,
          created_at, updated_at, is_active
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4, @param5, @param6,
          @param7, @param8, @param9, @param10, @param11, @param12, @param13,
          @param14, @param15, @param16
        )
      `;

      const deviceData = device.toJSON() as any;

      await this.connection.query(query, [
        device.id,
        deviceData.nombre,
        deviceData.sucursalId,
        deviceData.ip,
        deviceData.puerto,
        deviceData.modelo,
        deviceData.numeroSerie,
        deviceData.firmwareVersion,
        deviceData.estado,
        deviceData.ubicacionFisica,
        deviceData.configuracion ? JSON.stringify(deviceData.configuracion) : null,
        deviceData.ultimaConexion,
        deviceData.ultimaSincronizacion,
        deviceData.ultimoError,
        new Date(),
        new Date(),
        1
      ]);

      logger.info('Dispositivo biométrico creado', 'DeviceRepository', { deviceId: device.id });
      return device;
    } catch (error) {
      logger.error('Error creando dispositivo', 'DeviceRepository', { deviceId: device.id }, error as Error);
      throw new Error(`Error creando dispositivo: ${error}`);
    }
  }

  async update(id: string, device: Partial<BiometricDevice>): Promise<BiometricDevice> {
    try {
      const deviceData = device as any;
      const query = `
        UPDATE biometric_devices SET
          nombre = COALESCE(@param1, nombre),
          ip = COALESCE(@param2, ip),
          puerto = COALESCE(@param3, puerto),
          modelo = COALESCE(@param4, modelo),
          numero_serie = COALESCE(@param5, numero_serie),
          firmware_version = COALESCE(@param6, firmware_version),
          estado = COALESCE(@param7, estado),
          ubicacion_fisica = COALESCE(@param8, ubicacion_fisica),
          configuracion = COALESCE(@param9, configuracion),
          ultima_conexion = COALESCE(@param10, ultima_conexion),
          ultima_sincronizacion = COALESCE(@param11, ultima_sincronizacion),
          ultimo_error = COALESCE(@param12, ultimo_error),
          updated_at = @param13
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [
        id,
        deviceData.nombre,
        deviceData.ip,
        deviceData.puerto,
        deviceData.modelo,
        deviceData.numeroSerie,
        deviceData.firmwareVersion,
        deviceData.estado,
        deviceData.ubicacionFisica,
        deviceData.configuracion ? JSON.stringify(deviceData.configuracion) : null,
        deviceData.ultimaConexion,
        deviceData.ultimaSincronizacion,
        deviceData.ultimoError,
        new Date()
      ]);

      const updatedDevice = await this.findById(id);
      if (!updatedDevice) {
        throw new Error('Dispositivo no encontrado después de actualizar');
      }

      logger.info('Dispositivo actualizado', 'DeviceRepository', { deviceId: id });
      return updatedDevice;
    } catch (error) {
      logger.error('Error actualizando dispositivo', 'DeviceRepository', { deviceId: id }, error as Error);
      throw new Error(`Error actualizando dispositivo: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = `
        UPDATE biometric_devices 
        SET deleted_at = @param1, updated_at = @param1, is_active = 0
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);
      logger.info('Dispositivo eliminado', 'DeviceRepository', { deviceId: id });
    } catch (error) {
      logger.error('Error eliminando dispositivo', 'DeviceRepository', { deviceId: id }, error as Error);
      throw new Error(`Error eliminando dispositivo: ${error}`);
    }
  }

  async toggleActive(id: string): Promise<BiometricDevice> {
    try {
      const query = `
        UPDATE biometric_devices 
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = @param1
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);

      const updatedDevice = await this.findById(id);
      if (!updatedDevice) {
        throw new Error('Dispositivo no encontrado después de actualizar estado');
      }

      logger.info('Estado de dispositivo actualizado', 'DeviceRepository', { deviceId: id });
      return updatedDevice;
    } catch (error) {
      logger.error('Error actualizando estado de dispositivo', 'DeviceRepository', { deviceId: id }, error as Error);
      throw new Error(`Error actualizando estado de dispositivo: ${error}`);
    }
  }

  async updateStatus(id: string, status: DeviceStatus): Promise<BiometricDevice> {
    try {
      const query = `
        UPDATE biometric_devices 
        SET estado = @param1, updated_at = @param2
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, status, new Date()]);

      const updatedDevice = await this.findById(id);
      if (!updatedDevice) {
        throw new Error('Dispositivo no encontrado después de actualizar estado');
      }

      logger.info('Estado de dispositivo actualizado', 'DeviceRepository', { deviceId: id, status });
      return updatedDevice;
    } catch (error) {
      logger.error('Error actualizando estado de dispositivo', 'DeviceRepository', { deviceId: id }, error as Error);
      throw new Error(`Error actualizando estado de dispositivo: ${error}`);
    }
  }

  async updateConnectionInfo(id: string, connectionInfo: {
    lastConnection?: Date;
    lastSync?: Date;
    isOnline?: boolean;
    firmwareVersion?: string;
    totalUsers?: number;
    totalRecords?: number;
  }): Promise<BiometricDevice> {
    try {
      const query = `
        UPDATE biometric_devices SET
          ultima_conexion = COALESCE(@param1, ultima_conexion),
          ultima_sincronizacion = COALESCE(@param2, ultima_sincronizacion),
          firmware_version = COALESCE(@param3, firmware_version),
          estado = CASE 
            WHEN @param4 = 1 THEN 'CONECTADO'
            WHEN @param4 = 0 THEN 'DESCONECTADO'
            ELSE estado
          END,
          updated_at = @param5
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [
        id,
        connectionInfo.lastConnection,
        connectionInfo.lastSync,
        connectionInfo.firmwareVersion,
        connectionInfo.isOnline !== undefined ? (connectionInfo.isOnline ? 1 : 0) : null,
        new Date()
      ]);

      const updatedDevice = await this.findById(id);
      if (!updatedDevice) {
        throw new Error('Dispositivo no encontrado después de actualizar información de conexión');
      }

      logger.info('Información de conexión actualizada', 'DeviceRepository', { deviceId: id });
      return updatedDevice;
    } catch (error) {
      logger.error('Error actualizando información de conexión', 'DeviceRepository', { deviceId: id }, error as Error);
      throw new Error(`Error actualizando información de conexión: ${error}`);
    }
  }

  async existsByIpAddress(ipAddress: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM biometric_devices 
        WHERE ip = @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [ipAddress]);
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error verificando existencia por IP', 'DeviceRepository', { ipAddress }, error as Error);
      throw new Error(`Error verificando IP: ${error}`);
    }
  }

  async existsBySerialNumber(serialNumber: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM biometric_devices 
        WHERE numero_serie = @param0 AND deleted_at IS NULL
      `;

      const result = await this.connection.queryOne<{ count: number }>(query, [serialNumber]);
      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error verificando existencia por número de serie', 'DeviceRepository', { serialNumber }, error as Error);
      throw new Error(`Error verificando número de serie: ${error}`);
    }
  }

  async updateHeartbeat(id: string): Promise<void> {
    try {
      const query = `
        UPDATE biometric_devices 
        SET ultima_conexion = @param1, estado = 'CONECTADO', updated_at = @param1
        WHERE id = @param0 AND deleted_at IS NULL
      `;

      await this.connection.query(query, [id, new Date()]);
      logger.debug('Heartbeat actualizado', 'DeviceRepository', { deviceId: id });
    } catch (error) {
      logger.error('Error actualizando heartbeat', 'DeviceRepository', { deviceId: id }, error as Error);
      throw new Error(`Error actualizando heartbeat: ${error}`);
    }
  }

  async findStaleDevices(thresholdMinutes: number): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT bd.*, s.nombre as sucursal_name
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.deleted_at IS NULL
          AND bd.is_active = 1
          AND (
            bd.ultima_conexion IS NULL 
            OR DATEDIFF(MINUTE, bd.ultima_conexion, GETDATE()) > @param0
          )
        ORDER BY bd.ultima_conexion ASC
      `;

      const results = await this.connection.query<any>(query, [thresholdMinutes]);
      return results.map(r => this.mapToEntity(r));
    } catch (error) {
      logger.error('Error buscando dispositivos obsoletos', 'DeviceRepository', { thresholdMinutes }, error as Error);
      throw new Error(`Error buscando dispositivos obsoletos: ${error}`);
    }
  }

  async getNetworkConfiguration(): Promise<Array<{
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    sucursalId: string;
    sucursalName: string;
    isActive: boolean;
    status: DeviceStatus;
  }>> {
    try {
      const query = `
        SELECT 
          bd.id,
          bd.nombre as name,
          bd.ip as ipAddress,
          bd.puerto as port,
          bd.sucursal_id as sucursalId,
          s.nombre as sucursalName,
          bd.is_active as isActive,
          bd.estado as status
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.deleted_at IS NULL
        ORDER BY s.nombre ASC, bd.nombre ASC
      `;

      const results = await this.connection.query<any>(query);
      return results.map(r => ({
        id: r.id,
        name: r.name,
        ipAddress: r.ipAddress,
        port: r.port,
        sucursalId: r.sucursalId,
        sucursalName: r.sucursalName,
        isActive: Boolean(r.isActive),
        status: r.status as DeviceStatus
      }));
    } catch (error) {
      logger.error('Error obteniendo configuración de red', 'DeviceRepository', {}, error as Error);
      throw new Error(`Error obteniendo configuración de red: ${error}`);
    }
  }

  private mapToEntity(row: any): BiometricDevice {
    try {
      const configuracion = row.configuracion ? JSON.parse(row.configuracion) : undefined;
      
      return BiometricDevice.createFaceID360(
        row.nombre,
        row.sucursal_id,
        row.ip,
        row.puerto,
        row.ubicacion_fisica
      );
    } catch (error) {
      logger.error('Error mapeando fila a entidad BiometricDevice', 'DeviceRepository', { row }, error as Error);
      throw new Error(`Error mapeando datos: ${error}`);
    }
  }

  // Métodos adicionales requeridos por la interfaz (implementación básica)
  async updateStatistics(id: string, stats: any): Promise<BiometricDevice> {
    const device = await this.findById(id);
    if (!device) throw new Error('Dispositivo no encontrado');
    return device;
  }

  async getStatusHistory(deviceId: string, days: number): Promise<any[]> { 
    return []; 
  }

  async logEvent(deviceId: string, event: any): Promise<void> {}

  async getEventLogs(deviceId: string, pagination: IPagination): Promise<IResponse<any[]>> {
    return {
      success: true,
      message: 'Logs obtenidos',
      data: [],
      timestamp: new Date().toISOString()
    };
  }

  async scheduleMaintenance(deviceId: string, maintenanceDate: Date, description: string): Promise<void> {}

  async completeMaintenance(deviceId: string, completedBy: string, notes?: string): Promise<void> {}

  async findPendingMaintenance(): Promise<BiometricDevice[]> { 
    return []; 
  }

  async getPerformanceStatistics(startDate: Date, endDate: Date): Promise<any> { 
    return {}; 
  }

  async configureAlerts(deviceId: string, alerts: any): Promise<BiometricDevice> {
    const device = await this.findById(deviceId);
    if (!device) throw new Error('Dispositivo no encontrado');
    return device;
  }

  async findRequiringAttention(): Promise<any[]> { 
    return []; 
  }

  async exportConfiguration(): Promise<any> { 
    return {}; 
  }

  async importConfiguration(configData: any): Promise<any> { 
    return {}; 
  }

  async factoryReset(deviceId: string, confirmedBy: string): Promise<BiometricDevice> {
    const device = await this.findById(deviceId);
    if (!device) throw new Error('Dispositivo no encontrado');
    return device;
  }

  async getStorageInfo(deviceId: string): Promise<any> { 
    return {}; 
  }
}

export default DeviceSqlServerRepository;