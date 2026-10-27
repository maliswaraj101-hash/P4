import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export function FlipSentences({
  sentences,
  className,
}: {
  sentences: string[]
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce || sentences.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % sentences.length)
    }, 3000)
    return () => window.clearInterval(id)
  }, [reduce, sentences.length])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        <motion.p
          key={sentences[index]}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="pr-8 font-mono text-sm text-muted-foreground text-pretty sm:pr-0"
        >
          {sentences[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
