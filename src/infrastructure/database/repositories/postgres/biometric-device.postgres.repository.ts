/**
 * BIOMETRIC DEVICE POSTGRESQL REPOSITORY - CORREGIDO
 * Implementación de repositorio de dispositivos biométricos para PostgreSQL
 * Maneja todas las operaciones de persistencia para la entidad BiometricDevice
 */

import { Pool, PoolClient } from 'pg';
import { BiometricDevice } from '@core/entities/biometric-device.entity';
import { DeviceStatus } from '@core/enums/device-status.enum';
import { IBiometricDeviceRepository } from '@core/interfaces/repositories/biometric-device.repository.interface';
import { IResponse, IPagination } from '@shared/types/common.types';
import { getLogger } from '@shared/utils/logger.util';
import { validateIP, validatePort } from '@shared/utils/validation.util';

const logger = getLogger();

/**
 * Configuración extendida del dispositivo con propiedades adicionales
 */
interface IExtendedDeviceConfiguration {
  timeoutConexion: number;
  timeoutRequest: number;
  intentosReconexion: number;
  intervaloSincronizacion: number;
  modoDebug: boolean;
  compresionDatos: boolean;
  nivelConfianza: number;
  capacidadUsuarios: number;
  capacidadRegistros: number;
  // Propiedades adicionales para estadísticas y monitoreo
  totalUsers?: number;
  totalRecords?: number;
  availableMemory?: number;
  usedMemory?: number;
  cpuUsage?: number;
  temperature?: number;
  alerts?: {
    disconnectionAlert: boolean;
    lowMemoryAlert: boolean;
    highTemperatureAlert: boolean;
    syncFailureAlert: boolean;
    maintenanceAlert: boolean;
  };
  // Información de mantenimiento
  resetBy?: string;
  resetDate?: Date;
  // Estadísticas adicionales
  lastSyncCount?: number;
  lastSyncDuration?: number;
  successRate?: number;
  avgResponseTime?: number;
}

export class BiometricDevicePostgresRepository implements IBiometricDeviceRepository {
  constructor(private pool: Pool) {}

