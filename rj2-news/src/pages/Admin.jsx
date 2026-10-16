import { useMemo, useRef, useState } from "react";
import {
  BarChart3, Cake, CalendarDays, Copy, Download, Eye, EyeOff, FileText, Image as ImageIcon, LogOut, Lock, Newspaper,
  Pencil, Pin, Plus, Settings, Star, Trash2, Upload, Users, Award, AlertTriangle, Megaphone,
} from "lucide-react";
import { useConteudo } from "../lib/store";
import { fmtCurta, fmtData, hojeISO, proximaEdicao } from "../lib/datas";
import { Card, LISTA_CATEGORIAS, Modal, Selo } from "../components/ui";

const novoId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Reduz a imagem enviada antes de guardar (fica embutida no banco de conteúdo).
function lerImagem(arquivo, max = 1400) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = reject;
    leitor.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

function Login() {
  const { entrar, usaSupabase } = useConteudo();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  return (
    <div className="max-w-md mx-auto mt-10">
      <Card className="p-8">
        <div className="w-14 h-14 rounded-2xl bg-laranja-500 text-white grid place-items-center mx-auto"><Lock /></div>
        <h1 className="mt-4 text-2xl font-extrabold text-center text-marinho-900">Área administrativa</h1>
        <p className="text-center text-sm text-slate-500 mt-1">Acesso restrito à equipe que publica o RJ2 News.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErro("");
            setEnviando(true);
            try { await entrar(email, senha); } catch (err) { setErro(err.message); }
            setEnviando(false);
          }}
        >
          {usaSupabase && <Campo rotulo="E-mail"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} /></Campo>}
          <Campo rotulo="Senha"><input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className={INPUT} autoFocus /></Campo>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button disabled={enviando} className="w-full bg-laranja-500 hover:bg-laranja-600 text-white font-bold rounded-xl py-3 disabled:opacity-60">{enviando ? "Entrando…" : "Entrar"}</button>
        </form>
      </Card>
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-laranja-400 bg-white";

function Campo({ rotulo, children, dica, largo }) {
  return (
    <label className={`block ${largo ? "md:col-span-2" : ""}`}>
      <span className="block text-xs font-semibold text-slate-600 mb-1">{rotulo}</span>
      {children}
      {dica && <span className="block text-[11px] text-slate-400 mt-1">{dica}</span>}
    </label>
  );
}

function CampoImagem({ valor, onChange }) {
  const ref = useRef(null);
  return (
    <div className="flex gap-3 items-start">
      {valor ? <img src={valor} alt="" className="w-20 h-14 rounded-lg object-cover border" /> : <div className="w-20 h-14 rounded-lg bg-slate-100 grid place-items-center text-slate-300"><ImageIcon /></div>}
      <div className="flex-1 space-y-1.5">
        <input value={valor?.startsWith("data:") ? "(imagem enviada)" : valor || ""} onChange={(e) => onChange(e.target.value)} placeholder="Cole um link (https://… ou /img/arquivo.jpg)" className={INPUT} disabled={valor?.startsWith("data:")} />
        <div className="flex gap-2">
          <button type="button" onClick={() => ref.current.click()} className="text-xs font-semibold text-laranja-600 inline-flex items-center gap-1"><Upload className="w-3.5 h-3.5" />Enviar do computador</button>
          {valor && <button type="button" onClick={() => onChange("")} className="text-xs text-slate-500">Remover</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => e.target.files[0] && onChange(await lerImagem(e.target.files[0]))} />
      </div>
    </div>
  );
}

function CampoLista({ valor = [], onChange, imagens }) {
  const ref = useRef(null);
  if (imagens) {
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {valor.map((v, i) => (
            <div key={i} className="relative">
              <img src={v} alt="" className="w-20 h-14 rounded-lg object-cover border" />
              <button type="button" onClick={() => onChange(valor.filter((_, k) => k !== i))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
            </div>
          ))}
          <button type="button" onClick={() => ref.current.click()} className="w-20 h-14 rounded-lg border-2 border-dashed border-slate-200 grid place-items-center text-slate-400 hover:border-laranja-400"><Plus /></button>
        </div>
        <input ref={ref} type="file" accept="image/*" multiple hidden onChange={async (e) => {
          const novas = await Promise.all([...e.target.files].map((f) => lerImagem(f)));
          onChange([...valor, ...novas]);
        }} />
      </div>
    );
  }
  return <textarea rows={3} value={valor.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} onBlur={() => onChange(valor.filter((x) => x.trim()))} className={INPUT} placeholder="Um item por linha" />;
}

