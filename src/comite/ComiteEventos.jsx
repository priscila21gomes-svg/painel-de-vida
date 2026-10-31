import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  CalendarCheck, Calendar as CalendarIcon, FolderOpen, ClipboardList, ListChecks, Lightbulb,
  Home, Plus, Search, Bell, ChevronLeft, ChevronRight, ChevronDown, X, Trash2, Pencil,
  Download, Link as LinkIcon, Upload, Star, Check, Clock, MapPin, User, Users,
  Loader2, Heart, Folder, Cloud, CloudOff, ExternalLink, FileText, Image as ImageIcon,
} from "lucide-react";
import { carregarComite, salvarComite, sincronizaNaNuvem } from "./storage.js";
import { Mascote, MascoteRosto, Ilustracao, ILUSTRACOES, ilustracaoPadrao } from "./ilustracoes.jsx";

// ---------- tema Shopee ----------
const S = {
  laranja: "#EE4D2D",
  laranja2: "#FF7337",
  laranjaClaro: "#FFF1EC",
  laranjaBorda: "#FFD6C8",
  branco: "#FFFFFF",
  fundo: "#F7F7F8",
  tinta: "#222222",
  tintaSuave: "#757575",
  linha: "#ECECEC",
};

const TIPOS = [
  { id: "campanha", label: "Campanhas", emoji: "📣", cor: "#EE4D2D" },
  { id: "treinamento", label: "Treinamentos", emoji: "📚", cor: "#2F80ED" },
  { id: "reuniao", label: "Reuniões", emoji: "🤝", cor: "#F5A623" },
  { id: "operacional", label: "Ações Operacionais", emoji: "🛠️", cor: "#27AE60" },
  { id: "comemoracao", label: "Comemorações", emoji: "🎉", cor: "#E5487A" },
  { id: "outro", label: "Outros", emoji: "✨", cor: "#9CA3AF" },
];
const tipoInfo = (id) => TIPOS.find((t) => t.id === id) || TIPOS[TIPOS.length - 1];

const STATUS = [
  { id: "a-fazer", label: "A fazer", cor: "#9CA3AF" },
  { id: "andamento", label: "Em andamento", cor: "#F5A623" },
  { id: "aprovacao", label: "Aguardando aprovação", cor: "#2F80ED" },
  { id: "revisao", label: "Em revisão", cor: "#8B5CF6" },
  { id: "concluida", label: "Concluída", cor: "#27AE60" },
];
const statusInfo = (id) => STATUS.find((s) => s.id === id) || STATUS[0];

const PRIORIDADES = [
  { id: "alta", label: "Alta", cor: "#EE4D2D" },
  { id: "media", label: "Média", cor: "#F5A623" },
  { id: "baixa", label: "Baixa", cor: "#27AE60" },
];
const prioridadeInfo = (id) => PRIORIDADES.find((p) => p.id === id) || PRIORIDADES[1];

const CORES_PASTA = ["#E5487A", "#FF7337", "#EE4D2D", "#27AE60", "#2F80ED", "#8B5CF6", "#F5A623", "#6B7280"];

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_CURTOS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const DIAS_LONGOS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const LIMITE_UPLOAD_MB = 2;

// Reduz a imagem no navegador antes de salvar (capa nunca passa de ~800px),
// para não estourar o armazenamento local nem deixar o painel lento.
function reduzirImagem(file, maxLado = 800, qualidade = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const ehImagem = (a) => (a.dataUrl ? a.dataUrl.startsWith("data:image/") : /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(a.link || ""));
const srcArquivo = (a) => a.dataUrl || a.link;

// ---------- utilidades de data ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (iso) => new Date(iso + "T00:00:00");
const hojeISO = () => toISO(new Date());
const addDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const inicioSemana = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addDias(x, -((x.getDay() + 6) % 7)); };
const fmtCurta = (iso) => fromISO(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const fmtLonga = (iso) => fromISO(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const horario = (e) => (e.horaInicio ? `${e.horaInicio}${e.horaFim ? " - " + e.horaFim : ""}` : "");
const ordenarEventos = (a, b) => (a.data + (a.horaInicio || "99")).localeCompare(b.data + (b.horaInicio || "99"));

function urgencia(prazo) {
  if (!prazo) return null;
  const diff = Math.round((fromISO(prazo) - fromISO(hojeISO())) / 86400000);
  if (diff < 0) return { cor: "#D32F2F", label: "Atrasada" };
  if (diff === 0) return { cor: S.laranja, label: "Hoje" };
  if (diff <= 3) return { cor: S.laranja, label: `Em ${diff}d` };
  if (diff <= 7) return { cor: "#F5A623", label: `Em ${diff}d` };
  return { cor: S.tintaSuave, label: fmtCurta(prazo) };
}

const iniciais = (nome = "") => nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

// ---------- estado inicial (exemplos do mês atual) ----------
function estadoInicial() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const dia = (d, m = mes) => toISO(new Date(ano, m, d));
  const ev = (d, titulo, tipo, horaInicio = "", horaFim = "", descricao = "", m) => ({ id: uid(), titulo, data: dia(d, m), horaInicio, horaFim, tipo, descricao, responsavel: "", local: "" });
  const pasta = (nome, cor, destaque, descricao) => ({ id: uid(), nome, cor, destaque, descricao, ilustracao: ilustracaoPadrao(nome), link: "", arquivos: [] });

  return {
    usuario: "Priscila Nascimento",
    membros: [{ id: uid(), nome: "Priscila Nascimento" }],
    eventos: [
      ev(1, "Planejamento do mês", "treinamento", "09:00", "10:00"),
      ev(2, "Outubro Rosa", "campanha", "", "", "Campanha Região"),
      ev(3, "RMR Operacional", "operacional", "10:00", "11:00"),
      ev(6, "Reunião Comitê de Eventos", "reuniao", "14:00", "15:00"),
      ev(7, "Dia das Crianças", "comemoracao", "", "", "Comunicação"),
      ev(8, "Produção de Materiais", "reuniao", "09:00", "12:00"),
      ev(9, "Prazo Formulário Mini Eu", "operacional", "12:00"),
      ev(12, "Ser Shopee Compensa Mais", "campanha", "", "", "Ação Operacional"),
      ev(13, "Reunião Regional Eventos", "reuniao", "10:00", "11:00"),
      ev(14, "Checklist Materiais", "treinamento", "09:00", "11:00"),
      ev(16, "Campanha Saúde Mental", "comemoracao"),
      ev(20, "Divulgação Semana Maluca", "reuniao", "10:00", "11:00"),
      ev(22, "Alinhamento Comunicação", "treinamento", "14:00", "15:00"),
      ev(24, "Evento PET", "campanha", "08:00", "12:00"),
      ev(26, "RMR Mensal", "campanha", "09:00", "10:30"),
      ev(27, "Produção de Feedback Visual", "treinamento", "14:00", "16:00"),
    ],
    pastas: [
      pasta("Outubro Rosa", "#E5487A", true, "Materiais e comunicação"),
      pasta("Dia das Crianças Mini Eu", "#FF7337", true, "Materiais e formulários"),
      pasta("Ser Shopee Compensa Mais", "#EE4D2D", true, "Materiais e comunicação"),
      pasta("Doação PET", "#27AE60", true, "Materiais e comunicação"),
      pasta("RMR Operacional", "#2F80ED", false, "Apresentações e atas"),
      pasta("Comunicados", "#8B5CF6", false, "Comunicados oficiais"),
      pasta("Templates", "#F5A623", false, "Modelos editáveis"),
      pasta("Outros", "#6B7280", false, ""),
    ],
    demandas: [
      { id: uid(), titulo: "Finalizar materiais Dia das Crianças", descricao: "", responsavel: "Priscila Nascimento", solicitante: "", prazo: dia(Math.min(agora.getDate() + 2, 28)), status: "andamento", prioridade: "alta", criadaEm: hojeISO() },
      { id: uid(), titulo: "Aprovação do layout Evento PET", descricao: "", responsavel: "Priscila Nascimento", solicitante: "", prazo: "", status: "aprovacao", prioridade: "media", criadaEm: hojeISO() },
    ],
    passos: [
      { id: uid(), texto: "Finalizar materiais Dia das Crianças", feito: false, responsavel: "", prazo: "" },
      { id: uid(), texto: "Enviar comunicação Ser Shopee", feito: false, responsavel: "", prazo: "" },
      { id: uid(), texto: "Organizar logística do evento PET", feito: false, responsavel: "", prazo: "" },
      { id: uid(), texto: "Solicitar aprovação RMR do próximo mês", feito: false, responsavel: "", prazo: "" },
      { id: uid(), texto: "Atualizar calendário regional", feito: false, responsavel: "", prazo: "" },
    ],
    ideias: [],
  };
}

// ---------- blocos de interface ----------
function Card({ children, className = "", style }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: S.branco, border: `1px solid ${S.linha}`, boxShadow: "0 2px 10px rgba(0,0,0,0.03)", ...style }}>
      {children}
    </div>
  );
}

function TituloSecao({ icon: Icon, children, acao, sub }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon size={20} color={S.laranja} className="shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: S.laranja }}>{children}</h3>
          {sub && <p className="text-xs" style={{ color: S.tintaSuave }}>{sub}</p>}
        </div>
      </div>
      {acao}
    </div>
  );
}

