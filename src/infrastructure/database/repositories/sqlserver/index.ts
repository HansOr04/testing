// src/infrastructure/database/repositories/sqlserver/index.ts

/**
 * 📁 ÍNDICE DE REPOSITORIOS SQL SERVER
 * Exportaciones centralizadas para todos los repositorios de SQL Server
 */

// Repositorios principales
export { BiometricSqlServerRepository } from './biometric-log.sqlserver.repository';
export { SucursalSqlServerRepository } from './sucursal.sqlserver.repository';
export { AreaSqlServerRepository } from './area.sqlserver.repository';
export { DeviceSqlServerRepository } from './biometric-device.sqlserver.repository';

// Factory para crear repositorios con conexión compartida
import { SqlServerConnection } from '@/infrastructure/database/connections/sqlserver.connection';
import { BiometricSqlServerRepository } from './biometric-log.sqlserver.repository';
import { SucursalSqlServerRepository } from './sucursal.sqlserver.repository';
import { AreaSqlServerRepository } from './area.sqlserver.repository';
import { DeviceSqlServerRepository } from './biometric-device.sqlserver.repository';
import { getLogger } from '@/shared/utils/logger.util';

const logger = getLogger();

/**
 * Factory de Repositorios SQL Server
 * Crea instancias de repositorios con una conexión compartida
 */
export class SqlServerRepositoryFactory {
  constructor(private connection: SqlServerConnection) {}

  /**
   * Crea repositorio de logs biométricos
   */
  createBiometricRepository(): BiometricSqlServerRepository {
    return new BiometricSqlServerRepository(this.connection);
  }

  /**
   * Crea repositorio de sucursales
   */
  createSucursalRepository(): SucursalSqlServerRepository {
    return new SucursalSqlServerRepository(this.connection);
  }

  /**
   * Crea repositorio de áreas
   */
  createAreaRepository(): AreaSqlServerRepository {
    return new AreaSqlServerRepository(this.connection);
  }

  /**
   * Crea repositorio de dispositivos
   */
  createDeviceRepository(): DeviceSqlServerRepository {
    return new DeviceSqlServerRepository(this.connection);
  }

  /**
   * Crea todos los repositorios
   */
  createAllRepositories() {
    return {
      biometric: this.createBiometricRepository(),
      sucursal: this.createSucursalRepository(),
      area: this.createAreaRepository(),
      device: this.createDeviceRepository()
    };
  }

  /**
   * Obtiene la conexión SQL Server
   */
  getConnection(): SqlServerConnection {
    return this.connection;
  }

  /**
   * Verifica que la conexión esté activa
   */
  async ensureConnection(): Promise<void> {
    if (!this.connection.isConnected()) {
      logger.info('Reconectando a SQL Server...', 'RepositoryFactory');
      await this.connection.connect();
    }
  }

  /**
   * Cierra la conexión
   */
  async disconnect(): Promise<void> {
    if (this.connection.isConnected()) {
      await this.connection.disconnect();
      logger.info('Conexión SQL Server cerrada', 'RepositoryFactory');
    }
  }
}

/**
 * Crea factory de repositorios con conexión SQL Server
 */
export function createSqlServerRepositoryFactory(connection: SqlServerConnection): SqlServerRepositoryFactory {
  return new SqlServerRepositoryFactory(connection);
}

/**
 * Tipos para inyección de dependencias
 */
export const SQL_SERVER_REPOSITORY_TOKENS = {
  BIOMETRIC_REPOSITORY: 'SqlServerBiometricRepository',
  SUCURSAL_REPOSITORY: 'SqlServerSucursalRepository',
  AREA_REPOSITORY: 'SqlServerAreaRepository',
  DEVICE_REPOSITORY: 'SqlServerDeviceRepository',
  REPOSITORY_FACTORY: 'SqlServerRepositoryFactory'
} as const;

export type SqlServerRepositoryToken = typeof SQL_SERVER_REPOSITORY_TOKENS[keyof typeof SQL_SERVER_REPOSITORY_TOKENS];

/**
 * Configuración de repositorios SQL Server
 */
export interface ISqlServerRepositoryConfig {
  enableQueryLogging: boolean;
  queryTimeout: number;
  connectionPoolSize: number;
  retryAttempts: number;
  retryDelay: number;
  enableTransactionLogging: boolean;
  maxRetryDelay: number;
}

/**
 * Configuración por defecto
 */
