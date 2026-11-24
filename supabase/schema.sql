-- =====================================================================
-- TextScope: skema database untuk login dan role (Admin / Pengguna)
-- Jalankan SEKALI di Supabase: Dashboard → SQL Editor → New query →
-- tempel seluruh isi file ini → Run.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. PROFIL PENGGUNA
--    Satu baris per akun. Role default "pengguna"; admin diatur admin lain
--    (atau manual lewat SQL Editor untuk admin pertama, lihat bagian bawah).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'pengguna' check (role in ('admin', 'pengguna')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Profil dibuat otomatis saat seseorang mendaftar.
-- Role SELALU "pengguna", apa pun yang dikirim dari form daftar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fungsi bantu: apakah yang sedang login adalah admin aktif?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

-- Fungsi bantu: apakah akun yang sedang login masih aktif?
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- Penjaga perubahan profil:
--  * pengguna biasa hanya boleh mengubah nama, bukan role/status/email;
--  * admin terakhir tidak boleh diturunkan atau dinonaktifkan,
--    supaya sistem tidak pernah kehilangan admin.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() kosong = dijalankan dari SQL Editor / service role: boleh semua.
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  new.email := old.email;
  new.id := old.id;
  new.created_at := old.created_at;
  new.full_name := left(trim(new.full_name), 80);

  if old.role = 'admin' and old.is_active
     and (new.role <> 'admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles
       where role = 'admin' and is_active and id <> old.id
     ) then
    raise exception 'Minimal harus ada satu admin aktif.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;

drop policy if exists "profil: lihat milik sendiri atau admin" on public.profiles;
create policy "profil: lihat milik sendiri atau admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profil: ubah milik sendiri atau admin" on public.profiles;
create policy "profil: ubah milik sendiri atau admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 2. RIWAYAT ANALISIS
--    Disimpan setiap kali pengguna menganalisis file.
--    Kolom "result" berisi hasil lengkap supaya bisa dibuka lagi.
-- ---------------------------------------------------------------------
create table if not exists public.analyses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  file_name         text not null default '',
  total_texts       integer not null default 0,
  dominant_emotion  text,
  avg_confidence    real,
  censored_count    integer not null default 0,
  privacy_shield    boolean not null default true,
  distribution      jsonb not null default '[]'::jsonb,
  result            jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);
create index if not exists analyses_created_idx on public.analyses (created_at desc);

alter table public.analyses enable row level security;

drop policy if exists "analisis: lihat milik sendiri atau admin" on public.analyses;
create policy "analisis: lihat milik sendiri atau admin" on public.analyses
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "analisis: simpan milik sendiri" on public.analyses;
create policy "analisis: simpan milik sendiri" on public.analyses
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "analisis: hapus milik sendiri" on public.analyses;
create policy "analisis: hapus milik sendiri" on public.analyses
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. LAPORAN PREDIKSI SALAH
--    Pengguna menandai komentar yang emosinya salah; admin meninjau.
--    Laporan yang diterima bisa diunduh admin sebagai data latih tambahan.
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  analysis_id        uuid references public.analyses (id) on delete set null,
  source             text not null default 'file' check (source in ('file', 'teks')),
  text               text not null check (char_length(text) between 1 and 2000),
  predicted_emotion  text not null,
  correct_emotion    text not null check (correct_emotion in ('anger', 'fear', 'joy', 'love', 'sad', 'neutral')),
  confidence         real,
  note               text not null default '' check (char_length(note) <= 300),
  status             text not null default 'menunggu' check (status in ('menunggu', 'diterima', 'ditolak')),
  reviewed_by        uuid references public.profiles (id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  check (correct_emotion <> predicted_emotion)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);

-- Catat siapa dan kapan laporan ditinjau; pengguna tidak bisa mengubah isi laporan.
create or replace function public.guard_report_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.id := old.id;
  new.user_id := old.user_id;
  new.analysis_id := old.analysis_id;
  new.source := old.source;
  new.text := old.text;
  new.predicted_emotion := old.predicted_emotion;
  new.correct_emotion := old.correct_emotion;
  new.confidence := old.confidence;
  new.note := old.note;
  new.created_at := old.created_at;
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := case when new.status = 'menunggu' then null else now() end;
  else
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_report_update on public.reports;
create trigger guard_report_update
  before update on public.reports
  for each row execute function public.guard_report_update();

