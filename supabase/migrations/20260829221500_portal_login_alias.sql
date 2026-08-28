-- بريد دخول مرن للبوابة دون تغيير هوية المستخدم في Supabase Auth.
-- يحفظ البريد الذي يختاره مالك البوابة في profiles.email،
-- ثم يسمح لصفحة الدخول بتحويله داخليًا إلى بريد Auth الحقيقي لنفس user_id.

begin;

create unique index if not exists profiles_email_lower_unique
  on public.profiles (lower(email));

create or replace function public.resolve_portal_login_email(p_email text)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.email
  from public.portal_owners o
  join public.profiles p on p.id = o.user_id
  join auth.users u on u.id = o.user_id
  where lower(trim(p.email)) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.resolve_portal_login_email(text) from public;
grant execute on function public.resolve_portal_login_email(text) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
