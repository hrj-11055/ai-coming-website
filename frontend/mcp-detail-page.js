import { getMcpBySlug } from './modules/skills-catalog.js';

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function renderList(items) {
    return items.map((item) => `<li>${item}</li>`).join('');
}

function renderCopyPanel({ kicker, title, description, text, buttonLabel, className = 'detail-panel detail-panel-emphasis' }) {
    if (!text) {
        return '';
    }

    return `
        <section class="${className}">
            <span class="detail-panel-kicker">${kicker}</span>
            <h2>${title}</h2>
            <p>${description}</p>
            <div class="detail-code-wrap">
                <pre class="detail-code-block"><code>${escapeHtml(text)}</code></pre>
                <button class="detail-copy-btn" type="button" data-copy-text="${escapeHtml(text)}">
                    <i class="fa-regular fa-copy"></i>
                    <span>${buttonLabel}</span>
                </button>
            </div>
        </section>
    `;
}

function renderRelatedEntry(skill) {
    return `
        <a class="related-skill-card" href="${skill.detailUrl}">
            <strong>${skill.name}</strong>
            <span>${skill.headline}</span>
        </a>
    `;
}

function getRelatedEntries(skill) {
    return (skill.relatedSlugs || [])
        .map((slug) => getMcpBySlug(slug))
        .filter(Boolean)
        .slice(0, 3);
}

function renderSummaryCard(title, value, body) {
    return `
        <article class="detail-summary-card">
            <span class="detail-summary-label">${title}</span>
            <strong>${value}</strong>
            <p>${body}</p>
        </article>
    `;
}

