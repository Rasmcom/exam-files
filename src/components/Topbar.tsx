import { Bell, ChevronDown, Menu, Search, UploadCloud } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { AcademicYear } from '../types/database'

interface TopbarProps {
  user: User
  years: AcademicYear[]
  selectedYearId: string
  onYearChange: (yearId: string) => void
  search: string
  onSearchChange: (value: string) => void
  onMenu: () => void
  onUpload: () => void
}

export function Topbar({
  user,
  years,
  selectedYearId,
  onYearChange,
  search,
  onSearchChange,
  onMenu,
  onUpload,
}: TopbarProps) {
  const fullName = String(user.user_metadata?.full_name || 'مدير البوابة')
  const initials = fullName.split(' ').slice(0, 2).map((part) => part[0]).join('')

  return (
    <header className="topbar">
      <div className="topbar__start">
        <button type="button" className="topbar__menu icon-button" onClick={onMenu} aria-label="فتح القائمة">
          <Menu size={21} />
        </button>
        <label className="topbar-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ابحث في الملفات والتبويبات..."
          />
          <kbd>⌘ K</kbd>
        </label>
      </div>

      <div className="topbar__actions">
        <button type="button" className="topbar-upload" onClick={onUpload}>
          <UploadCloud size={18} />
          رفع ملف
        </button>

        <label className="year-select">
          <span className="year-select__label">العام الدراسي</span>
          <span className="year-select__control">
            <select value={selectedYearId} onChange={(event) => onYearChange(event.target.value)}>
              {years.map((year) => (
                <option key={year.id} value={year.id}>{year.label}</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </span>
        </label>

        <button type="button" className="notification-button icon-button" aria-label="الإشعارات">
          <Bell size={20} />
          <span />
        </button>

        <div className="topbar-user">
          <span className="topbar-user__avatar">{initials || 'م'}</span>
          <span className="topbar-user__copy">
            <strong>{fullName}</strong>
            <small>الحساب المصرح</small>
          </span>
        </div>
      </div>
    </header>
  )
}
