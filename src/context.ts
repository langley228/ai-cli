// 通用上下文沙盒：將本地專案目錄結構轉譯為 AI 可高效讀取的 XML 結構化文本。

import * as fs from 'fs/promises';
import * as path from 'path';

export const IGNORE_LIST = ['node_modules', '.git', 'dist', 'build', 'package-lock.json'];

export interface ProjectContext {
  tree: string;
  xml: string;
}

async function getFiles(dir: string, allFiles: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (IGNORE_LIST.includes(file)) continue;

    const stats = await fs.stat(name);
    if (stats.isDirectory()) {
      await getFiles(name, allFiles);
    } else {
      allFiles.push(name);
    }
  }
  return allFiles;
}

function generateTree(files: string[], rootDir: string): string {
  const relativeFiles = files.map(f => path.relative(rootDir, f));
  return relativeFiles.join('\n');
}

export async function buildContext(rootDir: string): Promise<ProjectContext> {
  const files = await getFiles(rootDir);
  const tree = generateTree(files, rootDir);

  let xml = '<project_context>\n';
  xml += `<directory_tree>\n${tree}\n</directory_tree>\n`;

  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const content = await fs.readFile(file, 'utf-8');
    xml += `<file path="${relativePath}">\n<![CDATA[\n${content}\n]]></file>\n`;
  }

  xml += '</project_context>';

  return { tree, xml };
}
