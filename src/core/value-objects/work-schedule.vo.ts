/**
 * WORK SCHEDULE VALUE OBJECT
 * Maneja horarios de trabajo semanales con validaciones
 */

import TimeRange from './time-range.vo';

export interface IWeeklySchedule {
  lunes?: TimeRange;
  martes?: TimeRange;
  miercoles?: TimeRange;
  jueves?: TimeRange;
  viernes?: TimeRange;
  sabado?: TimeRange;
  domingo?: TimeRange;
}

export class WorkSchedule {
  private readonly _schedule: IWeeklySchedule;
  private readonly _isValid: boolean;
  private readonly _errors: string[];

  constructor(schedule: IWeeklySchedule) {
    this._schedule = { ...schedule };
    const validation = this.validateSchedule();
    this._isValid = validation.isValid;
    this._errors = validation.errors;

    if (!this._isValid) {
      throw new Error(`Horario inválido: ${this._errors.join(', ')}`);
    }
  }

  /**
   * Obtiene el horario completo
   */
  get schedule(): IWeeklySchedule {
    return { ...this._schedule };
  }

  /**
   * Verifica si el horario es válido
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
   * Obtiene los días laborables
   */
  get workingDays(): string[] {
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    return days.filter(day => this._schedule[day as keyof IWeeklySchedule] !== undefined);
  }

  /**
   * Calcula las horas semanales totales
   */
  get weeklyHours(): number {
    return this.workingDays.reduce((total, day) => {
      const daySchedule = this._schedule[day as keyof IWeeklySchedule];
      return total + (daySchedule?.durationHours || 0);
    }, 0);
  }

  /**
   * Calcula el promedio de horas por día laborable
   */
  get averageDailyHours(): number {
    const workingDaysCount = this.workingDays.length;
    return workingDaysCount > 0 ? this.weeklyHours / workingDaysCount : 0;
  }

  /**
   * Verifica si es un horario de jornada completa
   */
  get isFullTime(): boolean {
    return this.weeklyHours >= 40;
  }

  /**
   * Verifica si es un horario de medio tiempo
   */
  get isPartTime(): boolean {
    return this.weeklyHours >= 20 && this.weeklyHours < 40;
  }

  /**
   * Verifica si incluye fines de semana
   */
  get includesWeekends(): boolean {
    return !!(this._schedule.sabado || this._schedule.domingo);
  }

  /**
   * Obtiene el horario para un día específico
   */
  getScheduleForDay(day: keyof IWeeklySchedule): TimeRange | null {
    return this._schedule[day] || null;
  }

  /**
   * Verifica si trabaja en un día específico
   */
  worksOnDay(day: keyof IWeeklySchedule): boolean {
    return !!this._schedule[day];
  }

  /**
   * Obtiene la hora más temprana de entrada
   */
  get earliestStartTime(): string | null {
    const startTimes = this.workingDays
      .map(day => this._schedule[day as keyof IWeeklySchedule]?.startTime)
      .filter(time => time !== undefined) as string[];

    if (startTimes.length === 0) return null;

    return startTimes.reduce((earliest, current) => {
      return current < earliest ? current : earliest;
    });
  }

  /**
   * Obtiene la hora más tardía de salida
   */
  get latestEndTime(): string | null {
    const endTimes = this.workingDays
      .map(day => this._schedule[day as keyof IWeeklySchedule]?.endTime)
      .filter(time => time !== undefined) as string[];

    if (endTimes.length === 0) return null;

    return endTimes.reduce((latest, current) => {
      return current > latest ? current : latest;
    });
  }

  /**
   * Verifica si tiene horario consistente (mismas horas todos los días)
   */
  get hasConsistentSchedule(): boolean {
    const schedules = this.workingDays
      .map(day => this._schedule[day as keyof IWeeklySchedule])
      .filter(schedule => schedule !== undefined);

    if (schedules.length <= 1) return true;

    const firstSchedule = schedules[0];
    return schedules.every(schedule => 
      schedule!.equals(firstSchedule!)
    );
  }

