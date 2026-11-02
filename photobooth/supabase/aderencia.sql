-- Aderência do Photobooth Peak Season
-- Guarda só "dia + estado + região" de cada participação. Nenhuma foto, nome ou e-mail.
-- Rode tudo no SQL Editor do Supabase.

create table if not exists public.aderencia (
  id         bigint generated always as identity primary key,
  dia        smallint not null check (dia between 1 and 7),
  uf         char(2)  not null check (uf in ('AC','AP','AM','PA','RO','RR','TO','AL','BA','CE','MA','PB','PE','PI','RN','SE','DF','GO','MT','MS','ES','MG','RJ','SP','PR','RS','SC')),
  regiao     text     not null check (regiao in ('Norte','Nordeste','Centro-Oeste','Sudeste','Sul')),
  criado_em  timestamptz not null default now()
);

alter table public.aderencia enable row level security;

-- O site (chave anon) só pode INSERIR. Ninguém lê as linhas individuais pela chave pública.
drop policy if exists "photobooth insere" on public.aderencia;
create policy "photobooth insere" on public.aderencia
  for insert to anon with check (true);

-- Resumo agregado (dia x estado) que a página inicial lê.
create or replace function public.aderencia_resumo()
returns table (dia smallint, uf char(2), total bigint)
language sql
security definer
set search_path = public
as $$
  select dia, uf, count(*)::bigint as total
  from public.aderencia
  group by dia, uf;
$$;

revoke all on function public.aderencia_resumo() from public;
grant execute on function public.aderencia_resumo() to anon;
