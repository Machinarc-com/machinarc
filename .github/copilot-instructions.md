# Copilot instructions for Machinarc

## Project overview
- This workspace is a React + TypeScript + Vite app styled with Tailwind CSS.
- Main app entry points are in src/ and the build command is npm run build.

## Working conventions
- Prefer minimal, targeted changes.
- Preserve existing app structure and naming patterns.
- Keep UI changes consistent with the current design system.
- For auth-related work, verify Supabase configuration and callback handling carefully.

## Verification
- After code changes, run npm run build before considering the work complete.
- If environment variables are involved, make sure the change does not break local development defaults.

## Important notes
- The app uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for browser auth.
- Do not introduce service-role-style secrets into the frontend bundle.
- Keep the auth flow compatible with PKCE-based OAuth.
