/**
 * Anthropic Claude SDK 適配器：封裝 Claude API 呼叫邏輯 (使用 Vercel AI SDK)。
 */
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { ProjectContext } from '../../types/context';
import { AiAdapter } from '../../interfaces/aiAdapter';

// SDK 未匯出 AnthropicMessagesModelId，改由 provider 函式簽章推導出同一個型別
type AnthropicModelId = Parameters<ReturnType<typeof createAnthropic>>[0];

// 標註型別：保證預設值是 SDK 認得的合法 model id（打錯字會在編譯期報錯）
const DEFAULT_MODEL: AnthropicModelId = 'claude-sonnet-4-6';

export const sdkAdapter: AiAdapter = {
  async generate(prompt: string, context: ProjectContext, apiKey: string, model?: string): Promise<string> {
    // Claude 的 OAuth access token (sk-ant-oat...) 必須走 Authorization: Bearer
    // 並帶上 oauth beta header；真正的 API key (sk-ant-api...) 才用 x-api-key。
    const isOAuth = apiKey.startsWith('sk-ant-oat');
    const anthropic = createAnthropic(
      isOAuth
        ? { authToken: apiKey, headers: { 'anthropic-beta': 'oauth-2025-04-20' } }
        : { apiKey }
    );
    
    const modelObj = anthropic(model || DEFAULT_MODEL);
    if (!modelObj) {
      console.error(`[ERROR] 無法找到指定的模型: ${model || DEFAULT_MODEL}`);
      return '';
    }
    console.log(`[DEBUG] 實際使用的模型 ID: ${modelObj.modelId}`);
    throw new Error('claudeSDKAdapter 尚未完成串接。');

    const { text } = await generateText({
      model: anthropic(model || DEFAULT_MODEL),
      prompt: `${prompt}\n\nContext:\n${context.xml}`,
    });
    return text;
  }
};

