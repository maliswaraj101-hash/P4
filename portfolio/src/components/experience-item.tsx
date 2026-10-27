import type { Experience } from '@/data/experience'
import { ExperiencePositionItem } from '@/components/experience-position-item'

export function ExperienceItem({ experience }: { experience: Experience }) {
  return (
    <div
      id={`experience-${experience.id}`}
      className="group/experience screen-line-bottom scroll-mt-14 space-y-4 py-4"
    >
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex size-5 shrink-0 items-center justify-center select-none">
          {experience.companyLogo ? (
            <img
              src={experience.companyLogo}
              alt=""
              width={20}
              height={20}
              className="size-5 rounded-full bg-background object-cover"
              aria-hidden
            />
          ) : (
            <span className="flex size-5 items-center justify-center rounded-full bg-muted font-mono text-[9px] font-medium text-muted-foreground">
              {experience.companyName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-x-3 gap-y-1 pr-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-xl/6 font-medium">
            {experience.companyWebsite ? (
              <a
                className="decoration-1 underline-offset-3 hover:underline"
                href={experience.companyWebsite}
                target="_blank"
                rel="noopener"
              >
                {experience.companyName}
              </a>
            ) : (
              experience.companyName
            )}
          </h3>

          {experience.location && experience.locationType && (
            <dl className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground sm:flex-nowrap sm:whitespace-nowrap">
              <dt className="sr-only">Location</dt>
              <dd className="min-w-0 sm:truncate">{experience.location}</dd>

              <dt className="sr-only">Location type</dt>
              <dd>({experience.locationType})</dd>

              {experience.isCurrentEmployer && (
                <>
                  <dt className="sr-only">Employment status</dt>
                  <dd>
                    <span className="sr-only">Current</span>
                    <span className="relative flex size-2.5 translate-px items-center justify-center">
                      <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-sky-400 opacity-50" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-sky-400" />
                    </span>
                  </dd>
                </>
              )}
            </dl>
          )}
        </div>
      </div>

      <div className="relative space-y-4 before:absolute before:left-3 before:h-full before:w-px before:bg-border">
        {experience.positions.map((position) => (
          <ExperiencePositionItem key={position.id} position={position} />
        ))}
      </div>
    </div>
  )
}
