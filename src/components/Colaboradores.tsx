import React, { useState } from 'react';
import { Colaborador } from '../types';
import { ColaboradorFormModal } from './ColaboradorFormModal';
import { Pencil, Trash2, Plus, Filter, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useColaboradores } from '../contexts/ColaboradoresContext';

export function Colaboradores() {
  const { colaboradores, oficinas, loading, addColaborador, updateColaborador, deleteColaborador } = useColaboradores();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | undefined>(undefined);
  const [selectedTeam, setSelectedTeam] = useState<string>('Todas as Equipes');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [colaboradorToDelete, setColaboradorToDelete] = useState<Colaborador | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extract unique teams (oficinas) from context
  const teams = React.useMemo(() => {
    return ['Todas as Equipes', ...oficinas];
  }, [oficinas]);

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

  const confirmDelete = (colab: Colaborador) => {
    setColaboradorToDelete(colab);
  };

  const handleDelete = async () => {
    if (!colaboradorToDelete) return;
    
    const id = colaboradorToDelete.id;
    setDeletingId(id);
    setColaboradorToDelete(null); // Close modal immediately
    
    try {
      await deleteColaborador(id);
      showToast('Colaborador excluído com sucesso!');
    } catch (error) {
      console.error('Failed to delete colaborador', error);
      // Custom alert could be used here, but for now we just log
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (data: Colaborador) => {
    try {
      if (editingColaborador) {
        await updateColaborador(data);
        showToast('Colaborador atualizado com sucesso!');
      } else {
        await addColaborador(data);
        showToast('Colaborador adicionado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save colaborador', error);
      alert('Erro ao salvar colaborador');
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

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
                          onClick={() => confirmDelete(colab)}
                          disabled={deletingId === colab.id}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          {deletingId === colab.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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

      {/* Delete Confirmation Modal */}
      {colaboradorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Excluir Colaborador</h3>
                <p className="text-sm text-slate-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <p className="text-slate-700 mb-6">
              Tem certeza que deseja excluir o colaborador <span className="font-bold">{colaboradorToDelete.nome}</span>?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setColaboradorToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
