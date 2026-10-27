'use client'

import { useEffect, useId, useRef } from 'react'
import type { Transition } from 'motion/react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'

import { metalClickSound } from '@/lib/metal-click'
import { useClickSound } from '@/hooks/use-click-sound'
import {
  SM_FACE_PATHS,
  SM_FACE_PRESS_Y,
  SM_SIDE_PATHS,
  SM_SIDE_PATHS_PRESSED,
  SM_SIDE_STROKE,
  SM_SIDE_STROKE_PRESSED,
  SM_VIEW,
} from '@/components/sm-extrude-paths'

const transition: Transition = {
  type: 'spring',
  mass: 0.5,
  damping: 18,
  stiffness: 200,
}

/**
 * Scale the SM mark around the viewBox center (guides stay put).
 * 1 = current size. Try 1.1–1.2.
 */
const SM_SCALE = 1.062

/**
 * SM isometric mark from Figma Fast Isometric (`extrude-group (1).svg`),
 * wired like ncdai Spotlight Logo: hatch tops, cursor stroke, press, click.
 * Caps paint after sides so overlapping side geometry is hidden.
 */
export function MarkIsometric() {
  const id = useId()
  const ids = {
    facePattern: `sm-face-pattern-${id}`,
    faceFill: `sm-face-fill-${id}`,
    sideFill: `sm-side-fill-${id}`,
    sideStroke: `sm-side-stroke-${id}`,
    radialGradient: `sm-radial-gradient-${id}`,
  }

  const ref = useRef<SVGSVGElement>(null)
  const play = useClickSound(metalClickSound.dataUri)

  const shouldReduceMotion = useReducedMotion()
  const isInView = useInView(ref, { margin: '80px' })

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const cx = useSpring(useTransform(mouseX, [0, 1], [0, SM_VIEW.w]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  const cy = useSpring(useTransform(mouseY, [0, 1], [0, SM_VIEW.h]), {
    stiffness: 300,
    damping: 30,
    mass: 0.1,
  })

  useEffect(() => {
    if (shouldReduceMotion || !isInView) return
    if (window.matchMedia('(hover: none)').matches) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [shouldReduceMotion, isInView, mouseX, mouseY])

  return (
    <motion.svg
      ref={ref}
      className="h-auto w-full touch-manipulation [--pattern:color-mix(in_oklab,var(--foreground)_12%,var(--background))] [--stroke:color-mix(in_oklab,var(--foreground)_16%,var(--background))]"
      viewBox={`0 0 ${SM_VIEW.w} ${SM_VIEW.h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      initial="normal"
      whileTap="pressed"
      onTap={() => play()}
    >
      <defs>
        <pattern
          id={ids.facePattern}
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M-1 1l2 -2M0 10l10 -10M9 11l2 -2"
            stroke="var(--pattern)"
            strokeWidth="1"
          />
        </pattern>

        <motion.g
          id={ids.faceFill}
          variants={{
            normal: { y: 0 },
            pressed: { y: SM_FACE_PRESS_Y },
          }}
          transition={transition}
        >
          {SM_FACE_PATHS.map((d) => (
            <path key={d.slice(0, 24)} d={d} />
          ))}
        </motion.g>

        <motion.path
          id={ids.sideFill}
          variants={{
            normal: { d: SM_SIDE_PATHS.join('') },
            pressed: { d: SM_SIDE_PATHS_PRESSED.join('') },
          }}
          transition={transition}
        />

        <motion.path
          id={ids.sideStroke}
          variants={{
            normal: { d: SM_SIDE_STROKE },
            pressed: { d: SM_SIDE_STROKE_PRESSED },
          }}
          transition={transition}
        />

        <motion.radialGradient
          id={ids.radialGradient}
          cx={cx}
          cy={cy}
          r="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            className="dark:[stop-color:#fff]"
            stopColor="var(--color-zinc-700)"
          />
          <stop
            className="dark:[stop-color:var(--color-zinc-600)]"
            offset="1"
            stopColor="var(--color-zinc-400)"
            stopOpacity="0"
          />
        </motion.radialGradient>
      </defs>

      {/* Exact guide lines from chanhdai CD mark — do not change. */}
      <g className="stroke-line" strokeWidth="1" strokeDasharray="4 2">
        <path d="M-477.55 756.57L1254.51 -243.41" />
        <path d="M977.37 788.58L-754.67 -211.42" />
        <path d="M1143.65 692.58L-588.39 -307.42" />
      </g>

      <g
        transform={`translate(${SM_VIEW.w / 2} ${SM_VIEW.h / 2}) scale(${SM_SCALE}) translate(${-SM_VIEW.w / 2} ${-SM_VIEW.h / 2})`}
      >
        {/* Sides first — any overlap is covered by caps below */}
        <use
          href={`#${ids.sideFill}`}
          className="fill-background"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        <use href={`#${ids.sideStroke}`} stroke="var(--stroke)" />
        <use
          href={`#${ids.sideStroke}`}
          stroke={`url(#${ids.radialGradient})`}
        />

        {/* Caps on top (fill + hatch + outline) */}
        <use href={`#${ids.faceFill}`} className="fill-background" />
        <use href={`#${ids.faceFill}`} fill={`url(#${ids.facePattern})`} />
        <use href={`#${ids.faceFill}`} stroke="var(--stroke)" />
        <use
          href={`#${ids.faceFill}`}
          stroke={`url(#${ids.radialGradient})`}
        />
      </g>
    </motion.svg>
  )
}
