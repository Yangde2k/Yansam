# YANSAM Production Roadmap

Goal: turn the current scaffold into a real shared, secure, Android-friendly couple app for exactly 2 users.

## Chosen direction
- Android-first experience
- installable PWA first, Android packaging next
- extra privacy layer
- premium polished UI
- Supabase backend
- invite-only 2-user model

## Current progress
- ✅ local app lock flow added
- ✅ background / inactivity re-lock behavior added
- ✅ UI preferences now persist across sessions
- ✅ last protected route is remembered after login
- ✅ storage security tightened to couple-scoped folders in Supabase schema
- ✅ route-based code splitting and lighter page bundles added
- ✅ polished page intros, loading skeletons, and Android install prompt prep added
- ✅ deployment guide, Vercel config, service worker, and missing-env screen added
- ✅ invite flow hardened with active-invite tracking, revoke flow, safer acceptance checks, and couple-space RPC helpers
- ⏳ next: live account setup and end-to-end testing on two devices

## Phase 1 — App hardening
- tighten route guards
- add app lock screen flow
- add stronger empty/loading/error states
- improve mobile nav and gestures
- add persistence for local UI preferences
- clean up forms and validation

## Phase 2 — Real backend security
- finalize Supabase schema
- harden row-level security policies
- secure storage bucket structure
- invite-only partner linking flow
- enforce max 2 users per couple space
- add safer profile/couple join checks

## Phase 3 — Core shared features
- memories CRUD with photo uploads
- gallery/albums/photos CRUD
- letters CRUD with unlock logic
- moods CRUD + chart/trends
- milestones CRUD + reorder
- future plans CRUD + reorder
- special surprise pages CRUD

## Phase 4 — Private experience upgrades
- local passcode lock
- session timeout option
- app resume lock option
- safer sign-out behavior
- better cache busting for updated media
- export/import options for personal backups

## Phase 5 — Android-first packaging
- PWA install polish
- app icons / splash assets
- Capacitor packaging prep
- Android build notes
- device-safe storage guidance

## Phase 6 — Deployment
- create Supabase project
- apply SQL schema
- add env values
- deploy frontend
- test partner invite flow
- test two real devices

## What the user will still need to do outside this workspace
Because accounts and deployment belong to you, these steps cannot be fully completed by the assistant alone:
1. create a Supabase account/project
2. create a frontend hosting account (Vercel / Netlify / Cloudflare Pages)
3. paste env keys
4. deploy once

## Recommended order from here
1. harden the current `yansam/` app
2. make it deployment-ready
3. guide the user step-by-step through free account setup
4. ship a live private couple app