  /**
   * Buscar dispositivo por ID
   */
  async findById(id: string): Promise<BiometricDevice | null> {
    try {
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando dispositivo por ID', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al buscar dispositivo: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivo por dirección IP
   */
  async findByIpAddress(ipAddress: string): Promise<BiometricDevice | null> {
    try {
      const validation = validateIP(ipAddress);
      if (!validation.isValid) {
        throw new Error(`IP inválida: ${validation.errors.join(', ')}`);
      }

      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE ip_address = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [ipAddress]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando dispositivo por IP', 'BiometricDevicePostgresRepository', { ipAddress }, error as Error);
      throw new Error(`Error al buscar dispositivo: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivo por número de serie
   */
  async findBySerialNumber(serialNumber: string): Promise<BiometricDevice | null> {
    try {
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE serial_number = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [serialNumber]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      logger.error('Error buscando dispositivo por número de serie', 'BiometricDevicePostgresRepository', { serialNumber }, error as Error);
      throw new Error(`Error al buscar dispositivo: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivos por sucursal
   */
  async findBySucursal(sucursalId: string): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE sucursal_id = $1 AND deleted_at IS NULL
        ORDER BY name
      `;
      
      const result = await this.pool.query(query, [sucursalId]);
      return result.rows.map(row => this.mapRowToDevice(row));
    } catch (error) {
      logger.error('Error buscando dispositivos por sucursal', 'BiometricDevicePostgresRepository', { sucursalId }, error as Error);
      throw new Error(`Error al buscar dispositivos: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivos por estado
   */
  async findByStatus(status: DeviceStatus, pagination: IPagination): Promise<IResponse<BiometricDevice[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM biometric_devices 
        WHERE status = $1 AND deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE status = $1 AND deleted_at IS NULL
        ORDER BY name
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [status]),
        this.pool.query(query, [status, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const devices = dataResult.rows.map(row => this.mapRowToDevice(row));

      return {
        success: true,
        message: `Dispositivos con estado ${status} obtenidos exitosamente`,
        data: devices,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error buscando dispositivos por estado', 'BiometricDevicePostgresRepository', { status }, error as Error);
      throw new Error(`Error al buscar dispositivos: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener todos los dispositivos
   */
  async findAll(pagination: IPagination): Promise<IResponse<BiometricDevice[]>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM biometric_devices 
        WHERE deleted_at IS NULL
      `;
      
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE deleted_at IS NULL
        ORDER BY name
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery),
        this.pool.query(query, [pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const devices = dataResult.rows.map(row => this.mapRowToDevice(row));

      return {
        success: true,
        message: 'Dispositivos obtenidos exitosamente',
        data: devices,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo todos los dispositivos', 'BiometricDevicePostgresRepository', pagination, error as Error);
      throw new Error(`Error al obtener dispositivos: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivos activos
   */
  async findActive(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY name
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => this.mapRowToDevice(row));
    } catch (error) {
      logger.error('Error obteniendo dispositivos activos', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener dispositivos activos: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivos conectados
   */
  async findConnected(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE status IN ($1, $2) AND is_active = true AND deleted_at IS NULL
        ORDER BY name
      `;
      
      const result = await this.pool.query(query, [DeviceStatus.CONECTADO, DeviceStatus.SINCRONIZANDO]);
      return result.rows.map(row => this.mapRowToDevice(row));
    } catch (error) {
      logger.error('Error obteniendo dispositivos conectados', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener dispositivos conectados: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivos desconectados
   */
  async findDisconnected(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE status IN ($1, $2, $3) AND deleted_at IS NULL
        ORDER BY name
      `;
      
      const result = await this.pool.query(query, [
        DeviceStatus.DESCONECTADO, 
        DeviceStatus.ERROR, 
        DeviceStatus.MANTENIMIENTO
      ]);
      return result.rows.map(row => this.mapRowToDevice(row));
    } catch (error) {
      logger.error('Error obteniendo dispositivos desconectados', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener dispositivos desconectados: ${(error as Error).message}`);
    }
  }

  /**
   * Crear nuevo dispositivo
   */
  async create(device: BiometricDevice): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO biometric_devices (
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING *
      `;

      const values = [
        device.id,
        device.nombre,
        device.sucursalId,
        device.ip,
        device.puerto,
        device.modelo,
        device.numeroSerie || null,
        device.firmwareVersion || null,
        device.estado,
        device.ubicacionFisica || null,
        JSON.stringify(device.configuracion),
        device.ultimaConexion || null,
        device.ultimaSincronizacion || null,
        device.ultimoError || null,
        device.isActive,
        device.createdAt,
        device.updatedAt,
        device.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info('Dispositivo biométrico creado exitosamente', 'BiometricDevicePostgresRepository', { 
        id: device.id, 
        name: device.nombre,
        ip: device.ip 
      });
      
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creando dispositivo biométrico', 'BiometricDevicePostgresRepository', { 
        name: device.nombre,
        ip: device.ip 
      }, error as Error);
      
      if ((error as any)?.code === '23505') {
        throw new Error('La dirección IP ya está registrada para otro dispositivo');
      }
      
      throw new Error(`Error al crear dispositivo: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar dispositivo existente
   */
  async update(id: string, deviceData: Partial<BiometricDevice>): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Primero verificar que el dispositivo existe
      const existingDevice = await this.findById(id);
      if (!existingDevice) {
        throw new Error('Dispositivo no encontrado');
      }

      // Construir query dinámicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (deviceData.nombre !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(deviceData.nombre);
      }

      if (deviceData.ip !== undefined) {
        updateFields.push(`ip_address = $${paramIndex++}`);
        values.push(deviceData.ip);
      }

      if (deviceData.puerto !== undefined) {
        updateFields.push(`port = $${paramIndex++}`);
        values.push(deviceData.puerto);
      }

      if (deviceData.modelo !== undefined) {
        updateFields.push(`model = $${paramIndex++}`);
        values.push(deviceData.modelo);
      }

      if (deviceData.numeroSerie !== undefined) {
        updateFields.push(`serial_number = $${paramIndex++}`);
        values.push(deviceData.numeroSerie);
      }

      if (deviceData.firmwareVersion !== undefined) {
        updateFields.push(`firmware_version = $${paramIndex++}`);
        values.push(deviceData.firmwareVersion);
      }

      if (deviceData.estado !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(deviceData.estado);
      }

      if (deviceData.ubicacionFisica !== undefined) {
        updateFields.push(`physical_location = $${paramIndex++}`);
        values.push(deviceData.ubicacionFisica);
      }

      if (deviceData.configuracion !== undefined) {
        updateFields.push(`configuration = $${paramIndex++}`);
        values.push(JSON.stringify(deviceData.configuracion));
      }

      if (deviceData.ultimaConexion !== undefined) {
        updateFields.push(`last_connection = $${paramIndex++}`);
        values.push(deviceData.ultimaConexion);
      }

      if (deviceData.ultimaSincronizacion !== undefined) {
        updateFields.push(`last_sync = $${paramIndex++}`);
        values.push(deviceData.ultimaSincronizacion);
      }

      if (deviceData.ultimoError !== undefined) {
        updateFields.push(`last_error = $${paramIndex++}`);
        values.push(deviceData.ultimoError);
      }

      if (deviceData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(deviceData.isActive);
      }

      // Siempre actualizar updated_at y version
      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      updateFields.push(`version = $${paramIndex++}`);
      values.push(existingDevice.version + 1);

      // ID para WHERE
      values.push(id);

      const query = `
        UPDATE biometric_devices 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado para actualizar');
      }

      logger.info('Dispositivo biométrico actualizado exitosamente', 'BiometricDevicePostgresRepository', { id });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando dispositivo biométrico', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar dispositivo: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar dispositivo
   */
  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE biometric_devices 
        SET deleted_at = $1, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rowCount === 0) {
        throw new Error('Dispositivo no encontrado para eliminar');
      }

      logger.info('Dispositivo biométrico eliminado exitosamente', 'BiometricDevicePostgresRepository', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error eliminando dispositivo biométrico', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al eliminar dispositivo: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Activar/desactivar dispositivo
   */
  async toggleActive(id: string): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE biometric_devices 
        SET is_active = NOT is_active, updated_at = $1
        WHERE id = $2 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      logger.info('Estado de dispositivo cambiado', 'BiometricDevicePostgresRepository', { id });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cambiando estado de dispositivo', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al cambiar estado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar estado del dispositivo
   */
  async updateStatus(id: string, status: DeviceStatus): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const now = new Date();
      const query = `
        UPDATE biometric_devices 
        SET status = $1, 
            last_connection = CASE WHEN $1 = $3 THEN $2 ELSE last_connection END,
            updated_at = $2
        WHERE id = $4 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [status, now, DeviceStatus.CONECTADO, id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      logger.info('Estado de dispositivo actualizado', 'BiometricDevicePostgresRepository', { id, status });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando estado de dispositivo', 'BiometricDevicePostgresRepository', { id, status }, error as Error);
      throw new Error(`Error al actualizar estado: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Actualizar información de conexión
   */
  async updateConnectionInfo(id: string, connectionInfo: {
    lastConnection?: Date;
    lastSync?: Date;
    isOnline?: boolean;
    firmwareVersion?: string;
    totalUsers?: number;
    totalRecords?: number;
  }): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (connectionInfo.lastConnection !== undefined) {
        updateFields.push(`last_connection = $${paramIndex++}`);
        values.push(connectionInfo.lastConnection);
      }

      if (connectionInfo.lastSync !== undefined) {
        updateFields.push(`last_sync = $${paramIndex++}`);
        values.push(connectionInfo.lastSync);
      }

      if (connectionInfo.firmwareVersion !== undefined) {
        updateFields.push(`firmware_version = $${paramIndex++}`);
        values.push(connectionInfo.firmwareVersion);
      }

      if (connectionInfo.isOnline !== undefined) {
        const newStatus = connectionInfo.isOnline ? DeviceStatus.CONECTADO : DeviceStatus.DESCONECTADO;
        updateFields.push(`status = $${paramIndex++}`);
        values.push(newStatus);
      }

      // Actualizar estadísticas en el campo configuration
      if (connectionInfo.totalUsers !== undefined || connectionInfo.totalRecords !== undefined) {
        const device = await this.findById(id);
        if (device) {
          const config: IExtendedDeviceConfiguration = { 
            ...device.configuracion,
            // Valores por defecto para propiedades que podrían no existir
            totalUsers: 0,
            totalRecords: 0,
            ...device.configuracion
          };
          
          if (connectionInfo.totalUsers !== undefined) {
            config.totalUsers = connectionInfo.totalUsers;
          }
          if (connectionInfo.totalRecords !== undefined) {
            config.totalRecords = connectionInfo.totalRecords;
          }
          updateFields.push(`configuration = $${paramIndex++}`);
          values.push(JSON.stringify(config));
        }
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      values.push(id);

      const query = `
        UPDATE biometric_devices 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      logger.info('Información de conexión actualizada', 'BiometricDevicePostgresRepository', { id });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando información de conexión', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar información de conexión: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Verificar si existe dispositivo con la IP dada
   */
  async existsByIpAddress(ipAddress: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM biometric_devices 
        WHERE ip_address = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [ipAddress]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por IP', 'BiometricDevicePostgresRepository', { ipAddress }, error as Error);
      throw new Error(`Error al verificar IP: ${(error as Error).message}`);
    }
  }

  /**
   * Verificar si existe dispositivo con el número de serie dado
   */
  async existsBySerialNumber(serialNumber: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM biometric_devices 
        WHERE serial_number = $1 AND deleted_at IS NULL
      `;
      
      const result = await this.pool.query(query, [serialNumber]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verificando existencia por número de serie', 'BiometricDevicePostgresRepository', { serialNumber }, error as Error);
      throw new Error(`Error al verificar número de serie: ${(error as Error).message}`);
    }
  }

  /**
   * Registrar heartbeat del dispositivo
   */
  async updateHeartbeat(id: string): Promise<void> {
    try {
      const query = `
        UPDATE biometric_devices 
        SET last_connection = $1, 
            status = CASE WHEN status = $2 THEN $3 ELSE status END,
            updated_at = $1
        WHERE id = $4 AND deleted_at IS NULL
      `;

      await this.pool.query(query, [new Date(), DeviceStatus.DESCONECTADO, DeviceStatus.CONECTADO, id]);
      logger.debug('Heartbeat actualizado', 'BiometricDevicePostgresRepository', { id });
    } catch (error) {
      logger.error('Error actualizando heartbeat', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar heartbeat: ${(error as Error).message}`);
    }
  }

  /**
   * Buscar dispositivos que no han enviado heartbeat recientemente
   */
  async findStaleDevices(thresholdMinutes: number): Promise<BiometricDevice[]> {
    try {
      const threshold = new Date();
      threshold.setMinutes(threshold.getMinutes() - thresholdMinutes);

      const query = `
        SELECT 
          id, name, sucursal_id, ip_address, port, model,
          serial_number, firmware_version, status, physical_location,
          configuration, last_connection, last_sync, last_error,
          is_active, created_at, updated_at, deleted_at, version
        FROM biometric_devices 
        WHERE (last_connection < $1 OR last_connection IS NULL)
          AND is_active = true 
          AND status != $2
          AND deleted_at IS NULL
        ORDER BY last_connection ASC NULLS FIRST
      `;
      
      const result = await this.pool.query(query, [threshold, DeviceStatus.MANTENIMIENTO]);
      return result.rows.map(row => this.mapRowToDevice(row));
    } catch (error) {
      logger.error('Error buscando dispositivos obsoletos', 'BiometricDevicePostgresRepository', { thresholdMinutes }, error as Error);
      throw new Error(`Error al buscar dispositivos obsoletos: ${(error as Error).message}`);
    }
  }

  /**
   * Obtener configuración de red para todos los dispositivos
   */
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
          bd.id, bd.name, bd.ip_address, bd.port, bd.sucursal_id,
          s.name as sucursal_name, bd.is_active, bd.status
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.deleted_at IS NULL
        ORDER BY s.name, bd.name
      `;
      
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        ipAddress: row.ip_address,
        port: row.port,
        sucursalId: row.sucursal_id,
        sucursalName: row.sucursal_name || 'Sin sucursal',
        isActive: row.is_active,
        status: row.status
      }));
    } catch (error) {
      logger.error('Error obteniendo configuración de red', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener configuración de red: ${(error as Error).message}`);
    }
  }

  /**
   * Actualizar estadísticas del dispositivo
   */
  async updateStatistics(id: string, stats: {
    totalUsers?: number;
    totalRecords?: number;
    availableMemory?: number;
    usedMemory?: number;
    cpuUsage?: number;
    temperature?: number;
  }): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const device = await this.findById(id);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      const config: IExtendedDeviceConfiguration = { 
        ...device.configuracion,
        // Inicializar propiedades que podrían no existir
        totalUsers: 0,
        totalRecords: 0,
        availableMemory: 0,
        usedMemory: 0,
        cpuUsage: 0,
        temperature: 0,
        ...device.configuracion // Conservar valores existentes
      };
     
      // Actualizar estadísticas en la configuración
      if (stats.totalUsers !== undefined) {
        config.totalUsers = stats.totalUsers;
      }
      if (stats.totalRecords !== undefined) {
        config.totalRecords = stats.totalRecords;
      }
      if (stats.availableMemory !== undefined) {
        config.availableMemory = stats.availableMemory;
      }
      if (stats.usedMemory !== undefined) {
        config.usedMemory = stats.usedMemory;
      }
      if (stats.cpuUsage !== undefined) {
        config.cpuUsage = stats.cpuUsage;
      }
      if (stats.temperature !== undefined) {
        config.temperature = stats.temperature;
      }

      const query = `
        UPDATE biometric_devices 
        SET configuration = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [JSON.stringify(config), new Date(), id]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      logger.info('Estadísticas de dispositivo actualizadas', 'BiometricDevicePostgresRepository', { id });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error actualizando estadísticas', 'BiometricDevicePostgresRepository', { id }, error as Error);
      throw new Error(`Error al actualizar estadísticas: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener historial de estado del dispositivo
   */
  async getStatusHistory(deviceId: string, days: number): Promise<Array<{
    timestamp: Date;
    status: DeviceStatus;
    details?: string;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = `
        SELECT 
          created_at as timestamp,
          status,
          last_error as details
        FROM device_status_history 
        WHERE device_id = $1 AND created_at >= $2
        ORDER BY created_at DESC
      `;
      
      const result = await this.pool.query(query, [deviceId, startDate]);
      
      return result.rows.map(row => ({
        timestamp: row.timestamp,
        status: row.status,
        details: row.details
      }));
    } catch (error) {
      logger.error('Error obteniendo historial de estado', 'BiometricDevicePostgresRepository', { deviceId, days }, error as Error);
      // Si la tabla no existe, retornar array vacío
      return [];
    }
  }

  /**
   * Registrar evento en el dispositivo
   */
  async logEvent(deviceId: string, event: {
    type: 'connection' | 'disconnection' | 'sync' | 'error' | 'maintenance';
    message: string;
    details?: any;
  }): Promise<void> {
    try {
      const query = `
        INSERT INTO device_events (device_id, event_type, message, details, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await this.pool.query(query, [
        deviceId,
        event.type,
        event.message,
        event.details ? JSON.stringify(event.details) : null,
        new Date()
      ]);

      logger.info('Evento de dispositivo registrado', 'BiometricDevicePostgresRepository', { deviceId, type: event.type });
    } catch (error) {
      logger.error('Error registrando evento', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtener logs de eventos del dispositivo
   */
  async getEventLogs(deviceId: string, pagination: IPagination): Promise<IResponse<Array<{
    timestamp: Date;
    type: string;
    message: string;
    details?: any;
  }>>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM device_events 
        WHERE device_id = $1
      `;
      
      const query = `
        SELECT created_at as timestamp, event_type as type, message, details
        FROM device_events 
        WHERE device_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const [countResult, dataResult] = await Promise.all([
        this.pool.query(countQuery, [deviceId]),
        this.pool.query(query, [deviceId, pagination.limit, offset])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const events = dataResult.rows.map(row => ({
        timestamp: row.timestamp,
        type: row.type,
        message: row.message,
        details: row.details ? JSON.parse(row.details) : undefined
      }));

      return {
        success: true,
        message: 'Logs de eventos obtenidos exitosamente',
        data: events,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error obteniendo logs de eventos', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      
      // Si la tabla no existe, retornar respuesta vacía
      return {
        success: true,
        message: 'No hay logs disponibles',
        data: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Programar mantenimiento del dispositivo
   */
  async scheduleMaintenance(deviceId: string, maintenanceDate: Date, description: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insertar en tabla de mantenimientos programados (si existe)
      const maintenanceQuery = `
        INSERT INTO device_maintenance (device_id, scheduled_date, description, status, created_at)
        VALUES ($1, $2, $3, 'SCHEDULED', $4)
      `;

      await client.query(maintenanceQuery, [deviceId, maintenanceDate, description, new Date()]);

      // Actualizar estado del dispositivo si la fecha es hoy
      const today = new Date();
      if (maintenanceDate.toDateString() === today.toDateString()) {
        const updateQuery = `
          UPDATE biometric_devices 
          SET status = $1, last_error = $2, updated_at = $3
          WHERE id = $4 AND deleted_at IS NULL
        `;

        await client.query(updateQuery, [
          DeviceStatus.MANTENIMIENTO,
          `Mantenimiento programado: ${description}`,
          new Date(),
          deviceId
        ]);
      }

      await client.query('COMMIT');
      logger.info('Mantenimiento programado', 'BiometricDevicePostgresRepository', { deviceId, maintenanceDate });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error programando mantenimiento', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      throw new Error(`Error al programar mantenimiento: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Marcar mantenimiento como completado
   */
  async completeMaintenance(deviceId: string, completedBy: string, notes?: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Actualizar mantenimiento en tabla (si existe)
      const maintenanceQuery = `
        UPDATE device_maintenance 
        SET status = 'COMPLETED', completed_by = $1, completion_notes = $2, completed_at = $3
        WHERE device_id = $4 AND status = 'SCHEDULED'
      `;

      await client.query(maintenanceQuery, [completedBy, notes, new Date(), deviceId]);

      // Cambiar estado del dispositivo de vuelta a desconectado
      const deviceQuery = `
        UPDATE biometric_devices 
        SET status = $1, last_error = NULL, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
      `;

      await client.query(deviceQuery, [DeviceStatus.DESCONECTADO, new Date(), deviceId]);

      await client.query('COMMIT');
      logger.info('Mantenimiento completado', 'BiometricDevicePostgresRepository', { deviceId, completedBy });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error completando mantenimiento', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      throw new Error(`Error al completar mantenimiento: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener dispositivos pendientes de mantenimiento
   */
  async findPendingMaintenance(): Promise<BiometricDevice[]> {
    try {
      const query = `
        SELECT DISTINCT
          bd.id, bd.name, bd.sucursal_id, bd.ip_address, bd.port, bd.model,
          bd.serial_number, bd.firmware_version, bd.status, bd.physical_location,
          bd.configuration, bd.last_connection, bd.last_sync, bd.last_error,
          bd.is_active, bd.created_at, bd.updated_at, bd.deleted_at, bd.version
        FROM biometric_devices bd
        INNER JOIN device_maintenance dm ON bd.id = dm.device_id
        WHERE dm.status = 'SCHEDULED' 
          AND dm.scheduled_date <= $1
          AND bd.deleted_at IS NULL
        ORDER BY dm.scheduled_date ASC
      `;
      
      const result = await this.pool.query(query, [new Date()]);
      return result.rows.map(row => this.mapRowToDevice(row));
    } catch (error) {
      logger.error('Error obteniendo dispositivos pendientes de mantenimiento', 'BiometricDevicePostgresRepository', {}, error as Error);
      // Si la tabla no existe, retornar array vacío
      return [];
    }
  }

  /**
   * Obtener estadísticas de rendimiento de dispositivos
   */
  async getPerformanceStatistics(startDate: Date, endDate: Date): Promise<{
    totalDevices: number;
    activeDevices: number;
    onlineDevices: number;
    averageUptime: number;
    bySucursal: Record<string, {
      total: number;
      active: number;
      online: number;
      uptime: number;
    }>;
    topPerforming: Array<{
      deviceId: string;
      deviceName: string;
      uptime: number;
      totalScans: number;
      avgResponseTime: number;
    }>;
    issues: Array<{
      deviceId: string;
      deviceName: string;
      issueType: string;
      lastOccurrence: Date;
      frequency: number;
    }>;
  }> {
    try {
      // Estadísticas básicas
      const basicStatsQuery = `
        SELECT 
          COUNT(*) as total_devices,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_devices,
          SUM(CASE WHEN status IN ($1, $2) THEN 1 ELSE 0 END) as online_devices
        FROM biometric_devices 
        WHERE deleted_at IS NULL
      `;

      const basicStats = await this.pool.query(basicStatsQuery, [DeviceStatus.CONECTADO, DeviceStatus.SINCRONIZANDO]);

      // Estadísticas por sucursal
      const sucursalStatsQuery = `
        SELECT 
          bd.sucursal_id,
          s.name as sucursal_name,
          COUNT(*) as total,
          SUM(CASE WHEN bd.is_active = true THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN bd.status IN ($1, $2) THEN 1 ELSE 0 END) as online
        FROM biometric_devices bd
        LEFT JOIN sucursales s ON bd.sucursal_id = s.id
        WHERE bd.deleted_at IS NULL
        GROUP BY bd.sucursal_id, s.name
      `;

      const sucursalStats = await this.pool.query(sucursalStatsQuery, [DeviceStatus.CONECTADO, DeviceStatus.SINCRONIZANDO]);

      const bySucursal: Record<string, any> = {};
      sucursalStats.rows.forEach(row => {
        bySucursal[row.sucursal_id] = {
          total: parseInt(row.total),
          active: parseInt(row.active),
          online: parseInt(row.online),
          uptime: row.online > 0 ? (parseInt(row.online) / parseInt(row.total)) * 100 : 0
        };
      });

      return {
        totalDevices: parseInt(basicStats.rows[0].total_devices),
        activeDevices: parseInt(basicStats.rows[0].active_devices),
        onlineDevices: parseInt(basicStats.rows[0].online_devices),
        averageUptime: basicStats.rows[0].total_devices > 0 
          ? (parseInt(basicStats.rows[0].online_devices) / parseInt(basicStats.rows[0].total_devices)) * 100 
          : 0,
        bySucursal,
        topPerforming: [], // Se implementaría con datos históricos
        issues: [] // Se implementaría con análisis de logs
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de rendimiento', 'BiometricDevicePostgresRepository', { startDate, endDate }, error as Error);
      throw new Error(`Error al obtener estadísticas: ${(error as Error).message}`);
    }
  }

  /**
   * Configurar alertas para el dispositivo
   */
  async configureAlerts(deviceId: string, alerts: {
    disconnectionAlert: boolean;
    lowMemoryAlert: boolean;
    highTemperatureAlert: boolean;
    syncFailureAlert: boolean;
    maintenanceAlert: boolean;
  }): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const device = await this.findById(deviceId);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      const config: IExtendedDeviceConfiguration = { 
        ...device.configuracion,
        alerts: {
          disconnectionAlert: false,
          lowMemoryAlert: false,
          highTemperatureAlert: false,
          syncFailureAlert: false,
          maintenanceAlert: false,
          // Conservar alertas existentes si están definidas
          ...(device.configuracion as IExtendedDeviceConfiguration).alerts
        }
      };
      
      config.alerts = alerts;

      const query = `
        UPDATE biometric_devices 
        SET configuration = $1, updated_at = $2
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [JSON.stringify(config), new Date(), deviceId]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      logger.info('Alertas configuradas', 'BiometricDevicePostgresRepository', { deviceId });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error configurando alertas', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      throw new Error(`Error al configurar alertas: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener dispositivos que requieren atención
   */
  async findRequiringAttention(): Promise<Array<{
    device: BiometricDevice;
    issues: Array<{
      type: 'disconnected' | 'low_memory' | 'high_temperature' | 'sync_failure' | 'maintenance_due';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      since: Date;
    }>;
  }>> {
    try {
      const devices = await this.findActive();
      const results: Array<{
        device: BiometricDevice;
        issues: Array<{
          type: 'disconnected' | 'low_memory' | 'high_temperature' | 'sync_failure' | 'maintenance_due';
          severity: 'low' | 'medium' | 'high' | 'critical';
          message: string;
          since: Date;
        }>;
      }> = [];

      const now = new Date();

      for (const device of devices) {
        const issues: any[] = [];

        // Verificar desconexión
        if (!device.estaConectado) {
          issues.push({
            type: 'disconnected',
            severity: 'high',
            message: 'Dispositivo desconectado',
            since: device.ultimaConexion || device.createdAt
          });
        }

        // Verificar sincronización atrasada
        if (device.sincronizacionAtrasada) {
          issues.push({
            type: 'sync_failure',
            severity: 'medium',
            message: 'Sincronización atrasada',
            since: device.ultimaSincronizacion || device.createdAt
          });
        }

        // Verificar mantenimiento
        if (device.estado === DeviceStatus.MANTENIMIENTO) {
          issues.push({
            type: 'maintenance_due',
            severity: 'medium',
            message: 'En mantenimiento',
            since: device.updatedAt
          });
        }

        if (issues.length > 0) {
          results.push({ device, issues });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error obteniendo dispositivos que requieren atención', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al obtener dispositivos: ${(error as Error).message}`);
    }
  }

  /**
   * Exportar configuración de dispositivos para backup
   */
  async exportConfiguration(): Promise<{
    devices: Array<{
      id: string;
      name: string;
      model: string;
      serialNumber: string;
      ipAddress: string;
      port: number;
      sucursalId: string;
      configuration: any;
      isActive: boolean;
    }>;
    exportDate: Date;
    totalDevices: number;
  }> {
    try {
      const query = `
        SELECT 
          id, name, model, serial_number, ip_address, port,
          sucursal_id, configuration, is_active
        FROM biometric_devices 
        WHERE deleted_at IS NULL
        ORDER BY name
      `;
      
      const result = await this.pool.query(query);
      
      const devices = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        model: row.model,
        serialNumber: row.serial_number,
        ipAddress: row.ip_address,
        port: row.port,
        sucursalId: row.sucursal_id,
        configuration: typeof row.configuration === 'string' 
          ? JSON.parse(row.configuration) 
          : row.configuration,
        isActive: row.is_active
      }));

      return {
        devices,
        exportDate: new Date(),
        totalDevices: devices.length
      };
    } catch (error) {
      logger.error('Error exportando configuración', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al exportar configuración: ${(error as Error).message}`);
    }
  }

  /**
   * Importar configuración de dispositivos desde backup
   */
  async importConfiguration(configData: any): Promise<{
    imported: number;
    updated: number;
    errors: Array<{
      device: string;
      error: string;
    }>;
  }> {
    const client = await this.pool.connect();
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as Array<{ device: string; error: string; }>
    };

    try {
      await client.query('BEGIN');

      for (const deviceConfig of configData.devices) {
        try {
          // Verificar si el dispositivo existe
          const existingDevice = await this.findById(deviceConfig.id);

          if (existingDevice) {
            // Actualizar dispositivo existente
            await this.update(deviceConfig.id, {
              nombre: deviceConfig.name,
              ip: deviceConfig.ipAddress,
              puerto: deviceConfig.port,
              modelo: deviceConfig.model,
              numeroSerie: deviceConfig.serialNumber,
              configuracion: deviceConfig.configuration,
              isActive: deviceConfig.isActive
            });
            results.updated++;
          } else {
            // Crear nuevo dispositivo
            const newDevice = BiometricDevice.createFaceID360(
              deviceConfig.name,
              deviceConfig.sucursalId,
              deviceConfig.ipAddress,
              deviceConfig.port
            );
            
            await this.create(newDevice);
            results.imported++;
          }
        } catch (error) {
          results.errors.push({
            device: deviceConfig.name || deviceConfig.id,
            error: (error as Error).message
          });
        }
      }

      await client.query('COMMIT');
      logger.info('Configuración importada', 'BiometricDevicePostgresRepository', results);
      
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error importando configuración', 'BiometricDevicePostgresRepository', {}, error as Error);
      throw new Error(`Error al importar configuración: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Resetear dispositivo a configuración de fábrica
   */
  async factoryReset(deviceId: string, confirmedBy: string): Promise<BiometricDevice> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const device = await this.findById(deviceId);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      // Configuración de fábrica por defecto
      const factoryConfig: IExtendedDeviceConfiguration = {
        timeoutConexion: 10000,
        timeoutRequest: 30000,
        intentosReconexion: 3,
        intervaloSincronizacion: 300000,
        modoDebug: false,
        compresionDatos: true,
        nivelConfianza: 75,
        capacidadUsuarios: 3000,
        capacidadRegistros: 100000,
        resetBy: confirmedBy,
        resetDate: new Date()
      };

      const query = `
        UPDATE biometric_devices 
        SET configuration = $1, 
            status = $2,
            last_error = $3,
            updated_at = $4
        WHERE id = $5 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [
        JSON.stringify(factoryConfig),
        DeviceStatus.DESCONECTADO,
        `Reset de fábrica realizado por ${confirmedBy}`,
        new Date(),
        deviceId
      ]);

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Dispositivo no encontrado');
      }

      logger.info('Reset de fábrica completado', 'BiometricDevicePostgresRepository', { deviceId, confirmedBy });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en reset de fábrica', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      throw new Error(`Error en reset de fábrica: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Obtener capacidad de almacenamiento del dispositivo
   */
  async getStorageInfo(deviceId: string): Promise<{
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    totalUsers: number;
    maxUsers: number;
    totalRecords: number;
    maxRecords: number;
    recommendedCleanup: boolean;
  }> {
    try {
      const device = await this.findById(deviceId);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      const config = device.configuracion as IExtendedDeviceConfiguration;
      const maxUsers = config.capacidadUsuarios || 3000;
      const maxRecords = config.capacidadRegistros || 100000;
      const totalUsers = config.totalUsers || 0;
      const totalRecords = config.totalRecords || 0;

      const userCapacityUsed = (totalUsers / maxUsers) * 100;
      const recordCapacityUsed = (totalRecords / maxRecords) * 100;
      const totalCapacityUsed = Math.max(userCapacityUsed, recordCapacityUsed);

      return {
        totalCapacity: 100,
        usedCapacity: totalCapacityUsed,
        availableCapacity: 100 - totalCapacityUsed,
        totalUsers,
        maxUsers,
        totalRecords,
        maxRecords,
        recommendedCleanup: totalCapacityUsed > 80
      };
    } catch (error) {
      logger.error('Error obteniendo información de almacenamiento', 'BiometricDevicePostgresRepository', { deviceId }, error as Error);
      throw new Error(`Error al obtener información de almacenamiento: ${(error as Error).message}`);
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto BiometricDevice
   */
  private mapRowToDevice(row: any): BiometricDevice {
    const deviceData = {
      id: row.id,
      nombre: row.name,
      sucursalId: row.sucursal_id,
      ip: row.ip_address,
      puerto: row.port,
      modelo: row.model,
      numeroSerie: row.serial_number,
      firmwareVersion: row.firmware_version,
      estado: row.status,
      ubicacionFisica: row.physical_location,
      configuracion: row.configuration ? 
        (typeof row.configuration === 'string' ? JSON.parse(row.configuration) : row.configuration) : 
        undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };

    const device = new BiometricDevice(deviceData);
    
    // Establecer campos adicionales que no están en el constructor
    if (row.last_connection) {
      (device as any)._ultimaConexion = row.last_connection;
    }
    if (row.last_sync) {
      (device as any)._ultimaSincronizacion = row.last_sync;
    }
    if (row.last_error) {
      (device as any)._ultimoError = row.last_error;
    }

    return device;
  }
}

export default BiometricDevicePostgresRepository;