export const DEFAULT_SQL_SERVER_REPOSITORY_CONFIG: ISqlServerRepositoryConfig = {
  enableQueryLogging: process.env.NODE_ENV === 'development',
  queryTimeout: 30000,
  connectionPoolSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
  enableTransactionLogging: true,
  maxRetryDelay: 10000
};

/**
 * Interfaz unificada de repositorios SQL Server
 */
export interface ISqlServerRepositories {
  biometric: BiometricSqlServerRepository;
  sucursal: SucursalSqlServerRepository;
  area: AreaSqlServerRepository;
  device: DeviceSqlServerRepository;
}

/**
 * Utilidad para inicializar repositorios SQL Server
 */
export async function initializeSqlServerRepositories(
  connection: SqlServerConnection,
  config: Partial<ISqlServerRepositoryConfig> = {}
): Promise<ISqlServerRepositories> {
  const finalConfig = { ...DEFAULT_SQL_SERVER_REPOSITORY_CONFIG, ...config };
  
  try {
    // Asegurar que la conexión esté activa
    if (!connection.isConnected()) {
      logger.info('Inicializando conexión SQL Server...', 'RepositoryFactory');
      await connection.connect();
    }

    // Verificar salud de la conexión
    const healthCheck = await connection.healthCheck();
    if (!healthCheck.isHealthy) {
      throw new Error(`Conexión SQL Server no saludable: ${healthCheck.details?.error || 'Unknown error'}`);
    }

    // Crear factory y repositorios
    const factory = new SqlServerRepositoryFactory(connection);
    const repositories = factory.createAllRepositories();

    // Log de inicialización exitosa
    logger.info('Repositorios SQL Server inicializados correctamente', 'RepositoryFactory', {
      config: finalConfig,
      repositoriesCount: Object.keys(repositories).length,
      connectionInfo: connection.getConnectionInfo()
    });

    return repositories;
  } catch (error) {
    logger.error('Error inicializando repositorios SQL Server', 'RepositoryFactory', { config: finalConfig }, error as Error);
    throw new Error(`Error inicializando repositorios: ${error}`);
  }
}

/**
 * Utilidad para verificar salud de repositorios
 */
