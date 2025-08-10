/**
 * OVERTIME CALCULATION VALUE OBJECT
 * Maneja los cálculos de horas extras con diferentes tarifas
 * Incluye recargo (25%), suplementarias (50%) y extraordinarias (100%)
 */

import { EmployeeType } from '@core/enums/employee-type.enum';

/**
 * Configuración de tarifas de overtime
 */
export interface IOvertimeRates {
  recargo: number;        // 25% - Horas 9-10 (lunes a viernes)
  suplementarias: number; // 50% - Horas 11-12 (lunes a viernes)
  extraordinarias: number; // 100% - Fines de semana y feriados
}

/**
 * Resultado detallado del cálculo de overtime
 */
export interface IOvertimeBreakdown {
  regularHours: number;
  recargoHours: number;
  suplementariasHours: number;
  extraordinariasHours: number;
  nightHours: number;
  totalOvertimeHours: number;
  
  // Valores monetarios (si se proporciona salario base)
  regularAmount?: number;
  recargoAmount?: number;
  suplementariasAmount?: number;
  extraordinariasAmount?: number;
  nightAmount?: number;
  totalAmount?: number;
}

/**
 * Contexto del día para cálculo
 */
export interface IDayContext {
  date: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  employeeType: EmployeeType;
  scheduledHours: number;
  minimumHours?: number;
}

export class OvertimeCalculation {
  private readonly _totalHours: number;
  private readonly _dayContext: IDayContext;
  private readonly _rates: IOvertimeRates;
  private readonly _hourlySalary?: number;
  private readonly _breakdown: IOvertimeBreakdown;

  constructor(
    totalHours: number,
    dayContext: IDayContext,
    rates: IOvertimeRates = { recargo: 0.25, suplementarias: 0.50, extraordinarias: 1.00 },
    hourlySalary?: number
  ) {
    this.validateInputs(totalHours, dayContext, rates);
    
    this._totalHours = totalHours;
    this._dayContext = dayContext;
    this._rates = rates;
    this._hourlySalary = hourlySalary;
    this._breakdown = this.calculateBreakdown();
  }

  /**
   * Obtiene las horas totales
   */
  get totalHours(): number {
    return this._totalHours;
  }

  /**
   * Obtiene el contexto del día
   */
  get dayContext(): IDayContext {
    return { ...this._dayContext };
  }

  /**
   * Obtiene las tarifas utilizadas
   */
  get rates(): IOvertimeRates {
    return { ...this._rates };
  }

  /**
   * Obtiene el salario por hora
   */
  get hourlySalary(): number | undefined {
    return this._hourlySalary;
  }

  /**
   * Obtiene el desglose completo
   */
  get breakdown(): IOvertimeBreakdown {
    return { ...this._breakdown };
  }

  /**
   * Obtiene solo las horas regulares
   */
  get regularHours(): number {
    return this._breakdown.regularHours;
  }

  /**
   * Obtiene las horas de recargo (25%)
   */
  get recargoHours(): number {
    return this._breakdown.recargoHours;
  }

  /**
   * Obtiene las horas suplementarias (50%)
   */
  get suplementariasHours(): number {
    return this._breakdown.suplementariasHours;
  }

  /**
   * Obtiene las horas extraordinarias (100%)
   */
  get extraordinariasHours(): number {
    return this._breakdown.extraordinariasHours;
  }

  /**
   * Obtiene las horas nocturnas
   */
  get nightHours(): number {
    return this._breakdown.nightHours;
  }

  /**
   * Obtiene el total de horas extras
   */
  get totalOvertimeHours(): number {
    return this._breakdown.totalOvertimeHours;
  }

  /**
   * Verifica si tiene horas extras
   */
  get hasOvertime(): boolean {
    return this._breakdown.totalOvertimeHours > 0;
  }

  /**
   * Verifica si es día de pago especial (fines de semana/feriados)
   */
  get isSpecialPayDay(): boolean {
    return this._dayContext.isWeekend || this._dayContext.isHoliday;
  }

