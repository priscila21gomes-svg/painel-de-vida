import { supabase } from "./supabaseClient.js";

// Polyfill for the window.storage API the app expects. Backed by
// localStorage always (so the app works offline / without Supabase
// configured), and additionally synced to Supabase when the
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars are set.

const ESTADO_KEY = "painel-da-vida:estado:v2";
const ESTADO_ROW_ID = "painel-da-vida";

// Evita gravar um snapshot de histórico a cada tecla digitada:
// só insere uma nova linha se já se passaram X minutos desde a última.
const INTERVALO_MIN_HISTORICO_MS = 10 * 60 * 1000;
let ultimoHistoricoEm = 0;

async function carregarDeSupabase() {
  const { data, error } = await supabase
    .from("estado")
    .select("data")
    .eq("id", ESTADO_ROW_ID)
    .maybeSingle();
  if (error || !data) return null;
  return data.data;
}

async function salvarNoSupabase(estado) {
  await supabase
    .from("estado")
    .upsert({ id: ESTADO_ROW_ID, data: estado, atualizado_em: new Date().toISOString() });

  const agora = Date.now();
  if (agora - ultimoHistoricoEm >= INTERVALO_MIN_HISTORICO_MS) {
    ultimoHistoricoEm = agora;
    await supabase.from("historico").insert({ data: estado });
  }
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      if (supabase && key === ESTADO_KEY) {
        try {
          const remoto = await carregarDeSupabase();
          if (remoto) {
            const value = JSON.stringify(remoto);
            localStorage.setItem(key, value);
            return { value };
          }
        } catch (e) {
          // sem conexão com o Supabase agora — usa o cache local
        }
      }
      const value = localStorage.getItem(key);
      return { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      if (supabase && key === ESTADO_KEY) {
        try {
          await salvarNoSupabase(JSON.parse(value));
        } catch (e) {
          // fica salvo localmente e tenta sincronizar na próxima alteração
        }
      }
      return { value };
    },
  };
}
