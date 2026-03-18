import { CodigoDia } from '../types';

export function calcularHHDisponivel(codigo: CodigoDia): number {
  if (codigo === 'F' || codigo === 'T' || codigo === 'L') return 0;
  if (typeof codigo === 'string') {
    const num = parseFloat(codigo.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }
  return Number(codigo) || 0;
}
