import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, title, description, onClose, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onClose()
          }}
        >
          <motion.section
            className={`modal-card modal-card--${size}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            <header className="modal-card__header">
              <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
              </div>
              <button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق">
                <X size={20} />
              </button>
            </header>
            <div className="modal-card__body">{children}</div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