  /**
   * Obtiene el horario más común
   */
  get mostCommonSchedule(): TimeRange | null {
    const scheduleMap = new Map<string, number>();
    
    this.workingDays.forEach(day => {
      const daySchedule = this._schedule[day as keyof IWeeklySchedule];
      if (daySchedule) {
        const key = `${daySchedule.startTime}-${daySchedule.endTime}`;
        scheduleMap.set(key, (scheduleMap.get(key) || 0) + 1);
      }
    });

    if (scheduleMap.size === 0) return null;

    const mostCommon = [...scheduleMap.entries()]
      .sort((a, b) => b[1] - a[1])[0];

    const [startTime, endTime] = mostCommon[0].split('-');
    return new TimeRange(startTime, endTime);
  }

  /**
   * Verifica si incluye horarios nocturnos
   */
  get includesNightShifts(): boolean {
    return this.workingDays.some(day => {
      const daySchedule = this._schedule[day as keyof IWeeklySchedule];
      return daySchedule?.isNightShift || false;
    });
  }

  /**
   * Calcula las horas nocturnas semanales
   */
  get weeklyNightHours(): number {
    return this.workingDays.reduce((total, day) => {
      const daySchedule = this._schedule[day as keyof IWeeklySchedule];
      return total + (daySchedule?.nightHours || 0);
    }, 0);
  }

