/**
 * TIPOS DE BASE DE DATOS
 * Interfaces y tipos para el manejo de conexiones de base de datos
 * Soporta SQL Server (producción) y PostgreSQL (desarrollo/pruebas)
 */

// Tipos de base de datos soportados
export type DatabaseType = 'sqlserver' | 'postgresql';

// Configuración de conexión base
export interface IConnectionConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  maxConnections?: number;
}

// Configuración específica para SQL Server
export interface ISqlServerConfig extends IConnectionConfig {
  type: 'sqlserver';
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  enableArithAbort?: boolean;
  instanceName?: string | undefined;
  domain?: string | undefined;
  options?: {
    useUTC?: boolean;
    dateFirst?: number;
    language?: string;
  };
}

// Configuración específica para PostgreSQL
export interface IPostgreSQLConfig extends IConnectionConfig {
  type: 'postgresql';
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  schema?: string;
  timezone?: string;
}

// Pool de conexiones
export interface IConnectionPool {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
}

// Resultado de consulta genérico
export interface IQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command?: string;
  fields?: any[];
  affectedRows?: number;
}

// Parámetros de consulta
export interface IQueryParams {
  [key: string]: any;
}

// Transacción
export interface ITransaction {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  query<T>(sql: string, params?: IQueryParams): Promise<IQueryResult<T>>;
}

// Adaptador de base de datos genérico
export interface IDatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  query<T>(sql: string, params?: IQueryParams): Promise<IQueryResult<T>>;
  transaction(): Promise<ITransaction>;
  healthCheck(): Promise<boolean>;
}

// Configuración de migración
export interface IMigration {
  id: string;
  name: string;
  up: string;
  down: string;
  version: number;
  executedAt?: Date;
}

// Log de consultas
export interface IQueryLog {
  sql: string;
  params?: IQueryParams;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Métricas de base de datos
export interface IDatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  errors: number;
  uptime: number;
}

// Configuración de backup
export interface IBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number; // días
  location: string;
  compression: boolean;
}

// Estado de conexión
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// Tipos de eventos de base de datos
export enum DatabaseEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  QUERY_START = 'query_start',
  QUERY_END = 'query_end',
  QUERY_ERROR = 'query_error',
  TRANSACTION_START = 'transaction_start',
  TRANSACTION_COMMIT = 'transaction_commit',
  TRANSACTION_ROLLBACK = 'transaction_rollback'
}

// Configuración de la factory de base de datos
export interface IDatabaseFactory {
  createConnection(config: IConnectionConfig): IDatabaseAdapter;
  createSqlServerConnection(config: ISqlServerConfig): IDatabaseAdapter;
  createPostgreSQLConnection(config: IPostgreSQLConfig): IDatabaseAdapter;
}

// Configuración de retry para conexiones
export interface IRetryConfig {
  attempts: number;
  delay: number;
  backoff: 'fixed' | 'exponential';
  maxDelay?: number;
}

