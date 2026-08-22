import type { ReactNode } from 'react'
import { Grid2X2, List, SlidersHorizontal } from 'lucide-react'

interface ViewToolbarProps {
  title: string
  count: number
  mode: 'grid' | 'list'
  onModeChange: (mode: 'grid' | 'list') => void
  action?: ReactNode
}

export function ViewToolbar({ title, count, mode, onModeChange, action }: ViewToolbarProps) {
  return (
    <div className="view-toolbar">
      <div className="view-toolbar__title">
        <h2>{title}</h2>
        <span>{count} ملف</span>
      </div>
      <div className="view-toolbar__actions">
        {action}
        <button type="button" className="filter-button">
          <SlidersHorizontal size={17} />
          تصفية
        </button>
        <span className="view-switch">
          <button
            type="button"
            className={mode === 'grid' ? 'is-active' : ''}
            onClick={() => onModeChange('grid')}
            aria-label="عرض شبكي"
          >
            <Grid2X2 size={17} />
          </button>
          <button
            type="button"
            className={mode === 'list' ? 'is-active' : ''}
            onClick={() => onModeChange('list')}
            aria-label="عرض قائمة"
          >
            <List size={18} />
          </button>
        </span>
      </div>
    </div>
  )
}
