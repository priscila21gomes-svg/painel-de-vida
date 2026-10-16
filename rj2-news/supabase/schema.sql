-- RJ2 News — banco de conteúdo (opcional)
-- Rode no SQL Editor do projeto Supabase (SQL Editor → New query → colar → Run).

-- Todo o conteúdo do jornal (edições, publicações, aniversariantes, agenda...) em uma linha.
create table if not exists rj2_conteudo (
  id text primary key,
  data jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- Uma cópia a cada salvamento, para recuperar versões antigas se precisar.
create table if not exists rj2_historico (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  data jsonb not null
);

alter table rj2_conteudo enable row level security;
alter table rj2_historico enable row level security;

-- Qualquer pessoa pode LER o jornal; só usuários logados (admins criados em
-- Authentication → Users) podem ALTERAR.
create policy "rj2 leitura publica" on rj2_conteudo for select using (true);
create policy "rj2 admin insere" on rj2_conteudo for insert to authenticated with check (true);
create policy "rj2 admin atualiza" on rj2_conteudo for update to authenticated using (true);

create policy "rj2 admin le historico" on rj2_historico for select to authenticated using (true);
create policy "rj2 admin grava historico" on rj2_historico for insert to authenticated with check (true);
