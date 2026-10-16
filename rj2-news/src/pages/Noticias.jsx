import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Megaphone, Pin, Search, Star, Truck, Mail, User } from "lucide-react";
import { useEdicao } from "../lib/store";
import { fmtData, fmtLonga } from "../lib/datas";
import { link } from "../lib/rota";
import { Cabecalho, Capa, Card, Filtros, LinkSeta, LISTA_CATEGORIAS, Selo, TituloSecao, Vazio } from "../components/ui";
import { Materia, MateriaModal } from "../components/Materia";

export function CardNoticia({ p, onAbrir }) {
  return (
    <Card onClick={() => onAbrir(p)} className="group overflow-hidden flex flex-col animate-entrar">
      <div className="h-44 overflow-hidden"><Capa imagem={p.imagem} categoria={p.categoria} rotulo={p.titulo} className="group-hover:scale-105 transition duration-500" /></div>
      <div className="p-5 flex flex-col flex-1">
        <Selo categoria={p.categoria} className="self-start" />
        <h3 className="mt-3 font-bold text-lg text-marinho-900 leading-snug group-hover:text-laranja-600 transition">{p.titulo}</h3>
        <p className="mt-2 text-sm text-slate-600 flex-1">{p.resumo}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>{fmtData(p.dataPublicacao)}</span>
          <LinkSeta>Ler</LinkSeta>
        </div>
      </div>
    </Card>
  );
}

function GradeNoticias({ lista }) {
  const [aberta, setAberta] = useState(null);
  if (!lista.length) return <Vazio>Nenhuma notícia encontrada.</Vazio>;
  return (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {lista.map((p) => <CardNoticia key={p.id} p={p} onAbrir={setAberta} />)}
      </div>
      <MateriaModal materia={aberta} onFechar={() => setAberta(null)} />
    </>
  );
}

export function Destaques({ busca }) {
  const { publicacoes } = useEdicao();
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState(busca || "");
  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return publicacoes.filter(
      (p) => (cat === "Todas" || p.categoria === cat) && (!termo || `${p.titulo} ${p.resumo} ${p.texto}`.toLowerCase().includes(termo))
    );
  }, [publicacoes, cat, q]);
  return (
    <div>
      <Cabecalho titulo="Destaques" subtitulo="Todas as notícias publicadas no RJ2 News, da edição mais recente às anteriores." icone={Star} />
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mb-6">
        <Filtros opcoes={["Todas", ...LISTA_CATEGORIAS]} valor={cat} onChange={setCat} />
        <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 h-11 lg:w-72 focus-within:ring-2 focus-within:ring-laranja-400">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por palavra-chave" className="outline-none text-sm flex-1 bg-transparent" />
        </label>
      </div>
      <p className="text-sm text-slate-500 mb-4">{filtradas.length} {filtradas.length === 1 ? "notícia" : "notícias"}</p>
      <GradeNoticias lista={filtradas} />
    </div>
  );
}

const SECOES_OPERACAO = [
  ["Operação", "Principais resultados, projetos e melhorias"],
  ["Qualidade", "Auditorias, inventário e qualidade"],
  ["Segurança", "Segurança do trabalho"],
];

export function Operacao() {
  const { publicacoes, indicadores, edicao } = useEdicao();
  return (
    <div className="space-y-10">
      <Cabecalho titulo="Operação" subtitulo="O que está acontecendo no chão da operação: resultados, projetos, melhorias, qualidade e segurança." icone={Truck} />
      {indicadores && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {indicadores.kpis.map((k) => (
            <Card key={k.nome} className="p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">{k.nome}</div>
              <div className="mt-2 text-3xl font-extrabold text-marinho-900">{k.valor.toLocaleString("pt-BR")}{k.unidade}</div>
              <div className="text-xs text-slate-400 mt-1">Semana {edicao.rotulo}</div>
            </Card>
          ))}
        </section>
      )}
      {SECOES_OPERACAO.map(([cat, desc]) => (
        <section key={cat}>
          <TituloSecao>{cat}</TituloSecao>
          <p className="-mt-3 mb-5 text-sm text-slate-500">{desc}</p>
          <GradeNoticias lista={publicacoes.filter((p) => p.categoria === cat).slice(0, 6)} />
        </section>
      ))}
      <section>
        <TituloSecao>Comunicados operacionais</TituloSecao>
        <GradeNoticias lista={publicacoes.filter((p) => p.categoria === "Comunicados").slice(0, 3)} />
      </section>
    </div>
  );
}