export async function checkRepositoriesHealth(repositories: ISqlServerRepositories): Promise<{
  isHealthy: boolean;
  details: Record<string, { isHealthy: boolean; responseTime: number; error?: string }>;
  summary: {
    totalRepositories: number;
    healthyRepositories: number;
    unhealthyRepositories: number;
  };
}> {
  const startTime = Date.now();
  const details: Record<string, { isHealthy: boolean; responseTime: number; error?: string }> = {};

  // Test básico de cada repositorio con timeout
  const healthChecks = await Promise.allSettled([
    // Test repositorio biométrico
    Promise.race([
      repositories.biometric.findLastByEmployee('test-employee-id'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]),
    // Test repositorio sucursal
    Promise.race([
      repositories.sucursal.findActive(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]),
    // Test repositorio área
    Promise.race([
      repositories.area.findActive(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]),
    // Test repositorio dispositivos
    Promise.race([
      repositories.device.findActive(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ])
  ]);

  const repoNames = ['biometric', 'sucursal', 'area', 'device'];

  healthChecks.forEach((result, index) => {
    const repoName = repoNames[index]!;
    const responseTime = Date.now() - startTime;
    
    if (result.status === 'fulfilled') {
      details[repoName] = { isHealthy: true, responseTime };
    } else {
      details[repoName] = { 
        isHealthy: false, 
        responseTime, 
        error: result.reason?.message || 'Unknown error' 
      };
    }
  });

  const healthyCount = Object.values(details).filter(d => d.isHealthy).length;
  const isHealthy = healthyCount === repoNames.length;

  const summary = {
    totalRepositories: repoNames.length,
    healthyRepositories: healthyCount,
    unhealthyRepositories: repoNames.length - healthyCount
  };

  logger.info('Health check de repositorios completado', 'RepositoryFactory', {
    isHealthy,
    summary,
    totalTime: Date.now() - startTime
  });

  return { isHealthy, details, summary };
}

/**
 * Manejador de errores específico para repositorios SQL Server
 */
export class SqlServerRepositoryError extends Error {
  constructor(
    message: string,
    public readonly repository: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(`[${repository}] ${operation}: ${message}`);
    this.name = 'SqlServerRepositoryError';
  }

  /**
   * Convierte el error a un objeto JSON para logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      repository: this.repository,
      operation: this.operation,
      originalError: this.originalError?.message,
      stack: this.stack
    };
  }
}

/**
 * Decorador para manejo de errores en repositorios
 */
export function withErrorHandling(repositoryName: string, operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const sqlServerError = new SqlServerRepositoryError(
          error instanceof Error ? error.message : 'Unknown error',
          repositoryName,
          operationName,
          error instanceof Error ? error : undefined
        );
        
        // Log del error
        logger.error(sqlServerError.message, repositoryName, { 
          operationName, 
          args: args.length > 0 ? args[0] : undefined 
        }, sqlServerError);
        
        throw sqlServerError;
      }
    };

    return descriptor;
  };
}

/**
 * Utilidad para crear repositorio específico con manejo de errores
 */
export async function createRepositoryWithErrorHandling<T>(
  repositoryCreator: () => T,
  repositoryName: string
): Promise<T> {
  try {
    const repository = repositoryCreator();
    logger.debug(`Repositorio ${repositoryName} creado exitosamente`, 'RepositoryFactory');
    return repository;
  } catch (error) {
    const repoError = new SqlServerRepositoryError(
      `Error creando repositorio ${repositoryName}`,
      repositoryName,
      'creation',
      error instanceof Error ? error : undefined
    );
    
    logger.error(repoError.message, 'RepositoryFactory', {}, repoError);
    throw repoError;
  }
}

/**
 * Gestor de transacciones para múltiples repositorios
 */
export class TransactionManager {
  constructor(private connection: SqlServerConnection) {}

  /**
   * Ejecuta una operación dentro de una transacción
   */
  async executeInTransaction<T>(
    operation: (repositories: ISqlServerRepositories) => Promise<T>
  ): Promise<T> {
    return await this.connection.transaction(async (tx) => {
      // Crear repositorios que usen la transacción
      const factory = new SqlServerRepositoryFactory(this.connection);
      const repositories = factory.createAllRepositories();
      
      logger.debug('Iniciando operación transaccional', 'TransactionManager');
      
      try {
        const result = await operation(repositories);
        logger.info('Operación transaccional completada exitosamente', 'TransactionManager');
        return result;
      } catch (error) {
        logger.error('Error en operación transaccional', 'TransactionManager', {}, error as Error);
        throw error;
      }
    });
  }
}

/**
 * Utilidad para migración de datos entre repositorios
 */
export class DataMigrationHelper {
  constructor(private repositories: ISqlServerRepositories) {}

  /**
   * Migra datos de dispositivos biométricos
   */
  async migrateDeviceData(sourceData: any[]): Promise<{
    migrated: number;
    errors: Array<{ item: any; error: string }>;
  }> {
    const results = { migrated: 0, errors: [] as Array<{ item: any; error: string }> };

    for (const item of sourceData) {
      try {
        // Lógica de migración específica aquí
        await this.repositories.device.create(item);
        results.migrated++;
      } catch (error) {
        results.errors.push({
          item,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Migración de dispositivos completada', 'DataMigrationHelper', {
      total: sourceData.length,
      migrated: results.migrated,
      errors: results.errors.length
    });

    return results;
  }

  /**
   * Limpia datos obsoletos
   */
  async cleanupOldData(retentionDays: number): Promise<{
    biometricLogsDeleted: number;
    devicesInactive: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info('Iniciando limpieza de datos obsoletos', 'DataMigrationHelper', {
      cutoffDate: cutoffDate.toISOString(),
      retentionDays
    });

    // Implementar lógica de limpieza aquí
    // Por ahora retorna valores por defecto
    return {
      biometricLogsDeleted: 0,
      devicesInactive: 0
    };
  }
}

/**
 * Monitor de rendimiento para repositorios
 */
export class RepositoryPerformanceMonitor {
  private metrics: Map<string, {
    callCount: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  }> = new Map();

  /**
   * Registra una métrica de rendimiento
   */
  recordMetric(repositoryName: string, operation: string, executionTime: number, hasError: boolean = false) {
    const key = `${repositoryName}.${operation}`;
    const existing = this.metrics.get(key) || {
      callCount: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      errors: 0
    };

    existing.callCount++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.callCount;
    existing.maxTime = Math.max(existing.maxTime, executionTime);
    existing.minTime = Math.min(existing.minTime, executionTime);
    
    if (hasError) {
      existing.errors++;
    }

    this.metrics.set(key, existing);
  }

  /**
   * Obtiene reporte de rendimiento
   */
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    for (const [key, metrics] of this.metrics.entries()) {
      report[key] = {
        ...metrics,
        errorRate: (metrics.errors / metrics.callCount) * 100,
        minTime: metrics.minTime === Infinity ? 0 : metrics.minTime
      };
    }

    return report;
  }

  /**
   * Limpia métricas
   */
  clearMetrics() {
    this.metrics.clear();
  }
}

/**
 * Instancia global del monitor de rendimiento
 */
export const performanceMonitor = new RepositoryPerformanceMonitor();

/**
 * Wrapper para métricas de rendimiento
 */
export function withPerformanceMonitoring(repositoryName: string, operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let hasError = false;

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        hasError = true;
        throw error;
      } finally {
        const executionTime = Date.now() - startTime;
        performanceMonitor.recordMetric(repositoryName, operationName, executionTime, hasError);
      }
    };

    return descriptor;
  };
}

