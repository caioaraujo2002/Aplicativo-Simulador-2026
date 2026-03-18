import { Colaborador, CicloTurno, LancamentoDiario, FeriasAfastamento, BacklogOficina, Oficina } from '../types';

// Mock Data
export const mockColaboradores: Colaborador[] = [
  { id: '1001', nome: 'João Silva', funcao: 'Mecânico I', escala: '6x3', turno: '104', turma: '1', oficina: 'Mecânica' },
  { id: '1002', nome: 'Maria Souza', funcao: 'Eletricista II', escala: '4x2', turno: '115', turma: '2', oficina: 'Elétrica' },
  { id: '1003', nome: 'Carlos Santos', funcao: 'Instrumentista', escala: 'ADM', turno: 'ADM', turma: 'ADM', oficina: 'Instrumentação' },
  { id: '1004', nome: 'Ana Oliveira', funcao: 'Mecânico II', escala: '6x3', turno: '104', turma: '2', oficina: 'Mecânica' },
  { id: '1005', nome: 'Pedro Costa', funcao: 'Eletricista I', escala: '4x2', turno: '115', turma: '1', oficina: 'Elétrica' },
];

export const mockCiclos: CicloTurno[] = [
  { turno: '104', turma: '1', dataInicio: '2023-10-01' },
  { turno: '104', turma: '2', dataInicio: '2023-10-04' },
  { turno: '115', turma: '1', dataInicio: '2023-10-01' },
  { turno: '115', turma: '2', dataInicio: '2023-10-03' },
];

export const mockLancamentos: LancamentoDiario[] = [];

export const mockFerias: FeriasAfastamento[] = [
  { id: 'f1', matricula: '1004', dataInicio: '2023-10-10', dataFinal: '2023-10-20', tipo: 'Gozo' }
];

export const mockBacklog: BacklogOficina[] = [
  { oficina: 'Mecânica', responsavel: 'Roberto', hhPendente: 120 },
  { oficina: 'Elétrica', responsavel: 'Fernanda', hhPendente: 85 },
  { oficina: 'Instrumentação', responsavel: 'Carlos', hhPendente: 40 },
];

// Simulating API calls
export const api = {
  getColaboradores: async (): Promise<Colaborador[]> => {
    // Return a copy to avoid direct mutation issues if we were strictly following immutability, 
    // but for mock in-memory it's fine.
    return [...mockColaboradores];
  },
  
  addColaborador: async (colaborador: Colaborador): Promise<Colaborador> => {
    const newColaborador = {
      ...colaborador
    };
    mockColaboradores.push(newColaborador);
    return newColaborador;
  },

  updateColaborador: async (colaborador: Colaborador): Promise<Colaborador> => {
    const index = mockColaboradores.findIndex(c => c.id === colaborador.id);
    if (index !== -1) {
      mockColaboradores[index] = colaborador;
      return colaborador;
    }
    // Se não encontrar no mock (ex: veio do Google Sheets), adiciona ao mock para não dar erro
    mockColaboradores.push(colaborador);
    return colaborador;
  },

  deleteColaborador: async (id: string): Promise<void> => {
    const index = mockColaboradores.findIndex(c => c.id === id);
    if (index !== -1) {
      mockColaboradores.splice(index, 1);
    }
  },

  getCiclos: async (): Promise<CicloTurno[]> => {
    return [...mockCiclos];
  },
  getLancamentos: async (dataInicio: string, dataFim: string): Promise<LancamentoDiario[]> => {
    return mockLancamentos.filter(l => l.data >= dataInicio && l.data <= dataFim);
  },
  saveLancamento: async (lancamento: LancamentoDiario): Promise<void> => {
    const index = mockLancamentos.findIndex(l => l.matricula === lancamento.matricula && l.data === lancamento.data);
    if (index >= 0) {
      mockLancamentos[index] = lancamento;
    } else {
      mockLancamentos.push(lancamento);
    }
  },
  getBacklog: async (): Promise<BacklogOficina[]> => {
    return [...mockBacklog];
  }
};
