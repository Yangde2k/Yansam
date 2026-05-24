# YANSAM Deployment Guide

This guide is for turning the project into a real shared app for you and your partner.

## What you need
- 1 free **Supabase** account
- 1 free **Vercel** account
- this project folder: `yansam/`

---

## 1) Create Supabase
1. Go to Supabase and create a new project.
2. Wait for the database to finish provisioning.
3. Open:
   - **Project Settings → API**
4. Copy these values:
   - `Project URL`
   - `anon public key`

You will use them in Vercel later as:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 2) Apply the database schema
1. In Supabase, open **SQL Editor**.
2. Copy everything from:
   - `supabase/schema.sql`
3. Run it.

This creates:
- auth-connected profile tables
- couple space model
- invites
- memories / albums / photos / letters / moods / milestones / wishes / notifications
- row-level security
- couple-scoped storage policies

---

## 3) Configure auth URLs in Supabase
Open:
- **Authentication → URL Configuration**

Set these later once Vercel gives you your live domain:
- **Site URL** = your live app URL
- **Redirect URLs** should include:
  - `https://your-app.vercel.app/login`
  - `http://localhost:5173/login`

Keep localhost while developing.

---

## 4) Create a Vercel project
1. Create a Vercel account.
2. Upload or import the `yansam/` project.
3. Framework should be detected as **Vite**.
4. Build settings should be:
   - Build command: `npm run build`
   - Output directory: `dist`

---

## 5) Add environment variables in Vercel
In Vercel project settings, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the exact values from Supabase.

Then redeploy.

---

## 6) Update Supabase URLs after first deploy
After Vercel gives you a real URL:
1. go back to Supabase
2. open **Authentication → URL Configuration**
3. update:
   - **Site URL**
   - **Redirect URLs**

This is important for:
- login
- forgot password
- session redirects

---

## 7) Test on 2 phones
### Phone 1
- sign up
- create invite code
- set anniversary date
- add a memory
- add an album/photo

### Phone 2
- sign up
- accept invite code
- verify shared data appears
- test letters, moods, timeline, and future plans

---

## 8) Test privacy/security
Make sure these work:
- partner invite joins only one shared couple room
- app lock opens with the local passcode on each device
- lock on background works
- inactivity lock works
- photos only load for the correct couple
- deleting or replacing photos updates the gallery correctly

---

## 9) Install as an app on Android
After deployment:
1. open the live URL in Chrome on Android
2. log in
3. open **Settings** in YANSAM
4. use the install option when available
5. or use Chrome → **Add to Home Screen** / **Install App**

The project already includes:
- manifest
- service worker
- install prompt prep
- Android-friendly standalone setup

---

## If the app opens but says env vars are missing
That means Vercel does not have:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Add them in Vercel and redeploy.

---

## Files related to deployment
- `README.md`
- `DEPLOYMENT_GUIDE.md`
- `vercel.json`
- `public/manifest.json`
- `public/sw.js`
- `supabase/schema.sql`

---

## Best next step after deployment
Once the app is live, the next improvements should be:
- refine invite edge cases
- add stronger onboarding for the second partner
- add richer notification/reminder logic
- package with Capacitor for a more native Android release
