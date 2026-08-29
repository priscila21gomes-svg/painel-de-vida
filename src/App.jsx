import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar, Target, FolderKanban, BookOpen, HeartPulse, Repeat,
  Wallet, Sparkles, Sun, Plus, Trash2, Check, ChevronLeft, ChevronRight,
  Loader2, Briefcase, Sparkle, Image as ImageIcon, AlertTriangle, Clock,
  Home as HomeIcon, X, ShoppingBag, Link as LinkIcon, MapPin, Menu,
  Activity, Camera, Scale, Dumbbell, Flame
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ---------- palette ----------
const C = {
  ink: "#2E2A24",
  inkSoft: "#6B6255",
  cream: "#FBF6EE",
  paper: "#FFFFFF",
  line: "#EAE1D2",
  coral: "#E4694F",
  sage: "#7E9680",
  ochre: "#D3A03D",
  slate: "#6C82A6",
  rose: "#C4728A",
};

const STORAGE_KEY = "painel-da-vida:estado:v2";
const AUTH_KEY = "painel-da-vida:auth";
const EMAIL_PADRAO = "priscila.21.gomes@gmail.com";
const SENHA_PADRAO = "vida12345";

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const mesesNomes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const FRASES_SIDEBAR = [
  "Pequenos passos todos os dias levam a grandes resultados.",
  "Você merece uma vida tão organizada quanto seus sonhos são grandes.",
  "Feito é melhor que perfeito.",
  "Cuide de você com o mesmo carinho que cuida dos seus planos.",
  "Um dia de cada vez.",
];


function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function isoHoje() {
  return new Date().toISOString().slice(0, 10);
}
function fmtData(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

const defaultState = {
  nome: "Priscila",
  semana: Object.fromEntries(diasSemana.map((d) => [d, []])),
  eventos: [], // {id, titulo, data, hora, area}
  diaADia: {}, // { "YYYY-MM-DD": [{id, hora, texto, feito}] }
  metas: { "6 meses": [], "1 ano": [], "3 anos": [] }, // items: {id,texto,feito,prazo}
  projetos: [], // {id, nome, descricao, status, prazo, etapas:[{id,texto,feito,prazo}]}
  habitos: [], // {id, nome, marcados: {iso:true}}
  livros: [], // {id, nome, autor, status, capa}
  saude: { consultas: [], exames: [], remedios: [] }, // items {id,texto,feito,prazo}
  financeiro: { contas15: [], contas30: [] }, // {id, nome, pagos: {"ano-mes":true}}
  desejos: [], // {id, nome, imagem, preco, link, categoria, comprado}
  passeios: [], // {id, nome, imagem, visitado, dataVisita}
  saudavel: {
    pilares: { alimentacao: {}, exercicio: {}, jejum: {} }, // {"YYYY-MM-DD": true}
    fotos: [], // {id, tipo: "antes"|"depois", imagem, data}
    peso: [], // {id, data, valor}
    exercicios: [], // {id, texto, data}
    jejumLog: [], // {id, data, inicio, fim}
  },
  notas: "",
  pessoal: { conquistas: [], inspiracoes: [], marcos: [] },
  profissional: { todos: [] }, // {id,texto,feito,prazo}
  limpeza: {
    categorias: [
      { id: "cat-diario", nome: "Diariamente", itens: [] },
      { id: "cat-semanal", nome: "Semanalmente", itens: [] },
      { id: "cat-mensal", nome: "Mensalmente", itens: [] },
      { id: "cat-cozinha", nome: "Cozinha", itens: [] },
      { id: "cat-banheiro", nome: "Banheiros", itens: [] },
    ],
  },
  beleza: {
    categorias: [
      { id: "bel-manha", nome: "Rotina de pele — manhã", itens: [] },
      { id: "bel-noite", nome: "Rotina de pele — noite", itens: [] },
      { id: "bel-corpo", nome: "Corpo e cabelo", itens: [] },
    ],
    procedimentos: [], // {id, procedimento, profissional, valor, data}
  },
  mural: [], // {id, imagem, legenda}
};

function deepMerge(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(base)) {
    if (
      incoming[k] !== undefined &&
      typeof base[k] === "object" &&
      base[k] !== null &&
      !Array.isArray(base[k])
    ) {
      out[k] = deepMerge(base[k], incoming[k]);
    } else if (incoming[k] !== undefined) {
      out[k] = incoming[k];
    }
  }
  return out;
}

function urgencia(prazoISO) {
  if (!prazoISO) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(prazoISO + "T00:00:00");
  const diff = Math.round((alvo - hoje) / 86400000);
  if (diff < 0) return { cor: C.coral, label: "Atrasado" };
  if (diff === 0) return { cor: C.coral, label: "Hoje" };
  if (diff <= 3) return { cor: C.coral, label: `Faltam ${diff}d` };
  if (diff <= 7) return { cor: C.ochre, label: `Faltam ${diff}d` };
  return { cor: C.sage, label: fmtData(prazoISO) };
}

// ---------- building blocks ----------

