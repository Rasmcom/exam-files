import {
  Archive,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
} from 'lucide-react'
import { fileIconType } from '../lib/format'

export function FileTypeIcon({ extension, size = 24 }: { extension: string; size?: number }) {
  const type = fileIconType(extension)
  const Icon = {
    pdf: FileText,
    word: FileText,
    sheet: FileSpreadsheet,
    slide: Presentation,
    image: FileImage,
    archive: Archive,
    file: File,
  }[type]

  return (
    <span className={`file-type-icon file-type-icon--${type}`}>
      <Icon size={size} strokeWidth={1.9} />
    </span>
  )
}
