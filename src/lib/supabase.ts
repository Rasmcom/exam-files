import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

// توجيه تغيير البريد فقط إلى وظيفة إدارية آمنة داخل Supabase.
// تبقى تغييرات كلمة المرور وباقي خصائص المستخدم على المسار الأصلي.
const originalUpdateUser = supabase.auth.updateUser.bind(supabase.auth)

;(supabase.auth as typeof supabase.auth & { updateUser: typeof supabase.auth.updateUser }).updateUser = (async (
  attributes: Parameters<typeof originalUpdateUser>[0],
  options?: Parameters<typeof originalUpdateUser>[1],
) => {
  if (!attributes.email) {
    return originalUpdateUser(attributes, options)
  }

  const normalizedEmail = attributes.email.trim().toLowerCase()
  const { data, error } = await supabase.functions.invoke('update-owner-email', {
    body: { email: normalizedEmail },
  })

  if (error) {
    return {
      data: { user: null },
      error,
    }
  }

  // نحاول إصدار جلسة جديدة حتى ينعكس البريد فورًا في كامل الواجهة.
  // إذا تأخر تحديث الجلسة لا نعتبر تغيير البريد فاشلًا لأن التغيير الإداري تم بالفعل.
  const { data: refreshed } = await supabase.auth.refreshSession()

  return {
    data: { user: refreshed.user ?? data?.user ?? null },
    error: null,
  }
}) as typeof supabase.auth.updateUser
