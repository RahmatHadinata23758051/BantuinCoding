import { registerAction } from '@/lib/auth/actions'

// Wrapper satisfies Next.js form action type (void return)
async function handleRegister(formData: FormData): Promise<void> {
  'use server'
  await registerAction(formData)
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            Project Bootstrapper
          </span>
          <h1 className="mt-1 text-xl font-semibold text-zinc-50">Create account</h1>
        </div>

        <form action={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="name"
              className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Already have an account?{' '}
          <a href="/login" className="text-zinc-400 hover:text-zinc-200 underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
