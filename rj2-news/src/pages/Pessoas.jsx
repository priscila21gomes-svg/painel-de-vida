import { useState } from "react";
import { Award, Cake, Gift, Sparkles, Users } from "lucide-react";
import { useEdicao } from "../lib/store";
import { aniversarioNoPeriodo, fmtCurta, fmtLonga, hojeISO, parse } from "../lib/datas";
import { Avatar, Cabecalho, Card, Filtros, Modal, TituloSecao, Vazio } from "../components/ui";

const MOTIVOS = { Produtividade: "🚀", Qualidade: "✅", "Segurança": "🦺", Projetos: "🛠️", "Tempo de casa": "🏅", "Atitude de dono": "🔥" };

function CardAniversariante({ a }) {
  const hoje = a.dataNaSemana === hojeISO();
  return (
    <Card className={`p-5 text-center relative overflow-hidden ${hoje ? "ring-2 ring-laranja-500" : ""}`}>
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-laranja-500 to-laranja-400" />
      <Avatar nome={a.nome} foto={a.foto} tamanho={84} className="relative mx-auto mt-2" />
      <div className="mt-3 font-bold text-marinho-900">{a.nome}</div>
      <div className="text-xs text-slate-500">{a.area}</div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-laranja-50 text-laranja-600 text-sm font-semibold px-3 py-1">
        <Cake className="w-4 h-4" /> {a.dataNaSemana ? fmtLonga(a.dataNaSemana) : `${a.data.slice(3)}/${a.data.slice(0, 2)}`}
      </div>
      {hoje && <div className="mt-2 text-xs font-bold text-laranja-600 uppercase">🎉 É hoje!</div>}
    </Card>
  );
}

export function Aniversariantes({ compacto }) {
  const { aniversariantes, edicao, dados } = useEdicao();
  const [modo, setModo] = useState("Semana");
  const mes = parse(edicao.inicio).getMonth() + 1;
  const doMes = dados.aniversariantes
    .filter((a) => Number(a.data.slice(0, 2)) === mes)
    .map((a) => ({ ...a, dataNaSemana: aniversarioNoPeriodo(a.data, edicao.inicio, edicao.fim) }))
    .sort((a, b) => a.data.localeCompare(b.data));
  const lista = modo === "Semana" ? aniversariantes : doMes;
  const nomeMes = parse(edicao.inicio).toLocaleDateString("pt-BR", { month: "long" });
  return (
    <div>
      {!compacto && (
        <Cabecalho titulo="Aniversariantes" subtitulo={`Parabéns! Celebre com quem faz aniversário na semana ${edicao.rotulo} (${fmtCurta(edicao.inicio)} a ${fmtCurta(edicao.fim)}).`} icone={Gift}>
          <Filtros opcoes={["Semana", "Mês"]} valor={modo} onChange={setModo} />
        </Cabecalho>
      )}
      {compacto && <TituloSecao acao={<Filtros opcoes={["Semana", "Mês"]} valor={modo} onChange={setModo} />}>🎂 Aniversariantes</TituloSecao>}
      {modo === "Mês" && <p className="mb-4 text-sm text-slate-500 capitalize">Aniversariantes de {nomeMes}</p>}
      {lista.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {lista.map((a) => <CardAniversariante key={a.id} a={a} />)}
        </div>
      ) : (
        <Vazio>Nenhum aniversariante neste período.</Vazio>
      )}
    </div>
  );
}

export function Pessoas() {
  const { dados, ateEdicao, edicao, todas } = useEdicao();
  const ordem = (sem) => todas.findIndex((e) => e.id === sem);
  const [perfil, setPerfil] = useState(null);
  const time = dados.time.filter((p) => ateEdicao(p.semana)).sort((a, b) => ordem(b.semana) - ordem(a.semana));
  const reconhecimentos = dados.reconhecimentos.filter((r) => ateEdicao(r.semana));
  const daSemana = reconhecimentos.filter((r) => r.semana === edicao.id);
  const anteriores = reconhecimentos.filter((r) => r.semana !== edicao.id).sort((a, b) => ordem(b.semana) - ordem(a.semana));
  return (
    <div className="space-y-12">
      <Cabecalho titulo="Pessoas" subtitulo="Quem faz o RJ2 acontecer: aniversariantes, histórias do time e reconhecimentos." icone={Users} />

      <Aniversariantes compacto />

      <section>
        <TituloSecao>🌟 Conhecendo o time</TituloSecao>
        {time.length ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {time.map((p, i) => (
              <Card key={p.id} onClick={() => setPerfil(p)} className={`group p-6 w-full ${i === 0 ? "bg-gradient-to-br from-white to-laranja-50" : ""}`}>
                <div className="flex items-center gap-4">
                  <Avatar nome={p.nome} foto={p.foto} tamanho={72} className="shadow group-hover:scale-105 transition" />
                  <div>
                    {i === 0 && <div className="text-[11px] font-bold uppercase text-laranja-500 tracking-wider">Perfil da semana</div>}
                    <div className="font-bold text-lg text-marinho-900">{p.nome}</div>
                    <div className="text-xs text-slate-500">{p.cargo}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{p.area}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">{p.turno}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{p.descricao}</p>
              </Card>
            ))}
          </div>
        ) : <Vazio />}
      </section>

      <section>
        <TituloSecao>🏆 Destaques e reconhecimentos</TituloSecao>
        {daSemana.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {daSemana.map((r) => <CardReconhecimento key={r.id} r={r} grande />)}
          </div>
        )}
        {anteriores.length > 0 && (
          <>
            <p className="text-sm font-semibold text-slate-500 mb-3">Reconhecimentos anteriores</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {anteriores.map((r) => <CardReconhecimento key={r.id} r={r} />)}
            </div>
          </>
        )}
        {!reconhecimentos.length && <Vazio />}
      </section>

      <Modal aberto={!!perfil} onFechar={() => setPerfil(null)} largura="max-w-xl" titulo={perfil?.nome}>
        {perfil && (
          <div>
            <div className="h-28 bg-gradient-to-r from-laranja-500 to-laranja-400 rounded-t-3xl" />
            <div className="px-8 pb-8 -mt-14">
              <Avatar nome={perfil.nome} foto={perfil.foto} tamanho={112} className="shadow-lg" />
              <h2 className="mt-3 text-2xl font-extrabold text-marinho-900">{perfil.nome}</h2>
              <p className="text-slate-500">{perfil.cargo} · {perfil.area} · {perfil.turno}</p>
              <p className="mt-4 text-slate-700">{perfil.descricao}</p>
              {perfil.curiosidades?.length > 0 && (
                <div className="mt-5">
                  <div className="font-bold text-marinho-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-laranja-500" />Curiosidades</div>
                  <ul className="mt-2 space-y-1.5">
                    {perfil.curiosidades.map((c, i) => <li key={i} className="flex gap-2 text-slate-600"><span className="text-laranja-500">◆</span>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CardReconhecimento({ r, grande }) {
  return (
    <Card className={`flex items-center gap-4 ${grande ? "p-5 border-laranja-100" : "p-4"}`}>
      <div className={`${grande ? "w-14 h-14 text-2xl" : "w-11 h-11 text-xl"} rounded-2xl bg-laranja-50 grid place-items-center shrink-0`}>{MOTIVOS[r.motivo] || <Award className="text-laranja-500" />}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-laranja-500">{r.motivo}</div>
        <div className="font-bold text-marinho-900">{r.nome}</div>
        <div className="text-sm text-slate-500">{r.descricao}</div>
      </div>
    </Card>
  );
}
