# DepAid Mobile UX Audit Report
## iPhone SE Viewport (375x667) — Playwright + Source Analysis

**Date:** 2026-05-12  
**Method:** Playwright automated testing (375x667, DPR 2, mobile+touch) + source code analysis  
**Screenshots:** `tests/screenshots/final-*.png`  

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 18 |
| 🟠 High | 14 |
| 🟡 Medium | 87+ |
| **Total** | **119+** |

**Top 3 Issues:**
1. **Pervasive tiny text** — `text-[10px]`, `text-[9px]`, `text-[8px]`, `text-xs` (12px) used extensively, all below the 14px mobile minimum
2. **Undersized tap targets** — Links, buttons, and inputs smaller than 44x44px Apple HIG standard
3. **ECR grade inputs** — `h-8`, `h-7`, `h-6` inputs (24-32px height) are near-impossible to tap on mobile

---

## Page-by-Page Findings

### 1. Homepage (/) — Login/Signup Usability

**Screenshot:** `tests/screenshots/final-01-homepage.png`

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 1 | 🔴 Critical | Tap target too small | "Log in" link: 41x20px (below 44x44) | Add `min-h-[44px]` with `flex items-center`, increase padding |
| 2 | 🟠 High | Tap target too small | "Get Started" CTA: 118x36px (height <44) | Change `py-2` → `py-3` or `h-14` (56px) for mobile CTA |
| 3 | 🔴 Critical | Text too small | `text-[10px]` badge labels ("Auto-Export"): 10px | Change to `text-xs sm:text-sm` (minimum 14px on mobile) |
| 4 | 🟡 Medium | Text too small | `text-xs` badge labels ("The Future of EdTech", "Cloud Synced", "SF1, SF2, SF5"): 12px | Use `text-sm` (14px) on mobile |
| 5 | ✅ Good | Responsive hero CTA | Uses `w-full sm:w-auto h-14` | Acceptable mobile width |
| 6 | ✅ Good | No horizontal overflow | Page fits 375px viewport | — |

### 2. Login (/login) — Auth Form

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 7 | 🔴 Critical | Text too small | `text-[9.6px]` tagline "SUPPORT • FOCUS • EMPOWER" | Change to `text-xs sm:text-sm` |
| 8 | 🔴 Critical | Text too small | `text-[10px]` "Forgot password?" link: 10px | Use `text-sm` (14px) |
| 9 | 🔴 Critical | Text too small | Footer `text-[9.6px]` "Offline-First PWA..." | Change to `text-xs sm:text-sm` |
| 10 | 🟠 High | Text too small | Label `text-[11px]` "Email Address", "Password": 11px | Use `text-sm` (14px) |
| 11 | 🟡 Medium | Text too small | `text-xs` "New to DepAid?" and "Create account": 12px | Use `text-sm` on mobile |
| 12 | 🔴 Critical | Tap target too small | "Forgot password?" link: 88x15px | Add `py-2` padding, min-height 44px |
| 13 | 🔴 Critical | Tap target too small | "Create account" link: 90x15px | Add `py-2` padding, min-height 44px |
| 14 | ✅ Good | Login button sizing | `h-12` button (48px) | Meets 44px minimum |

### 3. Register (/register) — Signup Form

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 15 | 🔴 Critical | Text too small | `text-[9.6px]` "New Account Registration" tagline | Change to `text-xs sm:text-sm` |
| 16 | 🔴 Critical | Text too small | Footer `text-[9.6px]` "DepEd-Compliant..." | Change to `text-xs sm:text-sm` |
| 17 | 🟠 High | Text too small | Step labels `text-[11px]` "Personal Info": 11px | Use `text-sm` |
| 18 | 🟠 High | Text too small | Form labels `text-[11px]`: 11px | Use `text-sm` |
| 19 | 🔴 Critical | Tap target too small | "Sign in here" link: 69x15px | Add `py-2`, min-height 44px |
| 20 | 🟡 Medium | Input width narrow | Password input: only 133px wide on 375px | Ensure `w-full` on all form inputs |

