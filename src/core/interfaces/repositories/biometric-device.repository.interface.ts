// src/core/interfaces/repositories/biometric-device.repository.interface.ts

import { BiometricDevice } from '../../entities/biometric-device.entity';
import { DeviceStatus } from '../../enums/device-status.enum';
import { IResponse, IPagination } from '../../../shared/types/common.types';

/**
 * Contrato para el repositorio de dispositivos biométricos
 * Define todas las operaciones de persistencia para la entidad BiometricDevice
 */
export interface IBiometricDeviceRepository {
  /**
   * Buscar dispositivo por ID
   */
  findById(id: string): Promise<BiometricDevice | null>;

  /**
   * Buscar dispositivo por dirección IP
   */
  findByIpAddress(ipAddress: string): Promise<BiometricDevice | null>;

  /**
   * Buscar dispositivo por número de serie
   */
  findBySerialNumber(serialNumber: string): Promise<BiometricDevice | null>;

  /**
   * Buscar dispositivos por sucursal
   */
  findBySucursal(sucursalId: string): Promise<BiometricDevice[]>;

  /**
   * Buscar dispositivos por estado
   */
  findByStatus(status: DeviceStatus, pagination: IPagination): Promise<IResponse<BiometricDevice[]>>;

  /**
   * Obtener todos los dispositivos
   */
  findAll(pagination: IPagination): Promise<IResponse<BiometricDevice[]>>;

  /**
   * Buscar dispositivos activos
   */
  findActive(): Promise<BiometricDevice[]>;

  /**
   * Buscar dispositivos conectados
   */
  findConnected(): Promise<BiometricDevice[]>;

  /**
   * Buscar dispositivos desconectados
   */
  findDisconnected(): Promise<BiometricDevice[]>;

  /**
   * Crear nuevo dispositivo
   */
  create(device: BiometricDevice): Promise<BiometricDevice>;

  /**
   * Actualizar dispositivo existente
   */
  update(id: string, device: Partial<BiometricDevice>): Promise<BiometricDevice>;

  /**
   * Eliminar dispositivo
   */
  delete(id: string): Promise<void>;

  /**
   * Activar/desactivar dispositivo
   */
  toggleActive(id: string): Promise<BiometricDevice>;

  /**
   * Actualizar estado del dispositivo
   */
  updateStatus(id: string, status: DeviceStatus): Promise<BiometricDevice>;

  /**
   * Actualizar información de conexión
   */
  updateConnectionInfo(id: string, connectionInfo: {
    lastConnection?: Date;
    lastSync?: Date;
    isOnline?: boolean;
    firmwareVersion?: string;
    totalUsers?: number;
    totalRecords?: number;
  }): Promise<BiometricDevice>;

  /**
   * Verificar si existe dispositivo con la IP dada
   */
  existsByIpAddress(ipAddress: string): Promise<boolean>;

  /**
   * Verificar si existe dispositivo con el número de serie dado
   */
  existsBySerialNumber(serialNumber: string): Promise<boolean>;

  /**
   * Registrar heartbeat del dispositivo
   */
  updateHeartbeat(id: string): Promise<void>;

  /**
   * Buscar dispositivos que no han enviado heartbeat recientemente
   */
  findStaleDevices(thresholdMinutes: number): Promise<BiometricDevice[]>;

  /**
   * Obtener configuración de red para todos los dispositivos
   */
  getNetworkConfiguration(): Promise<Array<{
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    sucursalId: string;
    sucursalName: string;
    isActive: boolean;
    status: DeviceStatus;
  }>>;

  /**
   * Actualizar estadísticas del dispositivo
   */
  updateStatistics(id: string, stats: {
    totalUsers?: number;
    totalRecords?: number;
    availableMemory?: number;
    usedMemory?: number;
    cpuUsage?: number;
    temperature?: number;
  }): Promise<BiometricDevice>;

  /**
   * Obtener historial de estado del dispositivo
   */
  getStatusHistory(deviceId: string, days: number): Promise<Array<{
    timestamp: Date;
    status: DeviceStatus;
    details?: string;
  }>>;

  /**
   * Registrar evento en el dispositivo
   */
  logEvent(deviceId: string, event: {
    type: 'connection' | 'disconnection' | 'sync' | 'error' | 'maintenance';
    message: string;
    details?: any;
  }): Promise<void>;

  /**
   * Obtener logs de eventos del dispositivo
   */
  getEventLogs(deviceId: string, pagination: IPagination): Promise<IResponse<Array<{
    timestamp: Date;
    type: string;
    message: string;
    details?: any;
  }>>>;

  /**
   * Programar mantenimiento del dispositivo
   */
  scheduleMaintenance(deviceId: string, maintenanceDate: Date, description: string): Promise<void>;

  /**
   * Marcar mantenimiento como completado
   */
  completeMaintenance(deviceId: string, completedBy: string, notes?: string): Promise<void>;

  /**
   * Obtener dispositivos pendientes de mantenimiento
   */
  findPendingMaintenance(): Promise<BiometricDevice[]>;

  /**
   * Obtener estadísticas de rendimiento de dispositivos
   */
  getPerformanceStatistics(startDate: Date, endDate: Date): Promise<{
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
  }>;

  /**
   * Configurar alertas para el dispositivo
   */
  configureAlerts(deviceId: string, alerts: {
    disconnectionAlert: boolean;
    lowMemoryAlert: boolean;
    highTemperatureAlert: boolean;
    syncFailureAlert: boolean;
    maintenanceAlert: boolean;
  }): Promise<BiometricDevice>;

  /**
   * Obtener dispositivos que requieren atención
   */
  findRequiringAttention(): Promise<Array<{
    device: BiometricDevice;
    issues: Array<{
      type: 'disconnected' | 'low_memory' | 'high_temperature' | 'sync_failure' | 'maintenance_due';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      since: Date;
    }>;
  }>>;

  /**
   * Exportar configuración de dispositivos para backup
   */
  exportConfiguration(): Promise<{
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
  }>;

  /**
   * Importar configuración de dispositivos desde backup
   */
  importConfiguration(configData: any): Promise<{
    imported: number;
    updated: number;
    errors: Array<{
      device: string;
      error: string;
    }>;
  }>;

  /**
   * Resetear dispositivo a configuración de fábrica
   */
  factoryReset(deviceId: string, confirmedBy: string): Promise<BiometricDevice>;

  /**
   * Obtener capacidad de almacenamiento del dispositivo
   */
  getStorageInfo(deviceId: string): Promise<{
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
    totalUsers: number;
    maxUsers: number;
    totalRecords: number;
    maxRecords: number;
    recommendedCleanup: boolean;
  }>;
}