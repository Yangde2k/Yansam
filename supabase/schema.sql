-- YANSAM Supabase schema
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.user_can_access_couple(target_couple uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.couple_spaces c
    where c.id = target_couple
      and auth.uid() in (c.user1_id, c.user2_id)
  );
$$;

create or replace function public.storage_object_couple_id(object_path text)
returns uuid
language plpgsql
immutable
as $$
declare
  possible_uuid text;
begin
  possible_uuid := split_part(object_path, '/', 1);

  if possible_uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return possible_uuid::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.ensure_single_couple_membership()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.couple_spaces c
    where c.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (
        new.user1_id in (c.user1_id, c.user2_id)
        or (new.user2_id is not null and new.user2_id in (c.user1_id, c.user2_id))
      )
  ) then
    raise exception 'A user can only belong to one couple space.';
  end if;

  return new;
end;
$$;

create or replace function public.create_partner_invite(input_invitee_email text default null)
returns public.partner_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles;
  existing_couple public.couple_spaces;
  created_invite public.partner_invites;
  normalized_email text := nullif(lower(trim(input_invitee_email)), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id;

  if not found then
    raise exception 'Profile not found.';
  end if;

  if current_profile.partner_id is not null then
    raise exception 'This account is already linked to a partner.';
  end if;

  if normalized_email is not null and normalized_email = lower(coalesce(current_profile.email, '')) then
    raise exception 'You cannot invite your own email address.';
  end if;

  select * into existing_couple
  from public.couple_spaces
  where current_user_id in (user1_id, user2_id)
  limit 1
  for update;

  if found and existing_couple.user2_id is not null then
    raise exception 'Your couple space already has two members.';
  end if;

  if not found then
    insert into public.couple_spaces (user1_id)
    values (current_user_id)
    on conflict (user1_id) do update set updated_at = now()
    returning * into existing_couple;
  end if;

  update public.partner_invites
  set revoked_at = now()
  where inviter_id = current_user_id
    and accepted_at is null
    and revoked_at is null;

  insert into public.partner_invites (inviter_id, invitee_email, couple_space_id)
  values (current_user_id, normalized_email, existing_couple.id)
  returning * into created_invite;

  return created_invite;
end;
$$;

create or replace function public.accept_partner_invite(input_code text)
returns public.couple_spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles;
  inviter_profile public.profiles;
  invite public.partner_invites;
  target_couple public.couple_spaces;
  normalized_code text := upper(trim(input_code));
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception 'Profile not found.';
  end if;

  if current_profile.partner_id is not null then
    raise exception 'This account is already linked to a partner.';
  end if;

  if exists (
    select 1
    from public.couple_spaces c
    where current_user_id in (c.user1_id, c.user2_id)
  ) then
    raise exception 'This account already belongs to a couple space.';
  end if;

  select * into invite
  from public.partner_invites
  where code = normalized_code
    and accepted_at is null
    and revoked_at is null
  limit 1
  for update;

  if not found then
    raise exception 'Invite not found or no longer active.';
  end if;

  if invite.expires_at < now() then
    raise exception 'Invite has expired.';
  end if;

  if invite.inviter_id = current_user_id then
    raise exception 'You cannot accept your own invite.';
  end if;

  if invite.invitee_email is not null and lower(coalesce(current_profile.email, '')) <> lower(invite.invitee_email) then
    raise exception 'This invite was created for a different email address.';
  end if;

  select * into inviter_profile
  from public.profiles
  where id = invite.inviter_id
  for update;

  if not found then
    raise exception 'The inviter profile could not be found.';
  end if;

  if inviter_profile.partner_id is not null then
    raise exception 'This invite is no longer available.';
  end if;

  if invite.couple_space_id is null then
    insert into public.couple_spaces (user1_id, user2_id)
    values (invite.inviter_id, current_user_id)
    returning * into target_couple;
  else
    select * into target_couple
    from public.couple_spaces
    where id = invite.couple_space_id
    for update;

    if not found then
      raise exception 'Couple space not found.';
    end if;

    if target_couple.user2_id is not null then
      raise exception 'This couple space already has two members.';
    end if;

    if invite.inviter_id not in (target_couple.user1_id, target_couple.user2_id) then
      raise exception 'This invite is no longer valid.';
    end if;

    update public.couple_spaces
    set user2_id = current_user_id
    where id = target_couple.id
    returning * into target_couple;
  end if;

  update public.profiles set partner_id = current_user_id where id = invite.inviter_id;
  update public.profiles set partner_id = invite.inviter_id where id = current_user_id;

  update public.partner_invites
  set used_by = current_user_id, accepted_at = now()
  where id = invite.id;

  update public.partner_invites
  set revoked_at = now()
  where inviter_id = invite.inviter_id
    and id <> invite.id
    and accepted_at is null
    and revoked_at is null;

  return target_couple;
end;
$$;

create or replace function public.revoke_partner_invite(input_invite_id uuid)
returns public.partner_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  revoked_invite public.partner_invites;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  update public.partner_invites
  set revoked_at = now()
  where id = input_invite_id
    and inviter_id = current_user_id
    and accepted_at is null
    and revoked_at is null
  returning * into revoked_invite;

  if not found then
    raise exception 'Invite not found or already inactive.';
  end if;

  return revoked_invite;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text unique,
  partner_id uuid references public.profiles(id),
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_spaces (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete set null,
  anniversary_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couple_spaces_unique_user1 unique (user1_id),
  constraint couple_spaces_unique_user2 unique (user2_id),
  constraint couple_spaces_distinct_users check (user1_id is distinct from user2_id)
);

create table if not exists public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_email text,
  couple_space_id uuid references public.couple_spaces(id) on delete cascade,
  used_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);

