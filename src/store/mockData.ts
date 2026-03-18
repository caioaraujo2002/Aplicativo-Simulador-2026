import { Colaborador, CicloTurno, LancamentoDiario, FeriasAfastamento, BacklogOficina } from '../types';

export const mockColaboradores: Colaborador[] = [
  { id: '1001', nome: 'João Silva', funcao: 'Mecânico I', escala: 'ADM', turno: 'ADM', turma: '1', oficina: 'Mecânica' },
  { id: '1002', nome: 'Maria Souza', funcao: 'Eletricista II', escala: '6x3', turno: '104', turma: '1', oficina: 'Elétrica' },
  { id: '1003', nome: 'Pedro Santos', funcao: 'Instrumentista', escala: '4x2', turno: '115', turma: '2', oficina: 'Instrumentação' },
  { id: '1004', nome: 'Ana Costa', funcao: 'Mecânico II', escala: '6x3', turno: '104', turma: '2', oficina: 'Mecânica' },
];

export const mockCiclos: CicloTurno[] = [
  { turno: '104', turma: '1', dataInicio: '2024-01-01' },
  { turno: '104', turma: '2', dataInicio: '2024-01-04' },
  { turno: '115', turma: '1', dataInicio: '2024-01-01' },
  { turno: '115', turma: '2', dataInicio: '2024-01-03' },
];

export const mockLancamentos: LancamentoDiario[] = [];

export const mockFerias: FeriasAfastamento[] = [
  { id: 'f1', matricula: '1001', dataInicio: '2024-05-01', dataFinal: '2024-05-30', tipo: 'Gozo' }
];

export const mockBacklog: BacklogOficina[] = [
  { oficina: 'Mecânica', responsavel: 'Carlos', hhPendente: 1500 },
  { oficina: 'Elétrica', responsavel: 'Roberto', hhPendente: 800 },
  { oficina: 'Instrumentação', responsavel: 'Fernanda', hhPendente: 450 },
];
