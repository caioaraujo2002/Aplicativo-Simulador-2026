import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/mockApi';
import { BacklogOficina, Colaborador, CicloTurno, LancamentoDiario, CodigoDia } from '../types';
import { useColaboradores } from '../contexts/ColaboradoresContext';
import { calcularHHDisponivel } from '../utils/calculations';
import { getStartOfWeekUTC, calcularValorDia, formatDateUTC } from '../utils/shiftCalculator';

import { WeekSelector } from './WeekSelector';

export function Dashboard() {
  const { colaboradores } = useColaboradores();
  const [backlog, setBacklog] = React.useState<BacklogOficina[]>([]);
  
  // Inicializa com a data atual em UTC (meio-dia)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return getStartOfWeekUTC(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)));
  });
  
  const [ciclos, setCiclos] = useState<CicloTurno[]>([]);
  const [lancamentos, setLancamentos] = useState<Record<string, LancamentoDiario>>({});
  const [hhPorOficina, setHhPorOficina] = useState<{ oficina: string; hh: number }[]>([]);
  const [totalHH, setTotalHH] = useState(0);

  const weekDays = Array.from({ length: 7 }).map((_, i) => new Date(currentDate.getTime() + i * 86400000));

  React.useEffect(() => {
    api.getBacklog().then(setBacklog);
    api.getCiclos().then(setCiclos);
    api.getLancamentos(formatDateUTC(weekDays[0]), formatDateUTC(weekDays[6])).then(lancs => {
      const map: Record<string, LancamentoDiario> = {};
      lancs.forEach(l => map[`${l.matricula}_${l.data}`] = l);
      setLancamentos(map);
    });
  }, [currentDate]);

  useEffect(() => {
    if (colaboradores.length === 0) return;

    const hhMap = new Map<string, number>();
    let total = 0;

    colaboradores.forEach(colab => {
      let colabTotal = 0;
      weekDays.forEach(date => {
        const dataStr = formatDateUTC(date);
        const key = `${colab.id}_${dataStr}`;
        const lancamento = lancamentos[key];
        
        let codigo: CodigoDia;
        if (lancamento) {
          codigo = lancamento.codigo;
        } else {
          const baseDate = new Date(Date.UTC(2025, 11, 28, 12, 0, 0));
          const diffTime = date.getTime() - baseDate.getTime();
          const diffDays = Math.floor(diffTime / 86400000);
          const semana = Math.floor(diffDays / 7) + 1;
          const diaDaSemana = date.getUTCDay();

          if (colab.escalasAnuais && colab.escalasAnuais[String(semana)]) {
            const valorPlanilha = colab.escalasAnuais[String(semana)][diaDaSemana];
            if (valorPlanilha !== undefined && valorPlanilha !== '') {
              codigo = valorPlanilha;
            } else {
              codigo = calcularValorDia(colab.escala, colab.turno, colab.turma, date);
            }
          } else {
            codigo = calcularValorDia(colab.escala, colab.turno, colab.turma, date);
          }
        }
        
        // Calcular HH disponível
        let hh = calcularHHDisponivel(codigo);
        
        colabTotal += hh;
      });

      const currentOficinaTotal = hhMap.get(colab.oficina) || 0;
      hhMap.set(colab.oficina, currentOficinaTotal + colabTotal);
      total += colabTotal;
    });

    const chartData = Array.from(hhMap.entries()).map(([oficina, hh]) => ({
      oficina,
      hh: Math.round(hh * 10) / 10 // Arredondar para 1 casa decimal
    }));

    setHhPorOficina(chartData);
    setTotalHH(Math.round(total * 10) / 10);

  }, [colaboradores, lancamentos, ciclos, currentDate]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Gerencial</h1>
        
        <WeekSelector currentDate={currentDate} onChangeDate={setCurrentDate} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Resumo Geral */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-3">
           <h3 className="text-lg font-medium text-slate-700 mb-4">Resumo da Semana</h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
               <div className="text-emerald-600 text-sm font-medium mb-1">Total HH Disponível</div>
               <div className="text-3xl font-bold text-emerald-700">{totalHH}h</div>
             </div>
             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
               <div className="text-blue-600 text-sm font-medium mb-1">Total HH Pendente (Backlog)</div>
               <div className="text-3xl font-bold text-blue-700">
                 {backlog.reduce((acc, curr) => acc + curr.hhPendente, 0)}h
               </div>
             </div>
             <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
               <div className="text-purple-600 text-sm font-medium mb-1">Oficinas Ativas</div>
               <div className="text-3xl font-bold text-purple-700">{hhPorOficina.length}</div>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-medium text-slate-700 mb-4">HH Disponível por Oficina (Semana)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hhPorOficina} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="oficina" type="category" width={150} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => [`${value}h`, 'HH Disponível']} />
                <Legend />
                <Bar dataKey="hh" fill="#10b981" name="HH Disponível" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-700 mb-4">Distribuição de Backlog</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={backlog}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hhPendente"
                >
                  {backlog.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value}h`, props.payload.oficina]} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
