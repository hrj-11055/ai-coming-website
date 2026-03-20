import { SKILL_MODULES } from './modules/skills-catalog.js';

function createNavItem(module, index) {
    const itemLabel = module.itemLabel || 'Skill';

    return `
        <a class="skill-nav-link ${index === 0 ? 'active' : ''}" href="#${module.id}" data-section="${module.id}" data-tone="${module.tone}">
            <span class="skill-nav-icon"><i class="${module.icon}"></i></span>
            <span class="skill-nav-copy">
                <strong>${module.title}</strong>
                <small>${module.skills.length} 个 ${itemLabel}</small>
            </span>
        </a>
    `;
}

function createSkillCard(skill) {
    return `
        <article class="skill-card">
            <div class="skill-card-top">
                <span class="skill-module-chip">${skill.moduleTitle}</span>
                <h3>${skill.name}</h3>
            </div>
            <p class="skill-headline">${skill.headline}</p>
            <p class="skill-scenario">${skill.scenario}</p>
            <a class="skill-card-link" href="${skill.detailUrl}">
                查看使用说明
                <i class="fa-solid fa-arrow-right"></i>
            </a>
        </article>
    `;
}

function createSection(module) {
    return `
        <section class="skill-section" id="${module.id}">
            <div class="skill-section-head">
                <div>
                    <div class="skill-section-kicker">${module.title}</div>
                    <h2>${module.title}</h2>
                    <p>${module.description}</p>
                </div>
                <div class="skill-section-meta">${module.skills.length} / 统一格式</div>
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

function renderStats() {
    const moduleCount = document.getElementById('skillsModuleCount');
    const itemCount = document.getElementById('skillsItemCount');
    const totalItems = SKILL_MODULES.reduce((sum, module) => sum + module.skills.length, 0);

    if (moduleCount) {
        moduleCount.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${SKILL_MODULES.length} 个模块`;
    }

    if (itemCount) {
        itemCount.innerHTML = `<i class="fa-solid fa-grid-2"></i> ${totalItems} 个条目`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderStats();
    renderNav();
    renderSections();
    bindNavHighlight();
});
