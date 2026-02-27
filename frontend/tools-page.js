import { TOOL_SECTIONS } from './modules/tools-catalog.js';

const FALLBACK_LOGO = '/logos/default.png';

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

function createToolCard(tool) {
    const safeLogo = toSafePath(tool.logo);
    const safeName = tool.name || '未命名工具';
    const hasUrl = typeof tool.url === 'string' && tool.url.trim().length > 0;

    if (!hasUrl) {
        return `
            <div class="tool-card disabled" title="URL待补充：${safeName}">
                <div class="logo-wrap">
                    <img src="${safeLogo}" alt="${safeName}" loading="lazy" decoding="async" onerror="this.src='${FALLBACK_LOGO}'" />
                </div>
                <div class="tool-name">${safeName}</div>
                <div class="tool-status">待补链接</div>
            </div>
        `;
    }

    return `
        <a class="tool-card" href="${tool.url}" target="_blank" rel="noopener noreferrer" title="打开 ${safeName}">
            <div class="logo-wrap">
                <img src="${safeLogo}" alt="${safeName}" loading="lazy" decoding="async" onerror="this.src='${FALLBACK_LOGO}'" />
            </div>
            <div class="tool-name">${safeName}</div>
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

    let rowsHtml = '';
    for (let i = 0; i < rowCount; i += 1) {
        rowsHtml += `
            <div class="tool-row">
                <div class="tool-group">
                    ${buildRowCards(intlRows[i] || [])}
                </div>
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
                <div class="section-labels">
                    <span class="label">国际</span>
                    <span class="label">国内</span>
                </div>
            </div>
            <div class="section-body">
                ${rowsHtml}
            </div>
        </section>
    `;
}

function renderToolsPage() {
    const container = document.getElementById('toolsSections');
    if (!container) return;

    container.innerHTML = TOOL_SECTIONS.map(renderSection).join('');
}

function updateFooterYear() {
    const year = new Date().getFullYear();
    const node = document.getElementById('footerYear');
    if (node) {
        node.textContent = String(year);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderToolsPage();
    updateFooterYear();
});
