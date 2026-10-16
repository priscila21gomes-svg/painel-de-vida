import { useState } from "react";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { useEdicao } from "../lib/store";
import { diaSemana, fmtLonga, hojeISO, parse, somarDias } from "../lib/datas";
import { Cabecalho, Card, Vazio } from "../components/ui";

export default function Agenda() {
  const { agenda, edicao } = useEdicao();
  const hoje = hojeISO();
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(edicao.inicio, i));
  const [diaSel, setDiaSel] = useState(null);
  const lista = diaSel ? agenda.filter((a) => a.data === diaSel) : agenda;
  const porDia = dias.map((d) => ({ d, itens: lista.filter((a) => a.data === d) })).filter((x) => x.itens.length);

  return (
    <div>
      <Cabecalho titulo="Agenda da Semana" subtitulo="Treinamentos, reuniões, eventos e datas importantes." icone={CalendarDays} />

      <div className="grid grid-cols-7 gap-2 mb-8">
        {dias.map((d) => {
          const n = agenda.filter((a) => a.data === d).length;
          const ativo = diaSel === d;
          const ehHoje = d === hoje;
          return (
            <button key={d} onClick={() => setDiaSel(ativo ? null : d)}
              className={`rounded-2xl p-2 md:p-4 text-center border transition hover:-translate-y-0.5 ${ativo ? "bg-laranja-500 text-white border-laranja-500 shadow-lg" : ehHoje ? "bg-marinho-900 text-white border-marinho-900" : "bg-white border-slate-100 shadow-card"}`}>
              <div className="text-[11px] md:text-xs uppercase tracking-wider opacity-70">{diaSemana(d)}</div>
              <div className="text-xl md:text-3xl font-extrabold">{parse(d).getDate()}</div>
              <div className="mt-1 flex justify-center gap-1 h-2">
                {Array.from({ length: Math.min(n, 3) }).map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${ativo || ehHoje ? "bg-white" : "bg-laranja-500"}`} />)}
              </div>
              {ehHoje && <div className="hidden md:block text-[10px] font-bold uppercase mt-1 text-amarelo">Hoje</div>}
            </button>
          );
        })}
      </div>

      {!porDia.length && <Vazio>Nenhum compromisso {diaSel ? "neste dia" : "nesta semana"}.</Vazio>}
      <div className="space-y-8">
        {porDia.map(({ d, itens }) => (
          <section key={d} className="animate-entrar">
            <h3 className="mb-3 font-bold text-marinho-900 capitalize flex items-center gap-2">
              {fmtLonga(d)}
              {d === hoje && <span className="text-[11px] uppercase bg-laranja-500 text-white rounded-full px-2 py-0.5">Hoje</span>}
            </h3>
            <div className="space-y-3">
              {itens.map((a) => (
                <Card key={a.id} className={`p-5 flex gap-5 ${d === hoje ? "border-laranja-300 ring-1 ring-laranja-200" : ""}`}>
                  <div className="w-20 shrink-0 text-center rounded-xl bg-laranja-50 py-3">
                    <Clock className="w-4 h-4 mx-auto text-laranja-500" />
                    <div className="font-extrabold text-laranja-600 mt-1">{a.horario}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-lg text-marinho-900">{a.evento}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{a.area}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{a.local}</span>
                    </div>
                    {a.descricao && <p className="mt-2 text-sm text-slate-600">{a.descricao}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