  /**
   * Obtiene el multiplicador promedio aplicado
   */
  get averageMultiplier(): number {
    if (this._totalHours === 0) return 1;
    
    const regularAmount = this._breakdown.regularHours;
    const overtimeAmount = 
      (this._breakdown.recargoHours * (1 + this._rates.recargo)) +
      (this._breakdown.suplementariasHours * (1 + this._rates.suplementarias)) +
      (this._breakdown.extraordinariasHours * (1 + this._rates.extraordinarias));
    
    return (regularAmount + overtimeAmount) / this._totalHours;
  }

  /**
   * Calcula el desglose de horas y montos
   */
  private calculateBreakdown(): IOvertimeBreakdown {
    const breakdown: IOvertimeBreakdown = {
      regularHours: 0,
      recargoHours: 0,
      suplementariasHours: 0,
      extraordinariasHours: 0,
      nightHours: 0,
      totalOvertimeHours: 0
    };

    // Para empleados administrativos, usar lógica especial
    if (this._dayContext.employeeType === EmployeeType.ADMINISTRATIVO) {
      return this.calculateAdministrativeOvertime(breakdown);
    }

    // Para empleados regulares, usar lógica estándar
    return this.calculateRegularOvertime(breakdown);
  }

  /**
   * Calcula overtime para empleados regulares
   */
  private calculateRegularOvertime(breakdown: IOvertimeBreakdown): IOvertimeBreakdown {
    const scheduledHours = this._dayContext.scheduledHours;
    let remainingHours = this._totalHours;

    // Si es fin de semana o feriado, todas las horas son extraordinarias
    if (this.isSpecialPayDay) {
      breakdown.extraordinariasHours = remainingHours;
      breakdown.totalOvertimeHours = remainingHours;
    } else {
      // Horas regulares (hasta las programadas, máximo 8)
      const maxRegularHours = Math.min(scheduledHours, 8);
      breakdown.regularHours = Math.min(remainingHours, maxRegularHours);
      remainingHours -= breakdown.regularHours;

      if (remainingHours > 0) {
        // Horas de recargo (25%) - horas 9-10
        const recargoLimit = 2; // Máximo 2 horas de recargo
        breakdown.recargoHours = Math.min(remainingHours, recargoLimit);
        remainingHours -= breakdown.recargoHours;

        if (remainingHours > 0) {
          // Horas suplementarias (50%) - horas 11-12
          const suplementariasLimit = 2; // Máximo 2 horas suplementarias
          breakdown.suplementariasHours = Math.min(remainingHours, suplementariasLimit);
          remainingHours -= breakdown.suplementariasHours;

          // Cualquier hora adicional es extraordinaria (100%)
          if (remainingHours > 0) {
            breakdown.extraordinariasHours = remainingHours;
          }
        }
      }

      breakdown.totalOvertimeHours = 
        breakdown.recargoHours + 
        breakdown.suplementariasHours + 
        breakdown.extraordinariasHours;
    }

    // Calcular montos si se proporciona salario
    if (this._hourlySalary) {
      this.calculateMonetaryAmounts(breakdown);
    }

    return breakdown;
  }

  /**
   * Calcula overtime para empleados administrativos
   */
  private calculateAdministrativeOvertime(breakdown: IOvertimeBreakdown): IOvertimeBreakdown {
    const minimumHours = this._dayContext.minimumHours || 4;
    
    // Los empleados administrativos solo cuentan días con mínimo 4 horas
    if (this._totalHours < minimumHours) {
      // No se cuenta el día para cálculos
      breakdown.regularHours = 0;
      breakdown.totalOvertimeHours = 0;
      return breakdown;
    }

    // Para administrativos, aplicar solo extraordinarias en fines de semana/feriados
    if (this.isSpecialPayDay) {
      breakdown.extraordinariasHours = this._totalHours;
      breakdown.totalOvertimeHours = this._totalHours;
    } else {
      // En días normales, hasta 8 horas son regulares
      breakdown.regularHours = Math.min(this._totalHours, 8);
      
      if (this._totalHours > 8) {
        // Solo extraordinarias para administrativos (no recargo ni suplementarias)
        breakdown.extraordinariasHours = this._totalHours - 8;
        breakdown.totalOvertimeHours = breakdown.extraordinariasHours;
      }
    }

    // Calcular montos si se proporciona salario
    if (this._hourlySalary) {
      this.calculateMonetaryAmounts(breakdown);
    }

    return breakdown;
  }

