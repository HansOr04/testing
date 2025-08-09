/**
 * UTILIDAD DE VALIDACIÓN
 * Funciones de validación para datos del sistema de asistencia
 * Incluye validaciones específicas para Ecuador y el dominio del negocio
 */

import { IValidationResult } from '@shared/types/common.types';

/**
 * Resultado de validación con detalles
 */
export interface IValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface IDetailedValidationResult {
  isValid: boolean;
  errors: IValidationError[];
  warnings: IValidationError[];
}

/**
 * Valida email usando expresión regular
 */
export function validateEmail(email: string): IValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email es requerido');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Formato de email inválido');
  }

  if (email.length > 255) {
    errors.push('Email no puede exceder 255 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida contraseña con criterios de seguridad
 */
export function validatePassword(password: string): IValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password) {
    errors.push('Contraseña es requerida');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Contraseña debe tener al menos 8 caracteres');
  }

  if (password.length > 128) {
    errors.push('Contraseña no puede exceder 128 caracteres');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Contraseña debe contener al menos una letra minúscula');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Contraseña debe contener al menos una letra mayúscula');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Contraseña debe contener al menos un número');
  }

  if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
    warnings.push('Se recomienda incluir al menos un carácter especial');
  }

  // Verificar patrones comunes débiles
  const weakPatterns = [
    /(.)\1{2,}/, // Caracteres repetidos
    /123456|654321|qwerty|asdf|password/i, // Secuencias comunes
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      warnings.push('Contraseña contiene patrones comunes débiles');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valida cédula ecuatoriana
 */
export function validateCedula(cedula: string): IValidationResult {
  const errors: string[] = [];

  if (!cedula) {
    errors.push('Cédula es requerida');
    return { isValid: false, errors };
  }

  // Remover espacios y guiones
  const cleanCedula = cedula.replace(/[\s-]/g, '');

  // Verificar longitud
  if (cleanCedula.length !== 10) {
    errors.push('Cédula debe tener 10 dígitos');
    return { isValid: false, errors };
  }

  // Verificar que solo contenga números
  if (!/^\d+$/.test(cleanCedula)) {
    errors.push('Cédula debe contener solo números');
    return { isValid: false, errors };
  }

  // Verificar código de provincia (primeros 2 dígitos)
  const provincia = parseInt(cleanCedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) {
    errors.push('Código de provincia inválido');
  }

  // Verificar tercer dígito (debe ser menor a 6 para personas naturales)
  const tercerDigito = parseInt(cleanCedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    errors.push('Tercer dígito inválido para persona natural');
  }

  // Algoritmo de validación de cédula ecuatoriana
  if (errors.length === 0) {
    const digits = cleanCedula.split('').map(Number);
    const lastDigit = digits[9];
    
    if (lastDigit === undefined) {
      errors.push('Cédula incompleta');
      return { isValid: false, errors };
    }
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = digits[i];
      if (digit === undefined) {
        errors.push('Cédula con dígitos inválidos');
        return { isValid: false, errors };
      }
      
      let product = digit * (i % 2 === 0 ? 2 : 1);
      if (product > 9) {
        product -= 9;
      }
      sum += product;
    }

    const calculatedDigit = (10 - (sum % 10)) % 10;
    if (calculatedDigit !== lastDigit) {
      errors.push('Cédula no es válida según algoritmo de verificación');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida rango de tiempo (HH:MM)
 */
export function validateTimeRange(inicio: string, fin: string): IValidationResult {
  const errors: string[] = [];

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (!timeRegex.test(inicio)) {
    errors.push('Hora de inicio debe estar en formato HH:MM');
  }

  if (!timeRegex.test(fin)) {
    errors.push('Hora de fin debe estar en formato HH:MM');
  }

  if (errors.length === 0) {
    const parts = inicio.split(':');
    const partsEnd = fin.split(':');
    
    if (parts.length !== 2 || partsEnd.length !== 2) {
      errors.push('Formato de tiempo inválido');
      return { isValid: false, errors };
    }

    const inicioHour = parseInt(parts[0]!, 10);
    const inicioMin = parseInt(parts[1]!, 10);
    const finHour = parseInt(partsEnd[0]!, 10);
    const finMin = parseInt(partsEnd[1]!, 10);

    if (isNaN(inicioHour) || isNaN(inicioMin) || isNaN(finHour) || isNaN(finMin)) {
      errors.push('Formato de tiempo inválido');
      return { isValid: false, errors };
    }

    const inicioMinutos = inicioHour * 60 + inicioMin;
    const finMinutos = finHour * 60 + finMin;

    if (inicioMinutos >= finMinutos) {
      errors.push('Hora de inicio debe ser anterior a hora de fin');
    }

    // Validar rangos razonables para horarios laborales
    if (inicioMinutos < 6 * 60) { // Antes de 6:00 AM
      errors.push('Hora de inicio muy temprana (antes de 6:00 AM)');
    }

    if (finMinutos > 23 * 60) { // Después de 11:00 PM
      errors.push('Hora de fin muy tardía (después de 11:00 PM)');
    }

    const duracionHoras = (finMinutos - inicioMinutos) / 60;
    if (duracionHoras > 12) {
      errors.push('Jornada laboral no puede exceder 12 horas');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida campos requeridos
 */
export function validateRequired(value: any, fieldName: string): IValidationResult {
  const errors: string[] = [];

  if (value === null || value === undefined) {
    errors.push(`${fieldName} es requerido`);
  } else if (typeof value === 'string' && value.trim() === '') {
    errors.push(`${fieldName} no puede estar vacío`);
  } else if (Array.isArray(value) && value.length === 0) {
    errors.push(`${fieldName} debe contener al menos un elemento`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida longitud de texto
 */
export function validateTextLength(
  text: string, 
  minLength: number, 
  maxLength: number, 
  fieldName: string
): IValidationResult {
  const errors: string[] = [];

  if (!text) {
    errors.push(`${fieldName} es requerido`);
    return { isValid: false, errors };
  }

  if (text.length < minLength) {
    errors.push(`${fieldName} debe tener al menos ${minLength} caracteres`);
  }

  if (text.length > maxLength) {
    errors.push(`${fieldName} no puede exceder ${maxLength} caracteres`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida número en rango
 */
export function validateNumberRange(
  number: number, 
  min: number, 
  max: number, 
  fieldName: string
): IValidationResult {
  const errors: string[] = [];

  if (isNaN(number)) {
    errors.push(`${fieldName} debe ser un número válido`);
    return { isValid: false, errors };
  }

  if (number < min) {
    errors.push(`${fieldName} debe ser mayor o igual a ${min}`);
  }

  if (number > max) {
    errors.push(`${fieldName} debe ser menor o igual a ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida fecha
 */
export function validateDate(date: string | Date, fieldName: string): IValidationResult {
  const errors: string[] = [];

  let dateObj: Date;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    errors.push(`${fieldName} debe ser una fecha válida`);
    return { isValid: false, errors };
  }

  // Verificar que no sea una fecha muy antigua o muy futura
  const currentYear = new Date().getFullYear();
  const dateYear = dateObj.getFullYear();

  if (dateYear < 1900) {
    errors.push(`${fieldName} no puede ser anterior al año 1900`);
  }

  if (dateYear > currentYear + 10) {
    errors.push(`${fieldName} no puede ser más de 10 años en el futuro`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Limpia y sanitiza entrada de texto
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim() // Eliminar espacios al inicio y final
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
    .replace(/[<>]/g, '') // Eliminar caracteres peligrosos básicos
    .substring(0, 1000); // Limitar longitud máxima
}

/**
 * Valida formato de IP
 */
export function validateIP(ip: string): IValidationResult {
  const errors: string[] = [];

  if (!ip) {
    errors.push('IP es requerida');
    return { isValid: false, errors };
  }

  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (!ipRegex.test(ip)) {
    errors.push('Formato de IP inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida puerto de red
 */
export function validatePort(port: number): IValidationResult {
  const errors: string[] = [];

  if (isNaN(port)) {
    errors.push('Puerto debe ser un número válido');
    return { isValid: false, errors };
  }

  if (port < 1 || port > 65535) {
    errors.push('Puerto debe estar entre 1 y 65535');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Combina múltiples resultados de validación
 */
export function combineValidationResults(...results: IValidationResult[]): IValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const result of results) {
    allErrors.push(...result.errors);
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  const combinedResult: IValidationResult = {
    isValid: allErrors.length === 0,
    errors: allErrors
  };

  if (allWarnings.length > 0) {
    combinedResult.warnings = allWarnings;
  }

  return combinedResult;
}

export default {
  validateEmail,
  validatePassword,
  validateCedula,
  validateTimeRange,
  validateRequired,
  validateTextLength,
  validateNumberRange,
  validateDate,
  sanitizeInput,
  validateIP,
  validatePort,
  combineValidationResults
};