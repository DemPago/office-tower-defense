-- Classifica di Office Tower Defense.
-- Da incollare in Supabase: SQL Editor → New query → Run.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  initials   text        not null check (initials ~ '^[A-Z]{3}$'),
  wave       integer     not null check (wave between 1 and 1000),
  kills      integer     not null check (kills between 0 and 100000),
  bosses     integer     not null default 0 check (bosses between 0 and 100),
  created_at timestamptz not null default now(),
  -- controllo anti-furbetti molto semplice: non più di 100 nemici per ondata
  check (kills <= wave * 100)
);

create index if not exists scores_rank_idx on public.scores (wave desc, kills desc, created_at asc);

-- Sicurezza: chiunque può leggere e aggiungere punteggi, nessuno può modificarli o cancellarli.
alter table public.scores enable row level security;

drop policy if exists "classifica leggibile da tutti" on public.scores;
create policy "classifica leggibile da tutti" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "chiunque puo inserire un punteggio" on public.scores;
create policy "chiunque puo inserire un punteggio" on public.scores
  for insert to anon, authenticated with check (true);