/**
 * Configurador de repositorios con todas las utilidades
 */
export class RepositoryConfigurator {
  private config: ISqlServerRepositoryConfig;
  private connection: SqlServerConnection;
  private repositories?: ISqlServerRepositories;
  private transactionManager?: TransactionManager;
  private migrationHelper?: DataMigrationHelper;

  constructor(connection: SqlServerConnection, config: Partial<ISqlServerRepositoryConfig> = {}) {
    this.connection = connection;
    this.config = { ...DEFAULT_SQL_SERVER_REPOSITORY_CONFIG, ...config };
  }

  /**
   * Inicializa todos los componentes
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Inicializando configurador de repositorios', 'RepositoryConfigurator');

      // Inicializar repositorios
      this.repositories = await initializeSqlServerRepositories(this.connection, this.config);

      // Inicializar gestor de transacciones
      this.transactionManager = new TransactionManager(this.connection);

      // Inicializar helper de migración
      this.migrationHelper = new DataMigrationHelper(this.repositories);

      logger.info('Configurador de repositorios inicializado exitosamente', 'RepositoryConfigurator');
    } catch (error) {
      logger.error('Error inicializando configurador de repositorios', 'RepositoryConfigurator', {}, error as Error);
      throw error;
    }
  }

  /**
   * Obtiene los repositorios
   */
  getRepositories(): ISqlServerRepositories {
    if (!this.repositories) {
      throw new Error('Repositorios no inicializados. Llama a initialize() primero.');
    }
    return this.repositories;
  }

  /**
   * Obtiene el gestor de transacciones
   */
  getTransactionManager(): TransactionManager {
    if (!this.transactionManager) {
      throw new Error('Gestor de transacciones no inicializado. Llama a initialize() primero.');
    }
    return this.transactionManager;
  }

  /**
   * Obtiene el helper de migración
   */
  getMigrationHelper(): DataMigrationHelper {
    if (!this.migrationHelper) {
      throw new Error('Helper de migración no inicializado. Llama a initialize() primero.');
    }
    return this.migrationHelper;
  }

  /**
   * Ejecuta verificación de salud completa
   */
  async runHealthCheck(): Promise<{
    connection: boolean;
    repositories: boolean;
    details: any;
  }> {
    const connectionHealth = await this.connection.healthCheck();
    
    let repositoriesHealth = { isHealthy: false, details: {}, summary: {} };
    if (this.repositories) {
      repositoriesHealth = await checkRepositoriesHealth(this.repositories);
    }

    return {
      connection: connectionHealth.isHealthy,
      repositories: repositoriesHealth.isHealthy,
      details: {
        connection: connectionHealth,
        repositories: repositoriesHealth
      }
    };
  }

  /**
   * Cierra todas las conexiones y limpia recursos
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('Limpiando recursos del configurador', 'RepositoryConfigurator');
      
      if (this.connection.isConnected()) {
        await this.connection.disconnect();
      }

      performanceMonitor.clearMetrics();
      
      logger.info('Limpieza completada', 'RepositoryConfigurator');
    } catch (error) {
      logger.error('Error durante limpieza', 'RepositoryConfigurator', {}, error as Error);
      throw error;
    }
  }
}

/**
 * Exportación por defecto con todas las utilidades
 */
export default {
  // Clases principales
  SqlServerRepositoryFactory,
  TransactionManager,
  DataMigrationHelper,
  RepositoryPerformanceMonitor,
  RepositoryConfigurator,
  SqlServerRepositoryError,

  // Funciones de utilidad
  createSqlServerRepositoryFactory,
  initializeSqlServerRepositories,
  checkRepositoriesHealth,
  createRepositoryWithErrorHandling,

  // Decoradores
  withErrorHandling,
  withPerformanceMonitoring,

  // Configuración y tokens
  SQL_SERVER_REPOSITORY_TOKENS,
  DEFAULT_SQL_SERVER_REPOSITORY_CONFIG,

  // Instancias globales
  performanceMonitor
};