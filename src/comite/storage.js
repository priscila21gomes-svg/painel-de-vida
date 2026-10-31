import { supabase } from "../supabaseClient.js";

// Persistência do Comitê de Eventos. Sempre salva no localStorage e, quando
// o Supabase está configurado (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY),
// também na tabela `estado` — numa linha própria, separada do Painel da Vida.
// Assim todo o comitê vê os mesmos dados, de qualquer aparelho.

export const COMITE_KEY = "comite-eventos:estado:v1";
const ROW_ID = "comite-eventos";

export async function carregarComite() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("estado").select("data").eq("id", ROW_ID).maybeSingle();
      if (!error && data?.data) {
        localStorage.setItem(COMITE_KEY, JSON.stringify(data.data));
        return data.data;
      }
    } catch (e) {
      // sem conexão agora — usa o cache local
    }
  }
  try {
    const raw = localStorage.getItem(COMITE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function salvarComite(estado) {
  try {
    localStorage.setItem(COMITE_KEY, JSON.stringify(estado));
  } catch (e) {
    // armazenamento local cheio (ex: muitos arquivos enviados) — segue para a nuvem
  }
  if (supabase) {
    try {
      await supabase.from("estado").upsert({ id: ROW_ID, data: estado, atualizado_em: new Date().toISOString() });
    } catch (e) {
      // fica salvo localmente e tenta de novo na próxima alteração
    }
  }
}

export const sincronizaNaNuvem = Boolean(supabase);
