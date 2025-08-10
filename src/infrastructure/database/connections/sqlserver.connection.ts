// src/infrastructure/database/connections/sqlserver.connection.ts

import sql from 'mssql';
import { IDatabaseAdapter, ITransactionContext } from '@/core/interfaces/adapters/database.adapter.interface';
import { getLogger } from '@/shared/utils/logger.util';

import { getSqlServerConfig } from '@/config/database.config';

const logger = getLogger();
import { ISqlServerConfig } from '@/shared/types/database.types';

/**
 * 🔌 SQL Server Database Connection
 * Implementa la conexión y operaciones para SQL Server
 * 
 * Características:
 * - Pool de conexiones automático
 * - Transacciones seguras
 * - Manejo de errores robusto
 * - Logging de operaciones
 * - Reconexión automática
 */
export class SqlServerConnection implements IDatabaseAdapter {
  private pool: sql.ConnectionPool | null = null;
  private config: ISqlServerConfig;
  private isConnectedState: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 3;

  constructor() {
    this.config = getSqlServerConfig();
  }

  /**
   * 🚀 Establece conexión con SQL Server
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnectedState && this.pool) {
        logger.info('🔌 SQL Server ya está conectado');
        return;
      }

      logger.info('🔄 Conectando a SQL Server...');
      
      // Configuración optimizada para el pool
      const poolConfig: any = {
        server: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        
        // Configuración de seguridad
        encrypt: this.config.encrypt || false,
        trustServerCertificate: this.config.trustServerCertificate || true,
        
        // Configuración del pool
        pool: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 60000,
          destroyTimeoutMillis: 5000,
          reapIntervalMillis: 1000
        },
        
        // Configuración de request
        requestTimeout: 30000,
        connectionTimeout: 60000,
        
        // Opciones adicionales
        options: {
          enableArithAbort: true,
          abortTransactionOnError: true,
          trustServerCertificate: true
        }
      };

      this.pool = new sql.ConnectionPool(poolConfig);
      
      // Eventos del pool
      this.pool.on('connect', () => {
        logger.info('✅ SQL Server conectado exitosamente');
        this.isConnectedState = true;
        this.reconnectAttempts = 0;
      });

      this.pool.on('close', () => {
        logger.warn('⚠️ Conexión SQL Server cerrada');
        this.isConnectedState = false;
      });

      this.pool.on('error', (err) => {
        logger.error('❌ Error en pool SQL Server:', err);
        this.isConnectedState = false;
        this.handleConnectionError();
      });

      await this.pool.connect();
      
    } catch (error) {
      logger.error('❌ Error conectando a SQL Server:', error);
              this.isConnectedState = false;
      throw new Error(`Error de conexión SQL Server: ${error}`);
    }
  }

  /**
   * 🔌 Cierra la conexión
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        this.isConnectedState = false;
        logger.info('🔌 SQL Server desconectado');
      }
    } catch (error) {
      logger.error('❌ Error desconectando SQL Server:', error);
      throw error;
    }
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
      
      const request = this.pool!.request();
      
      // Agregar parámetros
      params.forEach((value, index) => {
        request.input(`param${index}`, value);
      });

      logger.debug(`🔍 Ejecutando query SQL Server: ${sqlQuery}`);
      
      const startTime = Date.now();
      const result = await request.query(sqlQuery);
      const executionTime = Date.now() - startTime;

      logger.debug(`⚡ Query ejecutada en ${executionTime}ms`);

      return result.recordset || [];

    } catch (error) {
      logger.error(`❌ Error ejecutando query SQL Server: ${error}`);
      throw new Error(`Error en query SQL Server: ${error}`);
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
    const sqlTransaction = new sql.Transaction(this.pool!);
    
    try {
      await this.ensureConnection();
      await sqlTransaction.begin();
      
      logger.debug('🔄 Iniciando transacción SQL Server');
      
      const transactionContext: ITransactionContext = {
        query: async <U>(sqlQuery: string, params: any[] = []): Promise<U[]> => {
          const request = new sql.Request(sqlTransaction);
          
          params.forEach((value, index) => {
            request.input(`param${index}`, value);
          });
          
          const result = await request.query(sqlQuery);
          return result.recordset || [];
        },
        
        queryOne: async <U>(sqlQuery: string, params: any[] = []): Promise<U | null> => {
          const results = await transactionContext.query<U>(sqlQuery, params);
          return results.length > 0 ? results[0] : null;
        },

        commit: async (): Promise<void> => {
          await sqlTransaction.commit();
        },

        rollback: async (): Promise<void> => {
          await sqlTransaction.rollback();
        }
      };
      
      const result = await operations(transactionContext);
      
      await sqlTransaction.commit();
      logger.info('✅ Transacción SQL Server completada exitosamente');
      
      return result;
      
    } catch (error) {
      logger.error(`❌ Error en transacción SQL Server: ${error}`);
      
      try {
        await sqlTransaction.rollback();
        logger.info('🔄 Rollback de transacción completado');
      } catch (rollbackError) {
        logger.error(`❌ Error en rollback: ${rollbackError}`);
      }
      
      throw new Error(`Error en transacción SQL Server: ${error}`);
    }
  }

  /**
   * 🔄 Inicia transacción manual
   */
  async beginTransaction(): Promise<ITransactionContext> {
    await this.ensureConnection();
    const sqlTransaction = new sql.Transaction(this.pool!);
    await sqlTransaction.begin();
    
    return {
      query: async <U>(sqlQuery: string, params: any[] = []): Promise<U[]> => {
        const request = new sql.Request(sqlTransaction);
        
        params.forEach((value, index) => {
          request.input(`param${index}`, value);
        });
        
        const result = await request.query(sqlQuery);
        return result.recordset || [];
      },
      
      queryOne: async <U>(sqlQuery: string, params: any[] = []): Promise<U | null> => {
        const request = new sql.Request(sqlTransaction);
        
        params.forEach((value, index) => {
          request.input(`param${index}`, value);
        });
        
        const result = await request.query(sqlQuery);
        const rows = result.recordset || [];
        return rows.length > 0 ? rows[0] : null;
      },

      commit: async (): Promise<void> => {
        await sqlTransaction.commit();
      },

      rollback: async (): Promise<void> => {
        await sqlTransaction.rollback();
      }
    };
  }

  /**
   * 🔍 Verifica si está conectado
   */
  isConnected(): boolean {
    return this.isConnectedState && !!this.pool?.connected;
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
      poolSize: this.pool?.size || 0,
      activeConnections: this.pool?.size ? this.pool.size - this.pool.available : 0
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
      logger.error('❌ Health check falló:', error);
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
      size: this.pool.size,
      available: this.pool.available,
      pending: this.pool.pending,
      borrowed: this.pool.borrowed
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
        logger.error('❌ Error en reconexión:', error);
      }
    }, delay);
  }

  /**
   * 🛡️ Asegura que la conexión esté activa
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnectedState || !this.pool) {
      logger.warn('⚠️ Conexión no activa, reconectando...');
      await this.connect();
    }

    // Verificar que el pool esté realmente conectado
    if (!this.pool?.connected) {
      throw new Error('Pool de conexiones SQL Server no está conectado');
    }
  }
}

/**
 * 🏭 Factory function para crear instancia de SQL Server
 */
export const createSqlServerConnection = (): SqlServerConnection => {
  return new SqlServerConnection();
};

/**
 * 📊 Exportación por defecto
 */
export default SqlServerConnection;