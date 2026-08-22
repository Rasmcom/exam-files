import { motion } from 'framer-motion'
import { Archive, CalendarDays, ChevronLeft, FileText } from 'lucide-react'
import type { AcademicYear, DocumentRecord, Semester } from '../types/database'
import { formatFileSize } from '../lib/format'

interface ArchiveViewProps {
  years: AcademicYear[]
  semesters: Semester[]
  documents: DocumentRecord[]
  onOpenYear: (id: string) => void
}

export function ArchiveView({ years, semesters, documents, onOpenYear }: ArchiveViewProps) {
  const archivedYears = years.filter((year) => year.is_archived)

  return (
    <div className="archive-view">
      <header className="page-title">
        <div>
          <span className="page-title__kicker">مرجع الأعوام السابقة</span>
          <h1>الأعوام المؤرشفة</h1>
          <p>احتفظ بأعمال الاختبارات القديمة مرتبة دون أن تزاحم مساحة العمل الحالية.</p>
        </div>
        <span className="page-title__symbol"><Archive size={27} /></span>
      </header>

      {archivedYears.length > 0 ? (
        <div className="archive-grid">
          {archivedYears.map((year, index) => {
            const yearSemesters = semesters.filter((semester) => semester.academic_year_id === year.id)
            const yearDocuments = documents.filter((document) => document.academic_year_id === year.id && !document.is_deleted)
            const bytes = yearDocuments.reduce((total, document) => total + document.size_bytes, 0)
            return (
              <motion.button
                key={year.id}
                type="button"
                className="archive-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => onOpenYear(year.id)}
              >
                <span className="archive-card__icon"><Archive size={28} /></span>
                <span className="archive-card__copy">
                  <small>العام الدراسي</small>
                  <strong>{year.label}</strong>
                  <span>
                    <i><CalendarDays size={15} /> {yearSemesters.length} فصل</i>
                    <i><FileText size={15} /> {yearDocuments.length} ملف</i>
                  </span>
                </span>
                <span className="archive-card__size">{formatFileSize(bytes)}</span>
                <ChevronLeft size={20} />
              </motion.button>
            )
          })}
        </div>
      ) : (
        <div className="empty-state empty-state--large">
          <span className="empty-state__icon"><Archive size={31} /></span>
          <h3>لا توجد أعوام مؤرشفة</h3>
          <p>عند أرشفة عام دراسي سيظهر هنا مع جميع ملفاته.</p>
        </div>
      )}
    </div>
  )
}
