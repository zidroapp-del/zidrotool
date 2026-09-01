-- ZidroTool Admin / CMS schema. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.cms_articles (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, excerpt text not null default '', content text not null default '', category text not null default 'general',
  tags text[] not null default '{}', focus_keyword text not null default '', secondary_keywords text[] not null default '{}', seo_title text not null default '', meta_description text not null default '',
  canonical_url text not null default '', cover_image text not null default '', cover_alt text not null default '', status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz, updated_at timestamptz not null default now(), created_at timestamptz not null default now(), author_id uuid references auth.users(id) on delete set null
);
create table if not exists public.cms_tool_overrides (
  slug text primary key, name text, description text, seo_title text, seo_description text, category text, keywords text[] default '{}', tags text[] default '{}', enabled boolean not null default true,
  updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create index if not exists cms_articles_status_idx on public.cms_articles(status);
create index if not exists cms_articles_updated_idx on public.cms_articles(updated_at desc);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid()) or coalesce((auth.jwt()->'app_metadata'->>'role'),'')='admin';
$$;
alter table public.admin_users enable row level security; alter table public.cms_articles enable row level security; alter table public.cms_tool_overrides enable row level security;
drop policy if exists admin_users_self_read on public.admin_users; create policy admin_users_self_read on public.admin_users for select to authenticated using (user_id=auth.uid());
drop policy if exists cms_articles_public_read on public.cms_articles; create policy cms_articles_public_read on public.cms_articles for select to anon,authenticated using (status='published' or public.is_admin());
drop policy if exists cms_articles_admin_write on public.cms_articles; create policy cms_articles_admin_write on public.cms_articles for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists cms_tools_public_read on public.cms_tool_overrides; create policy cms_tools_public_read on public.cms_tool_overrides for select to anon,authenticated using (enabled=true or public.is_admin());
drop policy if exists cms_tools_admin_write on public.cms_tool_overrides; create policy cms_tools_admin_write on public.cms_tool_overrides for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Bootstrap after creating your account: insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');

-- Media bucket for article covers. Create it in Storage if your project disallows SQL bucket creation.
insert into storage.buckets (id, name, public) values ('cms-media','cms-media',true) on conflict (id) do nothing;
drop policy if exists cms_media_public_read on storage.objects;
create policy cms_media_public_read on storage.objects for select to anon,authenticated using (bucket_id='cms-media');
drop policy if exists cms_media_admin_insert on storage.objects;
create policy cms_media_admin_insert on storage.objects for insert to authenticated with check (bucket_id='cms-media' and public.is_admin());
drop policy if exists cms_media_admin_update on storage.objects;
create policy cms_media_admin_update on storage.objects for update to authenticated using (bucket_id='cms-media' and public.is_admin()) with check (bucket_id='cms-media' and public.is_admin());
drop policy if exists cms_media_admin_delete on storage.objects;
create policy cms_media_admin_delete on storage.objects for delete to authenticated using (bucket_id='cms-media' and public.is_admin());
