#!/usr/bin/env node
/**
 * CLI 主進入點封裝：使用 commander 封裝全局指令，整合 chalk 提供彩色終端機互動 UI。
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runInit } from './init';

import { listCredentials } from './config';
import { buildContext } from './context';
import { dispatch } from './core';

const program = new Command();

program
  .name('ai-cli')
  .description('🤖 開源 AI 代理調度馬具 (AI CLI Harness) - 統一管理您的 AI 開發流程')
  .version('0.1.0');

/**
 * 註冊 init 指令
 */
program
  .command('init')
  .description('啟動一刀流智慧偵測，自動掃描全平台既有憑證並加密儲存')
  .action(async () => {
    try {
      await runInit();
      console.log(chalk.green('✅ 憑證偵測與加密儲存完成。'));
    } catch (error) {
      console.error(chalk.red('❌ 初始化失敗:'), error);
    }
  });

/**
 * 註冊 config 指令
 */
program
  .command('config')
  .description('檢視當前已加密儲存的憑證設定')
  .action(async () => {
    await listCredentials();
  });

/**
 * 註冊主要調度行為 (預設指令)
 */
program
  .argument('[prompt]', '欲交付給 AI 的任務描述')
  .option('--mock', '強制進入 Mock 測試模式')
  .action(async (prompt: string | undefined, options: { mock?: boolean }) => {
    // 若無輸入 prompt 則顯示幫助訊息
    if (!prompt) {
      program.help();
      return;
    }

    try {
      console.log(chalk.cyan('🔍 正在打包專案上下文...'));
      const context = await buildContext(process.cwd());

      console.log(chalk.cyan('🚀 正在派發任務至 AI 引擎...'));
      const result = await dispatch(prompt, context, { mock: options.mock ?? false });

      console.log(chalk.yellow(`\n[來源: ${result.platform}]`));
      console.log(chalk.white(result.output));
    } catch (error) {
      console.error(chalk.red('\n❌ 執行失敗:'), error);
    }
  });

// 解析命令行參數
program.parseAsync(process.argv);
