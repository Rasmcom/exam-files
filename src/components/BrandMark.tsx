import { motion } from 'framer-motion'
import { FileCheck2, ShieldCheck } from 'lucide-react'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''}`}>
      <motion.div
        className="brand-mark__symbol"
        initial={{ rotate: -8, scale: 0.94 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      >
        <span className="brand-mark__sheet">
          <FileCheck2 size={compact ? 19 : 24} strokeWidth={2.2} />
        </span>
        <span className="brand-mark__shield">
          <ShieldCheck size={compact ? 11 : 13} strokeWidth={2.5} />
        </span>
      </motion.div>
      <div className="brand-mark__copy">
        <strong>سحابة أعمال الاختبارات</strong>
        {!compact && <span className="brand-mark__school">ثانوية السيدة فاطمة الزهراء بالباحة</span>}
      </div>
    </div>
  )
}
