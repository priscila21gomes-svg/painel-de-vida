// Datas no formato "YYYY-MM-DD" são tratadas como datas locais (sem fuso).
export function parse(iso) {
  if (!iso) return null;
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function paraISO(data) {
  const p = (n) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

export function hojeISO() {
  return paraISO(new Date());
}

export function somarDias(iso, dias) {
  const d = parse(iso);
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

export function fmtCurta(iso) {
  const d = parse(iso);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function fmtData(iso) {
  const d = parse(iso);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtLonga(iso) {
  const d = parse(iso);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function diaSemana(iso) {
  return parse(iso).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

export function semanaISO(iso) {
  const d = parse(iso);
  const alvo = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diaNum = (alvo.getDay() + 6) % 7;
  alvo.setDate(alvo.getDate() - diaNum + 3);
  const primeiraQuinta = new Date(alvo.getFullYear(), 0, 4);
  const semana = 1 + Math.round(((alvo - primeiraQuinta) / 86400000 - 3 + ((primeiraQuinta.getDay() + 6) % 7)) / 7);
  return { ano: alvo.getFullYear(), semana };
}

// Monta a próxima edição a partir da última (segunda a domingo).
export function proximaEdicao(ultima) {
  const inicio = ultima ? somarDias(ultima.fim, 1) : segundaDaSemana(hojeISO());
  const fim = somarDias(inicio, 6);
  const { ano, semana } = semanaISO(inicio);
  const rotulo = `W${String(semana).padStart(2, "0")}`;
  return { id: `${ano}-${rotulo}`, rotulo, inicio, fim, manchetes: [] };
}

export function segundaDaSemana(iso) {
  const d = parse(iso);
  return somarDias(iso, -((d.getDay() + 6) % 7));
}

// "MM-DD" de aniversário cai dentro do intervalo [inicio, fim]?
export function aniversarioNoPeriodo(mmdd, inicio, fim) {
  let dia = inicio;
  for (let i = 0; i < 31 && dia <= fim; i++) {
    if (dia.slice(5) === mmdd) return dia;
    dia = somarDias(dia, 1);
  }
  return null;
}

export function noPeriodo(iso, inicio, fim) {
  return iso >= inicio && iso <= fim;
}
