import { describe, expect, it } from 'vitest'
import { validateArtifactIntegrity } from './artifact-integrity'

describe('validateArtifactIntegrity', () => {
  it('passes complete ARCHITECTURE.md with all 8 numbered sections and closed fences', () => {
    const validArch = `
# System Architecture
## 1. System Overview
Overview prose.
## 2. Selected Technology Stack
Tech stack.
## 3. System Component Breakdown
Components.
## 4. Data Flow & Sequences
Flows.
## 5. Security Architecture
Security details.
## 6. Storage & Database Design
DB details.
## 7. Deployment Expectations
Deployment.
## 8. System Architecture Graph
\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
`
    expect(validateArtifactIntegrity('ARCHITECTURE', validArch)).toEqual([])
  })

  it('rejects ARCHITECTURE.md truncated at section 4.2', () => {
    const truncatedArch = `
# System Architecture
## 1. System Overview
## 2. Tech Stack
## 3. Components
## 4. Data Flow
### 4.1 Sync
### 4.2 Webhook
The webhook listener receives
`
    const issues = validateArtifactIntegrity('ARCHITECTURE', truncatedArch)
    expect(issues.some((issue) => issue.includes('Missing required section 5'))).toBe(true)
    expect(issues.some((issue) => issue.includes('Missing required section 8'))).toBe(true)
  })

  it('detects unclosed code fences', () => {
    const unclosed = `
# Doc
\`\`\`typescript
const x = 1
`
    const issues = validateArtifactIntegrity('DOC', unclosed)
    expect(issues).toContain('Unclosed fenced code block opened on line 3.')
  })

  it('detects sections out of order', () => {
    const outOfOrder = `
## 2. Second
## 1. First
`
    const issues = validateArtifactIntegrity('ARCHITECTURE', outOfOrder)
    expect(issues.some((issue) => issue.includes('out of order'))).toBe(true)
  })
})
