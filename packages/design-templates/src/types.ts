export type TemplateFamilyId =
  | 'structured-enterprise'
  | 'editorial-craft'
  | 'precision-technical'
  | 'expressive-creative'
  | 'calm-and-human'
  | 'refined-luxury'

export type ScreenArchetypeId =
  | 'operational-workspace'
  | 'management-overview'
  | 'transactional-flow'

export interface DesignTokens {
  canvas: string
  surface: string
  surfaceMuted: string
  text: string
  textMuted: string
  accent: string
  border: string
  success: string
  warning: string
  danger: string
}

export interface TypographyTokens {
  headingFont: string
  bodyFont: string
  monoFont: string
}

export interface TemplateFamilyMeta {
  id: TemplateFamilyId
  name: string
  version: string
  archetype: string
  thesis: string
  mood: string
  fit: string[]
  watchOuts: string[]
  signatureMoves: string[]
  tokens: DesignTokens
  typography: TypographyTokens
  supportedArchetypes: ScreenArchetypeId[]
}

export interface DesignBlueprint {
  familyId: TemplateFamilyId
  familyVersion: string
  contextVersion: number
  screenArchetypes: ScreenArchetypeId[]
  recipeSelections: Record<string, string>
  tokens: DesignTokens
  typography: TypographyTokens
  designDecisions: string[]
  constraintsPassed: boolean
  status: 'DRAFT' | 'APPROVED'
}
