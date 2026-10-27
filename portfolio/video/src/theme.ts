import { loadFont as loadGeist } from '@remotion/google-fonts/Geist'
import { loadFont as loadGeistMono } from '@remotion/google-fonts/GeistMono'
import { Easing, useVideoConfig, type InterpolateOptions } from 'remotion'

const geist = loadGeist('normal', { weights: ['400', '500', '600'], subsets: ['latin'] })
const geistMono = loadGeistMono('normal', { weights: ['400', '500'], subsets: ['latin'] })

export const fonts = {
  sans: geist.fontFamily,
  mono: geistMono.fontFamily,
}

/** Dark-mode tokens from src/index.css (.dark), resolved to sRGB. */
export const colors = {
  background: '#09090b',
  foreground: '#fafafa',
  muted: '#27272a',
  mutedForeground: '#9f9fa9',
  border: '#27272a',
  card: '#111113',
  chrome: '#18181b',
}

export const clamp: InterpolateOptions = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
}

export const easeInOut: InterpolateOptions = {
  ...clamp,
  easing: Easing.inOut(Easing.cubic),
}

export function useIsPortrait() {
  const { width, height } = useVideoConfig()
  return height > width
}
