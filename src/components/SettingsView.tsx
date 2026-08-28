import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CheckCircle2,
  CloudCog,
  Database,
  Eye,
  EyeOff,
  FileLock2,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { DEMO_MODE, STORAGE_BUCKET } from '../lib/constants'

export function SettingsView({ user }: { user: User }) {
  const [portalEmail, setPortalEmail] = useState(user.email || 'غير محدد')
  const [newEmail, setNewEmail] = useState('')
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState('')
  const [showCurrentEmailPassword, setShowCurrentEmailPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  useEffect(() => {
    if (DEMO_MODE) {
      setPortalEmail(user.email || 'غير محدد')
      return
    }

    let mounted = true

    void supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return
        setPortalEmail(data?.email || user.email || 'غير محدد')
      })

    return () => {
      mounted = false
    }
  }, [user.email, user.id])

  async function verifyCurrentPassword(password: string) {
    if (!user.email || !password) return false
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })
    return !error
  }

  async function handleEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (DEMO_MODE || !isSupabaseConfigured) return

    const normalizedEmail = newEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error('أدخل البريد الإلكتروني الجديد')
      return
    }
    if (normalizedEmail === portalEmail.toLowerCase()) {
      toast.error('البريد الجديد مطابق لبريد الدخول الحالي')
      return
    }
    if (!currentPasswordForEmail) {
      toast.error('أدخل كلمة المرور الحالية لتأكيد التغيير')
      return
    }

    setEmailSubmitting(true)
    try {
      const verified = await verifyCurrentPassword(currentPasswordForEmail)
      if (!verified) {
        toast.error('كلمة المرور الحالية غير صحيحة')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          email: normalizedEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        toast.error(error.code === '23505' ? 'هذا البريد مستخدم مسبقًا' : 'تعذر حفظ بريد الدخول الجديد')
        return
      }

      setPortalEmail(normalizedEmail)
      setNewEmail('')
      setCurrentPasswordForEmail('')
      toast.success('تم تغيير بريد الدخول وحفظه بنجاح')
    } finally {
      setEmailSubmitting(false)
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (DEMO_MODE || !isSupabaseConfigured) return

    if (!currentPasswordForPassword) {
      toast.error('أدخل كلمة المرور الحالية')
      return
    }
    if (newPassword.length < 12) {
      toast.error('كلمة المرور الجديدة يجب ألا تقل عن 12 حرفًا')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('تأكيد كلمة المرور غير مطابق')
      return
    }
    if (newPassword === currentPasswordForPassword) {
      toast.error('اختر كلمة مرور جديدة مختلفة عن الحالية')
      return
    }

    setPasswordSubmitting(true)
    try {
      const verified = await verifyCurrentPassword(currentPasswordForPassword)
      if (!verified) {
        toast.error('كلمة المرور الحالية غير صحيحة')
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error('تعذر تغيير كلمة المرور')
        return
      }

      setCurrentPasswordForPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('تم تغيير كلمة المرور بنجاح')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="settings-view">
      <header className="page-title">
        <div>
          <span className="page-title__kicker">إعداد البوابة</span>
          <h1>الإعدادات والأمان</h1>
          <p>إدارة الحساب الوحيد المصرح له ومراجعة حالة الاتصال والحماية.</p>
        </div>
        <span className="page-title__symbol"><ShieldCheck size={27} /></span>
      </header>

      <div className="settings-grid">
        <section className="settings-card settings-card--profile">
          <header>
            <span><UserRoundCheck size={21} /></span>
            <div>
              <h2>الحساب المصرح</h2>
              <p>الوصول مقصور على هذا الحساب فقط</p>
            </div>
          </header>
          <div className="owner-profile">
            <span className="owner-profile__avatar">م</span>
            <div>
              <strong>{String(user.user_metadata?.full_name || 'مدير البوابة')}</strong>
              <span dir="ltr">{portalEmail}</span>
            </div>
            <span className="status-badge status-badge--secure">
              <CheckCircle2 size={14} />
              نشط
            </span>
          </div>
          <div className="security-note">
            <LockKeyhole size={18} />
            <p>
              <strong>حساب واحد فقط</strong>
              <span>الصلاحية مرتبطة بمعرف الحساب، ويمكن تغيير بريد الدخول دون فقد الملفات أو الصلاحيات.</span>
            </p>
          </div>
        </section>

        <section className="settings-card settings-card--credentials">
          <header>
            <span><KeyRound size={21} /></span>
            <div>
              <h2>بيانات الدخول</h2>
              <p>تغيير بريد الدخول أو كلمة المرور بطريقة آمنة</p>
            </div>
          </header>

          <div className="credentials-current">
            <span>بريد الدخول الحالي</span>
            <strong dir="ltr">{portalEmail}</strong>
          </div>

          <div className="credentials-columns">
            <form className="credentials-form" onSubmit={handleEmailChange}>
              <div className="credentials-form__title">
                <Mail size={18} />
                <div>
                  <strong>تغيير بريد الدخول</strong>
                  <small>يُحفظ مباشرة في قاعدة البيانات ويُستخدم في الدخول بعد تسجيل الخروج.</small>
                </div>
              </div>

              <label className="field">
                <span className="field__label">البريد الإلكتروني الجديد</span>
                <span className="field__control">
                  <Mail size={18} />
                  <input
                    type="email"
                    dir="ltr"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    placeholder="new@example.com"
                    autoComplete="email"
                    disabled={emailSubmitting || DEMO_MODE}
                  />
                </span>
              </label>

              <label className="field">
                <span className="field__label">كلمة المرور الحالية للتأكيد</span>
                <span className="field__control">
                  <LockKeyhole size={18} />
                  <input
                    type={showCurrentEmailPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={currentPasswordForEmail}
                    onChange={(event) => setCurrentPasswordForEmail(event.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    disabled={emailSubmitting || DEMO_MODE}
                  />
                  <button
                    type="button"
                    className="field__action"
                    onClick={() => setShowCurrentEmailPassword((current) => !current)}
                    aria-label={showCurrentEmailPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showCurrentEmailPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <button className="primary-button" type="submit" disabled={emailSubmitting || DEMO_MODE}>
                <Save size={17} />
                {emailSubmitting ? 'جاري التحقق...' : 'حفظ بريد الدخول'}
              </button>
            </form>

            <form className="credentials-form" onSubmit={handlePasswordChange}>
              <div className="credentials-form__title">
                <LockKeyhole size={18} />
                <div>
                  <strong>تغيير كلمة المرور</strong>
                  <small>استخدم 12 حرفًا على الأقل، ويفضل مزج الحروف والأرقام والرموز.</small>
                </div>
              </div>

              <label className="field">
                <span className="field__label">كلمة المرور الحالية</span>
                <span className="field__control">
                  <KeyRound size={18} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={currentPasswordForPassword}
                    onChange={(event) => setCurrentPasswordForPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    disabled={passwordSubmitting || DEMO_MODE}
                  />
                  <button
                    type="button"
                    className="field__action"
                    onClick={() => setShowCurrentPassword((current) => !current)}
                    aria-label={showCurrentPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <label className="field">
                <span className="field__label">كلمة المرور الجديدة</span>
                <span className="field__control">
                  <LockKeyhole size={18} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="12 حرفًا على الأقل"
                    disabled={passwordSubmitting || DEMO_MODE}
                  />
                  <button
                    type="button"
                    className="field__action"
                    onClick={() => setShowNewPassword((current) => !current)}
                    aria-label={showNewPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <label className="field">
                <span className="field__label">تأكيد كلمة المرور الجديدة</span>
                <span className="field__control">
                  <CheckCircle2 size={18} />
                  <input
                    type="password"
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="أعد كتابة كلمة المرور"
                    disabled={passwordSubmitting || DEMO_MODE}
                  />
                </span>
              </label>

              <button className="primary-button" type="submit" disabled={passwordSubmitting || DEMO_MODE}>
                <Save size={17} />
                {passwordSubmitting ? 'جاري التحقق...' : 'تحديث كلمة المرور'}
              </button>
            </form>
          </div>
        </section>

        <section className="settings-card">
          <header>
            <span><Database size={21} /></span>
            <div>
              <h2>قاعدة البيانات</h2>
              <p>حالة الاتصال بخدمة Supabase</p>
            </div>
          </header>
          <div className="settings-status-row">
            <span className={`connection-dot ${isSupabaseConfigured ? 'is-connected' : ''}`} />
            <div>
              <strong>{isSupabaseConfigured ? 'متصل بقاعدة البيانات' : DEMO_MODE ? 'وضع المعاينة التجريبية' : 'بانتظار بيانات الاتصال'}</strong>
              <small>{isSupabaseConfigured ? 'الجداول وسياسات RLS جاهزة للعمل' : 'أضف متغيرات البيئة لتفعيل البيانات الحقيقية'}</small>
            </div>
          </div>
          <ul className="settings-checks">
            <li><CheckCircle2 size={16} /> عزل البيانات حسب معرف المستخدم</li>
            <li><CheckCircle2 size={16} /> سجل عمليات الرفع والحذف والاستعادة</li>
            <li><CheckCircle2 size={16} /> تحديث تلقائي لتواريخ السجلات</li>
          </ul>
        </section>

        <section className="settings-card">
          <header>
            <span><CloudCog size={21} /></span>
            <div>
              <h2>التخزين السحابي</h2>
              <p>حاوية خاصة للوثائق</p>
            </div>
          </header>
          <div className="settings-value">
            <span>اسم الحاوية</span>
            <strong dir="ltr">{STORAGE_BUCKET}</strong>
          </div>
          <ul className="settings-checks">
            <li><FileLock2 size={16} /> الحاوية غير عامة</li>
            <li><KeyRound size={16} /> روابط تنزيل مؤقتة</li>
            <li><ShieldCheck size={16} /> التحقق من الامتداد والحجم</li>
          </ul>
        </section>

        <section className="settings-card">
          <header>
            <span><ShieldCheck size={21} /></span>
            <div>
              <h2>سياسة الحماية</h2>
              <p>طبقات الوصول المفعلة</p>
            </div>
          </header>
          <div className="security-layers">
            <span><i>1</i> مصادقة البريد وكلمة المرور</span>
            <span><i>2</i> التحقق من مالك البوابة في قاعدة البيانات</span>
            <span><i>3</i> سياسات RLS داخل قاعدة البيانات</span>
            <span><i>4</i> سياسات التخزين حسب مجلد المستخدم</span>
          </div>
        </section>
      </div>
    </div>
  )
}