function SectionHeader({ icon: Icon, title, subtitle, color }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex items-center justify-center rounded-xl w-11 h-11 shrink-0" style={{ background: color + "22", color }}>
        <Icon size={22} />
      </div>
      <div>
        <h2 className="text-xl font-semibold" style={{ color: C.ink }}>{title}</h2>
        {subtitle && <p className="text-sm" style={{ color: C.inkSoft }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div className={`rounded-2xl p-4 lg:p-5 ${className}`} style={{ background: C.paper, border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(46,42,36,0.04)", ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ children, color }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: color || C.inkSoft, letterSpacing: "0.04em" }}>
      {children}
    </h3>
  );
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-lg w-7 h-7 shrink-0 transition-colors"
      style={{ color: danger ? C.coral : C.inkSoft }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.cream)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`text-sm rounded-lg px-3 py-1.5 outline-none ${props.className || ""}`}
      style={{ border: `1px solid ${C.line}`, color: C.ink, ...(props.style || {}) }}
    />
  );
}

// Task list with checkbox, delete, and optional deadline (prazo)
function TaskList({ items, onChange, placeholder, checkable = true, accent, withDate = false, withTime = false }) {
  const [draft, setDraft] = useState("");
  const [prazo, setPrazo] = useState("");
  const [hora, setHora] = useState("");

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, { id: uid(), texto: t, feito: false, prazo: withDate ? prazo || "" : "", hora: withTime ? hora || "" : "" }]);
    setDraft("");
    setPrazo("");
    setHora("");
  };

  const toggle = (id) => onChange(items.map((it) => (it.id === id ? { ...it, feito: !it.feito } : it)));
  const remove = (id) => onChange(items.filter((it) => it.id !== id));

  const ordenados = withDate
    ? [...items].sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999"))
    : withTime
    ? [...items].sort((a, b) => (a.hora || "99:99").localeCompare(b.hora || "99:99"))
    : items;

  return (
    <div>
      <div className="flex flex-col gap-1.5 mb-2">
        {items.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nada por aqui ainda.</p>}
        {ordenados.map((it) => {
          const u = withDate ? urgencia(it.prazo) : null;
          return (
            <div key={it.id} className="flex items-center gap-2">
              {checkable && (
                <button
                  onClick={() => toggle(it.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-md shrink-0 border"
                  style={{ borderColor: it.feito ? (accent || C.sage) : C.line, background: it.feito ? (accent || C.sage) : "transparent" }}
                >
                  {it.feito && <Check size={13} color="#fff" />}
                </button>
              )}
              {withTime && it.hora && (
                <span className="text-xs font-semibold shrink-0 w-11" style={{ color: accent || C.inkSoft }}>{it.hora}</span>
              )}
              <span className="text-sm flex-1" style={{ color: it.feito ? C.inkSoft : C.ink, textDecoration: it.feito ? "line-through" : "none" }}>
                {it.texto}
              </span>
              {u && !it.feito && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: u.cor + "20", color: u.cor }}>
                  {u.label}
                </span>
              )}
              <IconBtn onClick={() => remove(it.id)} title="Remover" danger>
                <Trash2 size={14} />
              </IconBtn>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {withTime && <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-[90px]" />}
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={placeholder || "Adicionar..."} className="flex-1" />
        {withDate && (
          <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-[130px]" />
        )}
        <button onClick={add} className="flex items-center justify-center rounded-lg w-8 h-8 shrink-0" style={{ background: accent || C.coral, color: "#fff" }}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

// Image field: paste URL or upload from device (stored as data URL)
function ImageField({ value, onChange, small }) {
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <img src={value} alt="" className="rounded-lg object-cover shrink-0" style={{ width: small ? 40 : 64, height: small ? 56 : 88, border: `1px solid ${C.line}` }} />
      ) : (
        <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: small ? 40 : 64, height: small ? 56 : 88, background: C.cream, border: `1px dashed ${C.line}` }}>
          <ImageIcon size={16} color={C.inkSoft} />
        </div>
      )}
      <div className="flex flex-col gap-1 flex-1">
        <Input placeholder="Colar link da imagem" value={value && value.startsWith("http") ? value : ""} onChange={(e) => onChange(e.target.value)} />
        <button onClick={() => fileRef.current?.click()} className="text-xs self-start underline" style={{ color: C.slate }}>
          ou enviar do dispositivo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

function CategoriaChecklist({ categorias, onChange, accent }) {
  const [novaCategoria, setNovaCategoria] = useState("");

  const addCategoria = () => {
    if (!novaCategoria.trim()) return;
    onChange([...categorias, { id: uid(), nome: novaCategoria.trim(), itens: [] }]);
    setNovaCategoria("");
  };
  const removerCategoria = (id) => onChange(categorias.filter((c) => c.id !== id));
  const atualizarItens = (id, itens) => onChange(categorias.map((c) => (c.id === id ? { ...c, itens } : c)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategoria()} placeholder="Nova categoria (ex: Quarto)" className="flex-1" />
        <button onClick={addCategoria} className="rounded-lg px-3 flex items-center" style={{ background: accent, color: "#fff" }}>
          <Plus size={16} />
        </button>
      </div>
      {categorias.map((c) => (
        <Card key={c.id}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle color={accent}>{c.nome}</CardTitle>
            <IconBtn onClick={() => removerCategoria(c.id)} danger><Trash2 size={14} /></IconBtn>
          </div>
          <TaskList items={c.itens} onChange={(itens) => atualizarItens(c.id, itens)} placeholder="Adicionar item" accent={accent} />
        </Card>
      ))}
    </div>
  );
}

// ---------- sections ----------

function coletarPrazos(state) {
  const out = [];
  Object.entries(state.metas).forEach(([grupo, items]) =>
    items.forEach((it) => it.prazo && !it.feito && out.push({ texto: it.texto, prazo: it.prazo, origem: `Meta · ${grupo}`, cor: C.coral }))
  );
  state.projetos.forEach((p) => {
    if (p.prazo && p.status !== "Concluído") out.push({ texto: p.nome, prazo: p.prazo, origem: "Projeto", cor: C.ochre });
    p.etapas.forEach((e) => e.prazo && !e.feito && out.push({ texto: `${p.nome} · ${e.texto}`, prazo: e.prazo, origem: "Etapa de projeto", cor: C.ochre }));
  });
  state.saude.consultas.forEach((it) => it.prazo && !it.feito && out.push({ texto: it.texto, prazo: it.prazo, origem: "Consulta", cor: C.rose }));
  state.saude.exames.forEach((it) => it.prazo && !it.feito && out.push({ texto: it.texto, prazo: it.prazo, origem: "Exame", cor: C.rose }));
  state.profissional.todos.forEach((it) => it.prazo && !it.feito && out.push({ texto: it.texto, prazo: it.prazo, origem: "Profissional", cor: C.slate }));
  Object.entries(state.diaADia).forEach(([data, itens]) =>
    itens.forEach((it) => !it.feito && out.push({ texto: it.texto, prazo: data, origem: `Agenda · ${it.hora || ""}`, cor: C.slate }))
  );
  out.sort((a, b) => a.prazo.localeCompare(b.prazo));
  return out;
}

function calcularAderencia(habito) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const diasPassados = hoje.getDate();
  let marcados = 0;
  for (let d = 1; d <= diasPassados; d++) {
    const iso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (habito.marcados[iso]) marcados++;
  }
  return diasPassados > 0 ? Math.round((marcados / diasPassados) * 100) : 0;
}

function Hoje({ state, update, setTab }) {
  const hoje = new Date();
  const hojeISO = isoHoje();
  const horaAtual = hoje.getHours();
  const saudacao = horaAtual < 12 ? "Bom dia" : horaAtual < 18 ? "Boa tarde" : "Boa noite";
  const dataFmt = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const frases = [
    "Pequenos passos todos os dias levam a grandes resultados.",
    "Você não precisa ser perfeita, só precisa continuar tentando.",
    "Organize hoje o que sua vida de amanhã vai agradecer.",
    "Feito é melhor que perfeito.",
    "Um dia de cada vez, um passo de cada vez.",
    "Sua constância vale mais que sua intensidade.",
    "Cuide de você com o mesmo carinho que cuida dos seus planos.",
  ];
  const frase = frases[hoje.getDate() % frases.length];

  const todosPrazos = coletarPrazos(state);
  const prazos = todosPrazos.slice(0, 5);
  const prazosAtrasados = todosPrazos.filter((p) => urgencia(p.prazo)?.label === "Atrasado").length;

  // faixa de dias para editar a agenda rapidamente
  const [selecionado, setSelecionado] = useState(hojeISO);
  const faixaDias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 3 + i);
    return d.toISOString().slice(0, 10);
  });
  const temConteudoDia = (iso) => state.eventos.some((e) => e.data === iso) || (state.diaADia[iso] || []).length > 0;

  // hábitos da semana atual
  const inicioSemanaAtual = (() => {
    const d = new Date(hoje);
    const dia = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dia);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const semanaAtualDias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemanaAtual);
    d.setDate(inicioSemanaAtual.getDate() + i);
    return d;
  });
  const toggleHabitoDia = (habitoId, iso) =>
    update((s) => ({ ...s, habitos: s.habitos.map((h) => (h.id === habitoId ? { ...h, marcados: { ...h.marcados, [iso]: !h.marcados[iso] } } : h)) }));

  const tiles = [
    { label: "Saúde", icon: HeartPulse, cor: C.rose, tab: "saude" },
    { label: "Beleza", icon: Sparkle, cor: C.rose, tab: "beleza" },
    { label: "Casa", icon: HomeIcon, cor: C.ochre, tab: "limpeza" },
    { label: "Passeios", icon: MapPin, cor: C.slate, tab: "passeios" },
    { label: "Desejos", icon: ShoppingBag, cor: C.rose, tab: "desejos" },
    { label: "Financeiro", icon: Wallet, cor: C.ochre, tab: "financeiro" },
  ];

  const projetosDestaque = state.projetos
    .filter((p) => p.status !== "Concluído")
    .slice(0, 4)
    .map((p) => ({ ...p, pct: p.etapas.length ? Math.round((p.etapas.filter((e) => e.feito).length / p.etapas.length) * 100) : 0 }));

  const tarefasAbertas = [
    ...state.profissional.todos.filter((t) => !t.feito).map((t) => ({ texto: t.texto, area: "Trabalho", prazo: t.prazo, cor: C.slate })),
    ...state.projetos.flatMap((p) => p.etapas.filter((e) => !e.feito).map((e) => ({ texto: e.texto, area: p.nome, prazo: e.prazo, cor: C.ochre }))),
  ]
    .sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999"))
    .slice(0, 6);

  const livroAtual = state.livros.find((l) => l.status === "Lendo");
  const muralPreview = state.mural.slice(0, 3);

  return (
    <div>
      {/* topo — boas vindas */}
      <div className="relative overflow-hidden rounded-3xl mb-5 p-6 lg:p-8" style={{ background: `linear-gradient(135deg, ${C.rose}20, ${C.coral}14, ${C.cream})`, border: `1px solid ${C.line}` }}>
        <Sparkles size={90} color={C.rose} style={{ position: "absolute", top: -20, right: -20, opacity: 0.12 }} />
        <div className="flex items-start justify-between gap-4 relative">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: C.inkSoft }}>{dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1)}</p>
            <h2 className="text-3xl lg:text-4xl font-semibold mt-1 flex items-center flex-wrap" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>
              {saudacao},&nbsp;
              <input
                value={state.nome}
                onChange={(e) => update((s) => ({ ...s, nome: e.target.value }))}
                className="outline-none bg-transparent"
                style={{ fontFamily: "inherit", fontSize: "inherit", fontWeight: "inherit", color: "inherit", width: `${Math.max(state.nome.length, 3) + 1}ch` }}
              />
            </h2>
            <p className="text-sm italic mt-2 max-w-xs" style={{ color: C.inkSoft }}>"{frase}"</p>
          </div>
          <div className="rounded-2xl px-4 py-3 text-center shrink-0" style={{ background: C.coral, color: "#fff" }}>
            <div className="text-[10px] uppercase tracking-wide" style={{ opacity: 0.85 }}>{mesesNomes[hoje.getMonth()].slice(0, 3)}</div>
            <div className="text-2xl font-bold leading-none my-0.5">{hoje.getDate()}</div>
            <div className="text-[10px]" style={{ opacity: 0.85 }}>{diasSemana[(hoje.getDay() + 6) % 7].slice(0, 3)}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-5 relative">
          {[
            { icon: Calendar, texto: "Planeje seu dia" },
            { icon: Target, texto: "Conquiste metas" },
            { icon: Repeat, texto: "Construa hábitos" },
            { icon: HeartPulse, texto: "Cuide de você" },
            { icon: Sparkles, texto: "Realize sonhos" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: C.paper, color: C.inkSoft, border: `1px solid ${C.line}` }}>
              <f.icon size={12} color={C.rose} /> {f.texto}
            </div>
          ))}
        </div>
      </div>

      {prazosAtrasados > 0 && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 text-sm" style={{ background: C.coral + "18", color: C.coral }}>
          <AlertTriangle size={16} />
          Você tem {prazosAtrasados} prazo{prazosAtrasados > 1 ? "s" : ""} atrasado{prazosAtrasados > 1 ? "s" : ""}.
        </div>
      )}

      {/* atalhos visuais */}
      <div className="pv-tiles-grid mb-5">
        {tiles.map((t) => (
          <button key={t.label} onClick={() => setTab(t.tab)} className="rounded-2xl flex flex-col items-center justify-center gap-2 py-5" style={{ background: t.cor + "14", border: `1px solid ${t.cor}30` }}>
            <t.icon size={26} color={t.cor} />
            <span className="text-xs font-medium" style={{ color: t.cor }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* corpo principal em duas colunas nas telas grandes */}
      <div className="pv-bento">
        <div className="pv-bento-main">
          {/* projetos em destaque */}
          <Card>
            <CardTitle color={C.ochre}>Projetos em destaque</CardTitle>
            {projetosDestaque.length === 0 ? (
              <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum projeto ativo. Crie um na aba Projetos.</p>
            ) : (
              <div className="pv-projetos-grid">
                {projetosDestaque.map((p) => (
                  <button key={p.id} onClick={() => setTab("projetos")} className="text-left rounded-xl p-3" style={{ background: C.cream }}>
                    <div className="text-sm font-medium truncate" style={{ color: C.ink }}>{p.nome}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: C.inkSoft }}>{p.prazo ? `até ${fmtData(p.prazo)}` : "sem prazo definido"}</div>
                    <div className="w-full h-1.5 rounded-full mt-2" style={{ background: C.line }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: C.ochre }} />
                    </div>
                    <div className="text-[10px] mt-1 font-medium" style={{ color: C.ochre }}>{p.pct}% concluído</div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* tarefas abertas + prazos */}
          <div className="pv-tarefas-grid">
            <Card>
              <CardTitle color={C.slate}>Tarefas em aberto</CardTitle>
              {tarefasAbertas.length === 0 ? (
                <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhuma tarefa pendente por aqui.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {tarefasAbertas.map((t, i) => {
                    const u = urgencia(t.prazo);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate" style={{ color: C.ink }}>{t.texto}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: t.cor + "18", color: t.cor }}>{t.area}</span>
                        {u && <span className="text-[10px] font-semibold shrink-0" style={{ color: u.cor }}>{u.label}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <CardTitle color={C.coral}>Prazos que vêm por aí</CardTitle>
              {prazos.length === 0 ? (
                <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum prazo cadastrado ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {prazos.map((p, i) => {
                    const u = urgencia(p.prazo);
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: u.cor + "20", color: u.cor }}>{u.label}</span>
                        <span className="flex-1 truncate" style={{ color: C.ink }}>{p.texto}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* sua semana — em formato de calendário */}
          <button onClick={() => setTab("semana")} className="text-left">
            <Card>
              <CardTitle color={C.coral}>Sua semana</CardTitle>
              <div className="grid grid-cols-7 gap-1.5">
                {diasSemana.map((dia, i) => {
                  const ehHoje = i === (hoje.getDay() + 6) % 7;
                  const tarefasDia = [...(state.semana[dia] || [])].sort((a, b) => (a.hora || "99:99").localeCompare(b.hora || "99:99"));
                  return (
                    <div key={dia} className="rounded-lg p-1.5 flex flex-col gap-1 min-h-[92px]" style={{ background: ehHoje ? C.coral + "10" : C.cream, border: ehHoje ? `1px solid ${C.coral}40` : `1px solid ${C.line}` }}>
                      <div className="text-[10px] font-semibold text-center" style={{ color: ehHoje ? C.coral : C.inkSoft }}>{dia.slice(0, 3)}</div>
                      <div className="flex flex-col gap-0.5">
                        {tarefasDia.slice(0, 3).map((t) => (
                          <div key={t.id} className="text-[9px] leading-tight rounded px-1 py-0.5 truncate" style={{ background: C.paper, color: t.feito ? C.inkSoft : C.ink, textDecoration: t.feito ? "line-through" : "none" }}>
                            {t.hora && <span style={{ color: C.coral, fontWeight: 600 }}>{t.hora} </span>}{t.texto}
                          </div>
                        ))}
                        {tarefasDia.length === 0 && <div className="text-[9px] italic text-center mt-1" style={{ color: C.inkSoft }}>—</div>}
                        {tarefasDia.length > 3 && <div className="text-[9px] text-center" style={{ color: C.inkSoft }}>+{tarefasDia.length - 3}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </button>

          {/* hábitos da semana */}
          <Card>
            <CardTitle color={C.sage}>Hábitos desta semana</CardTitle>
            {state.habitos.length === 0 ? (
              <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum hábito cadastrado. Crie um na aba Hábitos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left font-normal" style={{ color: C.inkSoft }}></th>
                      {semanaAtualDias.map((d, i) => (
                        <th key={i} className="font-normal text-center px-0.5" style={{ color: d.toISOString().slice(0, 10) === hojeISO ? C.sage : C.inkSoft }}>
                          {["S", "T", "Q", "Q", "S", "S", "D"][i]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.habitos.map((h) => (
                      <tr key={h.id}>
                        <td className="text-xs pr-2 py-1 truncate max-w-[110px]" style={{ color: C.ink }}>{h.nome}</td>
                        {semanaAtualDias.map((d, i) => {
                          const iso = d.toISOString().slice(0, 10);
                          const marcado = !!h.marcados[iso];
                          return (
                            <td key={i} className="text-center py-1">
                              <button onClick={() => toggleHabitoDia(h.id, iso)} className="w-5 h-5 rounded-full inline-flex items-center justify-center" style={{ background: marcado ? C.sage : C.cream, border: `1px solid ${marcado ? C.sage : C.line}` }}>
                                {marcado && <Check size={11} color="#fff" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* calendário editável do dia */}
          <Card>
            <CardTitle color={C.slate}>Meu calendário</CardTitle>
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {faixaDias.map((iso) => {
                const d = new Date(iso + "T00:00:00");
                const ativo = iso === selecionado;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelecionado(iso)}
                    className="flex flex-col items-center justify-center rounded-xl shrink-0 w-12 py-1.5"
                    style={{ background: ativo ? C.slate : temConteudoDia(iso) ? C.slate + "18" : C.cream, border: iso === hojeISO && !ativo ? `1px solid ${C.slate}` : "1px solid transparent" }}
                  >
                    <span className="text-[10px]" style={{ color: ativo ? "#fff" : C.inkSoft }}>{["S", "T", "Q", "Q", "S", "S", "D"][(d.getDay() + 6) % 7]}</span>
                    <span className="text-sm font-semibold" style={{ color: ativo ? "#fff" : C.ink }}>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <DiaDetalhe iso={selecionado} state={state} update={update} />
          </Card>
        </div>

        {/* coluna lateral */}
        <div className="pv-bento-side">
          <button onClick={() => setTab("livros")} className="text-left">
            <Card>
              <CardTitle color={C.slate}>Lendo agora</CardTitle>
              {livroAtual ? (
                <div className="flex gap-2 items-center">
                  {livroAtual.capa ? (
                    <img src={livroAtual.capa} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 40, height: 56, border: `1px solid ${C.line}` }} />
                  ) : (
                    <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 40, height: 56, background: C.cream }}>
                      <BookOpen size={16} color={C.inkSoft} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm truncate" style={{ color: C.ink }}>{livroAtual.nome}</div>
                    {livroAtual.autor && <div className="text-xs truncate" style={{ color: C.inkSoft }}>{livroAtual.autor}</div>}
                  </div>
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum livro em andamento.</p>
              )}
            </Card>
          </button>

          <Card>
            <CardTitle color={C.ochre}>Notas rápidas</CardTitle>
            <textarea
              value={state.notas}
              onChange={(e) => update((s) => ({ ...s, notas: e.target.value }))}
              placeholder="Anote o que vier à cabeça..."
              className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none"
              style={{ border: `1px solid ${C.line}`, color: C.ink, minHeight: 90, background: C.ochre + "0a" }}
            />
          </Card>

          <button onClick={() => setTab("metas")} className="text-left">
            <Card>
              <CardTitle color={C.rose}>Metas em foco</CardTitle>
              {Object.values(state.metas).flat().filter((m) => !m.feito).length === 0 ? (
                <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhuma meta em aberto.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Object.entries(state.metas).flatMap(([grupo, items]) => items.filter((m) => !m.feito).map((m) => ({ ...m, grupo }))).slice(0, 6).map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.rose }} />
                      <span className="flex-1 truncate" style={{ color: C.ink }}>{m.texto}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </button>

          <button onClick={() => setTab("mural")} className="text-left">
            <Card>
              <CardTitle color={C.coral}>Mural dos sonhos</CardTitle>
              {muralPreview.length === 0 ? (
                <p className="text-sm italic" style={{ color: C.inkSoft }}>Adicione imagens do que te inspira na aba Mural.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {muralPreview.map((m) => (
                    <img key={m.id} src={m.imagem} alt="" className="rounded-lg object-cover w-full" style={{ height: 70 }} />
                  ))}
                </div>
              )}
            </Card>
          </button>

          <button onClick={() => setTab("passeios")} className="text-left">
            <Card>
              <CardTitle color={C.slate}>Próximos passeios</CardTitle>
              {state.passeios.filter((p) => !p.visitado).length === 0 ? (
                <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum lugar na lista ainda.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {state.passeios.filter((p) => !p.visitado).slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <MapPin size={12} color={C.slate} className="shrink-0" />
                      <span className="flex-1 truncate" style={{ color: C.ink }}>{p.nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-6 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        {["organize melhor", "viva com leveza", "celebre conquistas", "cuide de você", "sonhe grande"].map((f, i) => (
          <span key={i} className="text-[11px]" style={{ color: C.inkSoft }}>✦ {f}</span>
        ))}
      </div>
    </div>
  );
}

function Semana({ state, update }) {
  const [textoRepete, setTextoRepete] = useState("");
  const [horaRepete, setHoraRepete] = useState("");
  const [diasSelecionados, setDiasSelecionados] = useState([]);

  const toggleDiaSelecionado = (dia) =>
    setDiasSelecionados((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));

  const adicionarRecorrente = () => {
    if (!textoRepete.trim() || diasSelecionados.length === 0) return;
    update((s) => {
      const novaSemana = { ...s.semana };
      diasSelecionados.forEach((dia) => {
        novaSemana[dia] = [...(novaSemana[dia] || []), { id: uid(), texto: textoRepete.trim(), feito: false, prazo: "", hora: horaRepete || "" }];
      });
      return { ...s, semana: novaSemana };
    });
    setTextoRepete("");
    setHoraRepete("");
    setDiasSelecionados([]);
  };

  return (
    <div>
      <SectionHeader icon={Sun} title="Rotina semanal" subtitle="O que se repete toda semana" color={C.coral} />

      <Card className="mb-4">
        <CardTitle color={C.coral}>Repetir tarefa em vários dias</CardTitle>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {diasSemana.map((dia) => {
            const ativo = diasSelecionados.includes(dia);
            return (
              <button
                key={dia}
                onClick={() => toggleDiaSelecionado(dia)}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: ativo ? C.coral : C.cream, color: ativo ? "#fff" : C.inkSoft, border: `1px solid ${ativo ? C.coral : C.line}` }}
              >
                {dia.slice(0, 3)}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input type="time" value={horaRepete} onChange={(e) => setHoraRepete(e.target.value)} className="w-[90px]" />
          <Input value={textoRepete} onChange={(e) => setTextoRepete(e.target.value)} onKeyDown={(e) => e.key === "Enter" && adicionarRecorrente()} placeholder="Nome da tarefa" className="flex-1" />
          <button onClick={adicionarRecorrente} className="flex items-center justify-center rounded-lg w-8 h-8 shrink-0" style={{ background: C.coral, color: "#fff" }}>
            <Plus size={16} />
          </button>
        </div>
        {diasSelecionados.length === 0 && <p className="text-xs italic mt-2" style={{ color: C.inkSoft }}>Selecione os dias em que essa tarefa deve aparecer.</p>}
      </Card>

      <div className="flex flex-col gap-4">
        {diasSemana.map((dia, i) => {
          const cores = [C.coral, C.ochre, C.sage, C.slate, C.coral, C.ochre, C.sage];
          const cor = cores[i];
          return (
            <Card key={dia}>
              <CardTitle color={cor}>{dia}</CardTitle>
              <TaskList items={state.semana[dia] || []} onChange={(items) => update((s) => ({ ...s, semana: { ...s.semana, [dia]: items } }))} placeholder="Adicionar tarefa só neste dia" accent={cor} withTime />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DiaDetalhe({ iso, state, update }) {
  const itens = state.diaADia[iso] || [];
  const eventosDoDia = state.eventos.filter((e) => e.data === iso);
  const [hora, setHora] = useState("08:00");
  const [texto, setTexto] = useState("");
  const [novoEventoTitulo, setNovoEventoTitulo] = useState("");
  const [novoEventoArea, setNovoEventoArea] = useState("");

  const addBloco = () => {
    if (!texto.trim()) return;
    const novos = [...itens, { id: uid(), hora, texto: texto.trim(), feito: false }].sort((a, b) => a.hora.localeCompare(b.hora));
    update((s) => ({ ...s, diaADia: { ...s.diaADia, [iso]: novos } }));
    setTexto("");
  };
  const toggleBloco = (id) => update((s) => ({ ...s, diaADia: { ...s.diaADia, [iso]: (s.diaADia[iso] || []).map((b) => (b.id === id ? { ...b, feito: !b.feito } : b)) } }));
  const removeBloco = (id) => update((s) => ({ ...s, diaADia: { ...s.diaADia, [iso]: (s.diaADia[iso] || []).filter((b) => b.id !== id) } }));

  const addEvento = () => {
    if (!novoEventoTitulo.trim()) return;
    update((s) => ({ ...s, eventos: [...s.eventos, { id: uid(), titulo: novoEventoTitulo.trim(), data: iso, area: novoEventoArea.trim() }] }));
    setNovoEventoTitulo("");
    setNovoEventoArea("");
  };
  const removeEvento = (id) => update((s) => ({ ...s, eventos: s.eventos.filter((e) => e.id !== id) }));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardTitle color={C.slate}>Meu dia — {fmtData(iso)}</CardTitle>
        <div className="flex flex-col gap-1.5 mb-2">
          {itens.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum horário planejado ainda.</p>}
          {itens.map((b) => (
            <div key={b.id} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-12 shrink-0" style={{ color: C.slate }}>{b.hora}</span>
              <button onClick={() => toggleBloco(b.id)} className="w-5 h-5 rounded-md border shrink-0 flex items-center justify-center" style={{ borderColor: b.feito ? C.slate : C.line, background: b.feito ? C.slate : "transparent" }}>
                {b.feito && <Check size={13} color="#fff" />}
              </button>
              <span className="text-sm flex-1" style={{ color: b.feito ? C.inkSoft : C.ink, textDecoration: b.feito ? "line-through" : "none" }}>{b.texto}</span>
              <IconBtn onClick={() => removeBloco(b.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-[90px]" />
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBloco()} placeholder="O que você vai fazer" className="flex-1" />
          <button onClick={addBloco} className="rounded-lg w-8 h-8 flex items-center justify-center shrink-0" style={{ background: C.slate, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>

      <Card>
        <CardTitle color={C.coral}>Eventos deste dia</CardTitle>
        <div className="flex flex-col gap-2 mb-2">
          {eventosDoDia.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum evento marcado.</p>}
          {eventosDoDia.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: C.coral }} />
              <span className="flex-1" style={{ color: C.ink }}>{e.titulo}</span>
              {e.area && <span className="text-xs" style={{ color: C.inkSoft }}>{e.area}</span>}
              <IconBtn onClick={() => removeEvento(e.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={novoEventoTitulo} onChange={(e) => setNovoEventoTitulo(e.target.value)} placeholder="Novo evento" className="flex-1" />
          <Input value={novoEventoArea} onChange={(e) => setNovoEventoArea(e.target.value)} placeholder="Área" className="w-[90px]" />
          <button onClick={addEvento} className="rounded-lg w-8 h-8 flex items-center justify-center shrink-0" style={{ background: C.coral, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>
    </div>
  );
}

function CalendarioTab({ state, update }) {
  const [mesRef, setMesRef] = useState(() => { const d = new Date(); return { ano: d.getFullYear(), mes: d.getMonth() }; });
  const [diaSelecionado, setDiaSelecionado] = useState(isoHoje());

  const primeiroDiaSemana = (new Date(mesRef.ano, mesRef.mes, 1).getDay() + 6) % 7;
  const totalDias = new Date(mesRef.ano, mesRef.mes + 1, 0).getDate();
  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDias; d++) celulas.push(d);

  const isoDoDia = (d) => `${mesRef.ano}-${String(mesRef.mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const temConteudo = (iso) => (state.eventos.some((e) => e.data === iso) || (state.diaADia[iso] || []).length > 0);

  return (
    <div>
      <SectionHeader icon={Calendar} title="Calendário" subtitle="Seu dia a dia, evento por evento" color={C.slate} />

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <IconBtn onClick={() => setMesRef((m) => (m.mes === 0 ? { ano: m.ano - 1, mes: 11 } : { ...m, mes: m.mes - 1 }))}><ChevronLeft size={18} /></IconBtn>
          <span className="text-sm font-semibold" style={{ color: C.ink }}>{mesesNomes[mesRef.mes]} {mesRef.ano}</span>
          <IconBtn onClick={() => setMesRef((m) => (m.mes === 11 ? { ano: m.ano + 1, mes: 0 } : { ...m, mes: m.mes + 1 }))}><ChevronRight size={18} /></IconBtn>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((l, i) => <div key={i} className="text-xs font-medium" style={{ color: C.inkSoft }}>{l}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celulas.map((dia, i) => {
            if (!dia) return <div key={i} />;
            const iso = isoDoDia(dia);
            const selecionado = iso === diaSelecionado;
            const hoje = iso === isoHoje();
            return (
              <button
                key={i}
                onClick={() => setDiaSelecionado(iso)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative"
                style={{
                  background: selecionado ? C.slate : temConteudo(iso) ? C.slate + "18" : "transparent",
                  color: selecionado ? "#fff" : C.ink,
                  border: hoje && !selecionado ? `1px solid ${C.slate}` : "none",
                }}
              >
                {dia}
                {temConteudo(iso) && !selecionado && <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: C.slate }} />}
              </button>
            );
          })}
        </div>
      </Card>

      <DiaDetalhe iso={diaSelecionado} state={state} update={update} />
    </div>
  );
}

function Metas({ state, update }) {
  const grupos = [{ chave: "6 meses", cor: C.coral }, { chave: "1 ano", cor: C.ochre }, { chave: "3 anos", cor: C.slate }];
  return (
    <div>
      <SectionHeader icon={Target} title="Metas" subtitle="Onde você quer chegar, com prazo" color={C.coral} />
      <div className="flex flex-col gap-4">
        {grupos.map((g) => (
          <Card key={g.chave}>
            <CardTitle color={g.cor}>{g.chave}</CardTitle>
            <TaskList items={state.metas[g.chave]} onChange={(items) => update((s) => ({ ...s, metas: { ...s.metas, [g.chave]: items } }))} placeholder="Adicionar meta" accent={g.cor} withDate />
          </Card>
        ))}
      </div>
    </div>
  );
}

function Projetos({ state, update }) {
  const [novoNome, setNovoNome] = useState("");
  const addProjeto = () => {
    if (!novoNome.trim()) return;
    update((s) => ({ ...s, projetos: [...s.projetos, { id: uid(), nome: novoNome.trim(), descricao: "", status: "Em andamento", prazo: "", etapas: [] }] }));
    setNovoNome("");
  };
  const removerProjeto = (id) => update((s) => ({ ...s, projetos: s.projetos.filter((p) => p.id !== id) }));
  const atualizarProjeto = (id, campo, valor) => update((s) => ({ ...s, projetos: s.projetos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)) }));

  return (
    <div>
      <SectionHeader icon={FolderKanban} title="Projetos" subtitle="Do que você está tocando com as próprias mãos" color={C.ochre} />
      <Card className="mb-4">
        <div className="flex gap-2">
          <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addProjeto()} placeholder="Nome do novo projeto" className="flex-1" />
          <button onClick={addProjeto} className="rounded-lg px-3 flex items-center" style={{ background: C.ochre, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>

      {state.projetos.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum projeto cadastrado ainda.</p>}

      <div className="flex flex-col gap-4">
        {state.projetos.map((p) => {
          const u = urgencia(p.prazo);
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <input value={p.nome} onChange={(e) => atualizarProjeto(p.id, "nome", e.target.value)} className="text-base font-semibold flex-1 outline-none bg-transparent" style={{ color: C.ink }} />
                <IconBtn onClick={() => removerProjeto(p.id)} danger><Trash2 size={15} /></IconBtn>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <select value={p.status} onChange={(e) => atualizarProjeto(p.id, "status", e.target.value)} className="text-xs rounded-full px-2.5 py-1 outline-none" style={{ background: C.ochre + "22", color: C.ochre, border: "none" }}>
                  <option>Planejando</option><option>Em andamento</option><option>Pausado</option><option>Concluído</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: C.inkSoft }}>Prazo final:</span>
                  <Input type="date" value={p.prazo} onChange={(e) => atualizarProjeto(p.id, "prazo", e.target.value)} className="text-xs" />
                  {u && p.status !== "Concluído" && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: u.cor + "20", color: u.cor }}>{u.label}</span>}
                </div>
              </div>
              <textarea value={p.descricao} onChange={(e) => atualizarProjeto(p.id, "descricao", e.target.value)} placeholder="Do que se trata esse projeto?" className="w-full text-sm rounded-lg px-3 py-2 outline-none resize-none mb-3" style={{ border: `1px solid ${C.line}`, color: C.ink }} rows={2} />
              <CardTitle>Etapas</CardTitle>
              <TaskList items={p.etapas} onChange={(items) => atualizarProjeto(p.id, "etapas", items)} placeholder="Adicionar etapa" accent={C.ochre} withDate />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Profissional({ state, update }) {
  const eventosTrabalho = [...state.eventos]
    .filter((e) => (e.area || "").toLowerCase().includes("trab") || (e.area || "").toLowerCase().includes("profiss"))
    .sort((a, b) => a.data.localeCompare(b.data));
  const [novoEvento, setNovoEvento] = useState("");
  const [novaData, setNovaData] = useState(isoHoje());

  const addEvento = () => {
    if (!novoEvento.trim()) return;
    update((s) => ({ ...s, eventos: [...s.eventos, { id: uid(), titulo: novoEvento.trim(), data: novaData, area: "Trabalho" }] }));
    setNovoEvento("");
  };
  const removerEvento = (id) => update((s) => ({ ...s, eventos: s.eventos.filter((e) => e.id !== id) }));

  return (
    <div>
      <SectionHeader icon={Briefcase} title="Vida profissional" subtitle="To-dos e agenda de trabalho, com prazo" color={C.slate} />

      <Card className="mb-4">
        <CardTitle color={C.slate}>To-do list</CardTitle>
        <TaskList items={state.profissional.todos} onChange={(items) => update((s) => ({ ...s, profissional: { ...s.profissional, todos: items } }))} placeholder="Adicionar tarefa de trabalho" accent={C.slate} withDate />
      </Card>

      <Card>
        <CardTitle color={C.slate}>Agenda profissional</CardTitle>
        <div className="flex flex-col gap-2 mb-3">
          {eventosTrabalho.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum compromisso de trabalho marcado. Eventos com área "Trabalho" aparecem aqui.</p>}
          {eventosTrabalho.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="text-xs shrink-0 w-20" style={{ color: C.inkSoft }}>{fmtData(e.data)}</span>
              <span className="flex-1" style={{ color: C.ink }}>{e.titulo}</span>
              <IconBtn onClick={() => removerEvento(e.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={novoEvento} onChange={(e) => setNovoEvento(e.target.value)} placeholder="Novo compromisso" className="flex-1" />
          <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
          <button onClick={addEvento} className="rounded-lg w-8 h-8 flex items-center justify-center shrink-0" style={{ background: C.slate, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>
    </div>
  );
}

function Habitos({ state, update }) {
  const [novo, setNovo] = useState("");
  const hoje = new Date();
  const ano = hoje.getFullYear(), mes = hoje.getMonth();
  const dias = new Date(ano, mes + 1, 0).getDate();
  const diasArr = Array.from({ length: dias }, (_, i) => i + 1);

  const addHabito = () => {
    if (!novo.trim()) return;
    update((s) => ({ ...s, habitos: [...s.habitos, { id: uid(), nome: novo.trim(), marcados: {} }] }));
    setNovo("");
  };
  const toggleDia = (habitoId, dia) => {
    const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    update((s) => ({ ...s, habitos: s.habitos.map((h) => (h.id === habitoId ? { ...h, marcados: { ...h.marcados, [iso]: !h.marcados[iso] } } : h)) }));
  };
  const removerHabito = (id) => update((s) => ({ ...s, habitos: s.habitos.filter((h) => h.id !== id) }));

  const corAderencia = (pct) => (pct >= 80 ? C.sage : pct >= 50 ? C.ochre : C.coral);

  return (
    <div>
      <SectionHeader icon={Repeat} title="Hábitos" subtitle={`Checklist e % de aderência de ${mesesNomes[mes]}`} color={C.sage} />
      <Card className="mb-4">
        <div className="flex gap-2">
          <Input value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabito()} placeholder="Novo hábito (ex: beber água)" className="flex-1" />
          <button onClick={addHabito} className="rounded-lg px-3 flex items-center" style={{ background: C.sage, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>

      {state.habitos.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum hábito cadastrado ainda.</p>}

      <div className="flex flex-col gap-3">
        {state.habitos.map((h) => {
          const pct = calcularAderencia(h);
          const cor = corAderencia(pct);
          return (
            <Card key={h.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold" style={{ color: C.ink }}>{h.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: cor }}>{pct}%</span>
                  <IconBtn onClick={() => removerHabito(h.id)} danger><Trash2 size={14} /></IconBtn>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full mb-3" style={{ background: C.cream }}>
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: cor }} />
              </div>
              <div className="flex flex-wrap gap-1">
                {diasArr.map((d) => {
                  const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const marcado = !!h.marcados[iso];
                  return (
                    <button key={d} onClick={() => toggleDia(h.id, d)} className="w-6 h-6 rounded-md text-[10px] flex items-center justify-center" style={{ background: marcado ? C.sage : C.cream, color: marcado ? "#fff" : C.inkSoft, border: `1px solid ${marcado ? C.sage : C.line}` }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Livros({ state, update }) {
  const [novo, setNovo] = useState({ nome: "", autor: "", capa: "" });
  const add = () => {
    if (!novo.nome.trim()) return;
    update((s) => ({ ...s, livros: [...s.livros, { id: uid(), nome: novo.nome.trim(), autor: novo.autor.trim(), status: "Quero ler", capa: novo.capa }] }));
    setNovo({ nome: "", autor: "", capa: "" });
  };
  const atualizar = (id, campo, valor) => update((s) => ({ ...s, livros: s.livros.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)) }));
  const remover = (id) => update((s) => ({ ...s, livros: s.livros.filter((l) => l.id !== id) }));

  const grupos = ["Quero ler", "Lendo", "Concluído"];

  return (
    <div>
      <SectionHeader icon={BookOpen} title="Livros" subtitle="Sua estante, com capa e tudo" color={C.slate} />
      <Card className="mb-4">
        <CardTitle color={C.slate}>Adicionar livro</CardTitle>
        <div className="flex flex-col gap-2">
          <ImageField value={novo.capa} onChange={(v) => setNovo({ ...novo, capa: v })} />
          <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Título do livro" />
          <div className="flex gap-2">
            <Input value={novo.autor} onChange={(e) => setNovo({ ...novo, autor: e.target.value })} placeholder="Autor(a)" className="flex-1" />
            <button onClick={add} className="rounded-lg px-3 flex items-center" style={{ background: C.slate, color: "#fff" }}><Plus size={16} /></button>
          </div>
        </div>
      </Card>

      {grupos.map((g) => {
        const lista = state.livros.filter((l) => l.status === g);
        return (
          <Card key={g} className="mb-3">
            <CardTitle color={C.slate}>{g} {lista.length > 0 && `(${lista.length})`}</CardTitle>
            {lista.length === 0 && <p className="text-xs italic" style={{ color: C.inkSoft }}>Vazio</p>}
            <div className="grid grid-cols-2 gap-3">
              {lista.map((l) => (
                <div key={l.id} className="flex gap-2 items-start">
                  {l.capa ? (
                    <img src={l.capa} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 62, border: `1px solid ${C.line}` }} />
                  ) : (
                    <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 44, height: 62, background: C.cream }}>
                      <BookOpen size={16} color={C.inkSoft} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: C.ink }}>{l.nome}</div>
                    {l.autor && <div className="text-xs truncate" style={{ color: C.inkSoft }}>{l.autor}</div>}
                    <select value={l.status} onChange={(e) => atualizar(l.id, "status", e.target.value)} className="text-[11px] rounded-md px-1 py-0.5 outline-none mt-1" style={{ border: `1px solid ${C.line}` }}>
                      {grupos.map((gg) => <option key={gg}>{gg}</option>)}
                    </select>
                    <button onClick={() => remover(l.id)} className="text-[11px] ml-2" style={{ color: C.coral }}>remover</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Saude({ state, update }) {
  const campos = [
    { chave: "consultas", label: "Consultas", cor: C.slate },
    { chave: "exames", label: "Exames", cor: C.rose },
    { chave: "remedios", label: "Remédios e suplementos", cor: C.sage },
  ];
  return (
    <div>
      <SectionHeader icon={HeartPulse} title="Saúde" subtitle="Cuidando de você, com prazo" color={C.rose} />
      <div className="flex flex-col gap-4">
        {campos.map((c) => (
          <Card key={c.chave}>
            <CardTitle color={c.cor}>{c.label}</CardTitle>
            <TaskList items={state.saude[c.chave]} onChange={(items) => update((s) => ({ ...s, saude: { ...s.saude, [c.chave]: items } }))} placeholder={`Adicionar ${c.label.toLowerCase()}`} accent={c.cor} withDate={c.chave !== "remedios"} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function Beleza({ state, update }) {
  const [novoProc, setNovoProc] = useState({ procedimento: "", profissional: "", valor: "", data: "" });

  const addProc = () => {
    if (!novoProc.procedimento.trim()) return;
    update((s) => ({ ...s, beleza: { ...s.beleza, procedimentos: [...s.beleza.procedimentos, { id: uid(), ...novoProc }] } }));
    setNovoProc({ procedimento: "", profissional: "", valor: "", data: "" });
  };
  const removerProc = (id) => update((s) => ({ ...s, beleza: { ...s.beleza, procedimentos: s.beleza.procedimentos.filter((p) => p.id !== id) } }));

  return (
    <div>
      <SectionHeader icon={Sparkle} title="Beleza" subtitle="Rotinas de cuidado e procedimentos" color={C.rose} />
      <CategoriaChecklist categorias={state.beleza.categorias} onChange={(categorias) => update((s) => ({ ...s, beleza: { ...s.beleza, categorias } }))} accent={C.rose} />

      <Card className="mt-4">
        <CardTitle color={C.rose}>Procedimentos estéticos</CardTitle>
        <div className="flex flex-col gap-2 mb-3">
          {state.beleza.procedimentos.length === 0 && <p className="text-xs italic" style={{ color: C.inkSoft }}>Nenhum procedimento registrado.</p>}
          {state.beleza.procedimentos.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1">
                <span style={{ color: C.ink }}>{p.procedimento}</span>
                <span className="text-xs ml-1" style={{ color: C.inkSoft }}>{p.profissional && `· ${p.profissional}`} {p.data && `· ${fmtData(p.data)}`}</span>
              </div>
              {p.valor && <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>R$ {p.valor}</span>}
              <IconBtn onClick={() => removerProc(p.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Input value={novoProc.procedimento} onChange={(e) => setNovoProc({ ...novoProc, procedimento: e.target.value })} placeholder="Procedimento" />
          <div className="flex gap-2">
            <Input value={novoProc.profissional} onChange={(e) => setNovoProc({ ...novoProc, profissional: e.target.value })} placeholder="Profissional" className="flex-1" />
            <Input value={novoProc.valor} onChange={(e) => setNovoProc({ ...novoProc, valor: e.target.value })} placeholder="Valor" className="w-20" />
          </div>
          <div className="flex gap-2">
            <Input type="date" value={novoProc.data} onChange={(e) => setNovoProc({ ...novoProc, data: e.target.value })} className="flex-1" />
            <button onClick={addProc} className="rounded-lg px-3 flex items-center" style={{ background: C.rose, color: "#fff" }}><Plus size={16} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Limpeza({ state, update }) {
  return (
    <div>
      <SectionHeader icon={HomeIcon} title="Cronograma de limpeza" subtitle="Organize por frequência e cômodo" color={C.ochre} />
      <CategoriaChecklist categorias={state.limpeza.categorias} onChange={(categorias) => update((s) => ({ ...s, limpeza: { ...s.limpeza, categorias } }))} accent={C.ochre} />
    </div>
  );
}

function Mural({ state, update }) {
  const [novaImg, setNovaImg] = useState("");
  const [legenda, setLegenda] = useState("");

  const add = () => {
    if (!novaImg) return;
    update((s) => ({ ...s, mural: [...s.mural, { id: uid(), imagem: novaImg, legenda }] }));
    setNovaImg("");
    setLegenda("");
  };
  const remover = (id) => update((s) => ({ ...s, mural: s.mural.filter((m) => m.id !== id) }));

  return (
    <div>
      <SectionHeader icon={Sparkles} title="Mural dos sonhos" subtitle="O que te inspira a seguir em frente" color={C.coral} />
      <Card className="mb-4">
        <CardTitle color={C.coral}>Adicionar imagem</CardTitle>
        <div className="flex flex-col gap-2">
          <ImageField value={novaImg} onChange={setNovaImg} />
          <div className="flex gap-2">
            <Input value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda (opcional)" className="flex-1" />
            <button onClick={add} className="rounded-lg px-3 flex items-center" style={{ background: C.coral, color: "#fff" }}><Plus size={16} /></button>
          </div>
        </div>
      </Card>

      {state.mural.length === 0 ? (
        <p className="text-sm italic" style={{ color: C.inkSoft }}>Seu mural está vazio. Adicione imagens que representem seus sonhos e objetivos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {state.mural.map((m) => (
            <div key={m.id} className="relative rounded-2xl overflow-hidden group" style={{ border: `1px solid ${C.line}` }}>
              <img src={m.imagem} alt={m.legenda} className="w-full object-cover" style={{ height: 130 }} />
              {m.legenda && (
                <div className="px-2 py-1 text-xs" style={{ color: C.ink, background: C.paper }}>{m.legenda}</div>
              )}
              <button onClick={() => remover(m.id)} className="absolute top-1 right-1 rounded-full w-6 h-6 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)" }}>
                <X size={13} color={C.coral} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListaDesejos({ state, update }) {
  const [novo, setNovo] = useState({ nome: "", imagem: "", preco: "", link: "", categoria: "" });

  const add = () => {
    if (!novo.nome.trim()) return;
    update((s) => ({
      ...s,
      desejos: [...s.desejos, { id: uid(), ...novo, nome: novo.nome.trim(), categoria: novo.categoria.trim() || "Geral", comprado: false }],
    }));
    setNovo({ nome: "", imagem: "", preco: "", link: "", categoria: "" });
  };
  const toggle = (id) => update((s) => ({ ...s, desejos: s.desejos.map((d) => (d.id === id ? { ...d, comprado: !d.comprado } : d)) }));
  const remover = (id) => update((s) => ({ ...s, desejos: s.desejos.filter((d) => d.id !== id) }));

  const categorias = [...new Set(state.desejos.map((d) => d.categoria || "Geral"))];

  return (
    <div>
      <SectionHeader icon={ShoppingBag} title="Lista de desejos" subtitle="O que você quer comprar, com foto e link" color={C.rose} />

      <Card className="mb-4">
        <CardTitle color={C.rose}>Adicionar item</CardTitle>
        <div className="flex flex-col gap-2">
          <ImageField value={novo.imagem} onChange={(v) => setNovo({ ...novo, imagem: v })} />
          <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome do produto" />
          <div className="flex gap-2">
            <Input value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} placeholder="Categoria (ex: Roupas)" className="flex-1" />
            <Input value={novo.preco} onChange={(e) => setNovo({ ...novo, preco: e.target.value })} placeholder="Preço" className="w-20" />
          </div>
          <div className="flex gap-2">
            <Input value={novo.link} onChange={(e) => setNovo({ ...novo, link: e.target.value })} placeholder="Link do produto" className="flex-1" />
            <button onClick={add} className="rounded-lg px-3 flex items-center" style={{ background: C.rose, color: "#fff" }}><Plus size={16} /></button>
          </div>
        </div>
      </Card>

      {state.desejos.length === 0 ? (
        <p className="text-sm italic" style={{ color: C.inkSoft }}>Sua lista de desejos está vazia. Adicione o que você tem vontade de comprar.</p>
      ) : (
        categorias.map((cat) => {
          const itens = state.desejos.filter((d) => (d.categoria || "Geral") === cat);
          return (
            <Card key={cat} className="mb-3">
              <CardTitle color={C.rose}>{cat}</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                {itens.map((d) => (
                  <div key={d.id} className="rounded-xl overflow-hidden relative" style={{ border: `1px solid ${C.line}` }}>
                    {d.imagem ? (
                      <img src={d.imagem} alt="" className="w-full object-cover" style={{ height: 100, opacity: d.comprado ? 0.4 : 1 }} />
                    ) : (
                      <div className="w-full flex items-center justify-center" style={{ height: 100, background: C.cream }}>
                        <ShoppingBag size={20} color={C.inkSoft} />
                      </div>
                    )}
                    <button onClick={() => remover(d.id)} className="absolute top-1 right-1 rounded-full w-6 h-6 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)" }}>
                      <X size={13} color={C.coral} />
                    </button>
                    <div className="p-2">
                      <div className="text-xs font-medium truncate" style={{ color: C.ink, textDecoration: d.comprado ? "line-through" : "none" }}>{d.nome}</div>
                      {d.preco && <div className="text-xs" style={{ color: C.inkSoft }}>R$ {d.preco}</div>}
                      <div className="flex items-center justify-between mt-1.5">
                        {d.link ? (
                          <a href={d.link} target="_blank" rel="noreferrer" className="text-[11px] flex items-center gap-0.5" style={{ color: C.slate }}>
                            <LinkIcon size={11} /> ver
                          </a>
                        ) : <span />}
                        <button onClick={() => toggle(d.id)} className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: d.comprado ? C.sage + "22" : C.cream, color: d.comprado ? C.sage : C.inkSoft }}>
                          {d.comprado ? "Comprado" : "Marcar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

function Passeios({ state, update }) {
  const [novo, setNovo] = useState({ nome: "", imagem: "" });

  const add = () => {
    if (!novo.nome.trim()) return;
    update((s) => ({ ...s, passeios: [...s.passeios, { id: uid(), nome: novo.nome.trim(), imagem: novo.imagem, visitado: false, dataVisita: "" }] }));
    setNovo({ nome: "", imagem: "" });
  };
  const remover = (id) => update((s) => ({ ...s, passeios: s.passeios.filter((p) => p.id !== id) }));
  const toggleVisitado = (id) =>
    update((s) => ({
      ...s,
      passeios: s.passeios.map((p) => (p.id === id ? { ...p, visitado: !p.visitado, dataVisita: !p.visitado ? (p.dataVisita || isoHoje()) : p.dataVisita } : p)),
    }));
  const atualizarData = (id, data) => update((s) => ({ ...s, passeios: s.passeios.map((p) => (p.id === id ? { ...p, dataVisita: data } : p)) }));

  const queroVisitar = state.passeios.filter((p) => !p.visitado);
  const jaVisitei = state.passeios.filter((p) => p.visitado);

  const Grade = ({ lista }) => (
    <div className="grid grid-cols-2 gap-3">
      {lista.map((p) => (
        <div key={p.id} className="rounded-xl overflow-hidden relative" style={{ border: `1px solid ${C.line}` }}>
          {p.imagem ? (
            <img src={p.imagem} alt="" className="w-full object-cover" style={{ height: 100, opacity: p.visitado ? 1 : 0.85 }} />
          ) : (
            <div className="w-full flex items-center justify-center" style={{ height: 100, background: C.cream }}>
              <MapPin size={20} color={C.inkSoft} />
            </div>
          )}
          <button onClick={() => remover(p.id)} className="absolute top-1 right-1 rounded-full w-6 h-6 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)" }}>
            <X size={13} color={C.coral} />
          </button>
          <div className="p-2">
            <div className="text-xs font-medium truncate" style={{ color: C.ink }}>{p.nome}</div>
            <button
              onClick={() => toggleVisitado(p.id)}
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-flex items-center gap-1"
              style={{ background: p.visitado ? C.sage + "22" : C.cream, color: p.visitado ? C.sage : C.inkSoft }}
            >
              {p.visitado && <Check size={11} />} {p.visitado ? "Visitei" : "Quero visitar"}
            </button>
            {p.visitado && (
              <Input type="date" value={p.dataVisita} onChange={(e) => atualizarData(p.id, e.target.value)} className="w-full mt-1.5 text-[11px] px-1.5 py-0.5" />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <SectionHeader icon={MapPin} title="Passeios" subtitle="Lugares para visitar, e os que você já viveu" color={C.slate} />

      <Card className="mb-4">
        <CardTitle color={C.slate}>Adicionar lugar</CardTitle>
        <div className="flex flex-col gap-2">
          <ImageField value={novo.imagem} onChange={(v) => setNovo({ ...novo, imagem: v })} />
          <div className="flex gap-2">
            <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nome do lugar" className="flex-1" />
            <button onClick={add} className="rounded-lg px-3 flex items-center" style={{ background: C.slate, color: "#fff" }}><Plus size={16} /></button>
          </div>
        </div>
      </Card>

      <Card className="mb-3">
        <CardTitle color={C.slate}>Quero visitar {queroVisitar.length > 0 && `(${queroVisitar.length})`}</CardTitle>
        {queroVisitar.length === 0 ? <p className="text-xs italic" style={{ color: C.inkSoft }}>Nenhum lugar na lista ainda.</p> : <Grade lista={queroVisitar} />}
      </Card>

      <Card>
        <CardTitle color={C.sage}>Já visitei {jaVisitei.length > 0 && `(${jaVisitei.length})`}</CardTitle>
        {jaVisitei.length === 0 ? <p className="text-xs italic" style={{ color: C.inkSoft }}>Nenhum lugar visitado ainda.</p> : <Grade lista={jaVisitei} />}
      </Card>
    </div>
  );
}

function ContasChecklist({ titulo, contas, onChange, cor, ano }) {
  const [novo, setNovo] = useState("");
  const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mesAtual = new Date().getMonth();

  const add = () => {
    if (!novo.trim()) return;
    onChange([...contas, { id: uid(), nome: novo.trim(), pagos: {} }]);
    setNovo("");
  };
  const remover = (id) => onChange(contas.filter((c) => c.id !== id));
  const togglePago = (id, mes) => {
    const chave = `${ano}-${mes}`;
    onChange(contas.map((c) => (c.id === id ? { ...c, pagos: { ...c.pagos, [chave]: !c.pagos[chave] } } : c)));
  };

  return (
    <Card>
      <CardTitle color={cor}>{titulo}</CardTitle>
      {contas.length === 0 ? (
        <p className="text-sm italic mb-3" style={{ color: C.inkSoft }}>Nenhuma conta cadastrada ainda.</p>
      ) : (
        <div className="overflow-x-auto mb-3">
          <table className="text-xs" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="text-left font-normal pr-2 pb-1" style={{ color: C.inkSoft }}></th>
                {mesesAbrev.map((m, i) => (
                  <th key={m} className="font-normal text-center px-1 pb-1" style={{ color: i === mesAtual ? cor : C.inkSoft }}>{m}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id}>
                  <td className="pr-2 py-1 whitespace-nowrap" style={{ color: C.ink }}>{c.nome}</td>
                  {mesesAbrev.map((_, mes) => {
                    const pago = !!c.pagos[`${ano}-${mes}`];
                    return (
                      <td key={mes} className="text-center py-1">
                        <button onClick={() => togglePago(c.id, mes)} className="w-5 h-5 rounded-md inline-flex items-center justify-center" style={{ background: pago ? cor : C.cream, border: `1px solid ${pago ? cor : C.line}` }}>
                          {pago && <Check size={11} color="#fff" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="pl-1">
                    <IconBtn onClick={() => remover(c.id)} danger><Trash2 size={13} /></IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2">
        <Input value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nome da conta (ex: Aluguel)" className="flex-1" />
        <button onClick={add} className="rounded-lg px-3 flex items-center" style={{ background: cor, color: "#fff" }}><Plus size={16} /></button>
      </div>
    </Card>
  );
}

function RotinaSaudavel({ state, update }) {
  const s = state.saudavel;
  const hoje = new Date();
  const ano = hoje.getFullYear(), mes = hoje.getMonth();
  const dias = new Date(ano, mes + 1, 0).getDate();
  const diasArr = Array.from({ length: dias }, (_, i) => i + 1);
  const diasPassados = hoje.getDate();

  const pilares = [
    { chave: "alimentacao", label: "Alimentação", cor: C.sage },
    { chave: "exercicio", label: "Exercício", cor: C.coral },
    { chave: "jejum", label: "Jejum", cor: C.slate },
  ];

  const togglePilar = (chave, dia) => {
    const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    update((st) => ({ ...st, saudavel: { ...st.saudavel, pilares: { ...st.saudavel.pilares, [chave]: { ...st.saudavel.pilares[chave], [iso]: !st.saudavel.pilares[chave][iso] } } } }));
  };
  const aderenciaPilar = (chave) => {
    let marcados = 0;
    for (let d = 1; d <= diasPassados; d++) {
      const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (s.pilares[chave][iso]) marcados++;
    }
    return diasPassados > 0 ? Math.round((marcados / diasPassados) * 100) : 0;
  };

  // fotos antes/depois
  const [novaFoto, setNovaFoto] = useState({ tipo: "antes", imagem: "", data: isoHoje() });
  const addFoto = () => {
    if (!novaFoto.imagem) return;
    update((st) => ({ ...st, saudavel: { ...st.saudavel, fotos: [...st.saudavel.fotos, { id: uid(), ...novaFoto }] } }));
    setNovaFoto({ tipo: "antes", imagem: "", data: isoHoje() });
  };
  const removerFoto = (id) => update((st) => ({ ...st, saudavel: { ...st.saudavel, fotos: st.saudavel.fotos.filter((f) => f.id !== id) } }));
  const fotosAntes = s.fotos.filter((f) => f.tipo === "antes").sort((a, b) => a.data.localeCompare(b.data));
  const fotosDepois = s.fotos.filter((f) => f.tipo === "depois").sort((a, b) => a.data.localeCompare(b.data));

  // peso
  const [novoPeso, setNovoPeso] = useState({ data: isoHoje(), valor: "" });
  const addPeso = () => {
    if (!novoPeso.valor) return;
    update((st) => ({ ...st, saudavel: { ...st.saudavel, peso: [...st.saudavel.peso, { id: uid(), ...novoPeso }] } }));
    setNovoPeso({ data: isoHoje(), valor: "" });
  };
  const removerPeso = (id) => update((st) => ({ ...st, saudavel: { ...st.saudavel, peso: st.saudavel.peso.filter((p) => p.id !== id) } }));
  const pesoOrdenado = [...s.peso].sort((a, b) => a.data.localeCompare(b.data));
  const dadosGrafico = pesoOrdenado.map((p) => ({ data: fmtData(p.data).slice(0, 5), valor: Number(String(p.valor).replace(",", ".")) || 0 }));

  // exercicios
  const [novoExercicio, setNovoExercicio] = useState({ texto: "", data: isoHoje() });
  const addExercicio = () => {
    if (!novoExercicio.texto.trim()) return;
    update((st) => ({ ...st, saudavel: { ...st.saudavel, exercicios: [...st.saudavel.exercicios, { id: uid(), texto: novoExercicio.texto.trim(), data: novoExercicio.data }] } }));
    setNovoExercicio({ texto: "", data: isoHoje() });
  };
  const removerExercicio = (id) => update((st) => ({ ...st, saudavel: { ...st.saudavel, exercicios: st.saudavel.exercicios.filter((e) => e.id !== id) } }));
  const exerciciosOrdenados = [...s.exercicios].sort((a, b) => b.data.localeCompare(a.data));

  // jejum intermitente
  const [novoJejum, setNovoJejum] = useState({ data: isoHoje(), inicio: "20:00", fim: "12:00" });
  const duracaoJejum = (inicio, fim) => {
    if (!inicio || !fim) return "";
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fim.split(":").map(Number);
    let minutos = h2 * 60 + m2 - (h1 * 60 + m1);
    if (minutos <= 0) minutos += 24 * 60;
    const horas = Math.floor(minutos / 60);
    const min = minutos % 60;
    return `${horas}h${min > 0 ? min + "m" : ""}`;
  };
  const addJejum = () => {
    update((st) => ({ ...st, saudavel: { ...st.saudavel, jejumLog: [...st.saudavel.jejumLog, { id: uid(), ...novoJejum }] } }));
    setNovoJejum({ data: isoHoje(), inicio: "20:00", fim: "12:00" });
  };
  const removerJejum = (id) => update((st) => ({ ...st, saudavel: { ...st.saudavel, jejumLog: st.saudavel.jejumLog.filter((j) => j.id !== id) } }));
  const jejumOrdenado = [...s.jejumLog].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <SectionHeader icon={Activity} title="Rotina saudável" subtitle="Alimentação, exercício e jejum" color={C.sage} />

      <Card className="mb-4">
        <CardTitle color={C.sage}>O que eu considero um dia saudável?</CardTitle>
        <div className="flex flex-col gap-1.5 mb-2">
          {pilares.map((p) => (
            <div key={p.chave} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.cor }} />
              <span style={{ color: C.ink }}>{p.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs italic" style={{ color: C.inkSoft }}>3 pilares todos os dias — exceção só para o sábado à noite, que é livre.</p>
      </Card>

      <Card className="mb-4">
        <CardTitle color={C.sage}>Checklist mensal dos pilares</CardTitle>
        <div className="flex flex-col gap-3">
          {pilares.map((p) => (
            <div key={p.chave}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: C.ink }}>{p.label}</span>
                <span className="text-xs font-semibold" style={{ color: p.cor }}>{aderenciaPilar(p.chave)}%</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {diasArr.map((d) => {
                  const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const marcado = !!s.pilares[p.chave][iso];
                  return (
                    <button key={d} onClick={() => togglePilar(p.chave, d)} className="w-6 h-6 rounded-md text-[10px] flex items-center justify-center" style={{ background: marcado ? p.cor : C.cream, color: marcado ? "#fff" : C.inkSoft, border: `1px solid ${marcado ? p.cor : C.line}` }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <CardTitle color={C.rose}>Fotos de antes e depois</CardTitle>
        <div className="flex flex-col gap-2 mb-3">
          <ImageField value={novaFoto.imagem} onChange={(v) => setNovaFoto({ ...novaFoto, imagem: v })} />
          <div className="flex gap-2">
            <select value={novaFoto.tipo} onChange={(e) => setNovaFoto({ ...novaFoto, tipo: e.target.value })} className="text-sm rounded-lg px-2 py-1.5 outline-none" style={{ border: `1px solid ${C.line}` }}>
              <option value="antes">Antes</option>
              <option value="depois">Depois</option>
            </select>
            <Input type="date" value={novaFoto.data} onChange={(e) => setNovaFoto({ ...novaFoto, data: e.target.value })} className="flex-1" />
            <button onClick={addFoto} className="rounded-lg px-3 flex items-center" style={{ background: C.rose, color: "#fff" }}><Plus size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: C.inkSoft }}>Antes</p>
            <div className="grid grid-cols-2 gap-1.5">
              {fotosAntes.map((f) => (
                <div key={f.id} className="relative rounded-lg overflow-hidden">
                  <img src={f.imagem} alt="" className="w-full object-cover" style={{ height: 80 }} />
                  <div className="text-[9px] text-center py-0.5" style={{ background: C.cream, color: C.inkSoft }}>{fmtData(f.data)}</div>
                  <button onClick={() => removerFoto(f.id)} className="absolute top-0.5 right-0.5 rounded-full w-4 h-4 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)" }}><X size={10} color={C.coral} /></button>
                </div>
              ))}
              {fotosAntes.length === 0 && <p className="text-[11px] italic col-span-2" style={{ color: C.inkSoft }}>Nenhuma foto ainda.</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: C.inkSoft }}>Depois</p>
            <div className="grid grid-cols-2 gap-1.5">
              {fotosDepois.map((f) => (
                <div key={f.id} className="relative rounded-lg overflow-hidden">
                  <img src={f.imagem} alt="" className="w-full object-cover" style={{ height: 80 }} />
                  <div className="text-[9px] text-center py-0.5" style={{ background: C.cream, color: C.inkSoft }}>{fmtData(f.data)}</div>
                  <button onClick={() => removerFoto(f.id)} className="absolute top-0.5 right-0.5 rounded-full w-4 h-4 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.85)" }}><X size={10} color={C.coral} /></button>
                </div>
              ))}
              {fotosDepois.length === 0 && <p className="text-[11px] italic col-span-2" style={{ color: C.inkSoft }}>Nenhuma foto ainda.</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <CardTitle color={C.slate}>Progresso semanal de peso</CardTitle>
        {dadosGrafico.length >= 2 && (
          <div style={{ width: "100%", height: 140 }} className="mb-3">
            <ResponsiveContainer>
              <LineChart data={dadosGrafico}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="data" tick={{ fontSize: 10, fill: C.inkSoft }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                <Line type="monotone" dataKey="valor" stroke={C.slate} strokeWidth={2} dot={{ r: 3, fill: C.slate }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex flex-col gap-1.5 mb-3">
          {pesoOrdenado.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum registro ainda.</p>}
          {[...pesoOrdenado].reverse().slice(0, 6).map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <span className="text-xs shrink-0 w-20" style={{ color: C.inkSoft }}>{fmtData(p.data)}</span>
              <span className="flex-1" style={{ color: C.ink }}>{p.valor} kg</span>
              <IconBtn onClick={() => removerPeso(p.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="date" value={novoPeso.data} onChange={(e) => setNovoPeso({ ...novoPeso, data: e.target.value })} className="flex-1" />
          <Input value={novoPeso.valor} onChange={(e) => setNovoPeso({ ...novoPeso, valor: e.target.value })} placeholder="kg" inputMode="decimal" className="w-20" />
          <button onClick={addPeso} className="rounded-lg px-3 flex items-center" style={{ background: C.slate, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>

      <Card className="mb-4">
        <CardTitle color={C.coral}>Exercícios que fiz</CardTitle>
        <div className="flex flex-col gap-1.5 mb-3">
          {exerciciosOrdenados.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum exercício registrado ainda.</p>}
          {exerciciosOrdenados.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="text-xs shrink-0 w-20" style={{ color: C.inkSoft }}>{fmtData(e.data)}</span>
              <span className="flex-1" style={{ color: C.ink }}>{e.texto}</span>
              <IconBtn onClick={() => removerExercicio(e.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="date" value={novoExercicio.data} onChange={(e) => setNovoExercicio({ ...novoExercicio, data: e.target.value })} />
          <Input value={novoExercicio.texto} onChange={(e) => setNovoExercicio({ ...novoExercicio, texto: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addExercicio()} placeholder="Ex: Corrida 5km" className="flex-1" />
          <button onClick={addExercicio} className="rounded-lg px-3 flex items-center" style={{ background: C.coral, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>

      <Card>
        <CardTitle color={C.slate}>Jejum intermitente</CardTitle>
        <div className="flex flex-col gap-1.5 mb-3">
          {jejumOrdenado.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nenhum registro ainda.</p>}
          {jejumOrdenado.map((j) => (
            <div key={j.id} className="flex items-center gap-2 text-sm">
              <span className="text-xs shrink-0 w-20" style={{ color: C.inkSoft }}>{fmtData(j.data)}</span>
              <span className="flex-1" style={{ color: C.ink }}>{j.inicio} → {j.fim}</span>
              <span className="text-xs font-semibold shrink-0" style={{ color: C.slate }}>{duracaoJejum(j.inicio, j.fim)}</span>
              <IconBtn onClick={() => removerJejum(j.id)} danger><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="date" value={novoJejum.data} onChange={(e) => setNovoJejum({ ...novoJejum, data: e.target.value })} className="w-[110px]" />
          <Input type="time" value={novoJejum.inicio} onChange={(e) => setNovoJejum({ ...novoJejum, inicio: e.target.value })} className="flex-1" />
          <Input type="time" value={novoJejum.fim} onChange={(e) => setNovoJejum({ ...novoJejum, fim: e.target.value })} className="flex-1" />
          <button onClick={addJejum} className="rounded-lg px-3 flex items-center" style={{ background: C.slate, color: "#fff" }}><Plus size={16} /></button>
        </div>
      </Card>
    </div>
  );
}

function Financeiro({ state, update, setTab }) {
  const naoComprados = state.desejos.filter((d) => !d.comprado).length;
  const ano = new Date().getFullYear();

  return (
    <div>
      <SectionHeader icon={Wallet} title="Financeiro" subtitle="Suas contas, mês a mês" color={C.ochre} />

      <div className="flex flex-col gap-4 mb-4">
        <ContasChecklist
          titulo="Contas do dia 15"
          contas={state.financeiro.contas15}
          onChange={(contas) => update((s) => ({ ...s, financeiro: { ...s.financeiro, contas15: contas } }))}
          cor={C.ochre}
          ano={ano}
        />
        <ContasChecklist
          titulo="Contas do dia 30"
          contas={state.financeiro.contas30}
          onChange={(contas) => update((s) => ({ ...s, financeiro: { ...s.financeiro, contas30: contas } }))}
          cor={C.slate}
          ano={ano}
        />
      </div>

      <button onClick={() => setTab && setTab("desejos")} className="w-full text-left">
        <Card style={{ background: C.rose + "10" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl w-10 h-10 shrink-0" style={{ background: C.rose + "22", color: C.rose }}>
              <ShoppingBag size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: C.ink }}>Lista de desejos</div>
              <div className="text-xs" style={{ color: C.inkSoft }}>{naoComprados} item{naoComprados === 1 ? "" : "s"} na fila, com foto e link</div>
            </div>
          </div>
        </Card>
      </button>
    </div>
  );
}

function ListaMemorias({ items, onChange, accent, placeholder }) {
  const [texto, setTexto] = useState("");
  const [data, setData] = useState("");
  const [imagem, setImagem] = useState("");

  const add = () => {
    if (!texto.trim()) return;
    onChange([...items, { id: uid(), texto: texto.trim(), data, imagem }]);
    setTexto("");
    setData("");
    setImagem("");
  };
  const remover = (id) => onChange(items.filter((it) => it.id !== id));

  return (
    <div>
      <div className="flex flex-col gap-2 mb-3">
        {items.length === 0 && <p className="text-sm italic" style={{ color: C.inkSoft }}>Nada por aqui ainda.</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2.5">
            {it.imagem ? (
              <img src={it.imagem} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44, border: `1px solid ${C.line}` }} />
            ) : (
              <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: C.cream }}>
                <ImageIcon size={15} color={C.inkSoft} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate" style={{ color: C.ink }}>{it.texto}</div>
              {it.data && <div className="text-xs" style={{ color: C.inkSoft }}>{fmtData(it.data)}</div>}
            </div>
            <IconBtn onClick={() => remover(it.id)} danger><Trash2 size={14} /></IconBtn>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
        <ImageField value={imagem} onChange={setImagem} small />
        <div className="flex gap-2">
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={placeholder || "Adicionar"} className="flex-1" />
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-[130px]" />
          <button onClick={add} className="flex items-center justify-center rounded-lg w-8 h-8 shrink-0" style={{ background: accent, color: "#fff" }}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Pessoal({ state, update }) {
  const campos = [
    { chave: "conquistas", label: "Minhas maiores conquistas", cor: C.coral },
    { chave: "inspiracoes", label: "O que me inspira", cor: C.sage },
    { chave: "marcos", label: "Acontecimentos marcantes", cor: C.slate },
  ];
  return (
    <div>
      <SectionHeader icon={Sparkles} title="Vida pessoal" subtitle="Autoconhecimento e memórias" color={C.slate} />
      <div className="flex flex-col gap-4">
        {campos.map((c) => (
          <Card key={c.chave}>
            <CardTitle color={c.cor}>{c.label}</CardTitle>
            <ListaMemorias items={state.pessoal[c.chave]} onChange={(items) => update((s) => ({ ...s, pessoal: { ...s.pessoal, [c.chave]: items } }))} placeholder="Adicionar" accent={c.cor} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- app shell ----------

const ABAS = [
  { id: "hoje", label: "Hoje", icon: Sun, cor: C.coral },
  { id: "semana", label: "Semana", icon: Sun, cor: C.coral },
  { id: "calendario", label: "Calendário", icon: Calendar, cor: C.slate },
  { id: "metas", label: "Metas", icon: Target, cor: C.coral },
  { id: "projetos", label: "Projetos", icon: FolderKanban, cor: C.ochre },
  { id: "profissional", label: "Trabalho", icon: Briefcase, cor: C.slate },
  { id: "habitos", label: "Hábitos", icon: Repeat, cor: C.sage },
  { id: "livros", label: "Livros", icon: BookOpen, cor: C.slate },
  { id: "saude", label: "Saúde", icon: HeartPulse, cor: C.rose },
  { id: "saudavel", label: "Rotina saudável", icon: Activity, cor: C.sage },
  { id: "beleza", label: "Beleza", icon: Sparkle, cor: C.rose },
  { id: "limpeza", label: "Limpeza", icon: HomeIcon, cor: C.ochre },
  { id: "mural", label: "Mural", icon: Sparkles, cor: C.coral },
  { id: "passeios", label: "Passeios", icon: MapPin, cor: C.slate },
  { id: "desejos", label: "Desejos", icon: ShoppingBag, cor: C.rose },
  { id: "financeiro", label: "Financeiro", icon: Wallet, cor: C.ochre },
  { id: "pessoal", label: "Pessoal", icon: Sparkles, cor: C.slate },
];

function TelaLogin({ onEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const entrar = () => {
    if (email.trim().toLowerCase() === EMAIL_PADRAO.toLowerCase() && senha === SENHA_PADRAO) {
      setErro("");
      onEntrar();
    } else {
      setErro("E-mail ou senha incorretos.");
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-5" style={{ background: C.cream }}>
      <div className="w-full rounded-3xl p-7" style={{ maxWidth: 380, background: C.paper, border: `1px solid ${C.line}`, boxShadow: "0 4px 24px rgba(46,42,36,0.06)" }}>
        <div className="flex items-center justify-center rounded-2xl w-12 h-12 mx-auto mb-4" style={{ background: C.rose + "18" }}>
          <Sparkles size={22} color={C.rose} />
        </div>
        <p className="text-xs uppercase tracking-widest text-center" style={{ color: C.inkSoft }}>Painel da</p>
        <h1 className="text-2xl font-bold text-center mb-5" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>Minha Vida</h1>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs" style={{ color: C.inkSoft }}>E-mail</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} placeholder="seu@email.com" className="w-full mt-1" />
          </div>
          <div>
            <label className="text-xs" style={{ color: C.inkSoft }}>Senha</label>
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} placeholder="••••••••" className="w-full mt-1" />
          </div>
          {erro && <p className="text-xs" style={{ color: C.coral }}>{erro}</p>}
          <button onClick={entrar} className="rounded-xl py-2.5 text-sm font-semibold mt-1" style={{ background: C.coral, color: "#fff" }}>Entrar</button>
        </div>

        <p className="text-[11px] italic text-center mt-5" style={{ color: C.inkSoft }}>
          Esse login é apenas uma trava simples de privacidade — quem tiver acesso ao arquivo do painel também consegue ver essas credenciais no código.
        </p>
      </div>
    </div>
  );
}

export default function PainelDaVida() {
  const [state, setState] = useState(defaultState);
  const [tab, setTab] = useState("hoje");
  const [carregado, setCarregado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(AUTH_KEY, false);
        if (res && res.value === "true") setAutenticado(true);
      } catch (e) {
        // ainda não logou nesse dispositivo
      } finally {
        setVerificandoAuth(false);
      }
    })();
  }, []);

  const entrar = () => {
    setAutenticado(true);
    window.storage.set(AUTH_KEY, "true", false).catch(() => {});
  };
  const sair = () => {
    setAutenticado(false);
    window.storage.set(AUTH_KEY, "false", false).catch(() => {});
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setState(deepMerge(defaultState, parsed));
        }
      } catch (e) {
        // sem dados salvos ainda
      } finally {
        setCarregado(true);
      }
    })();
  }, []);

  const persistir = async (next) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
    } catch (e) {
      // segue apenas em memória nesta sessão
    }
  };

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setSalvando(true);
      persistir(next).finally(() => setSalvando(false));
      return next;
    });
  }, []);

  if (verificandoAuth || !carregado) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: C.cream }}>
        <Loader2 className="animate-spin" color={C.coral} size={28} />
      </div>
    );
  }

  if (!autenticado) {
    return <TelaLogin onEntrar={entrar} />;
  }

  const AbaAtiva = {
    hoje: <Hoje state={state} update={update} setTab={setTab} />,
    semana: <Semana state={state} update={update} />,
    calendario: <CalendarioTab state={state} update={update} />,
    metas: <Metas state={state} update={update} />,
    projetos: <Projetos state={state} update={update} />,
    profissional: <Profissional state={state} update={update} />,
    habitos: <Habitos state={state} update={update} />,
    livros: <Livros state={state} update={update} />,
    saude: <Saude state={state} update={update} />,
    saudavel: <RotinaSaudavel state={state} update={update} />,
    beleza: <Beleza state={state} update={update} />,
    limpeza: <Limpeza state={state} update={update} />,
    mural: <Mural state={state} update={update} />,
    passeios: <Passeios state={state} update={update} />,
    desejos: <ListaDesejos state={state} update={update} />,
    financeiro: <Financeiro state={state} update={update} setTab={setTab} />,
    pessoal: <Pessoal state={state} update={update} />,
  }[tab];

  return (
    <div className="w-full min-h-screen" style={{ background: C.cream }}>
      <style>{`
        .pv-shell { display: flex; width: 100%; }
        .pv-sidebar { display: none; }
        .pv-bottomnav { display: flex; }
        .pv-main { max-width: 48rem; padding-left: 1.25rem; padding-right: 1.25rem; margin-left: auto; margin-right: auto; padding-bottom: 6rem; }
        .pv-bento { display: block; }
        .pv-bento-main { display: flex; flex-direction: column; gap: 1rem; }
        .pv-bento-side { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
        .pv-mobile-header { display: flex; }
        .pv-projetos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        .pv-tarefas-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .pv-tiles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
        @media (min-width: 800px) {
          .pv-sidebar { display: flex; }
          .pv-bottomnav { display: none; }
          .pv-mobile-header { display: none; }
          .pv-tarefas-grid { grid-template-columns: 1fr 1fr; }
          .pv-tiles-grid { grid-template-columns: repeat(6, 1fr); }
          .pv-main { max-width: 60rem; padding-left: 2.5rem; padding-right: 2.5rem; padding-top: 2rem; padding-bottom: 3rem; }
        }
        @media (min-width: 1150px) {
          .pv-main { max-width: 78rem; padding-left: 3rem; padding-right: 3rem; }
          .pv-bento { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; align-items: start; }
          .pv-bento-side { margin-top: 0; }
          .pv-projetos-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1500px) {
          .pv-main { max-width: 96rem; padding-left: 4rem; padding-right: 4rem; }
        }
      `}</style>
      <div className="pv-shell" style={{ background: C.cream }}>
      {/* menu lateral — telas médias e maiores */}
      <aside className="pv-sidebar flex-col shrink-0 w-56 h-screen sticky top-0 px-3 py-6" style={{ background: C.paper, borderRight: `1px solid ${C.line}` }}>
        <div className="px-2 mb-6">
          <p className="text-xs uppercase tracking-widest" style={{ color: C.inkSoft }}>Painel da</p>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>Minha Vida</h1>
        </div>
        <nav className="flex flex-col gap-0.5 overflow-y-auto">
          {ABAS.map((a) => {
            const ativo = tab === a.id;
            return (
              <button key={a.id} onClick={() => setTab(a.id)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left" style={{ background: ativo ? a.cor + "18" : "transparent" }}>
                <a.icon size={16} color={ativo ? a.cor : C.inkSoft} />
                <span className="text-sm" style={{ color: ativo ? a.cor : C.ink, fontWeight: ativo ? 600 : 400 }}>{a.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-5 rounded-2xl px-3 py-3" style={{ background: C.coral + "12" }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: C.coral }}>Inspiração</p>
          <p className="text-xs italic" style={{ color: C.inkSoft }}>"{FRASES_SIDEBAR[new Date().getDate() % FRASES_SIDEBAR.length]}"</p>
        </div>

        <div className="mt-3 rounded-2xl px-3 py-3" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: C.inkSoft }}>Hoje</p>
          {(state.diaADia[isoHoje()] || []).length === 0 ? (
            <p className="text-xs italic" style={{ color: C.inkSoft }}>Nada planejado ainda.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {(state.diaADia[isoHoje()] || []).slice(0, 5).map((b) => (
                <button
                  key={b.id}
                  onClick={() => update((s) => ({ ...s, diaADia: { ...s.diaADia, [isoHoje()]: (s.diaADia[isoHoje()] || []).map((x) => (x.id === b.id ? { ...x, feito: !x.feito } : x)) } }))}
                  className="flex items-center gap-2 text-left"
                >
                  <span className="w-3.5 h-3.5 rounded shrink-0 border flex items-center justify-center" style={{ borderColor: b.feito ? C.sage : C.line, background: b.feito ? C.sage : "transparent" }}>
                    {b.feito && <Check size={9} color="#fff" />}
                  </span>
                  <span className="text-xs truncate" style={{ color: b.feito ? C.inkSoft : C.ink, textDecoration: b.feito ? "line-through" : "none" }}>{b.texto}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 rounded-2xl px-3 py-3" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: C.inkSoft }}>Atalhos</p>
          <div className="flex flex-col gap-1">
            {[{ id: "mural", label: "Mural dos sonhos", icon: Sparkles }, { id: "passeios", label: "Passeios", icon: MapPin }, { id: "desejos", label: "Lista de desejos", icon: ShoppingBag }].map((l) => (
              <button key={l.id} onClick={() => setTab(l.id)} className="flex items-center gap-2 text-xs px-1 py-1" style={{ color: C.inkSoft }}>
                <l.icon size={13} /> {l.label}
              </button>
            ))}
          </div>
        </div>
        {salvando && (
          <div className="flex items-center gap-1.5 px-2 mt-4 text-xs" style={{ color: C.inkSoft }}>
            <Loader2 className="animate-spin" size={12} /> salvando...
          </div>
        )}
        <button onClick={sair} className="text-xs mt-4 px-2 text-left" style={{ color: C.inkSoft }}>Sair</button>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="pv-main">
          <header className="pv-mobile-header pt-6 pb-4 items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: C.inkSoft }}>Painel da</p>
              <h1 className="text-2xl font-bold" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>Minha Vida</h1>
            </div>
            <div className="flex items-center gap-3">
              {salvando && <Loader2 className="animate-spin" size={16} color={C.inkSoft} />}
              <button onClick={sair} className="text-xs" style={{ color: C.inkSoft }}>Sair</button>
            </div>
          </header>

          <div>{AbaAtiva}</div>
        </div>
      </div>

      {/* navegação inferior — telas pequenas */}
      <nav className="pv-bottomnav fixed bottom-0 left-0 right-0 overflow-x-auto gap-1 px-3 py-2" style={{ background: C.paper, borderTop: `1px solid ${C.line}` }}>
        <div className="flex gap-1 mx-auto">
          {ABAS.map((a) => {
            const ativo = tab === a.id;
            return (
              <button key={a.id} onClick={() => setTab(a.id)} className="flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 shrink-0" style={{ background: ativo ? a.cor + "18" : "transparent" }}>
                <a.icon size={17} color={ativo ? a.cor : C.inkSoft} />
                <span className="text-[10px] mt-0.5" style={{ color: ativo ? a.cor : C.inkSoft, fontWeight: ativo ? 600 : 400 }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      </div>
    </div>
  );
}
