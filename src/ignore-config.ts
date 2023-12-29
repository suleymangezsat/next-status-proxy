import fs from 'fs';
import path from 'path';

const ignoreFile = path.join(__dirname, '../.proxystatusignore');
let ignorePatterns: string[] = [];

try {
  if (fs.existsSync(ignoreFile)) {
    const fileContent = fs.readFileSync(ignoreFile, 'utf8');
    ignorePatterns = fileContent.split('\n').filter(Boolean);
  } else {
    console.warn(`Warning: Ignore file '${ignoreFile}' not found. No paths will be ignored.`);
  }
} catch (err) {
  console.error(`Error reading '${ignoreFile}':`, err);
}
export function shouldIgnorePath(requestPath: string): boolean {
  return ignorePatterns.some((pattern) => new RegExp(pattern).test(requestPath));
}
