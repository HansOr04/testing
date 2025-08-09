/**
 * UTILIDAD DE LOGGING
 * Sistema de logging centralizado con soporte para archivos y consola
 * Incluye diferentes niveles de log y formateo personalizado
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Niveles de log
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Configuración del logger
export interface ILoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number; // MB
  maxFiles?: number;
  dateFormat?: string;
  includeStackTrace?: boolean;
}

// Entrada de log
export interface ILogEntry {
  timestamp: string;
  level: string;
  message: string;
  module?: string | undefined;
  metadata?: any;
  stack?: string | undefined;
}

class Logger {
  private config: ILoggerConfig;
  private static instance: Logger;

  private constructor(config: ILoggerConfig) {
    this.config = config;
    this.ensureLogDirectory();
  }

  /**
   * Obtiene la instancia singleton del logger
   */
  public static getInstance(config?: ILoggerConfig): Logger {
    if (!Logger.instance) {
      const defaultConfig: ILoggerConfig = {
        level: LogLevel.INFO,
        enableConsole: true,
        enableFile: true,
        filePath: 'logs/app.log',
        maxFileSize: 10,
        maxFiles: 5,
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        includeStackTrace: false
      };
      Logger.instance = new Logger(config || defaultConfig);
    }
    return Logger.instance;
  }

  /**
   * Actualiza la configuración del logger
   */
  public updateConfig(config: Partial<ILoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.ensureLogDirectory();
  }

  /**
   * Log de debug
   */
  public debug(message: string, module?: string, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, module, metadata);
  }

  /**
   * Log de información
   */
  public info(message: string, module?: string, metadata?: any): void {
    this.log(LogLevel.INFO, message, module, metadata);
  }

  /**
   * Log de advertencia
   */
  public warn(message: string, module?: string, metadata?: any): void {
    this.log(LogLevel.WARN, message, module, metadata);
  }

  /**
   * Log de error
   */
  public error(message: string, module?: string, metadata?: any, error?: Error): void {
    const logMetadata = {
      ...metadata,
      ...(error && {
        errorMessage: error.message,
        errorStack: error.stack
      })
    };
    this.log(LogLevel.ERROR, message, module, logMetadata);
  }

  /**
   * Log crítico
   */
  public critical(message: string, module?: string, metadata?: any, error?: Error): void {
    const logMetadata = {
      ...metadata,
      ...(error && {
        errorMessage: error.message,
        errorStack: error.stack
      })
    };
    this.log(LogLevel.CRITICAL, message, module, logMetadata);
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, module?: string, metadata?: any): void {
    if (level < this.config.level) {
      return;
    }

    const logEntry: ILogEntry = {
      timestamp: this.formatTimestamp(),
      level: LogLevel[level],
      message,
      metadata
    };

    if (module) {
      logEntry.module = module;
    }

    if (this.config.includeStackTrace && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
      logEntry.stack = new Error().stack;
    }

    if (this.config.enableConsole) {
      this.logToConsole(logEntry, level);
    }

    if (this.config.enableFile && this.config.filePath) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Log a consola con colores
   */
  private logToConsole(entry: ILogEntry, level: LogLevel): void {
    const colorCode = this.getColorCode(level);
    const resetCode = '\x1b[0m';
    
    const modulePrefix = entry.module ? `[${entry.module}] ` : '';
    const formattedMessage = `${colorCode}[${entry.timestamp}] ${entry.level}: ${modulePrefix}${entry.message}${resetCode}`;

    console.log(formattedMessage);

    if (entry.metadata) {
      console.log(colorCode, JSON.stringify(entry.metadata, null, 2), resetCode);
    }

    if (entry.stack) {
      console.log(colorCode, entry.stack, resetCode);
    }
  }

  /**
   * Log a archivo
   */
  private logToFile(entry: ILogEntry): void {
    if (!this.config.filePath) return;

    try {
      const logLine = this.formatLogLine(entry);
      appendFileSync(this.config.filePath, logLine + '\n', 'utf8');
      
      // Verificar tamaño del archivo
      this.checkFileRotation();
    } catch (error) {
      console.error('Error escribiendo al archivo de log:', error);
    }
  }

  /**
   * Formatea una línea de log para archivo
   */
  private formatLogLine(entry: ILogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level}]`,
      entry.module ? `[${entry.module}]` : '',
      entry.message
    ].filter(Boolean);

    let line = parts.join(' ');

    if (entry.metadata) {
      line += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
    }

    if (entry.stack) {
      line += ` | Stack: ${entry.stack.replace(/\n/g, ' | ')}`;
    }

    return line;
  }

  /**
   * Obtiene el código de color para la consola
   */
  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.CRITICAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }

  /**
   * Formatea timestamp
   */
  private formatTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Asegura que el directorio de logs existe
   */
  private ensureLogDirectory(): void {
    if (this.config.filePath) {
      const dir = dirname(this.config.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Verifica si es necesario rotar archivos de log
   */
  private checkFileRotation(): void {
    // Implementación básica - se puede expandir
    // TODO: Implementar rotación de archivos por tamaño
  }

  /**
   * Limpia recursos del logger
   */
  public cleanup(): void {
    // Limpieza de recursos si es necesario
  }
}

// Instancia global del logger
let loggerInstance: Logger;

/**
 * Inicializa el logger con configuración
 */
export function initializeLogger(config?: ILoggerConfig): Logger {
  loggerInstance = Logger.getInstance(config);
  return loggerInstance;
}

/**
 * Obtiene la instancia del logger
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = Logger.getInstance();
  }
  return loggerInstance;
}

// Funciones de conveniencia
export function logDebug(message: string, module?: string, metadata?: any): void {
  getLogger().debug(message, module, metadata);
}

export function logInfo(message: string, module?: string, metadata?: any): void {
  getLogger().info(message, module, metadata);
}

export function logWarn(message: string, module?: string, metadata?: any): void {
  getLogger().warn(message, module, metadata);
}

export function logError(message: string, module?: string, metadata?: any, error?: Error): void {
  getLogger().error(message, module, metadata, error);
}

export function logCritical(message: string, module?: string, metadata?: any, error?: Error): void {
  getLogger().critical(message, module, metadata, error);
}

// Logger específico para módulos
export function createModuleLogger(moduleName: string) {
  return {
    debug: (message: string, metadata?: any) => logDebug(message, moduleName, metadata),
    info: (message: string, metadata?: any) => logInfo(message, moduleName, metadata),
    warn: (message: string, metadata?: any) => logWarn(message, moduleName, metadata),
    error: (message: string, metadata?: any, error?: Error) => logError(message, moduleName, metadata, error),
    critical: (message: string, metadata?: any, error?: Error) => logCritical(message, moduleName, metadata, error)
  };
}

export default {
  Logger,
  LogLevel,
  initializeLogger,
  getLogger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logCritical,
  createModuleLogger
};