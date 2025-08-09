/**
 * UTILIDAD DE FECHAS
 * Funciones para manejo de fechas específicas del sistema de asistencia
 * Incluye cálculos de horas laborales, días festivos Ecuador, etc.
 */

import { ITimeRange } from '@shared/types/common.types';

/**
 * Información de día laboral
 */
export interface IWorkDayInfo {
  date: Date;
  isWorkingDay: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string | undefined;
  dayOfWeek: number;
  dayName: string;
}

/**
 * Resultado de cálculo de horas
 */
export interface IHoursCalculation {
  totalMinutes: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  weekendHours: number;
}

/**
 * Período de tiempo
 */
export interface IPeriod {
  startDate: Date;
  endDate: Date;
  description?: string;
}

/**
 * Resultado de validación de rango de tiempo
 */
export interface ITimeRangeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Días festivos de Ecuador 2024-2025
 */
const ECUADOR_HOLIDAYS = [
  // 2024
  { date: '2024-01-01', name: 'Año Nuevo' },
  { date: '2024-02-12', name: 'Carnaval (Lunes)' },
  { date: '2024-02-13', name: 'Carnaval (Martes)' },
  { date: '2024-03-29', name: 'Viernes Santo' },
  { date: '2024-05-01', name: 'Día del Trabajador' },
  { date: '2024-05-24', name: 'Batalla de Pichincha' },
  { date: '2024-08-10', name: 'Primer Grito de Independencia' },
  { date: '2024-10-09', name: 'Independencia de Guayaquil' },
  { date: '2024-11-02', name: 'Día de los Difuntos' },
  { date: '2024-11-03', name: 'Independencia de Cuenca' },
  { date: '2024-12-25', name: 'Navidad' },
  
  // 2025
  { date: '2025-01-01', name: 'Año Nuevo' },
  { date: '2025-03-03', name: 'Carnaval (Lunes)' },
  { date: '2025-03-04', name: 'Carnaval (Martes)' },
  { date: '2025-04-18', name: 'Viernes Santo' },
  { date: '2025-05-01', name: 'Día del Trabajador' },
  { date: '2025-05-24', name: 'Batalla de Pichincha' },
  { date: '2025-08-10', name: 'Primer Grito de Independencia' },
  { date: '2025-10-09', name: 'Independencia de Guayaquil' },
  { date: '2025-11-02', name: 'Día de los Difuntos' },
  { date: '2025-11-03', name: 'Independencia de Cuenca' },
  { date: '2025-12-25', name: 'Navidad' }
];

/**
 * Valida un rango de tiempo
 */
