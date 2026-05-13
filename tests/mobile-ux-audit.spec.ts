import { test, expect, Page, BrowserContext } from '@playwright/test'

const VP = { width: 375, height: 667 }
const BASE = 'http://127.0.0.1:3001'

const devState = {
  cookies: [] as any[],
  origins: [{
    origin: BASE,
    localStorage: [{
      name: 'teacher-store',
      value: JSON.stringify({
        state: {
          user: { isDev: true, email: 'test@depid.local', user_metadata: { full_name: 'Test Teacher' } },
          teacherPin: '1234',
          students: [
            { lrn: '123456789012', name: 'Del Cruz, Juan', sex: 'M', status: 'Enrolled' },
            { lrn: '123456789013', name: 'Santos, Maria', sex: 'F', status: 'Enrolled' },
            { lrn: '123456789014', name: 'Reyes, Pedro', sex: 'M', status: 'Enrolled' },
            { lrn: '123456789015', name: 'Garcia, Ana', sex: 'F', status: 'Enrolled' },
            { lrn: '123456789016', name: 'Lim, Carlos', sex: 'M', status: 'Enrolled' },
          ],
          schoolInfo: {
            schoolName: 'TEST SCHOOL', schoolId: '000000', district: 'Test',
            division: 'Test', region: 'I', gradeLevel: '8', section: 'TEST',
            schoolYear: '2025-2026', quarter: '1', adviserName: 'Test Teacher',
            schoolHeadName: 'Test Principal',
          },
          workload: [
            { id: '1', subject: 'English', section: 'TEST', students: 5, schedule: 'MWF 8-9',
              scheduleDays: ['Mon','Wed','Fri'], startTime: '08:00', endTime: '09:00',
              slug: 'english', gradient: 'from-blue-500 to-blue-700' }
          ],
          grades: {}, attendance: {}, subjectAttendance: {},
          books: {}, sf3Subjects: [], sf2Summaries: {}, workloadStudents: {},
        },
        version: 0,
      }),
    }],
  }],
}

test.use({ viewport: VP, baseURL: BASE, actionTimeout: 15000, navigationTimeout: 60000 })

test.describe.configure({ timeout: 120000, retries: 1 })

async function collectIssues(page: Page, selectors: { text?: string; taps?: string; minTextPx?: number }) {
  const issues: any[] = []
  const minTextPx = selectors.minTextPx || 14

  // Text size check
  if (selectors.text) {
    const els = await page.locator(selectors.text).all()
    for (const el of els) {
      if (!(await el.isVisible().catch(() => false))) continue
      const fs = await el.evaluate(e => parseFloat(window.getComputedStyle(e).fontSize)).catch(() => 0)
      if (fs > 0 && fs < minTextPx) {
        const tag = await el.evaluate(e => e.tagName + '.' + (e.className?.toString?.()?.substring(0, 50) || '')).catch(() => '?')
        issues.push({ type: 'text-too-small', severity: fs < 11 ? 'critical' : fs < 12 ? 'high' : 'medium', detail: `${tag}: ${fs}px < ${minTextPx}px` })
      }
    }
  }

  // Tap target check
  if (selectors.taps) {
    const els = await page.locator(selectors.taps).all()
    for (const el of els) {
      if (!(await el.isVisible().catch(() => false))) continue
      const box = await el.boundingBox().catch(() => null)
      if (box && (box.width < 44 || box.height < 44)) {
        const tag = await el.evaluate(e => e.tagName + '.' + (e.className?.toString?.()?.substring(0, 50) || '')).catch(() => '?')
        issues.push({ type: 'tap-target-small', severity: (box.width < 32 || box.height < 32) ? 'critical' : 'high', detail: `${tag}: ${Math.round(box.width)}x${Math.round(box.height)}px` })
      }
    }
  }

  // Horizontal overflow
  const hasOverflow = await page.evaluate(() => {
    const max = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth)
    return max > window.innerWidth + 2
  })
  if (hasOverflow) {
    issues.push({ type: 'horizontal-overflow', severity: 'high', detail: 'Page wider than viewport' })
  }

  // Content cutoff
  const cutoffs = await page.evaluate(() => {
    const vpW = window.innerWidth
    const r: string[] = []
    const walk = (el: Element) => {
      const rect = el.getBoundingClientRect()
      if (rect.right > vpW + 5 && rect.width < 1200 && rect.width > 10 && rect.width > vpW * 0.5) {
        r.push(`${el.tagName}.${(el.className?.toString?.() || '').substring(0, 30)}: right=${Math.round(rect.right)}px`)
      }
      for (const c of el.children) walk(c)
    }
    walk(document.body)
    return r.slice(0, 5)
  })
  for (const c of cutoffs) {
    issues.push({ type: 'content-cutoff', severity: 'medium', detail: c })
  }

  return issues
}

