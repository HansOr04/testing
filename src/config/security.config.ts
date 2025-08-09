/**
 * CONFIGURACIÓN DE SEGURIDAD
 * Configuraciones de JWT, encriptación, CORS y políticas de seguridad
 * Diseñado para máxima seguridad en producción
 */

import { IJWTConfig } from '@shared/utils/encryption.util';
import { getLogger } from '@shared/utils/logger.util';

const logger = getLogger();

/**
 * Configuración de JWT
 */
export function getJwtConfig(): IJWTConfig {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET es requerido en variables de entorno');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'sistema-asistencia',
    audience: process.env.JWT_AUDIENCE || 'sistema-asistencia-users'
  };
}

/**
 * Configuración de bcrypt
 */
export function getBcryptConfig() {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS!) || 12;
  
  if (saltRounds < 10) {
    logger.warn('BCRYPT_SALT_ROUNDS es muy bajo, se recomienda al menos 12', 'SecurityConfig');
  }

  if (saltRounds > 15) {
    logger.warn('BCRYPT_SALT_ROUNDS es muy alto, puede afectar el rendimiento', 'SecurityConfig');
  }

  return {
    saltRounds,
    maxPasswordLength: 128,
    minPasswordLength: 8
  };
}

/**
 * Configuración de CORS para máxima seguridad
 */