### 4. Dashboard (/dashboard) — Source Analysis

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 21 | 🔴 Critical | Text too small | `text-[10px]` used 7+ times (badges, labels) | Replace with `text-sm` on mobile |
| 22 | 🔴 Critical | Text too small | `text-[9px]` "Smart" badge on AI Suggestions: 9px | Change to `text-[10px] sm:text-xs` minimum |
| 23 | 🟠 High | Text too small | `text-[11px]` quick action buttons: 11px | Change to `text-xs sm:text-sm` |
| 24 | 🟡 Medium | Text too small | `text-xs` used 20+ times throughout page (12px) | Replace with `text-sm` on mobile breakpoint |
| 25 | ✅ Good | Responsive grid | Stat cards use `md:grid-cols-2 lg:grid-cols-4` | Stacks on mobile ✓ |
| 26 | ✅ Good | Table overflow | Masterlist table has `overflow-x-auto` wrapper | ✓ |
| 27 | ✅ Good | Mobile sidebar | Hamburger menu with drawer (`lg:hidden`) | ✓ |
| 28 | ⚠️ Note | Topbar height | `h-14` (56px) topbar | Acceptable but not 48px optimal |

### 5. ECR (/ecr/english) — Grade Input

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 29 | 🔴 Critical | Input height too small | `h-6` (24px), `h-7` (28px), `h-8` (32px) inputs — impossible to tap accurately on mobile | Change to `h-11 sm:h-8` (44px mobile, 32px desktop) |
| 30 | 🔴 Critical | Text too small | `text-[10px]` header labels: 10px | Change to `text-xs sm:text-sm` |
| 31 | 🟡 Medium | Text too small | `text-xs` used 18+ times (column headers, scores): 12px | Acceptable for data tables but use `text-sm` on mobile for key labels |
| 32 | ✅ Good | Table scroll | `overflow-x-auto` wrapper with `min-w-[900px]` table | Horizontal scroll works ✓ |
| 33 | ⚠️ Note | Table shows ~42% | At 375px viewport, only ~375/900px visible | Consider sticky first 2 columns (No. + Name) |

### 6. Settings (/settings) — Forms

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 34 | 🟠 High | Text too small | `text-[11px]` used 4+ times (PIN labels, etc): 11px | Change to `text-sm` |
| 35 | 🟠 High | Input height small | `h-9` (36px) inputs < 44px | Use `h-11 sm:h-9` |
| 36 | 🟠 High | Button height small | `h-8` (32px) buttons < 44px | Use `h-10 sm:h-8` |
| 37 | 🟡 Medium | Text too small | `text-xs` used 2+ times | Use `text-sm` on mobile |
| 38 | 🟡 Medium | Table without responsive wrapper | Subject table likely overflows viewport | Add `overflow-x-auto` wrapper |

### 7. Attendance (/attendance) — Present/Absent

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 39 | 🔴 Critical | Text too small | `text-[8px]` date labels, `text-[9px]` week abbreviation: 8-9px | Minimum `text-[10px] sm:text-xs` — ideally `text-xs` |
| 40 | 🔴 Critical | Text too small | `text-[10px]` used 3+ times (headers, badges): 10px | Change to `text-sm` |
| 41 | 🟡 Medium | Text too small | `text-xs` used 8+ times (cell content, labels): 12px | Use `text-sm` for key interactive labels |
| 42 | ✅ Good | Table overflow | Has `overflow-x-auto` on both card containers | ✓ |
| 43 | ⚠️ | Tap targets | Attendance toggle buttons need visual verification | Ensure `min-h-[44px] min-w-[44px]` on P/A/L buttons |

### 8. Sidebar (All authenticated pages)

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 44 | 🔴 Critical | Text too small | `text-[10px]` nav item descriptions: 10px | Change to `text-xs sm:text-sm` |
| 45 | 🟡 Medium | Text too small | `text-[13px]` nav labels: 13px | Change to `text-sm` (14px) |
| 46 | 🟡 Medium | Text too small | `text-xs` footer school info: 12px | Acceptable for secondary info |

### 9. Topbar (All authenticated pages)

