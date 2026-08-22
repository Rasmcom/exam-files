import { useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  FilePlus2,
  FolderOpen,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'
import { Modal } from './Modal'
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE } from '../lib/constants'
import { formatFileSize, getExtension } from '../lib/format'
import type {
  AcademicYear,
  FolderRecord,
  Semester,
  WorkspaceTab,
} from '../types/database'
import { FileTypeIcon } from './FileTypeIcon'

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  years: AcademicYear[]
  semesters: Semester[]
  tabs: WorkspaceTab[]
  folders: FolderRecord[]
  selectedYearId: string
  selectedSemesterId: string
  selectedTabId: string
  selectedFolderId: string | null
  onUpload: (
    files: File[],
    location: {
      academicYearId: string
      semesterId: string
      tabId: string
      folderId: string | null
    },
  ) => Promise<void>
}

export function UploadDialog({
  open,
  onClose,
  years,
  semesters,
  tabs,
  folders,
  selectedYearId,
  selectedSemesterId,
  selectedTabId,
  selectedFolderId,
  onUpload,
}: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [yearId, setYearId] = useState(selectedYearId)
  const [semesterId, setSemesterId] = useState(selectedSemesterId)
  const [tabId, setTabId] = useState(selectedTabId)
  const [folderId, setFolderId] = useState<string | null>(selectedFolderId)

  const availableSemesters = useMemo(
    () => semesters.filter((semester) => semester.academic_year_id === yearId),
    [semesters, yearId],
  )
  const availableTabs = useMemo(
    () => tabs.filter((tab) => tab.semester_id === semesterId && !tab.is_archived),
    [semesterId, tabs],
  )
  const availableFolders = useMemo(
    () => folders.filter((folder) => folder.tab_id === tabId && folder.parent_id === null),
    [folders, tabId],
  )

  function resetLocation(nextYearId: string) {
    setYearId(nextYearId)
    const nextSemester = semesters.find((semester) => semester.academic_year_id === nextYearId)
    setSemesterId(nextSemester?.id ?? '')
    const nextTab = tabs.find((tab) => tab.semester_id === nextSemester?.id)
    setTabId(nextTab?.id ?? '')
    setFolderId(null)
  }

  function resetSemester(nextSemesterId: string) {
    setSemesterId(nextSemesterId)
    const nextTab = tabs.find((tab) => tab.semester_id === nextSemesterId)
    setTabId(nextTab?.id ?? '')
    setFolderId(null)
  }

  function addFiles(incoming: File[]) {
    const valid = incoming.filter((file) => {
      const extension = getExtension(file.name)
      return ACCEPTED_EXTENSIONS.includes(extension) && file.size <= MAX_FILE_SIZE
    })
    setFiles((current) => {
      const signatures = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      return [
        ...current,
        ...valid.filter((file) => !signatures.has(`${file.name}-${file.size}-${file.lastModified}`)),
      ]
    })
  }

  async function handleSubmit() {
    if (!files.length || !yearId || !semesterId || !tabId) return
    setSubmitting(true)
    try {
      await onUpload(files, {
        academicYearId: yearId,
        semesterId,
        tabId,
        folderId,
      })
      setFiles([])
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose()
      }}
      title="رفع ملفات جديدة"
      description="يمكن رفع أكثر من ملف دفعة واحدة، بحد أقصى 50 م.ب لكل ملف."
      size="lg"
    >
      <div className="upload-layout">
        <div className="upload-location">
          <h3><FolderOpen size={18} /> مكان الحفظ</h3>
          <div className="upload-location__grid">
            <label className="field">
              <span className="field__label">العام الدراسي</span>
              <span className="field__control field__control--select">
                <select value={yearId} onChange={(event) => resetLocation(event.target.value)}>
                  {years.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="field__label">الفصل الدراسي</span>
              <span className="field__control field__control--select">
                <select value={semesterId} onChange={(event) => resetSemester(event.target.value)}>
                  {availableSemesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>{semester.name}</option>
                  ))}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="field__label">التبويب</span>
              <span className="field__control field__control--select">
                <select
                  value={tabId}
                  onChange={(event) => {
                    setTabId(event.target.value)
                    setFolderId(null)
                  }}
                >
                  {availableTabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.name}</option>)}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="field__label">المجلد <small>اختياري</small></span>
              <span className="field__control field__control--select">
                <select value={folderId ?? ''} onChange={(event) => setFolderId(event.target.value || null)}>
                  <option value="">بدون مجلد</option>
                  {availableFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </div>

        <button
          type="button"
          className={`drop-zone ${dragging ? 'is-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            addFiles(Array.from(event.dataTransfer.files))
          }}
        >
          <span className="drop-zone__icon"><UploadCloud size={31} /></span>
          <strong>اسحب الملفات هنا أو اضغط للاختيار</strong>
          <span>PDF، Word، Excel، PowerPoint، صور وملفات مضغوطة</span>
          <small><ShieldCheck size={14} /> الملفات تُحفظ داخل مساحة تخزين خاصة</small>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />

        {files.length > 0 && (
          <div className="upload-queue">
            <div className="upload-queue__head">
              <h3>الملفات المحددة</h3>
              <span>{files.length} ملف</span>
            </div>
            <div className="upload-queue__list">
              {files.map((file) => (
                <div className="upload-item" key={`${file.name}-${file.size}-${file.lastModified}`}>
                  <FileTypeIcon extension={getExtension(file.name)} size={20} />
                  <span className="upload-item__copy">
                    <strong>{file.name}</strong>
                    <small>{formatFileSize(file.size)}</small>
                  </span>
                  <CheckCircle2 className="upload-item__check" size={17} />
                  <button
                    type="button"
                    className="icon-button icon-button--soft"
                    onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                    aria-label="إزالة الملف"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dialog-form__actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>إلغاء</button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={submitting || !files.length || !yearId || !semesterId || !tabId}
          >
            <FilePlus2 size={18} />
            {submitting ? 'جاري رفع الملفات...' : `رفع ${files.length || ''} ملف`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