export function getCorsOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

  // En desarrollo, permitir localhost
  if (!isProduction) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir requests sin origin (ej: mobile apps, Postman)
      if (!origin && !isProduction) {
        return callback(null, true);
      }

      if (!origin) {
        return callback(new Error('Origin no permitido por CORS'), false);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Origin bloqueado por CORS: ${origin}`, 'SecurityConfig');
        callback(new Error('Origin no permitido por CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    maxAge: 86400, // 24 horas
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
}

/**
 * Configuración de Helmet para headers de seguridad
 */
export function getHelmetOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad
    crossOriginOpenerPolicy: { policy: "cross-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: isProduction ? {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true
    } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true
  };
}

/**
 * Configuración de rate limiting
 */
export function getRateLimitOptions() {
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!) || 100,
    message: {
      error: 'Demasiadas solicitudes desde esta IP',
      message: 'Por favor intente de nuevo más tarde',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) => {
      // Saltar rate limiting para health checks
      return req.path === '/health' || req.path === '/api/health';
    },
    keyGenerator: (req: any) => {
      // Usar IP + User Agent para key más específica
      return `${req.ip}-${req.get('User-Agent')}`;
    }
  };
}

/**
 * Configuración de rate limiting específico para login
 */
export function getAuthRateLimitOptions() {
  return {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos de login por IP cada 15 minutos
    message: {
      error: 'Demasiados intentos de login',
      message: 'Cuenta bloqueada temporalmente por seguridad',
      retryAfter: 900 // 15 minutos
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // No contar requests exitosos
    skipFailedRequests: false // Contar requests fallidos
  };
}

/**
 * Configuración de sesión segura
 */
export function getSessionOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    name: process.env.SESSION_NAME || 'asistencia.sid',
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET!,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Renovar sesión en cada request
    cookie: {
      secure: isProduction, // HTTPS en producción
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_TIMEOUT!) || 3600000, // 1 hora
      sameSite: 'strict' as const
    },
    proxy: isProduction // Confiar en proxy en producción
  };
}

/**
 * Configuración de encriptación de datos
 */
export function getEncryptionOptions() {
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET!;

  if (encryptionKey.length < 32) {
    throw new Error('ENCRYPTION_KEY debe tener al menos 32 caracteres');
  }

  return {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'scrypt',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    iterations: 100000,
    salt: 'AsistenciaSystem2024'
  };
}

/**
 * Configuración de validación de archivos
 */
export function getFileValidationOptions() {
  return {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.csv', '.xls', '.xlsx'],
    scanForMalware: process.env.NODE_ENV === 'production',
    quarantineDir: './quarantine'
  };
}

/**
 * Configuración de logging de seguridad
 */
export function getSecurityLoggingOptions() {
  return {
    logFailedLogins: true,
    logSuccessfulLogins: process.env.NODE_ENV === 'production',
    logUnauthorizedAccess: true,
    logSuspiciousActivity: true,
    logRateLimitHits: true,
    logPasswordChanges: true,
    logPermissionChanges: true,
    alertThreshold: {
      failedLogins: 5, // Alertar después de 5 logins fallidos
      unauthorizedAccess: 3,
      rateLimitHits: 10
    }
  };
}

/**
 * Configuración de políticas de contraseñas
 */
export function getPasswordPolicyOptions() {
  return {
    minLength: 8,
    maxLength: 128,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false, // Opcional pero recomendado
    preventCommonPasswords: true,
    preventReuse: 5, // No reutilizar últimas 5 contraseñas
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 días en milisegundos
    warnBeforeExpiry: 7 * 24 * 60 * 60 * 1000 // Advertir 7 días antes
  };
}

/**
 * Configuración de timeouts de seguridad
 */
export function getSecurityTimeouts() {
  return {
    loginTimeout: 5000, // 5 segundos para login
    requestTimeout: 30000, // 30 segundos para requests generales
    fileUploadTimeout: 60000, // 1 minuto para uploads
    databaseTimeout: 30000, // 30 segundos para queries DB
    biometricTimeout: 10000, // 10 segundos para dispositivos biométricos
    sessionInactivity: 30 * 60 * 1000, // 30 minutos de inactividad
    tokenGracePeriod: 5 * 60 * 1000 // 5 minutos de gracia para tokens
  };
}

/**
 * Configuración de IP allowlist/blocklist
 */
export function getIPSecurityOptions() {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];

  return {
    enableIPWhitelist: process.env.ENABLE_IP_WHITELIST === 'true',
    allowedIPs,
    blockedIPs,
    autoBlockSuspiciousIPs: true,
    autoBlockThreshold: 10, // Bloquear después de 10 actividades sospechosas
    autoBlockDuration: 24 * 60 * 60 * 1000, // 24 horas
    trustProxy: process.env.NODE_ENV === 'production'
  };
}

/**
 * Configuración de auditoría de seguridad
 */
export function getAuditOptions() {
  return {
    enableAuditLog: true,
    auditLogPath: process.env.AUDIT_LOG_PATH || './logs/audit.log',
    auditEvents: [
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'PASSWORD_CHANGED',
      'PERMISSION_CHANGED',
      'DATA_EXPORTED',
      'SYSTEM_CONFIG_CHANGED',
      'BIOMETRIC_SYNC',
      'FAILED_LOGIN',
      'UNAUTHORIZED_ACCESS'
    ],
    retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 año
    compressionEnabled: true,
    encryptAuditLogs: process.env.NODE_ENV === 'production'
  };
}

/**
 * Valida toda la configuración de seguridad
 */
export function validateSecurityConfiguration(): void {
  try {
    // Validar JWT
    const jwtConfig = getJwtConfig();
    if (jwtConfig.secret.length < 32) {
      throw new Error('JWT secret muy corto');
    }

    // Validar bcrypt
    const bcryptConfig = getBcryptConfig();
    if (bcryptConfig.saltRounds < 10) {
      throw new Error('Salt rounds muy bajo para producción');
    }

    // Validar encriptación
    getEncryptionOptions();

    logger.info('Configuración de seguridad validada correctamente', 'SecurityConfig', {
      jwtConfigured: !!jwtConfig.secret,
      bcryptRounds: bcryptConfig.saltRounds,
      corsEnabled: true,
      helmetEnabled: true,
      rateLimitEnabled: true
    });

  } catch (error) {
    logger.error('Error validando configuración de seguridad', 'SecurityConfig', {}, error as Error);
    throw error;
  }
}

/**
 * Obtiene configuración completa de seguridad
 */
export function getCompleteSecurityConfig() {
  return {
    jwt: getJwtConfig(),
    bcrypt: getBcryptConfig(),
    cors: getCorsOptions(),
    helmet: getHelmetOptions(),
    rateLimit: getRateLimitOptions(),
    authRateLimit: getAuthRateLimitOptions(),
    session: getSessionOptions(),
    encryption: getEncryptionOptions(),
    fileValidation: getFileValidationOptions(),
    securityLogging: getSecurityLoggingOptions(),
    passwordPolicy: getPasswordPolicyOptions(),
    timeouts: getSecurityTimeouts(),
    ipSecurity: getIPSecurityOptions(),
    audit: getAuditOptions()
  };
}

/**
 * Imprime configuración de seguridad (sin datos sensibles)
 */
export function printSecurityConfiguration(): void {
  const config = getCompleteSecurityConfig();
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('\n🔐 CONFIGURACIÓN DE SEGURIDAD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌍 Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
  console.log(`🔑 JWT configurado: ✅`);
  console.log(`🔒 Bcrypt rounds: ${config.bcrypt.saltRounds}`);
  console.log(`🛡️  CORS habilitado: ✅`);
  console.log(`⛑️  Helmet habilitado: ✅`);
  console.log(`🚦 Rate limiting: ${config.rateLimit.max} req/${config.rateLimit.windowMs}ms`);
  console.log(`🔐 Encriptación: ${config.encryption.algorithm}`);
  console.log(`📝 Audit log: ${config.audit.enableAuditLog ? '✅' : '❌'}`);
  console.log(`🏠 IP Whitelist: ${config.ipSecurity.enableIPWhitelist ? '✅' : '❌'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export default {
  getJwtConfig,
  getBcryptConfig,
  getCorsOptions,
  getHelmetOptions,
  getRateLimitOptions,
  getAuthRateLimitOptions,
  getSessionOptions,
  getEncryptionOptions,
  getFileValidationOptions,
  getSecurityLoggingOptions,
  getPasswordPolicyOptions,
  getSecurityTimeouts,
  getIPSecurityOptions,
  getAuditOptions,
  validateSecurityConfiguration,
  getCompleteSecurityConfig,
  printSecurityConfiguration
};