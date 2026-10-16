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

Por padrão, os dados do painel ficam salvos no `localStorage` do navegador de cada dispositivo — sem sincronização entre aparelhos. Configurando o Supabase (abaixo), eles passam a ficar salvos na nuvem.

**Login padrão:** e-mail `priscila.21.gomes@gmail.com`, senha `vida12345` (definidos em `src/App.jsx`). É só uma trava simples de privacidade, não uma autenticação segura de verdade — qualquer pessoa com acesso ao código consegue ver essas credenciais.

## Conectar ao Supabase (banco de dados + histórico)

Isso é opcional. Sem configurar, o app funciona normalmente usando apenas o `localStorage`.

1. Crie uma conta em [supabase.com](https://supabase.com) (dá pra entrar direto com o GitHub).
2. Clique em **New Project**, escolha um nome (ex: `painel-de-vida`), defina uma senha de banco (guarde num lugar seguro) e a região mais próxima. Aguarde o projeto ser criado (leva 1-2 minutos).
3. No menu lateral do projeto, vá em **SQL Editor** → **New query**, cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste repositório e clique em **Run**. Isso cria as tabelas `estado` (dado atual do painel) e `historico` (snapshots ao longo do tempo).
4. Vá em **Project Settings → API**. Copie a **Project URL** e a chave **anon public**.
5. Configure essas duas variáveis de ambiente:
   - **Localmente:** copie `.env.example` para `.env.local` e cole os valores.
   - **Na Vercel:** vá em **Project Settings → Environment Variables** e adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Depois disso, refaça o deploy (ou faça um novo push) para as variáveis entrarem em vigor.
6. Pronto — o painel passa a ler e salvar o estado no Supabase automaticamente, e a cada ~10 minutos de uso grava um snapshot na tabela `historico`.

**Sobre segurança:** as políticas de acesso (RLS) desse esquema liberam leitura e escrita para quem tiver a chave `anon` do projeto — que fica embutida no código do site, então qualquer pessoa que inspecionar o app consegue lê-la. Isso está no mesmo nível de proteção do login simples do app (não é uma autenticação real). Para um painel realmente privado, o próximo passo seria ativar o Supabase Auth e restringir as políticas ao seu usuário autenticado — se quiser isso, é só pedir.