  /**
   * Calcula los montos monetarios
   */
  private calculateMonetaryAmounts(breakdown: IOvertimeBreakdown): void {
    if (!this._hourlySalary) return;

    breakdown.regularAmount = breakdown.regularHours * this._hourlySalary;
    breakdown.recargoAmount = breakdown.recargoHours * this._hourlySalary * (1 + this._rates.recargo);
    breakdown.suplementariasAmount = breakdown.suplementariasHours * this._hourlySalary * (1 + this._rates.suplementarias);
    breakdown.extraordinariasAmount = breakdown.extraordinariasHours * this._hourlySalary * (1 + this._rates.extraordinarias);
    breakdown.nightAmount = breakdown.nightHours * this._hourlySalary * 0.25; // 25% adicional nocturno

    breakdown.totalAmount = 
      (breakdown.regularAmount || 0) +
      (breakdown.recargoAmount || 0) +
      (breakdown.suplementariasAmount || 0) +
      (breakdown.extraordinariasAmount || 0) +
      (breakdown.nightAmount || 0);
  }

  /**
   * Valida las entradas del constructor
   */
  private validateInputs(totalHours: number, dayContext: IDayContext, rates: IOvertimeRates): void {
    if (totalHours < 0) {
      throw new Error('Las horas totales no pueden ser negativas');
    }

    if (totalHours > 24) {
      throw new Error('Las horas totales no pueden exceder 24 horas');
    }

    if (!dayContext.date || isNaN(dayContext.date.getTime())) {
      throw new Error('La fecha del contexto debe ser válida');
    }

    if (dayContext.scheduledHours < 0 || dayContext.scheduledHours > 12) {
      throw new Error('Las horas programadas deben estar entre 0 y 12');
    }

    if (rates.recargo < 0 || rates.suplementarias < 0 || rates.extraordinarias < 0) {
      throw new Error('Las tarifas no pueden ser negativas');
    }

    if (rates.recargo > 2 || rates.suplementarias > 2 || rates.extraordinarias > 3) {
      throw new Error('Las tarifas parecen excesivamente altas');
    }
  }

