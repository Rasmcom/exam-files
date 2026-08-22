import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase()
const ownerPassword = process.env.OWNER_PASSWORD
const ownerName = process.env.OWNER_NAME?.trim() || 'مدير البوابة'

function fail(message) {
  console.error(`\nخطأ: ${message}\n`)
  process.exit(1)
}

if (!supabaseUrl || !serviceRoleKey || !ownerEmail || !ownerPassword) {
  fail('أكمل SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY وOWNER_EMAIL وOWNER_PASSWORD داخل ملف .env.owner')
}

if (ownerPassword.length < 12) {
  fail('كلمة المرور يجب ألا تقل عن 12 حرفًا، ويُفضّل أن تجمع حروفًا وأرقامًا ورموزًا.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function findUserByEmail(email) {
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const user = data.users.find((item) => item.email?.toLowerCase() === email)
    if (user) return user
    if (data.users.length < 1000) return null
    page += 1
  }
}

async function main() {
  let user = await findUserByEmail(ownerEmail)

  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    })
    if (error) throw error
    user = data.user
    console.log('تم العثور على الحساب وتحديث بياناته بأمان.')
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    })
    if (error) throw error
    user = data.user
    console.log('تم إنشاء حساب مالك البوابة.')
  }

  const { error: ownerError } = await supabase
    .from('portal_owners')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
  if (ownerError) throw ownerError

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: ownerName,
      email: ownerEmail,
    }, { onConflict: 'id' })
  if (profileError) throw profileError

  console.log('\nاكتمل إعداد الحساب الوحيد للبوابة:')
  console.log(`البريد: ${ownerEmail}`)
  console.log(`معرّف المستخدم: ${user.id}`)
  console.log('\nاحذف ملف .env.owner من جهاز غير موثوق، ولا تضع مفتاح service_role داخل الواجهة أو GitHub.\n')
}

main().catch((error) => fail(error?.message || String(error)))
