import React from 'react';
import { Colaborador } from '../types';
import { ColaboradorFormModal } from './ColaboradorFormModal';
import { Pencil, Trash2, Plus, Filter } from 'lucide-react';
import { useColaboradores } from '../contexts/ColaboradoresContext';

export function Colaboradores() {
  const { colaboradores, loading, addColaborador, updateColaborador, deleteColaborador } = useColaboradores();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingColaborador, setEditingColaborador] = React.useState<Colaborador | undefined>(undefined);
  const [selectedTeam, setSelectedTeam] = React.useState<string>('Todas as Equipes');

  // Extract unique teams (oficinas)
  const teams = React.useMemo(() => {
    return ['Todas as Equipes', ...new Set(colaboradores.map(c => c.oficina))];
  }, [colaboradores]);

  const filteredColaboradores = React.useMemo(() => {
    return colaboradores.filter(colab => {
      const selected = String(selectedTeam).trim();
      const oficina = String(colab.oficina).trim();
      return selected === 'Todas as Equipes' || oficina === selected;
    });
  }, [colaboradores, selectedTeam]);

  const handleAdd = () => {
    setEditingColaborador(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este colaborador?')) {
      try {
        await deleteColaborador(id);
      } catch (error) {
        console.error('Failed to delete colaborador', error);
        alert('Erro ao excluir colaborador');
      }
    }
  };

  const handleSave = async (data: Colaborador) => {
    try {
      if (editingColaborador) {
        await updateColaborador(data);
      } else {
        await addColaborador(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save colaborador', error);
      alert('Erro ao salvar colaborador');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
        
        <div className="flex flex-wrap items-center gap-4">
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

          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Adicionar Colaborador
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Função</th>
                  <th className="px-6 py-3">Escala</th>
                  <th className="px-6 py-3">Turno/Turma</th>
                  <th className="px-6 py-3">Oficina</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredColaboradores.map((colab) => (
                  <tr key={colab.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{colab.nome}</td>
                    <td className="px-6 py-4 text-slate-600">{colab.funcao}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {colab.escala}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{colab.turno} - {colab.turma}</td>
                    <td className="px-6 py-4 text-slate-600">{colab.oficina}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(colab)}
                          className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(colab.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredColaboradores.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum colaborador encontrado para a equipe selecionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ColaboradorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingColaborador}
        oficinasDisponiveis={teams.filter(t => t !== 'Todas as Equipes')}
      />
    </div>
  );
}
