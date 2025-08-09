/**
 * UTILIDAD DE ENCRIPTACIÓN
 * Funciones para hashing de contraseñas, generación de tokens JWT
 * y validaciones de seguridad
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@shared/types/common.types';

/**
 * Payload del token JWT
 */
export interface IJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sucursalId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Resultado de verificación de token
 */
export interface ITokenVerification {
  isValid: boolean;
  payload?: IJWTPayload;
  error?: string;
  isExpired?: boolean;
}

/**
 * Configuración de JWT - Versión simplificada
 */
export interface IJWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer?: string;
  audience?: string;
}

/**
 * Hash de contraseña usando bcrypt
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  if (!password) {
    throw new Error('Contraseña es requerida para hacer hash');
  }

  if (password.length > 128) {
    throw new Error('Contraseña muy larga para hacer hash');
  }

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Error al hacer hash de la contraseña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Compara contraseña con hash
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparando contraseñas:', error);
    return false;
  }
}

/**
 * Genera token JWT - Versión ultra simplificada
 */
export function generateToken(payload: Omit<IJWTPayload, 'iat' | 'exp'>, config: IJWTConfig): string {
  if (!payload.userId || !payload.email || !payload.role) {
    throw new Error('Payload incompleto para generar token');
  }

  if (!config.secret) {
    throw new Error('Secret JWT es requerido');
  }

  try {
    const tokenPayload: IJWTPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000)
    };

    // Uso de jwt.sign sin options para evitar problemas de tipos
    return jwt.sign(tokenPayload, config.secret);
  } catch (error) {
    throw new Error(`Error generando token: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera refresh token - Versión ultra simplificada
 */
export function generateRefreshToken(userId: string, config: IJWTConfig): string {
  if (!userId) {
    throw new Error('User ID es requerido para refresh token');
  }

  if (!config.secret) {
    throw new Error('Secret JWT es requerido');
  }

  try {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    // Uso de jwt.sign sin options para evitar problemas de tipos
    return jwt.sign(payload, config.secret);
  } catch (error) {
    throw new Error(`Error generando refresh token: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Verifica y decodifica token JWT
 */
export function verifyToken(token: string, secret: string): ITokenVerification {
  if (!token) {
    return {
      isValid: false,
      error: 'Token es requerido'
    };
  }

  if (!secret) {
    return {
      isValid: false,
      error: 'Secret es requerido'
    };
  }

  try {
    const decoded = jwt.verify(token, secret) as IJWTPayload;
    
    return {
      isValid: true,
      payload: decoded
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        isValid: false,
        error: 'Token expirado',
        isExpired: true
      };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        isValid: false,
        error: 'Token inválido'
      };
    }

    return {
      isValid: false,
      error: `Error verificando token: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Decodifica token sin verificar (para debugging)
 */
export function decodeTokenUnsafe(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Genera un ID único usando UUID v4
 */
export function generateUniqueId(): string {
  return crypto.randomUUID();
}

/**
 * Genera una cadena aleatoria segura
 */
export function generateSecureRandomString(length: number = 32): string {
  if (length <= 0) {
    throw new Error('La longitud debe ser mayor a 0');
  }

  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Genera un código numérico aleatorio
 */
export function generateNumericCode(length: number = 6): string {
  if (length <= 0 || length > 10) {
    throw new Error('La longitud debe estar entre 1 y 10');
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }

  return code;
}

/**
 * Hashea data genérica usando SHA-256
 */
export function hashData(data: string): string {
  if (!data) {
    throw new Error('Data es requerida para hacer hash');
  }

  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Genera hash HMAC
 */
export function generateHMAC(data: string, secret: string): string {
  if (!data || !secret) {
    throw new Error('Data y secret son requeridos para HMAC');
  }

  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifica hash HMAC - Versión simplificada
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  if (!data || !signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = generateHMAC(data, secret);
    return signature === expectedSignature;
  } catch (error) {
    return false;
  }
}

/**
 * Encripta texto usando Base64 (versión demo)
 */
export function encryptText(text: string, key: string): string {
  if (!text || !key) {
    throw new Error('Texto y clave son requeridos');
  }

  try {
    // Versión simple para demo - NO usar en producción
    const combined = text + '|' + key;
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    throw new Error(`Error encriptando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Desencripta texto usando Base64 (versión demo)
 */
export function decryptText(encryptedText: string, key: string): string {
  if (!encryptedText || !key) {
    throw new Error('Texto encriptado y clave son requeridos');
  }

  try {
    const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 2 || parts[1] !== key) {
      throw new Error('Clave incorrecta');
    }
    return parts[0] || '';
  } catch (error) {
    throw new Error(`Error desencriptando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera un salt criptográficamente seguro
 */
export function generateSalt(rounds: number = 12): string {
  if (rounds < 4 || rounds > 31) {
    throw new Error('Rounds debe estar entre 4 y 31');
  }

  return bcrypt.genSaltSync(rounds);
}

/**
 * Valida la fortaleza de una contraseña
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      feedback: ['Contraseña es requerida'],
      isStrong: false
    };
  }

  // Longitud
  if (password.length >= 8) score += 1;
  else feedback.push('Debe tener al menos 8 caracteres');

  if (password.length >= 12) score += 1;

  // Complejidad
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Debe contener letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Debe contener letras mayúsculas');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Debe contener números');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Se recomienda incluir caracteres especiales');

  // Patrones débiles
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Evitar repetir caracteres');
  }

  if (/123|abc|qwe|asd/i.test(password)) {
    score -= 1;
    feedback.push('Evitar secuencias comunes');
  }

  const isStrong = score >= 5 && feedback.length === 0;

  return {
    score: Math.max(0, Math.min(6, score)),
    feedback,
    isStrong
  };
}

/**
 * Genera una contraseña segura
 */
export function generateSecurePassword(length: number = 12): string {
  if (length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*(),.?":{}|<>';

  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Llenar el resto aleatoriamente
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeTokenUnsafe,
  generateUniqueId,
  generateSecureRandomString,
  generateNumericCode,
  hashData,
  generateHMAC,
  verifyHMAC,
  encryptText,
  decryptText,
  generateSalt,
  validatePasswordStrength,
  generateSecurePassword
};