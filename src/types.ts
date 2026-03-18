export type Escala = 'ADM' | '6x3' | '4x2';
export type Turno = '104' | '115' | '21' | 'ADM';
export type Oficina = string;

export interface Colaborador {
  id: string; // Matrícula
  nome: string;
  funcao: string;
  escala: Escala;
  turno: Turno;
  turma: string;
  oficina: Oficina;
  dataInicioCiclo?: string;
  escalasAnuais?: Record<string, string[]>;
}

export interface CicloTurno {
  turno: Turno;
  turma: string;
  dataInicio: string; // YYYY-MM-DD
}

export type CodigoDia = number | string;

export interface LancamentoDiario {
  id: string; // unique id
  matricula: string;
  data: string; // YYYY-MM-DD
  codigo: CodigoDia;
  hhApropriado: number;
}

export interface FeriasAfastamento {
  id: string;
  matricula: string;
  dataInicio: string;
  dataFinal: string;
  tipo: 'Gozo' | 'Abono';
}

export interface BacklogOficina {
  oficina: Oficina;
  responsavel: string;
  hhPendente: number;
}