function Formulario({ campos, item, setItem, edicoes }) {
  const muda = (nome) => (v) => setItem({ ...item, [nome]: v });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {campos.map((c) => {
        const v = item[c.nome];
        const on = muda(c.nome);
        let input;
        if (c.tipo === "textarea") input = <textarea rows={c.linhas || 6} value={v || ""} onChange={(e) => on(e.target.value)} className={INPUT} />;
        else if (c.tipo === "select" || c.tipo === "semana") {
          const opcoes = c.tipo === "semana" ? [...edicoes].reverse().map((e) => [e.id, `${e.rotulo} — ${fmtCurta(e.inicio)} a ${fmtCurta(e.fim)}`]) : c.opcoes.map((o) => [o, o]);
          input = <select value={v || ""} onChange={(e) => on(e.target.value)} className={INPUT}>{opcoes.map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}</select>;
        } else if (c.tipo === "checkbox") input = (
          <span className="flex items-center gap-2 h-[42px]"><input type="checkbox" checked={!!v} onChange={(e) => on(e.target.checked)} className="w-5 h-5 accent-laranja-500" /><span className="text-sm text-slate-600">{c.texto}</span></span>
        );
        else if (c.tipo === "imagem") input = <CampoImagem valor={v} onChange={on} />;
        else if (c.tipo === "lista") input = <CampoLista valor={v} onChange={on} />;
        else if (c.tipo === "fotos") input = <CampoLista valor={v} onChange={on} imagens />;
        else if (c.tipo === "mmdd") input = (
          <input type="date" value={v ? `2000-${v}` : ""} onChange={(e) => on(e.target.value.slice(5))} className={INPUT} />
        );
        else input = <input type={c.tipo || "text"} value={v ?? ""} onChange={(e) => on(c.tipo === "number" ? Number(e.target.value) : e.target.value)} className={INPUT} required={c.obrigatorio} step="any" />;
        return <Campo key={c.nome} rotulo={c.rotulo} dica={c.dica} largo={c.largo}>{input}</Campo>;
      })}
    </div>
  );
}

