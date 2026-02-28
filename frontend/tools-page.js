import { TOOL_SECTIONS } from './modules/tools-catalog.js';

const FALLBACK_LOGO = '/logos/default.png';
const CATEGORY_ICON_MAP = {
    'ai-writing': 'fas fa-feather-alt',
    'ai-image': 'far fa-image',
    'ai-video': 'fas fa-video',
    'ai-ppt': 'fas fa-file-powerpoint',
    'ai-data-analysis': 'fas fa-chart-line',
    'ai-search': 'fas fa-magnifying-glass',
    'meeting-notes': 'fas fa-file-lines',
    'knowledge-base': 'fas fa-book-open',
    'ai-collab': 'fas fa-people-group',
    'digital-human': 'fas fa-user-astronaut',
    tts: 'fas fa-music',
    'agent-workflow': 'fas fa-robot',
    vibecoding: 'fas fa-code'
};

const TOOL_TAG_MAP = {
    'AiPPT': '中文PPT智能生成',
    'Beautiful.ai': '自动排版美学PPT',
    'Canva': '模板驱动设计',
    'ChatExcel': '自然语言做表格',
    'ChatGPT': '通用多模态助手',
    'ChatGPT Data Analyst': '对话式数据分析',
    'Claude': '长文深度推理',
    'Coze': '零代码Agent搭建',
    'Cursor': 'AI原生IDE',
    'D-ID': '照片口播数字人',
    'DeepSeek': '高性价比推理',
    'Descript': '播客剪辑一体化',
    'Dify': '企业级应用编排',
    'ElevenLabs': '拟真英文配音',
    'FLUX': '高质感文生图',
    'Fish Audio': '中文音色克隆',
    'Gamma': '一句话成演示稿',
    'Gemini': 'Google生态联动',
    'Get笔记': '网页剪藏笔记',
    'Google Colab': '云端Notebook训练',
    'HeyGen': '营销级数字人',
    'IndexTTS-2': '开源中文语音克隆',
    'Kimi': '超长上下文阅读',
    'LangChain': 'LLM应用编排框架',
    'LM Studio': '本地大模型调试',
    'Luma': '电影感视频生成',
    'Manus': '自主执行型Agent',
    'Microsoft': 'Office生产力Copilot',
    'Midjourney': '艺术风格图像生成',
    'MiniMax': '多语种语音合成',
    'Nano Banana': 'Gemini图像实验',
    'NotebookLM': '资料驱动摘要播客',
    'Notion': '文档数据库一体',
    'Obsidian': '双链知识图谱',
    'OpenAI': '旗舰模型入口',
    'Otter Pilot': '会议实时转写',
    'Perplexity': '带引用答案搜索',
    'Qwen': '阿里通义对话',
    'QwenCode': '代码专项模型',
    '通义万相': '阿里文生图平台',
    'Slack': '团队消息中枢',
    'Sora': '文本直出长视频',
    'Synthesia': '企业培训数字人',
    'Trae': '国产AI编程IDE',
    'Veo': 'Google视频模型',
    'WPS AI': '国产办公套件AI',
    'Whisper': '开源语音识别',
    'Windsurf': 'Agent式编程流',
    'Zapier': 'SaaS自动化连接',
    'Zoom': '远程会议标准',
    'ima': '腾讯轻量知识库',
    'n8n': '可视化自动化流',
    '即梦': '抖音生态视频生成',
    '即梦AI': '抖音生态图像生成',
    '可灵': '快手视频生成',
    '我来': '国产协作文档',
    '智谱': 'GLM对话平台',
    '海螺': 'MiniMax视频生成',
    '火山引擎': '字节云AI服务',
    '百度曦灵': '百度数字人平台',
    '秘塔': '中文学术检索',
    '腾讯智影': '腾讯数字人制作',
    '讯飞听见': '中文会议速记',
    '豆包': '字节通用助手',
    '豆包声音复刻大模型': '豆包官方声音克隆',
    '通义听悟': '会议音视频智能纪要',
    '钉钉': '组织协同中台',
    '飞书': '企业协同平台',
    '飞书妙记': '音视频转纪要'
};

function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

