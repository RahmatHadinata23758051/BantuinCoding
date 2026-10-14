import { describe, it, expect } from 'vitest'
import {
  PROJECT_CLASSIFICATIONS,
  ProjectClassificationSchema,
  ProjectClassifierSchema,
  buildProjectClassifierUserPrompt,
  PROJECT_CLASSIFIER_SYSTEM_PROMPT,
} from '@/lib/prompts/project-classifier'

describe('Project Classifier Prompt & Schema', () => {
  it('contains exactly 11 supported archetypes', () => {
    expect(PROJECT_CLASSIFICATIONS).toHaveLength(11)
    expect(PROJECT_CLASSIFICATIONS).toEqual([
      'STATIC_SITE',
      'LANDING_PAGE',
      'CRUD_APP',
      'DASHBOARD',
      'SAAS',
      'API_SERVICE',
      'MOBILE_APP',
      'AI_APP',
      'IOT_DASHBOARD',
      'FULLSTACK_COMPLEX',
      'OTHER',
    ])
  })

  it('validates supported archetypes successfully', () => {
    for (const archetype of PROJECT_CLASSIFICATIONS) {
      const parsed = ProjectClassificationSchema.safeParse(archetype)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data).toBe(archetype)
      }
    }
  })

  it('rejects unsupported archetypes', () => {
    const invalidTypes = ['BOT', 'CLI', 'EXTENSION', 'DESKTOP', 'UNKNOWN', '']
    for (const invalid of invalidTypes) {
      const parsed = ProjectClassificationSchema.safeParse(invalid)
      expect(parsed.success).toBe(false)
    }
  })

  it('validates strictly conforming structured output', () => {
    const valid = {
      classification: 'SAAS',
      confidence: 'high',
      reasoning: 'Multi-tenant subscription platform with billing',
    }
    const result = ProjectClassifierSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('strictly rejects unexpected extra properties', () => {
    const withExtra = {
      classification: 'API_SERVICE',
      confidence: 'medium',
      reasoning: 'Backend REST API',
      extraField: 'not-allowed',
    }
    const result = ProjectClassifierSchema.safeParse(withExtra)
    expect(result.success).toBe(false)
  })

  it('builds prompt with Indonesian directive for id language', () => {
    const prompt = buildProjectClassifierUserPrompt('Toko Online', 'Aplikasi e-commerce', 'id')
    expect(prompt).toContain('Project Name: Toko Online')
    expect(prompt).toContain('Indonesian or English')
    expect(prompt).toContain('Aplikasi e-commerce')
  })

  it('builds prompt with English directive for en language', () => {
    const prompt = buildProjectClassifierUserPrompt('Analytics Hub', 'Dashboard for charts', 'en')
    expect(prompt).toContain('Project Name: Analytics Hub')
    expect(prompt).toContain('English')
    expect(prompt).toContain('Dashboard for charts')
  })

  it('system prompt mentions all 11 archetypes and instructions', () => {
    expect(PROJECT_CLASSIFIER_SYSTEM_PROMPT).toContain('11 supported project archetypes')
    for (const archetype of PROJECT_CLASSIFICATIONS) {
      expect(PROJECT_CLASSIFIER_SYSTEM_PROMPT).toContain(archetype)
    }
  })
})
