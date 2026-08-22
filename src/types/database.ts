export type FileStatus = 'ready' | 'uploading' | 'quarantined' | 'failed'

export interface Profile {
  id: string
  full_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface AcademicYear {
  id: string
  user_id: string
  label: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Semester {
  id: string
  user_id: string
  academic_year_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface WorkspaceTab {
  id: string
  user_id: string
  semester_id: string
  name: string
  description: string | null
  icon: string
  accent: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface FolderRecord {
  id: string
  user_id: string
  tab_id: string
  parent_id: string | null
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DocumentRecord {
  id: string
  user_id: string
  academic_year_id: string
  semester_id: string
  tab_id: string
  folder_id: string | null
  original_name: string
  display_name: string
  storage_path: string
  mime_type: string
  extension: string
  size_bytes: number
  status: FileStatus
  description: string | null
  tags: string[]
  is_favorite: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  document_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface WorkspaceSnapshot {
  years: AcademicYear[]
  semesters: Semester[]
  tabs: WorkspaceTab[]
  folders: FolderRecord[]
  documents: DocumentRecord[]
}
