import { Composition } from 'remotion'
import { Portfolio } from './Portfolio'
import { DURATION, FPS } from './timeline'

const FORMATS = [
  { id: 'Portfolio16x9', width: 1920, height: 1080 },
  { id: 'Portfolio9x16', width: 1080, height: 1920 },
] as const

export function Root() {
  return (
    <>
      {FORMATS.flatMap((format) =>
        [false, true].map((withSound) => (
          <Composition
            key={`${format.id}-${withSound}`}
            id={withSound ? `${format.id}Sound` : format.id}
            component={Portfolio}
            defaultProps={{ withSound }}
            durationInFrames={DURATION}
            fps={FPS}
            width={format.width}
            height={format.height}
          />
        )),
      )}
    </>
  )
}
