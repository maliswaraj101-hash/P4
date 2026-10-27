import type { ReactNode } from 'react'

/** Minimal markdown: paragraphs, `-` lists, `code`, and [links](url). */
export function SimpleMarkdown({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\n+/)

  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-current/30 [&_a]:underline-offset-3 [&_a]:transition-colors hover:[&_a]:decoration-current [&_code]:rounded [&_code]:border [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.85em] [&_strong]:font-medium [&_strong]:text-foreground">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean)
        const isList = lines.every((line) => line.trimStart().startsWith('- '))

        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1.5 ps-4">
              {lines.map((line, j) => (
                <li key={j}>{inline(line.replace(/^\s*-\s+/, ''))}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[2] && match[3]) {
      parts.push(
        <a key={key++} href={match[3]} target="_blank" rel="noopener">
          {match[2]}
        </a>,
      )
    } else if (match[4]) {
      parts.push(<code key={key++}>{match[4]}</code>)
    } else if (match[5]) {
      parts.push(<strong key={key++}>{match[5]}</strong>)
    }
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}
