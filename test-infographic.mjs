import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require('dotenv').config();

const { createInfographicGenerator } = require('./server/services/infographic-generator.js');
const { buildDailyNewspicImagePrompt } = require('./server/services/wechat-content.js');

const date = new Date().toISOString().slice(0, 10);
const coreItems = [
    { title: 'AI 商业化进入价值验证期', keyPoint: '资本与企业预算开始集中到可盈利、可量化的 AI 产品。' },
    { title: '垂直 Agent 建立行业护城河', keyPoint: '深入行业数据和复杂流程的 Agent 更难被通用模型替代。' },
    { title: '更小更高效的模型加速落地', keyPoint: '低成本推理和专用模型让 AI 应用更容易规模化。' }
];

async function generate() {
    const generator = createInfographicGenerator();
    const prompt = buildDailyNewspicImagePrompt({ date, coreItems });
    const imageBuffer = await generator.generateInfographic({ prompt });
    const outputPath = path.join(__dirname, `infographic-${date}.jpg`);

    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`图片已保存: ${outputPath} (${Math.round(imageBuffer.length / 1024)}KB)`);
}

generate().catch((error) => {
    console.error('生成失败:', error.message);
    process.exit(1);
});
