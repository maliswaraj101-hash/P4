export type TechSkill = {
  name: string
  /** simpleicons.org slug */
  slug: string
  /** Force light glyph for dark backgrounds (Next.js, Express, etc.) */
  invert?: boolean
}

export type ExperiencePosition = {
  id: string
  title: string
  /**
   * Employment period. Use "MM.YYYY" or "YYYY". Omit `end` for Present.
   */
  employmentPeriod: {
    start: string
    end?: string
  }
  employmentType?: string
  /** Markdown-ish description: `- bullet` lines and [links](url). */
  description?: string
  /** Icon key rendered in IconTile */
  icon?: 'code' | 'briefcase' | 'lightbulb'
  skills?: Array<string | TechSkill>
  isExpanded?: boolean
}

export type Experience = {
  id: string
  companyName: string
  companyLogo?: string
  companyWebsite?: string
  location?: string
  locationType?: 'On-site' | 'Hybrid' | 'Remote'
  positions: ExperiencePosition[]
  isCurrentEmployer?: boolean
}

export const experiences: Experience[] = [
  {
    id: 'streamoji',
    companyName: 'Streamoji',
    companyLogo: '/companies/streamoji.png',
    companyWebsite: 'https://streamoji.com',
    location: 'Remote',
    locationType: 'Remote',
    isCurrentEmployer: true,
    positions: [
      {
        id: 'streamoji-intern',
        title: 'AI/3D Intern',
        employmentPeriod: {
          start: '10.2025',
        },
        employmentType: 'Internship',
        icon: 'code',
        isExpanded: true,
        description: `- Implemented RAG agents with hybrid vector+keyword search, website crawl ingestion, and an embeddable 3D avatar widget with STT/TTS and sentiment-based lead capture.
- Built a computer-vision pipeline using YOLO hair detection and DeepLabV3/FCN segmentation (IoU 0.80–0.92), plus Gabor/FFT vector search to match hairstyles from selfies.
- Shipped real-time voice AI with Pipecat WebSockets, viseme lipsync, and Recall.ai meeting bots — browser rendering, zero server GPU per user; sub-300ms latency.
- Developed avatar lipsync pipeline (LivePortrait → RIFE → 539-cell diff atlas) and published [@streamoji/aitwin](https://www.npmjs.com/package/@streamoji/aitwin) npm SDK for embeddable speaking avatars.`,
        skills: [
          { name: 'TypeScript', slug: 'typescript' },
          { name: 'Python', slug: 'python' },
          { name: 'PyTorch', slug: 'pytorch' },
          { name: 'Next.js', slug: 'nextdotjs', invert: true },
          { name: 'React', slug: 'react' },
          { name: 'Three.js', slug: 'threedotjs', invert: true },
          { name: 'npm', slug: 'npm' },
        ],
      },
    ],
  },
  {
    id: 'deloitte',
    companyName: 'Deloitte Capstone Program',
    companyLogo: '/companies/deloitte.svg',
    companyWebsite: 'https://www.deloitte.com',
    location: 'Remote',
    locationType: 'Remote',
    positions: [
      {
        id: 'deloitte-participant',
        title: 'Participant',
        employmentPeriod: {
          start: '04.2025',
          end: '07.2025',
        },
        employmentType: 'Capstone',
        icon: 'briefcase',
        isExpanded: true,
        description: `Built [AuditEMS](https://github.com/Swaraj07082/AuditEMS) — Financial Compliance Audit Agent.

- LangGraph compliance-audit agent that ingests financial PDFs via an MCP OCR server and generates structured audit reports against Schedule III standards.
- Human-in-the-loop workflow using LangGraph \`interrupt()\` and a \`/resume\` API so users can approve or reject missing sections before the audit continues.
- Integrated Groq LLMs with Pydantic structured outputs, Postgres checkpointing, and a Next.js document-upload UI for end-to-end audit automation.`,
        skills: [
          { name: 'LangGraph', slug: 'langchain' },
          { name: 'Python', slug: 'python' },
          { name: 'PostgreSQL', slug: 'postgresql' },
          { name: 'Next.js', slug: 'nextdotjs', invert: true },
          { name: 'TypeScript', slug: 'typescript' },
          { name: 'Pydantic', slug: 'pydantic' },
        ],
      },
    ],
  },
  {
    id: 'sdc-muj',
    companyName: 'Software Development Centre, MUJ',
    companyLogo: '/companies/sdc-muj.png',
    companyWebsite: 'https://jaipur.manipal.edu',
    location: 'Jaipur, Rajasthan, India',
    locationType: 'Hybrid',
    positions: [
      {
        id: 'sdc-intern',
        title: 'Software Development Intern',
        employmentPeriod: {
          start: '12.2024',
          end: '02.2025',
        },
        employmentType: 'Internship',
        icon: 'code',
        isExpanded: true,
        description: `Developed and deployed a scalable backend system for managing student leave requests, hosted on Render and Vercel.

- Designed RESTful APIs to handle real-time leave request submission, approval workflows, and status tracking between students and administrators.
- Implemented secure data handling and optimized database operations using PostgreSQL and Prisma ORM for reliability and performance.`,
        skills: [
          { name: 'Node.js', slug: 'nodedotjs' },
          { name: 'Express.js', slug: 'express', invert: true },
          { name: 'Prisma ORM', slug: 'prisma' },
          { name: 'React.js', slug: 'react' },
          { name: 'MongoDB', slug: 'mongodb' },
          { name: 'PostgreSQL', slug: 'postgresql' },
          { name: 'REST', slug: 'postman' },
        ],
      },
    ],
  },
]
