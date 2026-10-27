import { experiences } from '@/data/experience'
import { Panel, PanelHeader, PanelTitle } from '@/components/panel'
import { ExperienceItem } from '@/components/experience-item'

const ID = 'experience'

export function Experience() {
  return (
    <Panel id={ID}>
      <PanelHeader>
        <PanelTitle>
          <a href={`#${ID}`}>Experience</a>
        </PanelTitle>
      </PanelHeader>

      <div className="px-4">
        {experiences.map((experience) => (
          <ExperienceItem key={experience.id} experience={experience} />
        ))}
      </div>
    </Panel>
  )
}