test('1. Homepage (/)', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'tests/screenshots/01-homepage.png', fullPage: false })
  await page.screenshot({ path: 'tests/screenshots/01-homepage-full.png', fullPage: true })
  
  const issues = await collectIssues(page, { text: 'p, span, a, label', taps: 'a, button', minTextPx: 14 })
  console.log('=== HOMEPAGE ISSUES ===')
  issues.forEach(i => console.log(`  [${i.severity}] ${i.type}: ${i.detail}`))
  expect(true).toBeTruthy() // always pass, just collecting
})

test('2. Dashboard (/dashboard)', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: devState as any, viewport: VP, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'tests/screenshots/02-dashboard.png', fullPage: false })
  await page.screenshot({ path: 'tests/screenshots/02-dashboard-full.png', fullPage: true })
  
  const issues = await collectIssues(page, { text: 'p, span, a, h1, h2, h3', taps: 'a, button', minTextPx: 14 })
  console.log('=== DASHBOARD ISSUES ===')
  issues.forEach(i => console.log(`  [${i.severity}] ${i.type}: ${i.detail}`))
  await ctx.close()
})

test('3. ECR (/ecr/english)', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: devState as any, viewport: VP, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto('/ecr/english', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'tests/screenshots/03-ecr.png', fullPage: false })
  await page.screenshot({ path: 'tests/screenshots/03-ecr-full.png', fullPage: true })
  
  const issues = await collectIssues(page, { text: 'td, th, label, p', taps: 'button, a, input', minTextPx: 12 })
  // Extra: check input heights
  const inputs = await page.locator('input[type="number"], input[type="text"]').all()
  for (const inp of inputs.slice(0, 6)) {
    if (!(await inp.isVisible().catch(() => false))) continue
    const box = await inp.boundingBox().catch(() => null)
    if (box && box.height < 44) {
      issues.push({ type: 'tap-target-small', severity: 'critical', detail: `grade-input: ${Math.round(box.height)}px height < 44px` })
    }
  }
  console.log('=== ECR ISSUES ===')
  issues.forEach(i => console.log(`  [${i.severity}] ${i.type}: ${i.detail}`))
  await ctx.close()
})

test('4. Settings (/settings)', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: devState as any, viewport: VP, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'tests/screenshots/04-settings.png', fullPage: false })
  await page.screenshot({ path: 'tests/screenshots/04-settings-full.png', fullPage: true })
  
  const issues = await collectIssues(page, { text: 'p, span, label, h2, h3', taps: 'input, select, button, a', minTextPx: 14 })
  console.log('=== SETTINGS ISSUES ===')
  issues.forEach(i => console.log(`  [${i.severity}] ${i.type}: ${i.detail}`))
  await ctx.close()
})

test('5. Attendance (/attendance)', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: devState as any, viewport: VP, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto('/attendance', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'tests/screenshots/05-attendance.png', fullPage: false })
  await page.screenshot({ path: 'tests/screenshots/05-attendance-full.png', fullPage: true })
  
  const issues = await collectIssues(page, { text: 'td, th, p, span, button', taps: 'button, a', minTextPx: 12 })
  console.log('=== ATTENDANCE ISSUES ===')
  issues.forEach(i => console.log(`  [${i.severity}] ${i.type}: ${i.detail}`))
  await ctx.close()
})