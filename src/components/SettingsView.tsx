import {
  CheckCircle2,
  CloudCog,
  Database,
  FileLock2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../lib/supabase'
import { DEMO_MODE, OWNER_EMAIL, STORAGE_BUCKET } from '../lib/constants'

export function SettingsView({ user }: { user: User }) {
  const email = user.email || OWNER_EMAIL || 'غير محدد'

  return (
    <div className="settings-view">
      <header className="page-title">
        <div>
          <span className="page-title__kicker">إعداد البوابة</span>
          <h1>الإعدادات والأمان</h1>
          <p>مراجعة حالة الاتصال والحساب الوحيد المصرح له ومساحة التخزين.</p>
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
              <span dir="ltr">{email}</span>
            </div>
            <span className="status-badge status-badge--secure">
              <CheckCircle2 size={14} />
              نشط
            </span>
          </div>
          <div className="security-note">
            <LockKeyhole size={18} />
            <p>
              <strong>لا يوجد تسجيل ذاتي</strong>
              <span>يُنشأ الحساب من بيئة الإدارة ولا تظهر أي صفحة لإنشاء مستخدم جديد.</span>
            </p>
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
            <span><i>2</i> مطابقة بريد المالك في الواجهة</span>
            <span><i>3</i> سياسات RLS داخل قاعدة البيانات</span>
            <span><i>4</i> سياسات التخزين حسب مجلد المستخدم</span>
          </div>
        </section>
      </div>
    </div>
  )
}
