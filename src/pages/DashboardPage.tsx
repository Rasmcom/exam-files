import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ArchiveView } from '../components/ArchiveView'
import { CollectionView } from '../components/CollectionView'
import {
  CreateFolderDialog,
  CreateTabDialog,
  CreateYearDialog,
} from '../components/CreateDialogs'
import { DashboardHome } from '../components/DashboardHome'
import { Sidebar } from '../components/Sidebar'
import type { DashboardView } from '../components/Sidebar'
import { SettingsView } from '../components/SettingsView'
import { Topbar } from '../components/Topbar'
import { UploadDialog } from '../components/UploadDialog'
import { WorkspaceView } from '../components/WorkspaceView'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../hooks/useWorkspace'
import { formatFileSize } from '../lib/format'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const {
    workspace,
    loading,
    error,
    stats,
    fetchWorkspace,
    createAcademicYear,
    createTab,
    createFolder,
    uploadFiles,
    toggleFavorite,
    softDeleteDocument,
    restoreDocument,
    downloadDocument,
  } = useWorkspace()

  const [activeView, setActiveView] = useState<DashboardView>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedTabId, setSelectedTabId] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [yearDialogOpen, setYearDialogOpen] = useState(false)
  const [tabDialogOpen, setTabDialogOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const currentYear = workspace.years.find((year) => year.id === selectedYearId)
  const currentSemester = workspace.semesters.find((semester) => semester.id === selectedSemesterId)
  const currentTab = workspace.tabs.find((tab) => tab.id === selectedTabId)

  useEffect(() => {
    if (!workspace.years.length) return

    const selectedYearStillExists = workspace.years.some((year) => year.id === selectedYearId)
    if (selectedYearStillExists) return

    const initialYear = workspace.years.find((year) => !year.is_archived) ?? workspace.years[0]
    setSelectedYearId(initialYear.id)
  }, [selectedYearId, workspace.years])

  useEffect(() => {
    if (!selectedYearId) return
    const yearSemesters = workspace.semesters.filter((semester) => semester.academic_year_id === selectedYearId)
    const selectedSemesterStillExists = yearSemesters.some((semester) => semester.id === selectedSemesterId)
    if (selectedSemesterStillExists) return
    setSelectedSemesterId(yearSemesters[0]?.id ?? '')
  }, [selectedSemesterId, selectedYearId, workspace.semesters])

  useEffect(() => {
    if (!selectedSemesterId) {
      setSelectedTabId('')
      return
    }
    const semesterTabs = workspace.tabs.filter(
      (tab) => tab.semester_id === selectedSemesterId && !tab.is_archived,
    )
    const selectedTabStillExists = semesterTabs.some((tab) => tab.id === selectedTabId)
    if (selectedTabStillExists) return
    setSelectedTabId(semesterTabs[0]?.id ?? '')
    setSelectedFolderId(null)
  }, [selectedSemesterId, selectedTabId, workspace.tabs])

  const currentYearSemesters = useMemo(
    () => workspace.semesters.filter((semester) => semester.academic_year_id === selectedYearId),
    [selectedYearId, workspace.semesters],
  )

  const currentSemesterTabs = useMemo(
    () => workspace.tabs.filter((tab) => tab.semester_id === selectedSemesterId && !tab.is_archived),
    [selectedSemesterId, workspace.tabs],
  )

  const storagePercent = Math.max(
    1,
    Math.round((stats.storageBytes / (5 * 1024 * 1024 * 1024)) * 100),
  )

  function handleYearChange(yearId: string) {
    setSelectedYearId(yearId)
    const nextSemester = workspace.semesters.find((semester) => semester.academic_year_id === yearId)
    setSelectedSemesterId(nextSemester?.id ?? '')
    const nextTab = workspace.tabs.find((tab) => tab.semester_id === nextSemester?.id && !tab.is_archived)
    setSelectedTabId(nextTab?.id ?? '')
    setSelectedFolderId(null)
  }

  function handleSemesterChange(semesterId: string) {
    setSelectedSemesterId(semesterId)
    const nextTab = workspace.tabs.find((tab) => tab.semester_id === semesterId && !tab.is_archived)
    setSelectedTabId(nextTab?.id ?? '')
    setSelectedFolderId(null)
  }

  function handleOpenTab(tabId: string) {
    const tab = workspace.tabs.find((item) => item.id === tabId)
    if (!tab) return
    const semester = workspace.semesters.find((item) => item.id === tab.semester_id)
    if (semester) {
      setSelectedSemesterId(semester.id)
      setSelectedYearId(semester.academic_year_id)
    }
    setSelectedTabId(tabId)
    setSelectedFolderId(null)
    setActiveView('workspace')
  }

  function handleOpenUpload() {
    if (!workspace.years.length) {
      setYearDialogOpen(true)
      return
    }
    if (!selectedTabId) {
      setTabDialogOpen(true)
      return
    }
    setUploadDialogOpen(true)
  }

  if (!user) return null

  return (
    <div className="dashboard-shell">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onUpload={handleOpenUpload}
        onSignOut={signOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storageLabel={formatFileSize(stats.storageBytes)}
        storagePercent={storagePercent}
      />

      <div className="dashboard-main">
        <Topbar
          user={user}
          years={workspace.years}
          selectedYearId={selectedYearId}
          onYearChange={handleYearChange}
          search={search}
          onSearchChange={setSearch}
          onMenu={() => setSidebarOpen(true)}
          onUpload={handleOpenUpload}
        />

        <main className="dashboard-content">
          {loading ? (
            <div className="dashboard-loader">
              <span className="dashboard-loader__ring" />
              <strong>جاري تجهيز مساحة العمل...</strong>
            </div>
          ) : error ? (
            <div className="dashboard-error">
              <span><AlertTriangle size={27} /></span>
              <h2>تعذر تحميل البيانات</h2>
              <p>{error}</p>
              <button type="button" className="primary-button" onClick={fetchWorkspace}>
                <RefreshCw size={18} />
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              {activeView === 'home' && (
                <DashboardHome
                  user={user}
                  selectedYear={currentYear}
                  selectedSemester={currentSemester}
                  tabs={currentSemesterTabs}
                  documents={workspace.documents}
                  stats={stats}
                  onUpload={handleOpenUpload}
                  onCreateYear={() => setYearDialogOpen(true)}
                  onOpenWorkspace={() => setActiveView('workspace')}
                  onOpenTab={handleOpenTab}
                />
              )}

              {activeView === 'workspace' && (
                <WorkspaceView
                  years={workspace.years}
                  semesters={workspace.semesters}
                  tabs={workspace.tabs}
                  folders={workspace.folders}
                  documents={workspace.documents}
                  selectedYearId={selectedYearId}
                  selectedSemesterId={selectedSemesterId}
                  selectedTabId={selectedTabId}
                  selectedFolderId={selectedFolderId}
                  search={search}
                  onYearChange={handleYearChange}
                  onSemesterChange={handleSemesterChange}
                  onTabChange={(tabId) => {
                    setSelectedTabId(tabId)
                    setSelectedFolderId(null)
                  }}
                  onFolderChange={setSelectedFolderId}
                  onCreateYear={() => setYearDialogOpen(true)}
                  onCreateTab={() => setTabDialogOpen(true)}
                  onCreateFolder={() => setFolderDialogOpen(true)}
                  onUpload={handleOpenUpload}
                  onFavorite={toggleFavorite}
                  onDownload={downloadDocument}
                  onDelete={softDeleteDocument}
                />
              )}

              {activeView === 'favorites' && (
                <CollectionView
                  type="favorites"
                  documents={workspace.documents}
                  tabs={workspace.tabs}
                  search={search}
                  onFavorite={toggleFavorite}
                  onDownload={downloadDocument}
                  onDelete={softDeleteDocument}
                  onRestore={restoreDocument}
                />
              )}

              {activeView === 'trash' && (
                <CollectionView
                  type="trash"
                  documents={workspace.documents}
                  tabs={workspace.tabs}
                  search={search}
                  onFavorite={toggleFavorite}
                  onDownload={downloadDocument}
                  onDelete={softDeleteDocument}
                  onRestore={restoreDocument}
                />
              )}

              {activeView === 'archive' && (
                <ArchiveView
                  years={workspace.years}
                  semesters={workspace.semesters}
                  documents={workspace.documents}
                  onOpenYear={(yearId) => {
                    handleYearChange(yearId)
                    setActiveView('workspace')
                  }}
                />
              )}

              {activeView === 'settings' && <SettingsView user={user} />}
            </>
          )}
        </main>
      </div>

      <CreateYearDialog
        open={yearDialogOpen}
        onClose={() => setYearDialogOpen(false)}
        onCreate={createAcademicYear}
      />

      <CreateTabDialog
        open={tabDialogOpen}
        onClose={() => setTabDialogOpen(false)}
        semesters={currentYearSemesters}
        selectedSemesterId={selectedSemesterId}
        onSemesterChange={handleSemesterChange}
        onCreate={createTab}
      />

      <CreateFolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        tabName={currentTab?.name ?? ''}
        onCreate={(name) => createFolder(selectedTabId, name)}
      />

      <UploadDialog
        key={`${uploadDialogOpen}-${selectedYearId}-${selectedSemesterId}-${selectedTabId}-${selectedFolderId}`}
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        years={workspace.years}
        semesters={workspace.semesters}
        tabs={workspace.tabs}
        folders={workspace.folders}
        selectedYearId={selectedYearId}
        selectedSemesterId={selectedSemesterId}
        selectedTabId={selectedTabId}
        selectedFolderId={selectedFolderId}
        onUpload={uploadFiles}
      />
    </div>
  )
}
