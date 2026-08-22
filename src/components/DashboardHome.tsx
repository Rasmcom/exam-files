import { motion } from 'framer-motion'
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  CloudUpload,
  FileCheck2,
  FileText,
  FolderKanban,
  HardDrive,
  Heart,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type {
  AcademicYear,
  DocumentRecord,
  Semester,
  WorkspaceTab,
} from '../types/database'
import { formatFileSize, formatRelativeDate } from '../lib/format'
import { FileTypeIcon } from './FileTypeIcon'

interface DashboardHomeProps {
  user: User
  selectedYear: AcademicYear | undefined
  selectedSemester: Semester | undefined
  tabs: WorkspaceTab[]
  documents: DocumentRecord[]
  stats: {
    documents: number
    favorites: number
    storageBytes: number
    years: number
    deleted: number
  }
  onUpload: () => void
  onCreateYear: () => void
  onOpenWorkspace: () => void
  onOpenTab: (tabId: string) => void
}

const tabIcons = [FolderKanban, FileText, FileCheck2, Archive]

export function DashboardHome({
  user,
  selectedYear,
  selectedSemester,
  tabs,
  documents,
  stats,
  onUpload,
  onCreateYear,
  onOpenWorkspace,
  onOpenTab,
}: DashboardHomeProps) {
  const firstName = String(user.user_metadata?.full_name || 'مدير البوابة').split(' ')[0]
  const activeDocuments = documents.filter((document) => !document.is_deleted)
  const recent = [...activeDocuments]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)

  const statsCards = [
    {
      label: 'إجمالي الملفات',
      value: stats.documents.toLocaleString('ar-SA'),
      helper: 'ملف محفوظ بأمان',
      icon: FileCheck2,
      tone: 'violet',
    },
    {
      label: 'مساحة التخزين',
      value: formatFileSize(stats.storageBytes),
      helper: 'من أصل 5 ج.ب',
      icon: HardDrive,
      tone: 'blue',
    },
    {
      label: 'الملفات المفضلة',
      value: stats.favorites.toLocaleString('ar-SA'),
      helper: 'للوصول السريع',
      icon: Heart,
      tone: 'rose',
    },
    {
      label: 'الأعوام الدراسية',
      value: stats.years.toLocaleString('ar-SA'),
      helper: 'أرشيف منظم',
      icon: CalendarDays,
      tone: 'amber',
    },
  ]

  return (
    <div className="dashboard-home">
      <motion.section
        className="dashboard-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">
            <ShieldCheck size={16} />
            مساحة العمل محمية
          </span>
          <h1>أهلًا {firstName}، كل أعمال الاختبارات في مكان واحد.</h1>
          <p>
            ارفع الملفات ورتبها حسب العام والفصل والتبويب، وارجع إليها بسرعة متى احتجت.
          </p>
          <div className="dashboard-hero__actions">
            <button type="button" className="primary-button primary-button--light" onClick={onUpload}>
              <CloudUpload size={19} />
              رفع ملفات جديدة
            </button>
            <button type="button" className="ghost-button ghost-button--light" onClick={onOpenWorkspace}>
              استعراض الملفات
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>

        <div className="dashboard-hero__visual" aria-hidden="true">
          <motion.div
            className="dashboard-hero__orbit"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="dashboard-hero__cloud"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CloudUpload size={52} strokeWidth={1.5} />
            <span><ShieldCheck size={18} /></span>
          </motion.div>
          {[
            { label: 'PDF', className: 'hero-mini-file hero-mini-file--one' },
            { label: 'DOCX', className: 'hero-mini-file hero-mini-file--two' },
            { label: 'XLSX', className: 'hero-mini-file hero-mini-file--three' },
          ].map((item, index) => (
            <motion.span
              key={item.label}
              className={item.className}
              animate={{ y: [0, index % 2 ? 7 : -7, 0], rotate: [0, index - 1, 0] }}
              transition={{ duration: 4 + index * 0.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FileText size={18} />
              {item.label}
            </motion.span>
          ))}
        </div>

        <div className="dashboard-hero__meta">
          <span>{selectedYear?.label ?? 'عام جديد'}</span>
          <i />
          <span>{selectedSemester?.name ?? 'الفصل الدراسي'}</span>
        </div>
      </motion.section>

      <section className="stats-grid">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.article
              key={card.label}
              className="stat-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.06 }}
            >
              <span className={`stat-card__icon stat-card__icon--${card.tone}`}>
                <Icon size={21} />
              </span>
              <div className="stat-card__copy">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.helper}</small>
              </div>
              <span className="stat-card__spark">
                {[0, 1, 2, 3, 4].map((bar) => <i key={bar} style={{ height: `${8 + ((bar + index) % 4) * 5}px` }} />)}
              </span>
            </motion.article>
          )
        })}
      </section>

      <section className="dashboard-section">
        <header className="section-heading">
          <div>
            <span className="section-heading__icon"><FolderKanban size={20} /></span>
            <div>
              <h2>تبويبات الفصل الحالي</h2>
              <p>وصول سريع إلى مجموعات أعمال الاختبارات</p>
            </div>
          </div>
          <button type="button" className="text-button" onClick={onOpenWorkspace}>
            عرض الكل
            <ArrowLeft size={17} />
          </button>
        </header>

        {tabs.length > 0 ? (
          <div className="tab-preview-grid">
            {tabs.slice(0, 4).map((tab, index) => {
              const Icon = tabIcons[index % tabIcons.length]
              const count = activeDocuments.filter((document) => document.tab_id === tab.id).length
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  className={`tab-preview-card tab-preview-card--${tab.accent}`}
                  onClick={() => onOpenTab(tab.id)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <span className="tab-preview-card__icon"><Icon size={23} /></span>
                  <span className="tab-preview-card__copy">
                    <strong>{tab.name}</strong>
                    <small>{tab.description || 'ملفات وأعمال منظمة'}</small>
                  </span>
                  <span className="tab-preview-card__count">{count} ملف</span>
                  <ArrowLeft className="tab-preview-card__arrow" size={18} />
                </motion.button>
              )
            })}
          </div>
        ) : (
          <button type="button" className="inline-empty-card" onClick={onCreateYear}>
            <span><Plus size={22} /></span>
            <strong>ابدأ بإنشاء عام دراسي</strong>
            <small>سيتم إنشاء الفصلين والتبويبات الأساسية تلقائيًا</small>
          </button>
        )}
      </section>

      <section className="dashboard-section">
        <header className="section-heading">
          <div>
            <span className="section-heading__icon section-heading__icon--blue"><FileText size={20} /></span>
            <div>
              <h2>أحدث الملفات</h2>
              <p>آخر ما تمت إضافته إلى السحابة</p>
            </div>
          </div>
          <button type="button" className="text-button" onClick={onOpenWorkspace}>
            جميع الملفات
            <ArrowLeft size={17} />
          </button>
        </header>

        <div className="recent-files">
          {recent.length > 0 ? recent.map((document) => {
            const tab = tabs.find((item) => item.id === document.tab_id)
            return (
              <button type="button" className="recent-file" key={document.id} onClick={onOpenWorkspace}>
                <FileTypeIcon extension={document.extension} />
                <span className="recent-file__copy">
                  <strong>{document.display_name}</strong>
                  <small>{tab?.name ?? 'غير مصنف'}</small>
                </span>
                <span className="recent-file__size">{formatFileSize(document.size_bytes)}</span>
                <span className="recent-file__date">{formatRelativeDate(document.created_at)}</span>
                <ArrowLeft size={17} />
              </button>
            )
          }) : (
            <div className="recent-files__empty">
              <CloudUpload size={25} />
              <span>لم يتم رفع ملفات بعد.</span>
              <button type="button" onClick={onUpload}>رفع أول ملف</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
