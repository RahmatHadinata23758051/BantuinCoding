const SAFE_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/project not found/i, 'Project not found'],
  [/project state .* does not allow/i, 'This action is not available in the project’s current state. Refresh the project and continue from the active workflow step.'],
  [/no active ai provider session/i, 'No active AI provider session found. Please configure your BYOK provider first.'],
  [/answer pending clarification questions/i, 'Answer pending clarification questions before generating a new round.'],
  [/no canonical context/i, 'Canonical context is required before this action can run.'],
  [/project is not exportable/i, 'Project validation must pass before export.'],
  [/project has no current context/i, 'Canonical context is required before export.'],
  [/project documents are not ready for export/i, 'All required documents must be ready before export.'],
  [/duplicate file path|control character detected/i, 'Export contains an unsafe filename. Regenerate the affected document and retry.'],
  [/no core artifacts are required/i, 'The current project plan has no core documents to generate.'],
  [/invalid json body/i, 'Invalid JSON body'],
  [/invalid input/i, 'Invalid input'],
  [/rate limit|429/i, 'Provider rate limit exceeded. Please wait and retry.'],
  // Model-specific errors first — upstream model issues should not blame user's API key
  [/model.*(not found|does not exist|invalid|unavailable|no active credentials for provider)/i, 'The selected provider model is unavailable. Choose another model and retry.'],
  [/no active credentials for provider/i, 'The selected model is currently unavailable in this provider. Choose another model and retry.'],
  [/unauthorized|invalid api key|authentication|401/i, 'Provider rejected the configured credentials. Please verify your API key.'],
  [/rate limit|429/i, 'Provider rate limit exceeded. Please wait and retry.'],
  [/network|fetch failed|econnrefused|enotfound/i, 'Network error while contacting the provider. Check connectivity and retry.'],
  [/schema|validation|parse/i, 'Provider response could not be validated. Retry or choose a more capable model.'],
]

export function getSafeApiErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error)

  for (const [pattern, safeMessage] of SAFE_ERROR_PATTERNS) {
    if (pattern.test(message)) return safeMessage
  }

  return fallback
}
