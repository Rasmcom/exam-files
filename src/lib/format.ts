export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت'
  const units = ['بايت', 'ك.ب', 'م.ب', 'ج.ب']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export function formatArabicDate(value: string): string {
  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatRelativeDate(value: string): string {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `قبل ${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `قبل ${hours} ساعة`
  const days = Math.floor(hours / 24)
  if (days < 7) return `قبل ${days} يوم`
  return formatArabicDate(value)
}

export function safeFileName(name: string): string {
  return name
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

export function getExtension(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export function fileIconType(extension: string): 'pdf' | 'word' | 'sheet' | 'slide' | 'image' | 'archive' | 'file' {
  if (extension === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(extension)) return 'word'
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'sheet'
  if (['ppt', 'pptx'].includes(extension)) return 'slide'
  if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'image'
  if (extension === 'zip') return 'archive'
  return 'file'
}
