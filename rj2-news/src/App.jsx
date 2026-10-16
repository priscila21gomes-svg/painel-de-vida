import { lazy, Suspense, useEffect } from "react";
import { Newspaper } from "lucide-react";
import { ConteudoProvider, useConteudo } from "./lib/store";
import { navegar, useRota } from "./lib/rota";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { Campanhas, Comunicados, Destaques, MateriaPagina, Operacao } from "./pages/Noticias";
import { Aniversariantes, Pessoas } from "./pages/Pessoas";
const Indicadores = lazy(() => import("./pages/Indicadores"));
import Agenda from "./pages/Agenda";
import { Documentos, Edicoes, Galeria } from "./pages/Acervo";
const Admin = lazy(() => import("./pages/Admin"));

function Pagina({ pagina, param }) {
  switch (pagina) {
    case "destaques": return <Destaques busca={param} key={param} />;
    case "pessoas": return <Pessoas />;
    case "operacao": return <Operacao />;
    case "campanhas": return <Campanhas />;
    case "aniversariantes": return <Aniversariantes />;
    case "indicadores": return <Indicadores />;
    case "agenda": return <Agenda />;
    case "comunicados": return <Comunicados />;
    case "galeria": return <Galeria />;
    case "documentos": return <Documentos />;
    case "edicoes": return <Edicoes />;
    case "materia": return <MateriaPagina id={param} />;
    case "admin": return <Admin />;
    default: return <Home />;
  }
}

function Conteudo() {
  const { dados, erro, setEdicaoVista } = useConteudo();
  const { pagina, param } = useRota();

  // Link direto para uma edição: #/edicao/2026-W34
  useEffect(() => {
    if (pagina === "edicao" && param && dados) {
      setEdicaoVista(param);
      navegar("home");
    }
  }, [pagina, param, dados, setEdicaoVista]);

  useEffect(() => {
    if (pagina !== "home") window.scrollTo({ top: 0 });
  }, [pagina, param]);

  if (erro) return <div className="min-h-screen grid place-items-center p-6 text-center text-slate-600">Não foi possível carregar o RJ2 News.<br /><small>{erro}</small></div>;
  if (!dados) {
    return (
      <div className="min-h-screen grid place-items-center bg-laranja-500 text-white">
        <div className="flex flex-col items-center gap-3 animate-pulse"><Newspaper className="w-12 h-12" /><span className="font-bold text-xl">RJ2 News</span></div>
      </div>
    );
  }
  return (
    <Layout pagina={pagina}>
      <div key={`${pagina}/${param}`} className="animate-entrar">
        <Suspense fallback={<div className="h-64" />}>
          <Pagina pagina={pagina} param={param} />
        </Suspense>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <ConteudoProvider>
      <Conteudo />
    </ConteudoProvider>
  );
}
