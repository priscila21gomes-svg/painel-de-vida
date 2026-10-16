import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, History, Image as ImageIcon, Search } from "lucide-react";
import { useConteudo, useEdicao } from "../lib/store";
import { fmtCurta, fmtData } from "../lib/datas";
import { navegar } from "../lib/rota";
import { Cabecalho, Capa, Card, Filtros, Modal, Vazio } from "../components/ui";

const CATS_GALERIA = ["Todas", "Eventos", "Campanhas", "Pessoas", "Operação", "Comemorações"];
const CAPA_GALERIA = { "Comemorações": "Eventos" };

export function Galeria() {
  const { dados, ateEdicao } = useEdicao();
  const [cat, setCat] = useState("Todas");
  const [aberta, setAberta] = useState(null);
  const fotos = dados.galeria
    .filter((f) => ateEdicao(f.semana) && (cat === "Todas" || f.categoria === cat))
    .sort((a, b) => b.data.localeCompare(a.data));
  const ir = (d) => setAberta((i) => (i + d + fotos.length) % fotos.length);
  const foto = aberta !== null ? fotos[aberta] : null;
  return (
    <div>
      <Cabecalho titulo="Galeria" subtitulo="Os melhores momentos do RJ2 em fotos." icone={ImageIcon} />
      <div className="mb-6"><Filtros opcoes={CATS_GALERIA} valor={cat} onChange={setCat} /></div>
      {!fotos.length && <Vazio>Nenhuma foto nesta categoria.</Vazio>}
      <div className="columns-2 md:columns-3 xl:columns-4 gap-4 [&>*]:mb-4">
        {fotos.map((f, i) => (
          <button key={f.id} onClick={() => setAberta(i)} className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl shadow-card animate-entrar">
            <div className={i % 3 === 0 ? "h-64" : i % 3 === 1 ? "h-44" : "h-52"}>
              <Capa imagem={f.imagem} categoria={CAPA_GALERIA[f.categoria] || f.categoria} rotulo={f.titulo} className="group-hover:scale-105 transition duration-500" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3 text-left bg-gradient-to-t from-black/70 to-transparent text-white">
              <div className="font-semibold text-sm">{f.titulo}</div>
              <div className="text-[11px] opacity-80">{f.categoria} · {fmtData(f.data)}</div>
            </div>
          </button>
        ))}
      </div>
      <Modal aberto={!!foto} onFechar={() => setAberta(null)} largura="max-w-5xl" titulo={foto?.titulo}>
        {foto && (
          <div>
            <div className="relative h-[60vh] bg-marinho-900 rounded-t-3xl overflow-hidden">
              {foto.imagem ? <img src={foto.imagem} alt={foto.titulo} className="w-full h-full object-contain" /> : <Capa categoria={CAPA_GALERIA[foto.categoria] || foto.categoria} />}
              {fotos.length > 1 && (
                <>
                  <button onClick={() => ir(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/90 shadow" aria-label="Foto anterior"><ChevronLeft /></button>
                  <button onClick={() => ir(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/90 shadow" aria-label="Próxima foto"><ChevronRight /></button>
                </>
              )}
            </div>
            <div className="p-5 flex justify-between gap-4">
              <div>
                <div className="font-bold text-marinho-900">{foto.titulo}</div>
                <div className="text-sm text-slate-500">{foto.categoria} · {fmtData(foto.data)}</div>
              </div>
              <div className="text-sm text-slate-400">{aberta + 1} / {fotos.length}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const CATS_DOC = ["Todas", "Procedimentos", "Comunicados", "Treinamentos", "Materiais", "Formulários", "Outros"];

export function Documentos() {
  const { dados } = useConteudo();
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const docs = dados.documentos
    .filter((d) => (cat === "Todas" || d.categoria === cat) && `${d.nome} ${d.descricao}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.data.localeCompare(a.data));
  return (
    <div>
      <Cabecalho titulo="Documentos" subtitulo="Procedimentos, treinamentos, formulários e materiais sempre à mão." icone={FileText} />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <Filtros opcoes={CATS_DOC} valor={cat} onChange={setCat} />
        <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 h-11 lg:w-72 focus-within:ring-2 focus-within:ring-laranja-400">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar documento" className="outline-none text-sm flex-1 bg-transparent" />
        </label>
      </div>
      {!docs.length && <Vazio>Nenhum documento encontrado.</Vazio>}
      <div className="grid md:grid-cols-2 gap-3">
        {docs.map((d) => (
          <Card key={d.id} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-laranja-50 text-laranja-500 grid place-items-center shrink-0"><FileText /></div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-marinho-900 truncate">{d.nome}</div>
              <div className="text-xs text-slate-500">{d.categoria} · {fmtData(d.data)}</div>
              <div className="text-sm text-slate-600 truncate">{d.descricao}</div>
            </div>
            {d.arquivo ? (
              <a href={d.arquivo} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1.5 bg-laranja-500 hover:bg-laranja-600 text-white text-xs font-bold uppercase rounded-lg px-3 py-2">
                Abrir <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="shrink-0 text-xs text-slate-400" title="Arquivo ainda não anexado">Em breve</span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Edicoes() {
  const { publicadas, atual, dados } = useEdicao();
  const { setEdicaoVista } = useConteudo();
  const abrir = (id) => {
    setEdicaoVista(id === atual.id ? null : id);
    navegar("home");
    window.scrollTo({ top: 0 });
  };
  return (
    <div>
      <Cabecalho titulo="Edições anteriores" subtitulo="Todo o histórico do RJ2 News. Clique em uma edição para ler o jornal como ele estava naquela semana." icone={History} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...publicadas].reverse().map((e) => {
          const qtd = dados.publicacoes.filter((p) => p.semana === e.id && p.status === "publicado").length;
          return (
            <Card key={e.id} onClick={() => abrir(e.id)} className="group p-6 w-full">
              <div className="flex items-center justify-between">
                <div className="text-4xl font-extrabold text-laranja-500">{e.rotulo}</div>
                {e.id === atual.id && <span className="text-[11px] font-bold uppercase bg-marinho-900 text-white rounded-full px-2.5 py-1">Atual</span>}
              </div>
              <div className="mt-1 font-semibold text-marinho-900">{fmtCurta(e.inicio)} a {fmtCurta(e.fim)} · {e.id.slice(0, 4)}</div>
              <div className="text-sm text-slate-500 mt-1">{qtd} {qtd === 1 ? "notícia publicada" : "notícias publicadas"}</div>
              {e.manchetes?.[0] && <p className="mt-3 text-sm text-slate-600 border-t border-slate-100 pt-3">“{e.manchetes[0].texto}”</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
