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
    return resposta({ ok: true });
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  }
}

// Abrir a URL do script no navegador mostra se ele está no ar.
function doGet() {
  return resposta({ ok: true, servico: "photobooth-drive" });
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