  /**
   * Verifica si hay superposición entre días
   */
  get hasOverlappingDays(): boolean {
    const schedules = this.workingDays
      .map(day => ({ day, schedule: this._schedule[day as keyof IWeeklySchedule]! }))
      .filter(item => item.schedule !== undefined);

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        if (schedules[i].schedule.overlapsWith(schedules[j].schedule)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Añade un día al horario
   */
  addDay(day: keyof IWeeklySchedule, timeRange: TimeRange): WorkSchedule {
    const newSchedule = { ...this._schedule };
    newSchedule[day] = timeRange;
    return new WorkSchedule(newSchedule);
  }

  /**
   * Remueve un día del horario
   */
  removeDay(day: keyof IWeeklySchedule): WorkSchedule {
    const newSchedule = { ...this._schedule };
    delete newSchedule[day];
    return new WorkSchedule(newSchedule);
  }

  /**
   * Modifica el horario de un día
   */
  updateDay(day: keyof IWeeklySchedule, timeRange: TimeRange): WorkSchedule {
    if (!this._schedule[day]) {
      throw new Error(`No existe horario para ${day}`);
    }
    return this.addDay(day, timeRange);
  }

  /**
   * Aplica el mismo horario a múltiples días
   */
  applyToMultipleDays(days: (keyof IWeeklySchedule)[], timeRange: TimeRange): WorkSchedule {
    let newSchedule = new WorkSchedule(this._schedule);
    days.forEach(day => {
      newSchedule = newSchedule.addDay(day, timeRange);
    });
    return newSchedule;
  }

  /**
   * Extiende todos los horarios por un número de minutos
   */
  extendAllDays(minutes: number): WorkSchedule {
    const newSchedule: IWeeklySchedule = {};
    
    Object.entries(this._schedule).forEach(([day, timeRange]) => {
      if (timeRange) {
        newSchedule[day as keyof IWeeklySchedule] = timeRange.extend(minutes);
      }
    });

    return new WorkSchedule(newSchedule);
  }

  /**
   * Desplaza todos los horarios por un número de minutos
   */
  shiftAllDays(minutes: number): WorkSchedule {
    const newSchedule: IWeeklySchedule = {};
    
    Object.entries(this._schedule).forEach(([day, timeRange]) => {
      if (timeRange) {
        newSchedule[day as keyof IWeeklySchedule] = timeRange.shift(minutes);
      }
    });

    return new WorkSchedule(newSchedule);
  }

  /**
   * Valida el horario
   */
  private validateSchedule(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar que tenga al menos un día laboral
    if (this.workingDays.length === 0) {
      errors.push('Debe tener al menos un día laboral');
    }

    // Validar horas semanales máximas
    if (this.weeklyHours > 60) {
      errors.push('Las horas semanales no pueden exceder 60 horas');
    }

    // Validar horas diarias máximas
    this.workingDays.forEach(day => {
      const daySchedule = this._schedule[day as keyof IWeeklySchedule];
      if (daySchedule && daySchedule.durationHours > 12) {
        errors.push(`Las horas del ${day} no pueden exceder 12 horas`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convierte a string legible
   */
  toString(): string {
    const dayNames = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };

    return this.workingDays
      .map(day => `${dayNames[day as keyof typeof dayNames]}: ${this._schedule[day as keyof IWeeklySchedule]?.toString()}`)
      .join('\n');
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      schedule: Object.fromEntries(
        Object.entries(this._schedule).map(([day, timeRange]) => [
          day,
          timeRange?.toJSON()
        ])
      ),
      workingDays: this.workingDays,
      weeklyHours: this.weeklyHours,
      averageDailyHours: this.averageDailyHours,
      isFullTime: this.isFullTime,
      isPartTime: this.isPartTime,
      includesWeekends: this.includesWeekends,
      hasConsistentSchedule: this.hasConsistentSchedule,
      includesNightShifts: this.includesNightShifts,
      weeklyNightHours: this.weeklyNightHours
    };
  }

  /**
   * Crea horarios predefinidos
   */
  static createStandardSchedule(type: 'full-time' | 'part-time' | 'weekend'): WorkSchedule {
    const standardHours = new TimeRange('08:00', '17:00');
    const partTimeHours = new TimeRange('08:00', '12:00');
    const weekendHours = new TimeRange('09:00', '15:00');

    switch (type) {
      case 'full-time':
        return new WorkSchedule({
          lunes: standardHours,
          martes: standardHours,
          miercoles: standardHours,
          jueves: standardHours,
          viernes: standardHours
        });
      case 'part-time':
        return new WorkSchedule({
          lunes: partTimeHours,
          martes: partTimeHours,
          miercoles: partTimeHours,
          jueves: partTimeHours,
          viernes: partTimeHours
        });
      case 'weekend':
        return new WorkSchedule({
          sabado: weekendHours,
          domingo: weekendHours
        });
      default:
        throw new Error(`Tipo de horario desconocido: ${type}`);
    }
  }

  /**
   * Crea un horario flexible
   */
  static createFlexibleSchedule(coreHours: TimeRange, flexibilityMinutes: number = 60): WorkSchedule {
    const morningFlex = coreHours.shift(-flexibilityMinutes);
    const eveningFlex = coreHours.shift(flexibilityMinutes);
    
    // Usar el horario con mayor flexibilidad
    const flexibleRange = new TimeRange(morningFlex.startTime, eveningFlex.endTime);
    
    return new WorkSchedule({
      lunes: flexibleRange,
      martes: flexibleRange,
      miercoles: flexibleRange,
      jueves: flexibleRange,
      viernes: flexibleRange
    });
  }

  /**
   * Verifica igualdad con otro horario
   */
  equals(other: WorkSchedule): boolean {
    const thisDays = this.workingDays.sort();
    const otherDays = other.workingDays.sort();

    if (thisDays.length !== otherDays.length) return false;

    return thisDays.every((day, index) => {
      if (day !== otherDays[index]) return false;
      const thisSchedule = this._schedule[day as keyof IWeeklySchedule];
      const otherSchedule = other._schedule[day as keyof IWeeklySchedule];
      return thisSchedule?.equals(otherSchedule!) || false;
    });
  }
}

export default WorkSchedule;