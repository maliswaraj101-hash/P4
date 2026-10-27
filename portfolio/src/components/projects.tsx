import type { SVGProps } from 'react'
import { projects, type Project } from '@/data/projects'
import { Panel, PanelContent, PanelHeader } from '@/components/panel'
import { TechStackIcons } from '@/components/tech-stack-icons'

export function Projects() {
  return (
    <Panel id="work">
      <PanelHeader className="py-3">
        <h2 className="font-mono text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Featured Projects
        </h2>
      </PanelHeader>

      <PanelContent className="pt-2 pb-6">
        <ul className="grid gap-8 sm:grid-cols-2 sm:gap-6">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </PanelContent>
    </Panel>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group/project flex flex-col gap-3">
      <a
        href={project.href ?? project.repo}
        target="_blank"
        rel="noopener"
        className="block overflow-hidden rounded-xl border border-line bg-muted/30"
      >
        <img
          src={project.image}
          alt=""
          className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 ease-out group-hover/project:scale-[1.02]"
          loading="lazy"
        />
      </a>

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium tracking-tight text-foreground">
          {project.href || project.repo ? (
            <a
              href={project.href ?? project.repo}
              target="_blank"
              rel="noopener"
              className="hover:underline hover:decoration-current/30 hover:underline-offset-3"
            >
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </h3>

        <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noopener"
              aria-label={`${project.title} on GitHub`}
              className="rounded p-0.5 transition-colors hover:text-foreground"
            >
              <GitHubIcon className="size-4" />
            </a>
          )}
          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener"
              aria-label={`${project.title} live site`}
              className="inline-flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Live
              <ArrowUpRightIcon className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      <TechStackIcons skills={project.tech} />
    </article>
  )
}

function ArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 0C5.37 0 0 5.372 0 11.997c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.086 1.84 1.24 1.84 1.24 1.07 1.835 2.807 1.305 3.492.997.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.334-5.466-5.932 0-1.31.468-2.382 1.235-3.222-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.12 3.176.77.84 1.233 1.911 1.233 3.222 0 4.61-2.805 5.628-5.478 5.921.43.37.814 1.103.814 2.223 0 1.606-.015 2.902-.015 3.293 0 .32.216.694.825.576C20.565 21.793 24 17.295 24 11.997 24 5.372 18.627 0 12 0" />
    </svg>
  )
}