function CabecalhoPagina({ icon: Icon, titulo, sub, acao }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: S.laranja, color: "#fff" }}>
          <Icon size={22} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-wide" style={{ color: S.tinta }}>{titulo}</h2>
          {sub && <p className="text-sm" style={{ color: S.tintaSuave }}>{sub}</p>}
        </div>
      </div>
      {acao}
    </div>
  );
}

function BotaoPrimario({ children, onClick, className = "", type = "button" }) {
  return (
    <button type={type} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 ${className}`} style={{ background: S.laranja, color: "#fff" }}>
      {children}
    </button>
  );
}

function BotaoSecundario({ children, onClick, className = "", style }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${className}`} style={{ background: S.branco, color: S.laranja, border: `1px solid ${S.laranjaBorda}`, ...style }}>
      {children}
    </button>
  );
}

function IconBtn({ onClick, children, title, perigo }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-gray-100" style={{ color: perigo ? "#D32F2F" : S.tintaSuave }}>
      {children}
    </button>
  );
}

function Campo({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: S.tintaSuave }}>
      {label}
      {children}
    </label>
  );
}

const estiloInput = { border: `1px solid ${S.linha}`, color: S.tinta, background: S.branco };
function Input(props) {
  return <input {...props} className={`text-sm font-normal rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200 ${props.className || ""}`} style={{ ...estiloInput, ...(props.style || {}) }} />;
}
function Select({ children, ...props }) {
  return <select {...props} className={`text-sm font-normal rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200 ${props.className || ""}`} style={{ ...estiloInput, ...(props.style || {}) }}>{children}</select>;
}
function TextArea(props) {
  return <textarea {...props} className={`text-sm font-normal rounded-lg px-3 py-2 outline-none resize-none focus:ring-2 focus:ring-orange-200 ${props.className || ""}`} style={estiloInput} />;
}

function Avatar({ nome, size = 26 }) {
  return (
    <span title={nome} className="rounded-full flex items-center justify-center font-bold shrink-0" style={{ width: size, height: size, fontSize: size * 0.4, background: S.laranjaClaro, color: S.laranja, border: `1px solid ${S.laranjaBorda}` }}>
      {iniciais(nome)}
    </span>
  );
}

function Chip({ cor, children }) {
  return <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: cor + "1A", color: cor }}>{children}</span>;
}

function Modal({ titulo, onFechar, children, largura = 520 }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onMouseDown={onFechar}>
      <div className="w-full rounded-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ maxWidth: largura, background: S.branco }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ background: `linear-gradient(90deg, ${S.laranja}, ${S.laranja2})`, color: "#fff" }}>
          <h3 className="font-bold">{titulo}</h3>
          <button onClick={onFechar} aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function SelectResponsavel({ value, onChange, membros, vazio = "Sem responsável" }) {
  const nomes = membros.map((m) => m.nome);
  return (
    <Select value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{vazio}</option>
      {nomes.map((n) => <option key={n} value={n}>{n}</option>)}
      {value && !nomes.includes(value) && <option value={value}>{value}</option>}
    </Select>
  );
}

// ---------- modais de formulário ----------
function ModalEvento({ evento, membros, onSalvar, onExcluir, onFechar }) {
  const [f, setF] = useState(evento);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const salvar = (e) => {
    e.preventDefault();
    if (!f.titulo.trim() || !f.data) return;
    onSalvar({ ...f, titulo: f.titulo.trim() });
  };
  return (
    <Modal titulo={evento.novo ? "Novo evento" : "Editar evento"} onFechar={onFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Campo label="Título"><Input autoFocus value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Reunião do Comitê" /></Campo>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Data"><Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} /></Campo>
          <Campo label="Início"><Input type="time" value={f.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} /></Campo>
          <Campo label="Fim"><Input type="time" value={f.horaFim} onChange={(e) => set("horaFim", e.target.value)} /></Campo>
        </div>
        <Campo label="Tipo">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button type="button" key={t.id} onClick={() => set("tipo", t.id)} className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: f.tipo === t.id ? t.cor : t.cor + "14", color: f.tipo === t.id ? "#fff" : t.cor }}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Responsável"><SelectResponsavel value={f.responsavel} onChange={(v) => set("responsavel", v)} membros={membros} /></Campo>
          <Campo label="Local"><Input value={f.local} onChange={(e) => set("local", e.target.value)} placeholder="Ex: Hub Recife, online..." /></Campo>
        </div>
        <Campo label="Descrição"><TextArea rows={2} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes, público, observações..." /></Campo>
        <div className="flex items-center justify-between mt-2">
          {!evento.novo ? <button type="button" onClick={() => onExcluir(f.id)} className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#D32F2F" }}><Trash2 size={15} /> Excluir</button> : <span />}
          <BotaoPrimario type="submit"><Check size={16} /> Salvar</BotaoPrimario>
        </div>
      </form>
    </Modal>
  );
}

function ModalDemanda({ demanda, membros, eventos, onSalvar, onExcluir, onFechar }) {
  const [f, setF] = useState(demanda);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const salvar = (e) => {
    e.preventDefault();
    if (!f.titulo.trim()) return;
    onSalvar({ ...f, titulo: f.titulo.trim() });
  };
  const eventosOrdenados = [...eventos].sort(ordenarEventos);
  return (
    <Modal titulo={demanda.novo ? "Nova demanda" : "Editar demanda"} onFechar={onFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Campo label="O que precisa ser feito?"><Input autoFocus value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Criar arte do evento PET" /></Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Responsável"><SelectResponsavel value={f.responsavel} onChange={(v) => set("responsavel", v)} membros={membros} /></Campo>
          <Campo label="Solicitante"><SelectResponsavel value={f.solicitante} onChange={(v) => set("solicitante", v)} membros={membros} vazio="—" /></Campo>
          <Campo label="Prazo"><Input type="date" value={f.prazo} onChange={(e) => set("prazo", e.target.value)} /></Campo>
          <Campo label="Prioridade">
            <Select value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)}>
              {PRIORIDADES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
          </Campo>
          <Campo label="Status">
            <Select value={f.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </Campo>
          <Campo label="Evento relacionado">
            <Select value={f.eventoId || ""} onChange={(e) => set("eventoId", e.target.value)}>
              <option value="">Nenhum</option>
              {eventosOrdenados.map((ev) => <option key={ev.id} value={ev.id}>{fmtCurta(ev.data)} · {ev.titulo}</option>)}
            </Select>
          </Campo>
        </div>
        <Campo label="Detalhes"><TextArea rows={3} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Briefing, links, observações..." /></Campo>
        {membros.length <= 1 && <p className="text-xs" style={{ color: S.tintaSuave }}>Dica: cadastre a equipe na aba <b>Demandas</b> para escolher os responsáveis.</p>}
        <div className="flex items-center justify-between mt-2">
          {!demanda.novo ? <button type="button" onClick={() => onExcluir(f.id)} className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#D32F2F" }}><Trash2 size={15} /> Excluir</button> : <span />}
          <BotaoPrimario type="submit"><Check size={16} /> Salvar</BotaoPrimario>
        </div>
      </form>
    </Modal>
  );
}

function CampoImagem({ value, onChange, cor = S.laranja }) {
  const ref = useRef(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const enviar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErro("Escolha um arquivo de imagem (JPG, PNG, WEBP...)."); return; }
    setErro(""); setCarregando(true);
    try { onChange(await reduzirImagem(file)); } catch { setErro("Não foi possível ler essa imagem."); }
    setCarregando(false);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: value ? "#eee" : cor + "1A", border: `1px dashed ${value ? "transparent" : cor}` }}>
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : carregando ? <Loader2 size={18} className="animate-spin" color={cor} /> : <ImageIcon size={20} color={cor} />}
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => ref.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5" style={{ background: S.laranja, color: "#fff" }}><Upload size={13} /> Enviar imagem</button>
          {value && <button type="button" onClick={() => onChange("")} className="text-xs font-semibold" style={{ color: "#D32F2F" }}>Remover</button>}
        </div>
        <Input value={value && !value.startsWith("data:") ? value : ""} onChange={(e) => onChange(e.target.value.trim())} placeholder="ou cole o link de uma imagem" />
        {erro && <span className="text-xs font-normal" style={{ color: "#D32F2F" }}>{erro}</span>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={enviar} />
    </div>
  );
}

