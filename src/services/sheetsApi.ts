// ============================================================================
// SERVIÇO DE INTEGRAÇÃO COM GOOGLE APPS SCRIPT (FRONTEND)
// ============================================================================

// URL do Web App (Apps Script) publicado. 
// IMPORTANTE: Substitua pela URL real após publicar o script.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlUTJChiR4bLm3p_GjW43BpzU9o4JSAR3q0Rau45LCD1hPquT_u26zrGmyEuMfDP8efQ/exec';

/**
 * Envia dados para o Google Sheets via Apps Script
 */
export async function addColaboradorMasterData(payload: {
  action: 'ADD_COLABORADOR';
  oficina: string;
  matricula: string;
  nome: string;
  funcao: string;
  escala: string;
  turno: string;
  turma: string;
  escalasAnuais: Record<string, string[]>;
}): Promise<any> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Erro ao adicionar colaborador no Google Sheets:', error);
    throw error;
  }
}

export async function deleteColaboradorMasterData(payload: {
  action: 'DELETE_COLABORADOR';
  oficina: string;
  matricula: string;
}): Promise<any> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Erro ao excluir colaborador no Google Sheets:', error);
    throw error;
  }
}

export async function updateColaboradorMasterData(payload: {
  action: 'UPDATE_COLABORADOR';
  oficina: string;
  matricula: string;
  turno: string;
  turma: string;
  escalasAnuais: Record<string, string[]>;
}): Promise<any> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Erro ao atualizar colaborador no Google Sheets:', error);
    throw error;
  }
}

export async function transferColaboradorMasterData(payload: {
  action: 'TRANSFER_COLABORADOR';
  oficinaOriginal: string;
  oficinaNova: string;
  matricula: string;
  nome: string;
  funcao: string;
  escala: string;
  turno: string;
  turma: string;
  escalasAnuais: Record<string, string[]>;
}): Promise<any> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Erro ao transferir colaborador no Google Sheets:', error);
    throw error;
  }
}

export async function saveDataToSheet(payload: {
  action: 'UPDATE_CELL' | 'UPDATE_ROW';
  oficina: string;
  matricula: string;
  semana: number;
  dia: string;
  valor: string | number;
  data?: any; // Opcional para UPDATE_ROW
}): Promise<any> {
  try {
    console.log('Enviando payload para o Apps Script:', payload);
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição HTTPS: status ${response.status}`);
    }

    const result = await response.json();
    
    // O Apps script retorna { status: 'error', message: '...' } quando não encontra a linha
    if (result.status === 'error') {
      console.error('Payload que gerou o erro:', payload);
      // Extrai a mensagem real do backend (result.message)
      throw new Error(result.message || 'Erro desconhecido no WebApp do Sheets');
    }

    return result;
  } catch (error) {
    console.error('Erro Fatal ao salvar no Google Sheets:', error);
    // Relança o erro com a mensagem real preservada
    throw error;
  }
}