function toSafePath(pathValue) {
    if (!pathValue) return FALLBACK_LOGO;
    return encodeURI(pathValue);
}

function createPlaceholderCard() {
    return `
        <div class="tool-card placeholder" aria-hidden="true"></div>
    `;
}

function getToolTag(tool) {
    if (typeof tool.tag === 'string' && tool.tag.trim()) {
        return tool.tag.trim();
    }
    if (typeof tool.name === 'string' && TOOL_TAG_MAP[tool.name]) {
        return TOOL_TAG_MAP[tool.name];
    }
    return '多场景AI工具';
}

function createToolCard(tool) {
    const safeLogo = toSafePath(tool.logo);
    const safeName = tool.name || '未命名工具';
    const hasUrl = typeof tool.url === 'string' && tool.url.trim().length > 0;
    const tag = getToolTag(tool);

    if (!hasUrl) {
        return `
            <div class="tool-card disabled" title="URL待补充：${safeName}">
                <div class="logo-wrap">
                    <img src="${safeLogo}" alt="${safeName}" loading="lazy" decoding="async" onerror="this.src='${FALLBACK_LOGO}'" />
                </div>
                <div class="tool-meta">
                    <div class="tool-name">${safeName}</div>
                    <div class="tool-desc">${tag}</div>
                    <div class="tool-status">待补链接</div>
                </div>
            </div>
        `;
    }

    return `
        <a class="tool-card" href="${tool.url}" target="_blank" rel="noopener noreferrer" title="打开 ${safeName}">
            <div class="logo-wrap">
                <img src="${safeLogo}" alt="${safeName}" loading="lazy" decoding="async" onerror="this.src='${FALLBACK_LOGO}'" />
            </div>
            <div class="tool-meta">
                <div class="tool-name">${safeName}</div>
                <div class="tool-desc" title="${tag}">${tag}</div>
            </div>
        </a>
    `;
}

function buildRowCards(items) {
    const cards = items.map(createToolCard);
    while (cards.length < 3) {
        cards.push(createPlaceholderCard());
    }
    return cards.join('');
}

function renderSection(section) {
    const intlRows = chunk(section.international || [], 3);
    const cnRows = chunk(section.china || [], 3);
    const rowCount = Math.max(intlRows.length, cnRows.length, 1);
    const intlCount = (section.international || []).length;
    const cnCount = (section.china || []).length;

    let rowsHtml = '';
    for (let i = 0; i < rowCount; i += 1) {
        rowsHtml += `
            <div class="tool-row">
                <div class="tool-group">
                    ${buildRowCards(intlRows[i] || [])}
                </div>
                <div class="tool-divider" aria-hidden="true"></div>
                <div class="tool-group">
                    ${buildRowCards(cnRows[i] || [])}
                </div>
            </div>
        `;
    }

    return `
        <section class="tool-section" id="${section.id}">
            <div class="section-head">
                <h2>${section.title}</h2>
                <div class="section-meta">国际 ${intlCount} · 国内 ${cnCount}</div>
            </div>
            <div class="section-body">
                ${rowsHtml}
            </div>
        </section>
    `;
}

function renderCategoryList() {
    const container = document.getElementById('categoryList');
    if (!container) return;

    container.innerHTML = TOOL_SECTIONS.map((section, index) => {
        const iconClass = CATEGORY_ICON_MAP[section.id] || 'fas fa-cube';
        return `
            <a class="category-link ${index === 0 ? 'active' : ''}" href="#${section.id}" data-section="${section.id}" title="${section.title}" aria-label="${section.title}">
                <i class="${iconClass}"></i>
                <span>${section.title}</span>
            </a>
        `;
    }).join('');
}

function renderToolsPage() {
    const container = document.getElementById('toolsSections');
    if (!container) return;

    container.innerHTML = TOOL_SECTIONS.map(renderSection).join('');
}

function bindCategoryActiveState() {
    const links = Array.from(document.querySelectorAll('.category-link'));
    if (!links.length) return;

    links.forEach((link) => {
        link.addEventListener('click', () => {
            links.forEach((item) => item.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCategoryList();
    renderToolsPage();
    bindCategoryActiveState();
});
