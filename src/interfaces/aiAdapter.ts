/**
 * 統一 AI 適配器介面定義
 */
import { ProjectContext } from '../types/context';

export interface AiAdapter {
  generate(prompt: string, context: ProjectContext, apiKey: string, model?: string): Promise<string>;
}
