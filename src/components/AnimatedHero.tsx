import { motion } from 'framer-motion'
import {
  Archive,
  CheckCircle2,
  FileImage,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'

const particles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  x: `${8 + ((index * 17) % 84)}%`,
  y: `${5 + ((index * 29) % 88)}%`,
  delay: (index % 7) * 0.34,
  duration: 4.5 + (index % 5) * 0.7,
}))

const fileCards = [
  { className: 'hero-file hero-file--pdf', icon: FileText, label: 'محاضر اللجان', tag: 'PDF' },
  { className: 'hero-file hero-file--sheet', icon: FileSpreadsheet, label: 'كشوف المراجعة', tag: 'XLSX' },
  { className: 'hero-file hero-file--image', icon: FileImage, label: 'شواهد التنفيذ', tag: 'IMG' },
]

export function AnimatedHero() {
  return (
    <div className="animated-hero" aria-hidden="true">
      <div className="animated-hero__glow animated-hero__glow--one" />
      <div className="animated-hero__glow animated-hero__glow--two" />
      <div className="animated-hero__grid" />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="hero-particle"
          style={{ insetInlineStart: particle.x, top: particle.y }}
          animate={{ opacity: [0.15, 0.75, 0.15], y: [0, -10, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        className="hero-orbit hero-orbit--outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="hero-orbit hero-orbit--inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="hero-vault"
        initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 0.7 },
          scale: { type: 'spring', stiffness: 120, damping: 13 },
          rotate: { duration: 0.8 },
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <div className="hero-vault__halo" />
        <div className="hero-vault__body">
          <Archive size={62} strokeWidth={1.5} />
          <span className="hero-vault__lock"><LockKeyhole size={18} /></span>
          <motion.span
            className="hero-vault__scan"
            animate={{ y: [-54, 54, -54], opacity: [0, 0.85, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ScanLine size={78} strokeWidth={1} />
          </motion.span>
        </div>
        <div className="hero-vault__caption">
          <ShieldCheck size={16} />
          <span>تخزين خاص ومشفّر</span>
        </div>
      </motion.div>

      {fileCards.map((file, index) => {
        const Icon = file.icon
        return (
          <motion.div
            key={file.label}
            className={file.className}
            initial={{ opacity: 0, x: index === 1 ? -50 : 50, y: 35 }}
            animate={{ opacity: 1, x: 0, y: [0, index % 2 === 0 ? -7 : 7, 0], rotate: [0, index - 1, 0] }}
            transition={{
              opacity: { delay: 0.35 + index * 0.16, duration: 0.55 },
              x: { delay: 0.35 + index * 0.16, duration: 0.55 },
              y: { delay: index * 0.5, duration: 4 + index * 0.45, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <span className="hero-file__icon"><Icon size={22} /></span>
            <span className="hero-file__text">
              <strong>{file.label}</strong>
              <small>{file.tag}</small>
            </span>
            <CheckCircle2 className="hero-file__check" size={16} />
          </motion.div>
        )
      })}

      <motion.div
        className="hero-security-pill"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.55 }}
      >
        <span className="hero-security-pill__pulse" />
        دخول حصري لحساب واحد
      </motion.div>
    </div>
  )
}
