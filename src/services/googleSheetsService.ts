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

export const EXPLICIT_OFICINAS = ['teman', 'theman', 'ovelu', 'modulação', 'modulacao'];

/**
 * Busca os nomes das abas (oficinas) da planilha dinamicamente
 */
export async function fetchSheetNames(): Promise<string[]> {
  const timestamp = new Date().getTime();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}&t=${timestamp}`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    if (!data.sheets || !Array.isArray(data.sheets)) {
      return SHEET_NAMES;
    }
    
    const allSheetNames = data.sheets.map((s: any) => s.properties.title);
    
    // Filtra abas que tenham parênteses no nome ou estão na lista de exceção
    const validSheetNames = allSheetNames.filter((name: string) => {
      const lowerName = name.toLowerCase().trim();
      const hasParentheses = name.includes('(') && name.includes(')');
      const isExplicitlyAllowed = EXPLICIT_OFICINAS.some(oficina => lowerName.includes(oficina));
      return hasParentheses || isExplicitlyAllowed;
    });
    
    return validSheetNames.length > 0 ? validSheetNames : SHEET_NAMES;
  } catch (error) {
    throw error;
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
 * Busca e unifica os colaboradores de todas as abas configuradas usando batchGet para economizar cota
 */
export async function getAllColaboradores(): Promise<Colaborador[]> {
  try {
    // Busca os nomes das abas dinamicamente
    const sheetNames = await fetchSheetNames();

    if (sheetNames.length === 0) return [];

    const CHUNK_SIZE = 4;
    const allValueRanges: any[] = [];

    // Divide as abas em blocos menores para não estourar o limite de URL no iframe
    for (let i = 0; i < sheetNames.length; i += CHUNK_SIZE) {
      const chunk = sheetNames.slice(i, i + CHUNK_SIZE);
      
      // Encodificação obrigatória para cada nome de aba no parâmetro ranges
      const rangesQuery = chunk
        .map(name => `ranges=${encodeURIComponent(name)}`)
        .join('&');

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?key=${API_KEY}&${rangesQuery}`;

      try {
        const response = await fetch(url, { 
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro no bloco ${Math.floor(i / CHUNK_SIZE) + 1}:`, errorText);
          continue; 
        }
        const data = await response.json();
        if (data.valueRanges) {
          allValueRanges.push(...data.valueRanges);
        }
      } catch (error) {
        console.error(`Falha de rede ao buscar bloco de abas:`, error);
      }
    }

    const colabMapTotal = new Map<string, Colaborador>();

    allValueRanges.forEach((valueRange: any) => {
      const rows = valueRange.values || [];
      const rangeName = valueRange.range || '';
      let sheetName = rangeName.split('!')[0] || '';
      if (sheetName.startsWith("'") && sheetName.endsWith("'")) {
        sheetName = sheetName.substring(1, sheetName.length - 1);
      }
      
      const colabMap = new Map<string, Colaborador>();

      rows.forEach((row: any[]) => {
        try {
          // Função auxiliar para limpar e tratar erros do Excel (#VALUE!, #N/A, etc)
          const safeString = (val: any) => {
            const str = String(val || '').trim();
            return str.startsWith('#') ? '' : str;
          };

          const matricula = safeString(row[0]);
          
          // Validação: Ignora linhas sem matrícula ou que são claramente cabeçalhos
          if (!matricula || 
              matricula.toLowerCase() === 'nºmatrícula' || 
              matricula.toLowerCase() === 'matricula' || 
              matricula.toLowerCase() === 'matrícula') {
            return;
          }

          const nome = safeString(row[1]) || 'Sem Nome';
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
          
          if (colab.nome === 'Sem Nome' && nome !== 'Sem Nome') {
            colab.nome = nome;
          }

          if (semana && colab.escalasAnuais) {
            colab.escalasAnuais[semana] = dias;
          }
        } catch (err) {
          console.warn('Erro ao processar linha:', row, err);
        }
      });

      // Transfere pro mapa total
      for (const colab of colabMap.values()) {
        if (!colabMapTotal.has(colab.id)) {
          colabMapTotal.set(colab.id, colab);
        } else {
          const existing = colabMapTotal.get(colab.id)!;
          if (existing.nome === 'Sem Nome' && colab.nome !== 'Sem Nome') {
            colabMapTotal.set(colab.id, colab);
          }
        }
      }
    });

    return Array.from(colabMapTotal.values());

  } catch (error) {
    throw error;
  }
}
