// src/infrastructure/database/connections/index.ts

/**
 * 🔌 ÍNDICE DE CONEXIONES DE BASE DE DATOS
 * Exporta todas las conexiones disponibles y factory functions
 */

// Conexiones específicas
export { SqlServerConnection, createSqlServerConnection } from './sqlserver.connection';
export { PostgresConnection, createPostgresConnection } from './postgres.connection';

// Importaciones para factory
import { SqlServerConnection } from './sqlserver.connection';
import { PostgresConnection } from './postgres.connection';
import { IDatabaseAdapter } from '@/core/interfaces/adapters/database.adapter.interface';
import { DatabaseType, IConnectionConfig, ISqlServerConfig, IPostgreSQLConfig } from '@/shared/types/database.types';
import { getLogger } from '@/shared/utils/logger.util';

const logger = getLogger();

/**
 * 🏭 Database Connection Factory
 * Factory para crear conexiones de base de datos basadas en configuración
 */
export class DatabaseConnectionFactory {
  
  /**
   * Crea una conexión de base de datos basada en el tipo
   */
  static createConnection(config: IConnectionConfig): IDatabaseAdapter {
    switch (config.type) {
      case 'sqlserver':
        return new SqlServerConnection();
      
      case 'postgresql':
        return new PostgresConnection();
      
      default:
        throw new Error(`Tipo de base de datos no soportado: ${config.type}`);
    }
  }

  /**
   * Crea específicamente una conexión SQL Server
   */
  static createSqlServerConnection(config?: ISqlServerConfig): SqlServerConnection {
    return new SqlServerConnection();
  }

  /**
   * Crea específicamente una conexión PostgreSQL
   */
  static createPostgreSQLConnection(config?: IPostgreSQLConfig): PostgresConnection {
    return new PostgresConnection();
  }

  /**
   * Obtiene una conexión basada en variables de entorno
   */
  static createFromEnvironment(): IDatabaseAdapter {
    const dbType = (process.env.DATABASE_TYPE || 'postgresql') as DatabaseType;
    
    const baseConfig: IConnectionConfig = {
      type: dbType,
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'attendance_db',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password'
    };

    logger.info(`🔌 Creando conexión de tipo: ${dbType}`);
    
    return this.createConnection(baseConfig);
  }

  /**
   * Prueba múltiples conexiones
   */
  static async testConnections(configs: IConnectionConfig[]): Promise<{
    successful: string[];
    failed: Array<{ type: string; error: string }>;
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ type: string; error: string }>
    };

    for (const config of configs) {
      try {
        const connection = this.createConnection(config);
        await connection.connect();
        
        const healthCheck = await connection.healthCheck();
        if (healthCheck.isHealthy) {
          results.successful.push(config.type);
          logger.info(`✅ Conexión ${config.type} exitosa`);
        } else {
          results.failed.push({
            type: config.type,
            error: 'Health check falló'
          });
        }
        
        await connection.disconnect();
        
      } catch (error) {
        results.failed.push({
          type: config.type,
          error: error.message
        });
        logger.error(`❌ Conexión ${config.type} falló:`, error);
      }
    }

    return results;
  }

  /**
   * Lista los tipos de conexión soportados
   */
  static getSupportedTypes(): DatabaseType[] {
    return ['sqlserver', 'postgresql'];
  }
}

/**
 * 🔧 Funciones de utilidad para conexiones
 */
export const ConnectionUtils = {
  /**
   * Valida una configuración de conexión
   */
  validateConfig(config: IConnectionConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.host) errors.push('Host es requerido');
    if (!config.port || config.port <= 0) errors.push('Puerto debe ser mayor a 0');
    if (!config.database) errors.push('Nombre de base de datos es requerido');
    if (!config.username) errors.push('Usuario es requerido');
    if (!config.password) errors.push('Contraseña es requerida');
    if (!['sqlserver', 'postgresql'].includes(config.type)) {
      errors.push('Tipo de base de datos no soportado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Construye string de conexión para logging (sin password)
   */
  buildConnectionString(config: IConnectionConfig): string {
    return `${config.type}://${config.username}:***@${config.host}:${config.port}/${config.database}`;
  },

  /**
   * Obtiene configuración desde URL de conexión
   */
  parseConnectionUrl(url: string): Partial<IConnectionConfig> {
    try {
      const parsed = new URL(url);
      
      return {
        type: parsed.protocol.slice(0, -1) as DatabaseType,
        host: parsed.hostname,
        port: parseInt(parsed.port) || undefined,
        database: parsed.pathname.slice(1),
        username: parsed.username,
        password: parsed.password
      };
    } catch (error) {
      throw new Error(`URL de conexión inválida: ${url}`);
    }
  }
};

/**
 * 🎯 Export por defecto
 */
export default DatabaseConnectionFactory;