import { Colaborador } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO GOOGLE SHEETS
// ============================================================================
// Substitua pelos seus dados reais
export const SPREADSHEET_ID = '1t6mOklY72grVr_5nZb6yHNKqXyCYwXozecMypSLe7NA';
export const API_KEY = 'AIzaSyBlyp0zVY9lRlrqYtW7OzUNee3WguBbex8';

// Lista de abas (equipes) que serão lidas (fallback)
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

/**
 * Busca os nomes das abas (oficinas) da planilha dinamicamente
 */
export async function fetchSheetNames(): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Erro ao buscar metadados da planilha:', await response.text());
      return SHEET_NAMES; // fallback
    }
    
    const data = await response.json();
    if (!data.sheets || !Array.isArray(data.sheets)) {
      return SHEET_NAMES;
    }
    
    const allSheetNames = data.sheets.map((s: any) => s.properties.title);
    
    // Filtra abas que não são de colaboradores
    const EXCLUDED_KEYWORDS = [
      'dashboard', 'resumo', 'listas', 'configurações', 'dados',
      'calendario', 'calendário', 'ferias', 'férias', 'legenda', 
      'simulador', 'backlog', 'matriculas', 'relações', 'relacoes'
    ];
    
    const validSheetNames = allSheetNames.filter((name: string) => {
      const lowerName = name.toLowerCase().trim();
      return !EXCLUDED_KEYWORDS.some(keyword => lowerName.includes(keyword));
    });
    
    return validSheetNames.length > 0 ? validSheetNames : SHEET_NAMES;
  } catch (error) {
    console.error('Erro de rede ao buscar nomes das abas:', error);
    return SHEET_NAMES;
  }
}

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
  // Busca até a coluna R (índice 17) para garantir que pegamos a Semana e os dias
  // Aumentado para 5000 linhas para garantir que pega todos os colaboradores (52 linhas cada)
  const range = `${sheetName}!A2:R5000`; 
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
    // Busca os nomes das abas dinamicamente
    const sheetNames = await fetchSheetNames();

    // Busca todas as abas em paralelo
    const promises = sheetNames.map(async (sheetName) => {
      const rows = await fetchSheetData(sheetName);
      
      const colabMap = new Map<string, Colaborador>();

      rows.forEach((row) => {
        try {
          // Função auxiliar para limpar e tratar erros do Excel (#VALUE!, #N/A, etc)
          const safeString = (val: any) => {
            const str = String(val || '').trim();
            return str.startsWith('#') ? '' : str;
          };

          const matricula = safeString(row[0]);
          
          // Validação: Ignora linhas sem matrícula, cabeçalhos repetidos ou erros
          if (!matricula || matricula === 'NºMatrícula' || matricula === 'Matricula') return;

          const nome = safeString(row[1]);
          const funcao = safeString(row[2]) || 'Não informada';
          const escala = safeString(row[3]) || 'ADM';
          const turnoLimpo = safeString(row[5]) || 'ADM';
          const turmaLimpa = safeString(row[6]);
          
          const semana = safeString(row[17]); // Coluna R
          const dias = [
            safeString(row[7]), // dom (H)
            safeString(row[8]), // seg (I)
            safeString(row[9]), // ter (J)
            safeString(row[10]), // qua (K)
            safeString(row[11]), // qui (L)
            safeString(row[12]), // sex (M)
            safeString(row[13])  // sab (N)
          ];

          if (!colabMap.has(matricula)) {
            // Determina a data de início do ciclo
            let dataInicioCiclo = '01/01/2020';
            if (turnoLimpo === 'ADM') {
              dataInicioCiclo = DATAS_REFERENCIA['ADM'];
            } else {
              const key = `${turnoLimpo}-${turmaLimpa}`;
              dataInicioCiclo = DATAS_REFERENCIA[key] || '01/01/2020';
            }

            colabMap.set(matricula, {
              id: matricula,
              nome: nome,
              funcao: funcao,
              escala: escala as any,
              turno: turnoLimpo as any,
              turma: turmaLimpa,
              oficina: sheetName.trim(),
              dataInicioCiclo: dataInicioCiclo,
              escalasAnuais: {}
            });
          }

          const colab = colabMap.get(matricula)!;
          if (semana && colab.escalasAnuais) {
            colab.escalasAnuais[semana] = dias;
          }
        } catch (err) {
          console.warn('Erro ao processar linha:', row, err);
        }
      });

      return Array.from(colabMap.values());
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
