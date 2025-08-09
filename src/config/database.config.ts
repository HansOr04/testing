/**
 * CONFIGURACIÓN DE BASE DE DATOS
 * Configuraciones para SQL Server (producción) y PostgreSQL (desarrollo)
 * con validaciones y manejo de conexiones
 */

import { 
  ISqlServerConfig, 
  IPostgreSQLConfig, 
  IConnectionConfig,
  DatabaseType,
  IConnectionPool
} from '@shared/types/database.types';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

/**
 * Configuración de pool de conexiones por defecto
 */
const DEFAULT_POOL_CONFIG: IConnectionPool = {
  min: 0,
  max: 10,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 60000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};

/**
 * Obtiene configuración para SQL Server (Producción)
 */
export function getSqlServerConfig(): ISqlServerConfig {
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Variable de entorno ${varName} es requerida para SQL Server`);
    }
  }

  const config: ISqlServerConfig = {
    type: 'sqlserver',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!) || 1433,
    database: process.env.DB_NAME!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT!) || 30000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT!) || 60000,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS!) || 10,
    
    // Configuraciones específicas de SQL Server
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE_NAME || undefined,
    domain: process.env.DB_DOMAIN || undefined,
    
    options: {
      useUTC: true,
      dateFirst: 1, // Lunes como primer día de la semana
      language: 'español'
    }
  };

  validateSqlServerConfig(config);
  
  logger.info('Configuración SQL Server cargada', 'DatabaseConfig', {
    host: config.host,
    port: config.port,
    database: config.database,
    encrypt: config.encrypt
  });

  return config;
}

/**
 * Obtiene configuración para PostgreSQL (Desarrollo/Pruebas)
 */
export function getPostgreSQLConfig(): IPostgreSQLConfig {
  const config: IPostgreSQLConfig = {
    type: 'postgresql',
    host: process.env.POSTGRES_HOST || process.env.SUPABASE_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT!) || 5432,
    database: process.env.POSTGRES_DB || 'postgres',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.SUPABASE_PASSWORD || '',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT!) || 30000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT!) || 60000,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS!) || 10,
    
    // Configuraciones específicas de PostgreSQL
    ssl: process.env.POSTGRES_SSL === 'true' || process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    schema: process.env.POSTGRES_SCHEMA || 'public',
    timezone: process.env.POSTGRES_TIMEZONE || 'America/Guayaquil'
  };

  validatePostgreSQLConfig(config);
  
  logger.info('Configuración PostgreSQL cargada', 'DatabaseConfig', {
    host: config.host,
    port: config.port,
    database: config.database,
    ssl: !!config.ssl
  });

  return config;
}

/**
 * Obtiene configuración según el tipo de base de datos
 */
export function getDatabaseConfig(): IConnectionConfig {
  const dbType = (process.env.DB_TYPE as DatabaseType) || 'postgresql';
  
  logger.info(`Cargando configuración para base de datos: ${dbType}`, 'DatabaseConfig');
  
  switch (dbType) {
    case 'sqlserver':
      return getSqlServerConfig();
    case 'postgresql':
      return getPostgreSQLConfig();
    default:
      throw new Error(`Tipo de base de datos no soportado: ${dbType}`);
  }
}

/**
 * Valida configuración de SQL Server
 */
function validateSqlServerConfig(config: ISqlServerConfig): void {
  const errors: string[] = [];

  if (!config.host) {
    errors.push('Host de SQL Server es requerido');
  }

  if (!config.database) {
    errors.push('Nombre de base de datos es requerido');
  }

  if (!config.username) {
    errors.push('Usuario de base de datos es requerido');
  }

  if (!config.password) {
    errors.push('Contraseña de base de datos es requerida');
  }

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('Puerto debe estar entre 1 y 65535');
  }

  if (config.connectionTimeout && config.connectionTimeout < 1000) {
    errors.push('Timeout de conexión debe ser al menos 1000ms');
  }

  if (config.requestTimeout && config.requestTimeout < 1000) {
    errors.push('Timeout de request debe ser al menos 1000ms');
  }

  if (errors.length > 0) {
    throw new Error(`Configuración SQL Server inválida: ${errors.join(', ')}`);
  }
}

/**
 * Valida configuración de PostgreSQL
 */
function validatePostgreSQLConfig(config: IPostgreSQLConfig): void {
  const errors: string[] = [];

  if (!config.host) {
    errors.push('Host de PostgreSQL es requerido');
  }

  if (!config.database) {
    errors.push('Nombre de base de datos es requerido');
  }

  if (!config.username) {
    errors.push('Usuario de base de datos es requerido');
  }

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('Puerto debe estar entre 1 y 65535');
  }

  if (errors.length > 0) {
    throw new Error(`Configuración PostgreSQL inválida: ${errors.join(', ')}`);
  }
}

/**
 * Obtiene configuración de pool de conexiones
 */
export function getPoolConfig(): IConnectionPool {
  return {
    min: parseInt(process.env.DB_POOL_MIN!) || DEFAULT_POOL_CONFIG.min!,
    max: parseInt(process.env.DB_POOL_MAX!) || DEFAULT_POOL_CONFIG.max!,
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT!) || DEFAULT_POOL_CONFIG.idleTimeoutMillis!,
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT!) || DEFAULT_POOL_CONFIG.acquireTimeoutMillis!,
    createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT!) || DEFAULT_POOL_CONFIG.createTimeoutMillis!,
    destroyTimeoutMillis: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT!) || DEFAULT_POOL_CONFIG.destroyTimeoutMillis!,
    reapIntervalMillis: parseInt(process.env.DB_POOL_REAP_INTERVAL!) || DEFAULT_POOL_CONFIG.reapIntervalMillis!,
    createRetryIntervalMillis: parseInt(process.env.DB_POOL_RETRY_INTERVAL!) || DEFAULT_POOL_CONFIG.createRetryIntervalMillis!
  };
}

/**
 * Verifica si la configuración es para producción
 */
export function isProductionConfig(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.DB_TYPE === 'sqlserver';
}

/**
 * Obtiene string de conexión para logging (sin contraseña)
 */
export function getConnectionStringForLogging(config: IConnectionConfig): string {
  return `${config.type}://${config.username}:***@${config.host}:${config.port}/${config.database}`;
}

