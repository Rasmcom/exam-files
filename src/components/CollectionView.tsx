import { useMemo, useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DocumentRecord, WorkspaceTab } from '../types/database'
import { DEMO_MODE, STORAGE_BUCKET } from '../lib/constants'
import { supabase } from '../lib/supabase'
import { FileBrowser } from './FileBrowser'
import { ViewToolbar } from './ViewToolbar'

interface CollectionViewProps {
  type: 'favorites' | 'trash'
  documents: DocumentRecord[]
  tabs: WorkspaceTab[]
  search: string
  onFavorite: (id: string) => void
  onDownload: (document: DocumentRecord) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
}

export function CollectionView({
  type,
  documents,
  tabs,
  search,
  onFavorite,
  onDownload,
  onDelete,
  onRestore,
}: CollectionViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [permanentlyDeletedIds, setPermanentlyDeletedIds] = useState<Set<string>>(() => new Set())
  const isTrash = type === 'trash'

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return documents.filter((document) => {
      if (permanentlyDeletedIds.has(document.id)) return false
      if (isTrash ? !document.is_deleted : document.is_deleted || !document.is_favorite) return false
      if (!query) return true
      return [document.display_name, document.extension, ...document.tags]
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [documents, isTrash, permanentlyDeletedIds, search])

  async function handlePermanentDelete(documentId: string) {
    const document = documents.find((item) => item.id === documentId)
    if (!document || !document.is_deleted) return

    const confirmed = window.confirm(
      `سيتم حذف «${document.display_name}» نهائيًا من التخزين وقاعدة البيانات، ولن يمكن استعادته. هل تريد المتابعة؟`,
    )
    if (!confirmed) return

    if (DEMO_MODE) {
      setPermanentlyDeletedIds((current) => new Set(current).add(documentId))
      toast.success('تم حذف الملف نهائيًا')
      return
    }

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([document.storage_path])

    if (storageError) {
      console.error('Permanent storage delete failed', storageError)
      toast.error('تعذر حذف الملف من التخزين. لم يتم حذف السجل.')
      return
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('is_deleted', true)
      .select('id')

    if (deleteError || !deletedRows?.length) {
      console.error('Permanent document delete failed', deleteError)
      toast.error('حُذف الملف من التخزين، لكن تعذر حذف سجله من قاعدة البيانات. حاول مرة أخرى.')
      return
    }

    setPermanentlyDeletedIds((current) => new Set(current).add(documentId))
    toast.success('تم حذف الملف نهائيًا')
  }

  return (
    <div className="collection-view">
      <header className="page-title">
        <div>
          <span className="page-title__kicker">{isTrash ? 'الملفات المحذوفة' : 'الوصول السريع'}</span>
          <h1>{isTrash ? 'سلة المحذوفات' : 'الملفات المفضلة'}</h1>
          <p>
            {isTrash
              ? 'يمكن استعادة الملفات المحذوفة قبل حذفها نهائيًا من النظام.'
              : 'الملفات التي وضعتها في المفضلة لتصل إليها بسرعة.'}
          </p>
        </div>
        <span className={`page-title__symbol ${isTrash ? 'page-title__symbol--trash' : ''}`}>
          {isTrash ? <Trash2 size={26} /> : <Heart size={26} />}
        </span>
      </header>

      <ViewToolbar
        title={isTrash ? 'الملفات المحذوفة' : 'المفضلة'}
        count={visible.length}
        mode={viewMode}
        onModeChange={setViewMode}
      />

      <FileBrowser
        documents={visible}
        tabs={tabs}
        mode={viewMode}
        trashMode={isTrash}
        onFavorite={onFavorite}
        onDownload={onDownload}
        onDelete={onDelete}
        onRestore={onRestore}
        onPermanentDelete={handlePermanentDelete}
        emptyTitle={isTrash ? 'سلة المحذوفات فارغة' : 'لا توجد ملفات مفضلة'}
        emptyDescription={isTrash
          ? 'الملفات التي تحذفها ستظهر هنا مؤقتًا.'
          : 'اضغط على رمز القلب في أي ملف لإضافته إلى المفضلة.'}
      />
    </div>
  )
}
