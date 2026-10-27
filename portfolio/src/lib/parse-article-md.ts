import type { Article, ArticleBlock, ArticleSection } from '@/data/articles'

type Frontmatter = {
  id: string
  slug: string
  title: string
  date: string
  readingTime: string
  summary: string
  mediumHref: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) throw new Error('Article markdown is missing frontmatter')

  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    meta[key] = value
  }

  const required = [
    'id',
    'slug',
    'title',
    'date',
    'readingTime',
    'summary',
    'mediumHref',
  ] as const
  for (const key of required) {
    if (!meta[key]) throw new Error(`Missing frontmatter field: ${key}`)
  }

  return { meta: meta as Frontmatter, body: match[2].trim() }
}

function formatDateLabel(date: string) {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function flushParagraph(
  lines: string[],
  blocks: ArticleBlock[],
  lastImgSrc: { value: string | null },
) {
  const text = lines.join('\n').trim()
  lines.length = 0
  if (!text) return

  const onlyImages = [
    ...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g),
  ]
  const stripped = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim()
  if (onlyImages.length && !stripped) {
    for (const img of onlyImages) {
      const src = img[2]
      if (src === lastImgSrc.value) continue
      lastImgSrc.value = src
      blocks.push({ type: 'img', src, alt: img[1] || undefined })
    }
    return
  }

  lastImgSrc.value = null
  blocks.push({ type: 'p', text })
}

function parseBlocks(body: string): ArticleSection[] {
  const lines = body.split(/\r?\n/)
  const sections: ArticleSection[] = []
  let current: ArticleSection = {
    id: 'introduction',
    title: '',
    level: 2,
    blocks: [],
  }
  const para: string[] = []
  const lastImgSrc = { value: null as string | null }

  const pushSection = () => {
    flushParagraph(para, current.blocks, lastImgSrc)
    if (current.blocks.length > 0 || current.title) sections.push(current)
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const heading = line.match(/^(#{2,3})\s+(.+)$/)
    if (heading) {
      pushSection()
      const level = heading[1].length === 3 ? 3 : 2
      current = {
        id: slugify(heading[2]),
        title: heading[2].trim(),
        level,
        blocks: [],
      }
      i += 1
      continue
    }

    if (/^\s*$/.test(line)) {
      flushParagraph(para, current.blocks, lastImgSrc)
      i += 1
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph(para, current.blocks, lastImgSrc)
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim())
        i += 1
      }
      lastImgSrc.value = null
      current.blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph(para, current.blocks, lastImgSrc)
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim())
        i += 1
      }
      lastImgSrc.value = null
      current.blocks.push({ type: 'ol', items })
      continue
    }

    const imgOnly = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imgOnly) {
      flushParagraph(para, current.blocks, lastImgSrc)
      const src = imgOnly[2]
      if (src !== lastImgSrc.value) {
        lastImgSrc.value = src
        current.blocks.push({
          type: 'img',
          src,
          alt: imgOnly[1] || undefined,
        })
      }
      i += 1
      continue
    }

    para.push(line)
    i += 1
  }

  pushSection()

  if (sections.length === 0) {
    return [{ id: 'article', title: '', level: 2, blocks: [] }]
  }

  // Drop empty intro section title when content starts with a heading
  if (sections[0].title === '' && sections[0].blocks.length === 0) {
    return sections.slice(1)
  }

  return sections
}

export function parseArticleMarkdown(raw: string): Article {
  const { meta, body } = parseFrontmatter(raw)
  return {
    id: meta.id,
    slug: meta.slug,
    title: meta.title,
    date: meta.date,
    dateLabel: formatDateLabel(meta.date),
    readingTime: meta.readingTime,
    summary: meta.summary,
    mediumHref: meta.mediumHref,
    sections: parseBlocks(body),
  }
}
