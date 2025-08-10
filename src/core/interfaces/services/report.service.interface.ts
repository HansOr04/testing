// src/core/interfaces/services/report.service.interface.ts

import { Employee } from '../../entities/employee.entity';
import { AttendanceRecord } from '../../entities/attendance-record.entity';
import { EmployeeType } from '../../enums/employee-type.enum';

/**
 * Contrato para el servicio de reportes
 * Define todas las operaciones para generación y gestión de reportes
 */
export interface IReportService {
  /**
   * Generar reporte mensual de asistencia
   */
  generateMonthlyAttendanceReport(
    year: number,
    month: number,
    filters?: {
      sucursalIds?: string[];
      areaIds?: string[];
      employeeIds?: string[];
      employeeTypes?: EmployeeType[];
    }
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    summary: {
      totalEmployees: number;
      totalRegularHours: number;
      totalOvertimeHours: number;
      averageAttendanceRate: number;
      totalLaborCost: number;
    };
    employees: Array<{
      employeeId: string;
      employeeCode: string;
      fullName: string;
      sucursal: string;
      area: string;
      employeeType: EmployeeType;
      daysWorked: number;
      daysAbsent: number;
      regularHours: number;
      overtimeHours: number;
      overtimeBreakdown: {
        recargo25: number;
        suplementario50: number;
        extraordinario100: number;
      };
      attendanceRate: number;
      punctualityRate: number;
      lateArrivals: number;
      earlyDepartures: number;
      totalSalary: number;
      overtimeAmount: number;
      totalAmount: number;
    }>;
    sucursalSummary: Array<{
      sucursalId: string;
      sucursalName: string;
      totalEmployees: number;
      attendanceRate: number;
      regularHours: number;
      overtimeHours: number;
      totalCost: number;
    }>;
  }>;

  /**
   * Generar reporte de productividad por área
   */
  generateAreaProductivityReport(
    startDate: Date,
    endDate: Date,
    sucursalId?: string
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    areas: Array<{
      areaId: string;
      areaName: string;
      sucursalName: string;
      totalEmployees: number;
      averageAttendanceRate: number;
      averagePunctualityRate: number;
      productivityScore: number;
      trends: {
        attendanceTrend: 'improving' | 'stable' | 'declining';
        productivityTrend: 'improving' | 'stable' | 'declining';
        changePercentage: number;
      };
      topPerformers: Array<{
        employeeId: string;
        employeeName: string;
        score: number;
      }>;
      concerns: Array<{
        type: string;
        description: string;
        severity: 'low' | 'medium' | 'high';
      }>;
    }>;
    overall: {
      averageProductivity: number;
      topPerformingArea: string;
      mostImprovedArea: string;
      areasNeedingAttention: number;
    };
  }>;

  /**
   * Generar reporte de costos laborales
   */
  generateLaborCostReport(
    startDate: Date,
    endDate: Date,
    groupBy: 'sucursal' | 'area' | 'employee_type'
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    totalCosts: {
      regularSalaries: number;
      overtimeCosts: number;
      totalLaborCost: number;
    };
    breakdown: Array<{
      groupId: string;
      groupName: string;
      employeeCount: number;
      regularSalaries: number;
      overtimeCosts: number;
      totalCost: number;
      costPerEmployee: number;
      costPerHour: number;
      overtimePercentage: number;
    }>;
    trends: Array<{
      period: string;
      totalCost: number;
      overtimePercentage: number;
      changeFromPrevious: number;
    }>;
    recommendations: Array<{
      type: 'cost_optimization' | 'overtime_reduction' | 'efficiency_improvement';
      description: string;
      estimatedSavings: number;
      priority: 'low' | 'medium' | 'high';
    }>;
  }>;

