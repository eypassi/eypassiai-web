# Eypassiai Browser App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local browser version of Eypassiai that uses the same Supabase users, tables, storage buckets, and Edge Functions as the iOS app.

**Architecture:** Create a React/Vite SPA in the existing `eypassiai-web` repository. Use Supabase Auth for sessions, RLS-protected CRUD directly from the browser, storage uploads for receipts/documents, and Supabase Edge Functions for AI workflows.

**Tech Stack:** React, TypeScript, Vite, `@supabase/supabase-js`, CSS modules/global CSS.

---

### Task 1: Scaffold Web App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Modify: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/supabase.ts`

- [ ] Create Vite/React project files while preserving `privacy.html`, `terms.html`, and `CNAME`.
- [ ] Add Supabase client configured with the existing project URL and anon key.
- [ ] Add global app styling matching the dark/lime Eypassiai design.
- [ ] Run `npm install`.
- [ ] Run `npm run build`.

### Task 2: Same-User Auth

**Files:**
- Modify: `src/App.tsx`

- [ ] Implement email/password login using Supabase Auth.
- [ ] Implement registration using Supabase Auth.
- [ ] Implement password recovery.
- [ ] Subscribe to auth state changes.
- [ ] Verify the same live Supabase users can log in.

### Task 3: Core Data Modules

**Files:**
- Modify: `src/App.tsx`

- [ ] Add dashboard stats.
- [ ] Add CRUD for properties.
- [ ] Add CRUD for units.
- [ ] Add CRUD for tenants.
- [ ] Add CRUD for contracts.
- [ ] Add CRUD for transactions.
- [ ] Add basic views for travel expenses, AfA, utility billing, and portfolio snapshots.

### Task 4: Receipts and Documents

**Files:**
- Modify: `src/App.tsx`

- [ ] Upload receipts into the `receipts` storage bucket.
- [ ] Link uploaded receipt URLs to transactions.
- [ ] Provide receipt search and signed downloads.
- [ ] Upload documents into the `documents` storage bucket.
- [ ] Provide document search and signed downloads.

### Task 5: AI Workflows

**Files:**
- Modify: `src/App.tsx`

- [ ] Require explicit AI consent before scan and chat.
- [ ] Call `scan-receipt` Edge Function with selected images.
- [ ] Let users create a transaction from scan results.
- [ ] Call `doc-chat` Edge Function for document questions.

### Task 6: Verification

**Commands:**
- `npm run build`
- Start dev server and inspect local URL in browser.

- [ ] Build passes.
- [ ] Local app loads.
- [ ] Login form renders.
- [ ] Authenticated app shell renders.
- [ ] Core views can query Supabase without compile errors.
