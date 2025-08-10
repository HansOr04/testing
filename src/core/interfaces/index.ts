// src/core/interfaces/index.ts

/**
 * Índice principal de todas las interfaces del core
 * Punto de entrada único para importar contratos del dominio
 */

// Repository interfaces
export * from './repositories';

// Service interfaces  
export * from './services';

// Adapter interfaces
export * from './adapters';

/**
 * Constantes para todos los tokens de inyección de dependencias
 */
export const CORE_TOKENS = {
  // Repository tokens
  ...require('./repositories').REPOSITORY_TOKENS,
  
  // Service tokens
  ...require('./services').SERVICE_TOKENS,
  
  // Adapter tokens
  ...require('./adapters').ADAPTER_TOKENS,
} as const;

/**
 * Tipo para todos los tokens disponibles
 */
export type CoreToken = typeof CORE_TOKENS[keyof typeof CORE_TOKENS];

/**
 * Mapa completo de todas las dependencias del core
 */
export interface CoreDependencyMap {
  // Repositories
  repositories: import('./repositories').RepositoryMap;
  
  // Services
  services: import('./services').ServiceMap;
  
  // Adapters
  adapters: import('./adapters').AdapterMap;
}

/**
 * Configuración de inyección de dependencias para el core
 * Define cómo se deben resolver las dependencias
 */
export interface CoreDependencyConfiguration {
  repositories: {
    [K in keyof import('./repositories').RepositoryMap]: {
      implementation: string;
      singleton?: boolean;
      dependencies?: string[];
    };
  };
  
  services: {
    [K in keyof import('./services').ServiceMap]: {
      implementation: string;
      singleton?: boolean;
      dependencies?: string[];
    };
  };
  
  adapters: {
    [K in keyof import('./adapters').AdapterMap]: {
      implementation: string;
      singleton?: boolean;
      dependencies?: string[];
    };
  };
}

/**
 * Metadatos de contratos para documentación automática
 */
export const CONTRACT_METADATA = {
  repositories: {
    description: 'Contratos para acceso a datos y persistencia',
    count: Object.keys(require('./repositories').REPOSITORY_TOKENS).length,
    entities: [
      'User', 'Employee', 'Sucursal', 'Area', 
      'AttendanceRecord', 'BiometricLog', 'BiometricDevice'
    ],
  },
  
  services: {
    description: 'Contratos para lógica de negocio y casos de uso',
    count: Object.keys(require('./services').SERVICE_TOKENS).length,
    domains: [
      'Authentication', 'Employee Management', 'Attendance Tracking',
      'Biometric Integration', 'Calculations', 'Reporting'
    ],
  },
  
  adapters: {
    description: 'Contratos para integración con sistemas externos',
    count: Object.keys(require('./adapters').ADAPTER_TOKENS).length,
    integrations: [
      'Database (SQL Server/PostgreSQL)', 
      'Biometric Devices (FACEID 360)',
      'Email Notifications'
    ],
  },
} as const;

/**
 * Validador de contratos - verifica que las implementaciones cumplan los contratos
 */
export interface IContractValidator {
  /**
   * Validar que una implementación cumple con su contrato
   */
  validateImplementation<T>(
    contract: new (...args: any[]) => T,
    implementation: any
  ): {
    isValid: boolean;
    missingMethods: string[];
    extraMethods: string[];
    errors: string[];
  };

  /**
   * Validar configuración de dependencias
   */
  validateDependencyConfiguration(
    config: CoreDependencyConfiguration
  ): {
    isValid: boolean;
    circularDependencies: string[];
    missingDependencies: string[];
    errors: string[];
  };
}

/**
 * Factory para crear validador de contratos
 */
