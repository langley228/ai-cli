/**
 * Anthropic Claude 適配器：封裝 Claude API 呼叫邏輯。
 */

import Anthropic from '@anthropic-ai/sdk';
import { ProjectContext } from '../types/context';

/**
 * 呼叫 Claude API
 * @param prompt 任務描述
 * @param context 專案上下文
 * @param apiKey API Key
 * @returns Claude 回應文本
 */
export async function callClaude(prompt: string, context: ProjectContext, apiKey: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey });
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: `${prompt}\n\nContext:\n${context.xml}` }],
  });
  return (msg.content[0] as any).text;
}
