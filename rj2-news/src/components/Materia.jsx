import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import { Capa, Modal, Selo, Texto } from "./ui";
import { fmtData, fmtLonga } from "../lib/datas";

// Leitura completa de uma publicação (abre em modal a partir de qualquer card).
export function MateriaModal({ materia, onFechar }) {
  return (
    <Modal aberto={!!materia} onFechar={onFechar} titulo={materia?.titulo}>
      {materia && <Materia materia={materia} />}
    </Modal>
  );
}

export function Materia({ materia }) {
  const fotos = [materia.imagem, ...(materia.fotos || [])].filter(Boolean);
  return (
    <article>
      <div className="h-56 md:h-72">
        {fotos.length > 1 ? <Carrossel fotos={fotos} /> : <Capa imagem={fotos[0]} categoria={materia.categoria} rotulo={materia.titulo} className="rounded-t-3xl" />}
      </div>
      <div className="p-6 md:p-8">
        <Selo categoria={materia.categoria} />
        <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-marinho-900 leading-tight">{materia.titulo}</h1>
        <p className="mt-2 text-lg text-slate-500">{materia.resumo}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 border-y border-slate-100 py-3">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{materia.autor}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />Publicado em {fmtData(materia.dataPublicacao)}</span>
          {materia.dataEvento && <span className="flex items-center gap-1.5 text-laranja-600 font-medium"><CalendarDays className="w-4 h-4" />Evento: {fmtLonga(materia.dataEvento)}</span>}
          {materia.local && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{materia.local}</span>}
        </div>
        <div className="mt-6">
          <Texto>{materia.texto}</Texto>
        </div>
      </div>
    </article>
  );
}

export function Carrossel({ fotos, className = "" }) {
  const [i, setI] = useState(0);
  const ir = (d) => setI((v) => (v + d + fotos.length) % fotos.length);
  return (
    <div className={`relative w-full h-full overflow-hidden bg-marinho-900 ${className}`}>
      <div className="flex h-full transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
        {fotos.map((f, k) => (
          <img key={k} src={f} alt="" className="w-full h-full object-cover shrink-0" />
        ))}
      </div>
      <button onClick={() => ir(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow" aria-label="Anterior"><ChevronLeft className="w-5 h-5" /></button>
      <button onClick={() => ir(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/90 shadow" aria-label="Próxima"><ChevronRight className="w-5 h-5" /></button>
      <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
        {fotos.map((_, k) => (
          <button key={k} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2 bg-white/60"}`} aria-label={`Foto ${k + 1}`} />
        ))}
      </div>
    </div>
  );
}
