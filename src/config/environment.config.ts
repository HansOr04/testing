/**
 * CONFIGURACIÓN DE ENTORNO
 * Carga y valida variables de entorno del sistema
 * Proporciona configuraciones específicas por ambiente
 */

import dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

/**
 * Configuración del entorno de aplicación
 */
export interface IEnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  apiVersion: string;
  appName: string;
  timezone: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

/**
 * Configuración de dispositivos biométricos
 */
export interface IBiometricEnvironmentConfig {
  devices: Array<{
    id: string;
    name: string;
    ip: string;
    port: number;
    sucursalId?: string | undefined;
  }>;
  syncInterval: number;
  connectionTimeout: number;
  requestTimeout: number;
  maxRetries: number;
}

/**
 * Carga las variables de entorno
 */
export function loadEnvironment(): void {
  // Determinar qué archivo .env cargar
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    '.env.local',
    '.env'
  ];

  // Cargar el primer archivo .env que exista
  for (const envFile of envFiles) {
    const envPath = join(process.cwd(), envFile);
    if (existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      if (result.error) {
        logger.warn(`Error cargando ${envFile}`, 'EnvironmentConfig', { error: result.error.message });
      } else {
        logger.info(`Variables de entorno cargadas desde: ${envFile}`, 'EnvironmentConfig');
      }
      break;
    }
  }

  // Validar variables críticas
  validateRequiredEnvironmentVariables();
}

/**
 * Obtiene la configuración del entorno de aplicación
 */
export function getEnvironmentConfig(): IEnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV as any) || 'development';
  
  const config: IEnvironmentConfig = {
    nodeEnv,
    port: parseInt(process.env.PORT!) || 3001,
    apiVersion: process.env.API_VERSION || 'v1',
    appName: process.env.APP_NAME || 'Sistema de Asistencia',
    timezone: process.env.TZ || 'America/Guayaquil',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test'
  };

  return config;
}

/**
 * Obtiene el puerto del servidor
 */
export function getServerPort(): number {
  const port = parseInt(process.env.PORT!) || 3001;
  
  if (port < 1 || port > 65535) {
    throw new Error('Puerto debe estar entre 1 y 65535');
  }
  
  return port;
}

/**
 * Obtiene configuración de dispositivos biométricos
 */
export function getBiometricConfig(): IBiometricEnvironmentConfig {
  const devices = [];
  
  // Dispositivo 1
  if (process.env.BIOMETRIC_DEVICE_1_IP) {
    const sucursalId = process.env.BIOMETRIC_DEVICE_1_SUCURSAL_ID;
    devices.push({
      id: 'device-1',
      name: process.env.BIOMETRIC_DEVICE_1_NAME || 'FACEID-Sucursal-Norte',
      ip: process.env.BIOMETRIC_DEVICE_1_IP,
      port: parseInt(process.env.BIOMETRIC_DEVICE_1_PORT!) || 4370,
      ...(sucursalId && { sucursalId })
    });
  }

  // Dispositivo 2
  if (process.env.BIOMETRIC_DEVICE_2_IP) {
    const sucursalId = process.env.BIOMETRIC_DEVICE_2_SUCURSAL_ID;
    devices.push({
      id: 'device-2',
      name: process.env.BIOMETRIC_DEVICE_2_NAME || 'FACEID-Sucursal-Sur',
      ip: process.env.BIOMETRIC_DEVICE_2_IP,
      port: parseInt(process.env.BIOMETRIC_DEVICE_2_PORT!) || 4370,
      ...(sucursalId && { sucursalId })
    });
  }

  // Dispositivo 3
  if (process.env.BIOMETRIC_DEVICE_3_IP) {
    const sucursalId = process.env.BIOMETRIC_DEVICE_3_SUCURSAL_ID;
    devices.push({
      id: 'device-3',
      name: process.env.BIOMETRIC_DEVICE_3_NAME || 'FACEID-Sucursal-Este',
      ip: process.env.BIOMETRIC_DEVICE_3_IP,
      port: parseInt(process.env.BIOMETRIC_DEVICE_3_PORT!) || 4370,
      ...(sucursalId && { sucursalId })
    });
  }

  // Dispositivo 4
  if (process.env.BIOMETRIC_DEVICE_4_IP) {
    const sucursalId = process.env.BIOMETRIC_DEVICE_4_SUCURSAL_ID;
    devices.push({
      id: 'device-4',
      name: process.env.BIOMETRIC_DEVICE_4_NAME || 'FACEID-Sucursal-Oeste',
      ip: process.env.BIOMETRIC_DEVICE_4_IP,
      port: parseInt(process.env.BIOMETRIC_DEVICE_4_PORT!) || 4370,
      ...(sucursalId && { sucursalId })
    });
  }

  return {
    devices,
    syncInterval: parseInt(process.env.BIOMETRIC_SYNC_INTERVAL!) || 300000, // 5 minutos
    connectionTimeout: parseInt(process.env.BIOMETRIC_CONNECTION_TIMEOUT!) || 10000,
    requestTimeout: parseInt(process.env.BIOMETRIC_REQUEST_TIMEOUT!) || 30000,
    maxRetries: parseInt(process.env.BIOMETRIC_MAX_RETRIES!) || 3
  };
}

/**
 * Obtiene configuración de CORS
 */
export function getCorsConfig() {
  const origins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  
  return {
    origin: origins,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
  };
}

/**
 * Obtiene configuración de rate limiting
 */