function renderDetail(skill) {
    const relatedEntries = getRelatedEntries(skill);
    const heroTags = [skill.statusLabel, skill.featuredBadge, ...(skill.useCases || [])]
        .filter(Boolean)
        .slice(0, 6);
    const preparationCount = (skill.preparation || []).length || (skill.gettingStarted || []).length || 0;
    const summaryCards = [
        renderSummaryCard('所属模块', skill.moduleTitle, skill.moduleDescription || '按模块聚合高频可复用能力。'),
        renderSummaryCard('上手方式', skill.promptExample ? '先装再试' : '先完成配置', '先用最小测试场景确认 MCP 已接通，再进入正式任务，成功率会更高。'),
        renderSummaryCard('准备事项', preparationCount ? `${preparationCount} 项` : '少量准备', '先把目录、文件、页面或目标问题准备好，第一次上手更容易跑通。')
    ].join('');

    const installPanel = renderCopyPanel({
        kicker: 'Quick Setup',
        title: '快捷配置',
        description: skill.installHint || '把下面这段配置复制到你的 MCP 客户端配置文件中即可。',
        text: skill.installCommand,
        buttonLabel: '复制配置'
    });
    const promptPanel = renderCopyPanel({
        kicker: 'Prompt',
        title: '第一次可以直接复制的测试提示词',
        description: '先用这段提示词跑最小场景，确认 MCP 已经真正接入成功，再进入你自己的正式任务。',
        text: skill.promptExample,
        buttonLabel: '复制提示词',
        className: 'detail-panel detail-panel-wide detail-panel-emphasis'
    });
    const preparationPanel = skill.preparation?.length ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Before You Start</span>
            <h2>使用前准备</h2>
            <ul>${renderList(skill.preparation)}</ul>
        </article>
    ` : '';
    const resultPanel = skill.resultSummary || skill.resultBullets?.length ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Expected Result</span>
            <h2>运行后你会看到什么</h2>
            ${skill.resultSummary ? `<p>${skill.resultSummary}</p>` : ''}
            ${skill.resultBullets?.length ? `<ul>${renderList(skill.resultBullets)}</ul>` : ''}
        </article>
    ` : '';
    const notesPanel = skill.notes?.length ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Notes</span>
            <h2>第一次使用时的提醒</h2>
            <ul>${renderList(skill.notes)}</ul>
        </article>
    ` : '';

    return `
        <div class="detail-hero-card">
            <div class="detail-breadcrumb">
                <a href="skills.html">AI 能力库</a>
                <span>/</span>
                <span>${skill.moduleTitle}</span>
            </div>
            <div class="detail-hero-layout">
                <div class="detail-hero-main">
                    <span class="detail-module-chip">${skill.moduleTitle}</span>
                    <h1>${skill.name}</h1>
                    <p>${skill.headline}</p>
                    <div class="detail-hero-tags">
                        ${heroTags.map((item) => `<span class="detail-hero-tag">${item}</span>`).join('')}
                    </div>
                    ${skill.beginnerNote ? `<div class="detail-starter-note">${skill.beginnerNote}</div>` : ''}
                </div>
                <div class="detail-hero-rail">
                    ${summaryCards}
                </div>
            </div>
        </div>

        <section class="detail-grid">
            <article class="detail-panel">
                <span class="detail-panel-kicker">Overview</span>
                <h2>MCP 简介</h2>
                <p>${skill.overview}</p>
            </article>
            ${installPanel}
            ${preparationPanel}
            <article class="detail-panel">
                <span class="detail-panel-kicker">Use Cases</span>
                <h2>适合场景</h2>
                <ul>${renderList(skill.useCases || [])}</ul>
            </article>
            <article class="detail-panel">
                <span class="detail-panel-kicker">Workflow</span>
                <h2>怎么开始使用</h2>
                <ol>${renderList(skill.gettingStarted || [])}</ol>
            </article>
            <article class="detail-panel">
                <span class="detail-panel-kicker">Best First Fit</span>
                <h2>适合谁先试</h2>
                <p>${skill.scenario}</p>
            </article>
            ${resultPanel}
            <article class="detail-panel">
                <span class="detail-panel-kicker">MCP Config</span>
                <h2>MCP 配置主要做什么</h2>
                <p>${skill.mcpConfigPurpose || '这段配置会把对应 MCP Server 接进你的客户端，并准备好它运行所需的命令、地址或密钥。'}</p>
            </article>
            ${notesPanel}
            ${skill.sourceUrl ? `
            <article class="detail-panel">
                <span class="detail-panel-kicker">Upstream</span>
                <h2>项目主页</h2>
                <p>想继续看官方 README、更多参数和更新日志，可以直接打开原始项目仓库。</p>
                <div class="detail-source-actions">
                    <a class="detail-source-btn" href="${escapeHtml(skill.sourceUrl)}" target="_blank" rel="noreferrer">
                        <i class="fa-brands fa-github"></i>
                        <span>查看 GitHub 仓库</span>
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </article>
            ` : ''}
        </section>

        ${promptPanel}

        <section class="detail-panel detail-panel-wide">
            <div class="detail-panel-head">
                <div>
                    <span class="detail-panel-kicker">Recommended Stack</span>
                    <h2>推荐搭配</h2>
                    <p>先从当前 MCP 上手，再和相邻工具串成完整工作流。</p>
                </div>
                <a class="detail-back-link" href="skills.html#${skill.moduleId}">返回分组</a>
            </div>
            <div class="related-skill-grid">
                ${relatedEntries.length ? relatedEntries.map(renderRelatedEntry).join('') : '<p class="detail-empty">这个 MCP 暂时没有补充的相关推荐。</p>'}
            </div>
        </section>
    `;
}

async function copyText(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
}

function bindCopyButtons() {
    const buttons = document.querySelectorAll('.detail-copy-btn');

    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            const text = button.dataset.copyText || '';
            const label = button.querySelector('span');

            if (!text || !label) return;

            const previous = label.textContent;

            try {
                await copyText(text);
                label.textContent = '已复制';
                button.classList.add('is-copied');
            } catch {
                label.textContent = '复制失败';
            }

            window.setTimeout(() => {
                label.textContent = previous;
                button.classList.remove('is-copied');
            }, 1600);
        });
    });
}

function renderNotFound(slug) {
    return `
        <div class="detail-hero-card detail-hero-card--empty">
            <span class="detail-module-chip">未找到 MCP</span>
            <h1>这个 MCP 详情页还没有准备好</h1>
            <p>当前 slug：${escapeHtml(slug || '空参数')}。你可以先回到 AI 能力库列表继续浏览其它分组。</p>
            <p><a class="detail-back-link" href="skills.html#mcp-starter">返回 MCP 入门</a></p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('mcpDetailContent');
    const title = document.getElementById('mcpDetailTitle');
    const description = document.getElementById('mcpDetailDescription');

    if (!content) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || '';
    const skill = getMcpBySlug(slug);

    if (!skill) {
        content.innerHTML = renderNotFound(slug);
        return;
    }

    document.title = `${skill.name} - AI 能力库 - AIcoming`;
    if (title) title.textContent = skill.name;
    if (description) {
        description.setAttribute('content', `${skill.name}：${skill.headline}`);
    }

    content.innerHTML = renderDetail(skill);
    bindCopyButtons();
});
