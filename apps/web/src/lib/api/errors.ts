const SAFE_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/project not found/i, 'Project not found'],
  [/project state .* does not allow/i, 'This action is not available in the project’s current state. Refresh the project and continue from the active workflow step.'],
  [/no active ai provider session/i, 'No active AI provider session found. Please configure your BYOK provider first.'],
  [/answer pending clarification questions/i, 'Answer pending clarification questions before generating a new round.'],
  [/no canonical context/i, 'Canonical context is required before this action can run.'],
  [/invalid json body/i, 'Invalid JSON body'],
  [/invalid input/i, 'Invalid input'],
  [/rate limit|429/i, 'Provider rate limit exceeded. Please wait and retry.'],
  [/unauthorized|invalid api key|authentication|401/i, 'Provider rejected the configured credentials. Please verify your API key.'],
  [/model.*(not found|does not exist|invalid|unavailable)/i, 'The selected provider model is unavailable. Choose another model and retry.'],
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
