/**
 * Post-build: copy dist to Card with ASCII-safe names
 * Uses robocopy via child_process (avoids Node cpSync crash on Windows + Chinese paths)
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync } from 'node:fs';

const COPY_MAP = [
  ['\u7eef\u8272\u5b98\u9014\u524d\u7aef\u754c\u9762',             'frontend'],
  ['\u7eef\u8272\u5b98\u9014\u524d\u7aef\u754c\u9762\u624b\u673a\u7248', 'frontend-mobile'],
  ['\u7eef\u8272\u5b98\u9014mvu\u811a\u672c',             'mvu-script'],
];

if (existsSync('Card')) rmSync('Card', { recursive: true, force: true });
mkdirSync('Card', { recursive: true });

for (const [src, dest] of COPY_MAP) {
  const srcPath = `dist\\${src}`;
  const destPath = `Card\\${dest}`;
  if (existsSync(srcPath)) {
    try {
      execSync(`robocopy "${srcPath}" "${destPath}" /E /NFL /NDL /NJH /NJS /NC /NS`, {
        stdio: 'ignore',
        windowsHide: true,
      });
    } catch {
      // robocopy exit code 1 = success (files copied), only 8+ is real error
    }
    if (existsSync(destPath)) {
      console.log(`  OK ${dest}`);
    }
  } else {
    console.log(`  SKIP ${dest} (source not found)`);
  }
}

console.log('Card directory updated.');
