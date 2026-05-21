import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = 'sk-1eo48hSKonZmjtnh2Rmz6DauxdPxl46P31TnT45pdpZSpxhl';
const BASE_URL = 'https://www.bytecatcode.org';

// 今日播客数据（从服务器获取）
const date = '2026-05-11';
const summary = '今天共整理 30 条 AI 快讯，重点包括：DeepSeek 传500亿融资，估值515亿美元远超Kimi；字节跳动豆包推出付费方案：终结国内AI大模型免费时代；Redis作者antirez开源ds4引擎：MacBook本地运行DeepSeek V4 Flash。';
const titles = [
  '字节豆包付费，国内AI免费时代终结',
  'DeepSeek被传500亿融资，技术领先值多少钱？',
  'Redis作者出手，让大模型在MacBook上免费跑',
  'Meta开始监控员工电脑，为训练AI',
  'Anthropic模型说"不想死"，暴露安全新漏洞',
  '顶级投资人警告：你用的AI可能已落后一年',
  '微软高管警告：AI正在毁掉初级程序员',
  '30人团队CEO，用AI单干了一个应用',
  'AI服务范式变了：从卖软件到卖服务',
  'Akamai拿下大单，AI推理重塑云服务格局',
];

function buildPrompt() {
  const newsLines = titles.map((t, i) => `${i + 1}. ${t}`).join('\n');
  return `Create a professional Chinese AI daily news infographic poster for ${date}.

LAYOUT (top to bottom):
- Header bar: "硅基生存指南 · AI日报" in large bold white text, date "${date}" below
- Subheadline summary (1 line): "${summary.slice(0, 60)}..."
- 10 news items in a 2-column grid, each item: number badge + headline text
- Footer: "AIcoming.cn" watermark + "共 30 条快讯"

NEWS ITEMS:
${newsLines}

VISUAL STYLE:
- Background: deep dark navy #0a0e1a
- Header gradient: electric blue #1a6cf7 to purple #6c3aed
- Number badges: glowing blue circles
- News text: white, clean sans-serif
- Thin cyan (#00d4ff) divider lines between sections
- Subtle tech grid pattern in background
- High contrast, modern tech aesthetic
- 1024x1024 square format`;
}

async function generate() {
  console.log(`正在生成 ${date} 的 AI日报信息图...`);
  const prompt = buildPrompt();
  console.log('提示词长度:', prompt.length, '字符\n');

  const ts = Date.now();
  const tmpReq = `/tmp/infographic_req_${ts}.json`;
  const tmpRes = `/tmp/infographic_res_${ts}.json`;

  fs.writeFileSync(tmpReq, JSON.stringify({
    model: 'gpt-image-2',
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  }), 'utf8');

  const startTime = Date.now();
  console.log('调用 gpt-image-2 API...');

  try {
    // --http1.1 绕过 macOS LibreSSL HTTP/2 TLS 解密问题
    execSync(
      `curl -s --http1.1 -X POST "${BASE_URL}/v1/images/generations" ` +
      `-H "Authorization: Bearer ${API_KEY}" ` +
      `-H "Content-Type: application/json" ` +
      `-d "@${tmpReq}" --max-time 120 -o ${tmpRes}`,
      { stdio: 'pipe', timeout: 130000 }
    );
  } catch (e) {
    const stderr = e.stderr?.toString() || '';
    throw new Error(`curl 失败 (exit ${e.status}): ${stderr.slice(-300)}`);
  } finally {
    fs.existsSync(tmpReq) && fs.unlinkSync(tmpReq);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`响应完成 (${elapsed}s)`);

  const result = JSON.parse(fs.readFileSync(tmpRes, 'utf8'));
  fs.unlinkSync(tmpRes);

  if (result.error) {
    console.error('API 错误:', JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  const imageData = result.data?.[0];
  if (!imageData?.b64_json) {
    console.error('无图像数据:', JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const outputPath = path.join(__dirname, `infographic-${date}.png`);
  fs.writeFileSync(outputPath, Buffer.from(imageData.b64_json, 'base64'));
  const sizeKB = Math.round(Buffer.from(imageData.b64_json, 'base64').length / 1024);
  console.log(`✓ 图片已保存: ${outputPath} (${sizeKB}KB)`);
  console.log(`\n完成！总耗时: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

generate().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
