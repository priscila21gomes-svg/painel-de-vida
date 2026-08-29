# painel-de-vida

Painel pessoal em React (Vite) para organizar rotina, metas, projetos, hábitos, saúde, financeiro e mais.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

Os arquivos ficam em `dist/`.

## Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub.
2. Clique em **New Project** → **Import Git Repository** → selecione `painel-de-vida`.
3. A Vercel detecta automaticamente que é um projeto Vite (build command `npm run build`, output `dist`). Não precisa mudar nada.
4. Clique em **Deploy**.

Os dados do painel (tarefas, metas, etc.) ficam salvos no `localStorage` do navegador de cada dispositivo — não há backend nem sincronização entre aparelhos.

**Login padrão:** e-mail `priscila.21.gomes@gmail.com`, senha `vida12345` (definidos em `src/App.jsx`). É só uma trava simples de privacidade, não uma autenticação segura de verdade — qualquer pessoa com acesso ao código consegue ver essas credenciais.