export function validateTimeRange(startTime: string, endTime: string): ITimeRangeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar formato básico
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(startTime)) {
    errors.push('Hora de inicio tiene formato inválido (debe ser HH:MM)');
  }
  
  if (!timeRegex.test(endTime)) {
    errors.push('Hora de fin tiene formato inválido (debe ser HH:MM)');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  try {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Validar que la hora de fin sea posterior a la de inicio
    if (endMinutes <= startMinutes) {
      errors.push('Hora de fin debe ser posterior a hora de inicio');
    }

    // Validar duración mínima (15 minutos)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
      warnings?.push('Duración muy corta (menos de 15 minutos)');
    }

    // Validar duración máxima (16 horas)
    if (durationMinutes > 16 * 60) {
      warnings?.push('Duración muy larga (más de 16 horas)');
    }

    // Validar horarios nocturnos
    if (startMinutes >= 22 * 60 || endMinutes <= 6 * 60) {
      warnings?.push('Horario incluye horas nocturnas');
    }

  } catch (error) {
    errors.push('Error al procesar las horas');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formatea una fecha a string en formato YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Formatea una fecha a string en formato DD/MM/YYYY
 */
export function formatDateLocal(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formatea tiempo a string HH:MM
 */
export function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Formatea fecha y hora completa
 */
export function formatDateTime(date: Date): string {
  return `${formatDateLocal(date)} ${formatTime(date)}`;
}

/**
 * Convierte string de tiempo HH:MM a minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) {
    throw new Error('Formato de tiempo inválido');
  }
  
  const hourStr = parts[0];
  const minuteStr = parts[1];
  
  if (!hourStr || !minuteStr) {
    throw new Error('Formato de tiempo inválido');
  }
  
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Formato de tiempo inválido');
  }
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a string HH:MM
 */
export function minutesToTime(minutes: number): string {
  if (minutes < 0 || minutes >= 24 * 60) {
    throw new Error('Minutos fuera de rango válido');
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calcula la diferencia en minutos entre dos tiempos
 */
export function calculateTimeDifferenceMinutes(inicio: string, fin: string): number {
  const inicioMinutos = timeToMinutes(inicio);
  const finMinutos = timeToMinutes(fin);
  
  // Manejar el caso donde fin es al día siguiente
  if (finMinutos < inicioMinutos) {
    return (24 * 60) - inicioMinutos + finMinutos;
  }
  
  return finMinutos - inicioMinutos;
}

/**
 * Calcula horas trabajadas entre dos timestamps
 */
export function calculateWorkingHours(entrada: Date, salida: Date): IHoursCalculation {
  if (!(entrada instanceof Date) || !(salida instanceof Date)) {
    throw new Error('Fechas inválidas');
  }
  
  if (salida <= entrada) {
    throw new Error('Hora de salida debe ser posterior a hora de entrada');
  }
  
  const totalMinutes = Math.floor((salida.getTime() - entrada.getTime()) / (1000 * 60));
  const totalHours = totalMinutes / 60;
  
  // Calcular horas regulares (hasta 8 horas por día)
  const regularHours = Math.min(totalHours, 8);
  const overtimeHours = Math.max(totalHours - 8, 0);
  
  // Calcular horas nocturnas (22:00 - 06:00)
  const nightHours = calculateNightHours(entrada, salida);
  
  // Verificar si es fin de semana
  const isWeekend = entrada.getDay() === 0 || entrada.getDay() === 6;
  const weekendHours = isWeekend ? totalHours : 0;
  
  // Verificar si es día festivo
  const isHoliday = isHolidayDate(entrada);
  const holidayHours = isHoliday ? totalHours : 0;
  
  return {
    totalMinutes,
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    nightHours: Math.round(nightHours * 100) / 100,
    holidayHours: Math.round(holidayHours * 100) / 100,
    weekendHours: Math.round(weekendHours * 100) / 100
  };
}

/**
 * Calcula horas nocturnas entre dos timestamps
 */
function calculateNightHours(entrada: Date, salida: Date): number {
  const nightStart = 22; // 22:00
  const nightEnd = 6;    // 06:00
  
  let nightHours = 0;
  const current = new Date(entrada);
  
  while (current < salida) {
    const hour = current.getHours();
    
    if (hour >= nightStart || hour < nightEnd) {
      nightHours += 1/60; // Incrementar por minuto
    }
    
    current.setMinutes(current.getMinutes() + 1);
  }
  
  return nightHours;
}

/**
 * Verifica si una fecha es día laborable
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
  const isHoliday = isHolidayDate(date);
  
  return !isWeekend && !isHoliday;
}

/**
 * Verifica si una fecha es día festivo
 */
export function isHolidayDate(date: Date): boolean {
  const dateString = formatDate(date);
  return ECUADOR_HOLIDAYS.some(holiday => holiday.date === dateString);
}

/**
 * Obtiene información del día festivo
 */
export function getHolidayInfo(date: Date): { name: string } | null {
  const dateString = formatDate(date);
  const holiday = ECUADOR_HOLIDAYS.find(h => h.date === dateString);
  return holiday ? { name: holiday.name } : null;
}

/**
 * Obtiene información completa de un día
 */
export function getWorkDayInfo(date: Date): IWorkDayInfo {
  const dayOfWeek = date.getDay();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const holidayInfo = getHolidayInfo(date);
  const isHoliday = holidayInfo !== null;
  
  // Asegurar que el dayName nunca sea undefined
  const dayName = dayNames[dayOfWeek] ?? 'Desconocido';
  
  const result: IWorkDayInfo = {
    date,
    isWorkingDay: !isWeekend && !isHoliday,
    isWeekend,
    isHoliday,
    dayOfWeek,
    dayName: dayName
  };

  if (holidayInfo?.name) {
    result.holidayName = holidayInfo.name;
  }

  return result;
}

/**
 * Obtiene el rango de una semana específica
 */
export function getWeekRange(date: Date): IPeriod {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  
  // Ajustar al lunes (día 1)
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    startDate: startOfWeek,
    endDate: endOfWeek,
    description: `Semana del ${formatDateLocal(startOfWeek)} al ${formatDateLocal(endOfWeek)}`
  };
}

/**
 * Obtiene el rango de un mes específico
 */
export function getMonthRange(date: Date): IPeriod {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return {
    startDate: startOfMonth,
    endDate: endOfMonth,
    description: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  };
}

/**
 * Obtiene los días laborables de un período
 */
export function getWorkingDaysInPeriod(startDate: Date, endDate: Date): Date[] {
  const workingDays: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current)) {
      workingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * Calcula la edad en años
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Obtiene la fecha actual en zona horaria de Ecuador
 */
export function getCurrentDateEcuador(): Date {
  // Ecuador está en UTC-5
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ecuadorTime = new Date(utc + (-5 * 3600000));
  
  return ecuadorTime;
}

/**
 * Convierte fecha a inicio del día
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Convierte fecha a final del día
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Obtiene los próximos días festivos
 */
export function getUpcomingHolidays(limit: number = 5): Array<{ date: Date; name: string; daysUntil: number }> {
  const today = getCurrentDateEcuador();
  const upcoming = ECUADOR_HOLIDAYS
    .map(holiday => ({
      date: new Date(holiday.date),
      name: holiday.name,
      daysUntil: Math.ceil((new Date(holiday.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter(holiday => holiday.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
  
  return upcoming;
}

/**
 * Valida si una fecha está en rango válido para el sistema
 */
export function isValidDateRange(date: Date): boolean {
  const currentYear = getCurrentDateEcuador().getFullYear();
  const year = date.getFullYear();
  
  // Permitir fechas desde 2020 hasta 5 años en el futuro
  return year >= 2020 && year <= currentYear + 5;
}

export default {
  validateTimeRange,
  formatDate,
  formatDateLocal,
  formatTime,
  formatDateTime,
  timeToMinutes,
  minutesToTime,
  calculateTimeDifferenceMinutes,
  calculateWorkingHours,
  isWorkingDay,
  isHolidayDate,
  getHolidayInfo,
  getWorkDayInfo,
  getWeekRange,
  getMonthRange,
  getWorkingDaysInPeriod,
  calculateAge,
  getCurrentDateEcuador,
  startOfDay,
  endOfDay,
  getUpcomingHolidays,
  isValidDateRange
};