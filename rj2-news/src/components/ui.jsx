import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Award, CalendarDays, FileText, Image as ImageIcon, Mail, Megaphone, PartyPopper, ShieldCheck,
  Sparkles, Truck, Users, BadgeCheck, X, ArrowRight,
} from "lucide-react";

// Cores e ícones por categoria — usados nas capas, selos e filtros.
export const CATEGORIAS = {
  Campanhas: { icone: Megaphone, de: "#EE4D2D", ate: "#FF8A3D" },
  Eventos: { icone: PartyPopper, de: "#F7743F", ate: "#FFC83D" },
  "Operação": { icone: Truck, de: "#1B2340", ate: "#3B5BDB" },
  Pessoas: { icone: Users, de: "#D73211", ate: "#F7743F" },
  Qualidade: { icone: BadgeCheck, de: "#0F766E", ate: "#2DD4BF" },
  "Segurança": { icone: ShieldCheck, de: "#B45309", ate: "#FBBF24" },
  Comunicados: { icone: Mail, de: "#334155", ate: "#64748B" },
  Reconhecimentos: { icone: Award, de: "#7C3AED", ate: "#EE4D2D" },
  Agenda: { icone: CalendarDays, de: "#EE4D2D", ate: "#1B2340" },
  Documentos: { icone: FileText, de: "#1B2340", ate: "#475569" },
  Galeria: { icone: ImageIcon, de: "#EE4D2D", ate: "#7C3AED" },
};
export const LISTA_CATEGORIAS = ["Campanhas", "Eventos", "Operação", "Pessoas", "Qualidade", "Segurança", "Comunicados", "Reconhecimentos"];

const meta = (c) => CATEGORIAS[c] || { icone: Sparkles, de: "#EE4D2D", ate: "#F7743F" };

// Imagem da matéria; sem imagem cadastrada, gera uma capa ilustrada pela categoria.
export function Capa({ imagem, categoria, className = "", rotulo }) {
  if (imagem) {
    return <img src={imagem} alt={rotulo || ""} loading="lazy" className={`object-cover w-full h-full ${className}`} />;
  }
  const m = meta(categoria);
  const Icone = m.icone;
  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`} style={{ background: `linear-gradient(135deg, ${m.de}, ${m.ate})` }} role="img" aria-label={rotulo || categoria}>
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute right-10 bottom-[-30px] w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute left-4 bottom-4 w-10 h-10 rounded-full border-4 border-white/15" />
      <div className="absolute inset-0 grid place-items-center">
        <Icone className="w-1/4 h-1/4 max-w-[72px] max-h-[72px] text-white drop-shadow" strokeWidth={1.6} />
      </div>
    </div>
  );
}

export function Selo({ categoria, className = "" }) {
  const m = meta(categoria);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ${className}`} style={{ background: m.de }}>
      {categoria}
    </span>
  );
}

const CORES_AVATAR = ["#EE4D2D", "#1B2340", "#F7743F", "#3B5BDB", "#0F766E", "#7C3AED", "#B45309"];
export function Avatar({ nome, foto, tamanho = 48, className = "" }) {
  const estilo = { width: tamanho, height: tamanho };
  if (foto) return <img src={foto} alt={nome} style={estilo} className={`rounded-full object-cover ring-4 ring-white ${className}`} />;
  const iniciais = nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const cor = CORES_AVATAR[[...nome].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES_AVATAR.length];
  return (
    <div style={{ ...estilo, background: cor, fontSize: tamanho * 0.36 }} className={`rounded-full grid place-items-center text-white font-semibold ring-4 ring-white shrink-0 ${className}`} aria-label={nome}>
      {iniciais}
    </div>
  );
}

export function TituloSecao({ children, acao }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2 className="flex items-center gap-3 text-lg md:text-xl font-bold tracking-wide text-marinho-900 uppercase">
        <Faisca />
        {children}
        <Faisca espelhar />
      </h2>
      {acao}
    </div>
  );
}

function Faisca({ espelhar }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className={`text-laranja-500 shrink-0 ${espelhar ? "-scale-x-100" : ""}`} aria-hidden>
      <path d="M4 4l4 4M2 12h5M5 19l4-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Cabecalho({ titulo, subtitulo, icone: Icone, children }) {
  return (
    <header className="mb-8 rounded-3xl bg-gradient-to-br from-laranja-500 to-laranja-400 text-white p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
      <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {Icone && <Icone className="w-8 h-8" />}
            <h1 className="text-3xl md:text-4xl font-extrabold">{titulo}</h1>
          </div>
          {subtitulo && <p className="mt-2 text-white/90 max-w-2xl">{subtitulo}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

export function Card({ children, className = "", onClick, as: Tag = onClick ? "button" : "div", ...resto }) {
  return (
    <Tag
      onClick={onClick}
      className={`text-left ${/(^|\s)bg-(?!gradient)/.test(className) ? "" : "bg-white"} rounded-2xl border border-slate-100 shadow-card transition duration-300 ${onClick ? "hover:-translate-y-1 hover:shadow-cardHover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-laranja-500" : ""} ${className}`}
      {...resto}
    >
      {children}
    </Tag>
  );
}

export function LinkSeta({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-laranja-500 group-hover:gap-2.5 transition-all ${className}`}>
      {children} <ArrowRight className="w-3.5 h-3.5" />
    </span>
  );
}

export function Filtros({ opcoes, valor, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {opcoes.map((o) => (
        <button
          key={o}
          role="tab"
          aria-selected={valor === o}
          onClick={() => onChange(o)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${valor === o ? "bg-laranja-500 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:border-laranja-400 hover:text-laranja-600"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Vazio({ children = "Nada publicado por aqui ainda." }) {
  return <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">{children}</div>;
}

export function Modal({ aberto, onFechar, children, largura = "max-w-3xl", titulo }) {
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);
  if (!aberto) return null;
  // Portal: evita que transformações de animação dos pais "prendam" o modal.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-6 bg-marinho-900/60 backdrop-blur-sm animate-entrar" onClick={onFechar} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className={`relative w-full ${largura} max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onFechar} className="absolute right-3 top-3 z-10 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow hover:bg-laranja-50 text-slate-600" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Texto({ children }) {
  return (
    <div className="space-y-4 text-slate-700 leading-relaxed">
      {(children || "").split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">{p}</p>
      ))}
    </div>
  );
}
