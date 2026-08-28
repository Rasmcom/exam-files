import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "الطريقة غير مسموحة" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const authorization = req.headers.get("Authorization")

  if (!supabaseUrl || !serviceRoleKey || !authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "غير مصرح" }, 401)
  }

  const token = authorization.slice("Bearer ".length)
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData.user

  if (userError || !user) {
    return jsonResponse({ error: "الجلسة غير صالحة" }, 401)
  }

  const { data: owner, error: ownerError } = await admin
    .from("portal_owners")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (ownerError || !owner) {
    return jsonResponse({ error: "هذا الحساب غير مخول لإدارة بيانات الدخول" }, 403)
  }

  let payload: { email?: string }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: "بيانات الطلب غير صالحة" }, 400)
  }

  const email = payload.email?.trim().toLowerCase()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || !emailPattern.test(email)) {
    return jsonResponse({ error: "البريد الإلكتروني غير صالح" }, 400)
  }

  if (user.email?.toLowerCase() === email) {
    return jsonResponse({ error: "البريد الجديد مطابق للبريد الحالي" }, 400)
  }

  const { data: updatedData, error: updateError } = await admin.auth.admin.updateUserById(
    user.id,
    {
      email,
      email_confirm: true,
    },
  )

  if (updateError || !updatedData.user) {
    const duplicate = updateError?.message?.toLowerCase().includes("already")
      || updateError?.message?.toLowerCase().includes("registered")
    return jsonResponse(
      { error: duplicate ? "البريد مستخدم في حساب آخر" : "تعذر تغيير البريد الإلكتروني" },
      duplicate ? 409 : 400,
    )
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ email, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (profileError) {
    console.error("profile email sync failed", profileError)
  }

  return jsonResponse({
    success: true,
    user: {
      id: updatedData.user.id,
      email: updatedData.user.email,
    },
  })
})
