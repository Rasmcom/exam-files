-- سحابة أعمال الاختبارات — المخطط الأولي الآمن
-- شغّل هذا الملف مرة واحدة داخل Supabase SQL Editor أو عبر Supabase CLI.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- الوظائف المساعدة
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- لا يملك البوابة إلا المستخدم المسجل هنا بواسطة سكربت create-owner.
create table if not exists public.portal_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- قيد قاعدة بيانات فعلي يضمن وجود مالك واحد كحد أقصى، وليس مجرد قيد في الواجهة.
create unique index if not exists portal_owners_single_account
  on public.portal_owners ((true));

alter table public.portal_owners enable row level security;
revoke all on table public.portal_owners from anon, authenticated;

create or replace function public.is_portal_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.portal_owners
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portal_owner() from public;
grant execute on function public.is_portal_owner() to authenticated;

-- ---------------------------------------------------------------------------
-- الجداول
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'مدير البوابة',
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 2 and 60),
  sort_order integer not null default 1 check (sort_order > 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, label)
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

create table if not exists public.workspace_tabs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  icon text not null default 'FolderKanban',
  accent text not null default 'violet' check (accent in ('violet', 'blue', 'amber', 'rose', 'cyan')),
  sort_order integer not null default 1 check (sort_order > 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (semester_id, name)
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tab_id uuid not null references public.workspace_tabs(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  sort_order integer not null default 1 check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create unique index if not exists folders_unique_name_per_parent
  on public.folders (tab_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  tab_id uuid not null references public.workspace_tabs(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  original_name text not null check (char_length(original_name) between 1 and 255),
  display_name text not null check (char_length(display_name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  extension text not null check (
    lower(extension) in (
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'webp', 'txt', 'csv', 'zip'
    )
  ),
  size_bytes bigint not null check (size_bytes >= 0 and size_bytes <= 52428800),
  status text not null default 'ready' check (status in ('ready', 'uploading', 'quarantined', 'failed')),
  description text,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_deleted = false and deleted_at is null)
    or (is_deleted = true and deleted_at is not null)
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  document_id uuid references public.documents(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- الفهارس
-- ---------------------------------------------------------------------------

create index if not exists academic_years_user_idx on public.academic_years(user_id, sort_order);
create index if not exists semesters_user_year_idx on public.semesters(user_id, academic_year_id, sort_order);
create index if not exists tabs_user_semester_idx on public.workspace_tabs(user_id, semester_id, sort_order);
create index if not exists folders_user_tab_idx on public.folders(user_id, tab_id, parent_id, sort_order);
create index if not exists documents_user_location_idx on public.documents(user_id, academic_year_id, semester_id, tab_id);
create index if not exists documents_user_created_idx on public.documents(user_id, created_at desc);
create index if not exists documents_user_favorite_idx on public.documents(user_id, is_favorite) where is_favorite = true and is_deleted = false;
create index if not exists documents_user_deleted_idx on public.documents(user_id, deleted_at desc) where is_deleted = true;
create index if not exists audit_logs_user_created_idx on public.audit_logs(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists academic_years_set_updated_at on public.academic_years;
create trigger academic_years_set_updated_at before update on public.academic_years
for each row execute function public.set_updated_at();

drop trigger if exists semesters_set_updated_at on public.semesters;
create trigger semesters_set_updated_at before update on public.semesters
for each row execute function public.set_updated_at();

drop trigger if exists workspace_tabs_set_updated_at on public.workspace_tabs;
create trigger workspace_tabs_set_updated_at before update on public.workspace_tabs
for each row execute function public.set_updated_at();

drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at before update on public.folders
for each row execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at before update on public.documents
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: الحساب الوحيد المسجل في portal_owners فقط
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.workspace_tabs enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

-- منع أي وصول افتراضي ثم منح ما يلزم فقط للمستخدم الموثق.
revoke all on table public.profiles, public.academic_years, public.semesters,
  public.workspace_tabs, public.folders, public.documents, public.audit_logs from anon;

grant select, insert, update, delete on table public.profiles, public.academic_years,
  public.semesters, public.workspace_tabs, public.folders, public.documents to authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
for all to authenticated
using (public.is_portal_owner() and id = (select auth.uid()))
with check (public.is_portal_owner() and id = (select auth.uid()));

drop policy if exists academic_years_owner_all on public.academic_years;
create policy academic_years_owner_all on public.academic_years
for all to authenticated
using (public.is_portal_owner() and user_id = (select auth.uid()))
with check (public.is_portal_owner() and user_id = (select auth.uid()));

drop policy if exists semesters_owner_all on public.semesters;
create policy semesters_owner_all on public.semesters
for all to authenticated
using (public.is_portal_owner() and user_id = (select auth.uid()))
with check (public.is_portal_owner() and user_id = (select auth.uid()));

drop policy if exists workspace_tabs_owner_all on public.workspace_tabs;
create policy workspace_tabs_owner_all on public.workspace_tabs
for all to authenticated
using (public.is_portal_owner() and user_id = (select auth.uid()))
with check (public.is_portal_owner() and user_id = (select auth.uid()));

drop policy if exists folders_owner_all on public.folders;
create policy folders_owner_all on public.folders
for all to authenticated
using (public.is_portal_owner() and user_id = (select auth.uid()))
with check (public.is_portal_owner() and user_id = (select auth.uid()));

drop policy if exists documents_owner_all on public.documents;
create policy documents_owner_all on public.documents
for all to authenticated
using (public.is_portal_owner() and user_id = (select auth.uid()))
with check (public.is_portal_owner() and user_id = (select auth.uid()));

drop policy if exists audit_logs_owner_select on public.audit_logs;
create policy audit_logs_owner_select on public.audit_logs
for select to authenticated
using (public.is_portal_owner() and user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- إنشاء عام دراسي كامل بفصلين وتبويبات افتراضية
-- ---------------------------------------------------------------------------

create or replace function public.create_academic_year_workspace(p_label text)
returns public.academic_years
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_year public.academic_years;
  v_semester_id uuid;
  v_semester_no integer;
  v_tab_no integer;
  v_tab_names text[] := array[
    'التعاميم المنظمة',
    'تشكيل اللجان',
    'اجتماعات الاختبارات',
    'جداول الاختبارات',
    'أسئلة الاختبارات',
    'نماذج الإجابة',
    'أعمال الرصد والمراجعة',
    'محاضر اللجان',
    'تقارير الاختبارات'
  ];
  v_tab_descriptions text[] := array[
    'التعاميم والتعليمات المرتبطة بأعمال الاختبارات',
    'قرارات تشكيل اللجان وتوزيع المهام',
    'المحاضر والتوصيات التنظيمية',
    'جداول الطلاب واللجان والملاحظين',
    'نماذج الأسئلة وملفات الاختبارات',
    'نماذج الإجابة وسلالم التصحيح',
    'كشوف الرصد والمراجعة والتدقيق',
    'محاضر اللجان والإقفال والتسليم',
    'التقارير الختامية والشواهد'
  ];
  v_accents text[] := array['violet', 'blue', 'amber', 'rose', 'cyan'];
begin
  if v_user_id is null or not public.is_portal_owner() then
    raise exception 'غير مصرح بإنشاء مساحة عمل' using errcode = '42501';
  end if;

  if nullif(trim(p_label), '') is null then
    raise exception 'اسم العام الدراسي مطلوب' using errcode = '22023';
  end if;

  insert into public.academic_years (user_id, label, sort_order)
  values (
    v_user_id,
    trim(p_label),
    coalesce((select max(sort_order) + 1 from public.academic_years where user_id = v_user_id), 1)
  )
  returning * into v_year;

  for v_semester_no in 1..2 loop
    insert into public.semesters (user_id, academic_year_id, name, sort_order)
    values (
      v_user_id,
      v_year.id,
      case v_semester_no
        when 1 then 'الفصل الدراسي الأول'
        else 'الفصل الدراسي الثاني'
      end,
      v_semester_no
    )
    returning id into v_semester_id;

    for v_tab_no in 1..array_length(v_tab_names, 1) loop
      insert into public.workspace_tabs (
        user_id,
        semester_id,
        name,
        description,
        icon,
        accent,
        sort_order
      )
      values (
        v_user_id,
        v_semester_id,
        v_tab_names[v_tab_no],
        v_tab_descriptions[v_tab_no],
        'FolderKanban',
        v_accents[((v_tab_no - 1) % array_length(v_accents, 1)) + 1],
        v_tab_no
      );
    end loop;
  end loop;

  return v_year;
end;
$$;

revoke all on function public.create_academic_year_workspace(text) from public;
grant execute on function public.create_academic_year_workspace(text) to authenticated;

-- ---------------------------------------------------------------------------
-- سجل النشاط
-- ---------------------------------------------------------------------------

create or replace function public.log_document_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (user_id, action, document_id, metadata)
    values (
      new.user_id,
      'document_uploaded',
      new.id,
      jsonb_build_object('name', new.display_name, 'size_bytes', new.size_bytes)
    );
  elsif tg_op = 'UPDATE' then
    if old.is_deleted is distinct from new.is_deleted then
      insert into public.audit_logs (user_id, action, document_id, metadata)
      values (
        new.user_id,
        case when new.is_deleted then 'document_trashed' else 'document_restored' end,
        new.id,
        jsonb_build_object('name', new.display_name)
      );
    end if;

    if old.is_favorite is distinct from new.is_favorite then
      insert into public.audit_logs (user_id, action, document_id, metadata)
      values (
        new.user_id,
        case when new.is_favorite then 'document_favorited' else 'document_unfavorited' end,
        new.id,
        jsonb_build_object('name', new.display_name)
      );
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.log_document_change() from public;

drop trigger if exists documents_audit_trigger on public.documents;
create trigger documents_audit_trigger
after insert or update on public.documents
for each row execute function public.log_document_change();

create or replace function public.log_document_download(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document public.documents;
begin
  if not public.is_portal_owner() then
    raise exception 'غير مصرح' using errcode = '42501';
  end if;

  select * into v_document
  from public.documents
  where id = p_document_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'الملف غير موجود' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (user_id, action, document_id, metadata)
  values (v_document.user_id, 'document_downloaded', v_document.id, jsonb_build_object('name', v_document.display_name));
end;
$$;

revoke all on function public.log_document_download(uuid) from public;
grant execute on function public.log_document_download(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- التخزين الخاص
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'exam-files',
  'exam-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists exam_files_owner_select on storage.objects;
create policy exam_files_owner_select
on storage.objects for select to authenticated
using (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists exam_files_owner_insert on storage.objects;
create policy exam_files_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists exam_files_owner_update on storage.objects;
create policy exam_files_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists exam_files_owner_delete on storage.objects;
create policy exam_files_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;
