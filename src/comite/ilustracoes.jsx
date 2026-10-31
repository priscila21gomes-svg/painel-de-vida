// Ilustrações em SVG (desenhos próprios) para deixar a Central de Eventos mais animada.
// Todas usam viewBox 0 0 120 90 (capas) ou 0 0 160 160 (mascote de corpo inteiro).

const tinta = "#2B1B12";

// ---------- mascote: cachorrinho laranja ----------
function CabecaMascote({ x = 0, y = 0, s = 1, piscando = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* orelhas */}
      <path d="M14 30 C4 8 18 -2 30 14 Z" fill="#E8551F" />
      <path d="M17 26 C11 12 19 6 26 16 Z" fill="#FFB199" />
      <path d="M86 30 C96 8 82 -2 70 14 Z" fill="#E8551F" />
      <path d="M83 26 C89 12 81 6 74 16 Z" fill="#FFB199" />
      {/* cabeça */}
      <ellipse cx="50" cy="44" rx="40" ry="35" fill="#FF8A3D" />
      <path d="M44 10 C46 2 54 2 56 10 C52 7 48 7 44 10 Z" fill="#FF8A3D" />
      {/* focinho */}
      <ellipse cx="50" cy="58" rx="23" ry="17" fill="#FFE6D1" />
      {/* olhos */}
      {piscando ? (
        <path d="M28 41 Q35 35 42 41" stroke={tinta} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      ) : (
        <g>
          <ellipse cx="35" cy="40" rx="5.5" ry="6.5" fill={tinta} />
          <circle cx="37" cy="37.5" r="2" fill="#fff" />
        </g>
      )}
      <ellipse cx="65" cy="40" rx="5.5" ry="6.5" fill={tinta} />
      <circle cx="67" cy="37.5" r="2" fill="#fff" />
      {/* bochechas */}
      <ellipse cx="22" cy="55" rx="7" ry="4.5" fill="#FF6F91" opacity="0.45" />
      <ellipse cx="78" cy="55" rx="7" ry="4.5" fill="#FF6F91" opacity="0.45" />
      {/* nariz e boca */}
      <ellipse cx="50" cy="51" rx="6" ry="4.2" fill={tinta} />
      <path d="M41 59 Q50 70 59 59" fill="#C2410C" />
      <path d="M45 63 Q50 70 55 63 Q50 66 45 63 Z" fill="#FF6F91" />
    </g>
  );
}

export function MascoteRosto({ size = 40, className = "" }) {
  return (
    <svg viewBox="-2 -4 104 88" width={size} height={size} className={className} aria-hidden="true">
      <CabecaMascote />
    </svg>
  );
}

