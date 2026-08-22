export const APP_NAME = 'سحابة أعمال الاختبارات'
export const APP_DESCRIPTION = 'مساحة إلكترونية آمنة لتنظيم وحفظ وأرشفة جميع أعمال الاختبارات'
export const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'exam-files'
export const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || '').trim().toLowerCase()
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const ACCEPTED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'txt',
  'csv',
  'zip',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024

export const DEFAULT_TAB_NAMES = [
  'التعاميم المنظمة',
  'تشكيل اللجان',
  'اجتماعات الاختبارات',
  'جداول الاختبارات',
  'أسئلة الاختبارات',
  'نماذج الإجابة',
  'أعمال الرصد والمراجعة',
  'محاضر اللجان',
  'تقارير الاختبارات',
]

export const TAB_ACCENTS = ['violet', 'blue', 'amber', 'rose', 'cyan'] as const
