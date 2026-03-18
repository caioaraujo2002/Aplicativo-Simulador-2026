import { Colaborador } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ============================================================================
// Substitua pelos seus dados reais
export const SPREADSHEET_ID = '1t6mOklY72grVr_5nZb6yHNKqXyCYwXozecMypSLe7NA';
export const API_KEY = 'AIzaSyBlyp0zVY9lRlrqYtW7OzUNee3WguBbex8';

// Lista de abas (equipes) que serão lidas
export const SHEET_NAMES = [
  'Refrigeração (Denylson)', 
  'Mecânica (Aloizio)', 
  'Pontes Rolantes (Mecânica)', 
  'Pontes Rolantes (Elétrica)', 
  'Transformadores (Djalma)', 
  'Mecânica (Claudio)', 
  'Vulcanização (Marcio)', 
  'Usinagem (Marcio)', 
  'Hidraulica (Marcio)', 
  'Elétrica (Roseira)', 
  'Elétrica (Renato)', 
  'Ovelu', 
  'Montagem de Fornos (Edinei Sales)', 
  'Mecânica (Sidney)', 
  'Equipe Móvel (Mesquita)', 
  'Oficina (Marinaldo)', 
  'Instrumentação (André/Valdir)', 
  'Theman'
];

// Datas de referência para início dos ciclos
const DATAS_REFERENCIA: Record<string, string> = {
  '104-1': '02/06/2025',
  '104-2': '05/06/2025',
  '104-3': '30/05/2025',
  '115-1': '02/06/2025',
  '115-2': '27/05/2025',
  '115-3': '30/05/2025',
  'ADM': '01/01/2020',
  'Terceirizado': '01/01/2020'
};

// ============================================================================
// SERVIÇO
// ============================================================================

interface GoogleSheetResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * Busca os dados de uma aba específica
 */
async function fetchSheetData(sheetName: string): Promise<string[][]> {
  // Busca até a coluna G (índice 6) para garantir que pegamos a Turma
  // Aumentado para 5000 linhas para garantir que pega todos os colaboradores (52 linhas cada)
  const range = `${sheetName}!A2:G5000`; 
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      console.error(`Erro ao buscar aba ${sheetName}:`, error);
      return [];
    }

    const data = (await response.json()) as GoogleSheetResponse;
    return data.values || [];
  } catch (error) {
    console.error(`Erro de rede ao buscar aba ${sheetName}:`, error);
    return [];
  }
}

/**
 * Busca e unifica os colaboradores de todas as abas configuradas
 */
export async function getAllColaboradores(): Promise<Colaborador[]> {
  try {
    // Busca todas as abas em paralelo
    const promises = SHEET_NAMES.map(async (sheetName) => {
      const rows = await fetchSheetData(sheetName);
      
      return rows.map((row) => {
        try {
          // Função auxiliar para limpar e tratar erros do Excel (#VALUE!, #N/A, etc)
          const safeString = (val: any) => {
            const str = String(val || '').trim();
            return str.startsWith('#') ? '' : str;
          };

          const matricula = safeString(row[0]);
          
          // Validação: Ignora linhas sem matrícula, cabeçalhos repetidos ou erros
          if (!matricula || matricula === 'NºMatrícula' || matricula === 'Matricula') return null;

          const nome = safeString(row[1]);
          const funcao = safeString(row[2]) || 'Não informada';
          const escala = safeString(row[3]) || 'ADM';
          const turnoLimpo = safeString(row[5]) || 'ADM';
          const turmaLimpa = safeString(row[6]);
          
          // Determina a data de início do ciclo
          let dataInicioCiclo = '01/01/2020';
          if (turnoLimpo === 'ADM') {
            dataInicioCiclo = DATAS_REFERENCIA['ADM'];
          } else {
            const key = `${turnoLimpo}-${turmaLimpa}`;
            dataInicioCiclo = DATAS_REFERENCIA[key] || '01/01/2020';
          }

          return {
            id: matricula,
            nome: nome,
            funcao: funcao,
            escala: escala,
            turno: turnoLimpo,
            turma: turmaLimpa,
            oficina: sheetName.trim() as any, // Usa o nome da aba como Oficina e remove espaços residuais
            dataInicioCiclo: dataInicioCiclo
          } as Colaborador;
        } catch (err) {
          console.warn('Erro ao processar linha:', row, err);
          return null;
        }
      }).filter((c): c is Colaborador => c !== null);
    });

    const results = await Promise.all(promises);
    
    // Unifica todos os arrays em um único nível (flat)
    const allColaboradores = results.flat();

    // Remove duplicatas baseadas na matrícula (id) - mantém o primeiro registro válido encontrado
    const uniqueColaboradoresMap = new Map<string, Colaborador>();
    
    for (const colab of allColaboradores) {
      // Se a matrícula já existe, só substitui se o novo registro for mais "completo"
      // (ex: tem nome e o anterior não tinha)
      if (!uniqueColaboradoresMap.has(colab.id)) {
        uniqueColaboradoresMap.set(colab.id, colab);
      } else {
        const existing = uniqueColaboradoresMap.get(colab.id)!;
        if (!existing.nome && colab.nome) {
          uniqueColaboradoresMap.set(colab.id, colab);
        }
      }
    }
    
    return Array.from(uniqueColaboradoresMap.values());

  } catch (error) {
    console.warn('Não foi possível buscar colaboradores do Google Sheets:', error);
    return [];
  }
}
