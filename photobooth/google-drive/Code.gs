/**
 * PHOTOBOOTH PEAK SEASON → GOOGLE DRIVE (versão 6: galeria rápida com índice)
 * ------------------------------------------------------------
 * Recebe a foto enviada pelo site (quando a pessoa toca em
 * "Enviar para o álbum da campanha") e salva numa pasta do Drive,
 * organizada por dia:
 *
 *   Photobooth Peak Season/
 *     Dia 1 - Laranja + Grito de Guerra/
 *       dia-1_SP_2026-11-06_14-03-22_ab12.jpg
 *     ...
 *
 * Depois do envio, o site pergunta "a foto <id> chegou?" (acao=status)
 * e só mostra "Foto enviada" quando este script confirma.
 *
 * Como instalar: veja photobooth/google-drive/COMO-ATIVAR.md
 */

const PASTA_RAIZ = "Photobooth Peak Season";
const TAMANHO_MAXIMO = 4 * 1024 * 1024; // 4 MB por foto
const NOMES_DIAS = {
  1: "Laranja + Grito de Guerra",
  2: "Cabelo Maluco",
  3: "Cor da Equipe",
  4: "Foto Mais Maluca",
  5: "Dia do Gêmeo",
  6: "Fantasy Day",
  7: "The Voice - Karaokê",
};
// Galeria do site: usa cópias leves das fotos, guardadas nesta subpasta.
const PASTA_PREVIAS = "_galeria (cópias leves)";
// true = a galeria só mostra as cópias marcadas com ESTRELA no Drive (moderação antes de aparecer).
// false = toda foto enviada aparece. Para tirar uma foto da galeria, apague a cópia dela em "_galeria"
// (some em até 30 min; para sumir na hora, rode "reconstruirIndice" pelo editor).
const SO_COM_ESTRELA = false;

const UFS = ["AC","AP","AM","PA","RO","RR","TO","AL","BA","CE","MA","PB","PE","PI","RN","SE",
             "DF","GO","MT","MS","ES","MG","RJ","SP","PR","RS","SC"];

function doPost(e) {
  let id = "";
  try {
    const dados = JSON.parse(e.postData.contents);
    id = /^[a-z0-9-]{8,40}$/.test(String(dados.id || "")) ? String(dados.id) : "";
    const dia = Number(dados.dia);
    const uf = String(dados.uf || "").toUpperCase();
    if (!(dia >= 1 && dia <= 7)) return falhou(id, "dia inválido");
    if (UFS.indexOf(uf) < 0) return falhou(id, "estado inválido");

    const base64 = String(dados.imagem || "").replace(/^data:image\/jpeg;base64,/, "");
    const bytes = Utilities.base64Decode(base64);
    if (bytes.length < 1000 || bytes.length > TAMANHO_MAXIMO) return falhou(id, "tamanho inválido");
    // Confere se é mesmo um JPEG (começa com FF D8 FF).
    if ((bytes[0] & 0xff) !== 0xff || (bytes[1] & 0xff) !== 0xd8 || (bytes[2] & 0xff) !== 0xff) {
      return falhou(id, "arquivo não é JPEG");
    }

    const agora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd_HH-mm-ss");
    const nome = "dia-" + dia + "_" + uf + "_" + agora + "_" + Utilities.getUuid().slice(0, 4) + ".jpg";
    pastaDoDia(dia).createFile(Utilities.newBlob(bytes, "image/jpeg", nome));

    // Cópia leve para a galeria do site (enviada pelo próprio site, ~25 KB).
    const previa = String(dados.previa || "").replace(/^data:image\/jpeg;base64,/, "");
    if (previa) {
      const pb = Utilities.base64Decode(previa);
      if (pb.length > 500 && pb.length < 300 * 1024 && (pb[0] & 0xff) === 0xff && (pb[1] & 0xff) === 0xd8) {
        const arqPrevia = pastaPrevias().createFile(Utilities.newBlob(pb, "image/jpeg", nome));
        try { CacheService.getScriptCache().put("pv_" + arqPrevia.getId(), "data:image/jpeg;base64," + previa, 1800); } catch (e) { /* ok */ }
        indexar(arqPrevia.getId(), nome);
      }
    }

    if (id) CacheService.getScriptCache().put("up_" + id, "ok", 900);
    return json({ ok: true });
  } catch (erro) {
    return falhou(id, String(erro));
  }
}

function falhou(id, motivo) {
  if (id) CacheService.getScriptCache().put("up_" + id, "erro:" + motivo.slice(0, 200), 900);
  return json({ ok: false, erro: motivo });
}

