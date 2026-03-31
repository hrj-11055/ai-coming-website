import { ALL_SKILLS, getSkillBySlug } from './modules/skills-catalog.js';
import { trackPageView } from './modules/visit-tracker.js';

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

function renderRelatedSkill(skill) {
    return `
        <a class="related-skill-card" href="${skill.detailUrl}">
            <span class="related-skill-chip">${skill.moduleTitle}</span>
            <strong>${skill.name}</strong>
            <span>${skill.headline}</span>
        </a>
    `;
}

function getRelatedSkills(skill) {
    return (skill.relatedSlugs || [])
        .map((slug) => getSkillBySlug(slug))
        .filter(Boolean)
        .slice(0, 3);
}

function renderHeroSummaryCard(title, value, body) {
    return `
        <article class="detail-summary-card">
            <span class="detail-summary-label">${title}</span>
            <strong>${value}</strong>
            <p>${body}</p>
        </article>
    `;
}

function renderDetail(skill) {
    const relatedSkills = getRelatedSkills(skill);
    const heroTags = (skill.useCases || []).slice(0, 4);
    const recommendedStack = relatedSkills.length
        ? relatedSkills.map((item) => item.name).join(' / ')
        : '先单独上手当前 Skill';
    const summaryCards = [
        renderHeroSummaryCard('所属模块', skill.moduleTitle, skill.moduleDescription || '按模块聚合高频可复用能力。'),
        renderHeroSummaryCard('推荐搭配', recommendedStack, '把当前 Skill 和相邻能力串起来，通常更容易形成稳定工作流。')
    ].join('');

    const installPanel = skill.installCommand ? `
        <article class="detail-panel detail-panel-emphasis">
            <span class="detail-panel-kicker">Quick Setup</span>
            <h2>快捷安装</h2>
            <p>${skill.installHint || '复制下面的命令到终端即可安装这个 Skill。'}</p>
            <div class="detail-code-wrap">
                <pre class="detail-code-block"><code>${escapeHtml(skill.installCommand)}</code></pre>
                <button class="detail-copy-btn" type="button" data-copy-text="${escapeHtml(skill.installCommand)}">
                    <i class="fa-regular fa-copy"></i>
                    <span>复制命令</span>
                </button>
            </div>
        </article>
    ` : '';
    const skillDocPanel = skill.skillDocPurpose ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Skill Logic</span>
            <h2>Skills.md 主要做什么</h2>
            <p>${skill.skillDocPurpose}</p>
        </article>
    ` : '';
    const sourcePanel = skill.sourceUrl ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Upstream</span>
            <h2>上游仓库</h2>
            <p>想继续看官方 README、脚本细节、更新记录或完整使用方式，可以直接打开这个 Skill 的上游仓库。</p>
            <div class="detail-source-actions">
                <a class="detail-source-btn" href="${escapeHtml(skill.sourceUrl)}" target="_blank" rel="noreferrer">
                    <i class="fa-brands fa-github"></i>
                    <span>查看 GitHub 仓库</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
        </article>
    ` : '';

    return `
        <div class="skill-detail-shell" data-tone="${skill.moduleTone || 'violet'}">
            <section class="detail-hero-card">
                <div class="detail-breadcrumb">
                    <a href="skills.html">Agent Skills</a>
                    <span>/</span>
                    <span>${skill.moduleTitle}</span>
                </div>
                <div class="detail-hero-layout">
                    <div class="detail-hero-main">
                        <span class="detail-module-chip">
                            <i class="${skill.moduleIcon}"></i>
                            <span>${skill.moduleTitle}</span>
                        </span>
                        <h1>${skill.name}</h1>
                        <p>${skill.headline}</p>
                        <div class="detail-hero-tags">
                            ${heroTags.map((item) => `<span class="detail-hero-tag">${item}</span>`).join('')}
                        </div>
                    </div>
                    <div class="detail-hero-rail">
                        ${summaryCards}
                    </div>
                </div>
            </section>

            <section class="detail-grid">
                <article class="detail-panel">
                    <span class="detail-panel-kicker">Overview</span>
                    <h2>Skill 简介</h2>
                    <p>${skill.overview}</p>
                </article>
                ${installPanel}
                <article class="detail-panel">
                    <span class="detail-panel-kicker">Use Cases</span>
                    <h2>适合场景</h2>
                    <ul>${renderList(skill.useCases || [])}</ul>
                </article>
                <article class="detail-panel" id="usage-guide">
                    <span class="detail-panel-kicker">Workflow</span>
                    <h2>怎么开始使用</h2>
                    <ol>${renderList(skill.gettingStarted || [])}</ol>
                </article>
                <article class="detail-panel">
                    <span class="detail-panel-kicker">Best First Fit</span>
                    <h2>适合谁先试</h2>
                    <p>${skill.scenario}</p>
                </article>
                ${sourcePanel}
                ${skillDocPanel}
            </section>

            <section class="detail-panel detail-panel-wide">
                <div class="detail-panel-head">
                    <div>
                        <span class="detail-panel-kicker">Recommended Stack</span>
                        <h2>推荐搭配</h2>
                        <p>先从当前 Skill 上手，再把它和相邻能力串成完整工作流。</p>
                    </div>
                    <a class="detail-back-link" href="skills.html#${skill.moduleId}">返回模块</a>
                </div>
                <div class="related-skill-grid">
                    ${relatedSkills.length ? relatedSkills.map(renderRelatedSkill).join('') : '<p class="detail-empty">这个 Skill 暂时没有补充的相关推荐。</p>'}
                </div>
            </section>
        </div>
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
            <span class="detail-module-chip">未找到 Skill</span>
            <h1>这个 Skill 详情页还没有准备好</h1>
            <p>当前 slug：${escapeHtml(slug || '空参数')}。你可以先回到 Agent Skills 列表继续浏览其它模块。</p>
            <p><a class="detail-back-link" href="skills.html">返回 Agent Skills</a></p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    trackPageView();
    const content = document.getElementById('skillDetailContent');
    const title = document.getElementById('skillDetailTitle');
    const description = document.getElementById('skillDetailDescription');

    if (!content) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || '';
    const skill = getSkillBySlug(slug);

    if (!skill) {
        content.innerHTML = renderNotFound(slug);
        return;
    }

    document.title = `${skill.name} - Agent Skills - AIcoming`;
    if (title) title.textContent = skill.name;
    if (description) {
        description.setAttribute('content', `${skill.name}：${skill.headline}`);
    }

    content.innerHTML = renderDetail(skill);
    bindCopyButtons();
});

export { ALL_SKILLS };
