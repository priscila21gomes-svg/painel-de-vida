import { useEffect, useState } from "react";

// Roteamento simples por hash (#/pagina/param) — funciona em qualquer hospedagem estática.
function ler() {
  const partes = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { pagina: partes[0] || "home", param: partes[1] ? decodeURIComponent(partes[1]) : null };
}

export function useRota() {
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const ao = () => setRota(ler());
    window.addEventListener("hashchange", ao);
    return () => window.removeEventListener("hashchange", ao);
  }, []);
  return rota;
}

export function navegar(caminho) {
  window.location.hash = `#/${caminho === "home" ? "" : caminho}`;
}

export const link = (caminho) => `#/${caminho === "home" ? "" : caminho}`;
