import { ReactLenis } from 'lenis/react'
import type { ReactNode } from 'react'
import 'lenis/dist/lenis.css'

/** Smooth scroll like vedantworks.com (Lenis). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        anchors: true,
        lerp: 0.1,
        smoothWheel: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}
