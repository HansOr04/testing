/**
 * WORK CODE ENUM
 * Códigos de trabajo para dispositivos biométricos FACEID 360
 */

export enum WorkCode {
  /**
   * Entrada al trabajo
   * Código: 0
   */
  ENTRADA = '0',

  /**
   * Salida del trabajo
   * Código: 1
   */
  SALIDA = '1',

  /**
   * Inicio de descanso
   * Código: 2
   */
  INICIO_DESCANSO = '2',

  /**
   * Fin de descanso
   * Código: 3
   */
  FIN_DESCANSO = '3',

  /**
   * Inicio de almuerzo
   * Código: 4
   */
  INICIO_ALMUERZO = '4',

  /**
   * Fin de almuerzo
   * Código: 5
   */
  FIN_ALMUERZO = '5'
}

/**
 * Descripción de códigos de trabajo
 */
export const WORK_CODE_DESCRIPTIONS = {
  [WorkCode.ENTRADA]: 'Entrada',
  [WorkCode.SALIDA]: 'Salida',
  [WorkCode.INICIO_DESCANSO]: 'Inicio de Descanso',
  [WorkCode.FIN_DESCANSO]: 'Fin de Descanso',
  [WorkCode.INICIO_ALMUERZO]: 'Inicio de Almuerzo',
  [WorkCode.FIN_ALMUERZO]: 'Fin de Almuerzo'
} as const;

/**
 * Códigos que marcan entrada/presencia
 */
export const ENTRY_CODES: WorkCode[] = [
  WorkCode.ENTRADA,
  WorkCode.FIN_DESCANSO,
  WorkCode.FIN_ALMUERZO
];

/**
 * Códigos que marcan salida/ausencia
 */
export const EXIT_CODES: WorkCode[] = [
  WorkCode.SALIDA,
  WorkCode.INICIO_DESCANSO,
  WorkCode.INICIO_ALMUERZO
];

/**
 * Códigos principales (entrada y salida)
 */
export const MAIN_CODES: WorkCode[] = [
  WorkCode.ENTRADA,
  WorkCode.SALIDA
];

/**
 * Códigos de breaks (descansos y almuerzo)
 */
export const BREAK_CODES: WorkCode[] = [
  WorkCode.INICIO_DESCANSO,
  WorkCode.FIN_DESCANSO,
  WorkCode.INICIO_ALMUERZO,
  WorkCode.FIN_ALMUERZO
];

/**
 * Configuración de validación por código
 */
export const WORK_CODE_CONFIG = {
  [WorkCode.ENTRADA]: {
    isEntry: true,
    isExit: false,
    isBreak: false,
    requiresPrevious: [] as WorkCode[],
    countsAsWorkTime: true,
    priority: 1
  },
  [WorkCode.SALIDA]: {
    isEntry: false,
    isExit: true,
    isBreak: false,
    requiresPrevious: [WorkCode.ENTRADA] as WorkCode[],
    countsAsWorkTime: true,
    priority: 1
  },
  [WorkCode.INICIO_DESCANSO]: {
    isEntry: false,
    isExit: true,
    isBreak: true,
    requiresPrevious: [WorkCode.ENTRADA, WorkCode.FIN_ALMUERZO] as WorkCode[],
    countsAsWorkTime: false,
    priority: 2
  },
  [WorkCode.FIN_DESCANSO]: {
    isEntry: true,
    isExit: false,
    isBreak: true,
    requiresPrevious: [WorkCode.INICIO_DESCANSO] as WorkCode[],
    countsAsWorkTime: true,
    priority: 2
  },
  [WorkCode.INICIO_ALMUERZO]: {
    isEntry: false,
    isExit: true,
    isBreak: true,
    requiresPrevious: [WorkCode.ENTRADA, WorkCode.FIN_DESCANSO] as WorkCode[],
    countsAsWorkTime: false,
    priority: 2
  },
  [WorkCode.FIN_ALMUERZO]: {
    isEntry: true,
    isExit: false,
    isBreak: true,
    requiresPrevious: [WorkCode.INICIO_ALMUERZO] as WorkCode[],
    countsAsWorkTime: true,
    priority: 2
  }
} as const;

/**
 * Obtiene la descripción de un código de trabajo
 */
export function getWorkCodeDescription(code: WorkCode): string {
  return WORK_CODE_DESCRIPTIONS[code];
}

/**
 * Verifica si un código es de entrada
 */
export function isEntryCode(code: WorkCode): boolean {
  return WORK_CODE_CONFIG[code].isEntry;
}

/**
 * Verifica si un código es de salida
 */
export function isExitCode(code: WorkCode): boolean {
  return WORK_CODE_CONFIG[code].isExit;
}

/**
 * Verifica si un código es de break
 */
export function isBreakCode(code: WorkCode): boolean {
  return WORK_CODE_CONFIG[code].isBreak;
}

/**
 * Verifica si un código cuenta como tiempo de trabajo
 */
export function countsAsWorkTime(code: WorkCode): boolean {
  return WORK_CODE_CONFIG[code].countsAsWorkTime;
}

/**
 * Obtiene los códigos previos requeridos
 */
export function getRequiredPreviousCodes(code: WorkCode): WorkCode[] {
  return [...WORK_CODE_CONFIG[code].requiresPrevious];
}

/**
 * Obtiene la prioridad de un código (1 = alta, 2 = media, 3 = baja)
 */
export function getCodePriority(code: WorkCode): number {
  return WORK_CODE_CONFIG[code].priority;
}

/**
 * Valida secuencia de códigos
 */
export function validateCodeSequence(codes: WorkCode[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (codes.length === 0) {
    return { isValid: true, errors: [] };
  }

  // El primer código debe ser ENTRADA
  if (codes[0] !== WorkCode.ENTRADA) {
    errors.push('La jornada debe comenzar con una entrada');
  }

  // Validar secuencia
  for (let i = 1; i < codes.length; i++) {
    const currentCode = codes[i];
    const requiredPrevious = getRequiredPreviousCodes(currentCode);
    
    if (requiredPrevious.length > 0) {
      const hasPrevious = requiredPrevious.some(reqCode => 
        codes.slice(0, i).includes(reqCode)
      );
      
      if (!hasPrevious) {
        errors.push(`${getWorkCodeDescription(currentCode)} requiere ${requiredPrevious.map(getWorkCodeDescription).join(' o ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene el siguiente código esperado
 */
export function getExpectedNextCodes(lastCode?: WorkCode): WorkCode[] {
  if (!lastCode) {
    return [WorkCode.ENTRADA];
  }

  switch (lastCode) {
    case WorkCode.ENTRADA:
      return [WorkCode.SALIDA, WorkCode.INICIO_DESCANSO, WorkCode.INICIO_ALMUERZO];
    case WorkCode.INICIO_DESCANSO:
      return [WorkCode.FIN_DESCANSO];
    case WorkCode.FIN_DESCANSO:
      return [WorkCode.SALIDA, WorkCode.INICIO_ALMUERZO];
    case WorkCode.INICIO_ALMUERZO:
      return [WorkCode.FIN_ALMUERZO];
    case WorkCode.FIN_ALMUERZO:
      return [WorkCode.SALIDA, WorkCode.INICIO_DESCANSO];
    case WorkCode.SALIDA:
      return [WorkCode.ENTRADA]; // Para el siguiente día
    default:
      return [];
  }
}

export default WorkCode;