import { parseArticleMarkdown } from '@/lib/parse-article-md'
import memoryLayerMd from '@/content/articles/memory-layer.md?raw'
import reluLayernormMd from '@/content/articles/relu-layernorm.md?raw'

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'img'; src: string; alt?: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }

export type ArticleSection = {
  id: string
  title: string
  level: 2 | 3
  blocks: ArticleBlock[]
}

export type Article = {
  id: string
  slug: string
  title: string
  date: string
  dateLabel: string
  readingTime: string
  summary: string
  mediumHref: string
  sections: ArticleSection[]
}

export const mediumProfileUrl = 'https://medium.com/@swarajmali31'

export const articles: Article[] = [
  parseArticleMarkdown(memoryLayerMd),
  parseArticleMarkdown(reluLayernormMd),
]

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug)
}
