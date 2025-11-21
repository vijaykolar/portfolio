import clsx from 'clsx'
import type { ReactNode } from 'react'

interface ProseProps {
  children: ReactNode
  className?: string
}

export function Prose({ children, className }: ProseProps) {
  return (
    <div className={clsx(className, 'prose dark:prose-invert')}>{children}</div>
  )
}