  /**
   * Generar reporte de anomalías y irregularidades
   */
  generateAnomaliesReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    summary: {
      totalAnomalies: number;
      resolvedAnomalies: number;
      pendingAnomalies: number;
      highPriorityAnomalies: number;
    };
    anomalies: Array<{
      id: string;
      type: 'duplicate_records' | 'missing_exit' | 'missing_entry' | 'impossible_time' | 'excessive_hours' | 'biometric_mismatch';
      severity: 'low' | 'medium' | 'high' | 'critical';
      employeeId: string;
      employeeName: string;
      sucursal: string;
      date: Date;
      description: string;
      suggestedAction: string;
      status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
      detectedAt: Date;
      resolvedAt?: Date;
      resolvedBy?: string;
      resolutionNotes?: string;
    }>;
    patterns: Array<{
      pattern: string;
      frequency: number;
      affectedEmployees: number;
      commonFactors: string[];
      recommendation: string;
    }>;
  }>;

  /**
   * Generar reporte de dispositivos biométricos
   */
  generateBiometricDevicesReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    devicesOverview: {
      totalDevices: number;
      activeDevices: number;
      onlineDevices: number;
      averageUptime: number;
    };
    devices: Array<{
      deviceId: string;
      deviceName: string;
      sucursal: string;
      model: string;
      serialNumber: string;
      ipAddress: string;
      status: string;
      uptime: number;
      totalScans: number;
      successfulScans: number;
      failedScans: number;
      errorRate: number;
      lastSync: Date;
      issues: Array<{
        type: string;
        description: string;
        occurrence: Date;
        resolved: boolean;
      }>;
      performance: {
        averageResponseTime: number;
        peakUsageHour: number;
        memoryUsage: number;
        temperatureRange: string;
      };
    }>;
    alerts: Array<{
      deviceId: string;
      alertType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
      acknowledged: boolean;
    }>;
  }>;

  /**
   * Generar reporte de compliance y auditoría
   */
  generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    complianceScore: number;
    laborLawCompliance: {
      maxWeeklyHours: {
        compliant: boolean;
        violations: Array<{
          employeeId: string;
          week: string;
          hoursWorked: number;
          excess: number;
        }>;
      };
      overtimeRegulations: {
        compliant: boolean;
        violations: Array<{
          employeeId: string;
          date: Date;
          overtimeType: string;
          hours: number;
          violation: string;
        }>;
      };
      restPeriods: {
        compliant: boolean;
        violations: Array<{
          employeeId: string;
          date: Date;
          requiredRest: number;
          actualRest: number;
          violation: string;
        }>;
      };
    };
    dataIntegrity: {
      missingRecords: number;
      duplicateRecords: number;
      inconsistentRecords: number;
      dataQualityScore: number;
    };
    auditTrail: Array<{
      timestamp: Date;
      userId: string;
      action: string;
      resource: string;
      changes: any;
      ipAddress: string;
    }>;
    recommendations: Array<{
      category: 'legal' | 'operational' | 'technical';
      priority: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      requiredAction: string;
      dueDate?: Date;
    }>;
  }>;

  /**
   * Exportar reporte en formato específico
   */
  exportReport(
    reportId: string,
    format: 'pdf' | 'excel' | 'csv',
    options?: {
      includeCharts?: boolean;
      includeDetails?: boolean;
      customTemplate?: string;
    }
  ): Promise<{
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
    fileSize: number;
  }>;

  /**
   * Programar reporte automático
   */
  scheduleAutomaticReport(
    reportType: string,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time: string;
    },
    recipients: string[],
    filters?: any
  ): Promise<{
    scheduleId: string;
    nextRun: Date;
    configuration: any;
  }>;

  /**
   * Obtener reportes programados
   */
  getScheduledReports(): Promise<Array<{
    scheduleId: string;
    reportType: string;
    frequency: string;
    nextRun: Date;
    lastRun?: Date;
    recipients: string[];
    isActive: boolean;
  }>>;

  /**
   * Generar dashboard ejecutivo
   */
  generateExecutiveDashboard(
    period: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<{
    reportId: string;
    generatedAt: Date;
    period: string;
    kpis: {
      attendanceRate: {
        current: number;
        previous: number;
        trend: 'up' | 'down' | 'stable';
        change: number;
      };
      punctualityRate: {
        current: number;
        previous: number;
        trend: 'up' | 'down' | 'stable';
        change: number;
      };
      overtimePercentage: {
        current: number;
        previous: number;
        trend: 'up' | 'down' | 'stable';
        change: number;
      };
      laborCost: {
        current: number;
        previous: number;
        trend: 'up' | 'down' | 'stable';
        change: number;
      };
      productivity: {
        current: number;
        previous: number;
        trend: 'up' | 'down' | 'stable';
        change: number;
      };
    };
    alerts: Array<{
      type: 'performance' | 'compliance' | 'cost' | 'system';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      actionRequired: boolean;
    }>;
    topInsights: Array<{
      category: string;
      insight: string;
      impact: 'positive' | 'negative' | 'neutral';
      recommendation?: string;
    }>;
    sucursalPerformance: Array<{
      sucursalId: string;
      sucursalName: string;
      attendanceRate: number;
      productivityScore: number;
      costEfficiency: number;
      ranking: number;
    }>;
  }>;

  /**
   * Obtener historial de reportes generados
   */
  getReportHistory(
    filters?: {
      reportType?: string;
      startDate?: Date;
      endDate?: Date;
      generatedBy?: string;
    },
    pagination?: any
  ): Promise<{
    reports: Array<{
      reportId: string;
      reportType: string;
      title: string;
      generatedAt: Date;
      generatedBy: string;
      period: string;
      format: string;
      fileSize: number;
      downloadCount: number;
      isAvailable: boolean;
    }>;
    total: number;
  }>;

  /**
   * Eliminar reportes antiguos según política de retención
   */
  cleanOldReports(retentionDays: number): Promise<{
    deletedReports: number;
    freedSpace: number;
    errors: Array<{
      reportId: string;
      error: string;
    }>;
  }>;
}