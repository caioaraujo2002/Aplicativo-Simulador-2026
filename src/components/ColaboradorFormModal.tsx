import React from 'react';
import { X } from 'lucide-react';
import { Colaborador, Escala, Turno, Oficina } from '../types';

interface ColaboradorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (colaborador: Colaborador) => void;
  initialData?: Colaborador;
  oficinasDisponiveis: string[];
}

export function ColaboradorFormModal({ isOpen, onClose, onSave, initialData, oficinasDisponiveis }: ColaboradorFormModalProps) {
  const [formData, setFormData] = React.useState<Colaborador>({
    id: '',
    nome: '',
    funcao: '',
    escala: '6x3',
    turno: '104',
    turma: '1',
    oficina: oficinasDisponiveis[0] as Oficina || 'Mecânica'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nome: initialData.nome,
        funcao: initialData.funcao,
        escala: initialData.escala,
        turno: initialData.turno,
        turma: initialData.turma,
        oficina: initialData.oficina
      });
    } else {
      setFormData({
        id: '',
        nome: '',
        funcao: '',
        escala: '6x3',
        turno: '104',
        turma: '1',
        oficina: oficinasDisponiveis[0] as Oficina || 'Mecânica'
      });
    }
  }, [initialData, isOpen, oficinasDisponiveis]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? 'Editar Colaborador' : 'Novo Colaborador'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula</label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
            <input
              type="text"
              required
              value={formData.funcao}
              onChange={e => setFormData({...formData, funcao: e.target.value})}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Escala</label>
              <select
                value={formData.escala}
                onChange={e => setFormData({...formData, escala: e.target.value as Escala})}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="6x3">6x3</option>
                <option value="4x2">4x2</option>
                <option value="ADM">ADM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
              <select
                value={formData.turno}
                onChange={e => setFormData({...formData, turno: e.target.value as Turno})}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="104">104</option>
                <option value="115">115</option>
                <option value="21">21</option>
                <option value="ADM">ADM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Turma</label>
              <input
                type="text"
                required
                value={formData.turma}
                onChange={e => setFormData({...formData, turma: e.target.value})}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Oficina</label>
              <select
                value={formData.oficina}
                onChange={e => setFormData({...formData, oficina: e.target.value as Oficina})}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                {oficinasDisponiveis.map(oficina => (
                  <option key={oficina} value={oficina}>{oficina}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
