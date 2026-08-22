import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Files,
  FolderKanban,
  Heart,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { BrandMark } from './BrandMark'

export type DashboardView = 'home' | 'workspace' | 'favorites' | 'trash' | 'archive' | 'settings'

interface SidebarProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
  onUpload: () => void
  onSignOut: () => void
  open: boolean
  onClose: () => void
  storageLabel: string
  storagePercent: number
}

const primaryItems = [
  { id: 'home' as const, label: 'الرئيسية', icon: Home },
  { id: 'workspace' as const, label: 'ملفاتي', icon: FolderKanban },
  { id: 'favorites' as const, label: 'المفضلة', icon: Heart },
  { id: 'archive' as const, label: 'الأعوام المؤرشفة', icon: Archive },
  { id: 'trash' as const, label: 'سلة المحذوفات', icon: Trash2 },
]

export function Sidebar({
  activeView,
  onViewChange,
  onUpload,
  onSignOut,
  open,
  onClose,
  storageLabel,
  storagePercent,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('exam-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  function selectView(view: DashboardView) {
    onViewChange(view)
    onClose()
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem('exam-sidebar-collapsed', String(next))
      } catch {
        // تجاهل تعذر التخزين المحلي؛ حالة الطي ستبقى فعالة في الجلسة الحالية.
      }
      return next
    })
  }

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay ${open ? 'is-open' : ''}`}
        aria-label="إغلاق القائمة"
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}>
        <div className="sidebar__head">
          <BrandMark compact />
          <div className="sidebar__head-actions">
            <button
              className="sidebar__collapse icon-button icon-button--dark"
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
            >
              {collapsed ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
            </button>
            <button className="sidebar__close icon-button icon-button--dark" type="button" onClick={onClose}>
              <X size={19} />
            </button>
          </div>
        </div>

        <button type="button" className="sidebar-upload" onClick={onUpload} title={collapsed ? 'رفع ملفات' : undefined}>
          <span className="sidebar-upload__icon"><UploadCloud size={21} /></span>
          <span className="sidebar-upload__copy">
            <strong>رفع ملفات</strong>
            <small>أضف أعمالًا جديدة</small>
          </span>
        </button>

        <nav className="sidebar-nav" aria-label="التنقل الرئيسي">
          <span className="sidebar-nav__label">مساحة العمل</span>
          {primaryItems.map((item) => {
            const Icon = item.icon
            const active = item.id === activeView
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav__item ${active ? 'is-active' : ''}`}
                onClick={() => selectView(item.id)}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <motion.span
                    className="sidebar-nav__active"
                    layoutId="sidebar-active"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={19} />
                <span className="sidebar-nav__text">{item.label}</span>
              </button>
            )
          })}

          <span className="sidebar-nav__label sidebar-nav__label--settings">النظام</span>
          <button
            type="button"
            className={`sidebar-nav__item ${activeView === 'settings' ? 'is-active' : ''}`}
            onClick={() => selectView('settings')}
            title={collapsed ? 'الإعدادات' : undefined}
          >
            {activeView === 'settings' && <motion.span className="sidebar-nav__active" layoutId="sidebar-active" />}
            <Settings size={19} />
            <span className="sidebar-nav__text">الإعدادات</span>
          </button>
        </nav>

        <div className="sidebar-storage" title={collapsed ? `مساحة التخزين: ${storagePercent}%` : undefined}>
          <div className="sidebar-storage__head">
            <span><Cloud size={17} /><span className="sidebar-storage__label"> مساحة التخزين</span></span>
            <strong>{storagePercent}%</strong>
          </div>
          <div className="sidebar-storage__track">
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(storagePercent, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <small>{storageLabel} مستخدمة من 5 ج.ب</small>
        </div>

        <div className="sidebar__security" title={collapsed ? 'الحماية مفعّلة' : undefined}>
          <span><ShieldCheck size={17} /></span>
          <p>
            <strong>الحماية مفعّلة</strong>
            <small>التخزين خاص والروابط مؤقتة</small>
          </p>
        </div>

        <button type="button" className="sidebar-logout" onClick={onSignOut} title={collapsed ? 'تسجيل الخروج' : undefined}>
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>

        <div className="sidebar__watermark">
          <Files size={13} />
          <span>الإصدار 1.0</span>
        </div>
      </aside>
    </>
  )
}
