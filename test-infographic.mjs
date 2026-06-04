import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
require('dotenv').config();

const { createInfographicGenerator } = require('./server/services/infographic-generator.js');
const {
    buildDailyNewspicContent,
    buildDailyNewspicImagePrompt,
    selectCoreNewsItems
} = require('./server/services/wechat-content.js');

const reportDir = process.env.WECHAT_AUTOGEN_REPORT_DIR || path.join(__dirname, 'data', 'report');

function listReportDates() {
    if (!fs.existsSync(reportDir)) {
        return [];
    }

    return fs.readdirSync(reportDir)
        .map((name) => name.match(/^(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
        .filter(Boolean)
        .sort();
}

function resolveDate() {
    const explicitDate = process.argv[2];
    if (explicitDate) {
        return explicitDate;
    }

    const dates = listReportDates();
    return dates[dates.length - 1] || new Date().toISOString().slice(0, 10);
}

async function generate() {
    const date = resolveDate();
    const reportPath = path.join(reportDir, `${date}.json`);
    if (!fs.existsSync(reportPath)) {
        throw new Error(`日报 JSON 不存在: ${reportPath}`);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const coreItems = selectCoreNewsItems(report, 10);
    if (coreItems.length < 10) {
        throw new Error(`日报核心信息不足 10 条: ${coreItems.length}`);
    }
    const generator = createInfographicGenerator();
    const content = buildDailyNewspicContent({ date, coreItems });
    const prompt = buildDailyNewspicImagePrompt({ date, coreItems });
    const imageBuffer = await generator.generateInfographic({ prompt });
    const outputPath = process.env.INFOGRAPHIC_TEST_OUTPUT || path.join(__dirname, `infographic-${date}.jpg`);

    fs.writeFileSync(outputPath, imageBuffer);
    console.log('日报贴图补充文字：');
    console.log(content);
    console.log(`图片已保存: ${outputPath} (${Math.round(imageBuffer.length / 1024)}KB)`);
}

generate().catch((error) => {
    console.error('生成失败:', error.message);
    process.exit(1);
});
