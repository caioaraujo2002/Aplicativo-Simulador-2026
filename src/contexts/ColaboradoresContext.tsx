import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Colaborador } from '../types';
import { api } from '../services/mockApi';
import { getAllColaboradores, fetchSheetNames } from '../services/googleSheetsService';
import { updateColaboradorMasterData, addColaboradorMasterData, deleteColaboradorMasterData, transferColaboradorMasterData } from '../services/sheetsApi';
import { calcularValorDia } from '../utils/shiftCalculator';

interface ColaboradoresContextData {
  colaboradores: Colaborador[];
  oficinas: string[];
  loading: boolean;
  refreshColaboradores: () => Promise<void>;
  addColaborador: (colab: Colaborador) => Promise<void>;
  updateColaborador: (colab: Colaborador) => Promise<void>;
  deleteColaborador: (id: string) => Promise<void>;
}

const ColaboradoresContext = createContext<ColaboradoresContextData>({} as ColaboradoresContextData);

export function ColaboradoresProvider({ children }: { children: ReactNode }) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [oficinas, setOficinas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshColaboradores = async () => {
    setLoading(true);
    try {
      // Fetch sheet names (oficinas)
      const sheetNames = await fetchSheetNames();
      setOficinas(sheetNames);

      // Try to fetch from Google Sheets first
      let colabs: Colaborador[] = [];
      try {
        colabs = await getAllColaboradores();
      } catch (e) {
        console.warn('Failed to fetch from Google Sheets, falling back to mock data', e);
      }

      // If Google Sheets returns empty (e.g. no API key), fallback to mock
      if (colabs.length === 0) {
        colabs = await api.getColaboradores();
      }
      
      setColaboradores(colabs);
    } catch (error) {
      console.error('Failed to fetch colaboradores', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshColaboradores();
  }, []);

  const addColaborador = async (data: Colaborador) => {
    const previousState = [...colaboradores];
    try {
      // Optimistic UI update
      setColaboradores(prev => [...prev, data]);

      // Calcular as 52 semanas do ano para o novo turno/turma
      const escalasAnuais: Record<string, string[]> = {};
      const baseDate = new Date(Date.UTC(2025, 11, 28, 12, 0, 0)); // 28/12/2025 12:00 UTC
      
      for (let semana = 1; semana <= 52; semana++) {
        const semanaArr: string[] = [];
        const startOfWeek = new Date(baseDate.getTime() + (semana - 1) * 7 * 86400000);
        
        for (let dia = 0; dia < 7; dia++) {
          const currentDate = new Date(startOfWeek.getTime() + dia * 86400000);
          const valor = calcularValorDia(data.escala, data.turno, data.turma, currentDate);
          semanaArr.push(String(valor));
        }
        
        escalasAnuais[String(semana)] = semanaArr;
      }

      // Adiciona no Google Sheets via Web App
      await addColaboradorMasterData({
        action: 'ADD_COLABORADOR',
        oficina: data.oficina,
        matricula: data.id,
        nome: data.nome,
        funcao: data.funcao,
        escala: data.escala,
        turno: data.turno,
        turma: data.turma,
        escalasAnuais
      });

      await api.addColaborador(data);
      
      // Force re-sync with Google Sheets to ensure data consistency
      await refreshColaboradores();
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      setColaboradores(previousState); // Revert on error
      throw error;
    }
  };

  const updateColaborador = async (data: Colaborador) => {
    const previousState = [...colaboradores];
    try {
      const originalColab = colaboradores.find(c => c.id === data.id);
      const oficinaOriginal = originalColab?.oficina;

      // Optimistic UI update
      setColaboradores(prev => prev.map(c => c.id === data.id ? data : c));

      // Calcular as 52 semanas do ano para o novo turno/turma
      const escalasAnuais: Record<string, string[]> = {};
      const baseDate = new Date(Date.UTC(2025, 11, 28, 12, 0, 0)); // 28/12/2025 12:00 UTC
      
      for (let semana = 1; semana <= 52; semana++) {
        const semanaArr: string[] = [];
        const startOfWeek = new Date(baseDate.getTime() + (semana - 1) * 7 * 86400000);
        
        for (let dia = 0; dia < 7; dia++) {
          const currentDate = new Date(startOfWeek.getTime() + dia * 86400000);
          const valor = calcularValorDia(data.escala, data.turno, data.turma, currentDate);
          semanaArr.push(String(valor));
        }
        
        escalasAnuais[String(semana)] = semanaArr;
      }

      if (oficinaOriginal && oficinaOriginal !== data.oficina) {
        // Transferência de Oficina
        await transferColaboradorMasterData({
          action: 'TRANSFER_COLABORADOR',
          oficinaOriginal: oficinaOriginal,
          oficinaNova: data.oficina,
          matricula: data.id,
          nome: data.nome,
          funcao: data.funcao,
          escala: data.escala,
          turno: data.turno,
          turma: data.turma,
          escalasAnuais
        });
      } else {
        // Atualiza no Google Sheets via Web App (mesma oficina)
        await updateColaboradorMasterData({
          action: 'UPDATE_COLABORADOR',
          oficina: data.oficina,
          matricula: data.id,
          turno: data.turno,
          turma: data.turma,
          escalasAnuais
        });
      }

      await api.updateColaborador(data);
      
      // Force re-sync with Google Sheets to ensure data consistency
      await refreshColaboradores();
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      setColaboradores(previousState); // Revert on error
      throw error;
    }
  };

  const deleteColaborador = async (id: string) => {
    const previousState = [...colaboradores];
    try {
      const colabToDelete = colaboradores.find(c => c.id === id);
      
      // Optimistic UI update
      setColaboradores(prev => prev.filter(c => c.id !== id));

      if (colabToDelete) {
        await deleteColaboradorMasterData({
          action: 'DELETE_COLABORADOR',
          oficina: colabToDelete.oficina.trim(),
          matricula: id.trim()
        });
      }
      
      await api.deleteColaborador(id);
      
      // Force re-sync with Google Sheets to ensure data consistency
      await refreshColaboradores();
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
      setColaboradores(previousState); // Revert on error
      throw error;
    }
  };

  return (
    <ColaboradoresContext.Provider value={{ 
      colaboradores, 
      oficinas,
      loading, 
      refreshColaboradores,
      addColaborador,
      updateColaborador,
      deleteColaborador
    }}>
      {children}
    </ColaboradoresContext.Provider>
  );
}

export function useColaboradores() {
  const context = useContext(ColaboradoresContext);
  if (!context) {
    throw new Error('useColaboradores must be used within a ColaboradoresProvider');
  }
  return context;
}
