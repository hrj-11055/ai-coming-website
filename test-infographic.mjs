import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { buildImagePrompt } = require('./server/services/infographic-generator.js');
require('dotenv').config();

const date = '2026-06-04';

function buildPrompt() {
  return `为《小元说 AI日报》生成一张首图，主题是“AI 行业价值回归：从烧钱竞赛走向效率与落地”。画面中央是一座由芯片、电路和数据流构成的天平：左侧是 AI 企业上市钟、资本增长曲线与超级应用入口，象征商业化和流量入口；右侧是预算告警、成本仪表盘与收紧的阀门，象征 AI 投入开始精算。背景延伸出三条未来路径：自研芯片与模型代表技术自主，机器人走下产线代表物理 AI 量产，垂直 Agent 穿过复杂数据迷宫代表行业护城河。远处加入小型智能战舰以更低成本击败巨型模型的意象，突出“更小、更省、更有效”。画面要表达资本向可盈利头部集中、企业严格衡量投入产出、通用模型吞噬浅层应用，而真正扎进行业和解决硬问题的团队仍有机会。整体采用深蓝到紫色科技渐变，点缀青色数据光线与橙色警示光，高级、克制、有新闻感，构图清晰，主体突出。采用纯视觉叙事，画面中禁止出现任何文字、字母、数字、Logo、水印或界面标签，避免乱码。`;
}

async function generate() {
  const apiKey = process.env.GPT_IMAGE_API_KEY || '';
  const baseUrl = String(process.env.GPT_IMAGE_API_BASE_URL || 'https://ai.ssgoo.net').replace(/\/+$/, '');
  if (!apiKey) {
    throw new Error('请先设置 GPT_IMAGE_API_KEY');
  }

  console.log(`正在生成 ${date} 的 AI日报信息图...`);
  const prompt = buildPrompt();
  console.log('提示词长度:', prompt.length, '字符\n');

  const startTime = Date.now();
  console.log('调用 gpt-image-2 API...');
  const responseText = execFileSync('curl', [
    '-sS',
    '--http1.1',
    '--max-time', '600',
    '-X', 'POST',
    `${baseUrl}/v1/images/generations`,
    '-H', `Authorization: Bearer ${apiKey}`,
    '-H', 'Content-Type: application/json',
    '--data-binary', '@-'
  ], {
    input: JSON.stringify({
      model: process.env.GPT_IMAGE_MODEL || 'gpt-image-2',
      prompt: buildImagePrompt(prompt),
      size: process.env.GPT_IMAGE_SIZE || '1024x1024',
      quality: process.env.GPT_IMAGE_QUALITY || 'low',
      output_format: process.env.GPT_IMAGE_OUTPUT_FORMAT || 'jpeg',
      output_compression: Number(process.env.GPT_IMAGE_OUTPUT_COMPRESSION || 70),
      response_format: process.env.GPT_IMAGE_RESPONSE_FORMAT || 'url',
      n: 1
    }),
    encoding: 'utf8',
    timeout: 610000
  });
  const result = JSON.parse(responseText);
  if (result.error) {
    throw new Error(result.error.message || JSON.stringify(result.error));
  }

  const imageData = result.data?.[0];
  let imageBuffer;
  if (imageData?.url) {
    imageBuffer = execFileSync('curl', ['-sS', '--http1.1', '-L', '--max-time', '120', imageData.url], {
      encoding: null,
      timeout: 130000
    });
  } else if (imageData?.b64_json) {
    imageBuffer = Buffer.from(imageData.b64_json, 'base64');
  } else {
    throw new Error('Images API 未返回有效的图片 URL 或 b64_json');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`响应完成 (${elapsed}s)`);

  const outputPath = path.join(__dirname, `infographic-${date}.png`);
  fs.writeFileSync(outputPath, imageBuffer);
  const sizeKB = Math.round(imageBuffer.length / 1024);
  console.log(`✓ 图片已保存: ${outputPath} (${sizeKB}KB)`);
  console.log(`\n完成！总耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

generate().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
