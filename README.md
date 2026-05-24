# YANSAM

A modern mobile-first private couple app scaffold based on your brief.

## Included

- React + Vite + TypeScript
- Tailwind CSS + Framer Motion
- React Router
- Zustand toast store
- React Hook Form
- TanStack Query for server state
- Supabase auth/data/storage wiring
- Mobile-first glassmorphism UI
- Shared pages for:
  - auth
  - home dashboard
  - memory diary
  - photo gallery / albums
  - relationship timeline
  - private letters
  - daily moods
  - future plans
  - special moments
  - settings / invite flow / anniversary / passcode scaffold
- Supabase SQL schema with RLS policies

## Project structure

```txt
yansam/
  public/
  src/
    components.tsx
    context/AuthContext.tsx
    lib/
      api.ts
      supabase.ts
      utils.ts
    pages/
      auth-pages.tsx
      app-pages.tsx
    store/ui.ts
    types.ts
  supabase/schema.sql
```

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env` and fill in:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Install dependencies and run:

```bash
npm install
npm run dev
```

## Notes

- The file picker uses `accept="image/*"` with **no** forced `capture` attribute, so mobile upload opens the native gallery/file picker instead of the camera.
- Album cover URLs are re-signed with cache-busting so stale covers are less likely to persist.
- Core CRUD is implemented across the main content areas included in the UI.
- Invite flow now supports active invite tracking, code revocation, safer acceptance checks, and stricter 2-user couple enforcement through database functions.
- Invite flow uses a shareable invite code rather than email sending so it works without an extra backend function.
- App lock is now built into the real app flow with local passcode, background locking, and auto-lock timeout options.
- Route-based code splitting for lighter page loads and cleaner Android-friendly performance.
- Page intro cards and skeleton loading states for a more polished premium feel while data loads.
- Android install prompt handling in Settings once the live app is deployed under proper PWA conditions.
- Basic service worker + manifest setup now included for deployment-ready PWA installability.
- Storage policies are tightened to the `couple_id/...` folder structure so authenticated users can only access files that belong to their couple space.
- True biometric support would usually be added later in a native wrapper (Capacitor / React Native) or a device-specific integration layer.

## Recommended next upgrades

- add dedicated notifications engine / edge functions
- add signed audio uploads for memory songs
- add unit tests and E2E flows
- add richer charts for mood analytics
- package with Capacitor for Android release builds

If you want, I can also do the **next step** for you:
1. clean up and test this scaffold,
2. add missing advanced features,
3. or turn it into a deploy-ready version for Vercel + Supabase.

## Deployment help

Use `DEPLOYMENT_GUIDE.md` for the exact step-by-step setup with Supabase + Vercel.