export function getRateLimitConfig() {
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000, // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!) || 100,
    message: 'Demasiadas solicitudes desde esta IP, intente de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false
  };
}

/**
 * Obtiene configuración de uploads
 */
export function getUploadConfig() {
  return {
    maxFileSize: parseSize(process.env.UPLOAD_MAX_SIZE || '5MB'),
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    tempDir: process.env.TEMP_DIR || 'temp'
  };
}

/**
 * Obtiene configuración de sesión
 */
export function getSessionConfig() {
  return {
    timeout: parseInt(process.env.SESSION_TIMEOUT!) || 3600000, // 1 hora
    name: process.env.SESSION_NAME || 'asistencia-session',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const
  };
}

/**
 * Obtiene configuración de paginación
 */
export function getPaginationConfig() {
  return {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE!) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE!) || 100,
    defaultPage: 1
  };
}

/**
 * Valida variables de entorno requeridas
 */
function validateRequiredEnvironmentVariables(): void {
  const requiredVars: string[] = [];

  // Variables críticas del sistema
  if (!process.env.JWT_SECRET) {
    requiredVars.push('JWT_SECRET');
  }

  // Variables de base de datos según el tipo
  const dbType = process.env.DB_TYPE || 'postgresql';
  
  if (dbType === 'sqlserver') {
    const sqlServerVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    for (const varName of sqlServerVars) {
      if (!process.env[varName]) {
        requiredVars.push(varName);
      }
    }
  } else if (dbType === 'postgresql') {
    if (!process.env.POSTGRES_HOST && !process.env.SUPABASE_URL) {
      requiredVars.push('POSTGRES_HOST o SUPABASE_URL');
    }
  }

  if (requiredVars.length > 0) {
    const message = `Variables de entorno requeridas faltantes: ${requiredVars.join(', ')}`;
    logger.error(message, 'EnvironmentConfig');
    throw new Error(message);
  }

  logger.info('Todas las variables de entorno requeridas están presentes', 'EnvironmentConfig');
}

/**
 * Convierte string de tamaño a bytes
 */
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match || match.length < 3) {
    throw new Error(`Formato de tamaño inválido: ${sizeStr}`);
  }

  const valueStr = match[1];
  const unit = match[2];
  
  if (!valueStr || !unit) {
    throw new Error(`Formato de tamaño inválido: ${sizeStr}`);
  }

  const value = parseFloat(valueStr);
  const unitUpper = unit.toUpperCase();

  if (!units[unitUpper]) {
    throw new Error(`Unidad desconocida: ${unitUpper}`);
  }

  return Math.floor(value * units[unitUpper]);
}

/**
 * Obtiene todas las configuraciones del entorno
 */
export function getAllConfigurations() {
  return {
    environment: getEnvironmentConfig(),
    biometric: getBiometricConfig(),
    cors: getCorsConfig(),
    rateLimit: getRateLimitConfig(),
    upload: getUploadConfig(),
    session: getSessionConfig(),
    pagination: getPaginationConfig()
  };
}

/**
 * Valida la configuración completa del entorno
 */
export function validateEnvironmentConfiguration(): void {
  try {
    const config = getEnvironmentConfig();
    
    // Validar puerto
    if (config.port < 1 || config.port > 65535) {
      throw new Error('Puerto debe estar entre 1 y 65535');
    }

    // Validar timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: config.timezone });
    } catch (error) {
      throw new Error(`Timezone inválido: ${config.timezone}`);
    }

    // Validar dispositivos biométricos
    const biometricConfig = getBiometricConfig();
    if (biometricConfig.devices.length === 0) {
      logger.warn('No se configuraron dispositivos biométricos', 'EnvironmentConfig');
    }

    logger.info('Configuración de entorno validada correctamente', 'EnvironmentConfig', {
      nodeEnv: config.nodeEnv,
      port: config.port,
      biometricDevices: biometricConfig.devices.length
    });

  } catch (error) {
    logger.error('Error validando configuración de entorno', 'EnvironmentConfig', {}, error as Error);
    throw error;
  }
}

/**
 * Imprime configuración (sin datos sensibles)
 */
export function printConfiguration(): void {
  const config = getEnvironmentConfig();
  const biometricConfig = getBiometricConfig();

  console.log('\n🔧 CONFIGURACIÓN DEL SISTEMA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Aplicación: ${config.appName}`);
  console.log(`🌍 Entorno: ${config.nodeEnv}`);
  console.log(`🚀 Puerto: ${config.port}`);
  console.log(`📊 API Version: ${config.apiVersion}`);
  console.log(`🕐 Timezone: ${config.timezone}`);
  console.log(`📝 Log Level: ${config.logLevel}`);
  console.log(`🔐 Base de datos: ${process.env.DB_TYPE || 'postgresql'}`);
  console.log(`🤖 Dispositivos biométricos: ${biometricConfig.devices.length}`);
  
  if (biometricConfig.devices.length > 0) {
    console.log('\n📡 DISPOSITIVOS BIOMÉTRICOS:');
    biometricConfig.devices.forEach((device, index) => {
      console.log(`   ${index + 1}. ${device.name} (${device.ip}:${device.port})`);
    });
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export default {
  loadEnvironment,
  getEnvironmentConfig,
  getServerPort,
  getBiometricConfig,
  getCorsConfig,
  getRateLimitConfig,
  getUploadConfig,
  getSessionConfig,
  getPaginationConfig,
  getAllConfigurations,
  validateEnvironmentConfiguration,
  printConfiguration
};