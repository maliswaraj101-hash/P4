import { cn } from '@/lib/utils'
import type { TechSkill } from '@/data/experience'

export function TechStackIcons({
  skills,
  className,
}: {
  skills: Array<string | TechSkill>
  className?: string
}) {
  const items = skills.map((skill) =>
    typeof skill === 'string'
      ? ({ name: skill, slug: 'github', invert: true } satisfies TechSkill)
      : skill,
  )

  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((skill) => (
        <li key={skill.name} className="group/tech relative">
          <span
            role="img"
            aria-label={skill.name}
            tabIndex={0}
            className="inline-flex size-4.5 cursor-default items-center justify-center outline-none"
          >
            <img
              src={`https://cdn.simpleicons.org/${skill.slug}`}
              alt=""
              width={16}
              height={16}
              className={cn(
                'size-4 opacity-90 transition-opacity group-hover/tech:opacity-100 group-focus-within/tech:opacity-100',
                // Brand colors in light mode; white glyphs only in dark when needed
                skill.invert ? 'dark:hidden' : null,
              )}
              loading="lazy"
            />
            {skill.invert ? (
              <img
                src={`https://cdn.simpleicons.org/${skill.slug}/ffffff`}
                alt=""
                width={16}
                height={16}
                className="hidden size-4 opacity-90 transition-opacity group-hover/tech:opacity-100 group-focus-within/tech:opacity-100 dark:block"
                loading="lazy"
              />
            ) : null}
          </span>
          <span
            role="tooltip"
            className={cn(
              'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2',
              'rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg ring-1 ring-white/10',
              'opacity-0 transition-opacity duration-150',
              'group-hover/tech:opacity-100 group-focus-within/tech:opacity-100',
              'after:absolute after:top-full after:left-1/2 after:-translate-x-1/2',
              'after:border-4 after:border-transparent after:border-t-zinc-900',
            )}
          >
            {skill.name}
          </span>
        </li>
      ))}
    </ul>
  )
}
