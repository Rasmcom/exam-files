import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ACCEPTED_EXTENSIONS, DEMO_MODE, MAX_FILE_SIZE, STORAGE_BUCKET } from '../lib/constants'
import { demoWorkspace } from '../lib/demo'
import { getExtension, safeFileName } from '../lib/format'
import { supabase } from '../lib/supabase'
import type {
  AcademicYear,
  DocumentRecord,
  FolderRecord,
  Semester,
  WorkspaceSnapshot,
  WorkspaceTab,
} from '../types/database'
import { useAuth } from '../contexts/AuthContext'

const emptyWorkspace: WorkspaceSnapshot = {
  years: [],
  semesters: [],
  tabs: [],
  folders: [],
  documents: [],
}

export function useWorkspace() {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(DEMO_MODE ? demoWorkspace : emptyWorkspace)
  const [loading, setLoading] = useState(!DEMO_MODE)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkspace = useCallback(async () => {
    if (!user || DEMO_MODE) return
    setLoading(true)
    setError(null)

    const [
      yearsResult,
      semestersResult,
      tabsResult,
      foldersResult,
      documentsResult,
    ] = await Promise.all([
      supabase.from('academic_years').select('*').order('sort_order'),
      supabase.from('semesters').select('*').order('sort_order'),
      supabase.from('workspace_tabs').select('*').order('sort_order'),
      supabase.from('folders').select('*').order('sort_order'),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
    ])

    const failed = [yearsResult, semestersResult, tabsResult, foldersResult, documentsResult]
      .find((result) => result.error)

    if (failed?.error) {
      setError('تعذر تحميل مساحة العمل. تحقق من إعداد قاعدة البيانات.')
      setLoading(false)
      return
    }

    setWorkspace({
      years: (yearsResult.data ?? []) as AcademicYear[],
      semesters: (semestersResult.data ?? []) as Semester[],
      tabs: (tabsResult.data ?? []) as WorkspaceTab[],
      folders: (foldersResult.data ?? []) as FolderRecord[],
      documents: (documentsResult.data ?? []) as DocumentRecord[],
    })
    setLoading(false)
  }, [user])

  useEffect(() => {
    void fetchWorkspace()
  }, [fetchWorkspace])

  const createAcademicYear = useCallback(async (label: string) => {
    if (!user) return null
    const cleanLabel = label.trim()
    if (!cleanLabel) return null

    if (DEMO_MODE) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const year: AcademicYear = {
        id,
        user_id: user.id,
        label: cleanLabel,
        sort_order: workspace.years.length + 1,
        is_archived: false,
        created_at: now,
        updated_at: now,
      }
      const semesters: Semester[] = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني'].map((name, index) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        academic_year_id: id,
        name,
        sort_order: index + 1,
        created_at: now,
        updated_at: now,
      }))
      setWorkspace((current) => ({
        ...current,
        years: [...current.years, year],
        semesters: [...current.semesters, ...semesters],
      }))
      toast.success('تم إنشاء العام الدراسي')
      return year
    }

    const { data, error: rpcError } = await supabase
      .rpc('create_academic_year_workspace', { p_label: cleanLabel })
      .single()

    if (rpcError) {
      toast.error(rpcError.code === '23505' ? 'هذا العام الدراسي موجود مسبقًا' : 'تعذر إنشاء العام الدراسي')
      return null
    }

    await fetchWorkspace()
    toast.success('تم إنشاء العام الدراسي')
    return data as AcademicYear
  }, [fetchWorkspace, user, workspace.years.length])

  const createTab = useCallback(async (
    semesterId: string,
    name: string,
    description: string,
    accent: string,
  ) => {
    if (!user) return null
    const cleanName = name.trim()
    if (!cleanName) return null

    const payload = {
      user_id: user.id,
      semester_id: semesterId,
      name: cleanName,
      description: description.trim() || null,
      icon: 'FolderKanban',
      accent,
      sort_order: workspace.tabs.filter((tab) => tab.semester_id === semesterId).length + 1,
    }

    if (DEMO_MODE) {
      const now = new Date().toISOString()
      const tab: WorkspaceTab = {
        ...payload,
        id: crypto.randomUUID(),
        is_archived: false,
        created_at: now,
        updated_at: now,
      }
      setWorkspace((current) => ({ ...current, tabs: [...current.tabs, tab] }))
      toast.success('تم إنشاء التبويب')
      return tab
    }

    const { data, error: insertError } = await supabase
      .from('workspace_tabs')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      toast.error('تعذر إنشاء التبويب')
      return null
    }

    setWorkspace((current) => ({ ...current, tabs: [...current.tabs, data as WorkspaceTab] }))
    toast.success('تم إنشاء التبويب')
    return data as WorkspaceTab
  }, [user, workspace.tabs])

  const createFolder = useCallback(async (tabId: string, name: string, parentId: string | null = null) => {
    if (!user) return null
    const cleanName = name.trim()
    if (!cleanName) return null

    const payload = {
      user_id: user.id,
      tab_id: tabId,
      parent_id: parentId,
      name: cleanName,
      sort_order: workspace.folders.filter((folder) => folder.tab_id === tabId).length + 1,
    }

    if (DEMO_MODE) {
      const now = new Date().toISOString()
      const folder: FolderRecord = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      }
      setWorkspace((current) => ({ ...current, folders: [...current.folders, folder] }))
      toast.success('تم إنشاء المجلد')
      return folder
    }

    const { data, error: insertError } = await supabase
      .from('folders')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      toast.error('تعذر إنشاء المجلد')
      return null
    }

    setWorkspace((current) => ({ ...current, folders: [...current.folders, data as FolderRecord] }))
    toast.success('تم إنشاء المجلد')
    return data as FolderRecord
  }, [user, workspace.folders])

  const uploadFiles = useCallback(async (
    files: File[],
    location: {
      academicYearId: string
      semesterId: string
      tabId: string
      folderId: string | null
    },
  ) => {
    if (!user || files.length === 0) return

    for (const file of files) {
      const extension = getExtension(file.name)
      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        toast.error(`صيغة الملف غير مسموحة: ${file.name}`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`يتجاوز الملف الحد الأقصى 50 م.ب: ${file.name}`)
        continue
      }

      const now = new Date().toISOString()

      if (DEMO_MODE) {
        const record: DocumentRecord = {
          id: crypto.randomUUID(),
          user_id: user.id,
          academic_year_id: location.academicYearId,
          semester_id: location.semesterId,
          tab_id: location.tabId,
          folder_id: location.folderId,
          original_name: file.name,
          display_name: file.name,
          storage_path: `demo/${safeFileName(file.name)}`,
          mime_type: file.type || 'application/octet-stream',
          extension,
          size_bytes: file.size,
          status: 'ready',
          description: null,
          tags: [],
          is_favorite: false,
          is_deleted: false,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        }
        setWorkspace((current) => ({ ...current, documents: [record, ...current.documents] }))
        toast.success(`تم رفع ${file.name}`)
        continue
      }

      const storagePath = `${user.id}/${crypto.randomUUID()}/${safeFileName(file.name)}`
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
          cacheControl: '3600',
        })

      if (storageError) {
        toast.error(`تعذر رفع ${file.name}`)
        continue
      }

      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          academic_year_id: location.academicYearId,
          semester_id: location.semesterId,
          tab_id: location.tabId,
          folder_id: location.folderId,
          original_name: file.name,
          display_name: file.name,
          storage_path: storagePath,
          mime_type: file.type || 'application/octet-stream',
          extension,
          size_bytes: file.size,
          status: 'ready',
        })
        .select()
        .single()

      if (insertError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
        toast.error(`تعذر حفظ بيانات ${file.name}`)
        continue
      }

      setWorkspace((current) => ({
        ...current,
        documents: [data as DocumentRecord, ...current.documents],
      }))
      toast.success(`تم رفع ${file.name}`)
    }
  }, [user])

  const toggleFavorite = useCallback(async (documentId: string) => {
    const document = workspace.documents.find((item) => item.id === documentId)
    if (!document) return
    const nextValue = !document.is_favorite

    setWorkspace((current) => ({
      ...current,
      documents: current.documents.map((item) =>
        item.id === documentId ? { ...item, is_favorite: nextValue } : item,
      ),
    }))

    if (!DEMO_MODE) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ is_favorite: nextValue })
        .eq('id', documentId)
      if (updateError) {
        setWorkspace((current) => ({
          ...current,
          documents: current.documents.map((item) =>
            item.id === documentId ? { ...item, is_favorite: !nextValue } : item,
          ),
        }))
        toast.error('تعذر تحديث المفضلة')
      }
    }
  }, [workspace.documents])

  const softDeleteDocument = useCallback(async (documentId: string) => {
    const deletedAt = new Date().toISOString()
    setWorkspace((current) => ({
      ...current,
      documents: current.documents.map((item) =>
        item.id === documentId ? { ...item, is_deleted: true, deleted_at: deletedAt } : item,
      ),
    }))

    if (!DEMO_MODE) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ is_deleted: true, deleted_at: deletedAt })
        .eq('id', documentId)
      if (updateError) {
        await fetchWorkspace()
        toast.error('تعذر نقل الملف إلى سلة المحذوفات')
        return
      }
    }
    toast.success('تم نقل الملف إلى سلة المحذوفات')
  }, [fetchWorkspace])

  const restoreDocument = useCallback(async (documentId: string) => {
    setWorkspace((current) => ({
      ...current,
      documents: current.documents.map((item) =>
        item.id === documentId ? { ...item, is_deleted: false, deleted_at: null } : item,
      ),
    }))

    if (!DEMO_MODE) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', documentId)
      if (updateError) {
        await fetchWorkspace()
        toast.error('تعذر استعادة الملف')
        return
      }
    }
    toast.success('تمت استعادة الملف')
  }, [fetchWorkspace])

  const downloadDocument = useCallback(async (document: DocumentRecord) => {
    if (DEMO_MODE) {
      toast('المعاينة التجريبية لا تحتوي على ملف فعلي')
      return
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(document.storage_path, 60)

    if (signedUrlError || !data?.signedUrl) {
      toast.error('تعذر إنشاء رابط التنزيل')
      return
    }

    void supabase.rpc('log_document_download', { p_document_id: document.id })

    const anchor = window.document.createElement('a')
    anchor.href = data.signedUrl
    anchor.download = document.display_name
    anchor.rel = 'noopener'
    anchor.click()
  }, [])

  const stats = useMemo(() => {
    const activeDocuments = workspace.documents.filter((item) => !item.is_deleted)
    return {
      documents: activeDocuments.length,
      favorites: activeDocuments.filter((item) => item.is_favorite).length,
      storageBytes: activeDocuments.reduce((total, item) => total + item.size_bytes, 0),
      years: workspace.years.length,
      deleted: workspace.documents.filter((item) => item.is_deleted).length,
    }
  }, [workspace])

  return {
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
  }
}
