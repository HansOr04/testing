// src/core/interfaces/adapters/index.ts

/**
 * Índice de todas las interfaces de adaptadores
 * Facilita la importación y exportación de contratos de adaptadores externos
 */

// Adapter interfaces
export type { IDatabaseAdapter, ITransactionContext } from './database.adapter.interface';
export type { IBiometricAdapter } from './biometric.adapter.interface';
export type { IEmailAdapter } from './email.adapter.interface';

// Re-export types for use in union types
import type { IDatabaseAdapter } from './database.adapter.interface';
import type { IBiometricAdapter } from './biometric.adapter.interface';
import type { IEmailAdapter } from './email.adapter.interface';

/**
 * Tipo unión de todos los adaptadores disponibles
 * Útil para inyección de dependencias y factory patterns
 */
export type AnyAdapter = 
  | IDatabaseAdapter
  | IBiometricAdapter
  | IEmailAdapter;

/**
 * Mapa de nombres de adaptadores a sus interfaces
 * Útil para registro dinámico de dependencias
 */
export interface AdapterMap {
  databaseAdapter: IDatabaseAdapter;
  biometricAdapter: IBiometricAdapter;
  emailAdapter: IEmailAdapter;
}

/**
 * Tipo para obtener el tipo de adaptador por su nombre
 */
export type AdapterType<T extends keyof AdapterMap> = AdapterMap[T];

/**
 * Constantes para identificadores de adaptadores
 * Útil para sistemas de inyección de dependencias
 */
export const ADAPTER_TOKENS = {
  DATABASE_ADAPTER: 'DatabaseAdapter',
  BIOMETRIC_ADAPTER: 'BiometricAdapter',
  EMAIL_ADAPTER: 'EmailAdapter',
} as const;

/**
 * Tipo para los tokens de adaptadores
 */
export type AdapterToken = typeof ADAPTER_TOKENS[keyof typeof ADAPTER_TOKENS];

/**
 * Interfaz base para todos los adaptadores
 * Define métodos comunes que todos los adaptadores deben implementar
 */
export interface IBaseAdapter {
  /**
   * Inicializar el adaptador
   */
  initialize?(): Promise<void>;

  /**
   * Limpiar recursos del adaptador
   */
  dispose?(): Promise<void>;

  /**
   * Verificar salud del adaptador
   */
  healthCheck?(): Promise<{
    isHealthy: boolean;
    message?: string;
    details?: any;
  }>;

  /**
   * Obtener configuración del adaptador
   */
  getConfiguration?(): any;
}