// src/infrastructure/database/connections/postgres.connection.ts

import { Pool, Client, PoolClient, QueryResult } from 'pg';
import { IDatabaseAdapter, ITransactionContext } from '@/core/interfaces/adapters/database.adapter.interface';
import { IPostgreSQLConfig } from '@/shared/types/database.types';
import { getLogger } from '@/shared/utils/logger.util';
import { getPostgreSQLConfig } from '@/config/database.config';

const logger = getLogger();

/**
 * 🐘 PostgreSQL Database Connection
 * Implementa la conexión y operaciones para PostgreSQL/Supabase
 * 
 * Características:
 * - Pool de conexiones optimizado
 * - Transacciones ACID completas
 * - Soporte para Supabase
 * - Prepared statements
 * - Reconexión automática
 */
export class PostgresConnection implements IDatabaseAdapter {
  private pool: Pool | null = null;
  private config: IPostgreSQLConfig;
  private isConnectedState: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 3;

  constructor() {
    this.config = getPostgreSQLConfig();
  }

  /**
   * 🚀 Establece conexión con PostgreSQL
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnectedState && this.pool) {
        logger.info('🐘 PostgreSQL ya está conectado');
        return;
      }

      logger.info('🔄 Conectando a PostgreSQL...');
      
      // Configuración optimizada para el pool
      const poolConfig: any = {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        
        // Configuración SSL para Supabase/producción
        ssl: this.config.ssl ? (
          typeof this.config.ssl === 'boolean' 
            ? { rejectUnauthorized: false }
            : this.config.ssl
        ) : false,
        
        // Configuración del pool
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
        
        // Configuración de queries
        statement_timeout: 30000,
        query_timeout: 30000,
        
        // Configuración específica para PostgreSQL
        application_name: 'hansor04-testing',
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      };

      this.pool = new Pool(poolConfig);
      
      // Eventos del pool
      this.pool.on('connect', (client: PoolClient) => {
        logger.info('✅ Cliente PostgreSQL conectado');
        
        // Configurar timezone para Ecuador
        client.query('SET timezone = "America/Guayaquil"');
      });

      this.pool.on('acquire', () => {
        logger.debug('🔒 Cliente PostgreSQL adquirido del pool');
      });

      this.pool.on('release', () => {
        logger.debug('🔓 Cliente PostgreSQL liberado al pool');
      });

      this.pool.on('remove', () => {
        logger.debug('🗑️ Cliente PostgreSQL removido del pool');
      });

      this.pool.on('error', (err: Error) => {
        logger.error(`❌ Error en pool PostgreSQL: ${err}`);
        this.isConnectedState = false;
        this.handleConnectionError();
      });

      // Probar la conexión
      const client = await this.pool.connect();
      try {
        const result = await client.query('SELECT NOW() as current_time');
        logger.info(`✅ PostgreSQL conectado exitosamente: ${result.rows[0].current_time}`);
        this.isConnectedState = true;
        this.reconnectAttempts = 0;
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`❌ Error conectando a PostgreSQL: ${error}`);
      this.isConnectedState = false;
      throw new Error(`Error de conexión PostgreSQL: ${error}`);
    }
  }

  /**
   * 🔌 Cierra la conexión
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnectedState = false;
        logger.info('🔌 PostgreSQL desconectado');
      }
    } catch (error) {
      logger.error(`❌ Error desconectando PostgreSQL: ${error}`);
      throw error;
    }
  }

  /**
   * 🔍 Verifica si está conectado
   */
  isConnected(): boolean {
    return this.isConnectedState && !!this.pool && !this.pool.ended;
  }

  /**
   * 📊 Ejecuta una consulta SQL
   */
  async query<T = any>(
    sqlQuery: string, 
    params: any[] = []
  ): Promise<T[]> {
    try {
      await this.ensureConnection();
      
      logger.debug(`🔍 Ejecutando query PostgreSQL: ${sqlQuery}`);
      
      const startTime = Date.now();
      const result: QueryResult<T> = await this.pool!.query(sqlQuery, params);
      const executionTime = Date.now() - startTime;

      logger.debug(`⚡ Query ejecutada en ${executionTime}ms`);

      return result.rows || [];

    } catch (error) {
      logger.error(`❌ Error ejecutando query PostgreSQL: ${error}`);
      throw new Error(`Error en query PostgreSQL: ${error}`);
    }
  }

