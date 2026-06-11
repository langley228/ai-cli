// 通用上下文沙盒：將本地專案目錄結構轉譯為 AI 可高效讀取的 XML 結構化文本。

export const IGNORE_LIST = ['node_modules', '.git', 'dist', 'build'];

export interface ProjectContext {
  tree: string;
  xml: string;
}

export async function buildContext(rootDir: string): Promise<ProjectContext> {
  // TODO: 遞迴掃描 rootDir，套用 IGNORE_LIST 過濾，產生樹狀圖
  const tree = '';

  // TODO: 將原始碼以 <project_context><![CDATA[ ... ]]></project_context> 包裹
  const xml = `<project_context><![CDATA[${tree}]]></project_context>`;

  return { tree, xml };
}
