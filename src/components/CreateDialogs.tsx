import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarPlus, FolderPlus, LayoutGrid, Palette } from 'lucide-react'
import { Modal } from './Modal'
import { TAB_ACCENTS } from '../lib/constants'
import type { Semester } from '../types/database'

interface CreateYearDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (label: string) => Promise<unknown>
}

export function CreateYearDialog({ open, onClose, onCreate }: CreateYearDialogProps) {
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setLabel('')
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    try {
      const result = await onCreate(label)
      if (result) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إضافة عام دراسي"
      description="سيتم إنشاء الفصل الدراسي الأول والثاني تلقائيًا."
      size="sm"
    >
      <form className="dialog-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">مسمى العام الدراسي</span>
          <span className="field__control">
            <CalendarPlus size={18} />
            <input
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="مثال: 1448هـ"
              maxLength={30}
              required
            />
          </span>
        </label>
        <div className="dialog-form__actions">
          <button type="button" className="secondary-button" onClick={onClose}>إلغاء</button>
          <button type="submit" className="primary-button" disabled={submitting || !label.trim()}>
            <CalendarPlus size={18} />
            {submitting ? 'جاري الإنشاء...' : 'إنشاء العام'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface CreateTabDialogProps {
  open: boolean
  onClose: () => void
  semesters: Semester[]
  selectedSemesterId: string
  onSemesterChange: (id: string) => void
  onCreate: (semesterId: string, name: string, description: string, accent: string) => Promise<unknown>
}

export function CreateTabDialog({
  open,
  onClose,
  semesters,
  selectedSemesterId,
  onSemesterChange,
  onCreate,
}: CreateTabDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [accent, setAccent] = useState('violet')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setAccent('violet')
    }
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedSemesterId || !name.trim()) return
    setSubmitting(true)
    try {
      const result = await onCreate(selectedSemesterId, name, description, accent)
      if (result) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إنشاء تبويب جديد"
      description="استخدم التبويبات لتجميع الأعمال المتشابهة داخل الفصل."
    >
      <form className="dialog-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">الفصل الدراسي</span>
          <span className="field__control field__control--select">
            <LayoutGrid size={18} />
            <select value={selectedSemesterId} onChange={(event) => onSemesterChange(event.target.value)} required>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </span>
        </label>

        <label className="field">
          <span className="field__label">اسم التبويب</span>
          <span className="field__control">
            <LayoutGrid size={18} />
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: نماذج الإجابة"
              maxLength={80}
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field__label">وصف مختصر <small>اختياري</small></span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="اشرح نوع الملفات التي ستُحفظ هنا..."
            maxLength={180}
            rows={3}
          />
        </label>

        <div className="accent-picker">
          <span className="field__label"><Palette size={16} /> لون التبويب</span>
          <div>
            {TAB_ACCENTS.map((item) => (
              <button
                key={item}
                type="button"
                className={`accent-swatch accent-swatch--${item} ${accent === item ? 'is-active' : ''}`}
                onClick={() => setAccent(item)}
                aria-label={`اختيار اللون ${item}`}
              />
            ))}
          </div>
        </div>

        <div className="dialog-form__actions">
          <button type="button" className="secondary-button" onClick={onClose}>إلغاء</button>
          <button type="submit" className="primary-button" disabled={submitting || !name.trim() || !selectedSemesterId}>
            <LayoutGrid size={18} />
            {submitting ? 'جاري الإنشاء...' : 'إنشاء التبويب'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface CreateFolderDialogProps {
  open: boolean
  onClose: () => void
  tabName: string
  onCreate: (name: string) => Promise<unknown>
}

export function CreateFolderDialog({ open, onClose, tabName, onCreate }: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setName('')
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const result = await onCreate(name)
      if (result) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إنشاء مجلد"
      description={`سيُضاف المجلد داخل تبويب «${tabName || 'التبويب الحالي'}».`}
      size="sm"
    >
      <form className="dialog-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">اسم المجلد</span>
          <span className="field__control">
            <FolderPlus size={18} />
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثال: الصف الأول المتوسط"
              maxLength={100}
              required
            />
          </span>
        </label>
        <div className="dialog-form__actions">
          <button type="button" className="secondary-button" onClick={onClose}>إلغاء</button>
          <button type="submit" className="primary-button" disabled={submitting || !name.trim()}>
            <FolderPlus size={18} />
            {submitting ? 'جاري الإنشاء...' : 'إنشاء المجلد'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
