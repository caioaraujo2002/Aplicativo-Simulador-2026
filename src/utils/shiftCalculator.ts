export function formatDisplayUTC(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}

export function formatDisplayDayOfWeekUTC(date: Date): string {
  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  return days[date.getUTCDay()];
}

export function formatDisplayDayUTC(date: Date): string {
  return String(date.getUTCDate()).padStart(2, '0');
}

export function formatDisplayMonthUTC(date: Date): string {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = months[date.getUTCMonth()];
  return `${d} de ${m}`;
}

export function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStartOfWeekUTC(date: Date): Date {
  const baseDate = new Date(Date.UTC(2025, 11, 28, 12, 0, 0)); // 28/12/2025 12:00 UTC
  const diffTime = date.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  const weeks = Math.floor(diffDays / 7);
  return new Date(baseDate.getTime() + weeks * 7 * 86400000);
}

export function calcularValorDia(escala: string, turno: string, turma: string, dataDoDiaUTC: Date): string | number {
  const escalaLimpa = String(escala || '').trim().toUpperCase();
  const turnoLimpo = String(turno || '').trim().toUpperCase();
  const turmaLimpa = String(turma || '').trim().toUpperCase();

  // Se for ADM
  if (escalaLimpa === 'ADM' || turnoLimpo === 'ADM') {
    const day = dataDoDiaUTC.getUTCDay();
    if (day === 0 || day === 6) {
      return 'F';
    }
    return '6,5';
  }

  // Dicionário de datas de início de ciclo (sempre ao meio-dia UTC)
  const DATAS_INICIO_CICLO: Record<string, number> = {
    '104-1': Date.UTC(2025, 5, 2, 12, 0, 0),  // 02/06/2025
    '104-2': Date.UTC(2025, 5, 5, 12, 0, 0),  // 05/06/2025
    '104-3': Date.UTC(2025, 4, 30, 12, 0, 0), // 30/05/2025
    '115-1': Date.UTC(2025, 5, 2, 12, 0, 0),  // 02/06/2025
    '115-2': Date.UTC(2025, 4, 27, 12, 0, 0), // 27/05/2025
    '115-3': Date.UTC(2025, 4, 30, 12, 0, 0), // 30/05/2025
  };

  const key = `${turnoLimpo}-${turmaLimpa}`;
  const inicioCicloTime = DATAS_INICIO_CICLO[key];

  // Se não encontrar a data de início do ciclo, retorna um valor padrão (ex: ADM)
  if (!inicioCicloTime) {
    const day = dataDoDiaUTC.getUTCDay();
    return (day === 0 || day === 6) ? 'F' : '6,5';
  }

  const diffDays = Math.floor((dataDoDiaUTC.getTime() - inicioCicloTime) / 86400000);

  if (escalaLimpa === '6X3' || escalaLimpa === '6X 3' || escalaLimpa === '6 X 3') {
    const mod = ((diffDays % 9) + 9) % 9;
    if (mod < 6) {
      // Dia de trabalho
      if (turnoLimpo.includes('115')) return '5';
      if (turnoLimpo.includes('104')) return '6,5';
      return '6,5'; // Padrão
    } else {
      // Folga
      return 'F';
    }
  }

  if (escalaLimpa === '4X2' || escalaLimpa === '4X 2' || escalaLimpa === '4 X 2') {
    const mod = ((diffDays % 6) + 6) % 6;
    if (mod < 4) {
      // Dia de trabalho
      if (turnoLimpo.includes('115')) return '5';
      if (turnoLimpo.includes('104')) return '6,5';
      return '6,5'; // Padrão
    } else {
      // Folga
      return 'F';
    }
  }

  // Fallback genérico
  const day = dataDoDiaUTC.getUTCDay();
  return (day === 0 || day === 6) ? 'F' : '6,5';
}
