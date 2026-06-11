#!/usr/bin/env node
// CLI 主進入點封裝：使用 commander 封裝全局指令，整合 chalk 提供彩色終端機互動 UI。

import { Command } from 'commander';
import chalk from 'chalk';
import { runInit } from './init';
import { buildContext } from './context';
import { dispatch } from './core';

const program = new Command();

program
  .name('ai-cli')
  .description('開源 AI 代理調度馬具（AI CLI Harness）')
  .version('0.1.0');

program
  .command('init')
  .description('啟動一刀流智慧偵測，自動掃描全平台既有憑證並加密儲存')
  .action(async () => {
    await runInit();
    console.log(chalk.green('憑證偵測與加密儲存完成。'));
  });

program
  .argument('[prompt]', '欲交付給 AI 的任務描述')
  .option('--mock', '強制進入 Mock 測試模式')
  .action(async (prompt: string | undefined, options: { mock?: boolean }) => {
    if (!prompt) {
      program.help();
      return;
    }

    console.log(chalk.cyan('正在打包專案上下文...'));
    const context = await buildContext(process.cwd());

    const result = await dispatch(prompt, context, { mock: options.mock ?? false });
    console.log(chalk.yellow(`[${result.platform}]`), result.output);
  });

program.parseAsync(process.argv);
