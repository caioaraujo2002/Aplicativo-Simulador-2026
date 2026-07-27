// ============================================================================
// GOOGLE APPS SCRIPT - BACKEND (Code.gs)
// ============================================================================
// Este código deve ser copiado e colado no editor de script da sua planilha Google.
// Em seguida, publique como Web App (Executar como: Eu, Acesso: Qualquer pessoa).

function doPost(e) {
  try {
    // Parse do corpo da requisição
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var sheetName = payload.oficina; // Nome da aba
    var matricula = payload.matricula; // ID do colaborador
    var semana = payload.semana; // Número da semana (1 a 52)
    var dia = payload.dia; // 'domingo', 'segunda', etc.
    var valor = payload.valor; // Novo valor a ser inserido
    
    // Mapeamento das colunas conforme a estrutura física da planilha
    var COLUNAS_DIAS = {
      'domingo': 8,  // Coluna H
      'segunda': 9,  // Coluna I
      'terca': 10,   // Coluna J
      'quarta': 11,  // Coluna K
      'quinta': 12,  // Coluna L
      'sexta': 13,   // Coluna M
      'sabado': 14   // Coluna N
    };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error("Aba não encontrada: " + sheetName);
    }

    if (action === "UPDATE_CELL") {
      // Pega todos os dados da aba para iterar
      var data = sheet.getDataRange().getValues();
      var rowToUpdate = -1;
      
      // Itera pelas linhas (começando de 1 para pular o cabeçalho, se houver)
      // data[i][0] = Coluna 1 (A) - Matrícula
      // data[i][17] = Coluna 18 (R) - Semana
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(matricula) && String(data[i][17]) === String(semana)) {
          rowToUpdate = i + 1; // +1 porque o array é base 0 e o getRange é base 1
          break;
        }
      }
      
      if (rowToUpdate === -1) {
        throw new Error("Registro não encontrado para a Matrícula " + matricula + " na Semana " + semana);
      }
      
      var colToUpdate = COLUNAS_DIAS[dia];
      if (!colToUpdate) {
        throw new Error("Dia da semana inválido: " + dia);
      }
      
      // Atualiza a célula exata
      sheet.getRange(rowToUpdate, colToUpdate).setValue(valor);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Célula atualizada com sucesso na linha " + rowToUpdate + ", coluna " + colToUpdate 
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === "TRANSFER_COLABORADOR") {
      var oficinaOriginal = payload.oficinaOriginal;
      var oficinaNova = payload.oficinaNova;
      var nome = payload.nome;
      var funcao = payload.funcao;
      var escala = payload.escala;
      var turno = payload.turno;
      var turma = payload.turma;
      var escalasAnuais = payload.escalasAnuais;

      var sheetOriginal = ss.getSheetByName(oficinaOriginal);
      var sheetNova = ss.getSheetByName(oficinaNova);

      if (!sheetOriginal) throw new Error("Aba original não encontrada: " + oficinaOriginal);
      if (!sheetNova) throw new Error("Aba nova não encontrada: " + oficinaNova);

      // Passo A: Delete da aba original
      var dataOriginal = sheetOriginal.getDataRange().getValues();
      // Itera de baixo para cima para não bagunçar os índices ao deletar
      for (var i = dataOriginal.length - 1; i >= 1; i--) {
        if (String(dataOriginal[i][0]) === String(matricula)) {
          sheetOriginal.deleteRow(i + 1);
        }
      }

      // Passo B: Insert na aba nova
      var lastRow = sheetNova.getLastRow();
      var novasLinhas = [];
      for (var s = 1; s <= 52; s++) {
        var currentRow = lastRow + s;
        var semanaArr = escalasAnuais[String(s)] || ["", "", "", "", "", "", ""];
        novasLinhas.push([
          matricula,
          nome,
          funcao,
          escala,
          "", // Descrição do turno (vazio)
          turno,
          turma,
          semanaArr[0] || "", // domingo
          semanaArr[1] || "", // segunda
          semanaArr[2] || "", // terca
          semanaArr[3] || "", // quarta
          semanaArr[4] || "", // quinta
          semanaArr[5] || "", // sexta
          semanaArr[6] || "", // sabado
          "=SUM(H" + currentRow + ":N" + currentRow + ")", // O (Total H.H.)
          "", // P
          "", // Q
          s // Semana (R)
        ]);
      }

      sheetNova.getRange(lastRow + 1, 1, 52, 18).setValues(novasLinhas);

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Colaborador transferido com sucesso de " + oficinaOriginal + " para " + oficinaNova 
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === "UPDATE_COLABORADOR") {
      var escala = payload.escala;
      var turno = payload.turno;
      var turma = payload.turma;
      
      var data = sheet.getDataRange().getValues();
      var rowsUpdated = 0;
      
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(matricula)) {
          sheet.getRange(i + 1, 4).setValue(escala);
          sheet.getRange(i + 1, 6).setValue(turno);
          sheet.getRange(i + 1, 7).setValue(turma);
          rowsUpdated++;
        }
      }
      
      if (rowsUpdated === 0) {
        throw new Error("Colaborador não encontrado na aba: " + sheetName);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Colaborador atualizado com sucesso" 
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      throw new Error("Ação desconhecida: " + action);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function MIGRAR_CARGA_HORARIA_FUTURA() {
  var SEMANA_VIRADA_GERENCIA = 29;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var explicitOficinas = ['teman', 'theman', 'ovelu', 'modulação', 'modulacao'];

  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    var sheetNameLower = sheetName.toLowerCase().trim();
    var hasParentheses = (sheetName.indexOf('(') !== -1 && sheetName.indexOf(')') !== -1);
    var isExplicit = explicitOficinas.some(function(oficina) { return sheetNameLower.indexOf(oficina) !== -1; });

    if (!hasParentheses && !isExplicit) {
      continue; // Pula a aba, pois não tem parênteses e não está na Whitelist
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) continue; // Aba vazia ou só cabeçalho

    var range = sheet.getRange(2, 8, lastRow - 1, 11); // Linha 2, Coluna 8 (H) até Coluna 18 (R)
    var formulas = range.getFormulas();
    var values = range.getValues();
    var hasChanges = false;

    for (var r = 0; r < values.length; r++) {
      var semana = values[r][10]; // Índice 10 = Coluna R
      
      if (!semana || isNaN(semana) || Number(semana) < SEMANA_VIRADA_GERENCIA) {
        continue;
      }

      for (var c = 0; c < 7; c++) { // Colunas H a N (índices 0 a 6)
        // Ignora células com fórmula
        if (formulas[r][c] !== "") continue;
        
        var valStr = String(values[r][c]).trim().replace(',', '.');
        
        if (valStr === '6.5') {
          values[r][c] = 8;
          hasChanges = true;
        } else if (valStr === '5' || valStr === '5.0') {
          values[r][c] = '6,5';
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      range.setValues(values);
    }
  }
}
