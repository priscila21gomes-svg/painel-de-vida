/*
 * CONFIGURAÇÃO DO PHOTOBOOTH
 * ---------------------------------------------------------------
 * Para trocar/adicionar uma moldura:
 *   1. Exporte a moldura em 1080x1920 (PNG ou WEBP) com a área da
 *      foto TRANSPARENTE.
 *   2. Suba o arquivo na pasta photobooth/molduras/ (ex.: dia-1.png).
 *   3. Aponte o campo "moldura" do dia abaixo para esse arquivo.
 *
 * Se a moldura não tiver transparência, o site tenta detectar sozinho
 * a área branca do centro e usa ela como janela da foto.
 *
 * Deixe "moldura: null" para os dias que ainda não têm arte — o card
 * aparece como "Moldura em breve".
 */
window.PHOTOBOOTH_CONFIG = {
  campanha: "Peak Season",
  subtitulo: "7 dias, 7 desafios",
  hashtag: "#PeakSeasonSPX",

  // true = dias futuros ficam bloqueados até a data chegar.
  // Para testar todos antes da hora, abra o site com ?todos=1 no final.
  bloquearDiasFuturos: false,

  // Aderência por estado/região (nenhuma foto é enviada, só "dia + estado").
  //   fonte: "ficticio" → números de demonstração
  //   fonte: "supabase" → dados reais (rode supabase/aderencia.sql e preencha url/chave)
  aderencia: {
    fonte: "supabase",
    supabaseUrl: "https://bsfawieggmytqmybhbze.supabase.co",
    // Chave pública (anon): só permite gravar participações e ler os totais.
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZmF3aWVnZ215dHFteWJoYnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4ODcxOTIsImV4cCI6MjEwOTQ2MzE5Mn0.9bANU2oVdU8Hz29TsbCjNwA7ACZp8ryA1x1rBa0hb3A",
  },

  // Álbum da campanha no Google Drive (opcional — a pessoa escolhe enviar).
  // Cole aqui a URL do Apps Script (veja google-drive/COMO-ATIVAR.md).
  // Vazio = botão escondido; nenhuma foto sai do celular.
  drive: {
    urlScript: "https://script.google.com/a/macros/shopee.com/s/AKfycbwpr9lru_Lxqi6jWuAJQutUiRhHrgy_PkQ78mRo1yauksiOcL-FZPZhFijZH0gCN024/exec",
  },

  dias: [
    {
      dia: 1, data: "2026-11-06", icone: "📣",
      nome: "Laranja + Grito de Guerra",
      descricao: "Laranja, grito e Correio da Gratidão",
      moldura: "molduras/dia-1.webp",
    },
    {
      dia: 2, data: "2026-11-07", icone: "✨",
      nome: "Cabelo Maluco",
      descricao: "Penteado divertido e criativo",
      moldura: "molduras/dia-2.webp",
    },
    {
      dia: 3, data: "2026-11-08", icone: "🎨",
      nome: "Cor da Equipe",
      descricao: "Todo mundo na cor do time",
      moldura: "molduras/dia-3.webp",
    },
    {
      dia: 4, data: "2026-11-09", icone: "📸",
      nome: "Foto Mais Maluca",
      descricao: "A foto coletiva mais divertida",
      moldura: "molduras/dia-4.webp",
    },
    {
      dia: 5, data: "2026-11-10", icone: "👯",
      nome: "Dia do Gêmeo",
      descricao: "Duplas e grupos combinando",
      moldura: "molduras/dia-5.webp",
    },
    {
      dia: 6, data: "2026-11-11", icone: "🚀", destaque: "O grande dia!",
      nome: "Fantasy Day",
      descricao: "Fantasia e fotão do site",
      moldura: "molduras/dia-6.webp",
    },
    {
      dia: 7, data: "2026-11-12", icone: "🎤",
      nome: "The Voice / Karaokê",
      descricao: "Karaokê e talentos do time",
      moldura: "molduras/dia-7.webp",
    },
  ],
};
