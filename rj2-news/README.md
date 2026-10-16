# RJ2 News

Jornal digital semanal interno da operação RJ2 (Vite + React + Tailwind).

A **estrutura do site** (código em `src/`) é separada do **banco de conteúdo**
(`public/conteudo.json` ou Supabase). Para publicar uma nova semana — W36, W37, W38… —
você só mexe no conteúdo, nunca no layout. Todas as edições anteriores continuam no histórico.

## Rodando localmente

```bash
cd rj2-news
npm install
npm run dev
```

## Publicando na Vercel

Este app fica na pasta `rj2-news/`, separado do Painel de Vida. Na Vercel:

1. **Add New → Project** → importe o repositório `painel-de-vida`.
2. Em **Root Directory**, escolha `rj2-news`.
3. Framework: Vite (detectado sozinho). Clique em **Deploy**.

Se preferir, a pasta pode ser movida para um repositório próprio sem nenhuma alteração.

## Como funciona a atualização semanal

Acesse **Área administrativa** (link no rodapé do menu lateral ou `#/admin`).

| Aba | O que faz |
|---|---|
| Publicações | `+ Nova publicação`, editar, excluir, publicar/rascunho, destaque da semana, fixar comunicado, banner da Home |
| Edições | criar a próxima semana (datas calculadas sozinhas), escolher a edição atual, manchetes do “RJ2 em 1 minuto”, imagem de capa |
| Indicadores | resultado geral, melhor turno, ponto de atenção, resultado diário, por turno e KPIs de cada semana |
| Aniversariantes | cadastro único (dia/mês) — aparecem sozinhos na semana certa |
| Conhecendo o time, Reconhecimentos, Agenda, Galeria, Documentos | cadastros de cada seção |
| Configurações | mensagem da barra lateral, exportar/importar `conteudo.json` |

**Preparando a próxima semana com antecedência:** crie a próxima edição, cadastre as
publicações nela como rascunho ou publicadas — edições futuras ficam invisíveis para o
público. Na segunda-feira, clique em **Tornar atual**.

Regras automáticas:

- A Home mostra a edição atual: notícias marcadas como destaque, aniversariantes e agenda
  das datas da semana, indicadores da semana, banner e perfil “Conhecendo o time”.
- Em **Edições anteriores**, o leitor abre qualquer semana passada e vê o jornal como ele era.
- Sem imagem cadastrada, cada notícia ganha uma capa ilustrada pela categoria.

### Onde o conteúdo fica salvo

**Sem banco de dados (padrão):** o site lê `public/conteudo.json`. As edições feitas no
admin ficam só no navegador de quem editou; para publicar, vá em
**Configurações → Exportar conteudo.json** e substitua o arquivo `rj2-news/public/conteudo.json`
no repositório (a Vercel publica sozinha). A senha do admin é `rj2news`
(mude com a variável `VITE_ADMIN_SENHA`). É uma trava simples: quem tiver acesso ao código
consegue vê-la — mas, nesse modo, ninguém consegue alterar o site publicado só pelo navegador.

**Com Supabase (recomendado para uso contínuo):** edições aparecem na hora para todos.

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode o arquivo [`supabase/schema.sql`](./supabase/schema.sql).
3. Em **Authentication → Users → Add user**, crie o e-mail e senha de cada administrador.
4. Na Vercel (Settings → Environment Variables) adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API) e refaça o deploy.
5. Entre no admin, vá em **Configurações → Importar** e envie o `conteudo.json` atual
   (ou apenas salve qualquer item — o conteúdo inicial é copiado para o banco).

Nesse modo, a leitura é pública e só usuários logados conseguem alterar (regras de RLS no
`schema.sql`). Cada salvamento gera uma cópia na tabela `rj2_historico`.

### Imagens

- Mascote: `public/img/mascote.svg` (ilustração provisória — troque pela arte oficial
  mantendo o nome do arquivo).
- Foto do banner: `public/img/operacao.svg`, ou defina uma imagem por edição no admin.
- Fotos enviadas pelo admin são reduzidas e guardadas dentro do conteúdo. Para galerias
  grandes, prefira colar links de imagens hospedadas (Drive, SharePoint, `public/img/...`).
