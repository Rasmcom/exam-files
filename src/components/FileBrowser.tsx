import { AnimatePresence, motion } from 'framer-motion'
import {
  Download,
  Heart,
  MoreHorizontal,
  RotateCcw,
  SearchX,
  Trash2,
} from 'lucide-react'
import { FileTypeIcon } from './FileTypeIcon'
import { formatFileSize, formatRelativeDate } from '../lib/format'
import type { DocumentRecord, WorkspaceTab } from '../types/database'

interface FileBrowserProps {
  documents: DocumentRecord[]
  tabs: WorkspaceTab[]
  mode: 'grid' | 'list'
  trashMode?: boolean
  onFavorite: (id: string) => void
  onDownload: (document: DocumentRecord) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onPermanentDelete?: (id: string) => void | Promise<void>
  emptyTitle?: string
  emptyDescription?: string
}

function TrashMoreMenu({
  documentId,
  onPermanentDelete,
}: {
  documentId: string
  onPermanentDelete: (id: string) => void | Promise<void>
}) {
  return (
    <details className="file-more-menu">
      <summary className="icon-button icon-button--soft" aria-label="المزيد">
        <MoreHorizontal size={18} />
      </summary>
      <div className="file-more-menu__popover">
        <button
          type="button"
          className="file-more-menu__danger"
          onClick={(event) => {
            event.currentTarget.closest('details')?.removeAttribute('open')
            void onPermanentDelete(documentId)
          }}
        >
          <Trash2 size={16} />
          حذف نهائي
        </button>
      </div>
    </details>
  )
}

export function FileBrowser({
  documents,
  tabs,
  mode,
  trashMode = false,
  onFavorite,
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete = () => undefined,
  emptyTitle = 'لا توجد ملفات هنا',
  emptyDescription = 'ارفع ملفات جديدة أو غيّر معايير البحث.',
}: FileBrowserProps) {
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon"><SearchX size={30} /></span>
        <h3>{emptyTitle}</h3>
        <p>{emptyDescription}</p>
      </div>
    )
  }

  if (mode === 'list') {
    return (
      <div className="file-table">
        <div className="file-table__head">
          <span>اسم الملف</span>
          <span>التبويب</span>
          <span>الحجم</span>
          <span>آخر تحديث</span>
          <span aria-hidden="true" />
        </div>
        <AnimatePresence initial={false}>
          {documents.map((document) => {
            const tab = tabs.find((item) => item.id === document.tab_id)
            return (
              <motion.div
                key={document.id}
                className="file-table__row"
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <div className="file-table__name">
                  <FileTypeIcon extension={document.extension} />
                  <div>
                    <strong title={document.display_name}>{document.display_name}</strong>
                    <small>{document.extension.toUpperCase()}</small>
                  </div>
                </div>
                <span className="file-table__tab">{tab?.name ?? 'غير مصنف'}</span>
                <span>{formatFileSize(document.size_bytes)}</span>
                <span>{formatRelativeDate(document.updated_at)}</span>
                <div className="file-actions">
                  {!trashMode ? (
                    <>
                      <button
                        type="button"
                        className={`icon-button icon-button--soft ${document.is_favorite ? 'is-favorite' : ''}`}
                        onClick={() => onFavorite(document.id)}
                        aria-label="المفضلة"
                      >
                        <Heart size={17} fill={document.is_favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--soft"
                        onClick={() => onDownload(document)}
                        aria-label="تنزيل"
                      >
                        <Download size={17} />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--soft icon-button--danger"
                        onClick={() => onDelete(document.id)}
                        aria-label="حذف"
                      >
                        <Trash2 size={17} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="restore-button" onClick={() => onRestore(document.id)}>
                        <RotateCcw size={16} />
                        استعادة
                      </button>
                      <TrashMoreMenu documentId={document.id} onPermanentDelete={onPermanentDelete} />
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="file-grid">
      <AnimatePresence initial={false}>
        {documents.map((document, index) => {
          const tab = tabs.find((item) => item.id === document.tab_id)
          return (
            <motion.article
              key={document.id}
              className="file-card"
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(index * 0.035, 0.2) }}
              layout
            >
              <div className="file-card__top">
                <FileTypeIcon extension={document.extension} size={27} />
                {!trashMode ? (
                  <button
                    type="button"
                    className={`icon-button icon-button--soft ${document.is_favorite ? 'is-favorite' : ''}`}
                    onClick={() => onFavorite(document.id)}
                    aria-label="المفضلة"
                  >
                    <Heart size={17} fill={document.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                ) : (
                  <TrashMoreMenu documentId={document.id} onPermanentDelete={onPermanentDelete} />
                )}
              </div>

              <div className="file-card__body">
                <h3 title={document.display_name}>{document.display_name}</h3>
                <p>{tab?.name ?? 'غير مصنف'}</p>
              </div>

              <div className="file-card__meta">
                <span>{formatFileSize(document.size_bytes)}</span>
                <span>{formatRelativeDate(document.updated_at)}</span>
              </div>

              <div className="file-card__footer">
                {!trashMode ? (
                  <>
                    <button type="button" onClick={() => onDownload(document)}>
                      <Download size={16} />
                      تنزيل
                    </button>
                    <button type="button" className="danger-link" onClick={() => onDelete(document.id)}>
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button type="button" className="restore-button restore-button--wide" onClick={() => onRestore(document.id)}>
                    <RotateCcw size={16} />
                    استعادة الملف
                  </button>
                )}
              </div>
            </motion.article>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
