import { AbsoluteFill, Html5Audio, Sequence, staticFile } from 'remotion'
import { Background } from './components/Background'
import { SceneFade } from './components/SceneFade'
import { IntroScene } from './scenes/IntroScene'
import { OutroScene } from './scenes/OutroScene'
import { ProjectsScene } from './scenes/ProjectsScene'
import { SiteScene } from './scenes/SiteScene'
import { colors, fonts } from './theme'
import { SCENES } from './timeline'

export function Portfolio({ withSound }: { withSound: boolean }) {
  return (
    <AbsoluteFill style={{ fontFamily: fonts.sans, color: colors.foreground }}>
      {withSound ? <Html5Audio src={staticFile('audio/soundtrack.wav')} /> : null}
      <Background />

      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.duration}>
        <SceneFade duration={SCENES.intro.duration} fadeIn={0}>
          <IntroScene duration={SCENES.intro.duration} />
        </SceneFade>
      </Sequence>

      <Sequence from={SCENES.site.from} durationInFrames={SCENES.site.duration}>
        <SceneFade duration={SCENES.site.duration}>
          <SiteScene duration={SCENES.site.duration} />
        </SceneFade>
      </Sequence>

      <Sequence from={SCENES.projects.from} durationInFrames={SCENES.projects.duration}>
        <SceneFade duration={SCENES.projects.duration}>
          <ProjectsScene duration={SCENES.projects.duration} />
        </SceneFade>
      </Sequence>

      <Sequence from={SCENES.outro.from} durationInFrames={SCENES.outro.duration}>
        <SceneFade duration={SCENES.outro.duration} fadeOut={0}>
          <OutroScene />
        </SceneFade>
      </Sequence>
    </AbsoluteFill>
  )
}