// CRUD genérico para qualquer coleção do banco de conteúdo.
function Colecao({ chave, titulo, campos, novo, resumo, acoes, filtroSemana, botaoNovo = "Adicionar" }) {
  const { dados, salvar } = useConteudo();
  const [editando, setEditando] = useState(null);
  const [semana, setSemana] = useState("todas");
  const [erro, setErro] = useState("");
  const itens = dados[chave].filter((i) => !filtroSemana || semana === "todas" || i.semana === semana);

  const gravar = async (lista) => {
    setErro("");
    try { await salvar({ ...dados, [chave]: lista }); } catch (e) { setErro(e.message || "Erro ao salvar"); }
  };
  const salvarItem = async () => {
    const existe = dados[chave].some((i) => i.id === editando.id);
    await gravar(existe ? dados[chave].map((i) => (i.id === editando.id ? editando : i)) : [editando, ...dados[chave]]);
    setEditando(null);
  };
  const atualizar = (item, mudanca) => gravar(dados[chave].map((i) => (i.id === item.id ? { ...i, ...mudanca } : i)));
  const excluir = (item) => confirm("Excluir este item? Essa ação não pode ser desfeita.") && gravar(dados[chave].filter((i) => i.id !== item.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-marinho-900">{titulo} <span className="text-slate-400 font-normal text-base">({itens.length})</span></h2>
        <div className="flex gap-2">
          {filtroSemana && (
            <select value={semana} onChange={(e) => setSemana(e.target.value)} className={`${INPUT} w-auto`}>
              <option value="todas">Todas as semanas</option>
              {[...dados.edicoes].reverse().map((e) => <option key={e.id} value={e.id}>{e.rotulo}</option>)}
            </select>
          )}
          <button onClick={() => setEditando(novo())} className="inline-flex items-center gap-1.5 bg-laranja-500 hover:bg-laranja-600 text-white font-bold text-sm rounded-xl px-4 py-2.5 whitespace-nowrap">
            <Plus className="w-4 h-4" /> {botaoNovo}
          </button>
        </div>
      </div>
      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
      <div className="space-y-2">
        {itens.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-100 p-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">{resumo(item)}</div>
            <div className="flex items-center gap-1">
              {acoes?.(item, atualizar)}
              <button onClick={() => setEditando({ ...item })} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Editar"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => setEditando({ ...item, id: novoId(chave) })} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Duplicar"><Copy className="w-4 h-4" /></button>
              <button onClick={() => excluir(item)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Excluir"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {!itens.length && <p className="text-sm text-slate-400 py-6 text-center">Nada cadastrado.</p>}
      </div>
      <Modal aberto={!!editando} onFechar={() => setEditando(null)} largura="max-w-3xl" titulo={titulo}>
        {editando && (
          <form className="p-6 md:p-8" onSubmit={(e) => { e.preventDefault(); salvarItem(); }}>
            <h3 className="text-xl font-bold text-marinho-900 mb-5">{dados[chave].some((i) => i.id === editando.id) ? "Editar" : "Novo"} — {titulo}</h3>
            <Formulario campos={campos} item={editando} setItem={setEditando} edicoes={dados.edicoes} />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button className="px-5 py-2.5 rounded-xl text-sm font-bold bg-laranja-500 hover:bg-laranja-600 text-white">Salvar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

const Linha = ({ titulo, sub }) => (
  <>
    <div className="font-semibold text-marinho-900 leading-snug">{titulo}</div>
    <div className="text-xs text-slate-500">{sub}</div>
  </>
);

function Publicacoes() {
  const { dados } = useConteudo();
  const semanaPadrao = dados.config.edicaoAtual;
  const rotulo = (id) => dados.edicoes.find((e) => e.id === id)?.rotulo || id;
  const Alternar = ({ ativo, onClick, icone: I, iconeOff: IOff = I, titulo }) => (
    <button onClick={onClick} title={titulo} className={`p-2 rounded-lg ${ativo ? "bg-laranja-50 text-laranja-600" : "text-slate-300 hover:bg-slate-100"}`}>
      {ativo ? <I className="w-4 h-4" /> : <IOff className="w-4 h-4" />}
    </button>
  );
  return (
    <Colecao
      chave="publicacoes"
      titulo="Publicações"
      botaoNovo="Nova publicação"
      filtroSemana
      novo={() => ({ id: novoId("pub"), semana: semanaPadrao, categoria: "Campanhas", titulo: "", resumo: "", texto: "", imagem: "", autor: "Comunicação RJ2", dataPublicacao: hojeISO(), status: "rascunho", destaque: false, fixado: false, banner: false, local: "", dataEvento: "", fotos: [] })}
      campos={[
        { nome: "titulo", rotulo: "Título", largo: true, obrigatorio: true },
        { nome: "semana", rotulo: "Edição (semana)", tipo: "semana" },
        { nome: "categoria", rotulo: "Categoria", tipo: "select", opcoes: LISTA_CATEGORIAS },
        { nome: "resumo", rotulo: "Resumo", tipo: "textarea", linhas: 2, largo: true },
        { nome: "texto", rotulo: "Texto completo", tipo: "textarea", largo: true, dica: "Deixe uma linha em branco entre parágrafos." },
        { nome: "imagem", rotulo: "Imagem principal", tipo: "imagem", largo: true, dica: "Sem imagem, o site gera uma capa ilustrada pela categoria." },
        { nome: "fotos", rotulo: "Fotos adicionais (carrossel)", tipo: "fotos", largo: true },
        { nome: "autor", rotulo: "Autor / responsável" },
        { nome: "dataPublicacao", rotulo: "Data de publicação", tipo: "date" },
        { nome: "dataEvento", rotulo: "Data do evento (opcional)", tipo: "date" },
        { nome: "local", rotulo: "Local (opcional)" },
        { nome: "status", rotulo: "Status", tipo: "select", opcoes: ["rascunho", "publicado"] },
        { nome: "destaque", rotulo: "Destaque", tipo: "checkbox", texto: "Destaque da semana na Home" },
        { nome: "fixado", rotulo: "Fixar", tipo: "checkbox", texto: "Fixar no topo dos comunicados" },
        { nome: "banner", rotulo: "Banner", tipo: "checkbox", texto: "Usar como banner grande da Home (ex.: 11.11)" },
      ]}
      resumo={(p) => (
        <div className="flex items-start gap-3">
          <span className={`mt-1 shrink-0 text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${p.status === "publicado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
          <div>
            <div className="font-semibold text-marinho-900 leading-snug">{p.titulo || "(sem título)"}</div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1"><Selo categoria={p.categoria} /> {rotulo(p.semana)} · {fmtData(p.dataPublicacao)}</div>
          </div>
        </div>
      )}
      acoes={(p, atualizar) => (
        <>
          <Alternar ativo={p.status === "publicado"} icone={Eye} iconeOff={EyeOff} titulo={p.status === "publicado" ? "Despublicar" : "Publicar"} onClick={() => atualizar(p, { status: p.status === "publicado" ? "rascunho" : "publicado" })} />
          <Alternar ativo={p.destaque} icone={Star} titulo="Destaque da semana" onClick={() => atualizar(p, { destaque: !p.destaque })} />
          <Alternar ativo={p.fixado} icone={Pin} titulo="Fixar nos comunicados" onClick={() => atualizar(p, { fixado: !p.fixado })} />
          <Alternar ativo={p.banner} icone={Megaphone} titulo="Banner da Home" onClick={() => atualizar(p, { banner: !p.banner })} />
        </>
      )}
    />
  );
}

function Edicoes() {
  const { dados, salvar } = useConteudo();
  const [editando, setEditando] = useState(null);
  const ordenadas = [...dados.edicoes].sort((a, b) => b.inicio.localeCompare(a.inicio));
  const atual = dados.config.edicaoAtual;

  const criarProxima = async () => {
    const nova = proximaEdicao(ordenadas[0]);
    if (dados.edicoes.some((e) => e.id === nova.id)) return alert(`A edição ${nova.rotulo} já existe.`);
    await salvar({ ...dados, edicoes: [...dados.edicoes, nova] });
  };
  const tornarAtual = (id) => salvar({ ...dados, config: { ...dados.config, edicaoAtual: id } });
  const gravar = async () => {
    const limpa = { ...editando, manchetes: editando.manchetes.filter((m) => m.texto.trim()) };
    await salvar({ ...dados, edicoes: dados.edicoes.map((e) => (e.id === limpa.id ? limpa : e)) });
    setEditando(null);
  };
  const excluir = async (e) => {
    const qtd = dados.publicacoes.filter((p) => p.semana === e.id).length;
    if (e.id === atual) return alert("Não é possível excluir a edição atual.");
    if (!confirm(`Excluir a edição ${e.rotulo}?${qtd ? ` Ela tem ${qtd} publicações, que continuarão no banco sem edição.` : ""}`)) return;
    await salvar({ ...dados, edicoes: dados.edicoes.filter((x) => x.id !== e.id) });
  };

  const opcoesLink = [
    ...["destaques", "pessoas", "operacao", "campanhas", "aniversariantes", "indicadores", "agenda", "comunicados", "galeria", "documentos"].map((p) => [p, `Página: ${p}`]),
    ...dados.publicacoes.filter((p) => p.semana === editando?.id).map((p) => [`materia/${p.id}`, `Matéria: ${p.titulo}${p.status !== "publicado" ? " (rascunho)" : ""}`]),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-marinho-900">Edições semanais</h2>
        <button onClick={criarProxima} className="inline-flex items-center gap-1.5 bg-laranja-500 hover:bg-laranja-600 text-white font-bold text-sm rounded-xl px-4 py-2.5">
          <Plus className="w-4 h-4" /> Criar próxima edição ({proximaEdicao(ordenadas[0]).rotulo})
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        A <b>edição atual</b> é a que aparece na Home. Edições futuras ficam ocultas para o público até se tornarem atuais — prepare tudo com antecedência e, na segunda-feira, clique em “Tornar atual”.
      </p>
      <div className="space-y-2">
        {ordenadas.map((e) => {
          const futura = e.inicio > (dados.edicoes.find((x) => x.id === atual)?.inicio || "");
          return (
            <div key={e.id} className={`bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3 ${e.id === atual ? "border-laranja-300 ring-1 ring-laranja-200" : "border-slate-100"}`}>
              <div className="text-2xl font-extrabold text-laranja-500 w-16">{e.rotulo}</div>
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold text-marinho-900">{fmtData(e.inicio)} a {fmtData(e.fim)}</div>
                <div className="text-xs text-slate-500">{dados.publicacoes.filter((p) => p.semana === e.id).length} publicações · {e.manchetes?.length || 0} manchetes no “RJ2 em 1 minuto”</div>
              </div>
              {e.id === atual ? <span className="text-xs font-bold uppercase bg-marinho-900 text-white rounded-full px-3 py-1">Atual</span>
                : <button onClick={() => tornarAtual(e.id)} className="text-xs font-bold uppercase text-laranja-600 border border-laranja-200 rounded-full px-3 py-1 hover:bg-laranja-50">Tornar atual</button>}
              {futura && <span className="text-xs text-slate-400">em preparação</span>}
              <button onClick={() => setEditando({ ...e, manchetes: [...(e.manchetes || [])] })} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Editar"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => excluir(e)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="Excluir"><Trash2 className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
      <Modal aberto={!!editando} onFechar={() => setEditando(null)} titulo="Editar edição">
        {editando && (
          <form className="p-6 md:p-8 space-y-5" onSubmit={(ev) => { ev.preventDefault(); gravar(); }}>
            <h3 className="text-xl font-bold text-marinho-900">Edição {editando.rotulo}</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Campo rotulo="Rótulo"><input value={editando.rotulo} onChange={(e) => setEditando({ ...editando, rotulo: e.target.value })} className={INPUT} /></Campo>
              <Campo rotulo="Início"><input type="date" value={editando.inicio} onChange={(e) => setEditando({ ...editando, inicio: e.target.value })} className={INPUT} /></Campo>
              <Campo rotulo="Fim"><input type="date" value={editando.fim} onChange={(e) => setEditando({ ...editando, fim: e.target.value })} className={INPUT} /></Campo>
            </div>
            <Campo rotulo="Imagem de capa do banner (opcional)"><CampoImagem valor={editando.capaImagem} onChange={(v) => setEditando({ ...editando, capaImagem: v })} /></Campo>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">📰 O RJ2 em 1 minuto — manchetes rápidas (até 6)</div>
              <div className="space-y-2">
                {editando.manchetes.map((m, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-2">
                    <input value={m.texto} onChange={(e) => setEditando({ ...editando, manchetes: editando.manchetes.map((x, k) => (k === i ? { ...x, texto: e.target.value } : x)) })} className={INPUT} placeholder="Texto da manchete" />
                    <select value={m.link} onChange={(e) => setEditando({ ...editando, manchetes: editando.manchetes.map((x, k) => (k === i ? { ...x, link: e.target.value } : x)) })} className={`${INPUT} md:w-72`}>
                      {!opcoesLink.some(([v]) => v === m.link) && <option value={m.link}>{m.link}</option>}
                      {opcoesLink.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                    </select>
                    <button type="button" onClick={() => setEditando({ ...editando, manchetes: editando.manchetes.filter((_, k) => k !== i) })} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              {editando.manchetes.length < 6 && (
                <button type="button" onClick={() => setEditando({ ...editando, manchetes: [...editando.manchetes, { texto: "", link: "destaques" }] })} className="mt-2 text-sm font-semibold text-laranja-600 inline-flex items-center gap-1"><Plus className="w-4 h-4" />Adicionar manchete</button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button className="px-5 py-2.5 rounded-xl text-sm font-bold bg-laranja-500 hover:bg-laranja-600 text-white">Salvar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

const num = (v) => (v === "" ? 0 : Number(String(v).replace(",", ".")));
const Num = ({ valor, onChange }) => <input type="number" step="any" value={valor} onChange={(e) => onChange(num(e.target.value))} className={INPUT} />;

function Indicadores() {
  const { dados, salvar } = useConteudo();
  const [semana, setSemana] = useState(dados.config.edicaoAtual);
  const base = useMemo(() => {
    const existente = dados.indicadores.find((i) => i.semana === semana);
    if (existente) return existente;
    const modelo = [...dados.indicadores].pop();
    return {
      semana, resultadoGeral: 0, meta: modelo?.meta ?? 95, melhorTurno: { turno: "Turno A", valor: 0 }, pontoAtencao: { titulo: "", descricao: "" },
      diario: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia) => ({ dia, valor: 0 })),
      turnos: (modelo?.turnos || [{ turno: "Turno A" }, { turno: "Turno B" }, { turno: "Turno C" }]).map((t) => ({ turno: t.turno, valor: 0 })),
      kpis: (modelo?.kpis || []).map((k) => ({ ...k, valor: 0 })),
    };
  }, [dados.indicadores, semana]);
  const [ind, setInd] = useState(base);
  const [ok, setOk] = useState("");
  if (ind.semana !== semana) setInd(base);

  const gravar = async () => {
    const outros = dados.indicadores.filter((i) => i.semana !== semana);
    await salvar({ ...dados, indicadores: [...outros, ind] });
    setOk("Indicadores salvos!");
    setTimeout(() => setOk(""), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-marinho-900">Indicadores da semana</h2>
        <select value={semana} onChange={(e) => setSemana(e.target.value)} className={`${INPUT} w-auto`}>
          {[...dados.edicoes].reverse().map((e) => <option key={e.id} value={e.id}>{e.rotulo} {dados.indicadores.some((i) => i.semana === e.id) ? "" : "(sem dados)"}</option>)}
        </select>
      </div>
      <Card className="p-5 grid md:grid-cols-3 gap-4">
        <Campo rotulo="Resultado geral (%)"><Num valor={ind.resultadoGeral} onChange={(v) => setInd({ ...ind, resultadoGeral: v })} /></Campo>
        <Campo rotulo="Meta (%)"><Num valor={ind.meta} onChange={(v) => setInd({ ...ind, meta: v })} /></Campo>
        <div />
        <Campo rotulo="Melhor turno"><input value={ind.melhorTurno.turno} onChange={(e) => setInd({ ...ind, melhorTurno: { ...ind.melhorTurno, turno: e.target.value } })} className={INPUT} /></Campo>
        <Campo rotulo="Resultado do melhor turno (%)"><Num valor={ind.melhorTurno.valor} onChange={(v) => setInd({ ...ind, melhorTurno: { ...ind.melhorTurno, valor: v } })} /></Campo>
        <div />
        <Campo rotulo="Ponto de atenção"><input value={ind.pontoAtencao.titulo} onChange={(e) => setInd({ ...ind, pontoAtencao: { ...ind.pontoAtencao, titulo: e.target.value } })} className={INPUT} /></Campo>
        <Campo rotulo="Descrição do ponto de atenção" largo><input value={ind.pontoAtencao.descricao} onChange={(e) => setInd({ ...ind, pontoAtencao: { ...ind.pontoAtencao, descricao: e.target.value } })} className={INPUT} /></Campo>
      </Card>
      <Card className="p-5">
        <div className="text-sm font-bold text-marinho-900 mb-3">Resultado diário (%)</div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {ind.diario.map((d, i) => (
            <Campo key={d.dia} rotulo={d.dia}><Num valor={d.valor} onChange={(v) => setInd({ ...ind, diario: ind.diario.map((x, k) => (k === i ? { ...x, valor: v } : x)) })} /></Campo>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="text-sm font-bold text-marinho-900 mb-3">Resultado por turno (%)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ind.turnos.map((t, i) => (
            <Campo key={i} rotulo={t.turno}><Num valor={t.valor} onChange={(v) => setInd({ ...ind, turnos: ind.turnos.map((x, k) => (k === i ? { ...x, valor: v } : x)) })} /></Campo>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="text-sm font-bold text-marinho-900 mb-3">KPIs (cards)</div>
        <div className="space-y-2">
          {ind.kpis.map((k, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_80px_auto] gap-2">
              <input value={k.nome} onChange={(e) => setInd({ ...ind, kpis: ind.kpis.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) })} className={INPUT} placeholder="Nome" />
              <Num valor={k.valor} onChange={(v) => setInd({ ...ind, kpis: ind.kpis.map((x, j) => (j === i ? { ...x, valor: v } : x)) })} />
              <input value={k.unidade} onChange={(e) => setInd({ ...ind, kpis: ind.kpis.map((x, j) => (j === i ? { ...x, unidade: e.target.value } : x)) })} className={INPUT} placeholder="%" />
              <button type="button" onClick={() => setInd({ ...ind, kpis: ind.kpis.filter((_, j) => j !== i) })} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setInd({ ...ind, kpis: [...ind.kpis, { nome: "", valor: 0, unidade: "" }] })} className="mt-2 text-sm font-semibold text-laranja-600 inline-flex items-center gap-1"><Plus className="w-4 h-4" />Adicionar KPI</button>
      </Card>
      <div className="flex items-center justify-end gap-3">
        {ok && <span className="text-sm text-emerald-700">{ok}</span>}
        <button onClick={gravar} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-laranja-500 hover:bg-laranja-600 text-white">Salvar indicadores</button>
      </div>
    </div>
  );
}

function Configuracoes() {
  const { dados, salvar, alteracoesLocais, descartarLocais, usaSupabase } = useConteudo();
  const ref = useRef(null);
  const [slogan, setSlogan] = useState(dados.config.slogan);
  const exportar = () => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "conteudo.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importar = async (arquivo) => {
    try {
      const novo = JSON.parse(await arquivo.text());
      if (!novo.edicoes || !novo.publicacoes || !novo.config) throw new Error("Arquivo inválido");
      if (confirm("Substituir todo o conteúdo atual pelo arquivo importado?")) await salvar(novo);
    } catch (e) {
      alert(`Não foi possível importar: ${e.message}`);
    }
  };
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-marinho-900">Configurações e backup</h2>
      <Card className="p-5 space-y-3">
        <Campo rotulo="Mensagem da barra lateral"><input value={slogan} onChange={(e) => setSlogan(e.target.value)} className={INPUT} /></Campo>
        <button onClick={() => salvar({ ...dados, config: { ...dados.config, slogan } })} className="px-4 py-2 rounded-xl text-sm font-bold bg-laranja-500 text-white">Salvar</button>
      </Card>
      <Card className="p-5">
        <div className="font-bold text-marinho-900">Onde o conteúdo fica salvo</div>
        {usaSupabase ? (
          <p className="text-sm text-slate-600 mt-1">No banco de dados (Supabase). Toda alteração já fica visível para todos, e cada salvamento gera uma cópia na tabela de histórico.</p>
        ) : (
          <p className="text-sm text-slate-600 mt-1">
            Sem banco de dados configurado, as alterações ficam <b>somente neste navegador</b>. Para publicar para todos, clique em <b>Exportar conteudo.json</b> e substitua o arquivo <code className="bg-slate-100 px-1 rounded">public/conteudo.json</code> no repositório (a Vercel publica sozinha). Veja o README para ativar o Supabase e editar direto pelo site.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportar} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-marinho-900 text-white"><Download className="w-4 h-4" />Exportar conteudo.json</button>
          <button onClick={() => ref.current.click()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200"><Upload className="w-4 h-4" />Importar</button>
          {alteracoesLocais && <button onClick={() => confirm("Descartar todas as alterações feitas neste navegador?") && descartarLocais()} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">Descartar alterações locais</button>}
          <input ref={ref} type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importar(e.target.files[0])} />
        </div>
      </Card>
    </div>
  );
}

const ABAS = [
  { id: "publicacoes", rotulo: "Publicações", icone: Newspaper },
  { id: "edicoes", rotulo: "Edições", icone: CalendarDays },
  { id: "indicadores", rotulo: "Indicadores", icone: BarChart3 },
  { id: "aniversariantes", rotulo: "Aniversariantes", icone: Cake },
  { id: "time", rotulo: "Conhecendo o time", icone: Users },
  { id: "reconhecimentos", rotulo: "Reconhecimentos", icone: Award },
  { id: "agenda", rotulo: "Agenda", icone: CalendarDays },
  { id: "galeria", rotulo: "Galeria", icone: ImageIcon },
  { id: "documentos", rotulo: "Documentos", icone: FileText },
  { id: "config", rotulo: "Configurações", icone: Settings },
];

function Painel() {
  const { dados, sair, alteracoesLocais, usaSupabase } = useConteudo();
  const [aba, setAba] = useState("publicacoes");
  const semana = dados.config.edicaoAtual;
  const ed = (id) => dados.edicoes.find((e) => e.id === id)?.rotulo || id;
  const atual = dados.edicoes.find((e) => e.id === semana);

  return (
    <div>
      <div className="rounded-3xl bg-marinho-900 text-white p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amarelo font-bold">Área administrativa</div>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">Redação do RJ2 News</h1>
          <p className="text-white/70 text-sm mt-1">Edição atual: <b className="text-white">{atual?.rotulo}</b> ({fmtCurta(atual?.inicio)} a {fmtCurta(atual?.fim)})</p>
        </div>
        <div className="flex gap-2">
          <a href="#/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20"><Eye className="w-4 h-4" />Ver site</a>
          <button onClick={sair} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </div>
      {!usaSupabase && alteracoesLocais && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Há alterações salvas só neste navegador. Vá em <b>Configurações → Exportar conteudo.json</b> para publicar para todos.</span>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {ABAS.map(({ id, rotulo, icone: I }) => (
          <button key={id} onClick={() => setAba(id)} className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${aba === id ? "bg-laranja-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-laranja-300"}`}>
            <I className="w-4 h-4" /> {rotulo}
          </button>
        ))}
      </div>

      {aba === "publicacoes" && <Publicacoes />}
      {aba === "edicoes" && <Edicoes />}
      {aba === "indicadores" && <Indicadores />}
      {aba === "config" && <Configuracoes />}
      {aba === "aniversariantes" && (
        <Colecao chave="aniversariantes" titulo="Aniversariantes" novo={() => ({ id: novoId("niver"), nome: "", area: "", data: "", foto: "" })}
          campos={[{ nome: "nome", rotulo: "Nome", obrigatorio: true }, { nome: "area", rotulo: "Área" }, { nome: "data", rotulo: "Data de aniversário", tipo: "mmdd", dica: "O ano é ignorado. Aparece automaticamente na semana certa." }, { nome: "foto", rotulo: "Foto", tipo: "imagem", largo: true }]}
          resumo={(a) => <Linha titulo={a.nome} sub={`${a.area} · ${a.data ? `${a.data.slice(3)}/${a.data.slice(0, 2)}` : "sem data"}`} />} />
      )}
      {aba === "time" && (
        <Colecao chave="time" titulo="Conhecendo o time" filtroSemana novo={() => ({ id: novoId("time"), semana, nome: "", area: "", cargo: "", turno: "", descricao: "", curiosidades: [], foto: "" })}
          campos={[{ nome: "nome", rotulo: "Nome", obrigatorio: true }, { nome: "semana", rotulo: "Edição em que aparece", tipo: "semana" }, { nome: "area", rotulo: "Área" }, { nome: "cargo", rotulo: "Cargo" }, { nome: "turno", rotulo: "Turno" }, { nome: "foto", rotulo: "Foto", tipo: "imagem" }, { nome: "descricao", rotulo: "Pequena descrição", tipo: "textarea", linhas: 3, largo: true }, { nome: "curiosidades", rotulo: "Curiosidades", tipo: "lista", largo: true }]}
          resumo={(p) => <Linha titulo={p.nome} sub={`${ed(p.semana)} · ${p.cargo} · ${p.area}`} />} />
      )}
      {aba === "reconhecimentos" && (
        <Colecao chave="reconhecimentos" titulo="Reconhecimentos" filtroSemana novo={() => ({ id: novoId("rec"), semana, nome: "", motivo: "Produtividade", descricao: "", foto: "" })}
          campos={[{ nome: "nome", rotulo: "Colaborador ou equipe", obrigatorio: true }, { nome: "semana", rotulo: "Edição", tipo: "semana" }, { nome: "motivo", rotulo: "Motivo", tipo: "select", opcoes: ["Produtividade", "Qualidade", "Segurança", "Projetos", "Tempo de casa", "Atitude de dono"] }, { nome: "descricao", rotulo: "Descrição", largo: true }]}
          resumo={(r) => <Linha titulo={r.nome} sub={`${ed(r.semana)} · ${r.motivo} · ${r.descricao}`} />} />
      )}
      {aba === "agenda" && (
        <Colecao chave="agenda" titulo="Agenda" novo={() => ({ id: novoId("ag"), data: atual?.inicio || hojeISO(), horario: "09:00", evento: "", area: "", local: "", descricao: "" })}
          campos={[{ nome: "evento", rotulo: "Evento", obrigatorio: true, largo: true }, { nome: "data", rotulo: "Data", tipo: "date" }, { nome: "horario", rotulo: "Horário", tipo: "time" }, { nome: "area", rotulo: "Área responsável" }, { nome: "local", rotulo: "Local" }, { nome: "descricao", rotulo: "Descrição", tipo: "textarea", linhas: 3, largo: true }]}
          resumo={(a) => <Linha titulo={a.evento} sub={`${fmtData(a.data)} ${a.horario} · ${a.area} · ${a.local}`} />} />
      )}
      {aba === "galeria" && (
        <Colecao chave="galeria" titulo="Galeria" filtroSemana novo={() => ({ id: novoId("foto"), semana, titulo: "", categoria: "Eventos", data: hojeISO(), imagem: "" })}
          campos={[{ nome: "titulo", rotulo: "Legenda", obrigatorio: true }, { nome: "categoria", rotulo: "Álbum", tipo: "select", opcoes: ["Eventos", "Campanhas", "Pessoas", "Operação", "Comemorações"] }, { nome: "data", rotulo: "Data", tipo: "date" }, { nome: "semana", rotulo: "Edição", tipo: "semana" }, { nome: "imagem", rotulo: "Foto", tipo: "imagem", largo: true }]}
          resumo={(f) => (
            <div className="flex items-center gap-3">
              {f.imagem ? <img src={f.imagem} alt="" className="w-14 h-10 rounded object-cover" /> : <div className="w-14 h-10 rounded bg-slate-100" />}
              <Linha titulo={f.titulo} sub={`${f.categoria} · ${fmtData(f.data)} · ${ed(f.semana)}`} />
            </div>
          )} />
      )}
      {aba === "documentos" && (
        <Colecao chave="documentos" titulo="Documentos" novo={() => ({ id: novoId("doc"), nome: "", categoria: "Procedimentos", data: hojeISO(), descricao: "", arquivo: "" })}
          campos={[{ nome: "nome", rotulo: "Nome", obrigatorio: true }, { nome: "categoria", rotulo: "Categoria", tipo: "select", opcoes: ["Procedimentos", "Comunicados", "Treinamentos", "Materiais", "Formulários", "Outros"] }, { nome: "data", rotulo: "Data", tipo: "date" }, { nome: "arquivo", rotulo: "Link do arquivo", dica: "Link do Google Drive, SharePoint etc., ou /docs/arquivo.pdf se o arquivo estiver em public/docs." }, { nome: "descricao", rotulo: "Descrição", tipo: "textarea", linhas: 2, largo: true }]}
          resumo={(d) => <Linha titulo={d.nome} sub={`${d.categoria} · ${fmtData(d.data)}${d.arquivo ? "" : " · sem arquivo"}`} />} />
      )}
    </div>
  );
}

export default function Admin() {
  const { admin } = useConteudo();
  return admin ? <Painel /> : <Login />;
}
