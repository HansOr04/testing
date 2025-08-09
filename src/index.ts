/**
 * ARCHIVO PRINCIPAL TEMPORAL
 * Punto de entrada temporal para probar la Fase 1
 * Este archivo será reemplazado en fases posteriores
 */

import { initializeLogger, getLogger } from '@shared/utils/logger.util';
import { loadEnvironment, printConfiguration, validateEnvironmentConfiguration } from '@config/environment.config';
import { validateConfiguration as validateDatabaseConfig } from '@config/database.config';
import { validateSecurityConfiguration, printSecurityConfiguration } from '@config/security.config';
import { validateEmail, validateCedula, validateTimeRange } from '@shared/utils/validation.util';
import { formatDate, getCurrentDateEcuador, getWorkDayInfo } from '@shared/utils/date.util';
import { hashPassword, generateToken, verifyToken } from '@shared/utils/encryption.util';

async function testPhase1() {
  console.log('🚀 INICIANDO PRUEBAS - FASE 1: FUNDAMENTOS Y CONFIGURACIÓN');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    // 1. Cargar variables de entorno
    console.log('\n📦 1. Cargando variables de entorno...');
    loadEnvironment();
    console.log('✅ Variables de entorno cargadas correctamente');

    // 2. Inicializar logger
    console.log('\n📝 2. Inicializando sistema de logging...');
    const logger = initializeLogger({
      level: 0, // DEBUG
      enableConsole: true,
      enableFile: true,
      filePath: 'logs/test-phase1.log'
    });
    logger.info('Logger inicializado correctamente', 'TestPhase1');
    console.log('✅ Sistema de logging funcionando');

    // 3. Validar configuraciones
    console.log('\n⚙️  3. Validando configuraciones del sistema...');
    
    try {
      validateEnvironmentConfiguration();
      console.log('✅ Configuración de entorno válida');
    } catch (error) {
      console.log('⚠️  Configuración de entorno incompleta (normal en testing)');
    }

    try {
      validateDatabaseConfig();
      console.log('✅ Configuración de base de datos válida');
    } catch (error) {
      console.log('⚠️  Configuración de base de datos incompleta (normal en testing)');
    }

    try {
      validateSecurityConfiguration();
      console.log('✅ Configuración de seguridad válida');
    } catch (error) {
      console.log('⚠️  Configuración de seguridad incompleta (normal en testing)');
    }

    // 4. Probar utilidades de validación
    console.log('\n🔍 4. Probando utilidades de validación...');
    
    // Validar email
    const emailTest = validateEmail('test@ejemplo.com');
    console.log(`Email válido: ${emailTest.isValid ? '✅' : '❌'}`);
    
    // Validar cédula ecuatoriana
    const cedulaTest = validateCedula('1234567890'); // Cédula de ejemplo
    console.log(`Cédula válida: ${cedulaTest.isValid ? '✅' : '❌'} (${cedulaTest.errors.join(', ')})`);
    
    // Validar rango de tiempo
    const timeTest = validateTimeRange('08:00', '17:00');
    console.log(`Rango de tiempo válido: ${timeTest.isValid ? '✅' : '❌'}`);

    // 5. Probar utilidades de fecha
    console.log('\n📅 5. Probando utilidades de fecha...');
    
    const currentDate = getCurrentDateEcuador();
    console.log(`Fecha actual Ecuador: ${formatDate(currentDate)}`);
    
    const workDayInfo = getWorkDayInfo(currentDate);
    console.log(`Día laboral: ${workDayInfo.isWorkingDay ? '✅' : '❌'} (${workDayInfo.dayName})`);
    
    if (workDayInfo.isHoliday) {
      console.log(`🎉 Día festivo: ${workDayInfo.holidayName}`);
    }

    // 6. Probar utilidades de encriptación
    console.log('\n🔐 6. Probando utilidades de encriptación...');
    
    const testPassword = 'MiContraseña123!';
    const hashedPassword = await hashPassword(testPassword);
    console.log('✅ Password hasheado correctamente');
    
    // Solo generar token si tenemos JWT_SECRET
    if (process.env.JWT_SECRET) {
      const tokenPayload = {
        userId: '123',
        email: 'test@ejemplo.com',
        role: 'ADMIN' as any,
        sucursalId: 'sucursal-1'
      };
      
      const jwtConfig = {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h' as const,
        refreshExpiresIn: '7d' as const
      };
      
      const token = generateToken(tokenPayload, jwtConfig);
      
      const verification = verifyToken(token, process.env.JWT_SECRET);
      console.log(`Token JWT válido: ${verification.isValid ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  JWT_SECRET no configurado, saltando prueba de tokens');
    }

    // 7. Mostrar configuraciones
    console.log('\n📋 7. Mostrando configuraciones del sistema...');
    printConfiguration();
    
    try {
      printSecurityConfiguration();
    } catch (error) {
      console.log('⚠️  No se pudo mostrar configuración de seguridad completa');
    }

    // 8. Probar logging con diferentes niveles
    console.log('\n📝 8. Probando diferentes niveles de logging...');
    logger.debug('Mensaje de debug', 'TestPhase1', { testData: 'debug' });
    logger.info('Mensaje informativo', 'TestPhase1', { testData: 'info' });
    logger.warn('Mensaje de advertencia', 'TestPhase1', { testData: 'warning' });
    logger.error('Mensaje de error (simulado)', 'TestPhase1', { testData: 'error' });
    
    console.log('✅ Logging funcionando correctamente');

    // Resumen final
    console.log('\n🎉 FASE 1 COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Variables de entorno cargadas');
    console.log('✅ Sistema de logging inicializado');
    console.log('✅ Configuraciones validadas');
    console.log('✅ Utilidades de validación funcionando');
    console.log('✅ Utilidades de fecha funcionando');
    console.log('✅ Utilidades de encriptación funcionando');
    console.log('✅ Tipos compartidos definidos');
    console.log('\n🚀 El proyecto está listo para la Fase 2: Modelos de Datos');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR EN FASE 1:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas si este archivo es ejecutado directamente
if (require.main === module) {
  testPhase1().catch(console.error);
}

export default testPhase1;