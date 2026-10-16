import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { aniversarioNoPeriodo, noPeriodo } from "./datas";

// O conteúdo do jornal vive separado do layout:
//  - com Supabase configurado: tabela rj2_conteudo (linha "principal")
//  - sem Supabase: public/conteudo.json (+ alterações locais do admin neste navegador)
const CHAVE_LOCAL = "rj2news:conteudo-local";
const CHAVE_ADMIN = "rj2news:admin";
const CHAVE_EDICAO = "rj2news:edicao";
const SENHA_PADRAO = import.meta.env.VITE_ADMIN_SENHA || "rj2news";

const Ctx = createContext(null);

function lerLocal(chave, armazenamento = localStorage) {
  try {
    const v = armazenamento.getItem(chave);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function gravarLocal(chave, valor, armazenamento = localStorage) {
  try {
    if (valor === null) armazenamento.removeItem(chave);
    else armazenamento.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento indisponível (aba anônima etc.) */
  }
}

async function carregarArquivo() {
  const r = await fetch(`conteudo.json?v=${Date.now()}`);
  if (!r.ok) throw new Error("Não foi possível carregar o conteudo.json");
  return r.json();
}

export function ConteudoProvider({ children }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [alteracoesLocais, setAlteracoesLocais] = useState(false);
  const [admin, setAdmin] = useState(() => !supabase && lerLocal(CHAVE_ADMIN, sessionStorage) === true);
  const [edicaoVista, setEdicaoVistaState] = useState(() => lerLocal(CHAVE_EDICAO, sessionStorage));

  useEffect(() => {
    (async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from("rj2_conteudo").select("data").eq("id", "principal").maybeSingle();
          if (error) throw error;
          setDados(data?.data ?? (await carregarArquivo()));
          const { data: s } = await supabase.auth.getSession();
          setAdmin(!!s.session);
        } else {
          const local = lerLocal(CHAVE_LOCAL);
          if (local) {
            setDados(local);
            setAlteracoesLocais(true);
          } else {
            setDados(await carregarArquivo());
          }
        }
      } catch (e) {
        setErro(e.message || String(e));
      }
    })();
  }, []);

  const salvar = useCallback(async (novo) => {
    const comData = { ...novo, config: { ...novo.config, atualizadoEm: new Date().toISOString() } };
    setDados(comData);
    if (supabase) {
      const { error } = await supabase.from("rj2_conteudo").upsert({ id: "principal", data: comData, atualizado_em: new Date().toISOString() });
      if (error) throw error;
      await supabase.from("rj2_historico").insert({ data: comData });
    } else {
      gravarLocal(CHAVE_LOCAL, comData);
      setAlteracoesLocais(true);
    }
  }, []);

  const descartarLocais = useCallback(async () => {
    gravarLocal(CHAVE_LOCAL, null);
    setAlteracoesLocais(false);
    setDados(await carregarArquivo());
  }, []);

  const entrar = useCallback(async (email, senha) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error("E-mail ou senha inválidos.");
      setAdmin(true);
      return;
    }
    if (senha !== SENHA_PADRAO) throw new Error("Senha incorreta.");
    gravarLocal(CHAVE_ADMIN, true, sessionStorage);
    setAdmin(true);
  }, []);

  const sair = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    gravarLocal(CHAVE_ADMIN, null, sessionStorage);
    setAdmin(false);
  }, []);

  const setEdicaoVista = useCallback((id) => {
    gravarLocal(CHAVE_EDICAO, id, sessionStorage);
    setEdicaoVistaState(id);
  }, []);

  const valor = useMemo(
    () => ({ dados, erro, salvar, admin, entrar, sair, alteracoesLocais, descartarLocais, edicaoVista, setEdicaoVista, usaSupabase: !!supabase }),
    [dados, erro, salvar, admin, entrar, sair, alteracoesLocais, descartarLocais, edicaoVista, setEdicaoVista]
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useConteudo() {
  return useContext(Ctx);
}

const porInicio = (a, b) => a.inicio.localeCompare(b.inicio);

// Tudo o que uma página precisa saber sobre a edição que está sendo lida.
export function useEdicao() {
  const { dados, edicaoVista } = useConteudo();
  return useMemo(() => {
    const todas = [...dados.edicoes].sort(porInicio);
    const atual = todas.find((e) => e.id === dados.config.edicaoAtual) || todas[todas.length - 1];
    // Edições futuras (preparadas antecipadamente) não aparecem para o público.
    const publicadas = todas.filter((e) => e.inicio <= atual.inicio);
    const edicao = publicadas.find((e) => e.id === edicaoVista) || atual;
    const ordem = Object.fromEntries(todas.map((e, i) => [e.id, i]));
    const ateEdicao = (semana) => ordem[semana] !== undefined && ordem[semana] <= ordem[edicao.id];

    const publicacoes = dados.publicacoes
      .filter((p) => p.status === "publicado" && ateEdicao(p.semana))
      .sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao));
    const daSemana = publicacoes.filter((p) => p.semana === edicao.id);

    const aniversariantes = dados.aniversariantes
      .map((a) => ({ ...a, dataNaSemana: aniversarioNoPeriodo(a.data, edicao.inicio, edicao.fim) }))
      .filter((a) => a.dataNaSemana)
      .sort((a, b) => a.dataNaSemana.localeCompare(b.dataNaSemana));

    const agenda = dados.agenda
      .filter((a) => noPeriodo(a.data, edicao.inicio, edicao.fim))
      .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

    const indicadoresPorSemana = Object.fromEntries(dados.indicadores.map((i) => [i.semana, i]));
    const ultimoDe = (lista) => lista.filter((x) => ateEdicao(x.semana)).sort((a, b) => ordem[b.semana] - ordem[a.semana])[0];

    return {
      dados,
      todas,
      atual,
      publicadas,
      edicao,
      ehAtual: edicao.id === atual.id,
      ateEdicao,
      publicacoes,
      daSemana,
      aniversariantes,
      agenda,
      indicadores: indicadoresPorSemana[edicao.id],
      indicadoresPorSemana,
      perfilDaSemana: ultimoDe(dados.time),
      banner: publicacoes.find((p) => p.banner),
    };
  }, [dados, edicaoVista]);
}
