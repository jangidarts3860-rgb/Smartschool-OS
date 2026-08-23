const fs = require('fs');
const path = require('path');

// Target directories to scan (Sehat Store: dashboard + rider workspaces)
const projectRoot = path.join(__dirname, '..', '..', '..', '..');
const targetDirs = [
  path.join(projectRoot, 'dashboard', 'src'),
  path.join(projectRoot, 'rider', 'src'),
].filter(fs.existsSync);

console.log(`=== UI/UX Token & Accessibility Linter ===`);
console.log(`Scanning: ${targetDirs.join(' | ')}\n`);

const issueLog = [];

// Helper to check if value matches 8pt spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80)
const spacingTokens = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80];
function isSpacingToken(val) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return true; // ignore variables
  return spacingTokens.includes(num);
}

// Main scanner
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..', '..', '..', '..'), filePath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Check for hardcoded hex colors (e.g., #FFFFFF, #292827)
    const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
    let match;
    while ((match = hexRegex.exec(line)) !== null) {
      const hex = match[0];
      // Ignore common standard black/white inside test mocks or comments if any, but flag design elements
      if (hex !== '#fff' && hex !== '#FFF' && hex !== '#000' && hex !== '#000000' && hex !== '#ffffff') {
        issueLog.push({
          file: relativePath,
          line: lineNum,
          type: 'HARDCODED_COLOR',
          detail: `Found hardcoded color '${hex}'. Use design tokens instead.`,
          severity: 'Critical'
        });
      }
    }

    // 2. Check for inline style pixel violations (e.g., style={{ padding: 10 }}, gap: 15)
    const paddingRegex = /(padding|margin|gap|borderRadius|height|width)\s*:\s*(['"]?\d+px['"]?|\d+)/gi;
    while ((match = paddingRegex.exec(line)) !== null) {
      const prop = match[1];
      const valStr = match[2].replace(/['"px]/g, '');
      const val = parseInt(valStr, 10);
      
      if (prop.toLowerCase() === 'height' || prop.toLowerCase() === 'width') {
        // Touch target check: clickable containers or buttons should not be < 44px
        if (line.toLowerCase().includes('button') || line.toLowerCase().includes('pressable') || line.toLowerCase().includes('touchable')) {
          if (val < 44) {
            issueLog.push({
              file: relativePath,
              line: lineNum,
              type: 'TOUCH_TARGET_VIOLATION',
              detail: `Clickable element has ${prop} of ${val}px. WCAG 2.2 requires minimum 44px (56px preferred for India).`,
              severity: 'Critical'
            });
          }
        }
      } else if (prop.toLowerCase() === 'border-radius' || prop.toLowerCase() === 'borderradius') {
        // Superhuman radius rule: only 8px and 16px are allowed
        if (val !== 8 && val !== 16 && val !== 0) {
          issueLog.push({
            file: relativePath,
            line: lineNum,
            type: 'RADIUS_VIOLATION',
            detail: `Found border-radius of ${val}px. Superhuman spec allows only 8px and 16px.`,
            severity: 'Medium'
          });
        }
      } else {
        // Spacing check: must follow 8pt grid scale
        if (!isSpacingToken(val)) {
          issueLog.push({
            file: relativePath,
            line: lineNum,
            type: 'SPACING_GRID_VIOLATION',
            detail: `Found hardcoded spacing ${prop}: ${val}px. Spacing must align to 8pt grid scale.`,
            severity: 'High'
          });
        }
      }
    }

    // 3. Check for arbitrary Tailwind sizes (e.g. p-[13px], w-[32px])
    const tailwindArbitraryRegex = /(p|m|w|h|gap)-\[(\d+)(px)?\]/g;
    while ((match = tailwindArbitraryRegex.exec(line)) !== null) {
      const prop = match[1];
      const val = parseInt(match[2], 10);
      issueLog.push({
        file: relativePath,
        line: lineNum,
        type: 'TAILWIND_ARBITRARY',
        detail: `Found arbitrary Tailwind size: '${match[0]}'. Use standard scale or design tokens.`,
        severity: 'High'
      });
    }

    // 4. Check for small touch targets in Tailwind classes (e.g. h-8, h-9, w-8, w-9 for buttons)
    if (line.includes('button') || line.includes('Pressable') || line.includes('Touchable')) {
      const smallTailwindHeightRegex = /\b(h|w)-(1|2|3|4|5|6|7|8|9|10)\b/g;
      while ((match = smallTailwindHeightRegex.exec(line)) !== null) {
        const val = match[0];
        issueLog.push({
          file: relativePath,
          line: lineNum,
          type: 'TOUCH_TARGET_VIOLATION',
          detail: `Clickable element may have small touch target via class '${val}'. Tailwind class must be >= h-11 (44px) or h-14 (56px India).`,
          severity: 'Critical'
        });
      }
    }
  });
}

function traverseDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip node_modules and assets
      if (file !== 'node_modules' && file !== 'assets' && file !== 'dist') {
        traverseDirectory(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(fullPath);
    }
  });
}

targetDirs.forEach(traverseDirectory);

// Output results
if (issueLog.length === 0) {
  console.log('🎉 Excellent! No UI/UX token or touch target violations found.');
} else {
  console.log(`Found ${issueLog.length} UI/UX issues:\n`);
  
  // Sort by severity
  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  issueLog.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  issueLog.forEach(issue => {
    console.log(`[${issue.severity}] ${issue.file}:${issue.line}`);
    console.log(`  Type: ${issue.type}`);
    console.log(`  Detail: ${issue.detail}\n`);
  });
}