function ModalPasta({ pasta, onSalvar, onExcluir, onFechar }) {
  const [f, setF] = useState(pasta);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const salvar = (e) => {
    e.preventDefault();
    if (!f.nome.trim()) return;
    onSalvar({ ...f, nome: f.nome.trim() });
  };
  return (
    <Modal titulo={pasta.novo ? "Nova pasta de materiais" : "Editar pasta"} onFechar={onFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <Campo label="Nome da campanha / pasta"><Input autoFocus value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Black Friday" /></Campo>
        <Campo label="Descrição curta"><Input value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex: Materiais e comunicação" /></Campo>
        <Campo label="Link da pasta completa (Drive, SharePoint...)"><Input value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="https://..." /></Campo>
        <Campo label="Ilustração">
          <div className="flex gap-2 flex-wrap">
            {[...Object.entries(ILUSTRACOES), ["nenhuma", { label: "Sem ilustração" }]].map(([id, il]) => {
              const ativo = (f.ilustracao || ilustracaoPadrao(f.nome)) === id;
              return (
                <button type="button" key={id} title={il.label} onClick={() => set("ilustracao", id)} className="w-16 h-12 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: il.fundo || "#F3F4F6", outline: ativo ? `3px solid ${S.laranja}` : `1px solid ${S.linha}`, outlineOffset: ativo ? 1 : 0 }}>
                  {id === "nenhuma" ? <X size={16} color={S.tintaSuave} /> : <Ilustracao id={id} className="w-full h-full" />}
                </button>
              );
            })}
          </div>
        </Campo>
        <Campo label="Ou uma foto/arte de capa (fica por cima da ilustração)"><CampoImagem value={f.capa || ""} onChange={(v) => set("capa", v)} cor={f.cor} /></Campo>
        <Campo label="Cor">
          <div className="flex gap-2 flex-wrap">
            {CORES_PASTA.map((c) => (
              <button type="button" key={c} onClick={() => set("cor", c)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: c, outline: f.cor === c ? `3px solid ${c}55` : "none", outlineOffset: 2 }}>
                {f.cor === c && <Check size={14} color="#fff" />}
              </button>
            ))}
          </div>
        </Campo>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: S.tinta }}>
          <input type="checkbox" checked={f.destaque} onChange={(e) => set("destaque", e.target.checked)} className="accent-orange-600 w-4 h-4" />
          Mostrar em <b>Destaques do mês</b> na Visão Geral
        </label>
        <div className="flex items-center justify-between mt-2">
          {!pasta.novo ? <button type="button" onClick={() => onExcluir(f.id)} className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#D32F2F" }}><Trash2 size={15} /> Excluir pasta</button> : <span />}
          <BotaoPrimario type="submit"><Check size={16} /> Salvar</BotaoPrimario>
        </div>
      </form>
    </Modal>
  );
}

