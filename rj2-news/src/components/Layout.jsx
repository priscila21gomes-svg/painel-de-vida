import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, Bell, BarChart3, Cake, CalendarDays, FileText, Home, Image as ImageIcon, Mail, Megaphone,
  Menu, Newspaper, Settings, Star, Truck, Users, X, History, Search,
} from "lucide-react";
import { link, navegar } from "../lib/rota";
import { useConteudo, useEdicao } from "../lib/store";
import { fmtCurta, fmtData } from "../lib/datas";

export const MENU = [
  { id: "home", rotulo: "Home", icone: Home },
  { id: "destaques", rotulo: "Destaques", icone: Star },
  { id: "pessoas", rotulo: "Pessoas", icone: Users },
  { id: "operacao", rotulo: "Operação", icone: Truck },
  { id: "campanhas", rotulo: "Campanhas", icone: Megaphone },
  { id: "aniversariantes", rotulo: "Aniversariantes", icone: Cake },
  { id: "indicadores", rotulo: "Indicadores", icone: BarChart3 },
  { id: "agenda", rotulo: "Agenda", icone: CalendarDays },
  { id: "comunicados", rotulo: "Comunicados", icone: Mail },
  { id: "galeria", rotulo: "Galeria", icone: ImageIcon },
  { id: "documentos", rotulo: "Documentos", icone: FileText },
];

function Logo() {
  return (
    <a href={link("home")} className="flex items-center gap-2.5 px-2">
      <div className="w-10 h-10 rounded-xl bg-white grid place-items-center shadow">
        <Newspaper className="w-6 h-6 text-laranja-500" />
      </div>
      <div className="leading-none">
        <div className="text-2xl font-extrabold tracking-tight">RJ2 <span className="text-amarelo">News</span></div>
        <div className="text-[11px] text-white/80 mt-0.5">o jornal semanal da operação</div>
      </div>
    </a>
  );
}

function Sidebar({ pagina, aberto, onFechar }) {
  const { dados } = useConteudo();
  return (
    <>
      <div className={`fixed inset-0 bg-marinho-900/50 z-30 lg:hidden transition-opacity ${aberto ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onFechar} />
      <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-gradient-to-b from-laranja-500 to-laranja-600 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 ${aberto ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between pt-6 pb-5 px-4">
          <Logo />
          <button className="lg:hidden p-1" onClick={onFechar} aria-label="Fechar menu"><X /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {MENU.map(({ id, rotulo, icone: Icone }) => {
            const ativo = pagina === id;
            return (
              <a
                key={id}
                href={link(id)}
                onClick={onFechar}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition ${ativo ? "bg-white text-laranja-600 shadow" : "hover:bg-white/15"}`}
              >
                <Icone className="w-5 h-5" strokeWidth={ativo ? 2.4 : 1.8} />
                {rotulo}
              </a>
            );
          })}
          <a href={link("edicoes")} onClick={onFechar} className={`flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition ${pagina === "edicoes" ? "bg-white text-laranja-600 shadow" : "hover:bg-white/15"}`}>
            <History className="w-5 h-5" /> Edições anteriores
          </a>
        </nav>
        <div className="px-6 pt-4 pb-2 text-center border-t border-white/25 mx-4 mt-3">
          <p className="font-semibold text-lg leading-snug">{dados.config.slogan}</p>
        </div>
        <img src="img/mascote.svg" alt="Mascote" className="w-24 mx-auto mb-2 animate-flutuar [@media(max-height:860px)]:hidden" />
        <a href={link("admin")} onClick={onFechar} className="mx-auto mb-4 flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
          <Settings className="w-3.5 h-3.5" /> Área administrativa
        </a>
      </aside>
    </>
  );
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const CHAVE_VISTOS = "rj2news:comunicados-vistos";

