/**
 * CEDULA VALUE OBJECT
 * Maneja la validación y operaciones de cédulas ecuatorianas
 */

import { validateCedula } from '@shared/utils/validation.util';

export class Cedula {
  private readonly _value: string;
  private readonly _isValid: boolean;
  private readonly _errors: string[];

  constructor(value: string) {
    const cleanValue = this.cleanCedula(value);
    const validation = validateCedula(cleanValue);
    
    this._value = cleanValue;
    this._isValid = validation.isValid;
    this._errors = validation.errors;

    if (!this._isValid) {
      throw new Error(`Cédula inválida: ${this._errors.join(', ')}`);
    }
  }

  /**
   * Obtiene el valor de la cédula
   */
  get value(): string {
    return this._value;
  }

  /**
   * Verifica si la cédula es válida
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
   * Obtiene la provincia de la cédula
   */
  get provincia(): number {
    return parseInt(this._value.substring(0, 2), 10);
  }

  /**
   * Obtiene el nombre de la provincia
   */
  get provinciaNombre(): string {
    const provinciaMap: { [key: number]: string } = {
      1: 'Azuay',
      2: 'Bolívar',
      3: 'Cañar',
      4: 'Carchi',
      5: 'Cotopaxi',
      6: 'Chimborazo',
      7: 'El Oro',
      8: 'Esmeraldas',
      9: 'Guayas',
      10: 'Imbabura',
      11: 'Loja',
      12: 'Los Ríos',
      13: 'Manabí',
      14: 'Morona Santiago',
      15: 'Napo',
      16: 'Pastaza',
      17: 'Pichincha',
      18: 'Tungurahua',
      19: 'Zamora Chinchipe',
      20: 'Galápagos',
      21: 'Sucumbíos',
      22: 'Orellana',
      23: 'Santo Domingo de los Tsáchilas',
      24: 'Santa Elena'
    };

    return provinciaMap[this.provincia] || 'Provincia Desconocida';
  }

  /**
   * Obtiene el tercer dígito (tipo de persona)
   */
  get tipoPersona(): number {
    return parseInt(this._value.charAt(2), 10);
  }

  /**
   * Verifica si es persona natural
   */
  get esPersonaNatural(): boolean {
    return this.tipoPersona < 6;
  }

  /**
   * Obtiene el dígito verificador
   */
  get digitoVerificador(): number {
    return parseInt(this._value.charAt(9), 10);
  }

  /**
   * Formatea la cédula con guiones
   */
  get formatted(): string {
    return `${this._value.substring(0, 2)}-${this._value.substring(2, 8)}-${this._value.substring(8, 10)}`;
  }

  /**
   * Formatea la cédula enmascarada (para privacidad)
   */
  get masked(): string {
    return `${this._value.substring(0, 2)}****${this._value.substring(6, 10)}`;
  }

  /**
   * Limpia la cédula removiendo espacios y guiones
   */
  private cleanCedula(value: string): string {
    if (!value) return '';
    return value.replace(/[\s-]/g, '');
  }

  /**
   * Verifica igualdad con otra cédula
   */
  equals(other: Cedula): boolean {
    return this._value === other._value;
  }

  /**
   * Convierte a string
   */
  toString(): string {
    return this._value;
  }

  /**
   * Convierte a JSON
   */
  toJSON(): object {
    return {
      value: this._value,
      formatted: this.formatted,
      provincia: this.provincia,
      provinciaNombre: this.provinciaNombre,
      esPersonaNatural: this.esPersonaNatural,
      isValid: this._isValid
    };
  }

  /**
   * Crea una instancia desde string si es válida
   */
  static tryCreate(value: string): Cedula | null {
    try {
      return new Cedula(value);
    } catch {
      return null;
    }
  }

  /**
   * Valida una cédula sin crear instancia
   */
  static isValid(value: string): boolean {
    try {
      new Cedula(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crea una cédula de ejemplo válida para testing
   */
  static createExample(provincia: number = 17): Cedula {
    // Generar cédula válida para testing
    const provinciaStr = provincia.toString().padStart(2, '0');
    const tercerDigito = Math.floor(Math.random() * 6); // 0-5 para persona natural
    const siguientes6 = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    // Calcular dígito verificador
    const primeros9 = provinciaStr + tercerDigito + siguientes6;
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let digito = parseInt(primeros9.charAt(i), 10);
      if (i % 2 === 0) {
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }
      suma += digito;
    }
    
    const digitoVerificador = (10 - (suma % 10)) % 10;
    const cedulaCompleta = primeros9 + digitoVerificador;
    
    return new Cedula(cedulaCompleta);
  }
}

export default Cedula;