alter table public.partner_invites add column if not exists revoked_at timestamptz;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  mood text,
  photo_url text,
  music_url text,
  favorite boolean not null default false,
  pinned boolean not null default false,
  archived boolean not null default false,
  memory_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  url text not null,
  favorite boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  unlock_type text not null default 'manual',
  unlock_date timestamptz,
  opened boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  date date not null,
  type text not null default 'custom',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  mood text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  kind text not null default 'bucket_list',
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.special_pages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'anniversary',
  reveal_label text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  type text not null,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couple_spaces(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_couple_id_idx on public.memories(couple_id, created_at desc);
create index if not exists albums_couple_id_idx on public.albums(couple_id, created_at desc);
create index if not exists photos_album_id_idx on public.photos(album_id, created_at desc);
create index if not exists milestones_couple_id_idx on public.milestones(couple_id, position);
create index if not exists moods_couple_id_idx on public.moods(couple_id, created_at desc);
create index if not exists wishes_couple_id_idx on public.wishes(couple_id, position);
create index if not exists notifications_couple_id_idx on public.notifications(couple_id, created_at desc);
create index if not exists partner_invites_inviter_id_idx on public.partner_invites(inviter_id, created_at desc);
create unique index if not exists partner_invites_one_open_invite_per_inviter_idx on public.partner_invites(inviter_id) where accepted_at is null and revoked_at is null;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger couple_spaces_set_updated_at before update on public.couple_spaces for each row execute procedure public.set_updated_at();
drop trigger if exists couple_spaces_single_membership on public.couple_spaces;
create trigger couple_spaces_single_membership before insert or update on public.couple_spaces for each row execute procedure public.ensure_single_couple_membership();
create trigger memories_set_updated_at before update on public.memories for each row execute procedure public.set_updated_at();
create trigger albums_set_updated_at before update on public.albums for each row execute procedure public.set_updated_at();
create trigger photos_set_updated_at before update on public.photos for each row execute procedure public.set_updated_at();
create trigger letters_set_updated_at before update on public.letters for each row execute procedure public.set_updated_at();
create trigger milestones_set_updated_at before update on public.milestones for each row execute procedure public.set_updated_at();
create trigger moods_set_updated_at before update on public.moods for each row execute procedure public.set_updated_at();
create trigger wishes_set_updated_at before update on public.wishes for each row execute procedure public.set_updated_at();
create trigger special_pages_set_updated_at before update on public.special_pages for each row execute procedure public.set_updated_at();
create trigger shared_notes_set_updated_at before update on public.shared_notes for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.couple_spaces enable row level security;
alter table public.partner_invites enable row level security;
alter table public.memories enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.letters enable row level security;
alter table public.milestones enable row level security;
alter table public.moods enable row level security;
alter table public.wishes enable row level security;
alter table public.special_pages enable row level security;
alter table public.notifications enable row level security;
alter table public.shared_notes enable row level security;

create policy "profiles select self or partner"
on public.profiles for select
using (
  auth.uid() = id
  or auth.uid() = partner_id
  or exists (
    select 1 from public.profiles me
    where me.id = auth.uid()
      and me.partner_id = profiles.id
  )
);

create policy "profiles insert self"
on public.profiles for insert
with check (auth.uid() = id);

create policy "profiles update self"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "couple spaces members only"
on public.couple_spaces for all
using (auth.uid() in (user1_id, user2_id))
with check (auth.uid() in (user1_id, user2_id));

create policy "partner invites inviter or invitee"
on public.partner_invites for select
using (
  auth.uid() = inviter_id
  or auth.uid() = used_by
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.email is not null
      and lower(p.email) = lower(partner_invites.invitee_email)
  )
);

