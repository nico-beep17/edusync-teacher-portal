const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const VP = { width: 375, height: 667 };
  const allIssues = [];

  const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Register', path: '/register' },
  ];

  for (const p of pages) {
    const ctx = await browser.newContext({ viewport: VP, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:3001' + p.path, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const minPx = 14;

    // Small text
    const smallTexts = await page.evaluate((mp) => {
      const results = [];
      const seen = new Set();
      document.querySelectorAll('p, span, a, label, h1, h2, h3, button, td, th, input, div').forEach(el => {
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs > 0 && fs < mp) {
          const key = el.tagName + '|' + (el.className?.toString?.() || '').substring(0, 40) + '|' + fs;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              tag: el.tagName,
              cls: (el.className?.toString?.() || '').substring(0, 80),
              text: (el.textContent?.trim() || '').substring(0, 40),
              fontSize: fs,
              rect: { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }
            });
          }
        }
      });
      return results;
    }, minPx);

    for (const st of smallTexts) {
      allIssues.push({
        page: p.name, type: 'text-too-small',
        severity: st.fontSize < 11 ? 'critical' : st.fontSize < 12 ? 'high' : 'medium',
        detail: st.fontSize + 'px < ' + minPx + 'px [' + st.tag + '] "' + st.text.substring(0, 25) + '" (' + st.rect.w + 'x' + st.rect.h + ')',
        fix: 'Increase to min ' + minPx + 'px on mobile'
      });
    }

    // Small tap targets
    const smallTaps = await page.evaluate(() => {
      const results = [];
      const seen = new Set();
      document.querySelectorAll('a, button, input, [role="button"]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          const key = el.tagName + '|' + (el.className?.toString?.() || '').substring(0, 40) + '|' + Math.round(rect.width) + 'x' + Math.round(rect.height);
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              tag: el.tagName,
              cls: (el.className?.toString?.() || '').substring(0, 80),
              text: (el.textContent?.trim() || '').substring(0, 25) || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '',
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              type: el.type || ''
            });
          }
        }
      });
      return results;
    });

    for (const st of smallTaps) {
      allIssues.push({
        page: p.name, type: 'tap-target-small',
        severity: (st.width < 32 || st.height < 32) ? 'critical' : 'high',
        detail: st.width + 'x' + st.height + 'px < 44x44 [' + st.tag + '] "' + st.text.substring(0, 20) + '"',
        fix: 'Increase to 44x44px min (add padding/min-height)'
      });
    }

    // Horizontal overflow
    const hasOverflow = await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) > window.innerWidth + 2);
    if (hasOverflow) {
      allIssues.push({ page: p.name, type: 'horizontal-overflow', severity: 'high', detail: 'Page wider than 375px viewport', fix: 'Add overflow-x: hidden or fix wide elements' });
    }

    // Content cutoff
    const cutoffs = await page.evaluate(() => {
      const vpW = window.innerWidth;
      const r = [];
      const walk = (el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > vpW + 5 && rect.width < 1200 && rect.width > vpW * 0.5) {
          r.push({ tag: el.tagName, cls: (el.className?.toString?.() || '').substring(0, 50), right: Math.round(rect.right), width: Math.round(rect.width) });
        }
        for (const c of el.children) walk(c);
      };
      walk(document.body);
      return r.slice(0, 5);
    });

    for (const c of cutoffs) {
      allIssues.push({
        page: p.name, type: 'content-cutoff', severity: 'medium',
        detail: '<' + c.tag + '.' + c.cls.substring(0, 30) + '> extends to ' + c.right + 'px (width:' + c.width + 'px)',
        fix: 'Wrap in overflow-x:auto or use 100% width'
      });
    }

    // Input sizes for login/register
    if (p.name === 'Login' || p.name === 'Register') {
      const inputIssues = await page.evaluate(() => {
        const r = [];
        document.querySelectorAll('input').forEach(el => {
          const rect = el.getBoundingClientRect();
          r.push({ height: Math.round(rect.height), width: Math.round(rect.width), type: el.type || 'text' });
        });
        return r;
      });
      for (const ii of inputIssues) {
        if (ii.height < 44) {
          allIssues.push({ page: p.name, type: 'tap-target-small', severity: 'high', detail: 'Input height ' + ii.height + 'px < 44px (' + ii.type + ')', fix: 'Increase input height to 44px on mobile' });
        }
        if (ii.width < 250) {
          allIssues.push({ page: p.name, type: 'input-obstructed', severity: 'medium', detail: 'Input width ' + ii.width + 'px on 375px viewport (' + ii.type + ')', fix: 'Use w-full or wider inputs on mobile' });
        }
      }
    }

    await ctx.close();
  }

  // Print results
  console.log('\n==========================================');
  console.log('  MOBILE UX AUDIT - iPhone SE (375x667)');
  console.log('  Live test: Homepage, Login, Register');
  console.log('  Source analysis: Dashboard, ECR, Settings, Attendance');
  console.log('==========================================\n');

  const sev = { critical: 0, high: 0, medium: 0, low: 0 };
  allIssues.forEach(i => sev[i.severity]++);
  console.log('LIVE TEST RESULTS: ' + allIssues.length + ' issues\n');

  for (const i of allIssues) {
    const icon = i.severity === 'critical' ? 'CRITICAL' : i.severity === 'high' ? 'HIGH' : 'MEDIUM';
    console.log('[' + icon + '] ' + i.page + ' - ' + i.type);
    console.log('  ' + i.detail);
    console.log('  Fix: ' + i.fix + '\n');
  }

  fs.writeFileSync('tests/screenshots/live-issues.json', JSON.stringify(allIssues, null, 2));
  console.log('Saved to tests/screenshots/live-issues.json');
  
  await browser.close();
})();