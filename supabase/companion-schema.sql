-- AplusCity Companion: persistent, per-user chat and memory.
-- Apply only to a dedicated Companion Supabase project, not the SSE community database.
create extension if not exists pgcrypto;

create table if not exists public.companion_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists companion_messages_user_created_idx
  on public.companion_messages(user_id, created_at desc);

create table if not exists public.companion_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory text not null check (char_length(memory) between 1 and 500),
  category text not null default 'preference' check (category in ('preference','personal_story','important_person','routine','communication_style','goal')),
  source_message_id uuid references public.companion_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, memory)
);
create index if not exists companion_memories_user_updated_idx
  on public.companion_memories(user_id, updated_at desc);

alter table public.companion_messages enable row level security;
alter table public.companion_memories enable row level security;
drop policy if exists "Users can read own companion messages" on public.companion_messages;
create policy "Users can read own companion messages" on public.companion_messages for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can add own companion messages" on public.companion_messages;
create policy "Users can add own companion messages" on public.companion_messages for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own companion messages" on public.companion_messages;
create policy "Users can delete own companion messages" on public.companion_messages for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can read own companion memories" on public.companion_memories;
create policy "Users can read own companion memories" on public.companion_memories for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can add own companion memories" on public.companion_memories;
create policy "Users can add own companion memories" on public.companion_memories for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own companion memories" on public.companion_memories;
create policy "Users can update own companion memories" on public.companion_memories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own companion memories" on public.companion_memories;
create policy "Users can delete own companion memories" on public.companion_memories for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.companion_memories to authenticated;
grant select, insert, delete on public.companion_messages to authenticated;
