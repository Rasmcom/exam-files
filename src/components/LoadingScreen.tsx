import { motion } from 'framer-motion'
import { BrandMark } from './BrandMark'

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <BrandMark />
      <div className="loading-screen__dots" aria-label="جاري التحميل">
        {[0, 1, 2].map((item) => (
          <motion.span
            key={item}
            animate={{ y: [0, -7, 0], opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: item * 0.14 }}
          />
        ))}
      </div>
    </div>
  )
}
