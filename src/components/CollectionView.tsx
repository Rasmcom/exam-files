import { useMemo, useState } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import type { DocumentRecord, WorkspaceTab } from '../types/database'
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
  const isTrash = type === 'trash'

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return documents.filter((document) => {
      if (isTrash ? !document.is_deleted : document.is_deleted || !document.is_favorite) return false
      if (!query) return true
      return [document.display_name, document.extension, ...document.tags]
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [documents, isTrash, search])

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
        emptyTitle={isTrash ? 'سلة المحذوفات فارغة' : 'لا توجد ملفات مفضلة'}
        emptyDescription={isTrash
          ? 'الملفات التي تحذفها ستظهر هنا مؤقتًا.'
          : 'اضغط على رمز القلب في أي ملف لإضافته إلى المفضلة.'}
      />
    </div>
  )
}