export function createContractValidator(): IContractValidator {
  return {
    validateImplementation<T>(contract: new (...args: any[]) => T, implementation: any) {
      const contractMethods = Object.getOwnPropertyNames(contract.prototype)
        .filter(name => name !== 'constructor' && typeof contract.prototype[name] === 'function');
      
      const implementationMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(implementation))
        .filter(name => name !== 'constructor' && typeof implementation[name] === 'function');
      
      const missingMethods = contractMethods.filter(method => !implementationMethods.includes(method));
      const extraMethods = implementationMethods.filter(method => !contractMethods.includes(method));
      
      return {
        isValid: missingMethods.length === 0,
        missingMethods,
        extraMethods,
        errors: missingMethods.map(method => `Missing implementation for method: ${method}`)
      };
    },

    validateDependencyConfiguration(config: CoreDependencyConfiguration) {
      // Implementación básica de validación
      const circularDependencies: string[] = [];
      const missingDependencies: string[] = [];
      const errors: string[] = [];

      // Validar dependencias circulares (implementación simplificada)
      const allDependencies = new Map<string, string[]>();
      
      // Recopilar todas las dependencias
      Object.entries(config.repositories).forEach(([key, value]) => {
        allDependencies.set(key, value.dependencies || []);
      });
      Object.entries(config.services).forEach(([key, value]) => {
        allDependencies.set(key, value.dependencies || []);
      });
      Object.entries(config.adapters).forEach(([key, value]) => {
        allDependencies.set(key, value.dependencies || []);
      });

      // Detectar dependencias circulares usando DFS
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      function detectCycles(node: string): boolean {
        if (recursionStack.has(node)) {
          circularDependencies.push(node);
          return true;
        }
        if (visited.has(node)) return false;

        visited.add(node);
        recursionStack.add(node);

        const dependencies = allDependencies.get(node) || [];
        for (const dep of dependencies) {
          if (detectCycles(dep)) return true;
        }

        recursionStack.delete(node);
        return false;
      }

      allDependencies.forEach((_, key) => {
        if (!visited.has(key)) {
          detectCycles(key);
        }
      });

      return {
        isValid: circularDependencies.length === 0 && missingDependencies.length === 0,
        circularDependencies,
        missingDependencies,
        errors
      };
    }
  };
}

/**
 * Utilidades para trabajar con contratos
 */
export const ContractUtils = {
  /**
   * Obtener todos los tokens disponibles
   */
  getAllTokens(): CoreToken[] {
    return Object.values(CORE_TOKENS);
  },

  /**
   * Obtener tokens por categoría
   */
  getTokensByCategory(category: 'repositories' | 'services' | 'adapters'): string[] {
    switch (category) {
      case 'repositories':
        return Object.values(require('./repositories').REPOSITORY_TOKENS);
      case 'services':
        return Object.values(require('./services').SERVICE_TOKENS);
      case 'adapters':
        return Object.values(require('./adapters').ADAPTER_TOKENS);
      default:
        return [];
    }
  },

  /**
   * Generar documentación de contratos
   */
  generateContractDocumentation(): {
    repositories: Array<{ name: string; description: string; methods: string[] }>;
    services: Array<{ name: string; description: string; methods: string[] }>;
    adapters: Array<{ name: string; description: string; methods: string[] }>;
  } {
    return {
      repositories: [
        {
          name: 'IUserRepository',
          description: 'Gestión de persistencia para usuarios del sistema',
          methods: ['findById', 'findByEmail', 'create', 'update', 'delete']
        },
        {
          name: 'IEmployeeRepository', 
          description: 'Gestión de persistencia para empleados',
          methods: ['findById', 'findBySucursal', 'create', 'update', 'delete']
        },
        {
          name: 'IAttendanceRepository',
          description: 'Gestión de registros de asistencia',
          methods: ['findByEmployeeAndDate', 'create', 'calculateMonthlyHours']
        }
        // ... más repositorios
      ],
      services: [
        {
          name: 'IAuthService',
          description: 'Autenticación y autorización de usuarios',
          methods: ['login', 'register', 'verifyToken', 'changePassword']
        },
        {
          name: 'IEmployeeService',
          description: 'Lógica de negocio para empleados',
          methods: ['createEmployee', 'updateEmployee', 'syncWithBiometricDevices']
        },
        {
          name: 'IAttendanceService',
          description: 'Gestión de asistencia y cálculos de horas',
          methods: ['recordManualAttendance', 'calculateWorkedHours', 'generateMonthlyReport']
        }
        // ... más servicios
      ],
      adapters: [
        {
          name: 'IDatabaseAdapter',
          description: 'Adaptador genérico para bases de datos',
          methods: ['connect', 'query', 'transaction', 'healthCheck']
        },
        {
          name: 'IBiometricAdapter',
          description: 'Integración con dispositivos FACEID 360',
          methods: ['connect', 'getAttendanceRecords', 'addUser', 'deleteUser']
        },
        {
          name: 'IEmailAdapter',
          description: 'Envío de notificaciones y reportes por email',
          methods: ['sendEmail', 'sendAlert', 'sendReport', 'verifyConfiguration']
        }
      ]
    };
  }
} as const;