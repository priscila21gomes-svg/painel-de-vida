import { useState } from "react";
import { ArrowRight, BarChart3, Cake, CalendarDays, Mail, Megaphone, Sparkles, History } from "lucide-react";
import { useEdicao, useConteudo } from "../lib/store";
import { fmtCurta, fmtData } from "../lib/datas";
import { link } from "../lib/rota";
import { Avatar, Capa, Card, LinkSeta, Selo, TituloSecao } from "../components/ui";
import { MateriaModal } from "../components/Materia";

function Hero() {
  const { edicao } = useEdicao();
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-laranja-600 via-laranja-500 to-laranja-400 text-white shadow-card animate-entrar">
      <div className="absolute inset-y-0 right-0 w-full md:w-[58%]">
        <img src={edicao.capaImagem || "img/operacao.svg"} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-laranja-500 via-laranja-500/70 md:via-laranja-500/30 to-transparent" />
      </div>
      <div className="relative grid md:grid-cols-[1fr_auto] gap-6 p-6 md:p-10">
        <div className="max-w-xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
            RJ2 <span className="text-amarelo">NEWS</span>
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-semibold leading-snug">Fique por dentro de tudo que acontece no RJ2!</p>
          <p className="mt-3 text-white/90 max-w-md">Novidades, conquistas e informações que conectam a nossa operação.</p>
          <a href="#novidades" className="group mt-7 inline-flex items-center gap-3 bg-white text-laranja-600 font-bold text-sm tracking-wider uppercase rounded-xl px-5 py-3 shadow hover:shadow-lg transition">
            Confira as novidades da semana <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </a>
        </div>
        <div className="self-center justify-self-start md:justify-self-end">
          <div className="bg-white text-marinho-900 rounded-3xl px-7 py-6 shadow-xl min-w-[210px] relative overflow-hidden">
            <CalendarDays className="absolute -right-4 -bottom-4 w-28 h-28 text-laranja-100" strokeWidth={1.2} />
            <div className="relative">
              <div className="text-laranja-500 font-bold tracking-widest text-sm">SEMANA</div>
              <div className="text-6xl font-extrabold text-laranja-600 leading-none mt-1">{edicao.rotulo}</div>
              <div className="mt-4 flex items-center gap-2 font-semibold text-sm">
                <CalendarDays className="w-4 h-4 text-laranja-500" />
                {fmtCurta(edicao.inicio)} a {fmtCurta(edicao.fim)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EmUmMinuto() {
  const { edicao } = useEdicao();
  if (!edicao.manchetes?.length) return null;
  return (
    <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-5 md:p-6 animate-entrar">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-marinho-900 text-amarelo grid place-items-center">⏱</div>
        <div>
          <h2 className="font-extrabold text-marinho-900 tracking-wide">O RJ2 EM 1 MINUTO</h2>
          <p className="text-xs text-slate-500">As manchetes da semana {edicao.rotulo} de um jeito rápido</p>
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
        {edicao.manchetes.map((m, i) => (
          <li key={i}>
            <a href={link(m.link)} className="group flex items-start gap-2.5 py-2 text-marinho-900 hover:text-laranja-600">
              <span className="mt-1.5 w-2.5 h-2.5 rotate-45 bg-laranja-500 shrink-0 rounded-[2px]" />
              <span className="font-medium leading-snug group-hover:underline underline-offset-4">{m.texto}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardCategoria({ icone: Icone, titulo, href, texto, acao, children }) {
  return (
    <a href={href} className="group">
      <Card className="h-full p-4 flex flex-col hover:-translate-y-1 hover:shadow-cardHover">
        <div className="flex items-center gap-3 min-h-[44px]">
          <Icone className="w-8 h-8 text-laranja-500 shrink-0" strokeWidth={1.7} />
          <h3 className="font-semibold text-marinho-900 leading-tight">{titulo}</h3>
        </div>
        <div className="mt-3 h-28 rounded-xl overflow-hidden">{children}</div>
        <p className="mt-3 text-sm text-slate-600 flex-1">{texto}</p>
        <LinkSeta className="mt-3">{acao}</LinkSeta>
      </Card>
    </a>
  );
}

function DestaquesDaSemana() {
  const { daSemana, aniversariantes, indicadores, agenda, publicacoes } = useEdicao();
  const campanha = daSemana.find((p) => ["Campanhas", "Eventos"].includes(p.categoria));
  const comunicados = publicacoes.filter((p) => p.categoria === "Comunicados");
  return (
    <section>
      <TituloSecao>Destaques da semana</TituloSecao>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <CardCategoria icone={Megaphone} titulo="Campanhas e Eventos" href={link("campanhas")} acao="Saiba mais"
          texto={campanha ? campanha.titulo : "Confira os programas, ações e eventos que movimentaram a semana!"}>
          <Capa imagem={campanha?.imagem} categoria={campanha?.categoria || "Campanhas"} className="group-hover:scale-105 transition duration-500" />
        </CardCategoria>
        <CardCategoria icone={Cake} titulo="Aniversariantes da Semana" href={link("aniversariantes")} acao="Confira a lista"
          texto={aniversariantes.length ? `Parabéns aos nossos ${aniversariantes.length} aniversariantes! 🎉` : "Nenhum aniversariante nesta semana."}>
          <div className="h-full bg-gradient-to-br from-laranja-50 to-amarelo/30 flex items-center justify-center -space-x-3">
            {aniversariantes.slice(0, 4).map((a) => <Avatar key={a.id} nome={a.nome} foto={a.foto} tamanho={52} />)}
            {aniversariantes.length === 0 && <Cake className="w-12 h-12 text-laranja-400" />}
          </div>
        </CardCategoria>
        <CardCategoria icone={BarChart3} titulo="Indicadores da Semana" href={link("indicadores")} acao="Ver indicadores"
          texto="Acompanhe os principais indicadores e resultados da operação.">
          <div className="h-full bg-marinho-900 text-white p-3 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/60">Resultado geral</span>
            <span className="text-3xl font-extrabold">{indicadores ? `${indicadores.resultadoGeral.toLocaleString("pt-BR")}%` : "—"}</span>
            <div className="flex items-end gap-1 h-8">
              {(indicadores?.diario || []).map((d) => (
                <span key={d.dia} className="flex-1 bg-laranja-500 rounded-t" style={{ height: `${Math.max(15, (d.valor - 88) * 9)}%` }} />
              ))}
            </div>
          </div>
        </CardCategoria>
        <CardCategoria icone={Mail} titulo="Comunicados Importantes" href={link("comunicados")} acao="Ver comunicados"
          texto={comunicados[0] ? comunicados[0].titulo : "Fique atento aos avisos e informações importantes para o time."}>
          <Capa categoria="Comunicados" />
        </CardCategoria>
        <CardCategoria icone={CalendarDays} titulo="Agenda da Semana" href={link("agenda")} acao="Ver agenda"
          texto={agenda.length ? `${agenda.length} compromissos: treinamentos, reuniões e eventos.` : "Treinamentos, reuniões e eventos que vão acontecer nos próximos dias."}>
          <div className="h-full bg-laranja-50 p-2.5 space-y-1.5 overflow-hidden">
            {agenda.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 text-xs">
                <span className="font-bold text-laranja-600">{fmtCurta(a.data)}</span>
                <span className="truncate text-slate-600">{a.evento}</span>
              </div>
            ))}
            {agenda.length === 0 && <CalendarDays className="w-12 h-12 text-laranja-400 mx-auto mt-5" />}
          </div>
        </CardCategoria>
      </div>
    </section>
  );
}

function Noticias() {
  const { daSemana } = useEdicao();
  const [aberta, setAberta] = useState(null);
  const destaques = daSemana.filter((p) => p.destaque);
  const lista = destaques.length ? destaques : daSemana;
  if (!lista.length) return null;
  const [principal, ...demais] = lista;
  return (
    <section id="novidades" className="scroll-mt-6">
      <TituloSecao acao={<a href={link("destaques")} className="group hidden sm:block"><LinkSeta>Todas as notícias</LinkSeta></a>}>Notícias da semana</TituloSecao>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card onClick={() => setAberta(principal)} className="group overflow-hidden flex flex-col">
          <div className="h-60 overflow-hidden"><Capa imagem={principal.imagem} categoria={principal.categoria} className="group-hover:scale-105 transition duration-500" /></div>
          <div className="p-6">
            <Selo categoria={principal.categoria} />
            <h3 className="mt-3 text-2xl font-extrabold text-marinho-900 leading-tight group-hover:text-laranja-600 transition">{principal.titulo}</h3>
            <p className="mt-2 text-slate-600">{principal.resumo}</p>
            <div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-400">{fmtData(principal.dataPublicacao)}</span><LinkSeta>Ler matéria</LinkSeta></div>
          </div>
        </Card>
        <div className="grid gap-4">
          {demais.slice(0, 3).map((p) => (
            <Card key={p.id} onClick={() => setAberta(p)} className="group overflow-hidden flex">
              <div className="w-32 sm:w-40 shrink-0 overflow-hidden"><Capa imagem={p.imagem} categoria={p.categoria} className="group-hover:scale-105 transition duration-500" /></div>
              <div className="p-4">
                <Selo categoria={p.categoria} />
                <h3 className="mt-2 font-bold text-marinho-900 leading-snug group-hover:text-laranja-600 transition">{p.titulo}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.resumo}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <MateriaModal materia={aberta} onFechar={() => setAberta(null)} />
    </section>
  );
}

function BannerEvento() {
  const { banner } = useEdicao();
  const [aberto, setAberto] = useState(false);
  if (!banner) return null;
  const [destaque, ...resto] = banner.titulo.split(" — ");
  const subtitulo = resto.join(" — ");
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-laranja-600 to-laranja-500 text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
        <Sparkles className="absolute right-6 top-5 w-10 h-10 text-amarelo/80 animate-pulse" />
        <div className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="shrink-0">
          <div className="text-sm font-bold tracking-widest">VEM AÍ!</div>
          <div className="text-6xl md:text-7xl font-extrabold leading-none mt-1">{destaque}</div>
        </div>
        <div className="relative">
          <p className="font-bold uppercase leading-snug">{subtitulo || banner.resumo}</p>
          <p className="text-sm text-white/85 mt-2 max-w-sm">{banner.resumo}</p>
          <button onClick={() => setAberto(true)} className="mt-4 inline-flex items-center gap-2 border border-white/80 rounded-lg px-4 py-1.5 text-xs font-bold uppercase hover:bg-white hover:text-laranja-600 transition">
            Saiba mais <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <MateriaModal materia={aberto ? banner : null} onFechar={() => setAberto(false)} />
    </>
  );
}

function ConhecendoOTime() {
  const { perfilDaSemana: p } = useEdicao();
  if (!p) return null;
  return (
    <a href={link("pessoas")} className="group block">
      <Card className="h-full p-6 bg-gradient-to-br from-white to-laranja-50 flex items-center gap-5 hover:shadow-cardHover">
        <div className="flex-1">
          <div className="text-laranja-500 font-extrabold tracking-wide">CONHECENDO O TIME!</div>
          <div className="mt-2 text-xl font-bold text-marinho-900">{p.nome}</div>
          <div className="text-xs text-slate-500">{p.cargo} · {p.area} · {p.turno}</div>
          <p className="mt-2 text-sm text-slate-600">{p.descricao}</p>
          <LinkSeta className="mt-3">Conheça a história</LinkSeta>
        </div>
        <Avatar nome={p.nome} foto={p.foto} tamanho={110} className="shadow-lg group-hover:scale-105 transition" />
      </Card>
    </a>
  );
}

function UltimasEdicoes() {
  const { publicadas, edicao } = useEdicao();
  const { setEdicaoVista } = useConteudo();
  const lista = [...publicadas].reverse().slice(0, 4);
  return (
    <section>
      <TituloSecao acao={<a href={link("edicoes")} className="group"><LinkSeta>Ver todas</LinkSeta></a>}>📰 Edições anteriores</TituloSecao>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {lista.map((e) => (
          <button
            key={e.id}
            onClick={() => { setEdicaoVista(e.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={`text-left rounded-2xl p-4 border transition hover:-translate-y-0.5 ${e.id === edicao.id ? "bg-marinho-900 text-white border-marinho-900" : "bg-white border-slate-100 shadow-card hover:shadow-cardHover"}`}
          >
            <div className="flex items-center gap-2 text-xs opacity-70"><History className="w-3.5 h-3.5" /> Edição</div>
            <div className="text-2xl font-extrabold mt-1">{e.rotulo}</div>
            <div className="text-sm opacity-80">{fmtCurta(e.inicio)} a {fmtCurta(e.fim)}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Hero />
      <EmUmMinuto />
      <DestaquesDaSemana />
      <Noticias />
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
        <BannerEvento />
        <ConhecendoOTime />
      </div>
      <UltimasEdicoes />
    </div>
  );
}