create policy "partner invites insert inviter"
on public.partner_invites for insert
with check (auth.uid() = inviter_id);

create policy "partner invites update inviter or accepted user"
on public.partner_invites for update
using (auth.uid() = inviter_id or auth.uid() = used_by)
with check (auth.uid() = inviter_id or auth.uid() = used_by);

create policy "memories couple members"
on public.memories for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "albums couple members"
on public.albums for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "photos couple members"
on public.photos for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "letters couple members"
on public.letters for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "milestones couple members"
on public.milestones for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "moods couple members"
on public.moods for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "wishes couple members"
on public.wishes for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "special pages couple members"
on public.special_pages for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "notifications couple members"
on public.notifications for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

create policy "notes couple members"
on public.shared_notes for all
using (public.user_can_access_couple(couple_id))
with check (public.user_can_access_couple(couple_id));

grant execute on function public.create_partner_invite(text) to authenticated;
grant execute on function public.accept_partner_invite(text) to authenticated;
grant execute on function public.revoke_partner_invite(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do nothing;

-- Files must be stored under: <couple_id>/...
-- Example: couple-media/<couple_id>/memories/<uuid>-photo.jpg
drop policy if exists "storage authenticated read" on storage.objects;
drop policy if exists "storage authenticated insert" on storage.objects;
drop policy if exists "storage authenticated update" on storage.objects;
drop policy if exists "storage authenticated delete" on storage.objects;

create policy "storage couple members read"
on storage.objects for select
using (
  bucket_id = 'couple-media'
  and public.user_can_access_couple(public.storage_object_couple_id(name))
);

create policy "storage couple members insert"
on storage.objects for insert
with check (
  bucket_id = 'couple-media'
  and public.user_can_access_couple(public.storage_object_couple_id(name))
);

create policy "storage couple members update"
on storage.objects for update
using (
  bucket_id = 'couple-media'
  and public.user_can_access_couple(public.storage_object_couple_id(name))
)
with check (
  bucket_id = 'couple-media'
  and public.user_can_access_couple(public.storage_object_couple_id(name))
);

create policy "storage couple members delete"
on storage.objects for delete
using (
  bucket_id = 'couple-media'
  and public.user_can_access_couple(public.storage_object_couple_id(name))
);