// ChatGPT's OAuth client only allows localhost redirect URIs (this is the one
// Codex CLI registers). The user completes sign-in in their browser, the
// redirect to localhost fails to load, and they paste the resulting URL back
// into the app — see components/ChatGPTSignIn.tsx.
export const OAUTH_REDIRECT_URI =
  process.env.OPENAI_OAUTH_REDIRECT_URI || 'http://localhost:1455/auth/callback'