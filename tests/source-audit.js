const fs = require('fs');

const files = {
  'Dashboard': 'src/app/dashboard/page.tsx',
  'ECR': 'src/app/ecr/[subject]/page.tsx',
  'Settings': 'src/app/settings/page.tsx',
  'Attendance': 'src/app/attendance/page.tsx',
  'Sidebar': 'src/components/layout/sidebar.tsx',
  'Topbar': 'src/components/layout/topbar.tsx',
  'Login': 'src/app/login/page.tsx',
  'Register': 'src/app/register/page.tsx',
};

const VP = 375;
const issues = [];

for (const [name, path] of Object.entries(files)) {
  try {
    const src = fs.readFileSync(path, 'utf-8');
    const lines = src.split('\n');

    lines.forEach((line, idx) => {
      // text-[Npx] where N < 14
      const smallPx = line.match(/text-\[(\d+(?:\.\d+)?)px\]/g);
      if (smallPx) {
        for (const m of smallPx) {
          const px = parseFloat(m.match(/text-\[(\d+(?:\.\d+)?)px\]/)[1]);
          if (px < 14) {
            const sev = px < 11 ? 'critical' : px < 12 ? 'high' : 'medium';
            issues.push({ page: name, type: 'text-too-small', severity: sev, detail: m + ' (' + px + 'px < 14px) line ' + (idx+1), fix: 'Increase to min 14px on mobile' });
          }
        }
      }

      // text-xs = 12px in Tailwind
      if (line.includes('text-xs') && !line.includes('text-xs:') && !line.includes('text-xse') && !line.includes('overs')) {
        // Only flag if not already in a responsive context
        if (!line.match(/sm:text-sm|md:text-sm|lg:text-sm/)) {
          issues.push({ page: name, type: 'text-too-small', severity: 'medium', detail: 'text-xs (12px < 14px) line ' + (idx+1), fix: 'Use sm:text-sm on mobile' });
        }
      }

      // Small tap targets (h-8 w-8 = 32x32)
      if (line.match(/h-8\s+w-8|h-7\s+w-7|h-9\s+w-9/) && (line.includes('button') || line.includes('<a ') || line.includes('onClick') || line.includes('Icon'))) {
        issues.push({ page: name, type: 'tap-target-small', severity: 'high', detail: 'Icon button h-X w-X likely < 44x44 line ' + (idx+1), fix: 'Increase to min h-11 w-11 (44px) on mobile' });
      }
    });

    // Table without overflow wrapper
    const hasTable = src.includes('<Table') || src.includes('<table');
    const hasOverflowWrapper = src.includes('overflow-x-auto');
    if (hasTable && !hasOverflowWrapper) {
      issues.push({ page: name, type: 'horizontal-overflow', severity: 'high', detail: 'Table without overflow-x-auto wrapper', fix: 'Wrap tables in div with overflow-x-auto' });
    }
    if (hasTable && hasOverflowWrapper) {
      // Good - has wrapper, but check if table is wider than viewport
      issues.push({ page: name, type: 'info', severity: 'low', detail: 'Table HAS overflow-x-auto wrapper (good)', fix: 'N/A' });
    }

    // Input fields height check
    const inputHeights = src.match(/h-6|h-7|h-8|h-9|h-10/g);
    if (inputHeights && (name === 'ECR' || name === 'Settings' || name === 'Login' || name === 'Register')) {
      for (const h of inputHeights) {
        const pxMap = { 'h-6': 24, 'h-7': 28, 'h-8': 32, 'h-9': 36, 'h-10': 40 };
        const px = pxMap[h];
        if (px && px < 44) {
          const lineIdx = src.indexOf(h);
          const lineNum = src.substring(0, lineIdx).split('\n').length;
          issues.push({ page: name, type: 'tap-target-small', severity: px < 32 ? 'critical' : 'high', detail: h + ' (' + px + 'px height < 44px) for input/button near line ' + lineNum, fix: 'Use h-11 or h-12 (44-48px) on mobile' });
        }
      }
    }

    // Check sidebar visibility on mobile
    if (name === 'Sidebar') {
      issues.push({ page: name, type: 'info', severity: 'low', detail: 'Sidebar uses hamburger menu on mobile (lg:hidden) - GOOD for mobile UX', fix: 'N/A' });
    }

    // Check topbar
    if (name === 'Topbar') {
      // Check topbar height
      if (src.includes('h-14')) {
        issues.push({ page: name, type: 'info', severity: 'low', detail: 'Topbar h-14 (56px) - acceptable for mobile', fix: 'N/A' });
      }
    }

  } catch (e) {
    // File not found
  }
}

// Deduplicate
const seen = new Set();
const unique = issues.filter(i => {
  const key = i.page + '|' + i.type + '|' + i.detail.substring(0, 50);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
unique.sort((a, b) => (sevOrder[a.severity] || 2) - (sevOrder[b.severity] || 2));

console.log('\n==========================================');
console.log('  SOURCE CODE ANALYSIS - Authenticated Pages');
console.log('==========================================\n');

const sev = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
unique.forEach(i => { if (sev[i.severity] !== undefined) sev[i.severity]++; else sev['info'] = (sev['info'] || 0) + 1; });
console.log('Total: ' + unique.length + ' findings\n');

for (const i of unique) {
  if (i.type === 'info') continue;
  const icon = i.severity === 'critical' ? 'CRITICAL' : i.severity === 'high' ? 'HIGH' : i.severity === 'medium' ? 'MEDIUM' : 'LOW';
  console.log('[' + icon + '] ' + i.page + ' - ' + i.type);
  console.log('  ' + i.detail);
  console.log('  Fix: ' + i.fix + '\n');
}

fs.writeFileSync('tests/screenshots/source-issues.json', JSON.stringify(unique.filter(i => i.type !== 'info'), null, 2));