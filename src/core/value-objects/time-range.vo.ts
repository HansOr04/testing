/**
 * TIME RANGE VALUE OBJECT
 * Maneja rangos de tiempo con validaciones y cálculos
 */

import { validateTimeRange, timeToMinutes, minutesToTime } from '@shared/utils/date.util';

export class TimeRange {
  private readonly _startTime: string;
  private readonly _endTime: string;
  private readonly _startMinutes: number;
  private readonly _endMinutes: number;
  private readonly _isValid: boolean;
  private readonly _errors: string[];

  constructor(startTime: string, endTime: string) {
    const validation = validateTimeRange(startTime, endTime);
    
    this._startTime = startTime;
    this._endTime = endTime;
    this._isValid = validation.isValid;
    this._errors = validation.errors;

    if (!this._isValid) {
      throw new Error(`Rango de tiempo inválido: ${this._errors.join(', ')}`);
    }

    this._startMinutes = timeToMinutes(startTime);
    this._endMinutes = timeToMinutes(endTime);
  }

  /**
   * Obtiene la hora de inicio
   */
  get startTime(): string {
    return this._startTime;
  }

  /**
   * Obtiene la hora de fin
   */
  get endTime(): string {
    return this._endTime;
  }

  /**
   * Obtiene los minutos de inicio desde medianoche
   */
  get startMinutes(): number {
    return this._startMinutes;
  }

  /**
   * Obtiene los minutos de fin desde medianoche
   */
  get endMinutes(): number {
    return this._endMinutes;
  }

  /**
   * Verifica si el rango es válido
   */
  get isValid(): boolean {
    return this._isValid;
  }

  /**
   * Obtiene los errores de validación
   */
  get errors(): string[] {
    return [...this._errors];
  }

  /**
   * Calcula la duración en minutos
   */
  get durationMinutes(): number {
    return this._endMinutes - this._startMinutes;
  }

  /**
   * Calcula la duración en horas
   */
  get durationHours(): number {
    return this.durationMinutes / 60;
  }

