-- إصلاح آمن لمسار رفع الملفات في سحابة أعمال الاختبارات.
-- لا يحذف أي ملفات موجودة، ويعيد فقط تثبيت إعداد الحاوية وسياسات RLS.

begin;

-- تأكيد أن دالة التحقق من مالك البوابة متاحة للمستخدم الموثق.
grant execute on function public.is_portal_owner() to authenticated;

-- إنشاء/تحديث الحاوية الخاصة مع السماح بصيغ الوثائق المستخدمة في المنصة.
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

-- القراءة مطلوبة كذلك لأن Storage يعيد السجل بعد عملية INSERT.
drop policy if exists exam_files_owner_select on storage.objects;
create policy exam_files_owner_select
on storage.objects for select to authenticated
using (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- السماح للمالك الوحيد بالرفع داخل مجلده فقط.
drop policy if exists exam_files_owner_insert on storage.objects;
create policy exam_files_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- السماح بتحديث كائناته فقط.
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

-- السماح بالحذف عند تنظيف ملف فشل حفظ بياناته أو عند الحذف النهائي مستقبلًا.
drop policy if exists exam_files_owner_delete on storage.objects;
create policy exam_files_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'exam-files'
  and public.is_portal_owner()
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;
