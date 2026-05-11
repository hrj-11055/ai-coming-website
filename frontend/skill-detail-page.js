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

function githubUrlToZip(sourceUrl) {
    if (!sourceUrl || !sourceUrl.includes('github.com')) return null;
    // https://github.com/{owner}/{repo}/tree/{branch}/{path} -> https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip
    const treeMatch = sourceUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)/);
    if (treeMatch) {
        const [, owner, repo, branch] = treeMatch;
        return `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
    }
    // https://github.com/{owner}/{repo} -> https://github.com/{owner}/{repo}/archive/refs/heads/main.zip
    const plainMatch = sourceUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
    if (plainMatch) {
        const [, owner, repo] = plainMatch;
        return `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
    }
    return null;
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

function renderMarkdownLinks(links = []) {
    if (!links.length) return '';

    return `
        <div class="markdown-guide-links">
            ${links.map((link) => `
                <a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">
                    ${escapeHtml(link.label)}
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            `).join('')}
        </div>
    `;
}

function renderMarkdownSection(section, index) {
    const titleTag = index === 0 ? 'h1' : 'h2';
    const hash = index === 0 ? '#' : '##';
    const body = Array.isArray(section.body) ? section.body : [section.body].filter(Boolean);

    return `
        <section class="markdown-guide-section">
            <${titleTag}><span class="markdown-guide-hash">${hash}</span>${escapeHtml(section.title)}</${titleTag}>
            ${body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
            ${renderMarkdownLinks(section.links)}
            ${section.code ? `
                <div class="markdown-guide-code-wrap">
                    <pre class="markdown-guide-code"><code>${escapeHtml(section.code)}</code></pre>
                    <button class="detail-copy-btn markdown-guide-copy" type="button" data-copy-text="${escapeHtml(section.code)}">
                        <i class="fa-regular fa-copy"></i>
                        <span>复制代码</span>
                    </button>
                </div>
            ` : ''}
            ${section.list?.length ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
            ${section.image ? `
                <figure class="markdown-guide-image detail-screenshot-item">
                    <img src="${escapeHtml(section.image.src)}" alt="${escapeHtml(section.image.caption)}" loading="lazy">
                    <figcaption>${escapeHtml(section.image.caption)}</figcaption>
                </figure>
            ` : ''}
            ${section.images?.length ? `
                <div class="markdown-guide-image-grid">
                    ${section.images.map((img) => `
                        <figure class="markdown-guide-image-grid-item detail-screenshot-item">
                            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption)}" loading="lazy">
                            <figcaption>${escapeHtml(img.caption)}</figcaption>
                        </figure>
                    `).join('')}
                </div>
            ` : ''}
        </section>
    `;
}

function renderMarkdownGuideDetail(skill) {
    return `
        <article class="markdown-guide-article">
            <nav class="markdown-guide-breadcrumb" aria-label="面包屑">
                <a href="skills.html#${skill.moduleId}">AI 能力库</a>
                <i class="fa-solid fa-angle-right"></i>
                <span>${escapeHtml(skill.name)}</span>
            </nav>

            <header class="markdown-guide-header">
                <span>${escapeHtml(skill.moduleTitle || 'AI 能力库')}</span>
                <p>${escapeHtml(skill.overview || skill.headline)}</p>
                ${skill.sourceUrl ? `
                    <a href="${escapeHtml(skill.sourceUrl)}" target="_blank" rel="noreferrer">
                        ${escapeHtml(skill.sourceLabel || '查看来源')}
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                ` : ''}
            </header>

            ${(skill.markdownSections || []).map(renderMarkdownSection).join('')}
        </article>
    `;
}

function renderGuideHighlightCard(item) {
    return `
        <article class="detail-guide-card">
            <strong>${item.title}</strong>
            <p>${item.body}</p>
        </article>
    `;
}

function renderFeaturedSkillPick(item) {
    const linkedSkill = item.slug ? getSkillBySlug(item.slug) : null;
    const tag = linkedSkill ? 'a' : 'article';
    const href = linkedSkill ? ` href="${linkedSkill.detailUrl}"` : '';

    return `
        <${tag} class="detail-pick-card"${href}>
            <span class="detail-pick-chip">${item.name}</span>
            <strong>${item.fit}</strong>
            <p>${item.reason}</p>
            ${linkedSkill ? '<span class="detail-pick-link">查看对应 Skill <i class="fa-solid fa-arrow-right"></i></span>' : ''}
        </${tag}>
    `;
}

