/**
 * 專案上下文結構介面
 */
export interface ProjectContext {
  /** 專案目錄樹狀圖 */
  tree: string;
  /** 封裝後的 XML 文本 */
  xml: string;
}
