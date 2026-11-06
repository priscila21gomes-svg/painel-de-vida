/**
 * PHOTOBOOTH PEAK SEASON → GOOGLE DRIVE
 * ------------------------------------------------------------
 * Recebe a foto enviada pelo site (só quando a pessoa clica em
 * "Enviar para o álbum da campanha") e salva numa pasta do Drive,
 * organizada por dia:
 *
 *   Photobooth Peak Season/
 *     Dia 1 - Laranja + Grito de Guerra/
 *       dia-1_SP_2026-11-06_14-03-22_ab12.jpg
 *     Dia 2 - Cabelo Maluco/
 *     ...
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
const UFS = ["AC","AP","AM","PA","RO","RR","TO","AL","BA","CE","MA","PB","PE","PI","RN","SE",
             "DF","GO","MT","MS","ES","MG","RJ","SP","PR","RS","SC"];

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const dia = Number(dados.dia);
    const uf = String(dados.uf || "").toUpperCase();
    if (!(dia >= 1 && dia <= 7)) return resposta({ ok: false, erro: "dia inválido" });
    if (UFS.indexOf(uf) < 0) return resposta({ ok: false, erro: "estado inválido" });
    if (dados.autorizado !== true) return resposta({ ok: false, erro: "sem autorização de uso de imagem" });

    const base64 = String(dados.imagem || "").replace(/^data:image\/jpeg;base64,/, "");
    const bytes = Utilities.base64Decode(base64);
    if (bytes.length < 1000 || bytes.length > TAMANHO_MAXIMO) return resposta({ ok: false, erro: "tamanho inválido" });
    // Confere se é mesmo um JPEG (começa com FF D8 FF).
    if ((bytes[0] & 0xff) !== 0xff || (bytes[1] & 0xff) !== 0xd8 || (bytes[2] & 0xff) !== 0xff) {
      return resposta({ ok: false, erro: "arquivo não é JPEG" });
    }

    const agora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd_HH-mm-ss");
    const sufixo = Utilities.getUuid().slice(0, 4);
    const nome = "dia-" + dia + "_" + uf + "_" + agora + "_" + sufixo + ".jpg";
    const blob = Utilities.newBlob(bytes, "image/jpeg", nome);

    const pasta = pastaDoDia(dia);
    pasta.createFile(blob);
    CacheService.getScriptCache().remove("lista"); // aparece na galeria na hora
    return resposta({ ok: true });
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  }
}

// ------------------------------------------------------------------ GALERIA
// true = a galeria só mostra fotos marcadas com ESTRELA no Drive (moderação antes de publicar).
// false = toda foto enviada aparece (para tirar uma foto da galeria, é só apagá-la do Drive).
const SO_COM_ESTRELA = false;

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.acao === "galeria") return resposta(galeria(p));
    if (p.acao === "foto") return resposta(foto(p.id));
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  }
  // Abrir a URL do script no navegador mostra se ele está no ar.
  return resposta({ ok: true, servico: "photobooth-drive", galeria: true });
}

// Lista as fotos da campanha (mais recentes primeiro). Guardada em cache por 1 minuto.
function listarFotos() {
  const cache = CacheService.getScriptCache();
  const salvo = cache.get("lista");
  if (salvo) return JSON.parse(salvo);
  const raiz = pegarOuCriar(DriveApp.getRootFolder(), PASTA_RAIZ);
  const lista = [];
  for (let dia = 1; dia <= 7; dia++) {
    const pastas = raiz.getFoldersByName("Dia " + dia + " - " + NOMES_DIAS[dia]);
    if (!pastas.hasNext()) continue;
    const arquivos = pastas.next().getFilesByType(MimeType.JPEG);
    while (arquivos.hasNext()) {
      const f = arquivos.next();
      if (f.isTrashed()) continue;
      if (SO_COM_ESTRELA && !f.isStarred()) continue;
      const m = f.getName().match(/^dia-\d_([A-Z]{2})_/);
      lista.push({ id: f.getId(), dia: dia, uf: m ? m[1] : "", t: f.getDateCreated().getTime() });
    }
  }
  lista.sort(function (a, b) { return b.t - a.t; });
  try { cache.put("lista", JSON.stringify(lista), 60); } catch (e) { /* lista grande demais para o cache */ }
  return lista;
}

function galeria(p) {
  const dia = Number(p.dia) || 0;
  const pular = Math.max(0, Number(p.pular) || 0);
  const limite = Math.min(24, Math.max(1, Number(p.limite) || 12));
  let lista = listarFotos();
  if (dia) lista = lista.filter(function (f) { return f.dia === dia; });
  const pagina = lista.slice(pular, pular + limite);
  const cache = CacheService.getScriptCache();
  const fotos = pagina.map(function (f) {
    let thumb = cache.get("th_" + f.id);
    if (!thumb) {
      const blob = DriveApp.getFileById(f.id).getThumbnail();
      if (blob) {
        thumb = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
        try { cache.put("th_" + f.id, thumb, 21600); } catch (e) { /* miniatura grande demais para o cache */ }
      }
    }
    return { id: f.id, dia: f.dia, uf: f.uf, t: f.t, thumb: thumb || "" };
  });
  return { ok: true, total: lista.length, fotos: fotos };
}

// Foto em tamanho cheio — só entrega arquivos que estão nas pastas da campanha.
function foto(id) {
  const item = listarFotos().filter(function (f) { return f.id === id; })[0];
  if (!item) return { ok: false, erro: "foto não encontrada" };
  const blob = DriveApp.getFileById(id).getBlob();
  return { ok: true, dia: item.dia, uf: item.uf, t: item.t, imagem: "data:image/jpeg;base64," + Utilities.base64Encode(blob.getBytes()) };
}

function pastaDoDia(dia) {
  const raiz = pegarOuCriar(DriveApp.getRootFolder(), PASTA_RAIZ);
  return pegarOuCriar(raiz, "Dia " + dia + " - " + NOMES_DIAS[dia]);
}

function pegarOuCriar(pai, nome) {
  const existentes = pai.getFoldersByName(nome);
  return existentes.hasNext() ? existentes.next() : pai.createFolder(nome);
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Rode esta função uma vez pelo editor para autorizar o acesso ao Drive e criar as pastas.
function testar() {
  for (let d = 1; d <= 7; d++) pastaDoDia(d);
  Logger.log("Pastas criadas em: " + PASTA_RAIZ);
}
