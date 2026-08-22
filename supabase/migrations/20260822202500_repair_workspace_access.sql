-- إصلاح صلاحيات مساحة العمل بعد الربط والنشر الأولي.
-- يعيد تأكيد صلاحيات authenticated وسياسات RLS للحساب الوحيد، ثم يطلب تحديث مخطط PostgREST.

begin;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.academic_years,
  public.semesters,
  public.workspace_tabs,
  public.folders,
  public.documents
  to authenticated;

grant select on table public.audit_logs to authenticated;

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

alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.workspace_tabs enable row level security;
alter table public.folders enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

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

-- مسار قراءة واحد وآمن لمساحة العمل؛ يفيد أيضًا في التحقق من سلامة الربط.
create or replace function public.get_workspace_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when not public.is_portal_owner() then
      jsonb_build_object('authorized', false)
    else
      jsonb_build_object(
        'authorized', true,
        'years', coalesce((select jsonb_agg(to_jsonb(y) order by y.sort_order) from public.academic_years y where y.user_id = (select auth.uid())), '[]'::jsonb),
        'semesters', coalesce((select jsonb_agg(to_jsonb(s) order by s.sort_order) from public.semesters s where s.user_id = (select auth.uid())), '[]'::jsonb),
        'tabs', coalesce((select jsonb_agg(to_jsonb(t) order by t.sort_order) from public.workspace_tabs t where t.user_id = (select auth.uid())), '[]'::jsonb),
        'folders', coalesce((select jsonb_agg(to_jsonb(f) order by f.sort_order) from public.folders f where f.user_id = (select auth.uid())), '[]'::jsonb),
        'documents', coalesce((select jsonb_agg(to_jsonb(d) order by d.created_at desc) from public.documents d where d.user_id = (select auth.uid())), '[]'::jsonb)
      )
  end;
$$;

revoke all on function public.get_workspace_snapshot() from public;
grant execute on function public.get_workspace_snapshot() to authenticated;

commit;

notify pgrst, 'reload schema';
