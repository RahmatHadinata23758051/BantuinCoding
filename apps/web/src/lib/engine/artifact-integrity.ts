const REQUIRED_SECTIONS: Record<string, number> = {
  ARCHITECTURE: 8,
}

/** Checks structural requirements without imposing a document-length threshold. */
export function validateArtifactIntegrity(type: string, content: string): string[] {
  const issues: string[] = []
  const foundSections: number[] = []
  const lines = content.split(/\r?\n/)
  let openFence: { marker: string; line: number } | undefined

  for (const [index, line] of lines.entries()) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (openFence) {
      if (
        fence &&
        fence[1][0] === openFence.marker[0] &&
        fence[1].length >= openFence.marker.length &&
        /^\s*$/.test(fence[2])
      ) {
        openFence = undefined
      }
      continue
    }

    if (fence) {
      openFence = { marker: fence[1], line: index + 1 }
      continue
    }

    const heading = line.match(/^#{1,6}\s+(?:section\s+)?(\d{1,2})(?!\.\d)(?:[.)\s:—-]|\s*$)/i)
    if (heading) foundSections.push(Number(heading[1]))
  }

  if (openFence) issues.push(`Unclosed fenced code block opened on line ${openFence.line}.`)

  const requiredSections = REQUIRED_SECTIONS[type]
  if (requiredSections) {
    let previous = -1
    for (let section = 1; section <= requiredSections; section++) {
      const index = foundSections.indexOf(section)
      if (index < 0) {
        issues.push(`Missing required section ${section} of ${requiredSections}.`)
      } else if (index <= previous) {
        issues.push(`Required section ${section} is out of order.`)
      } else {
        previous = index
      }
    }
  }

  return issues
}
