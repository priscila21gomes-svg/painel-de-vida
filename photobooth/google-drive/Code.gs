/**
 * PHOTOBOOTH PEAK SEASON → GOOGLE DRIVE
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
  let corpo = { ok: true, servico: "photobooth-drive", versao: 3 };
  if (p.acao === "status") {
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