function Notificacoes() {
  const { publicacoes } = useEdicao();
  const [aberto, setAberto] = useState(false);
  const [vistos, setVistos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHAVE_VISTOS)) || []; } catch { return []; }
  });
  const ref = useRef(null);
  const comunicados = useMemo(() => publicacoes.filter((p) => p.categoria === "Comunicados" || p.fixado).slice(0, 6), [publicacoes]);
  const novos = comunicados.filter((c) => !vistos.includes(c.id));

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => ref.current && !ref.current.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const abrir = () => {
    setAberto((v) => !v);
    const todos = [...new Set([...vistos, ...comunicados.map((c) => c.id)])];
    try { localStorage.setItem(CHAVE_VISTOS, JSON.stringify(todos)); } catch { /* sem armazenamento */ }
    setTimeout(() => setVistos(todos), 1500);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={abrir} className="relative w-11 h-11 grid place-items-center rounded-full hover:bg-laranja-50 text-marinho-900" aria-label={`Notificações (${novos.length} novas)`}>
        <Bell className="w-6 h-6" />
        {novos.length > 0 && <span className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-laranja-500 text-white text-[11px] font-bold grid place-items-center ring-2 ring-white">{novos.length}</span>}
      </button>
      {aberto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 animate-entrar overflow-hidden">
          <div className="px-4 py-3 font-semibold text-marinho-900 border-b border-slate-100">Comunicados</div>
          {comunicados.length === 0 && <p className="p-4 text-sm text-slate-400">Sem comunicados por enquanto.</p>}
          {comunicados.map((c) => (
            <a key={c.id} href={link(`materia/${c.id}`)} onClick={() => setAberto(false)} className="flex gap-3 px-4 py-3 hover:bg-laranja-50 border-b border-slate-50 last:border-0">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${vistos.includes(c.id) ? "bg-slate-200" : "bg-laranja-500"}`} />
              <span>
                <span className="block text-sm font-medium text-marinho-900 leading-snug">{c.titulo}</span>
                <span className="text-xs text-slate-400">{fmtData(c.dataPublicacao)}</span>
              </span>
            </a>
          ))}
          <a href={link("comunicados")} onClick={() => setAberto(false)} className="block text-center text-xs font-bold uppercase text-laranja-500 py-3 hover:bg-laranja-50">Ver todos</a>
        </div>
      )}
    </div>
  );
}

function Busca() {
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navegar(`destaques${q.trim() ? `/${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="hidden md:flex items-center gap-2 bg-slate-100 rounded-full px-4 h-11 w-64 focus-within:ring-2 focus-within:ring-laranja-400"
    >
      <Search className="w-4 h-4 text-slate-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar notícias…" className="bg-transparent outline-none text-sm flex-1" aria-label="Buscar notícias" />
    </form>
  );
}

function Topo({ onMenu }) {
  return (
    <div className="flex items-center gap-3 justify-between">
      <button className="lg:hidden w-11 h-11 grid place-items-center rounded-xl bg-laranja-500 text-white" onClick={onMenu} aria-label="Abrir menu">
        <Menu />
      </button>
      <div className="flex-1" />
      <Busca />
      <Notificacoes />
      <div className="flex items-center gap-3 pl-1">
        <div className="w-11 h-11 rounded-full bg-laranja-100 grid place-items-center text-laranja-600 font-bold">RJ2</div>
        <div className="leading-tight hidden sm:block">
          <div className="text-sm font-semibold text-marinho-900">Olá, time RJ2! 👋</div>
          <div className="text-xs text-slate-500">{saudacao()}!</div>
        </div>
      </div>
    </div>
  );
}

function Ticker() {
  const { daSemana, publicacoes } = useEdicao();
  const itens = (daSemana.length ? daSemana : publicacoes).slice(0, 8);
  if (!itens.length) return null;
  const linha = (chave) => (
    <div className="flex shrink-0" key={chave} aria-hidden={chave === "b"}>
      {itens.map((p) => (
        <a key={p.id + chave} href={link(`materia/${p.id}`)} tabIndex={chave === "b" ? -1 : 0} className="flex items-center gap-2 px-6 text-sm whitespace-nowrap hover:text-laranja-600">
          <span className="w-1.5 h-1.5 rounded-full bg-laranja-500" />
          {p.titulo}
        </a>
      ))}
    </div>
  );
  return (
    <div className="flex items-stretch rounded-2xl bg-white border border-slate-100 shadow-card overflow-hidden h-11">
      <div className="flex items-center gap-2 px-4 bg-marinho-900 text-white text-xs font-bold tracking-wider shrink-0">
        <Newspaper className="w-4 h-4 text-amarelo" /> <span className="hidden sm:inline">ÚLTIMAS NOTÍCIAS</span>
      </div>
      <div className="relative flex-1 overflow-hidden flex items-center group">
        <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused] text-marinho-900">
          {linha("a")}
          {linha("b")}
        </div>
      </div>
    </div>
  );
}

function AvisoEdicaoAntiga() {
  const { edicao, ehAtual, atual } = useEdicao();
  const { setEdicaoVista } = useConteudo();
  if (ehAtual) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-marinho-900 text-white px-5 py-3 animate-entrar">
      <span className="flex items-center gap-2 text-sm">
        <History className="w-4 h-4 text-amarelo" />
        Você está lendo a edição <b>{edicao.rotulo}</b> ({fmtCurta(edicao.inicio)} a {fmtCurta(edicao.fim)}).
      </span>
      <button onClick={() => setEdicaoVista(null)} className="text-xs font-bold uppercase bg-laranja-500 hover:bg-laranja-600 rounded-full px-4 py-1.5">
        Voltar para a edição atual ({atual.rotulo})
      </button>
    </div>
  );
}

function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const ao = () => setVisivel(window.scrollY > 500);
    window.addEventListener("scroll", ao, { passive: true });
    return () => window.removeEventListener("scroll", ao);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-5 bottom-5 z-30 w-12 h-12 rounded-full bg-laranja-500 text-white shadow-lg grid place-items-center transition-all hover:bg-laranja-600 ${visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      aria-label="Voltar ao topo"
    >
      <ArrowUp />
    </button>
  );
}

export default function Layout({ pagina, children }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <Sidebar pagina={pagina} aberto={menu} onFechar={() => setMenu(false)} />
      <div className="lg:pl-64">
        <main className="max-w-[1320px] mx-auto px-4 md:px-8 py-5 md:py-6 space-y-5">
          <Topo onMenu={() => setMenu(true)} />
          {pagina !== "admin" && <Ticker />}
          {pagina !== "admin" && <AvisoEdicaoAntiga />}
          {children}
          <footer className="pt-8 pb-4 text-center text-xs text-slate-400">RJ2 News · jornal interno semanal da operação RJ2</footer>
        </main>
      </div>
      <VoltarAoTopo />
    </div>
  );
}
