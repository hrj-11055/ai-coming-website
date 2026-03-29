const VISIT_TRACK_ENDPOINT = '/api/visit/track';

function buildPayload() {
    return {
        eventType: 'page_view',
        timestamp: new Date().toISOString(),
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || '',
        pageTitle: document.title || ''
    };
}

function sendByBeacon(payload) {
    if (typeof navigator.sendBeacon !== 'function') {
        return false;
    }

    try {
        const body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        return navigator.sendBeacon(VISIT_TRACK_ENDPOINT, body);
    } catch {
        return false;
    }
}

async function sendByFetch(payload) {
    try {
        await fetch(VISIT_TRACK_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            keepalive: true
        });
    } catch {
        // 页面埋点不能阻塞主流程，忽略追踪异常
    }
}

export async function trackPageView() {
    const payload = buildPayload();

    if (sendByBeacon(payload)) {
        return;
    }

    await sendByFetch(payload);
}
