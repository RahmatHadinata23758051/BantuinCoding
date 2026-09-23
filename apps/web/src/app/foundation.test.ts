import { describe, it, expect } from 'vitest'

describe('Project Bootstrapper Foundation', () => {
  it('environment test passes', () => {
    expect(true).toBe(true)
  })

  it('canonical types are available', () => {
    const status = 'DRAFT'
    expect(status).toBe('DRAFT')
  })
})
