/*
 * ADERÊNCIA — conta participações por dia, estado e região.
 * Nenhuma foto é enviada: só o registro "dia X, estado Y".
 *
 * Fonte dos números (config.js → aderencia.fonte):
 *   "ficticio" → números de demonstração gerados aqui mesmo.
 *   "supabase" → lê e grava no Supabase (ver supabase/aderencia.sql).
 */
(() => {
  "use strict";

  const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

  // [UF, nome, região, peso aproximado para os dados fictícios]
  const ESTADOS = [
    ["AC", "Acre", "Norte", 0.9], ["AP", "Amapá", "Norte", 0.8], ["AM", "Amazonas", "Norte", 4.1],
    ["PA", "Pará", "Norte", 8.2], ["RO", "Rondônia", "Norte", 1.7], ["RR", "Roraima", "Norte", 0.6],
    ["TO", "Tocantins", "Norte", 1.5],
    ["AL", "Alagoas", "Nordeste", 3.1], ["BA", "Bahia", "Nordeste", 13.9], ["CE", "Ceará", "Nordeste", 8.6],
    ["MA", "Maranhão", "Nordeste", 6.6], ["PB", "Paraíba", "Nordeste", 3.9], ["PE", "Pernambuco", "Nordeste", 9.3],
    ["PI", "Piauí", "Nordeste", 3.2], ["RN", "Rio Grande do Norte", "Nordeste", 3.3], ["SE", "Sergipe", "Nordeste", 2.2],
    ["DF", "Distrito Federal", "Centro-Oeste", 4.9], ["GO", "Goiás", "Centro-Oeste", 7.4],
    ["MT", "Mato Grosso", "Centro-Oeste", 3.8], ["MS", "Mato Grosso do Sul", "Centro-Oeste", 2.9],
    ["ES", "Espírito Santo", "Sudeste", 4.0], ["MG", "Minas Gerais", "Sudeste", 20.5],
    ["RJ", "Rio de Janeiro", "Sudeste", 16.1], ["SP", "São Paulo", "Sudeste", 46.0],
    ["PR", "Paraná", "Sul", 11.4], ["RS", "Rio Grande do Sul", "Sul", 10.9], ["SC", "Santa Catarina", "Sul", 7.6],
  ].map(([uf, nome, regiao, peso]) => ({ uf, nome, regiao, peso }));

  const porUF = Object.fromEntries(ESTADOS.map((e) => [e.uf, e]));
  const cfg = () => (window.PHOTOBOOTH_CONFIG && window.PHOTOBOOTH_CONFIG.aderencia) || { fonte: "ficticio" };

  // ------------------------------------------------------------ armazenamento local
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } },
  };

  function localAtual() {
    const uf = LS.get("pb-uf");
    return uf && porUF[uf] ? porUF[uf] : null;
  }
  function salvarLocal(uf) { if (porUF[uf]) LS.set("pb-uf", uf); }

  // ------------------------------------------------------------ dados fictícios
  function ficticios() {
    let s = 20261106;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const fatorDia = { 1: 1.0, 2: 0.82, 3: 0.74, 4: 0.9, 5: 0.86, 6: 1.45, 7: 0.97 };
    const linhas = [];
    for (let dia = 1; dia <= 7; dia++) {
      for (const e of ESTADOS) {
        const total = Math.round(e.peso * 9 * fatorDia[dia] * (0.7 + rnd() * 0.6));
        linhas.push({ dia, uf: e.uf, total });
      }
    }
    return linhas;
  }

  // ------------------------------------------------------------ Supabase (REST)
  function sb() {
    const c = cfg();
    return c.fonte === "supabase" && c.supabaseUrl && c.supabaseAnonKey ? c : null;
  }
  function cabecalhos(c) {
    return { apikey: c.supabaseAnonKey, Authorization: `Bearer ${c.supabaseAnonKey}`, "Content-Type": "application/json" };
  }

  async function carregar() {
    const c = sb();
    if (!c) return { linhas: ficticios(), ficticio: true };
    const r = await fetch(`${c.supabaseUrl}/rest/v1/rpc/aderencia_resumo`, { method: "POST", headers: cabecalhos(c), body: "{}" });
    if (!r.ok) throw new Error("Falha ao carregar aderência");
    const linhas = (await r.json()).map((l) => ({ dia: Number(l.dia), uf: l.uf, total: Number(l.total) }));
    return { linhas, ficticio: false };
  }

  // Conta 1 participação por aparelho, por dia.
  // A marca só é gravada no celular depois que o banco confirma (se a rede falhar, conta na próxima foto).
  async function registrar(dia, uf) {
    if (!porUF[uf]) return false;
    const chave = `pb-v2-contou-dia-${dia}`;
    if (LS.get(chave)) return false;
    const c = sb();
    if (!c) return false;
    try {
      const r = await fetch(`${c.supabaseUrl}/rest/v1/aderencia`, {
        method: "POST",
        headers: { ...cabecalhos(c), Prefer: "return=minimal" },
        body: JSON.stringify({ dia, uf, regiao: porUF[uf].regiao }),
        keepalive: true,
      });
      if (!r.ok) return false;
      LS.set(chave, uf);
      return true;
    } catch (e) { return false; }
  }

  // ------------------------------------------------------------ agregações
  function resumir(linhas, dias) {
    const nomeDia = Object.fromEntries((dias || []).map((d) => [d.dia, d.nome]));
    const reg = Object.fromEntries(REGIOES.map((r) => [r, 0]));
    const est = {}, dia = {};
    let total = 0;
    for (const l of linhas) {
      const e = porUF[l.uf];
      if (!e) continue;
      total += l.total;
      reg[e.regiao] += l.total;
      est[l.uf] = (est[l.uf] || 0) + l.total;
      dia[l.dia] = (dia[l.dia] || 0) + l.total;
    }
    const ordenar = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
    return {
      total,
      estadosAtivos: Object.values(est).filter((v) => v > 0).length,
      regioes: ordenar(reg).map(([nome, v]) => ({ rotulo: nome, valor: v })),
      estados: ordenar(est).slice(0, 5).map(([uf, v]) => ({ rotulo: porUF[uf].nome, sub: `${uf} · ${porUF[uf].regiao}`, valor: v })),
      dias: ordenar(dia).slice(0, 5).map(([d, v]) => ({ rotulo: `Dia ${d}`, sub: nomeDia[d] || "", valor: v })),
    };
  }

  window.Aderencia = { REGIOES, ESTADOS, porUF, localAtual, salvarLocal, carregar, registrar, resumir };
})();