// ---------- calendário ----------
function Calendario({ eventos, onNovo, onAbrir, compacto = false }) {
  const [visao, setVisao] = useState("mes");
  const [ref, setRef] = useState(() => new Date());
  const hoje = hojeISO();

  const porDia = useMemo(() => {
    const m = {};
    eventos.forEach((e) => { (m[e.data] = m[e.data] || []).push(e); });
    Object.values(m).forEach((l) => l.sort(ordenarEventos));
    return m;
  }, [eventos]);

  const navegar = (dir) => {
    setRef((r) => (visao === "semana" ? addDias(r, 7 * dir) : new Date(r.getFullYear(), r.getMonth() + dir, 1)));
  };

  const inicioMes = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const fimMes = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const semanaIni = inicioSemana(ref);

  let rotulo;
  if (visao === "semana") {
    const fim = addDias(semanaIni, 6);
    rotulo = `${pad(semanaIni.getDate())}/${pad(semanaIni.getMonth() + 1)} – ${pad(fim.getDate())}/${pad(fim.getMonth() + 1)}`;
  } else {
    rotulo = `${MESES[ref.getMonth()]} de ${ref.getFullYear()}`;
  }

  const limite = compacto ? 2 : 3;

  const ItemEvento = ({ e, grande }) => {
    const t = tipoInfo(e.tipo);
    const destaque = !e.horaInicio; // eventos de dia inteiro ganham "etiqueta" colorida
    if (destaque && !grande) {
      return (
        <button onClick={(x) => { x.stopPropagation(); onAbrir(e); }} className="w-full text-left rounded-md px-1.5 py-1 leading-tight" style={{ background: t.cor + "1A" }}>
          <span className="block text-[11px] font-bold line-clamp-2" style={{ color: t.cor }}>● {e.titulo}</span>
          {e.descricao && <span className="block text-[10px] truncate" style={{ color: S.tintaSuave }}>{e.descricao}</span>}
        </button>
      );
    }
    return (
      <button onClick={(x) => { x.stopPropagation(); onAbrir(e); }} className={`w-full text-left flex gap-1.5 rounded-md hover:bg-gray-50 ${grande ? "p-2" : "px-1 py-0.5"}`} style={grande ? { background: t.cor + "12", borderLeft: `3px solid ${t.cor}` } : {}}>
        {!grande && <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: t.cor }} />}
        <span className="min-w-0 leading-tight">
          <span className={`block font-semibold ${grande ? "text-sm" : "text-[11px] line-clamp-2"}`} style={{ color: S.tinta }}>{e.titulo}</span>
          {horario(e) && <span className={`block ${grande ? "text-xs" : "text-[10px]"}`} style={{ color: S.tintaSuave }}>{horario(e)}</span>}
          {grande && e.responsavel && <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: S.tintaSuave }}><User size={11} /> {e.responsavel}</span>}
        </span>
      </button>
    );
  };

  let corpo;
  if (visao === "mes") {
    const ini = inicioSemana(inicioMes);
    const totalCelulas = Math.ceil(((inicioMes.getDay() + 6) % 7 + fimMes.getDate()) / 7) * 7;
    const celulas = Array.from({ length: totalCelulas }, (_, i) => addDias(ini, i));
    corpo = (
      <div className="overflow-x-auto">
        <div style={{ minWidth: 640 }}>
          <div className="grid grid-cols-7 rounded-t-xl overflow-hidden" style={{ border: `1px solid ${S.linha}`, borderBottom: "none" }}>
            {DIAS_CURTOS.map((d, i) => (
              <div key={d} className="text-center text-xs font-bold py-2" style={{ color: i >= 5 ? S.laranja : S.tintaSuave, background: i >= 5 ? S.laranjaClaro : "#FAFAFA", borderLeft: i ? `1px solid ${S.linha}` : "none" }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 rounded-b-xl overflow-hidden" style={{ border: `1px solid ${S.linha}` }}>
            {celulas.map((d, i) => {
              const iso = toISO(d);
              const doMes = d.getMonth() === ref.getMonth();
              const lista = porDia[iso] || [];
              const ehHoje = iso === hoje;
              const fimDeSemana = i % 7 >= 5;
              return (
                <div
                  key={iso}
                  onClick={() => onNovo(iso)}
                  className="group relative p-1.5 cursor-pointer hover:bg-orange-50/40"
                  style={{
                    minHeight: compacto ? 92 : 112,
                    borderLeft: i % 7 ? `1px solid ${S.linha}` : "none",
                    borderTop: i >= 7 ? `1px solid ${S.linha}` : "none",
                    background: ehHoje ? S.laranjaClaro : S.branco,
                    outline: ehHoje ? `2px solid ${S.laranja}` : "none",
                    outlineOffset: -2,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    {ehHoje ? (
                      <span className="text-xs font-bold rounded-md px-1.5 py-0.5" style={{ background: S.laranja, color: "#fff" }}>{d.getDate()}</span>
                    ) : (
                      <span className="text-sm font-bold px-0.5" style={{ color: !doMes ? "#C4C4C4" : fimDeSemana ? S.laranja : S.tinta }}>{d.getDate()}</span>
                    )}
                    <Plus size={14} className="opacity-0 group-hover:opacity-100" color={S.laranja} />
                  </div>
                  <div className={`flex flex-col gap-1 ${doMes ? "" : "opacity-50"}`}>
                    {lista.slice(0, limite).map((e) => <ItemEvento key={e.id} e={e} />)}
                    {lista.length > limite && (
                      <button onClick={(x) => { x.stopPropagation(); setRef(d); setVisao("semana"); }} className="text-[10px] font-bold text-left px-1" style={{ color: S.laranja }}>+{lista.length - limite} mais</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  } else if (visao === "semana") {
    corpo = (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-2" style={{ minWidth: 760 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDias(semanaIni, i);
            const iso = toISO(d);
            const ehHoje = iso === hoje;
            const lista = porDia[iso] || [];
            return (
              <div key={iso} className="rounded-xl flex flex-col" style={{ border: `1px solid ${ehHoje ? S.laranja : S.linha}`, background: ehHoje ? S.laranjaClaro : S.branco, minHeight: 260 }}>
                <div className="text-center py-2" style={{ borderBottom: `1px solid ${S.linha}` }}>
                  <p className="text-[11px] font-bold" style={{ color: i >= 5 ? S.laranja : S.tintaSuave }}>{DIAS_CURTOS[i]}</p>
                  <p className="text-lg font-extrabold" style={{ color: ehHoje ? S.laranja : S.tinta }}>{d.getDate()}</p>
                </div>
                <div className="flex flex-col gap-1.5 p-1.5 flex-1">
                  {lista.map((e) => <ItemEvento key={e.id} e={e} grande />)}
                  <button onClick={() => onNovo(iso)} className="mt-auto text-xs font-semibold rounded-lg py-1.5 flex items-center justify-center gap-1 hover:bg-orange-50" style={{ color: S.laranja }}><Plus size={13} /> Adicionar</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    const doMes = eventos.filter((e) => { const d = fromISO(e.data); return d >= inicioMes && d <= fimMes; }).sort(ordenarEventos);
    const grupos = [];
    doMes.forEach((e) => {
      const ult = grupos[grupos.length - 1];
      if (ult && ult.data === e.data) ult.itens.push(e); else grupos.push({ data: e.data, itens: [e] });
    });
    corpo = grupos.length === 0 ? (
      <p className="text-sm italic py-8 text-center" style={{ color: S.tintaSuave }}>Nenhum evento neste mês.</p>
    ) : (
      <div className="flex flex-col gap-3">
        {grupos.map((g) => (
          <div key={g.data} className="flex gap-3">
            <div className="w-14 shrink-0 text-center rounded-xl py-1.5" style={{ background: g.data === hoje ? S.laranja : S.laranjaClaro, color: g.data === hoje ? "#fff" : S.laranja }}>
              <p className="text-[10px] font-bold uppercase">{DIAS_CURTOS[(fromISO(g.data).getDay() + 6) % 7]}</p>
              <p className="text-xl font-extrabold leading-none">{fromISO(g.data).getDate()}</p>
            </div>
            <div className="flex-1 grid gap-1.5 sm:grid-cols-2">
              {g.itens.map((e) => <ItemEvento key={e.id} e={e} grande />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${S.linha}` }}>
          {[["semana", "Semana"], ["mes", "Mês"], ["lista", "Lista"]].map(([id, l]) => (
            <button key={id} onClick={() => setVisao(id)} className="text-sm px-4 py-1.5 font-semibold" style={{ background: visao === id ? S.laranja : S.branco, color: visao === id ? "#fff" : S.tintaSuave }}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navegar(-1)} aria-label="Anterior" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${S.linha}` }}><ChevronLeft size={16} /></button>
          <button onClick={() => setRef(new Date())} className="text-sm font-bold rounded-lg px-3 h-8 min-w-[150px]" style={{ border: `1px solid ${S.linha}`, color: S.tinta }} title="Voltar para hoje">{rotulo}</button>
          <button onClick={() => navegar(1)} aria-label="Próximo" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${S.linha}` }}><ChevronRight size={16} /></button>
        </div>
      </div>
      {corpo}
    </div>
  );
}

function LegendaTipos({ eventos }) {
  const agora = new Date();
  const contagem = (id) => eventos.filter((e) => e.tipo === id && fromISO(e.data).getMonth() === agora.getMonth() && fromISO(e.data).getFullYear() === agora.getFullYear()).length;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
      {TIPOS.map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-sm" style={{ color: S.tinta }}>
          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: t.cor }} />
          <span className="flex-1 truncate">{t.label} <span className="text-xs">{t.emoji}</span></span>
          <span className="text-xs font-bold" style={{ color: S.tintaSuave }}>{contagem(t.id)}</span>
        </div>
      ))}
    </div>
  );
}

function AgendaSemana({ eventos, onAbrir }) {
  const ini = inicioSemana(new Date());
  const fim = addDias(ini, 6);
  const daSemana = eventos.filter((e) => { const d = fromISO(e.data); return d >= ini && d <= fim; }).sort(ordenarEventos);
  if (daSemana.length === 0) return <p className="text-sm italic" style={{ color: S.tintaSuave }}>Nenhuma atividade nesta semana.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {daSemana.map((e) => {
        const t = tipoInfo(e.tipo);
        const passou = e.data < hojeISO();
        return (
          <button key={e.id} onClick={() => onAbrir(e)} className="flex items-center gap-3 text-left rounded-lg px-2 py-1.5 hover:bg-gray-50" style={{ opacity: passou ? 0.55 : 1 }}>
            <span className="text-[11px] font-bold w-14 shrink-0 uppercase" style={{ color: e.data === hojeISO() ? S.laranja : S.tintaSuave }}>{e.data === hojeISO() ? "Hoje" : DIAS_LONGOS[(fromISO(e.data).getDay() + 6) % 7].slice(0, 3) + " " + fromISO(e.data).getDate()}</span>
            <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: t.cor }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold truncate" style={{ color: S.tinta }}>{e.titulo}</span>
              <span className="block text-xs" style={{ color: S.tintaSuave }}>{horario(e) || "Dia inteiro"}{e.responsavel ? ` · ${e.responsavel}` : ""}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- materiais ----------
function botaoDownloadProps(arquivo) {
  if (arquivo.dataUrl) return { href: arquivo.dataUrl, download: arquivo.nome };
  return { href: arquivo.link, target: "_blank", rel: "noreferrer" };
}

const ilustracaoDa = (pasta) => pasta.ilustracao || ilustracaoPadrao(pasta.nome);

function CapaPasta({ pasta, altura = 88 }) {
  const il = ilustracaoDa(pasta);
  if (il === "nenhuma" && !pasta.capa) {
    return (
      <div className="rounded-xl flex items-center justify-center relative overflow-hidden" style={{ height: altura, background: `linear-gradient(135deg, ${pasta.cor}, ${pasta.cor}B3)` }}>
        <Folder size={altura * 0.42} color="#fff" fill="rgba(255,255,255,0.25)" />
      </div>
    );
  }
  const fundo = ILUSTRACOES[il]?.fundo || S.laranjaClaro;
  return (
    <div className="rounded-xl flex items-center justify-center relative overflow-hidden" style={{ height: altura, background: `linear-gradient(160deg, #fff 0%, ${fundo} 70%)`, borderBottom: `3px solid ${pasta.cor}` }}>
      {pasta.capa && <img src={pasta.capa} alt="" className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => (e.currentTarget.style.display = "none")} />}
      {il !== "nenhuma" && <Ilustracao id={il} className="h-full w-full p-1" />}
    </div>
  );
}

function DestaquesDoMes({ pastas, irParaPasta }) {
  const trilho = useRef(null);
  const destaques = pastas.filter((p) => p.destaque);
  const rolar = (dir) => trilho.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  if (destaques.length === 0) return <p className="text-sm italic" style={{ color: S.tintaSuave }}>Marque pastas como destaque na aba Materiais Regionais.</p>;
  return (
    <div className="relative">
      <div ref={trilho} className="flex gap-3 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: "none" }}>
        {destaques.map((p) => {
          const temDownload = p.link || p.arquivos.length > 0;
          return (
            <div key={p.id} className="snap-start shrink-0 rounded-xl p-2 flex flex-col gap-1.5 text-center" style={{ width: 132, border: `1px solid ${S.linha}` }}>
              <CapaPasta pasta={p} altura={72} />
              <p className="text-xs font-bold leading-tight" style={{ color: S.tinta }}>{p.nome}</p>
              <p className="text-[11px] leading-tight" style={{ color: S.tintaSuave }}>{p.descricao || `${p.arquivos.length} arquivo(s)`}</p>
              {p.link ? (
                <a href={p.link} target="_blank" rel="noreferrer" className="mt-auto rounded-full text-xs font-bold py-1.5 flex items-center justify-center gap-1" style={{ background: S.laranja, color: "#fff" }}><Download size={12} /> Download</a>
              ) : (
                <button onClick={() => irParaPasta(p.id)} className="mt-auto rounded-full text-xs font-bold py-1.5 flex items-center justify-center gap-1" style={{ background: temDownload ? S.laranja : S.laranjaClaro, color: temDownload ? "#fff" : S.laranja }}>
                  {temDownload ? <><Download size={12} /> Download</> : <><Plus size={12} /> Adicionar</>}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {destaques.length > 2 && (
        <>
          <button onClick={() => rolar(-1)} aria-label="Anterior" className="absolute left-0 top-9 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow" style={{ background: S.branco }}><ChevronLeft size={15} /></button>
          <button onClick={() => rolar(1)} aria-label="Próximo" className="absolute right-0 top-9 translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow" style={{ background: S.branco }}><ChevronRight size={15} /></button>
        </>
      )}
    </div>
  );
}

function AbaMateriais({ state, update, pastaAberta, setPastaAberta, busca }) {
  const [modalPasta, setModalPasta] = useState(null);
  const [preview, setPreview] = useState(null);
  const [nomeArq, setNomeArq] = useState("");
  const [linkArq, setLinkArq] = useState("");
  const [erroUpload, setErroUpload] = useState("");
  const inputArquivo = useRef(null);

  const pasta = state.pastas.find((p) => p.id === pastaAberta);
  const salvarPasta = (p) => {
    const { novo, ...limpa } = p;
    update((s) => ({ ...s, pastas: novo ? [...s.pastas, limpa] : s.pastas.map((x) => (x.id === p.id ? limpa : x)) }));
    setModalPasta(null);
  };
  const excluirPasta = (id) => {
    if (!window.confirm("Excluir esta pasta e todos os seus arquivos?")) return;
    update((s) => ({ ...s, pastas: s.pastas.filter((x) => x.id !== id) }));
    setModalPasta(null);
    setPastaAberta(null);
  };
  const atualizarArquivos = (fn) => update((s) => ({ ...s, pastas: s.pastas.map((x) => (x.id === pastaAberta ? { ...x, arquivos: fn(x.arquivos) } : x)) }));

  const addLink = () => {
    const link = linkArq.trim();
    if (!link) return;
    const href = /^https?:\/\//i.test(link) ? link : `https://${link}`;
    atualizarArquivos((a) => [...a, { id: uid(), nome: nomeArq.trim() || link, link: href, adicionadoEm: hojeISO(), por: state.usuario }]);
    setNomeArq(""); setLinkArq("");
  };
  const enviarArquivo = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const grandes = files.filter((f) => f.size > LIMITE_UPLOAD_MB * 1024 * 1024);
    setErroUpload(grandes.length ? `${grandes.map((f) => f.name).join(", ")}: maior que ${LIMITE_UPLOAD_MB} MB. Para arquivos grandes, suba no Drive/SharePoint e cole o link.` : "");
    files.filter((f) => f.size <= LIMITE_UPLOAD_MB * 1024 * 1024).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => atualizarArquivos((a) => [...a, { id: uid(), nome: file.name, dataUrl: reader.result, tamanho: file.size, adicionadoEm: hojeISO(), por: state.usuario }]);
      reader.readAsDataURL(file);
    });
  };

  const termo = busca.trim().toLowerCase();
  const pastasFiltradas = termo ? state.pastas.filter((p) => p.nome.toLowerCase().includes(termo) || p.arquivos.some((a) => a.nome.toLowerCase().includes(termo))) : state.pastas;

  if (pasta) {
    return (
      <div>
        <button onClick={() => setPastaAberta(null)} className="flex items-center gap-1 text-sm font-semibold mb-4" style={{ color: S.laranja }}><ChevronLeft size={16} /> Todas as pastas</button>
        <Card className="p-5">
          <div className="flex flex-wrap items-start gap-4 mb-5">
            <div style={{ width: 120 }}><CapaPasta pasta={pasta} altura={84} /></div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold" style={{ color: S.tinta }}>{pasta.nome}</h2>
                {pasta.destaque && <Chip cor={S.laranja}><Star size={11} fill={S.laranja} /> Destaque</Chip>}
              </div>
              <p className="text-sm" style={{ color: S.tintaSuave }}>{pasta.descricao || "Sem descrição"} · {pasta.arquivos.length} arquivo(s)</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {pasta.link && <a href={pasta.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: S.laranja, color: "#fff" }}><ExternalLink size={15} /> Abrir pasta completa</a>}
                <BotaoSecundario onClick={() => setModalPasta(pasta)}><Pencil size={14} /> Editar pasta</BotaoSecundario>
              </div>
            </div>
          </div>

          {pasta.arquivos.some(ehImagem) && (
            <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {pasta.arquivos.filter(ehImagem).map((a) => (
                <button key={a.id} onClick={() => setPreview(a)} className="rounded-xl overflow-hidden text-left hover:shadow-md transition-shadow" style={{ border: `1px solid ${S.linha}` }}>
                  <img src={srcArquivo(a)} alt={a.nome} className="w-full aspect-square object-cover" style={{ background: S.fundo }} />
                  <p className="text-xs font-semibold truncate px-2 py-1.5" style={{ color: S.tinta }}>{a.nome}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-5">
            {pasta.arquivos.length === 0 && <p className="text-sm italic py-4 text-center rounded-xl" style={{ color: S.tintaSuave, background: S.fundo }}>Nenhum arquivo ainda. Adicione um link ou envie um arquivo abaixo.</p>}
            {pasta.arquivos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${S.linha}` }}>
                {ehImagem(a) ? (
                  <button onClick={() => setPreview(a)} title="Ver imagem" className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: pasta.cor + "1A" }}>
                    <img src={srcArquivo(a)} alt={a.nome} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: pasta.cor + "1A", color: pasta.cor }}>{a.dataUrl ? <FileText size={18} /> : <LinkIcon size={18} />}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: S.tinta }}>{a.nome}</p>
                  <p className="text-xs truncate" style={{ color: S.tintaSuave }}>{a.dataUrl ? `${(a.tamanho / 1024).toFixed(0)} KB` : a.link} · {fmtCurta(a.adicionadoEm)}{a.por ? ` · ${a.por}` : ""}</p>
                </div>
                <a {...botaoDownloadProps(a)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shrink-0" style={{ background: S.laranja, color: "#fff" }}><Download size={13} /> <span className="hidden sm:inline">Download</span></a>
                <IconBtn perigo title="Remover arquivo" onClick={() => window.confirm(`Remover "${a.nome}"?`) && atualizarArquivos((l) => l.filter((x) => x.id !== a.id))}><Trash2 size={15} /></IconBtn>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: S.laranjaClaro }}>
            <p className="text-sm font-bold mb-2" style={{ color: S.laranja }}>Adicionar material</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={nomeArq} onChange={(e) => setNomeArq(e.target.value)} placeholder="Nome (ex: Arte feed 1080x1080)" className="sm:w-1/3" />
              <Input value={linkArq} onChange={(e) => setLinkArq(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} placeholder="Link do arquivo (Drive, Canva, SharePoint...)" className="flex-1" />
              <BotaoPrimario onClick={addLink}><LinkIcon size={15} /> Adicionar link</BotaoPrimario>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <BotaoSecundario onClick={() => inputArquivo.current?.click()}><Upload size={15} /> Enviar arquivo ou imagem (até {LIMITE_UPLOAD_MB} MB)</BotaoSecundario>
              <input ref={inputArquivo} type="file" multiple className="hidden" onChange={enviarArquivo} />
              {erroUpload && <span className="text-xs" style={{ color: "#D32F2F" }}>{erroUpload}</span>}
            </div>
          </div>
        </Card>
        {modalPasta && <ModalPasta pasta={modalPasta} onSalvar={salvarPasta} onExcluir={excluirPasta} onFechar={() => setModalPasta(null)} />}
        {preview && (
          <Modal titulo={preview.nome} onFechar={() => setPreview(null)} largura={900}>
            <img src={srcArquivo(preview)} alt={preview.nome} className="w-full max-h-[65vh] object-contain rounded-lg" style={{ background: S.fundo }} />
            <div className="flex justify-end mt-4">
              <a {...botaoDownloadProps(preview)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: S.laranja, color: "#fff" }}><Download size={15} /> Download</a>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <CabecalhoPagina icon={FolderOpen} titulo="Materiais Regionais" sub="Todo o conteúdo regional disponível para download, organizado por campanha."
        acao={<BotaoPrimario onClick={() => setModalPasta({ id: uid(), nome: "", descricao: "", link: "", cor: CORES_PASTA[state.pastas.length % CORES_PASTA.length], destaque: false, arquivos: [], novo: true })}><Plus size={16} /> Nova pasta</BotaoPrimario>} />
      {termo && <p className="text-sm mb-3" style={{ color: S.tintaSuave }}>Filtrando por “{busca}”</p>}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {pastasFiltradas.map((p) => (
          <button key={p.id} onClick={() => setPastaAberta(p.id)} className="text-left rounded-2xl p-3 flex flex-col gap-2 transition-shadow hover:shadow-md" style={{ background: S.branco, border: `1px solid ${S.linha}` }}>
            <CapaPasta pasta={p} />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight" style={{ color: S.tinta }}>{p.nome}</p>
                <p className="text-xs" style={{ color: S.tintaSuave }}>{p.arquivos.length} arquivo(s)</p>
              </div>
              {p.destaque && <Star size={15} color={S.laranja} fill={S.laranja} className="shrink-0" />}
            </div>
          </button>
        ))}
      </div>
      {modalPasta && <ModalPasta pasta={modalPasta} onSalvar={salvarPasta} onExcluir={excluirPasta} onFechar={() => setModalPasta(null)} />}
    </div>
  );
}

// ---------- demandas ----------
function Equipe({ state, update }) {
  const [nome, setNome] = useState("");
  const add = () => {
    const n = nome.trim();
    if (!n || state.membros.some((m) => m.nome.toLowerCase() === n.toLowerCase())) return;
    update((s) => ({ ...s, membros: [...s.membros, { id: uid(), nome: n }] }));
    setNome("");
  };
  const carga = (n) => state.demandas.filter((d) => d.responsavel === n && d.status !== "concluida").length;
  return (
    <Card className="p-4">
      <TituloSecao icon={Users} sub="Quem pode ser responsável pelas demandas">Equipe do comitê</TituloSecao>
      <div className="flex flex-col gap-1.5 mb-3">
        {state.membros.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <Avatar nome={m.nome} />
            <span className="text-sm flex-1 truncate" style={{ color: S.tinta }}>{m.nome}</span>
            <span className="text-[11px] font-semibold" style={{ color: S.tintaSuave }}>{carga(m.nome)} aberta(s)</span>
            <IconBtn perigo title="Remover da equipe" onClick={() => update((s) => ({ ...s, membros: s.membros.filter((x) => x.id !== m.id) }))}><X size={14} /></IconBtn>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nome do membro" className="flex-1 min-w-0" />
        <button onClick={add} aria-label="Adicionar membro" className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: S.laranja, color: "#fff" }}><Plus size={16} /></button>
      </div>
    </Card>
  );
}

function AbaDemandas({ state, update, abrirDemanda, novaDemanda, busca }) {
  const [filtroStatus, setFiltroStatus] = useState("abertas");
  const [filtroResp, setFiltroResp] = useState("");
  const termo = busca.trim().toLowerCase();

  const lista = state.demandas
    .filter((d) => (filtroStatus === "todas" ? true : filtroStatus === "abertas" ? d.status !== "concluida" : d.status === filtroStatus))
    .filter((d) => (filtroResp === "__eu" ? d.responsavel === state.usuario : filtroResp ? d.responsavel === filtroResp : true))
    .filter((d) => !termo || d.titulo.toLowerCase().includes(termo) || (d.responsavel || "").toLowerCase().includes(termo))
    .sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999"));

  const mudarStatus = (id, status) => update((s) => ({ ...s, demandas: s.demandas.map((d) => (d.id === id ? { ...d, status } : d)) }));
  const mudarResp = (id, responsavel) => update((s) => ({ ...s, demandas: s.demandas.map((d) => (d.id === id ? { ...d, responsavel } : d)) }));

  return (
    <div>
      <CabecalhoPagina icon={ClipboardList} titulo="Demandas" sub="Controle de demandas do comitê — quem faz o quê e até quando." acao={<BotaoPrimario onClick={novaDemanda}><Plus size={16} /> Nova demanda</BotaoPrimario>} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {STATUS.map((s) => {
          const n = state.demandas.filter((d) => d.status === s.id).length;
          const ativo = filtroStatus === s.id;
          return (
            <button key={s.id} onClick={() => setFiltroStatus(ativo ? "abertas" : s.id)} className="rounded-xl px-3 py-3 text-left transition-shadow hover:shadow" style={{ background: ativo ? s.cor : S.branco, border: `1px solid ${ativo ? s.cor : S.linha}` }}>
              <p className="text-2xl font-extrabold" style={{ color: ativo ? "#fff" : s.cor }}>{n}</p>
              <p className="text-xs font-semibold" style={{ color: ativo ? "#fff" : S.tintaSuave }}>{s.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        <Card className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="abertas">Abertas</option>
              <option value="todas">Todas</option>
              {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
            <Select value={filtroResp} onChange={(e) => setFiltroResp(e.target.value)}>
              <option value="">Todos os responsáveis</option>
              {state.usuario && <option value="__eu">Minhas demandas</option>}
              {state.membros.map((m) => <option key={m.id} value={m.nome}>{m.nome}</option>)}
            </Select>
          </div>

          {lista.length === 0 && <div className="flex flex-col items-center py-6"><Mascote size={100} /><p className="text-sm" style={{ color: S.tintaSuave }}>Nenhuma demanda com esses filtros.</p></div>}
          <div className="flex flex-col gap-2">
            {lista.map((d) => {
              const st = statusInfo(d.status);
              const pr = prioridadeInfo(d.prioridade);
              const u = d.status !== "concluida" ? urgencia(d.prazo) : null;
              const ev = d.eventoId && state.eventos.find((e) => e.id === d.eventoId);
              return (
                <div key={d.id} className="rounded-xl p-3 flex flex-col md:flex-row md:items-center gap-3" style={{ border: `1px solid ${S.linha}`, borderLeft: `4px solid ${pr.cor}` }}>
                  <button onClick={() => abrirDemanda(d)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold" style={{ color: S.tinta, textDecoration: d.status === "concluida" ? "line-through" : "none" }}>{d.titulo}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Chip cor={pr.cor}>Prioridade {pr.label.toLowerCase()}</Chip>
                      {u && <Chip cor={u.cor}><Clock size={11} /> {u.label}</Chip>}
                      {d.prazo && !u && <span className="text-[11px]" style={{ color: S.tintaSuave }}>Prazo {fmtCurta(d.prazo)}</span>}
                      {ev && <span className="text-[11px] flex items-center gap-1" style={{ color: S.tintaSuave }}><CalendarIcon size={11} /> {ev.titulo}</span>}
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {d.responsavel ? <Avatar nome={d.responsavel} size={24} /> : <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: `1px dashed ${S.tintaSuave}` }}><User size={12} color={S.tintaSuave} /></span>}
                      <SelectResponsavel value={d.responsavel} onChange={(v) => mudarResp(d.id, v)} membros={state.membros} vazio="Atribuir..." />
                    </div>
                    <Select value={d.status} onChange={(e) => mudarStatus(d.id, e.target.value)} style={{ color: st.cor, fontWeight: 600, background: st.cor + "12", borderColor: st.cor + "40" }}>
                      {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </Select>
                    <IconBtn title="Editar" onClick={() => abrirDemanda(d)}><Pencil size={15} /></IconBtn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Equipe state={state} update={update} />
      </div>
    </div>
  );
}

// ---------- próximos passos ----------
function LinhaPasso({ p, membros, alterar, remover }) {
  const u = !p.feito ? urgencia(p.prazo) : null;
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl px-3 py-2" style={{ border: `1px solid ${S.linha}` }}>
      <button onClick={() => alterar(p.id, { feito: !p.feito })} aria-label="Marcar como feito" className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center border-2" style={{ borderColor: p.feito ? "#27AE60" : "#C4C4C4", background: p.feito ? "#27AE60" : "transparent" }}>
        {p.feito && <Check size={13} color="#fff" strokeWidth={3} />}
      </button>
      <span className="text-sm flex-1 min-w-[140px]" style={{ color: p.feito ? S.tintaSuave : S.tinta, textDecoration: p.feito ? "line-through" : "none" }}>{p.texto}</span>
      {u && <Chip cor={u.cor}>{u.label}</Chip>}
      <div className="w-[170px]"><SelectResponsavel value={p.responsavel} onChange={(v) => alterar(p.id, { responsavel: v })} membros={membros} /></div>
      <Input type="date" value={p.prazo} onChange={(e) => alterar(p.id, { prazo: e.target.value })} className="w-[140px]" />
      <IconBtn perigo title="Remover" onClick={() => remover(p.id)}><Trash2 size={15} /></IconBtn>
    </div>
  );
}

function AbaPassos({ state, update }) {
  const [texto, setTexto] = useState("");
  const [resp, setResp] = useState("");
  const [prazo, setPrazo] = useState("");
  const add = () => {
    if (!texto.trim()) return;
    update((s) => ({ ...s, passos: [...s.passos, { id: uid(), texto: texto.trim(), feito: false, responsavel: resp, prazo }] }));
    setTexto(""); setPrazo("");
  };
  const alterar = (id, campos) => update((s) => ({ ...s, passos: s.passos.map((p) => (p.id === id ? { ...p, ...campos } : p)) }));
  const remover = (id) => update((s) => ({ ...s, passos: s.passos.filter((p) => p.id !== id) }));
  const pendentes = state.passos.filter((p) => !p.feito).sort((a, b) => (a.prazo || "9999").localeCompare(b.prazo || "9999"));
  const feitos = state.passos.filter((p) => p.feito);
  const total = state.passos.length;
  const pct = total ? Math.round((feitos.length / total) * 100) : 0;

  return (
    <div>
      <CabecalhoPagina icon={ListChecks} titulo="Próximos passos" sub="Checklist de organização do comitê." />
      <Card className="p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: S.tinta }}>{feitos.length} de {total} concluídos</span>
          <span className="text-sm font-extrabold" style={{ color: S.laranja }}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: S.laranjaClaro }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${S.laranja}, ${S.laranja2})` }} />
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Novo passo (ex: Confirmar fornecedor do coffee break)" className="flex-1" />
          <div className="sm:w-[180px]"><SelectResponsavel value={resp} onChange={setResp} membros={state.membros} /></div>
          <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="sm:w-[150px]" />
          <BotaoPrimario onClick={add}><Plus size={16} /> Adicionar</BotaoPrimario>
        </div>
        <div className="flex flex-col gap-2">
          {pendentes.length === 0 && <div className="flex flex-col items-center py-4"><Mascote size={110} /><p className="text-sm font-semibold" style={{ color: S.laranja }}>Tudo em dia! 🎉</p></div>}
          {pendentes.map((p) => <LinhaPasso key={p.id} p={p} membros={state.membros} alterar={alterar} remover={remover} />)}
        </div>
        {feitos.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-6 mb-2">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: S.tintaSuave }}>Concluídos</p>
              <button onClick={() => update((s) => ({ ...s, passos: s.passos.filter((p) => !p.feito) }))} className="text-xs font-semibold" style={{ color: S.laranja }}>Limpar concluídos</button>
            </div>
            <div className="flex flex-col gap-2">{feitos.map((p) => <LinhaPasso key={p.id} p={p} membros={state.membros} alterar={alterar} remover={remover} />)}</div>
          </>
        )}
      </Card>
    </div>
  );
}

// ---------- ideias ----------
function AbaIdeias({ state, update }) {
  const [texto, setTexto] = useState("");
  const add = () => {
    if (!texto.trim()) return;
    update((s) => ({ ...s, ideias: [{ id: uid(), texto: texto.trim(), autor: s.usuario, data: hojeISO(), votos: 0 }, ...s.ideias] }));
    setTexto("");
  };
  const votar = (id) => update((s) => ({ ...s, ideias: s.ideias.map((i) => (i.id === id ? { ...i, votos: i.votos + 1 } : i)) }));
  const remover = (id) => update((s) => ({ ...s, ideias: s.ideias.filter((i) => i.id !== id) }));
  const ordenadas = [...state.ideias].sort((a, b) => b.votos - a.votos);
  return (
    <div>
      <CabecalhoPagina icon={Lightbulb} titulo="Ideias e sugestões" sub="Um mural para o comitê propor e votar em novas ações." />
      <Card className="p-5 mb-5">
        <TextArea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Qual a sua ideia para o próximo evento?" className="w-full" />
        <div className="flex justify-end mt-2"><BotaoPrimario onClick={add}><Lightbulb size={16} /> Enviar ideia</BotaoPrimario></div>
      </Card>
      {ordenadas.length === 0 && <div className="flex flex-col items-center py-6"><Mascote size={120} /><p className="text-sm" style={{ color: S.tintaSuave }}>Nenhuma ideia ainda — que tal ser a primeira pessoa? 💡</p></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenadas.map((i) => (
          <Card key={i.id} className="p-4 flex flex-col gap-3">
            <p className="text-sm flex-1 whitespace-pre-wrap" style={{ color: S.tinta }}>{i.texto}</p>
            <div className="flex items-center gap-2">
              <Avatar nome={i.autor} size={22} />
              <span className="text-xs flex-1 truncate" style={{ color: S.tintaSuave }}>{i.autor || "Anônimo"} · {fmtCurta(i.data)}</span>
              <button onClick={() => votar(i.id)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: S.laranjaClaro, color: S.laranja }}><Heart size={12} fill={i.votos ? S.laranja : "none"} /> {i.votos}</button>
              <IconBtn perigo title="Remover" onClick={() => remover(i.id)}><Trash2 size={14} /></IconBtn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------- visão geral ----------
function Banner() {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${S.laranjaClaro}, #FFE2D6)`, border: `1px solid ${S.laranjaBorda}` }}>
      <div className="relative z-10 pr-24 py-2">
        <p className="text-lg font-extrabold leading-tight" style={{ color: S.tinta }}>Eventos que engajam pessoas e constroem</p>
        <p className="text-2xl font-black leading-tight" style={{ color: S.laranja }}>grandes histórias!</p>
      </div>
      <Mascote pose="megafone" size={118} className="absolute right-0 bottom-0" />
      <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full" style={{ background: "rgba(238,77,45,0.08)" }} />
    </div>
  );
}

function Indicadores({ state }) {
  const agora = new Date();
  const ini = inicioSemana(agora);
  const fim = addDias(ini, 6);
  const itens = [
    { label: "Eventos no mês", valor: state.eventos.filter((e) => { const d = fromISO(e.data); return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear(); }).length, icon: CalendarIcon },
    { label: "Atividades na semana", valor: state.eventos.filter((e) => { const d = fromISO(e.data); return d >= ini && d <= fim; }).length, icon: Clock },
    { label: "Demandas abertas", valor: state.demandas.filter((d) => d.status !== "concluida").length, icon: ClipboardList },
    { label: "Passos pendentes", valor: state.passos.filter((p) => !p.feito).length, icon: ListChecks },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {itens.map((i) => (
        <Card key={i.label} className="px-4 py-3 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: S.laranjaClaro, color: S.laranja }}><i.icon size={19} /></span>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-none" style={{ color: S.tinta }}>{i.valor}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: S.tintaSuave }}>{i.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Saudacao({ state }) {
  const agora = new Date();
  const h = agora.getHours();
  const oi = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = (state.usuario || "").split(" ")[0];
  const deHoje = state.eventos.filter((e) => e.data === hojeISO()).sort(ordenarEventos);
  const frase = deHoje.length === 0 ? "Nenhum evento hoje — bom momento para adiantar as demandas! 💪"
    : deHoje.length === 1 ? `Hoje tem ${tipoInfo(deHoje[0].tipo).emoji} ${deHoje[0].titulo}${deHoje[0].horaInicio ? " às " + deHoje[0].horaInicio : ""}. Bora!`
    : `Hoje tem ${deHoje.length} atividades no calendário. Bora! 🚀`;
  return (
    <div className="rounded-2xl relative overflow-hidden flex items-center gap-3 pl-2 pr-5" style={{ background: `linear-gradient(90deg, ${S.laranjaClaro}, #fff)`, border: `1px solid ${S.laranjaBorda}` }}>
      <Mascote size={84} className="shrink-0 self-end" />
      <div className="py-3 min-w-0">
        <p className="text-lg font-extrabold" style={{ color: S.tinta }}>{oi}{primeiroNome ? `, ${primeiroNome}` : ""}! 👋</p>
        <p className="text-sm" style={{ color: S.tintaSuave }}>{fmtLonga(hojeISO()).replace(/^./, (c) => c.toUpperCase())} · {frase}</p>
      </div>
      <span className="hidden md:block absolute right-6 top-3 text-2xl rotate-12">🎈</span>
      <span className="hidden md:block absolute right-20 bottom-2 text-xl -rotate-12">🎉</span>
    </div>
  );
}

function AbaVisaoGeral({ state, onNovoEvento, onAbrirEvento, irParaPasta }) {
  return (
    <div className="flex flex-col gap-5">
      <Saudacao state={state} />
      <Indicadores state={state} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
        <Card className="p-4 sm:p-5 min-w-0">
          <div className="flex items-start gap-3 mb-1">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: S.laranja, color: "#fff" }}><CalendarIcon size={20} /></span>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide" style={{ color: S.tinta }}>Calendário de eventos</h2>
              <p className="text-xs" style={{ color: S.tintaSuave }}>Acompanhe todos os eventos, campanhas e ações da nossa região. Clique em um dia para adicionar.</p>
            </div>
          </div>
          <Calendario eventos={state.eventos} onNovo={onNovoEvento} onAbrir={onAbrirEvento} />
        </Card>
        <div className="flex flex-col gap-5">
          <Card className="p-4">
            <TituloSecao icon={Star}>Destaques do mês</TituloSecao>
            <DestaquesDoMes pastas={state.pastas} irParaPasta={irParaPasta} />
          </Card>
          <Card className="p-4">
            <TituloSecao icon={Clock} sub="Atividades de segunda a domingo">Esta semana</TituloSecao>
            <AgendaSemana eventos={state.eventos} onAbrir={onAbrirEvento} />
          </Card>
          <Card className="p-4">
            <TituloSecao icon={ListChecks} sub="Quantidade no mês atual">Tipos de eventos</TituloSecao>
            <LegendaTipos eventos={state.eventos} />
          </Card>
          <Banner />
        </div>
      </div>
    </div>
  );
}

function AbaCalendario({ state, onNovoEvento, onAbrirEvento }) {
  return (
    <div>
      <CabecalhoPagina icon={CalendarIcon} titulo="Calendário" sub="Semana, mês e lista de todas as atividades do comitê."
        acao={<BotaoPrimario onClick={() => onNovoEvento(hojeISO())}><Plus size={16} /> Novo evento</BotaoPrimario>} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <Card className="p-4 sm:p-5 min-w-0"><Calendario eventos={state.eventos} onNovo={onNovoEvento} onAbrir={onAbrirEvento} /></Card>
        <div className="flex flex-col gap-5">
          <Card className="p-4">
            <TituloSecao icon={Clock}>Atividades da semana</TituloSecao>
            <AgendaSemana eventos={state.eventos} onAbrir={onAbrirEvento} />
          </Card>
          <Card className="p-4">
            <TituloSecao icon={ListChecks}>Tipos de eventos</TituloSecao>
            <LegendaTipos eventos={state.eventos} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- busca global ----------
function BuscaGlobal({ state, valor, setValor, irPara }) {
  const [aberto, setAberto] = useState(false);
  const termo = valor.trim().toLowerCase();
  const resultados = useMemo(() => {
    if (termo.length < 2) return [];
    const r = [];
    state.eventos.filter((e) => e.titulo.toLowerCase().includes(termo)).sort(ordenarEventos).slice(0, 5)
      .forEach((e) => r.push({ id: e.id, tipo: "Evento", titulo: e.titulo, sub: fmtCurta(e.data), acao: () => irPara("evento", e) }));
    state.pastas.forEach((p) => {
      if (p.nome.toLowerCase().includes(termo)) r.push({ id: p.id, tipo: "Material", titulo: p.nome, sub: `${p.arquivos.length} arquivo(s)`, acao: () => irPara("pasta", p) });
      p.arquivos.filter((a) => a.nome.toLowerCase().includes(termo)).forEach((a) => r.push({ id: a.id, tipo: "Arquivo", titulo: a.nome, sub: p.nome, acao: () => irPara("pasta", p) }));
    });
    state.demandas.filter((d) => d.titulo.toLowerCase().includes(termo)).slice(0, 5)
      .forEach((d) => r.push({ id: d.id, tipo: "Demanda", titulo: d.titulo, sub: statusInfo(d.status).label, acao: () => irPara("demanda", d) }));
    return r.slice(0, 12);
  }, [termo, state, irPara]);

  return (
    <div className="relative flex-1 max-w-md">
      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" color={S.tintaSuave} />
      <input
        value={valor}
        onChange={(e) => { setValor(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        placeholder="Buscar eventos, materiais, demandas..."
        className="w-full rounded-full pl-10 pr-9 py-2.5 text-sm outline-none"
        style={{ background: S.branco, color: S.tinta }}
      />
      {valor && <button onClick={() => setValor("")} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2"><X size={15} color={S.tintaSuave} /></button>}
      {aberto && termo.length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden z-40 shadow-xl" style={{ background: S.branco, border: `1px solid ${S.linha}` }}>
          {resultados.length === 0 && <p className="text-sm px-4 py-3" style={{ color: S.tintaSuave }}>Nada encontrado.</p>}
          {resultados.map((r) => (
            <button key={r.tipo + r.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { r.acao(); setAberto(false); }} className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-orange-50">
              <span className="text-[10px] font-bold uppercase w-16 shrink-0" style={{ color: S.laranja }}>{r.tipo}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold truncate" style={{ color: S.tinta }}>{r.titulo}</span>
                <span className="block text-xs truncate" style={{ color: S.tintaSuave }}>{r.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notificacoes({ state, abrirDemanda, abrirEvento }) {
  const [aberto, setAberto] = useState(false);
  const hoje = hojeISO();
  const limite = toISO(addDias(new Date(), 3));
  const itens = [
    ...state.demandas.filter((d) => d.status !== "concluida" && d.prazo && d.prazo <= limite).map((d) => ({ id: d.id, titulo: d.titulo, sub: `Demanda · ${urgencia(d.prazo).label}`, cor: urgencia(d.prazo).cor, acao: () => abrirDemanda(d) })),
    ...state.eventos.filter((e) => e.data >= hoje && e.data <= limite).sort(ordenarEventos).map((e) => ({ id: e.id, titulo: e.titulo, sub: `Evento · ${e.data === hoje ? "hoje" : fmtCurta(e.data)}${e.horaInicio ? " " + e.horaInicio : ""}`, cor: tipoInfo(e.tipo).cor, acao: () => abrirEvento(e) })),
  ];
  return (
    <div className="relative">
      <button onClick={() => setAberto((a) => !a)} aria-label="Notificações" className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/15">
        <Bell size={21} color="#fff" />
        {itens.length > 0 && <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1" style={{ background: "#fff", color: S.laranja }}>{itens.length}</span>}
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-xl overflow-hidden z-40 shadow-xl" style={{ background: S.branco, border: `1px solid ${S.linha}` }}>
            <p className="text-xs font-bold uppercase px-4 py-2.5" style={{ color: S.laranja, borderBottom: `1px solid ${S.linha}` }}>Próximos 3 dias</p>
            {itens.length === 0 && <p className="text-sm px-4 py-3" style={{ color: S.tintaSuave }}>Nada urgente por aqui.</p>}
            {itens.map((i) => (
              <button key={i.id} onClick={() => { i.acao(); setAberto(false); }} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-orange-50">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: i.cor }} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate" style={{ color: S.tinta }}>{i.titulo}</span>
                  <span className="block text-xs" style={{ color: S.tintaSuave }}>{i.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- app ----------
const ABAS = [
  { id: "visao", label: "Visão Geral", icon: Home },
  { id: "calendario", label: "Calendário", icon: CalendarIcon },
  { id: "materiais", label: "Materiais Regionais", icon: FolderOpen },
  { id: "demandas", label: "Demandas", icon: ClipboardList },
  { id: "passos", label: "Próximos Passos", icon: ListChecks },
  { id: "ideias", label: "Ideias e Sugestões", icon: Lightbulb },
];

export default function ComiteEventos() {
  const [state, setState] = useState(null);
  const [aba, setAba] = useState("visao");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [pastaAberta, setPastaAberta] = useState(null);
  const [modalEvento, setModalEvento] = useState(null);
  const [modalDemanda, setModalDemanda] = useState(null);
  const salvarTimer = useRef(null);

  useEffect(() => {
    carregarComite().then((salvo) => {
      const base = estadoInicial();
      setState(salvo ? { ...base, ...salvo } : base);
    });
  }, []);

  // Recarrega da nuvem ao voltar para a aba, para ver o que o resto do comitê mudou.
  useEffect(() => {
    if (!sincronizaNaNuvem) return;
    const aoFocar = () => {
      if (document.visibilityState !== "visible" || salvarTimer.current) return;
      carregarComite().then((salvo) => salvo && setState((s) => ({ ...s, ...salvo })));
    };
    document.addEventListener("visibilitychange", aoFocar);
    return () => document.removeEventListener("visibilitychange", aoFocar);
  }, []);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      setSalvando(true);
      clearTimeout(salvarTimer.current);
      salvarTimer.current = setTimeout(() => {
        salvarComite(next).finally(() => { salvarTimer.current = null; setSalvando(false); });
      }, 400);
      return next;
    });
  }, []);

  const novoEvento = useCallback((data) => setModalEvento({ id: uid(), titulo: "", data, horaInicio: "", horaFim: "", tipo: "reuniao", descricao: "", responsavel: "", local: "", novo: true }), []);
  const abrirEvento = useCallback((e) => setModalEvento(e), []);
  const novaDemanda = useCallback(() => setModalDemanda({ id: uid(), titulo: "", descricao: "", responsavel: "", solicitante: state?.usuario || "", prazo: "", status: "a-fazer", prioridade: "media", eventoId: "", criadaEm: hojeISO(), novo: true }), [state?.usuario]);
  const abrirDemanda = useCallback((d) => setModalDemanda(d), []);
  const irParaPasta = useCallback((id) => { setPastaAberta(id); setAba("materiais"); }, []);

  const irPara = useCallback((tipo, item) => {
    setBusca("");
    if (tipo === "evento") abrirEvento(item);
    if (tipo === "pasta") irParaPasta(item.id);
    if (tipo === "demanda") { setAba("demandas"); abrirDemanda(item); }
  }, [abrirEvento, irParaPasta, abrirDemanda]);

  if (!state) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: S.fundo }}><Loader2 className="animate-spin" color={S.laranja} size={30} /></div>;
  }

  const salvarEvento = (ev) => {
    const { novo, ...limpo } = ev;
    update((s) => ({ ...s, eventos: novo ? [...s.eventos, limpo] : s.eventos.map((x) => (x.id === ev.id ? limpo : x)) }));
    setModalEvento(null);
  };
  const excluirEvento = (id) => {
    if (!window.confirm("Excluir este evento?")) return;
    update((s) => ({ ...s, eventos: s.eventos.filter((x) => x.id !== id) }));
    setModalEvento(null);
  };
  const salvarDemanda = (d) => {
    const { novo, ...limpa } = d;
    update((s) => ({ ...s, demandas: novo ? [...s.demandas, limpa] : s.demandas.map((x) => (x.id === d.id ? limpa : x)) }));
    setModalDemanda(null);
  };
  const excluirDemanda = (id) => {
    if (!window.confirm("Excluir esta demanda?")) return;
    update((s) => ({ ...s, demandas: s.demandas.filter((x) => x.id !== id) }));
    setModalDemanda(null);
  };
  const trocarUsuario = () => {
    const nome = window.prompt("Seu nome (usado em “Minhas demandas” e nas ideias):", state.usuario || "");
    if (nome === null) return;
    const n = nome.trim();
    update((s) => ({ ...s, usuario: n, membros: n && !s.membros.some((m) => m.nome === n) ? [...s.membros, { id: uid(), nome: n }] : s.membros }));
  };

  const conteudo = {
    visao: <AbaVisaoGeral state={state} onNovoEvento={novoEvento} onAbrirEvento={abrirEvento} irParaPasta={irParaPasta} />,
    calendario: <AbaCalendario state={state} onNovoEvento={novoEvento} onAbrirEvento={abrirEvento} />,
    materiais: <AbaMateriais state={state} update={update} pastaAberta={pastaAberta} setPastaAberta={setPastaAberta} busca={busca} />,
    demandas: <AbaDemandas state={state} update={update} abrirDemanda={abrirDemanda} novaDemanda={novaDemanda} busca={busca} />,
    passos: <AbaPassos state={state} update={update} />,
    ideias: <AbaIdeias state={state} update={update} />,
  }[aba];

  return (
    <div className="min-h-screen" style={{ background: S.fundo, fontFamily: "'Nunito Sans', -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      {/* cabeçalho laranja */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(100deg, ${S.laranja} 0%, ${S.laranja2} 100%)` }}>
        <span className="absolute -top-16 left-1/3 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <span className="absolute -bottom-24 right-1/4 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fff" }}><CalendarCheck size={26} color={S.laranja} /></span>
            <div className="leading-tight text-white">
              <p className="text-xs font-bold opacity-95">Shopee · Comitê de Eventos</p>
              <h1 className="text-xl sm:text-2xl font-extrabold">Central de Eventos</h1>
            </div>
          </div>
          <p className="hidden lg:block text-sm font-semibold text-white/95 pl-6 leading-snug" style={{ borderLeft: "1px solid rgba(255,255,255,0.4)" }}>Pessoas que conectam,<br />eventos que transformam!</p>
          <div className="flex items-center gap-3 flex-1 justify-end min-w-[260px]">
            <BuscaGlobal state={state} valor={busca} setValor={setBusca} irPara={irPara} />
            <Notificacoes state={state} abrirDemanda={(d) => { setAba("demandas"); abrirDemanda(d); }} abrirEvento={abrirEvento} />
            <button onClick={trocarUsuario} title="Trocar nome" className="hidden sm:flex items-center gap-2 rounded-full pl-1 pr-3 py-1" style={{ background: "#fff" }}>
              <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: S.laranjaClaro }}><MascoteRosto size={30} /></span>
              <span className="text-left leading-tight">
                <span className="block text-sm font-bold max-w-[150px] truncate" style={{ color: S.tinta }}>{state.usuario || "Definir nome"}</span>
                <span className="block text-[11px]" style={{ color: S.tintaSuave }}>Comitê de Eventos</span>
              </span>
              <ChevronDown size={15} color={S.tintaSuave} />
            </button>
          </div>
        </div>
      </header>

      {/* abas */}
      <nav className="sticky top-0 z-20" style={{ background: S.branco, borderBottom: `1px solid ${S.linha}` }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
            {ABAS.map((a) => {
              const ativo = aba === a.id;
              return (
                <button key={a.id} onClick={() => { setAba(a.id); if (a.id === "materiais") setPastaAberta(null); }} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors" style={{ background: ativo ? S.laranjaClaro : S.branco, color: ativo ? S.laranja : S.tinta, border: `1px solid ${ativo ? S.laranjaBorda : S.linha}` }}>
                  <a.icon size={17} color={S.laranja} /> {a.label}
                </button>
              );
            })}
          </div>
          <BotaoPrimario onClick={novaDemanda} className="shrink-0"><Plus size={17} /> <span className="hidden md:inline">Nova Demanda</span></BotaoPrimario>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">{conteudo}</main>

      <footer className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-6 flex items-center gap-2 text-xs" style={{ color: S.tintaSuave }}>
        {salvando ? <><Loader2 size={13} className="animate-spin" /> salvando...</> : sincronizaNaNuvem ? <><Cloud size={13} /> Sincronizado na nuvem — todo o comitê vê as mesmas informações.</> : <><CloudOff size={13} /> Salvo apenas neste navegador. Configure o Supabase para compartilhar com o comitê.</>}
      </footer>

      {modalEvento && <ModalEvento evento={modalEvento} membros={state.membros} onSalvar={salvarEvento} onExcluir={excluirEvento} onFechar={() => setModalEvento(null)} />}
      {modalDemanda && <ModalDemanda demanda={modalDemanda} membros={state.membros} eventos={state.eventos} onSalvar={salvarDemanda} onExcluir={excluirDemanda} onFechar={() => setModalDemanda(null)} />}
    </div>
  );
}
