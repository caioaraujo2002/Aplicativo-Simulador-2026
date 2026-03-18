import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDisplayUTC } from '../utils/shiftCalculator';

interface WeekSelectorProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
}

export function WeekSelector({ currentDate, onChangeDate }: WeekSelectorProps) {
  const handlePrevWeek = () => onChangeDate(new Date(currentDate.getTime() - 7 * 86400000));
  const handleNextWeek = () => onChangeDate(new Date(currentDate.getTime() + 7 * 86400000));

  const baseDate = new Date(Date.UTC(2025, 11, 28, 12, 0, 0)); // 28/12/2025 12:00 UTC

  // Gerar as 52 semanas do ano
  const weeks = Array.from({ length: 52 }).map((_, i) => {
    const weekNum = i + 1;
    const start = new Date(baseDate.getTime() + i * 7 * 86400000);
    const end = new Date(start.getTime() + 6 * 86400000);
    
    return {
      weekNum,
      label: `Semana ${weekNum} (${formatDisplayUTC(start)} a ${formatDisplayUTC(end)})`,
      date: start,
      end: end
    };
  });

  // Encontrar a semana atual baseada no currentDate
  const diffTime = currentDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / 86400000);
  let currentWeekNumber = Math.floor(diffDays / 7) + 1;
  
  if (currentWeekNumber < 1) currentWeekNumber = 1;
  if (currentWeekNumber > 52) currentWeekNumber = 52;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWeekNum = parseInt(e.target.value, 10);
    const selectedWeek = weeks.find(w => w.weekNum === selectedWeekNum);
    if (selectedWeek) {
      onChangeDate(selectedWeek.date);
    }
  };

  return (
    <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-1">
      <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      
      <select
        value={currentWeekNumber}
        onChange={handleSelectChange}
        className="px-2 py-1 font-medium text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer text-center appearance-none min-w-[220px] outline-none"
        style={{ textAlignLast: 'center' }}
      >
        {weeks.map(w => (
          <option key={w.weekNum} value={w.weekNum}>
            {w.label}
          </option>
        ))}
      </select>

      <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
}
