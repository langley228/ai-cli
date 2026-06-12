/**
 * Anthropic Claude CLI 適配器：封裝對 official claude CLI 的呼叫邏輯。
 */
import { spawnSync } from 'child_process';
import { ProjectContext } from '../../types/context';
import { AiAdapter } from '../../interfaces/aiAdapter';

export const cliAdapter: AiAdapter = {
  async generate(prompt: string, _context: ProjectContext, _apiKey: string, model?: string): Promise<string> {
    // 1. 清理 prompt，移除觸發關鍵字避免 CLI 混淆
    const cleanPrompt = prompt
      .replace(/^claude-sdk\s+/i, '')
      .replace(/^claude-cli\s+/i, '')
      .replace(/^claude\s+/i, '')
      .trim();

    // 2. 建立參數，使用 -p (print) 模式確保非互動輸出
    const args = ['-p', cleanPrompt];
    if (model) {
      args.push('--model', model);
    }

    // 移除 ANTHROPIC_API_KEY，避免覆蓋 claude CLI 自身的 OAuth 登入憑證
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    // 執行 claude CLI 指令
    console.log(`[DEBUG] 呼叫指令: claude ${args.join(' ')}`);

    const result = spawnSync('claude', args, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env
    });

    if (result.status === 0) {
      return result.stdout;
    } else {
      // claude CLI 的錯誤可能印在 stdout（如 Invalid API key），需一併納入
      const errorMsg = result.stderr?.trim() || result.stdout?.trim() || '未知錯誤';
      console.error(`[Claude CLI Error]: ${errorMsg}`);
      throw new Error(`Claude CLI 執行失敗 (代碼 ${result.status}): ${errorMsg}`);
    }
  }
};