export function Campanhas() {
  const { publicacoes } = useEdicao();
  const [aberta, setAberta] = useState(null);
  const [cat, setCat] = useState("Todas");
  const lista = publicacoes.filter((p) => ["Campanhas", "Eventos"].includes(p.categoria) && (cat === "Todas" || p.categoria === cat));
  const [principal, ...demais] = lista;
  return (
    <div>
      <Cabecalho titulo="Campanhas e Eventos" subtitulo="Programas, ações e eventos que movimentam o RJ2." icone={Megaphone}>
        <Filtros opcoes={["Todas", "Campanhas", "Eventos"]} valor={cat} onChange={setCat} />
      </Cabecalho>
      {!principal && <Vazio />}
      {principal && (
        <Card onClick={() => setAberta(principal)} className="group overflow-hidden grid md:grid-cols-2 mb-6 w-full">
          <div className="h-64 md:h-full min-h-[260px] overflow-hidden"><Capa imagem={principal.imagem} categoria={principal.categoria} className="group-hover:scale-105 transition duration-500" /></div>
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <Selo categoria={principal.categoria} className="self-start" />
            <h2 className="mt-3 text-3xl font-extrabold text-marinho-900 leading-tight">{principal.titulo}</h2>
            <p className="mt-3 text-slate-600">{principal.resumo}</p>
            <InfoEvento p={principal} />
            <span className="mt-6 self-start inline-flex items-center gap-2 bg-laranja-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold uppercase group-hover:bg-laranja-600">Saiba mais →</span>
          </div>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {demais.map((p) => <CardNoticia key={p.id} p={p} onAbrir={setAberta} />)}
      </div>
      <MateriaModal materia={aberta} onFechar={() => setAberta(null)} />
    </div>
  );
}

function InfoEvento({ p }) {
  if (!p.dataEvento && !p.local) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
      {p.dataEvento && <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-laranja-500" />{fmtLonga(p.dataEvento)}</span>}
      {p.local && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-laranja-500" />{p.local}</span>}
    </div>
  );
}

export function Comunicados() {
  const { publicacoes } = useEdicao();
  const [aberta, setAberta] = useState(null);
  const lista = publicacoes.filter((p) => p.categoria === "Comunicados" || p.fixado);
  const fixados = lista.filter((p) => p.fixado);
  const outros = lista.filter((p) => !p.fixado);
  const Item = ({ p }) => (
    <Card onClick={() => setAberta(p)} className={`group w-full p-5 flex gap-4 ${p.fixado ? "border-laranja-200 bg-laranja-50/60" : ""}`}>
      {p.imagem ? <img src={p.imagem} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" /> : (
        <div className="w-12 h-12 rounded-xl bg-laranja-100 text-laranja-600 grid place-items-center shrink-0">{p.fixado ? <Pin className="w-5 h-5" /> : <Mail className="w-5 h-5" />}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Selo categoria={p.categoria} />
          {p.fixado && <span className="text-[11px] font-bold uppercase text-laranja-600 flex items-center gap-1"><Pin className="w-3 h-3" />Fixado</span>}
        </div>
        <h3 className="mt-2 font-bold text-marinho-900 group-hover:text-laranja-600 transition">{p.titulo}</h3>
        <p className="text-sm text-slate-600 mt-1">{p.resumo}</p>
        <div className="mt-2 flex gap-4 text-xs text-slate-400">
          <span>{fmtData(p.dataPublicacao)}</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.autor}</span>
        </div>
      </div>
    </Card>
  );
  return (
    <div>
      <Cabecalho titulo="Comunicados" subtitulo="O mural oficial de avisos do RJ2. Comunicados importantes ficam fixados no topo." icone={Mail} />
      <div className="space-y-3 max-w-4xl">
        {fixados.map((p) => <Item key={p.id} p={p} />)}
        {outros.map((p) => <Item key={p.id} p={p} />)}
        {!lista.length && <Vazio />}
      </div>
      <MateriaModal materia={aberta} onFechar={() => setAberta(null)} />
    </div>
  );
}

export function MateriaPagina({ id }) {
  const { dados, publicadas } = useEdicao();
  const m = dados.publicacoes.find((p) => p.id === id && p.status === "publicado" && publicadas.some((e) => e.id === p.semana));
  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => (history.length > 1 ? history.back() : (location.hash = "#/"))} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-laranja-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      {m ? (
        <div className="bg-white rounded-3xl shadow-card overflow-hidden animate-entrar"><Materia materia={m} /></div>
      ) : (
        <Vazio>Matéria não encontrada. <a className="text-laranja-600 underline" href={link("destaques")}>Ver todas as notícias</a></Vazio>
      )}
    </div>
  );
}

