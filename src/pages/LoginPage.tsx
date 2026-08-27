import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  FileLock2,
  Fingerprint,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { AnimatedHero } from '../components/AnimatedHero'
import { BrandMark } from '../components/BrandMark'
import { useAuth } from '../contexts/AuthContext'
import { APP_DESCRIPTION, DEMO_MODE, OWNER_EMAIL } from '../lib/constants'

export function LoginPage() {
  const { signIn, authError, configMissing } = useAuth()
  const [email, setEmail] = useState(OWNER_EMAIL)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!DEMO_MODE && (!email.trim() || !password)) return

    setSubmitting(true)
    try {
      await signIn(DEMO_MODE ? 'owner@demo.local' : email, DEMO_MODE ? 'demo' : password)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual__top">
          <BrandMark />
          <span className="security-status">
            <span className="security-status__dot" />
            بوابة خاصة
          </span>
        </div>

        <div className="login-visual__copy">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShieldCheck size={17} />
            حماية وتنظيم في مساحة واحدة
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.08 }}
          >
            كل أعمال الاختبارات،
            <br />
            <span>محفوظة بوضوح وأمان.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.16 }}
          >
            {APP_DESCRIPTION}، مرتبة حسب العام الدراسي والفصل والتبويب، ويمكن الرجوع إليها في أي وقت.
          </motion.p>

          <motion.div
            className="login-feature-row"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.24 }}
          >
            <span><FileLock2 size={18} /> ملفات خاصة</span>
            <span><Fingerprint size={18} /> دخول حصري</span>
            <span><CheckCircle2 size={18} /> أرشفة منظمة</span>
          </motion.div>
        </div>

        <AnimatedHero />

        <footer className="login-visual__footer">
          <span className="login-credit">إعداد الأستاذة <GraduationCap size={16} /> فاطمة ناجي عبدالعزيز</span>
          <span>جميع الحقوق محفوظة</span>
        </footer>
      </section>

      <section className="login-panel">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <div className="login-card__mobile-brand">
            <BrandMark />
          </div>

          <div className="login-card__icon">
            <KeyRound size={25} />
          </div>
          <span className="login-card__kicker">الدخول الآمن</span>
          <h2>مرحبًا بعودتك</h2>
          <p>أدخل بيانات الحساب الوحيد المصرح له للوصول إلى الملفات.</p>

          {configMissing && (
            <div className="config-notice" role="alert">
              <ShieldCheck size={20} />
              <div>
                <strong>يلزم إكمال ربط Supabase</strong>
                <span>الواجهة جاهزة، وتحتاج متغيرات الاتصال لتفعيل تسجيل الدخول.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {!DEMO_MODE && (
              <>
                <label className="field">
                  <span className="field__label">البريد الإلكتروني</span>
                  <span className="field__control">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      autoComplete="username"
                      dir="ltr"
                      required
                    />
                  </span>
                </label>

                <label className="field">
                  <span className="field__label">كلمة المرور</span>
                  <span className="field__control">
                    <LockKeyhole size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      dir="ltr"
                      required
                    />
                    <button
                      type="button"
                      className="field__action"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
              </>
            )}

            {authError && <div className="form-error">{authError}</div>}

            <button
              type="submit"
              className="primary-button primary-button--wide"
              disabled={submitting || configMissing}
            >
              <span>{submitting ? 'جاري التحقق...' : DEMO_MODE ? 'الدخول إلى المعاينة' : 'دخول إلى البوابة'}</span>
              <ArrowLeft size={19} />
            </button>
          </form>

          <div className="login-card__security">
            <span className="login-card__security-icon"><ShieldCheck size={18} /></span>
            <p>
              <strong>وصول مقيّد بالكامل</strong>
              <span>لا يوجد تسجيل مستخدمين جدد، ولا مشاركة عامة للملفات.</span>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