function renderDetail(skill) {
    const relatedSkills = getRelatedSkills(skill);
    const heroTags = [skill.statusLabel, skill.featuredBadge, ...(skill.useCases || [])]
        .filter(Boolean)
        .slice(0, 6);
    const preparationCount = (skill.preparation || []).length || (skill.gettingStarted || []).length || 0;
    const summaryCards = [
        renderHeroSummaryCard('所属模块', skill.moduleTitle, skill.moduleDescription || '按模块聚合高频可复用能力。'),
        renderHeroSummaryCard('上手方式', skill.promptExample ? '复制命令 + 提示词' : '先完成安装', '按照步骤操作，快速开始使用。'),
        renderHeroSummaryCard('准备事项', preparationCount ? `${preparationCount} 项` : '少量准备', '提前准备好所需条件，提高首次使用成功率。')
    ].join('');

    const zipUrl = githubUrlToZip(skill.sourceUrl);
    const installPanelBase = renderCopyPanel({
        kicker: 'Quick Setup',
        title: '安装命令',
        description: skill.installHint || '复制下面的命令到终端即可安装这个 Skill。',
        text: skill.installCommand,
        buttonLabel: '复制命令'
    });
    const installPanel = zipUrl
        ? installPanelBase.replace('</section>', `
            <div class="detail-source-actions">
                <a class="detail-source-btn" href="${escapeHtml(zipUrl)}" download rel="noreferrer">
                    <i class="fa-solid fa-file-zipper"></i>
                    <span>下载 ZIP 安装包</span>
                    <i class="fa-solid fa-download"></i>
                </a>
            </div>
            <p style="margin-top:12px;color:#6b7280;font-size:13px;">如果安装命令执行失败，可以下载 ZIP 安装包手动安装。</p>
        </section>`)
        : installPanelBase;
    const promptPanel = renderCopyPanel({
        kicker: 'Prompt',
        title: '直接复制的提示词',
        description: '第一次上手时，先直接复制这段提示词，把文件名、主题、链接或平台替换成你自己的真实信息。',
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
    const guideHighlightsPanel = skill.guideHighlights?.length ? `
        <section class="detail-panel detail-panel-wide detail-panel--full">
            <div class="detail-panel-head">
                <div>
                    <span class="detail-panel-kicker">Why This Repo</span>
                    <h2>为什么先看这个专题</h2>
                    <p>了解这组 Skill 适合谁、为什么值得优先尝试、如何快速开始。</p>
                </div>
            </div>
            <div class="detail-guide-grid">
                ${skill.guideHighlights.map(renderGuideHighlightCard).join('')}
            </div>
        </section>
    ` : '';
    const featuredSkillsPanel = skill.featuredSkills?.length ? `
        <section class="detail-panel detail-panel-wide detail-panel--full">
            <div class="detail-panel-head">
                <div>
                    <span class="detail-panel-kicker">Best Picks</span>
                    <h2>优先试这几个 Skill</h2>
                    <p>以下是最容易上手、能快速看到效果的能力入口。</p>
                </div>
            </div>
            <div class="detail-pick-grid">
                ${skill.featuredSkills.map(renderFeaturedSkillPick).join('')}
            </div>
        </section>
    ` : '';
    const notesPanel = skill.notes?.length ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Notes</span>
            <h2>第一次使用时的提醒</h2>
            <ul>${renderList(skill.notes)}</ul>
        </article>
    ` : '';
    const skillDocPanel = skill.skillDocPurpose ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Skill Logic</span>
            <h2>这个 Skill 的说明文件在帮你做什么</h2>
            <p>${skill.skillDocPurpose}</p>
        </article>
    ` : '';
    const sourceIsGithub = skill.sourceUrl?.includes('github.com');
    const sourcePanel = skill.sourceUrl ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Source</span>
            <h2>${sourceIsGithub ? '源码仓库' : '来源页面'}</h2>
            <p>${sourceIsGithub ? '查看官方 README、更新记录和完整使用说明。' : '查看原始文档、截图来源和完整说明。'}</p>
            <div class="detail-source-actions">
                <a class="detail-source-btn" href="${escapeHtml(skill.sourceUrl)}" target="_blank" rel="noreferrer">
                    <i class="${sourceIsGithub ? 'fa-brands fa-github' : 'fa-solid fa-arrow-up-right-from-square'}"></i>
                    <span>${escapeHtml(skill.sourceLabel || (sourceIsGithub ? '查看 GitHub 仓库' : '查看来源页面'))}</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                ${zipUrl ? `
                <a class="detail-source-btn" href="${escapeHtml(zipUrl)}" download rel="noreferrer">
                    <i class="fa-solid fa-file-zipper"></i>
                    <span>下载 ZIP 源码包</span>
                    <i class="fa-solid fa-download"></i>
                </a>
                ` : ''}
            </div>
        </article>
    ` : '';
    const galleryPanel = skill.gallery?.length ? `
        <section class="detail-panel detail-panel-wide">
            <div class="detail-panel-head">
                <div>
                    <span class="detail-panel-kicker">Walkthrough</span>
                    <h2>实操截图</h2>
                    <p>有图的地方直接看结果，没有图的 Skill 也能先按上面的提示词跑通。</p>
                </div>
            </div>
            <div class="detail-gallery-grid">
                ${skill.gallery.map((item) => `
                    <figure class="detail-gallery-card">
                        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || skill.name)}" loading="lazy">
                        <figcaption>
                            <strong>${escapeHtml(skill.name)}</strong>
                            <span>${item.caption}</span>
                        </figcaption>
                    </figure>
                `).join('')}
            </div>
        </section>
    ` : '';

    const screenshotsPanel = (skill.screenshots && skill.screenshots.length) ? `
        <article class="detail-panel detail-panel--full">
            <span class="detail-panel-kicker">Screenshots</span>
            <h2>实操截图</h2>
            <div class="detail-screenshot-grid">
                ${skill.screenshots.map((shot, i) => `
                    <figure class="detail-screenshot-item" data-index="${i}">
                        <img src="${shot.src}" alt="${escapeHtml(shot.caption)}" loading="lazy" />
                        <figcaption>${escapeHtml(shot.caption)}</figcaption>
                    </figure>
                `).join('')}
            </div>
        </article>
    ` : '';

    const examplePromptPanel = skill.examplePrompt ? `
        <article class="detail-panel">
            <span class="detail-panel-kicker">Example</span>
            <h2>示例提示词</h2>
            <p>你可以直接复制这段提示词，在 Claude Code 中粘贴使用。</p>
            <div class="detail-code-wrap">
                <pre class="detail-code-block"><code>${escapeHtml(skill.examplePrompt)}</code></pre>
                <button class="detail-copy-btn" type="button" data-copy-text="${escapeHtml(skill.examplePrompt)}">
                    <i class="fa-regular fa-copy"></i>
                    <span>复制提示词</span>
                </button>
            </div>
        </article>
    ` : '';

    return `
        <div class="skill-detail-shell" data-tone="${skill.moduleTone || 'violet'}">
            <section class="detail-hero-card">
                <div class="detail-breadcrumb">
                    <a href="skills.html">AI 能力库</a>
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
                        ${skill.beginnerNote ? `<div class="detail-starter-note">${skill.beginnerNote}</div>` : ''}
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
                ${preparationPanel}
                ${examplePromptPanel}
                <article class="detail-panel">
                    <span class="detail-panel-kicker">Use Cases</span>
                    <h2>适合场景</h2>
                    <ul>${renderList(skill.useCases || [])}</ul>
                </article>
                ${guideHighlightsPanel}
                ${screenshotsPanel}
                ${featuredSkillsPanel}
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
                ${resultPanel}
                ${notesPanel}
                ${sourcePanel}
                ${skillDocPanel}
            </section>

            ${promptPanel}
            ${galleryPanel}

            <section class="detail-panel detail-panel-wide">
                <div class="detail-panel-head">
                    <div>
                        <span class="detail-panel-kicker">Recommended Stack</span>
                        <h2>推荐搭配</h2>
                        <p>先从当前 Skill 上手，再把它和相邻能力串成完整工作流。</p>
                    </div>
                    <a class="detail-back-link" href="skills.html#${skill.moduleId}">返回分组</a>
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

function bindScreenshotLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'detail-lightbox-overlay';
    overlay.innerHTML = '<img class="detail-lightbox-img" src="" alt="" /><button class="detail-lightbox-close" type="button" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>';
    document.body.appendChild(overlay);

    const lightboxImg = overlay.querySelector('.detail-lightbox-img');
    const closeBtn = overlay.querySelector('.detail-lightbox-close');

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        overlay.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        overlay.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    document.querySelectorAll('.detail-screenshot-item img').forEach((img) => {
        img.addEventListener('click', () => {
            openLightbox(img.src, img.alt);
        });
    });
}

function renderNotFound(slug) {
    return `
        <div class="detail-hero-card detail-hero-card--empty">
            <span class="detail-module-chip">未找到 Skill</span>
            <h1>这个 Skill 详情页还没有准备好</h1>
            <p>当前 slug：${escapeHtml(slug || '空参数')}。你可以先回到 AI 能力库列表继续浏览其它分组。</p>
            <p><a class="detail-back-link" href="skills.html">返回 AI 能力库</a></p>
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

    document.title = `${skill.name} - AI 能力库 - AIcoming`;
    if (title) title.textContent = skill.name;
    if (description) {
        description.setAttribute('content', `${skill.name}：${skill.headline}`);
    }

    content.innerHTML = skill.detailLayout === 'markdown'
        ? renderMarkdownGuideDetail(skill)
        : renderDetail(skill);
    bindCopyButtons();
    bindScreenshotLightbox();
});

export { ALL_SKILLS };