// Corpo inteiro. pose: "megafone" | "acenando"
export function Mascote({ pose = "acenando", size = 120, className = "" }) {
  return (
    <svg viewBox="0 14 160 148" width={size} height={size} className={className} aria-hidden="true">
      {/* corpo */}
      <ellipse cx="72" cy="128" rx="34" ry="28" fill="#FF8A3D" />
      <ellipse cx="72" cy="134" rx="20" ry="17" fill="#FFE6D1" />
      {/* camiseta laranja escuro com coração */}
      <path d="M44 112 Q72 100 100 112 L102 128 Q72 120 42 128 Z" fill="#EE4D2D" />
      <path d="M72 122 l-4 -4 a2.6 2.6 0 0 1 4 -3 a2.6 2.6 0 0 1 4 3 Z" fill="#fff" />
      {/* pés */}
      <ellipse cx="54" cy="154" rx="12" ry="6" fill="#E8551F" />
      <ellipse cx="90" cy="154" rx="12" ry="6" fill="#E8551F" />
      {/* braço esquerdo */}
      <ellipse cx="42" cy="128" rx="8" ry="12" fill="#FF8A3D" transform="rotate(20 42 128)" />
      {pose === "megafone" ? (
        <g>
          {/* braço levantado segurando megafone */}
          <ellipse cx="102" cy="114" rx="8" ry="14" fill="#FF8A3D" transform="rotate(-50 102 114)" />
          <g transform="translate(-4 18) rotate(-22 122 80)">
            <rect x="104" y="76" width="12" height="16" rx="3" fill="#B91C1C" />
            <path d="M114 74 L148 58 L148 110 L114 94 Z" fill="#EE4D2D" />
            <path d="M126 69 L126 99" stroke="#fff" strokeWidth="4" />
            <ellipse cx="148" cy="84" rx="6" ry="26" fill="#FF7337" />
            <ellipse cx="148" cy="84" rx="3" ry="18" fill="#FFD6C8" />
          </g>
          {/* linhas de som */}
          <path d="M146 46 l8 -8 M150 62 l9 -2 M136 38 l2 -10" stroke="#EE4D2D" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx="104" cy="110" rx="8" ry="14" fill="#FF8A3D" transform="rotate(-35 104 110)" />
          <path d="M116 92 q6 -6 10 0 M120 84 q8 -6 12 2" stroke="#EE4D2D" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      <CabecaMascote x={22} y={22} s={1} piscando={pose === "acenando"} />
    </svg>
  );
}

// ---------- capas temáticas (120x90) ----------
function Confete({ cores = ["#EE4D2D", "#F5A623", "#2F80ED", "#E5487A", "#27AE60"] }) {
  const pontos = [[10, 14, 0], [104, 12, 1], [16, 74, 2], [108, 70, 3], [96, 40, 4], [22, 44, 1]];
  return pontos.map(([x, y, c], i) => (
    i % 2 ? <circle key={i} cx={x} cy={y} r="3" fill={cores[c % cores.length]} />
      : <rect key={i} x={x} y={y} width="6" height="3" rx="1" fill={cores[c % cores.length]} transform={`rotate(${30 * i} ${x} ${y})`} />
  ));
}

function Laco() {
  return (
    <g>
      <Confete cores={["#F9A8D4", "#E5487A", "#FBCFE8"]} />
      <path d="M46 82 L70 34 A13 13 0 1 0 48 34 L76 82" stroke="#E5487A" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M48 34 L76 82" stroke="#D63A6C" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M53 26 Q58 20 63 24" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

function Crianca({ x, pele, cabelo, camisa, laco }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-14 90 Q-14 64 0 64 Q14 64 14 90 Z" fill={camisa} />
      <circle cx="0" cy="46" r="17" fill={pele} />
      <path d="M-17 44 Q-16 26 0 27 Q16 26 17 44 Q8 34 -4 37 Q-12 38 -17 44 Z" fill={cabelo} />
      {laco && <path d="M10 28 l8 -6 l0 10 Z M10 28 l-2 -9 l9 3 Z" fill="#E5487A" />}
      <circle cx="-6" cy="47" r="2.2" fill={tinta} />
      <circle cx="6" cy="47" r="2.2" fill={tinta} />
      <path d="M-5 54 Q0 59 5 54" stroke={tinta} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="-11" cy="53" rx="3" ry="2" fill="#FF6F91" opacity="0.5" />
      <ellipse cx="11" cy="53" rx="3" ry="2" fill="#FF6F91" opacity="0.5" />
    </g>
  );
}

function Criancas() {
  return (
    <g>
      <Confete />
      <Crianca x={30} pele="#F2C29B" cabelo="#4B2E1E" camisa="#2F80ED" />
      <Crianca x={90} pele="#8D5A3B" cabelo="#1F130C" camisa="#27AE60" />
      <g transform="translate(0 -6)"><Crianca x={60} pele="#FFD9B8" cabelo="#B45309" camisa="#F5A623" laco /></g>
    </g>
  );
}

function Sacola() {
  return (
    <g>
      <Confete />
      <path d="M48 30 Q48 12 60 12 Q72 12 72 30" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M48 30 Q48 12 60 12 Q72 12 72 30" stroke="#C2410C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M34 28 L86 28 L90 80 Q90 84 86 84 L34 84 Q30 84 30 80 Z" fill="#fff" />
      <path d="M37 31 L83 31 L86 78 Q86 81 83 81 L37 81 Q34 81 34 78 Z" fill="#EE4D2D" />
      <path d="M60 70 l-11 -11 a6.5 6.5 0 0 1 11 -7 a6.5 6.5 0 0 1 11 7 Z" fill="#fff" />
      <path d="M93 22 l3 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 Z" fill="#F5A623" />
    </g>
  );
}

function Pets() {
  return (
    <g>
      <Confete />
      {/* cachorro */}
      <g transform="translate(40 52)">
        <ellipse cx="-17" cy="-8" rx="8" ry="15" fill="#7C4A2D" transform="rotate(20 -17 -8)" />
        <ellipse cx="17" cy="-8" rx="8" ry="15" fill="#7C4A2D" transform="rotate(-20 17 -8)" />
        <circle cx="0" cy="2" r="21" fill="#D9A066" />
        <ellipse cx="0" cy="11" rx="12" ry="9" fill="#F7E1C8" />
        <circle cx="-7" cy="-1" r="2.8" fill={tinta} /><circle cx="7" cy="-1" r="2.8" fill={tinta} />
        <ellipse cx="0" cy="7" rx="4" ry="3" fill={tinta} />
        <path d="M-2 13 Q0 19 2 13 Z" fill="#FF6F91" />
      </g>
      {/* gato */}
      <g transform="translate(82 56)">
        <path d="M-18 -8 L-16 -28 L-4 -16 Z M18 -8 L16 -28 L4 -16 Z" fill="#FF8A3D" />
        <circle cx="0" cy="0" r="19" fill="#FF8A3D" />
        <path d="M-6 -18 L-4 -10 M0 -19 L0 -10 M6 -18 L4 -10" stroke="#E8551F" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="-7" cy="-1" r="2.6" fill={tinta} /><circle cx="7" cy="-1" r="2.6" fill={tinta} />
        <path d="M-2 5 L2 5 L0 8 Z" fill="#FF6F91" />
        <path d="M-10 7 L-22 5 M-10 10 L-22 12 M10 7 L22 5 M10 10 L22 12" stroke={tinta} strokeWidth="1" />
      </g>
      <path d="M60 22 l-8 -8 a5 5 0 0 1 8 -5 a5 5 0 0 1 8 5 Z" fill="#E5487A" />
    </g>
  );
}

function Megafone() {
  return (
    <g>
      <Confete />
      <g transform="rotate(-15 60 46)">
        <rect x="26" y="38" width="16" height="18" rx="4" fill="#5B21B6" />
        <path d="M40 36 L84 18 L84 76 L40 58 Z" fill="#8B5CF6" />
        <ellipse cx="84" cy="47" rx="7" ry="29" fill="#A78BFA" />
        <ellipse cx="84" cy="47" rx="3.5" ry="20" fill="#EDE9FE" />
        <path d="M36 58 L42 74 L50 72 L46 60" fill="#5B21B6" />
      </g>
      <path d="M96 22 l8 -6 M100 38 l10 0 M96 54 l8 6" stroke="#8B5CF6" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

function Templates() {
  return (
    <g>
      <Confete />
      <rect x="30" y="22" width="44" height="56" rx="6" fill="#FDE68A" transform="rotate(-10 52 50)" />
      <rect x="42" y="18" width="44" height="56" rx="6" fill="#fff" stroke="#F5A623" strokeWidth="3" />
      <rect x="49" y="26" width="30" height="16" rx="3" fill="#FFE2D6" />
      <circle cx="56" cy="32" r="3" fill="#EE4D2D" />
      <path d="M50 42 L60 34 L68 40 L74 36 L79 42" fill="#F5A623" />
      <rect x="49" y="48" width="30" height="4" rx="2" fill="#E5E7EB" />
      <rect x="49" y="56" width="22" height="4" rx="2" fill="#E5E7EB" />
      <g transform="rotate(40 92 56)">
        <rect x="88" y="36" width="9" height="36" rx="2" fill="#EE4D2D" />
        <path d="M88 72 L92.5 82 L97 72 Z" fill="#FFD6C8" />
      </g>
    </g>
  );
}

function Operacional() {
  return (
    <g>
      <Confete />
      <rect x="36" y="16" width="48" height="66" rx="7" fill="#2F80ED" />
      <rect x="41" y="23" width="38" height="54" rx="4" fill="#fff" />
      <rect x="49" y="11" width="22" height="12" rx="4" fill="#1E40AF" />
      {[34, 48, 62].map((y) => (
        <g key={y}>
          <path d={`M46 ${y} l3.5 3.5 l6 -7`} stroke="#27AE60" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="59" y={y - 3} width="16" height="4" rx="2" fill="#CBD5E1" />
        </g>
      ))}
    </g>
  );
}

function Presente() {
  return (
    <g>
      <Confete />
      <rect x="34" y="40" width="52" height="42" rx="5" fill="#EE4D2D" />
      <rect x="30" y="30" width="60" height="14" rx="4" fill="#FF7337" />
      <rect x="55" y="30" width="10" height="52" fill="#F5A623" />
      <path d="M60 30 C48 14 36 22 46 30 Z M60 30 C72 14 84 22 74 30 Z" fill="#F5A623" />
      <path d="M96 20 l2 5 5 1 -4 3 1 5 -4 -3 -4 3 1 -5 -4 -3 5 -1 Z" fill="#F5A623" />
    </g>
  );
}

function MascoteCapa() {
  return (
    <g>
      <Confete />
      <CabecaMascote x={28} y={6} s={0.66} />
    </g>
  );
}

export const ILUSTRACOES = {
  laco: { label: "Laço rosa", fundo: "#FDE7F0", C: Laco },
  criancas: { label: "Crianças", fundo: "#FFF1D6", C: Criancas },
  sacola: { label: "Sacola", fundo: "#FFE2D6", C: Sacola },
  pets: { label: "Pets", fundo: "#FFF4E5", C: Pets },
  megafone: { label: "Comunicado", fundo: "#EFE9FF", C: Megafone },
  templates: { label: "Templates", fundo: "#FFF7DB", C: Templates },
  operacional: { label: "Checklist", fundo: "#E6F0FF", C: Operacional },
  presente: { label: "Presente", fundo: "#FFEDE6", C: Presente },
  mascote: { label: "Mascote", fundo: "#FFF1EC", C: MascoteCapa },
};

export function ilustracaoPadrao(nome = "") {
  const n = nome.toLowerCase();
  if (n.includes("rosa") || n.includes("câncer") || n.includes("cancer")) return "laco";
  if (n.includes("crian") || n.includes("mini eu")) return "criancas";
  if (n.includes("compensa") || n.includes("ser shopee") || n.includes("black") || n.includes("venda")) return "sacola";
  if (n.includes("pet") || n.includes("animal") || n.includes("doa")) return "pets";
  if (n.includes("comunica")) return "megafone";
  if (n.includes("template") || n.includes("modelo")) return "templates";
  if (n.includes("rmr") || n.includes("operac") || n.includes("checklist")) return "operacional";
  if (n.includes("outro")) return "mascote";
  return "presente";
}

export function Ilustracao({ id, className = "", style }) {
  const il = ILUSTRACOES[id] || ILUSTRACOES.presente;
  return (
    <svg viewBox="0 0 120 90" className={className} style={style} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <il.C />
    </svg>
  );
}