| # | Severity | Issue | Detail | Fix |
|---|----------|-------|--------|-----|
| 47 | 🔴 Critical | Text too small | `text-[9px]` 2+ instances (profile label, notification badge): 9px | Minimum `text-[10px] sm:text-xs` |
| 48 | 🔴 Critical | Text too small | `text-[10px]` 3+ instances (notification items, online badge): 10px | Change to `text-xs sm:text-sm` |
| 49 | 🟠 High | Text too small | `text-[11px]` profile user name: 11px | Use `text-sm` |
| 50 | 🟡 Medium | Text too small | `text-xs` used 5+ times: 12px | Use `text-sm` on mobile |
| 51 | 🟠 High | Tap target small | Notification bell button: 32x32px | Increase to `h-9 w-9 sm:h-8 w-8` (36→32 mobile first) |

---

## Systemic Issues

### 1. Text Sizing (Most Critical)
**Pattern:** Over 80 instances of `text-xs` (12px), `text-[10px]` (10px), `text-[9px]` (9px), `text-[8px]` across all pages.

**Root Cause:** No mobile-first text sizing strategy. Tailwind's `text-xs` (12px) and `text-[10px]` are fine for desktop data-dense UIs but too small on mobile.

**Recommended Fix (Global):**
```tsx
// Add to globals.css or tailwind config
@media (max-width: 640px) {
  // Minimum 14px body text, 12px for data table cells only
  body { font-size: 14px; }
}

// Or use responsive Tailwind classes:
"text-sm sm:text-xs"    // 14px mobile, 12px desktop
"text-[11px] sm:text-[10px]"  // 11px mobile, 10px desktop
```

### 2. Tap Target Sizing
**Pattern:** Multiple interactive elements below 44x44px minimum.

**Recommended Fix:**
```tsx
// Buttons and links: minimum h-11 (44px) on mobile
className="h-11 sm:h-9 ..." 

// Navigation links: add padding for 44px hit area
className="min-h-[44px] flex items-center px-3 ..."

// Input fields: minimum h-11 (44px) on mobile  
className="h-11 sm:h-9 ..."

// Icon buttons: min 44x44 with transparent padding
className="h-11 w-11 sm:h-8 sm:w-8 ..."
```

### 3. ECR Grade Input Mobile
**Critical Issue:** Grade input fields are 24-32px tall — nearly impossible to tap on a 375px phone screen.

**Fix:**
```tsx
// In ECR grade input cells, use responsive sizing:
<Input className="h-11 w-full sm:h-8 sm:w-14 ..." />

// Consider sticky first 2 columns on mobile:
<TableCell className="sticky left-0 bg-white z-10 ...">
```

---

## Screenshot Paths

| File | Description |
|------|-------------|
| `tests/screenshots/final-01-homepage.png` | Homepage viewport (375x667) |
| `tests/screenshots/final-01-homepage-full.png` | Homepage full page |
| `tests/screenshots/final-02-login.png` | Login page viewport |
| `tests/screenshots/final-02-login-full.png` | Login page full |
| `tests/screenshots/final-03-register.png` | Register page viewport |
| `tests/screenshots/final-03-register-full.png` | Register page full |
| `tests/screenshots/live-issues.json` | JSON report of live-tested issues |
| `tests/screenshots/source-issues.json` | JSON report of source-analyzed issues |

---

## Priority Fix Order

1. **🔴 P0 — ECR Input Heights:** Change all grade inputs to `h-11 sm:h-8` (blocks teacher grade entry on mobile)
2. **🔴 P0 — Login/Register Tap Targets:** Add `min-h-[44px]` to all links (`Forgot password?`, `Create account`, `Sign in`)
3. **🔴 P0 — Global text-[10px]/text-[9px]/text-[8px]:** Replace with `text-sm` or `text-xs sm:text-[10px]` minimum
4. **🟠 P1 — Homepage CTA height:** Increase "Get Started" button to `h-14` on mobile
5. **🟠 P1 — Topbar/Sidebar tiny text:** Replace `text-[9px]`/`text-[10px]` with `text-xs sm:text-[10px]`
6. **🟡 P2 — Global text-xs → text-sm on mobile:** Bulk replace `text-xs` with `text-sm sm:text-xs` for body text
7. **🟡 P2 — Icon buttons:** Add `min-h-[44px] min-w-[44px]` to all icon-only buttons