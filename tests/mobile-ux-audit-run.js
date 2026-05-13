const { chromium } = require('@playwright/test');
const fs = require('fs');



(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2
  });
  const page = await ctx.newPage();

  const storeState = JSON.stringify({
    state: {
      user: { isDev: true, email: 'test@depid.local', user_metadata: { full_name: 'Test Teacher' } },
      teacherPin: '1234',
      students: [
        { lrn: '123456789012', name: 'Del Cruz, Juan', sex: 'M', status: 'Enrolled' },
        { lrn: '123456789013', name: 'Santos, Maria', sex: 'F', status: 'Enrolled' },
        { lrn: '123456789014', name: 'Reyes, Pedro', sex: 'M', status: 'Enrolled' },
      ],
      schoolInfo: {
        schoolName: 'TEST SCHOOL', schoolId: '000000', district: 'Test',
        division: 'Test', region: 'I', gradeLevel: '8', section: 'TEST',
        schoolYear: '2025-2026', quarter: '1', adviserName: 'Test Teacher',
        schoolHeadName: 'Test Principal',
      },
      workload: [{ id: '1', subject: 'English', section: 'TEST', students: 3, schedule: 'MWF 8-9', scheduleDays: ['Mon','Wed','Fri'], startTime: '08:00', endTime: '09:00', slug: 'english', gradient: '' }],
      grades: {}, attendance: {}, subjectAttendance: {},
      books: {}, sf3Subjects: [], sf2Summaries: {}, workloadStudents: {},
    },
    version: 0,
  });

  // Inject localStorage before navigating to any page
  await page.goto('http://127.0.0.1:3001/', { timeout: 45000, waitUntil: 'domcontentloaded' });
  await page.evaluate((data) => {
    localStorage.setItem('teacher-store', data);
  }, storeState);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const pages = [
    { name: 'Homepage', path: '/', minPx: 14, needsAuth: false },
    { name: 'Dashboard', path: '/dashboard', minPx: 14, needsAuth: true },
    { name: 'ECR', path: '/ecr/english', minPx: 12, needsAuth: true },
    { name: 'Settings', path: '/settings', minPx: 14, needsAuth: true },
    { name: 'Attendance', path: '/attendance', minPx: 12, needsAuth: true },
  ];

  const allIssues = [];

  for (const p of pages) {
    try {
      await page.goto('http://127.0.0.1:3001' + p.path, { timeout: 45000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      
      const url = page.url();
      const headingTexts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('h1,h2,h3')).map(e => e.textContent?.trim()).filter(Boolean).join(' | ')
      );
      
      console.log('\n--- ' + p.name + ' (' + url + ') ---');
      console.log('  Headings: ' + (headingTexts || '(none)'));
      
      await page.screenshot({ path: 'tests/screenshots/' + p.name.toLowerCase() + '-audit.png', fullPage: true });

      const pageIssues = [];

      // 1. Small text
      const smallTexts = await page.evaluate((minPx) => {
        const results = [];
        const seen = new Set();
        document.querySelectorAll('p, span, a, label, h1, h2, h3, button, td, th').forEach(el => {
          const fs = parseFloat(window.getComputedStyle(el).fontSize);
          if (fs > 0 && fs < minPx) {
            const key = el.tagName + '|' + (el.className?.toString?.()||'').substring(0,40) + '|' + fs;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                tag: el.tagName,
                cls: (el.className?.toString?.()||'').substring(0,60),
                text: el.textContent?.trim().substring(0, 30) || '',
                fontSize: fs
              });
            }
          }
        });
        return results;
      }, p.minPx);

      for (const st of smallTexts) {
        const severity = st.fontSize < 11 ? 'critical' : st.fontSize < 12 ? 'high' : 'medium';
        pageIssues.push({
          page: p.name, type: 'text-too-small', severity,
          detail: st.fontSize + 'px < ' + p.minPx + 'px [' + st.tag + '.' + st.cls.substring(0,40) + '] "' + st.text + '"',
          fix: 'Increase to min ' + p.minPx + 'px'
        });
      }

      // 2. Small tap targets
      const smallTaps = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        document.querySelectorAll('a, button, input, [role="button"]').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            const key = el.tagName + '|' + (el.className?.toString?.()||'').substring(0,40) + '|' + Math.round(rect.width) + 'x' + Math.round(rect.height);
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                tag: el.tagName,
                cls: (el.className?.toString?.()||'').substring(0,60),
                text: el.textContent?.trim().substring(0, 25) || el.getAttribute('aria-label') || '',
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              });
            }
          }
        });
        return results;
      });

      for (const st of smallTaps) {
        const severity = (st.width < 32 || st.height < 32) ? 'critical' : 'high';
        pageIssues.push({
          page: p.name, type: 'tap-target-small', severity,
          detail: st.width + 'x' + st.height + 'px < 44x44 [' + st.tag + '.' + st.cls.substring(0,40) + '] "' + st.text + '"',
          fix: 'Increase to 44x44px min (add padding/min-height)'
        });
      }

      // 3. Horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) > window.innerWidth + 2;
      });
      if (hasOverflow) {
        pageIssues.push({
          page: p.name, type: 'horizontal-overflow', severity: 'high',
          detail: 'Page scroll width exceeds viewport',
          fix: 'Add overflow-x: hidden or make layout responsive'
        });
      }

      // 4. Content cutoff
      const cutoffs = await page.evaluate(() => {
        const vpW = window.innerWidth;
        const results = [];
        const seen = new Set();
        const walk = (el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > vpW + 5 && rect.width < 1200 && rect.width > 0 && rect.width > vpW * 0.5) {
            const key = (el.className?.toString?.()||'').substring(0,40);
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ tag: el.tagName, class: key, right: Math.round(rect.right), width: Math.round(rect.width) });
            }
          }
          for (const c of el.children) walk(c);
        };
        walk(document.body);
        return results.slice(0, 8);
      });

      for (const c of cutoffs) {
        pageIssues.push({
          page: p.name, type: 'content-cutoff', severity: 'medium',
          detail: '<' + c.tag + '.' + c.class + '> extends to ' + c.right + 'px (width:' + c.width + 'px, viewport:375px)',
          fix: 'Wrap in overflow-x:auto container or use responsive widths'
        });
      }

      // 5. Input fields (ECR, Settings, Attendance)
      if (['ECR', 'Settings', 'Attendance'].includes(p.name)) {
        const inputIssues = await page.evaluate(() => {
          const results = [];
          document.querySelectorAll('input').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.height > 0 && rect.height < 44) {
              results.push({ height: Math.round(rect.height), width: Math.round(rect.width), type: el.type || 'text' });
            }
          });
          return results;
        });
        for (const ii of inputIssues) {
          pageIssues.push({
            page: p.name, type: 'tap-target-small', severity: 'critical',
            detail: 'Input height ' + ii.height + 'px < 44px (' + ii.type + ', width: ' + ii.width + 'px)',
            fix: 'Increase input height to 44px on mobile (min-h-[44px])'
          });
        }
      }

      // 6. Table horizontal scroll check
      if (['ECR', 'Attendance'].includes(p.name)) {
        const tableInfo = await page.evaluate(() => {
          const tables = document.querySelectorAll('table');
          const scrollWrappers = document.querySelectorAll('.overflow-x-auto');
          return {
            tableCount: tables.length,
            scrollWrapperCount: scrollWrappers.length,
            tableWidths: Array.from(tables).map(t => t.scrollWidth),
            largestTable: tables.length ? Math.max(...Array.from(tables).map(t => t.scrollWidth)) : 0,
          };
        });
        if (tableInfo.tableCount > 0 && tableInfo.scrollWrapperCount === 0) {
          pageIssues.push({
            page: p.name, type: 'horizontal-overflow', severity: 'high',
            detail: 'Table (width:' + tableInfo.largestTable + 'px) has no overflow-x-auto wrapper on 375px viewport',
            fix: 'Wrap tables in <div class="overflow-x-auto">'
          });
        } else if (tableInfo.tableCount > 0 && tableInfo.largestTable > 375) {
          const ratio = Math.round((375 / tableInfo.largestTable) * 100);
          pageIssues.push({
            page: p.name, type: 'content-cutoff', severity: 'medium',
            detail: 'Table shows only ~' + ratio + '% of content (scrollWidth:' + tableInfo.largestTable + 'px, viewport:375px)',
            fix: 'Consider sticky first column or visual scroll indicator'
          });
        }
      }

      // Sort and print
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      pageIssues.sort((a, b) => (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2));
      
      console.log('  Issues found: ' + pageIssues.length);
      for (const i of pageIssues) {
        const icon = i.severity === 'critical' ? '🔴' : i.severity === 'high' ? '🟠' : i.severity === 'medium' ? '🟡' : '🟢';
        console.log('  ' + icon + ' [' + i.severity.toUpperCase() + '] ' + i.type + ': ' + i.detail);
        console.log('     Fix: ' + i.fix);
      }
      
      allIssues.push(...pageIssues);
    } catch (e) {
      console.log('ERROR on ' + p.name + ': ' + e.message.substring(0, 300));
    }
  }

  // Summary
  console.log('\n==========================================');
  console.log('  MOBILE UX AUDIT SUMMARY — iPhone SE (375x667)');
  console.log('==========================================');
  const sev = { critical: 0, high: 0, medium: 0, low: 0 };
  allIssues.forEach(i => sev[i.severity]++);
  console.log('Total: ' + allIssues.length + ' issues');
  console.log('  🔴 Critical: ' + sev.critical);
  console.log('  🟠 High: ' + sev.high);
  console.log('  🟡 Medium: ' + sev.medium);
  console.log('  🟢 Low: ' + sev.low);

  // Group by type
  const byType = {};
  for (const i of allIssues) {
    if (!byType[i.type]) byType[i.type] = [];
    byType[i.type].push(i);
  }
  console.log('\nBy Issue Type:');
  for (const [type, items] of Object.entries(byType)) {
    console.log('  ' + type + ': ' + items.length);
    for (const i of items.slice(0, 3)) {
      console.log('    - ' + i.page + ': ' + i.detail.substring(0, 80));
    }
    if (items.length > 3) console.log('    ... and ' + (items.length - 3) + ' more');
  }

  fs.writeFileSync('tests/screenshots/mobile-ux-report-detailed.json', JSON.stringify(allIssues, null, 2));
  console.log('\nReport saved to tests/screenshots/mobile-ux-report-detailed.json');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });