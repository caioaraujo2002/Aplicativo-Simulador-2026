import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/mockApi';
import { Colaborador, CicloTurno, LancamentoDiario, CodigoDia } from '../types';
import { calcularHHDisponivel } from '../utils/calculations';
import { useColaboradores } from '../contexts/ColaboradoresContext';
import { saveDataToSheet } from '../services/sheetsApi';
import { getStartOfWeekUTC, calcularValorDia, formatDateUTC, formatDisplayDayOfWeekUTC, formatDisplayDayUTC } from '../utils/shiftCalculator';

import { WeekSelector } from './WeekSelector';

const OPCOES_LEGENDA = [
  { label: '6,5', value: '6,5' },
  { label: '8,5', value: '8,5' },
  { label: '5', value: '5' },
  { label: '4', value: '4' },
  { label: '0', value: '0' },
  { label: 'F', value: 'F' },
  { label: 'T', value: 'T' },
  { label: 'L', value: 'L' }
];

export function SimuladorGrid() {
  const { colaboradores, loading } = useColaboradores();
  
  // Inicializa com a data atual em UTC (meio-dia)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return getStartOfWeekUTC(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)));
  });
  
  const [ciclos, setCiclos] = useState<CicloTurno[]>([]);
  const [lancamentos, setLancamentos] = useState<Record<string, LancamentoDiario>>({});
  const [saving, setSaving] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('Todas as Equipes');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const weekDays = Array.from({ length: 7 }).map((_, i) => new Date(currentDate.getTime() + i * 86400000));

  // Extract unique teams (oficinas)
  const teams = React.useMemo(() => {
    return ['Todas as Equipes', ...new Set(colaboradores.map(c => c.oficina))];
  }, [colaboradores]);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // Reset save status after 3 seconds
  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'error') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const fetchData = async () => {
    try {
      const [cics, lancs] = await Promise.all([
        api.getCiclos(),
        api.getLancamentos(formatDateUTC(weekDays[0]), formatDateUTC(weekDays[6]))
      ]);
      
      setCiclos(cics);
      
      const lancamentosMap: Record<string, LancamentoDiario> = {};
      lancs.forEach(l => {
        lancamentosMap[`${l.matricula}_${l.data}`] = l;
      });
      setLancamentos(lancamentosMap);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  };

  const getValorExibicao = (colab: Colaborador, dataStr: string, dateObjUTC: Date) => {
    const key = `${colab.id}_${dataStr}`;
    const lancamento = lancamentos[key];
    
    if (lancamento) {
      return lancamento.codigo;
    }
    
    // Se não tem lançamento manual, projeta
    return calcularValorDia(colab.escala, colab.turno, colab.turma, dateObjUTC);
  };

  const handleCellChange = async (colab: Colaborador, data: string, value: string) => {
    const cleanValue = value.trim();
    let newCodigo: CodigoDia;
    
    if (cleanValue.toUpperCase() === 'F') newCodigo = 'F';
    else if (cleanValue.toUpperCase() === 'T') newCodigo = 'T';
    else if (cleanValue.toUpperCase() === 'L') newCodigo = 'L';
    else {
      const num = parseFloat(cleanValue.replace(',', '.'));
      newCodigo = isNaN(num) ? 0 : num;
    }

    const key = `${colab.id}_${data}`;
    const hh = calcularHHDisponivel(newCodigo);

    // Atualiza estado local imediatamente
    setLancamentos(prev => ({
      ...prev,
      [key]: {
        id: prev[key]?.id || Math.random().toString(36).substr(2, 9),
        matricula: colab.id,
        data,
        codigo: newCodigo,
        hhApropriado: hh
      }
    }));

    // Calcula a semana e o dia da semana para o backend
    const [year, month, day] = data.split('-').map(Number);
    const dateObjUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    // Lógica da Data Âncora (28/12/2025 12:00 UTC)
    const baseDate = new Date(Date.UTC(2025, 11, 28, 12, 0, 0));
    const diffTime = dateObjUTC.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / 86400000);
    const semana = Math.floor(diffDays / 7) + 1;
    
    // Mapeamento do dia da semana (0 = domingo, 6 = sábado)
    const diasMap: Record<number, string> = {
      0: 'domingo',
      1: 'segunda',
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado'
    };
    const diaStr = diasMap[dateObjUTC.getUTCDay()];

    // Dispara salvamento no Google Sheets
    setSaveStatus('saving');
    try {
      await saveDataToSheet({
        action: 'UPDATE_CELL',
        oficina: colab.oficina,
        matricula: colab.id,
        semana: semana,
        dia: diaStr,
        valor: cleanValue
      });
      setSaveStatus('success');
    } catch (error) {
      console.error('Erro ao salvar no Google Sheets:', error);
      setSaveStatus('error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.values(lancamentos).map((l: LancamentoDiario) => api.saveLancamento(l));
      await Promise.all(promises);
      alert('Lançamentos salvos com sucesso!');
    } catch (error) {
      console.error('Error saving', error);
      alert('Erro ao salvar lançamentos.');
    } finally {
      setSaving(false);
    }
  };

  const calcularTotalSemana = (colab: Colaborador) => {
    return weekDays.reduce((total, date) => {
      const dataStr = formatDateUTC(date);
      const codigo = getValorExibicao(colab, dataStr, date);
      return total + calcularHHDisponivel(codigo);
    }, 0);
  };

  const filteredColaboradores = React.useMemo(() => {
    return colaboradores.filter(colab => {
      const selected = String(selectedTeam).trim();
      const oficina = String(colab.oficina).trim();
      return selected === 'Todas as Equipes' || oficina === selected;
    });
  }, [colaboradores, selectedTeam]);

  const getCellColor = (value: string | number) => {
    const strVal = String(value).replace('.', ',').toUpperCase();
    
    if (strVal === 'F') return 'bg-red-500 text-white font-bold';
    if (strVal === 'T') return 'bg-blue-500 text-white font-bold';
    if (strVal === 'L') return 'bg-yellow-400 text-yellow-900 font-bold';
    
    // Check for hours
    if (['6,5', '8,5', '5', '4'].includes(strVal)) return 'bg-green-500 text-white font-bold';
    
    // Default/Zero
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Simulador de Horas</h1>
          <p className="text-slate-500">Gerencie a escala e apropriação de HH da equipe</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Status de Salvamento */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-3 py-1.5 rounded-full">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvo</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
              <AlertCircle className="w-4 h-4" />
              <span>Erro ao salvar</span>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer min-w-[180px]"
            >
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <WeekSelector currentDate={currentDate} onChangeDate={setCurrentDate} />
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Tudo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">Colaborador</th>
                <th className="px-4 py-3 w-24">Escala</th>
                <th className="px-4 py-3 w-24">Turno</th>
                {weekDays.map(date => (
                  <th key={date.toISOString()} className="px-2 py-3 w-20 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">
                        {formatDisplayDayOfWeekUTC(date)}
                      </span>
                      <span className="text-slate-700">
                        {formatDisplayDayUTC(date)}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 w-24 text-center bg-slate-100">Total HH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredColaboradores.map(colab => (
                <tr key={colab.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{colab.nome}</div>
                    <div className="text-xs text-slate-500">{colab.funcao} • {colab.oficina}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {colab.escala}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{colab.turno}-{colab.turma}</td>
                  
                  {weekDays.map(date => {
                    const dataStr = formatDateUTC(date);
                    const valor = getValorExibicao(colab, dataStr, date);
                    const isFolga = valor === 'F';
                    const isExcecao = valor === 'T' || valor === 'L';
                    
                    // Normalize value for select
                    const selectValue = typeof valor === 'number' ? String(valor).replace('.', ',') : valor;
                    const cellColorClass = getCellColor(selectValue);
                    
                    return (
                      <td key={dataStr} className="px-2 py-2">
                        <select
                          value={selectValue}
                          onChange={(e) => handleCellChange(colab, dataStr, e.target.value)}
                          className={`
                            w-full h-full text-center py-1.5 rounded border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm appearance-none cursor-pointer
                            ${cellColorClass}
                          `}
                        >
                          {OPCOES_LEGENDA.map(op => (
                            <option key={op.label} value={op.value} className="bg-white text-slate-900">
                              {op.label}
                            </option>
                          ))}
                          {/* Fallback option if current value is not in legend */}
                          {!OPCOES_LEGENDA.some(op => op.value === selectValue) && (
                            <option value={selectValue} className="bg-white text-slate-900">{selectValue}</option>
                          )}
                        </select>
                      </td>
                    );
                  })}
                  
                  <td className="px-4 py-3 text-center font-bold text-slate-900 bg-slate-50">
                    {calcularTotalSemana(colab).toFixed(1)}h
                  </td>
                </tr>
              ))}
              {filteredColaboradores.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    Nenhum colaborador encontrado para a equipe selecionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-4 text-sm text-blue-800">
        <div><strong>Legenda:</strong></div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-200 border border-rose-300"></span> F = Folga/Férias/Falta</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></span> T = Treinamento</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></span> L = Licença</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span> Números = Horas Trabalhadas</span>
        </div>
      </div>
    </div>
  );
}
