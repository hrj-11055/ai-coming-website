import { SKILL_MODULES } from './modules/skills-catalog.js';
import { trackPageView } from './modules/visit-tracker.js';

function createNavItem(module, index) {
    return `
        <a class="skill-nav-link ${index === 0 ? 'active' : ''}" href="#${module.id}" data-section="${module.id}" data-tone="${module.tone}">
            <span class="skill-nav-icon"><i class="${module.icon}"></i></span>
            <span class="skill-nav-copy">
                <strong>${module.title}</strong>
            </span>
            <span class="skill-nav-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-up-right"></i></span>
        </a>
    `;
}

function createSkillCard(skill) {
    const cardHeadline = skill.cardHeadline || skill.headline;
    const cardScenario = skill.cardScenario || skill.scenario;
    const cardClass = skill.detailType === 'mcp' ? 'skill-card skill-card-mcp' : 'skill-card';

    return `
        <article class="${cardClass}" data-tone="${skill.moduleTone}">
            <div class="skill-card-top">
                <span class="skill-module-chip">${skill.moduleTitle}</span>
                <h3>${skill.name}</h3>
            </div>
            <div class="skill-card-copy">
                <p class="skill-headline">${cardHeadline}</p>
                <p class="skill-scenario">${cardScenario}</p>
            </div>
            <a class="skill-card-link" href="${skill.detailUrl}">
                <span>查看使用说明</span>
                <i class="fa-solid fa-arrow-right"></i>
            </a>
        </article>
    `;
}

function createSection(module) {
    return `
        <section class="skill-section" id="${module.id}" data-tone="${module.tone}">
            <div class="skill-section-head">
                <div class="skill-section-intro">
                    <span class="skill-section-icon"><i class="${module.icon}"></i></span>
                    <div class="skill-section-copy">
                        <h2>${module.title}</h2>
                        <p>${module.description}</p>
                    </div>
                </div>
            </div>
            <div class="skill-card-grid">
                ${module.skills.map(createSkillCard).join('')}
            </div>
        </section>
    `;
}

function renderNav() {
    const nav = document.getElementById('skillsNavList');
    if (!nav) return;
    nav.innerHTML = SKILL_MODULES.map(createNavItem).join('');
}

function renderSections() {
    const content = document.getElementById('skillsSections');
    if (!content) return;
    content.innerHTML = SKILL_MODULES.map(createSection).join('');
}

function bindNavHighlight() {
    const links = Array.from(document.querySelectorAll('.skill-nav-link'));
    const sections = SKILL_MODULES.map((module) => document.getElementById(module.id)).filter(Boolean);

    if (!links.length || !sections.length) {
        return;
    }

    const setActive = (id) => {
        links.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === id);
        });
    };

    links.forEach((link) => {
        link.addEventListener('click', () => {
            setActive(link.dataset.section);
        });
    });

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
            setActive(visible.target.id);
        }
    }, {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.15, 0.3, 0.6]
    });

    sections.forEach((section) => observer.observe(section));
}

document.addEventListener('DOMContentLoaded', () => {
    trackPageView();
    renderNav();
    renderSections();
    bindNavHighlight();
});