  /**
   * 📊 Ejecuta consulta que retorna un solo resultado
   */
  async queryOne<T = any>(
    sqlQuery: string, 
    params: any[] = []
  ): Promise<T | null> {
    const results = await this.query<T>(sqlQuery, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 💳 Ejecuta transacción
   */
  async transaction<T = any>(
    operations: (tx: ITransactionContext) => Promise<T>
  ): Promise<T> {
    const client = await this.pool!.connect();
    
    try {
      await this.ensureConnection();
      await client.query('BEGIN');
      
      logger.debug('🔄 Iniciando transacción PostgreSQL');
      
      const transactionContext: ITransactionContext = {
        query: async <U>(sqlQuery: string, params: any[] = []): Promise<U[]> => {
          const result: QueryResult<U> = await client.query(sqlQuery, params);
          return result.rows || [];
        },
        
        queryOne: async <U>(sqlQuery: string, params: any[] = []): Promise<U | null> => {
          const results = await transactionContext.query<U>(sqlQuery, params);
          return results.length > 0 ? results[0] : null;
        },

        commit: async (): Promise<void> => {
          await client.query('COMMIT');
        },

        rollback: async (): Promise<void> => {
          await client.query('ROLLBACK');
        }
      };
      
      const result = await operations(transactionContext);
      
      await client.query('COMMIT');
      logger.info('✅ Transacción PostgreSQL completada exitosamente');
      
      return result;
      
    } catch (error) {
      logger.error(`❌ Error en transacción PostgreSQL: ${error}`);
      
      try {
        await client.query('ROLLBACK');
        logger.info('🔄 Rollback de transacción completado');
      } catch (rollbackError) {
        logger.error(`❌ Error en rollback: ${rollbackError}`);
      }
      
      throw new Error(`Error en transacción PostgreSQL: ${error}`);
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 Inicia transacción manual
   */
  async beginTransaction(): Promise<ITransactionContext> {
    await this.ensureConnection();
    const client = await this.pool!.connect();
    await client.query('BEGIN');
    
    return {
      query: async <U>(sqlQuery: string, params: any[] = []): Promise<U[]> => {
        const result: QueryResult<U> = await client.query(sqlQuery, params);
        return result.rows || [];
      },
      
      queryOne: async <U>(sqlQuery: string, params: any[] = []): Promise<U | null> => {
        const result: QueryResult<U> = await client.query(sqlQuery, params);
        const rows = result.rows || [];
        return rows.length > 0 ? rows[0] : null;
      },

      commit: async (): Promise<void> => {
        try {
          await client.query('COMMIT');
        } finally {
          client.release();
        }
      },

      rollback: async (): Promise<void> => {
        try {
          await client.query('ROLLBACK');
        } finally {
          client.release();
        }
      }
    };
  }

  /**
   * 🔍 Obtiene información de la conexión
   */
  getConnectionInfo(): {
    database: string;
    host: string;
    port: number;
    isConnected: boolean;
    poolSize?: number;
    activeConnections?: number;
  } {
    return {
      database: this.config.database,
      host: this.config.host,
      port: this.config.port,
      isConnected: this.isConnectedState,
      poolSize: this.pool?.totalCount || 0,
      activeConnections: this.pool ? this.pool.totalCount - this.pool.idleCount : 0
    };
  }

  /**
   * 🏥 Verifica salud de la conexión
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    details?: any;
  }> {
    try {
      const startTime = Date.now();
      const result = await this.query('SELECT 1 as health');
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: result.length > 0 && result[0].health === 1,
        responseTime,
        details: {
          poolStats: this.getPoolStats(),
          connectionInfo: this.getConnectionInfo()
        }
      };
    } catch (error) {
      logger.error(`❌ Health check falló: ${error}`);
      return {
        isHealthy: false,
        responseTime: -1,
        details: { error: error.message }
      };
    }
  }

  /**
   * 📊 Obtiene estadísticas del pool
   */
  getPoolStats(): Record<string, any> {
    if (!this.pool) {
      return { connected: false };
    }

    return {
      connected: this.isConnectedState,
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      expiredCount: this.pool.expiredCount
    };
  }

  /**
   * 🔄 Maneja errores de conexión y reconexión
   */
  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Backoff exponencial

    logger.warn(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.disconnect();
        await this.connect();
      } catch (error) {
        logger.error(`❌ Error en reconexión: ${error}`);
      }
    }, delay);
  }

  /**
   * 🛡️ Asegura que la conexión esté activa
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnectedState || !this.pool || this.pool.ended) {
      logger.warn('⚠️ Conexión no activa, reconectando...');
      await this.connect();
    }
  }

  /**
   * 🔧 Ejecuta consulta con prepared statement
   */
  async preparedQuery<T = any>(
    name: string,
    sqlQuery: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      await this.ensureConnection();
      
      logger.debug(`🔍 Ejecutando prepared query PostgreSQL: ${name}`);
      
      const startTime = Date.now();
      const result: QueryResult<T> = await this.pool!.query({
        name,
        text: sqlQuery,
        values: params
      });
      const executionTime = Date.now() - startTime;

      logger.debug(`⚡ Prepared query ejecutada en ${executionTime}ms`);

      return result.rows || [];

    } catch (error) {
      logger.error(`❌ Error ejecutando prepared query PostgreSQL: ${error}`);
      throw new Error(`Error en prepared query PostgreSQL: ${error}`);
    }
  }

  /**
   * 📈 Ejecuta consulta con cursor para grandes datasets
   */
  async queryWithCursor<T = any>(
    sqlQuery: string,
    params: any[] = [],
    batchSize: number = 1000
  ): Promise<T[]> {
    const client = await this.pool!.connect();
    const results: T[] = [];
    
    try {
      await client.query('BEGIN');
      
      // Crear cursor
      const cursorName = `cursor_${Date.now()}`;
      await client.query(`DECLARE ${cursorName} CURSOR FOR ${sqlQuery}`, params);
      
      let hasMore = true;
      while (hasMore) {
        const result: QueryResult<T> = await client.query(`FETCH ${batchSize} FROM ${cursorName}`);
        
        if (result.rows.length > 0) {
          results.push(...result.rows);
        }
        
        hasMore = result.rows.length === batchSize;
      }
      
      await client.query(`CLOSE ${cursorName}`);
      await client.query('COMMIT');
      
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

/**
 * 🏭 Factory function para crear instancia de PostgreSQL
 */
export const createPostgresConnection = (): PostgresConnection => {
  return new PostgresConnection();
};

/**
 * 📊 Exportación por defecto
 */
export default PostgresConnection;