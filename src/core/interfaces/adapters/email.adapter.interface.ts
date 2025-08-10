// src/core/interfaces/adapters/email.adapter.interface.ts

/**
 * Contrato para adaptadores de email
 * Define operaciones para envío de notificaciones y reportes
 */
export interface IEmailAdapter {
  /**
   * Configurar adaptador de email
   */
  configure(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  }): Promise<void>;

  /**
   * Enviar email simple
   */
  sendEmail(options: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  /**
   * Enviar email con plantilla
   */
  sendTemplateEmail(templateName: string, options: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    templateData: any;
    attachments?: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  /**
   * Enviar notificación de alerta
   */
  sendAlert(alert: {
    type: 'system' | 'device' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    recipients: string[];
    metadata?: any;
  }): Promise<{
    success: boolean;
    sentTo: string[];
    failed: string[];
    error?: string;
  }>;

  /**
   * Enviar reporte por email
   */
  sendReport(report: {
    reportName: string;
    recipients: string[];
    subject: string;
    summary: string;
    attachments: Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  /**
   * Verificar configuración de email
   */
  verifyConfiguration(): Promise<{
    isValid: boolean;
    canSend: boolean;
    error?: string;
  }>;

  /**
   * Obtener estadísticas de envío
   */
  getStatistics(): Promise<{
    totalSent: number;
    totalFailed: number;
    lastSent?: Date;
    successRate: number;
    averageDeliveryTime: number;
  }>;
}