# Photobooth Peak Season

Site estático (HTML + JS puro, sem build) para tirar fotos com a moldura de cada dia do desafio.

- **Nenhuma foto é enviada nem salva em servidor.** A foto é montada no próprio celular; a pessoa
  compartilha direto (WhatsApp, Instagram etc., pelo menu nativo do celular) ou salva no aparelho.
- Câmera frontal/traseira, temporizador (0/3/5/10s) e opção de escolher foto da galeria (com arrastar e zoom).
- Dias futuros ficam bloqueados até a data. Para testar tudo antes: abra com `?todos=1` no final do link.
- Link direto para um dia: `/#dia-6`.

## Trocar ou adicionar molduras

1. Exporte a moldura em **1080x1920**, PNG ou WEBP, com a área da foto **transparente**.
2. No GitHub, abra a pasta `photobooth/molduras` → **Add file → Upload files** (ex.: `dia-1.png`).
3. Edite `photobooth/config.js` e troque `moldura: null` do dia por `moldura: "molduras/dia-1.png"`.
4. Faça o commit. A Vercel publica sozinha em ~1 minuto.

Datas, nomes, descrições, hashtag e bloqueio dos dias futuros também ficam em `config.js`.

## Publicar na Vercel

**New Project** → importe este repositório → em **Root Directory** escolha `photobooth` →
Framework Preset **Other** (sem build command) → **Deploy**.

## Rodar localmente

```bash
cd photobooth && python3 -m http.server 8000
```
A câmera só funciona em `https://` ou `localhost`.