  /**
   * Crea un resumen textual del cálculo
   */
  createSummary(): string {
    const lines: string[] = [];
    
    lines.push(`📊 RESUMEN DE HORAS - ${this._dayContext.date.toLocaleDateString()}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (this._breakdown.regularHours > 0) {
      lines.push(`⏰ Horas Regulares: ${this._breakdown.regularHours.toFixed(2)}h`);
    }
    
    if (this._breakdown.recargoHours > 0) {
      lines.push(`📈 Recargo (25%): ${this._breakdown.recargoHours.toFixed(2)}h`);
    }
    
    if (this._breakdown.suplementariasHours > 0) {
      lines.push(`📊 Suplementarias (50%): ${this._breakdown.suplementariasHours.toFixed(2)}h`);
    }
    
    if (this._breakdown.extraordinariasHours > 0) {
      lines.push(`🚀 Extraordinarias (100%): ${this._breakdown.extraordinariasHours.toFixed(2)}h`);
    }
    
    if (this._breakdown.nightHours > 0) {
      lines.push(`🌙 Nocturnas: ${this._breakdown.nightHours.toFixed(2)}h`);
    }
    
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`⚡ Total Horas: ${this._totalHours.toFixed(2)}h`);
    lines.push(`⭐ Total Extras: ${this._breakdown.totalOvertimeHours.toFixed(2)}h`);
    
    if (this._hourlySalary && this._breakdown.totalAmount) {
      lines.push(`💰 Monto Total: $${this._breakdown.totalAmount.toFixed(2)}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Convierte a JSON para serialización
   */
  toJSON(): object {
    return {
      totalHours: this._totalHours,
      dayContext: this._dayContext,
      rates: this._rates,
      hourlySalary: this._hourlySalary,
      breakdown: this._breakdown,
      hasOvertime: this.hasOvertime,
      isSpecialPayDay: this.isSpecialPayDay,
      averageMultiplier: this.averageMultiplier
    };
  }

  /**
   * Crea cálculo con configuración estándar ecuatoriana
   */
  static createStandardEcuador(
    totalHours: number,
    dayContext: IDayContext,
    hourlySalary?: number
  ): OvertimeCalculation {
    const standardRates: IOvertimeRates = {
      recargo: 0.25,        // 25%
      suplementarias: 0.50, // 50%
      extraordinarias: 1.00 // 100%
    };

    return new OvertimeCalculation(totalHours, dayContext, standardRates, hourlySalary);
  }

  /**
   * Crea cálculo para empleado administrativo
   */
  static createForAdministrative(
    totalHours: number,
    date: Date,
    isWeekend: boolean = false,
    isHoliday: boolean = false,
    hourlySalary?: number
  ): OvertimeCalculation {
    const dayContext: IDayContext = {
      date,
      isWeekend,
      isHoliday,
      employeeType: EmployeeType.ADMINISTRATIVO,
      scheduledHours: 8,
      minimumHours: 4
    };

    return OvertimeCalculation.createStandardEcuador(totalHours, dayContext, hourlySalary);
  }

  /**
   * Crea cálculo para empleado regular
   */
  static createForRegular(
    totalHours: number,
    date: Date,
    scheduledHours: number = 8,
    isWeekend: boolean = false,
    isHoliday: boolean = false,
    hourlySalary?: number
  ): OvertimeCalculation {
    const dayContext: IDayContext = {
      date,
      isWeekend,
      isHoliday,
      employeeType: EmployeeType.REGULAR,
      scheduledHours
    };

    return OvertimeCalculation.createStandardEcuador(totalHours, dayContext, hourlySalary);
  }

  /**
   * Combina múltiples cálculos de overtime (para reportes semanales/mensuales)
   */
  static combineCalculations(calculations: OvertimeCalculation[]): IOvertimeBreakdown {
    const combined: IOvertimeBreakdown = {
      regularHours: 0,
      recargoHours: 0,
      suplementariasHours: 0,
      extraordinariasHours: 0,
      nightHours: 0,
      totalOvertimeHours: 0,
      regularAmount: 0,
      recargoAmount: 0,
      suplementariasAmount: 0,
      extraordinariasAmount: 0,
      nightAmount: 0,
      totalAmount: 0
    };

    for (const calc of calculations) {
      const breakdown = calc.breakdown;
      
      combined.regularHours += breakdown.regularHours;
      combined.recargoHours += breakdown.recargoHours;
      combined.suplementariasHours += breakdown.suplementariasHours;
      combined.extraordinariasHours += breakdown.extraordinariasHours;
      combined.nightHours += breakdown.nightHours;
      combined.totalOvertimeHours += breakdown.totalOvertimeHours;
      
      if (breakdown.regularAmount) combined.regularAmount! += breakdown.regularAmount;
      if (breakdown.recargoAmount) combined.recargoAmount! += breakdown.recargoAmount;
      if (breakdown.suplementariasAmount) combined.suplementariasAmount! += breakdown.suplementariasAmount;
      if (breakdown.extraordinariasAmount) combined.extraordinariasAmount! += breakdown.extraordinariasAmount;
      if (breakdown.nightAmount) combined.nightAmount! += breakdown.nightAmount;
      if (breakdown.totalAmount) combined.totalAmount! += breakdown.totalAmount;
    }

    return combined;
  }

  /**
   * Verifica si el cálculo es válido
   */
  static isValid(totalHours: number, dayContext: IDayContext): boolean {
    try {
      new OvertimeCalculation(totalHours, dayContext);
      return true;
    } catch {
      return false;
    }
  }
}

export default OvertimeCalculation;