/**
 * Configuración de retry para conexiones
 */
export function getRetryConfig() {
  return {
    attempts: parseInt(process.env.DB_RETRY_ATTEMPTS!) || 3,
    delay: parseInt(process.env.DB_RETRY_DELAY!) || 1000,
    backoff: (process.env.DB_RETRY_BACKOFF as 'fixed' | 'exponential') || 'exponential',
    maxDelay: parseInt(process.env.DB_RETRY_MAX_DELAY!) || 10000
  };
}

/**
 * Configuración específica para Supabase
 */
export function getSupabaseConfig() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  };
}

/**
 * Configuración de backup automático
 */
export function getBackupConfig() {
  return {
    enabled: process.env.DB_BACKUP_ENABLED === 'true',
    frequency: (process.env.DB_BACKUP_FREQUENCY as 'daily' | 'weekly' | 'monthly') || 'daily',
    retention: parseInt(process.env.DB_BACKUP_RETENTION!) || 30,
    location: process.env.DB_BACKUP_LOCATION || './backups',
    compression: process.env.DB_BACKUP_COMPRESSION === 'true'
  };
}

/**
 * Configuración de logging de queries
 */
export function getQueryLoggingConfig() {
  return {
    enabled: process.env.DB_LOG_QUERIES === 'true',
    logSlowQueries: process.env.DB_LOG_SLOW_QUERIES === 'true',
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD!) || 1000,
    logLevel: (process.env.DB_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info'
  };
}

/**
 * Obtiene configuración completa de base de datos
 */
export function getCompleteConfig() {
  const baseConfig = getDatabaseConfig();
  const poolConfig = getPoolConfig();
  const retryConfig = getRetryConfig();
  const backupConfig = getBackupConfig();
  const queryLoggingConfig = getQueryLoggingConfig();

  return {
    database: baseConfig,
    pool: poolConfig,
    retry: retryConfig,
    backup: backupConfig,
    queryLogging: queryLoggingConfig,
    isProduction: isProductionConfig()
  };
}

/**
 * Valida que todas las configuraciones requeridas estén presentes
 */
export function validateConfiguration(): void {
  try {
    const config = getDatabaseConfig();
    logger.info('Configuración de base de datos validada correctamente', 'DatabaseConfig');
  } catch (error) {
    logger.error('Error validando configuración de base de datos', 'DatabaseConfig', {}, error as Error);
    throw error;
  }
}

export default {
  getSqlServerConfig,
  getPostgreSQLConfig,
  getDatabaseConfig,
  getPoolConfig,
  isProductionConfig,
  getConnectionStringForLogging,
  getRetryConfig,
  getSupabaseConfig,
  getBackupConfig,
  getQueryLoggingConfig,
  getCompleteConfig,
  validateConfiguration
};