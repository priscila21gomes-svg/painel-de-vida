-- Painel da Vida — esquema do banco de dados
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (Project → SQL Editor → New query → colar → Run).

-- Tabela com o estado atual do painel (uma única linha, sempre atualizada)
create table if not exists estado (
  id text primary key,
  data jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- Tabela de histórico: um snapshot do estado a cada mudança relevante,
-- para você poder consultar como o painel estava em datas anteriores
create table if not exists historico (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  data jsonb not null
);

create index if not exists historico_criado_em_idx on historico (criado_em desc);

-- Row Level Security
alter table estado enable row level security;
alter table historico enable row level security;

-- Este é um painel de uso pessoal (login simples no próprio app), então as
-- políticas abaixo liberam leitura/escrita para quem tiver a chave "anon"
-- do projeto — mesmo nível de proteção que a senha fixa já usada no app.
-- Se quiser reforçar isso depois com autenticação real do Supabase, me avise.
create policy "leitura publica estado" on estado for select using (true);
create policy "escrita publica estado" on estado for insert with check (true);
create policy "atualizacao publica estado" on estado for update using (true);

create policy "leitura publica historico" on historico for select using (true);
create policy "escrita publica historico" on historico for insert with check (true);
