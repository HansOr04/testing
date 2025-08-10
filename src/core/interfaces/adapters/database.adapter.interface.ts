// src/core/interfaces/adapters/database.adapter.interface.ts

/**
 * Contrato para adaptadores de base de datos
 * Define operaciones genéricas para diferentes motores de BD
 */
export interface IDatabaseAdapter {
  /**
   * Conectar a la base de datos
   */
  connect(): Promise<void>;

  /**
   * Desconectar de la base de datos
   */
  disconnect(): Promise<void>;

  /**
   * Verificar estado de conexión
   */
  isConnected(): boolean;

  /**
   * Ejecutar consulta SQL
   */
  query<T>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Ejecutar consulta SQL y retornar un solo resultado
   */
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Ejecutar transacción
   */
  transaction<T>(operations: (tx: ITransactionContext) => Promise<T>): Promise<T>;

  /**
   * Iniciar transacción manual
   */
  beginTransaction(): Promise<ITransactionContext>;

  /**
   * Obtener información de conexión
   */
  getConnectionInfo(): {
    database: string;
    host: string;
    port: number;
    isConnected: boolean;
    poolSize?: number;
    activeConnections?: number;
  };

  /**
   * Verificar salud de la base de datos
   */
  healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    details?: any;
  }>;
}

/**
 * Contexto de transacción para operaciones atómicas
 */
export interface ITransactionContext {
  /**
   * Ejecutar consulta dentro de la transacción
   */
  query<T>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Ejecutar consulta y retornar un solo resultado
   */
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Confirmar transacción
   */
  commit(): Promise<void>;

  /**
   * Revertir transacción
   */
  rollback(): Promise<void>;
}

