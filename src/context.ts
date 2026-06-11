/**
 * 通用上下文沙盒：將本地專案目錄結構轉譯為 AI 可高效讀取的 XML 結構化文本。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectContext } from './types/context';

/**
 * 預設忽略的檔案與目錄清單
 */
export const IGNORE_LIST: string[] = ['node_modules', '.git', 'dist', 'build', 'package-lock.json'];

/**
 * 遞迴獲取目錄下的所有檔案路徑
 * @param dir 目標目錄
 * @param allFiles 累積的檔案列表
 * @returns 檔案路徑陣列
 */
async function getFiles(dir: string, allFiles: string[] = []): Promise<string[]> {
  try {
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
  } catch (error) {
    console.error(`讀取目錄 ${dir} 失敗:`, error);
  }
  return allFiles;
}

/**
 * 根據檔案列表生成相對路徑的樹狀結構文本
 * @param files 檔案路徑陣列
 * @param rootDir 根目錄
 * @returns 樹狀結構字串
 */
function generateTree(files: string[], rootDir: string): string {
  const relativeFiles = files.map((f) => path.relative(rootDir, f));
  return relativeFiles.join('\n');
}

/**
 * 建構專案上下文
 * @param rootDir 專案根目錄
 * @returns 包含樹狀圖與 XML 文本的物件
 */
export async function buildContext(rootDir: string): Promise<ProjectContext> {
  const files = await getFiles(rootDir);
  const tree = generateTree(files, rootDir);

  let xml = '<project_context>\n';
  xml += `<directory_tree>\n${tree}\n</directory_tree>\n`;

  for (const file of files) {
    try {
      const relativePath = path.relative(rootDir, file);
      const content = await fs.readFile(file, 'utf-8');
      xml += `<file path="${relativePath}">\n<![CDATA[\n${content}\n]]></file>\n`;
    } catch (error) {
      console.warn(`無法讀取檔案 ${file}, 已跳過。`);
    }
  }

  xml += '</project_context>';

  return { tree, xml };
}