alter table public.reports enable row level security;

drop policy if exists "laporan: lihat milik sendiri atau admin" on public.reports;
create policy "laporan: lihat milik sendiri atau admin" on public.reports
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "laporan: kirim milik sendiri" on public.reports;
create policy "laporan: kirim milik sendiri" on public.reports
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'menunggu'
    and reviewed_by is null
    and public.is_active_user()
  );

drop policy if exists "laporan: ditinjau admin" on public.reports;
create policy "laporan: ditinjau admin" on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "laporan: hapus milik sendiri yang belum ditinjau atau admin" on public.reports;
create policy "laporan: hapus milik sendiri yang belum ditinjau atau admin" on public.reports
  for delete to authenticated
  using ((user_id = auth.uid() and status = 'menunggu') or public.is_admin());

-- ---------------------------------------------------------------------
-- 4. FUNGSI KHUSUS ADMIN
-- ---------------------------------------------------------------------

-- Ringkasan untuk Dashboard Admin. Waktu dihitung dalam WIB.
create or replace function public.admin_stats(days integer default 14)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  since date := (now() at time zone 'Asia/Jakarta')::date - (greatest(days, 1) - 1);
  out jsonb;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh melihat statistik.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_users',      (select count(*) from profiles),
    'active_users',     (select count(*) from profiles where is_active),
    'admin_count',      (select count(*) from profiles where role = 'admin' and is_active),
    'new_users_period', (select count(*) from profiles where (created_at at time zone 'Asia/Jakarta')::date >= since),
    'total_analyses',   (select count(*) from analyses),
    'total_comments',   (select coalesce(sum(total_texts), 0) from analyses),
    'avg_confidence',   (
      select case when sum(total_texts) > 0
        then sum(avg_confidence * total_texts) / sum(total_texts) end
      from analyses where avg_confidence is not null
    ),
    'pending_reports',  (select count(*) from reports where status = 'menunggu'),
    'emotions', coalesce((
      select jsonb_object_agg(emotion, total)
      from (
        select d ->> 'emotion' as emotion, sum((d ->> 'count')::int) as total
        from analyses a, jsonb_array_elements(a.distribution) d
        group by 1
      ) e
    ), '{}'::jsonb),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'date', g.day::date,
        'analyses', coalesce(n.analyses, 0),
        'comments', coalesce(n.comments, 0),
        'users', coalesce(n.users, 0)
      ) order by g.day)
      from generate_series(since, (now() at time zone 'Asia/Jakarta')::date, interval '1 day') as g(day)
      left join (
        select (created_at at time zone 'Asia/Jakarta')::date as d,
               count(*) as analyses,
               sum(total_texts) as comments,
               count(distinct user_id) as users
        from analyses
        group by 1
      ) n on n.d = g.day::date
    )
  ) into out;
  return out;
end;
$$;

-- Daftar pengguna untuk halaman Kelola Pengguna (dengan jumlah analisis).
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  is_active boolean,
  created_at timestamptz,
  analyses_count bigint,
  comments_count bigint,
  last_analysis_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh melihat daftar pengguna.' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.full_name, p.role, p.is_active, p.created_at,
           count(a.id), coalesce(sum(a.total_texts), 0)::bigint, max(a.created_at)
    from profiles p
    left join analyses a on a.user_id = p.id
    group by p.id
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_stats(integer) from public, anon;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_stats(integer) to authenticated;
grant execute on function public.admin_list_users() to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.analyses to authenticated;
grant select, insert, update, delete on public.reports to authenticated;

-- =====================================================================
-- ADMIN PERTAMA
-- 1) Daftar dulu lewat halaman "Masuk / Daftar" di TextScope.
-- 2) Jalankan baris di bawah ini di SQL Editor (ganti emailnya):
--
--    update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';
--
-- Setelah itu admin lain cukup diatur dari menu "Kelola Pengguna".
-- =====================================================================