  /**
   * Formatea la duración como string
   */
  get durationFormatted(): string {
    const hours = Math.floor(this.durationHours);
    const minutes = this.durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  /**
   * Verifica si es un horario matutino
   */
  get isMorningShift(): boolean {
    return this._startMinutes < 12 * 60; // Antes del mediodía
  }

  /**
   * Verifica si es un horario vespertino
   */
  get isAfternoonShift(): boolean {
    return this._startMinutes >= 12 * 60 && this._startMinutes < 18 * 60;
  }

  /**
   * Verifica si es un horario nocturno
   */
  get isNightShift(): boolean {
    return this._startMinutes >= 18 * 60 || this._endMinutes <= 6 * 60;
  }

  /**
   * Verifica si incluye horas nocturnas (22:00 - 06:00)
   */
  get includesNightHours(): boolean {
    const nightStart = 22 * 60; // 22:00
    const nightEnd = 6 * 60;    // 06:00
    
    return (this._startMinutes >= nightStart) || 
           (this._endMinutes <= nightEnd) ||
           (this._startMinutes < nightEnd && this._endMinutes > nightStart);
  }

  /**
   * Calcula las horas nocturnas en el rango
   */
  get nightHours(): number {
    if (!this.includesNightHours) return 0;

    const nightStart = 22 * 60; // 22:00
    const nightEnd = 6 * 60;    // 06:00
    let nightMinutes = 0;

    // Caso 1: Turno nocturno que cruza medianoche
    if (this._startMinutes >= nightStart && this._endMinutes <= nightEnd) {
      nightMinutes = this.durationMinutes;
    }
    // Caso 2: Inicia en horario nocturno pero termina después de las 6:00
    else if (this._startMinutes >= nightStart) {
      nightMinutes = Math.min(this._endMinutes, 24 * 60) - this._startMinutes;
      if (this._endMinutes <= nightEnd) {
        nightMinutes += this._endMinutes;
      }
    }
    // Caso 3: Termina en horario nocturno pero inicia antes de las 22:00
    else if (this._endMinutes <= nightEnd) {
      nightMinutes = this._endMinutes;
    }
    // Caso 4: Cruza ambos períodos nocturnos
    else if (this._startMinutes < nightEnd && this._endMinutes > nightStart) {
      nightMinutes = (24 * 60 - nightStart) + nightEnd;
    }

    return nightMinutes / 60;
  }

  /**
   * Verifica si se superpone con otro rango
   */
  overlapsWith(other: TimeRange): boolean {
    return this._startMinutes < other._endMinutes && this._endMinutes > other._startMinutes;
  }

  /**
   * Calcula la superposición con otro rango
   */
  getOverlapWith(other: TimeRange): TimeRange | null {
    if (!this.overlapsWith(other)) return null;

    const overlapStart = Math.max(this._startMinutes, other._startMinutes);
    const overlapEnd = Math.min(this._endMinutes, other._endMinutes);

    return new TimeRange(minutesToTime(overlapStart), minutesToTime(overlapEnd));
  }

  /**
   * Verifica si contiene completamente otro rango
   */
  contains(other: TimeRange): boolean {
    return this._startMinutes <= other._startMinutes && this._endMinutes >= other._endMinutes;
  }

  /**
   * Verifica si un tiempo específico está dentro del rango
   */
  containsTime(time: string): boolean {
    const timeMinutes = timeToMinutes(time);
    return timeMinutes >= this._startMinutes && timeMinutes <= this._endMinutes;
  }

  /**
   * Extiende el rango por un número de minutos
   */
  extend(minutes: number): TimeRange {
    const newEndMinutes = Math.min(this._endMinutes + minutes, 24 * 60 - 1);
    return new TimeRange(this._startTime, minutesToTime(newEndMinutes));
  }

  /**
   * Reduce el rango por un número de minutos
   */
  reduce(minutes: number): TimeRange {
    const newEndMinutes = Math.max(this._endMinutes - minutes, this._startMinutes);
    return new TimeRange(this._startTime, minutesToTime(newEndMinutes));
  }

  /**
   * Desplaza el rango por un número de minutos
   */
  shift(minutes: number): TimeRange {
    const newStartMinutes = Math.max(0, Math.min(this._startMinutes + minutes, 24 * 60 - this.durationMinutes));
    const newEndMinutes = newStartMinutes + this.durationMinutes;

    return new TimeRange(minutesToTime(newStartMinutes), minutesToTime(newEndMinutes));
  }

  /**
   * Divide el rango en períodos más pequeños
   */
  split(periodMinutes: number): TimeRange[] {
    const ranges: TimeRange[] = [];
    let currentStart = this._startMinutes;

    while (currentStart < this._endMinutes) {
      const currentEnd = Math.min(currentStart + periodMinutes, this._endMinutes);
      ranges.push(new TimeRange(minutesToTime(currentStart), minutesToTime(currentEnd)));
      currentStart = currentEnd;
    }

    return ranges;
  }

  /**
   * Obtiene el tiempo en el centro del rango
   */
  get centerTime(): string {
    const centerMinutes = this._startMinutes + (this.durationMinutes / 2);
    return minutesToTime(Math.round(centerMinutes));
  }

  /**
   * Verifica si es un rango de jornada completa (8 horas)
   */
  get isFullWorkday(): boolean {
    return this.durationHours >= 8;
  }

  /**
   * Verifica si es un rango de media jornada
   */
  get isHalfWorkday(): boolean {
    return this.durationHours >= 4 && this.durationHours < 8;
  }

  /**
   * Calcula el descanso sugerido para el rango
   */
  get suggestedBreakMinutes(): number {
    if (this.durationHours <= 4) return 0;
    if (this.durationHours <= 6) return 15;
    if (this.durationHours <= 8) return 30;
    return 60; // 1 hora para jornadas largas
  }

  /**
   * Verifica igualdad con otro rango
   */
  equals(other: TimeRange): boolean {
    return this._startTime === other._startTime && this._endTime === other._endTime;
  }

  /**
   * Convierte a string legible
   */
  toString(): string {
    return `${this._startTime} - ${this._endTime} (${this.durationFormatted})`;
  }

  /**
   * Convierte a formato de 12 horas
   */
  toAmPmFormat(): string {
    const formatTo12Hour = (time: string): string => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTo12Hour(this._startTime)} - ${formatTo12Hour(this._endTime)}`;
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      startTime: this._startTime,
      endTime: this._endTime,
      durationMinutes: this.durationMinutes,
      durationHours: this.durationHours,
      durationFormatted: this.durationFormatted,
      isMorningShift: this.isMorningShift,
      isAfternoonShift: this.isAfternoonShift,
      isNightShift: this.isNightShift,
      includesNightHours: this.includesNightHours,
      nightHours: this.nightHours,
      isFullWorkday: this.isFullWorkday,
      isHalfWorkday: this.isHalfWorkday
    };
  }

  /**
   * Crea un rango desde minutos
   */
  static fromMinutes(startMinutes: number, endMinutes: number): TimeRange {
    return new TimeRange(minutesToTime(startMinutes), minutesToTime(endMinutes));
  }

  /**
   * Crea un rango de duración específica desde una hora de inicio
   */
  static withDuration(startTime: string, durationMinutes: number): TimeRange {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return new TimeRange(startTime, minutesToTime(endMinutes));
  }

  /**
   * Crea rangos predefinidos comunes
   */
  static createPreset(preset: 'morning' | 'afternoon' | 'night' | 'full-day'): TimeRange {
    switch (preset) {
      case 'morning':
        return new TimeRange('08:00', '12:00');
      case 'afternoon':
        return new TimeRange('13:00', '17:00');
      case 'night':
        return new TimeRange('22:00', '06:00');
      case 'full-day':
        return new TimeRange('08:00', '17:00');
      default:
        throw new Error(`Preset desconocido: ${preset}`);
    }
  }

  /**
   * Valida un rango sin crear instancia
   */
  static isValid(startTime: string, endTime: string): boolean {
    try {
      new TimeRange(startTime, endTime);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Une múltiples rangos en uno solo (si son continuos)
   */
  static merge(ranges: TimeRange[]): TimeRange | null {
    if (ranges.length === 0) return null;
    if (ranges.length === 1) return ranges[0];

    // Ordenar por hora de inicio
    const sorted = ranges.sort((a, b) => a._startMinutes - b._startMinutes);
    
    // Verificar que sean continuos
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i]._startMinutes > sorted[i-1]._endMinutes) {
        return null; // No son continuos
      }
    }

    const firstStart = sorted[0]._startTime;
    const lastEnd = sorted[sorted.length - 1]._endTime;
    
    return new TimeRange(firstStart, lastEnd);
  }
}

export default TimeRange;