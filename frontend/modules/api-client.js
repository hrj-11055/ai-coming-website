export async function apiFetch(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
}

export async function apiJson(url, options = {}, timeoutMs = 15000) {
    const response = await apiFetch(url, options, timeoutMs);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = data && (data.error || data.message) ? (data.error || data.message) : `HTTP ${response.status}`;
        throw new Error(message);
    }

    return data;
}
