import type { TechSkill } from '@/data/experience'

export type Project = {
  id: string
  title: string
  description: string
  image: string
  href?: string
  repo?: string
  tech: TechSkill[]
}

export const projects: Project[] = [
  {
    id: 'aitwin',
    title: 'AI Twin',
    description:
      'Device-rendered conversational AI avatars — plug in your agent, get real-time face + voice with no session or concurrency limits.',
    image: '/projects/aitwin.png',
    href: 'https://aitwin.me/',
    tech: [
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Next.js', slug: 'nextdotjs', invert: true },
      { name: 'React', slug: 'react' },
      { name: 'Python', slug: 'python' },
    ],
  },
  {
    id: 'streamoji-avatars',
    title: 'Streamoji Avatars',
    description:
      'Create realistic, fully-rigged 3D avatars from photos for games, apps, and virtual worlds — 1M+ ready-to-use characters.',
    image: '/projects/streamoji-avatars.jpg',
    href: 'https://avatars.streamoji.com/',
    tech: [
      { name: 'Next.js', slug: 'nextdotjs', invert: true },
      { name: 'React', slug: 'react' },
      { name: 'Three.js', slug: 'threedotjs', invert: true },
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Python', slug: 'python' },
    ],
  },
  {
    id: 'docforge',
    title: 'DocForge',
    description:
      'Multi-agent code review for a GitHub file — Tree-sitter, call graphs, static analysis, LangGraph agents, and human-in-the-loop approval.',
    image: '/projects/docforge.png',
    repo: 'https://github.com/Swaraj07082/DocForge',
    tech: [
      { name: 'Python', slug: 'python' },
      { name: 'FastAPI', slug: 'fastapi' },
      { name: 'LangGraph', slug: 'langchain' },
      { name: 'Next.js', slug: 'nextdotjs', invert: true },
      { name: 'TypeScript', slug: 'typescript' },
    ],
  },
  {
    id: 'curator',
    title: 'The Curator',
    description:
      'AI-assisted technical writing workflow that turns a topic into a structured, publish-ready Markdown draft — LangGraph research, planning, and section writing.',
    image: '/projects/curator.png',
    repo: 'https://github.com/Swaraj07082/BlogAgent',
    tech: [
      { name: 'Next.js', slug: 'nextdotjs', invert: true },
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'FastAPI', slug: 'fastapi' },
      { name: 'LangGraph', slug: 'langchain' },
      { name: 'PostgreSQL', slug: 'postgresql' },
    ],
  },
]
