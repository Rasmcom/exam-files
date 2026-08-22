import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
} from 'lucide-react'
import type {
  AcademicYear,
  DocumentRecord,
  FolderRecord,
  Semester,
  WorkspaceTab,
} from '../types/database'
import { FileBrowser } from './FileBrowser'
import { ViewToolbar } from './ViewToolbar'

interface WorkspaceViewProps {
  years: AcademicYear[]
  semesters: Semester[]
  tabs: WorkspaceTab[]
  folders: FolderRecord[]
  documents: DocumentRecord[]
  selectedYearId: string
  selectedSemesterId: string
  selectedTabId: string
  selectedFolderId: string | null
  search: string
  onYearChange: (id: string) => void
  onSemesterChange: (id: string) => void
  onTabChange: (id: string) => void
  onFolderChange: (id: string | null) => void
  onCreateYear: () => void
  onCreateTab: () => void
  onCreateFolder: () => void
  onUpload: () => void
  onFavorite: (id: string) => void
  onDownload: (document: DocumentRecord) => void
  onDelete: (id: string) => void
}

export function WorkspaceView({
  years,
  semesters,
  tabs,
  folders,
  documents,
  selectedYearId,
  selectedSemesterId,
  selectedTabId,
  selectedFolderId,
  search,
  onYearChange,
  onSemesterChange,
  onTabChange,
  onFolderChange,
  onCreateYear,
  onCreateTab,
  onCreateFolder,
  onUpload,
  onFavorite,
  onDownload,
  onDelete,
}: WorkspaceViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const activeYear = years.find((item) => item.id === selectedYearId)
  const activeSemester = semesters.find((item) => item.id === selectedSemesterId)
  const activeTab = tabs.find((item) => item.id === selectedTabId)
  const activeFolder = folders.find((item) => item.id === selectedFolderId)

  const yearSemesters = semesters.filter((item) => item.academic_year_id === selectedYearId)
  const semesterTabs = tabs.filter((item) => item.semester_id === selectedSemesterId && !item.is_archived)
  const tabFolders = folders.filter((item) => item.tab_id === selectedTabId && item.parent_id === null)

  const visibleDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return documents.filter((document) => {
      if (document.is_deleted) return false
      if (document.academic_year_id !== selectedYearId) return false
      if (document.semester_id !== selectedSemesterId) return false
      if (selectedTabId && document.tab_id !== selectedTabId) return false
      if (selectedFolderId && document.folder_id !== selectedFolderId) return false
      if (!query) return true
      return [
        document.display_name,
        document.extension,
        ...document.tags,
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [documents, search, selectedFolderId, selectedSemesterId, selectedTabId, selectedYearId])

  return (
    <div className="workspace-view">
      <header className="page-title">
        <div>
          <span className="page-title__kicker">مساحة العمل</span>
          <h1>ملفات أعمال الاختبارات</h1>
          <p>تنظيم هرمي بحسب العام الدراسي والفصل والتبويب والمجلد.</p>
        </div>
        <div className="page-title__actions">
          <button type="button" className="secondary-button" onClick={onCreateFolder} disabled={!selectedTabId}>
            <FolderPlus size={18} />
            مجلد جديد
          </button>
          <button type="button" className="primary-button" onClick={onUpload} disabled={!selectedTabId}>
            <FilePlus2 size={18} />
            رفع ملفات
          </button>
        </div>
      </header>

      <div className="workspace-controls">
        <div className="segmented-years">
          {years.filter((year) => !year.is_archived).map((year) => (
            <button
              key={year.id}
              type="button"
              className={year.id === selectedYearId ? 'is-active' : ''}
              onClick={() => onYearChange(year.id)}
            >
              {year.label}
            </button>
          ))}
          <button type="button" className="segmented-years__add" onClick={onCreateYear}>
            <Plus size={16} />
            عام جديد
          </button>
        </div>

        <div className="semester-tabs">
          {yearSemesters.map((semester) => (
            <button
              key={semester.id}
              type="button"
              className={semester.id === selectedSemesterId ? 'is-active' : ''}
              onClick={() => onSemesterChange(semester.id)}
            >
              {semester.name}
            </button>
          ))}
        </div>
      </div>

      {semesterTabs.length > 0 ? (
        <div className="workspace-tabs">
          {semesterTabs.map((tab) => {
            const count = documents.filter((document) => !document.is_deleted && document.tab_id === tab.id).length
            return (
              <motion.button
                key={tab.id}
                type="button"
                className={`workspace-tab workspace-tab--${tab.accent} ${tab.id === selectedTabId ? 'is-active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ y: -2 }}
              >
                <span className="workspace-tab__icon">
                  {tab.id === selectedTabId ? <FolderOpen size={20} /> : <Folder size={20} />}
                </span>
                <span>
                  <strong>{tab.name}</strong>
                  <small>{count} ملف</small>
                </span>
              </motion.button>
            )
          })}
          <button type="button" className="workspace-tab workspace-tab--add" onClick={onCreateTab}>
            <span className="workspace-tab__icon"><Plus size={20} /></span>
            <span>
              <strong>تبويب جديد</strong>
              <small>تصنيف إضافي</small>
            </span>
          </button>
        </div>
      ) : (
        <button type="button" className="workspace-empty-tabs" onClick={onCreateTab}>
          <Plus size={21} />
          أنشئ أول تبويب لهذا الفصل
        </button>
      )}

      {selectedTabId && tabFolders.length > 0 && (
        <div className="folder-strip">
          <button
            type="button"
            className={selectedFolderId === null ? 'is-active' : ''}
            onClick={() => onFolderChange(null)}
          >
            <FolderOpen size={17} />
            جميع الملفات
          </button>
          {tabFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={folder.id === selectedFolderId ? 'is-active' : ''}
              onClick={() => onFolderChange(folder.id)}
            >
              <Folder size={17} />
              {folder.name}
            </button>
          ))}
        </div>
      )}

      <div className="breadcrumbs">
        <span>{activeYear?.label ?? 'العام الدراسي'}</span>
        <ChevronLeft size={15} />
        <span>{activeSemester?.name ?? 'الفصل'}</span>
        {activeTab && <><ChevronLeft size={15} /><span>{activeTab.name}</span></>}
        {activeFolder && <><ChevronLeft size={15} /><strong>{activeFolder.name}</strong></>}
      </div>

      <ViewToolbar
        title={activeFolder?.name || activeTab?.name || 'الملفات'}
        count={visibleDocuments.length}
        mode={viewMode}
        onModeChange={setViewMode}
      />

      <FileBrowser
        documents={visibleDocuments}
        tabs={tabs}
        mode={viewMode}
        onFavorite={onFavorite}
        onDownload={onDownload}
        onDelete={onDelete}
        onRestore={() => undefined}
        emptyTitle={search ? 'لا توجد نتائج مطابقة' : 'هذا المكان فارغ حاليًا'}
        emptyDescription={search ? 'جرّب كلمة بحث أخرى.' : 'ارفع ملفات جديدة أو أنشئ مجلدًا لتنظيمها.'}
      />
    </div>
  )
}
