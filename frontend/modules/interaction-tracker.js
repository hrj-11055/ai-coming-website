const INTERACTION_TRACK_ENDPOINT = '/api/interaction/track';

const PRIMARY_NAV_LABELS = new Map([
    ['index.html', '首页'],
    ['news.html', 'AI资讯'],
    ['tools.html', 'AI工具集'],
    ['skills.html', 'AI 能力库'],
    ['about.html', '关于我们']
]);

function trimText(value, maxLength = 160) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function getPathNameFromHref(href) {
    try {
        const url = new URL(href, 'https://ai-coming.local');
        return url.pathname.split('/').pop() || '';
    } catch {
        return String(href || '').split('?')[0].split('#')[0].split('/').pop() || '';
    }
}

export function getPrimaryNavLabel(href) {
    return PRIMARY_NAV_LABELS.get(getPathNameFromHref(href)) || '';
}

export function buildInteractionPayload({
    eventType,
    eventLabel = '',
    target = '',
    locationLike = globalThis.location,
    documentLike = globalThis.document
}) {
    const pathname = locationLike?.pathname || '';
    const search = locationLike?.search || '';
    return {
        eventType: trimText(eventType, 64),
        eventLabel: trimText(eventLabel, 120),
        target: trimText(target, 180),
        pagePath: trimText(`${pathname}${search}`, 180),
        referrer: trimText(documentLike?.referrer || '', 240),
        pageTitle: trimText(documentLike?.title || '', 120)
    };
}

function sendByBeacon(payload) {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
        return false;
    }

    try {
        const body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        return navigator.sendBeacon(INTERACTION_TRACK_ENDPOINT, body);
    } catch {
        return false;
    }
}

async function sendByFetch(payload) {
    try {
        await fetch(INTERACTION_TRACK_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            keepalive: true
        });
    } catch {
        // 埋点不能影响用户交互。
    }
}

export function trackInteraction(event) {
    const payload = buildInteractionPayload(event);
    if (!payload.eventType) {
        return;
    }

    if (sendByBeacon(payload)) {
        return;
    }

    void sendByFetch(payload);
}

export function bindPrimaryNavTracking(root = document) {
    if (!root?.querySelectorAll) {
        return;
    }

    root.querySelectorAll('.nav-container a[href], .nav-shell a[href]').forEach((link) => {
        const label = getPrimaryNavLabel(link.getAttribute('href'));
        if (!label || link.dataset.interactionBound === 'true') {
            return;
        }

        link.dataset.interactionBound = 'true';
        link.addEventListener('click', () => {
            trackInteraction({
                eventType: 'nav_click',
                eventLabel: label,
                target: link.getAttribute('href') || ''
            });
        });
    });
}
