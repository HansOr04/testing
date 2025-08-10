
// src/core/interfaces/services/attendance-calculator.service.interface.ts

import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { Employee } from '../../entities/employee.entity';
import { OvertimeCalculation } from '../../value-objects/overtime-calculation.vo';

/**
 * Contrato para el servicio de cálculo de asistencia
 * Define operaciones para cálculos complejos de horas y tarifas
 */
export interface IAttendanceCalculatorService {
  /**
   * Calcular horas trabajadas en un día
   */
  calculateDailyHours(
    employee: Employee,
    attendanceRecords: AttendanceRecord[],
    date: Date
  ): Promise<{
    regularHours: number;
    overtimeHours: number;
    overtimeCalculation: OvertimeCalculation;
    workPeriods: Array<{
      start: Date;
      end: Date;
      duration: number;
      isOvertime: boolean;
    }>;
    breaks: Array<{
      start: Date;
      end: Date;
      duration: number;
    }>;
    totalWorkTime: number;
    effectiveWorkTime: number;
  }>;

  /**
   * Calcular horas trabajadas en un período
   */
  calculatePeriodHours(
    employee: Employee,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDays: number;
    daysWorked: number;
    daysAbsent: number;
    regularHours: number;
    overtimeHours: number;
    overtimeBreakdown: {
      recargo25: number;    // 19:00-24:00
      suplementario50: number;  // 24:00-06:00 y domingos
      extraordinario100: number; // feriados
    };
    attendanceRate: number;
    punctualityRate: number;
    lateArrivals: number;
    earlyDepartures: number;
  }>;

  /**
   * Procesar asistencia para empleados administrativos
   */
  processAdministrativeAttendance(
    employee: Employee,
    attendanceRecords: AttendanceRecord[],
    date: Date
  ): Promise<{
    effectiveSucursal: string;
    regularHours: number;
    overtimeHours: number;
    crossSucursalWork: Array<{
      sucursalId: string;
      hours: number;
      percentage: number;
    }>;
    calculation: OvertimeCalculation;
  }>;

  /**
   * Calcular tarifas de horas extras según legislación ecuatoriana
   */
  calculateOvertimeRates(
    employee: Employee,
    overtimeHours: {
      recargo25: number;
      suplementario50: number;
      extraordinario100: number;
    },
    baseSalary: number
  ): Promise<{
    rates: {
      hourlyRate: number;
      recargo25Rate: number;     // +25%
      suplementario50Rate: number;   // +50%
      extraordinario100Rate: number; // +100%
    };
    amounts: {
      regularAmount: number;
      recargoAmount: number;
      suplementarioAmount: number;
      extraordinarioAmount: number;
      totalOvertimeAmount: number;
      totalAmount: number;
    };
    calculations: {
      recargo25Calculation: string;
      suplementario50Calculation: string;
      extraordinario100Calculation: string;
    };
  }>;

  /**
   * Detectar patrones de trabajo irregulares
   */
  detectWorkPatterns(
    employee: Employee,
    startDate: Date,
    endDate: Date
  ): Promise<{
    patterns: Array<{
      type: 'consistent' | 'irregular' | 'overtime_frequent' | 'late_pattern' | 'early_departure';
      description: string;
      frequency: number;
      impact: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
    efficiency: {
      score: number;
      factors: Array<{
        factor: string;
        impact: number;
        description: string;
      }>;
    };
  }>;

  /**
   * Calcular métricas de productividad
   */
  calculateProductivityMetrics(
    employee: Employee,
    period: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<{
    attendanceScore: number;
    punctualityScore: number;
    consistencyScore: number;
    overtimeEfficiency: number;
    overallScore: number;
    ranking: {
      position: number;
      totalEmployees: number;
      percentile: number;
    };
    trends: {
      improving: boolean;
      stagnant: boolean;
      declining: boolean;
      changePercentage: number;
    };
  }>;

  /**
   * Proyectar costos laborales
   */
  projectLaborCosts(
    employees: Employee[],
    projectionPeriod: {
      startDate: Date;
      endDate: Date;
    },
    assumptions: {
      expectedOvertimeIncrease?: number;
      salaryInflation?: number;
      productivityChange?: number;
    }
  ): Promise<{
    currentCosts: {
      regularSalaries: number;
      overtimeCosts: number;
      totalCosts: number;
    };
    projectedCosts: {
      regularSalaries: number;
      estimatedOvertime: number;
      totalEstimated: number;
    };
    variance: {
      absolute: number;
      percentage: number;
    };
    breakdown: Array<{
      employeeId: string;
      currentMonthlyCost: number;
      projectedMonthlyCost: number;
      variance: number;
    }>;
  }>;
}