// GET:
//   (sem parâmetros)            → mostra se o script está no ar
//   ?acao=status&id=...&callback=fn → responde fn({...}) dizendo se a foto chegou
function doGet(e) {
  const p = (e && e.parameter) || {};
  let corpo = { ok: true, servico: "photobooth-drive", versao: 6 };
  if (p.acao === "galeria") {
    try { corpo = galeria(p); } catch (erro) { corpo = { ok: false, erro: String(erro) }; }
  } else if (p.acao === "status") {
    const id = /^[a-z0-9-]{8,40}$/.test(String(p.id || "")) ? String(p.id) : "";
    const v = id ? CacheService.getScriptCache().get("up_" + id) : null;
    corpo = v === "ok" ? { ok: true, status: "salva" }
          : v ? { ok: true, status: "erro", erro: v.replace(/^erro:/, "") }
          : { ok: true, status: "aguardando" };
  }
  const cb = String(p.callback || "");
  if (/^[A-Za-z_][A-Za-z0-9_]{0,60}$/.test(cb)) {
    return ContentService.createTextOutput(cb + "(" + JSON.stringify(corpo) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json(corpo);
}

// ------------------------------------------------------------------ GALERIA
function pastaPrevias() {
  return pegarOuCriar(pegarOuCriar(DriveApp.getRootFolder(), PASTA_RAIZ), PASTA_PREVIAS);
}

// Índice das fotos mais recentes (guardado nas propriedades do script).
// Assim a galeria responde rápido mesmo com milhares de fotos no Drive.
const MAX_INDICE = 60;
const tempoDoNome = function (nome) {
  const m = nome.match(/_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] + 3, +m[5], +m[6]) : 0; // nome está em horário de Brasília
};

function lerIndice() {
  const bruto = PropertiesService.getScriptProperties().getProperty("indice_galeria");
  if (bruto) return JSON.parse(bruto);
  return reconstruirIndice();
}

function salvarIndice(lista) {
  PropertiesService.getScriptProperties().setProperty("indice_galeria", JSON.stringify(lista.slice(0, MAX_INDICE)));
}

// Adiciona uma foto nova no topo do índice (chamado no envio).
function indexar(id, nome) {
  const m = nome.match(/^dia-(\d)_([A-Z]{2})_/);
  if (!m) return;
  const trava = LockService.getScriptLock();
  try {
    trava.waitLock(10000);
    const lista = lerIndice().filter(function (f) { return f.id !== id; });
    lista.unshift({ id: id, dia: Number(m[1]), uf: m[2], t: tempoDoNome(nome) || Date.now() });
    salvarIndice(lista);
  } finally {
    trava.releaseLock();
  }
}

// Monta o índice a partir da pasta "_galeria". Rode pelo editor se apagar/importar muitas fotos.
function reconstruirIndice() {
  const lista = [];
  const arquivos = pastaPrevias().getFiles();
  while (arquivos.hasNext()) {
    const f = arquivos.next();
    const nome = f.getName();
    const m = nome.match(/^dia-(\d)_([A-Z]{2})_/);
    if (!m) continue;
    lista.push({ id: f.getId(), dia: Number(m[1]), uf: m[2], t: tempoDoNome(nome) });
  }
  lista.sort(function (a, b) { return b.t - a.t; });
  salvarIndice(lista);
  Logger.log("Índice da galeria montado com " + Math.min(lista.length, MAX_INDICE) + " fotos (de " + lista.length + ").");
  return lista.slice(0, MAX_INDICE);
}

// Últimas fotos (cópias leves), mais recentes primeiro.
function galeria(p) {
  const limite = Math.min(24, Math.max(1, Number(p.limite) || 12));
  const cache = CacheService.getScriptCache();
  const indice = lerIndice();
  const fotos = [], removidas = [];
  for (let i = 0; i < indice.length && fotos.length < limite; i++) {
    const f = indice[i];
    let img = cache.get("pv_" + f.id);
    if (!img || SO_COM_ESTRELA) {
      let arq = null;
      try { arq = DriveApp.getFileById(f.id); } catch (e) { arq = null; }
      if (!arq || arq.isTrashed()) { removidas.push(f.id); continue; } // apagada do Drive: sai da galeria
      if (SO_COM_ESTRELA && !arq.isStarred()) continue;
      if (!img) {
        const blob = arq.getBlob();
        img = "data:" + (blob.getContentType() || "image/jpeg") + ";base64," + Utilities.base64Encode(blob.getBytes());
        try { cache.put("pv_" + f.id, img, 1800); } catch (e) { /* imagem grande demais para o cache */ }
      }
    }
    fotos.push({ dia: f.dia, uf: f.uf, t: f.t, img: img });
  }
  if (removidas.length) salvarIndice(indice.filter(function (f) { return removidas.indexOf(f.id) < 0; }));
  return { ok: true, fotos: fotos };
}

// ------------------------------------------------------------------ FOTOS ANTIGAS
// Rode UMA VEZ pelo editor (escolha "importarFotosAntigas" lá em cima e clique em Executar).
// Cria a cópia leve das fotos que já estavam no Drive antes da galeria existir.
// Se tiver muitas fotos e aparecer "tempo esgotado", é só rodar de novo: ele continua de onde parou.
function importarFotosAntigas() {
  const inicio = Date.now();
  const previas = pastaPrevias();
  const jaTem = {};
  const existentes = previas.getFiles();
  while (existentes.hasNext()) jaTem[existentes.next().getName()] = true;

  let criadas = 0, puladas = 0, falhas = 0;
  for (let dia = 1; dia <= 7; dia++) {
    const arquivos = pastaDoDia(dia).getFilesByType(MimeType.JPEG);
    while (arquivos.hasNext()) {
      if (Date.now() - inicio > 5 * 60 * 1000) { // para antes do limite de 6 min do Google
        Logger.log("Pausado por tempo. Criadas: " + criadas + ". Rode de novo para continuar.");
        reconstruirIndice();
        return;
      }
      const f = arquivos.next();
      if (f.isTrashed() || jaTem[f.getName()]) { puladas++; continue; }
      try {
        previas.createFile(miniatura(f).setName(f.getName()));
        jaTem[f.getName()] = true;
        criadas++;
      } catch (e) {
        falhas++;
        Logger.log("Falhou: " + f.getName() + " — " + e);
      }
    }
  }
  reconstruirIndice();
  Logger.log("Pronto! Cópias criadas: " + criadas + " · já existiam: " + puladas + " · falhas: " + falhas);
}

// Miniatura de ~300 px de largura gerada pelo próprio Google Drive.
function miniatura(arquivo) {
  try {
    const r = UrlFetchApp.fetch("https://drive.google.com/thumbnail?sz=w300&id=" + arquivo.getId(), {
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    });
    const tipo = String(r.getHeaders()["Content-Type"] || "");
    if (r.getResponseCode() === 200 && tipo.indexOf("image/") === 0) return r.getBlob();
  } catch (e) { /* tenta o plano B */ }
  const t = arquivo.getThumbnail(); // plano B: miniatura menor
  if (!t) throw new Error("o Drive ainda não gerou a miniatura desta foto");
  return t;
}

// ------------------------------------------------------------------ ENCONTRAR / JUNTAR FOTOS
// 1) Rode "diagnostico": lista no registro TODAS as pastas do photobooth que existem no seu Drive
//    (inclusive duplicadas e na lixeira) e quantas fotos tem em cada uma.
function diagnostico() {
  Logger.log("Conta que roda o script: " + Session.getEffectiveUser().getEmail());
  const raizes = DriveApp.getFoldersByName(PASTA_RAIZ);
  let n = 0;
  while (raizes.hasNext()) {
    const r = raizes.next(); n++;
    Logger.log("📁 " + PASTA_RAIZ + " #" + n + (r.isTrashed() ? " (NA LIXEIRA)" : "") + " — id " + r.getId() + " — " + r.getUrl());
    const subs = r.getFolders();
    while (subs.hasNext()) {
      const sp = subs.next();
      Logger.log("    └ " + sp.getName() + (sp.isTrashed() ? " (NA LIXEIRA)" : "") + ": " + contarArquivos(sp) + " fotos");
    }
  }
  if (!n) Logger.log("Nenhuma pasta \"" + PASTA_RAIZ + "\" encontrada nesta conta.");
  // Pastas de dia soltas (fora da pasta principal)
  for (let dia = 1; dia <= 7; dia++) {
    const nome = "Dia " + dia + " - " + NOMES_DIAS[dia];
    const it = DriveApp.getFoldersByName(nome);
    let k = 0; while (it.hasNext()) { it.next(); k++; }
    Logger.log("Pastas \"" + nome + "\" no Drive: " + k);
  }
  const lixo = DriveApp.searchFiles("title contains 'dia-' and mimeType = 'image/jpeg' and trashed = true");
  let nl = 0; while (lixo.hasNext() && nl < 5000) { lixo.next(); nl++; }
  Logger.log("Fotos do photobooth na lixeira: " + nl);
}

// 3) Rode "recuperarFotos": acha as fotos do photobooth que estão na lixeira (ou fora do lugar),
//    tira da lixeira e coloca cada uma na pasta do seu dia. Não apaga nada.
//    Continua de onde parou: se aparecer "Pausado por tempo", é só rodar de novo.
function recuperarFotos() {
  const inicio = Date.now();
  const props = PropertiesService.getScriptProperties();
  const st = JSON.parse(props.getProperty("recuperar_estado") || '{"etapa":0,"rest":0,"mov":0,"cop":0,"ok":0,"falhas":0}');
  const tempoAcabou = function () { return Date.now() - inicio > 4.5 * 60 * 1000; };

  // Etapa 0: pastas do photobooth na lixeira → restaura
  if (st.etapa === 0) {
    const pastas = DriveApp.searchFolders("trashed = true and (title contains 'Photobooth' or title contains 'Dia ' or title contains '_galeria')");
    while (pastas.hasNext()) {
      const f = pastas.next(), n = f.getName();
      if (n === PASTA_RAIZ || n === PASTA_PREVIAS || /^Dia \d - /.test(n)) {
        try { f.setTrashed(false); Logger.log("Pasta restaurada: " + n); } catch (e) { Logger.log("Não restaurou pasta " + n + ": " + e); }
      }
    }
    st.etapa = 1;
  }

  // O que já está no lugar certo (nome → true), montado rápido a partir das pastas
  const jaTem = {};
  const marcar = function (pasta, prefixo) { const it = pasta.getFiles(); while (it.hasNext()) jaTem[prefixo + it.next().getName()] = true; };
  for (let d = 1; d <= 7; d++) marcar(pastaDoDia(d), "D");
  marcar(pastaPrevias(), "P");

  // Etapa 1: arquivos na lixeira. Etapa 2: arquivos fora do lugar (ex.: em pastas antigas).
  const consultas = { 1: "title contains 'dia-' and trashed = true", 2: "title contains 'dia-' and trashed = false" };
  while (st.etapa <= 2) {
    const it = st.token ? DriveApp.continueFileIterator(st.token) : DriveApp.searchFiles(consultas[st.etapa]);
    while (it.hasNext()) {
      if (tempoAcabou()) {
        st.token = it.getContinuationToken();
        props.setProperty("recuperar_estado", JSON.stringify(st));
        Logger.log("Pausado por tempo (etapa " + st.etapa + "/2). Até agora: da lixeira " + st.rest + " · movidas " + st.mov + " · copiadas " + st.cop + ". Rode de novo para continuar.");
        return;
      }
      const f = it.next(), nome = f.getName();
      const m = nome.match(/^dia-(\d)_[A-Z]{2}_/);
      if (!m) continue;
      const lixo = st.etapa === 1;
      // Rápido: na etapa 2, se já existe um arquivo com esse nome no lugar certo, pula
      if (!lixo && jaTem["D" + nome] && jaTem["P" + nome]) { st.ok++; continue; }
      try {
        const ehPrevia = f.getSize() < 120 * 1024;
        const chave = (ehPrevia ? "P" : "D") + nome;
        if (!lixo && jaTem[chave]) { st.ok++; continue; }
        const destino = ehPrevia ? pastaPrevias() : pastaDoDia(Number(m[1]));
        if (lixo) { f.setTrashed(false); st.rest++; }
        if (jaTem[chave]) continue;
        try { f.moveTo(destino); st.mov++; } catch (e) { f.makeCopy(nome, destino); st.cop++; }
        jaTem[chave] = true;
      } catch (e) {
        st.falhas++;
        Logger.log("Falhou: " + nome + " — " + e);
      }
    }
    st.etapa++; delete st.token;
  }

  props.deleteProperty("recuperar_estado");
  reconstruirIndice();
  Logger.log("Pronto! Tiradas da lixeira: " + st.rest + " · movidas: " + st.mov + " · copiadas: " + st.cop +
             " · já no lugar: " + st.ok + " · falhas: " + st.falhas);
  contarFotos();
}

// 4) Rode "contarFotos": mostra, por dia, quantas fotos originais e quantas cópias leves existem.
function contarFotos() {
  const prev = {}, orig = {};
  const contar = function (pasta, alvo) {
    const it = pasta.getFiles();
    while (it.hasNext()) { const m = it.next().getName().match(/^dia-(\d)_/); if (m) alvo[m[1]] = (alvo[m[1]] || 0) + 1; }
  };
  for (let d = 1; d <= 7; d++) contar(pastaDoDia(d), orig);
  contar(pastaPrevias(), prev);
  for (let d = 1; d <= 7; d++) {
    Logger.log("Dia " + d + ": " + (orig[d] || 0) + " fotos originais · " + (prev[d] || 0) + " cópias leves na _galeria");
  }
}

// 5) Rode "salvarCopiasLeves": para cada cópia leve da _galeria que NÃO tem a foto original,
//    coloca uma cópia dela na pasta do dia, com "(baixa resolução)" no nome. Não apaga nada.
function salvarCopiasLeves() {
  const inicio = Date.now();
  const temOriginal = {};
  for (let d = 1; d <= 7; d++) { const it = pastaDoDia(d).getFiles(); while (it.hasNext()) temOriginal[it.next().getName().replace(" (baixa resolução)", "")] = true; }
  let criadas = 0;
  const it = pastaPrevias().getFiles();
  while (it.hasNext()) {
    if (Date.now() - inicio > 4.5 * 60 * 1000) { Logger.log("Pausado por tempo. Criadas: " + criadas + ". Rode de novo."); return; }
    const f = it.next(), nome = f.getName();
    const m = nome.match(/^dia-(\d)_/);
    if (!m || temOriginal[nome]) continue;
    f.makeCopy(nome.replace(/\.jpg$/i, "") + " (baixa resolução).jpg", pastaDoDia(Number(m[1])));
    temOriginal[nome] = true; criadas++;
  }
  Logger.log("Pronto! Cópias em baixa resolução colocadas nas pastas dos dias: " + criadas);
  contarFotos();
}

function contarArquivos(pasta) {
  let n = 0; const it = pasta.getFiles();
  while (it.hasNext()) { it.next(); n++; }
  return n;
}

// 2) Rode "juntarPastas": MOVE (não apaga nada) as fotos de todas as pastas duplicadas do photobooth
//    para a pasta principal, cada uma na pasta do seu dia. Pastas na lixeira são ignoradas.
//    Se aparecer "Pausado por tempo", é só rodar de novo.
function juntarPastas() {
  const inicio = Date.now();
  const principal = pegarOuCriar(DriveApp.getRootFolder(), PASTA_RAIZ);
  let movidas = 0;
  const origens = [];
  const raizes = DriveApp.getFoldersByName(PASTA_RAIZ);
  while (raizes.hasNext()) { const r = raizes.next(); if (r.getId() !== principal.getId() && !r.isTrashed()) origens.push(r); }
  for (let dia = 1; dia <= 7; dia++) {
    const it = DriveApp.getFoldersByName("Dia " + dia + " - " + NOMES_DIAS[dia]);
    while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) origens.push(f); }
  }
  for (const pasta of origens) {
    const destinoSub = function (nomeArquivo, nomePasta) {
      if (nomePasta === PASTA_PREVIAS) return pastaPrevias();
      const m = String(nomeArquivo).match(/^dia-(\d)_/);
      return m ? pastaDoDia(Number(m[1])) : principal;
    };
    const pastas = [pasta];
    const subs = pasta.getFolders(); while (subs.hasNext()) pastas.push(subs.next());
    for (const p of pastas) {
      const arquivos = p.getFiles();
      while (arquivos.hasNext()) {
        if (Date.now() - inicio > 5 * 60 * 1000) { Logger.log("Pausado por tempo. Movidas: " + movidas + ". Rode de novo."); reconstruirIndice(); return; }
        const f = arquivos.next();
        const destino = destinoSub(f.getName(), p.getName());
        if (destino.getId() === p.getId()) continue;
        f.moveTo(destino); movidas++;
      }
    }
  }
  reconstruirIndice();
  Logger.log("Pronto! Fotos movidas para a pasta principal: " + movidas + ". Pasta: " + principal.getUrl());
}

function pastaDoDia(dia) {
  const raiz = pegarOuCriar(DriveApp.getRootFolder(), PASTA_RAIZ);
  return pegarOuCriar(raiz, "Dia " + dia + " - " + NOMES_DIAS[dia]);
}

function pegarOuCriar(pai, nome) {
  const existentes = pai.getFoldersByName(nome);
  return existentes.hasNext() ? existentes.next() : pai.createFolder(nome);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Rode esta função uma vez pelo editor para autorizar o acesso ao Drive e criar as pastas.
function testar() {
  for (let d = 1; d <= 7; d++) pastaDoDia(d);
  Logger.log("Pastas criadas em: " + PASTA_RAIZ);
}
