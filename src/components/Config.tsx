import React from 'react';

export function Config() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Conexão com Google Sheets</h3>
        <p className="text-slate-600 mb-4">
          Configure aqui a URL da sua planilha e as credenciais de acesso.
        </p>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ID da Planilha</label>
            <input 
              type="text" 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key (Google Cloud)</label>
            <input 
              type="password" 
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="••••••••••••••••"
              disabled
            />
          </div>
          
          <button className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
