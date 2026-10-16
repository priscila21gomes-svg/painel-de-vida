import { useState } from "react";
import { AlertTriangle, BarChart3, Medal, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useEdicao } from "../lib/store";
import { Cabecalho, Card, Vazio } from "../components/ui";

// Cores de série validadas (contraste e daltonismo) — semana escolhida x semana anterior.
const COR_ATUAL = "#EE4D2D";
const COR_ANTERIOR = "#3B5BDB";
const fmt = (v, u = "") => `${Number(v).toLocaleString("pt-BR")}${u}`;

function Variacao({ atual, anterior, unidade = "", inverso }) {
  if (anterior === undefined) return <span className="text-xs text-slate-400">sem comparação</span>;
  const d = +(atual - anterior).toFixed(1);
  const bom = inverso ? d <= 0 : d >= 0;
  const Icone = d >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${bom ? "text-emerald-700" : "text-red-600"}`}>
      <Icone className="w-3.5 h-3.5" /> {d > 0 ? "+" : ""}{fmt(d, unidade === "%" ? " p.p." : "")} vs semana anterior
    </span>
  );
}

function DicaGrafico({ active, payload, label, unidade = "%" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2 text-sm">
      <div className="font-semibold text-marinho-900 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <b className="text-marinho-900">{fmt(p.value, unidade)}</b>
        </div>
      ))}
    </div>
  );
}

export default function Indicadores() {
  const { publicadas, indicadoresPorSemana, edicao } = useEdicao();
  const comDados = publicadas.filter((e) => indicadoresPorSemana[e.id]);
  const ultimas = comDados.slice(-4);
  const [escolhida, setEscolhida] = useState(null);
  const sel = ultimas.find((e) => e.id === escolhida) || ultimas.find((e) => e.id === edicao.id) || ultimas[ultimas.length - 1];

  if (!sel) {
    return (
      <div>
        <Cabecalho titulo="Indicadores" icone={BarChart3} />
        <Vazio>Os indicadores ainda não foram publicados.</Vazio>
      </div>
    );
  }
  const idx = comDados.findIndex((e) => e.id === sel.id);
  const ant = comDados[idx - 1];
  const ind = indicadoresPorSemana[sel.id];
  const indAnt = ant && indicadoresPorSemana[ant.id];
  const diario = ind.diario.map((d, i) => ({ dia: d.dia, atual: d.valor, anterior: indAnt?.diario[i]?.valor }));
  const evolucao = ultimas.map((e) => ({ semana: e.rotulo, valor: indicadoresPorSemana[e.id].resultadoGeral }));

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Indicadores" subtitulo="Os números da semana de um jeito simples de ler." icone={BarChart3}>
        <div className="flex bg-white/15 rounded-xl p-1" role="tablist" aria-label="Escolher semana">
          {ultimas.map((e) => (
            <button key={e.id} role="tab" aria-selected={e.id === sel.id} onClick={() => setEscolhida(e.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${e.id === sel.id ? "bg-white text-laranja-600 shadow" : "text-white hover:bg-white/10"}`}>
              {e.rotulo}
            </button>
          ))}
        </div>
      </Cabecalho>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 bg-marinho-900 text-white border-0">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/70"><BarChart3 className="w-4 h-4 text-amarelo" />RESULTADO GERAL</div>
          <div className="mt-3 text-5xl font-extrabold">{fmt(ind.resultadoGeral, "%")}</div>
          <div className="mt-1 text-sm text-white/70">Meta: {fmt(ind.meta, "%")} {ind.resultadoGeral >= ind.meta ? "· ✅ atingida" : "· abaixo da meta"}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500"><Trophy className="w-4 h-4 text-laranja-500" />MELHOR TURNO</div>
          <div className="mt-3 text-3xl font-extrabold text-marinho-900">{ind.melhorTurno.turno}</div>
          <div className="mt-1 text-sm text-slate-500">{fmt(ind.melhorTurno.valor, "%")} de aderência</div>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-700"><AlertTriangle className="w-4 h-4" />PONTO DE ATENÇÃO</div>
          <div className="mt-3 text-2xl font-extrabold text-marinho-900">{ind.pontoAtencao.titulo}</div>
          <div className="mt-1 text-sm text-slate-600">{ind.pontoAtencao.descricao}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500"><Medal className="w-4 h-4 text-laranja-500" />EVOLUÇÃO DA SEMANA</div>
          <div className="mt-3 text-3xl font-extrabold text-marinho-900">
            {indAnt ? `${ind.resultadoGeral - indAnt.resultadoGeral >= 0 ? "+" : ""}${fmt(+(ind.resultadoGeral - indAnt.resultadoGeral).toFixed(1))} p.p.` : "—"}
          </div>
          <div className="mt-1 text-sm text-slate-500">{ant ? `em relação à ${ant.rotulo}` : "primeira semana com dados"}</div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ind.kpis.map((k) => {
          const anterior = indAnt?.kpis.find((x) => x.nome === k.nome)?.valor;
          return (
            <Card key={k.nome} className="p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">{k.nome}</div>
              <div className="mt-2 text-2xl font-extrabold text-marinho-900">{fmt(k.valor, k.unidade)}</div>
              <div className="mt-1"><Variacao atual={k.valor} anterior={anterior} unidade={k.unidade} inverso={/absente|avaria/i.test(k.nome)} /></div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold text-marinho-900">Resultado diário (%)</h3>
          <p className="text-xs text-slate-500 mb-3">{sel.rotulo}{ant ? ` comparada com ${ant.rotulo}` : ""}</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={diario} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F3" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={(v) => v.toFixed(0)} />
                <Tooltip content={<DicaGrafico />} cursor={{ stroke: "#CBD5E1" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                {indAnt && <Line name={ant.rotulo} dataKey="anterior" stroke={COR_ANTERIOR} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />}
                <Line name={sel.rotulo} dataKey="atual" stroke={COR_ATUAL} strokeWidth={2.5} dot={{ r: 4.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-marinho-900">Resultado por turno (%)</h3>
          <p className="text-xs text-slate-500 mb-3">Semana {sel.rotulo}</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={ind.turnos} margin={{ top: 24, right: 8, left: -12, bottom: 0 }} barCategoryGap="35%">
                <CartesianGrid stroke="#EEF0F3" vertical={false} />
                <XAxis dataKey="turno" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <YAxis domain={[85, 100]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                <Tooltip content={<DicaGrafico />} cursor={{ fill: "#FFF4F0" }} />
                <Bar name="Resultado" dataKey="valor" fill={COR_ATUAL} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="valor" position="top" formatter={(v) => fmt(v, "%")} style={{ fill: "#1B2340", fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-marinho-900">Evolução do resultado geral (%)</h3>
        <p className="text-xs text-slate-500 mb-3">Últimas {evolucao.length} semanas</p>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={evolucao} margin={{ top: 24, right: 24, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#EEF0F3" vertical={false} />
              <XAxis dataKey="semana" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={(v) => v.toFixed(0)} />
              <Tooltip content={<DicaGrafico />} cursor={{ stroke: "#CBD5E1" }} />
              <Line name="Resultado geral" dataKey="valor" stroke={COR_ATUAL} strokeWidth={2.5} dot={{ r: 5, strokeWidth: 2, fill: "#fff" }}>
                <LabelList dataKey="valor" position="top" formatter={(v) => fmt(v, "%")} style={{ fill: "#1B2340", fontSize: 12, fontWeight: 600 }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
