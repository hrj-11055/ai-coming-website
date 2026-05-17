function getDateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('date') || new Date().toISOString().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
}

function toAbsoluteUrl(value) {
    const input = String(value || '').trim();
    if (!input) {
        return '';
    }

    if (/^https?:\/\//i.test(input)) {
        return input;
    }

    return new URL(input, window.location.origin).href;
}

function formatDuration(seconds) {
    const total = Number(seconds);
    if (!Number.isFinite(total) || total <= 0) {
        return '完整音频';
    }

    const minutes = Math.floor(total / 60);
    const rest = Math.round(total % 60);
    return `${minutes}分${String(rest).padStart(2, '0')}秒`;
}

function pickTranscript(metadata) {
    return metadata.script_markdown || metadata.transcript || metadata.script_tts_text || metadata.summary || '暂无文字稿。';
}

function setText(id, value) {
    const node = document.getElementById(id);
    if (node) {
        node.textContent = value;
    }
}

function setAudio(metadata) {
    const audio = document.getElementById('podcast-audio');
    const link = document.getElementById('podcast-open-audio');
    const audioUrl = toAbsoluteUrl(metadata.audio_url || `/api/podcast/news/${metadata.date}/audio`);

    if (audioUrl) {
        audio.src = audioUrl;
        link.href = audioUrl;
        link.removeAttribute('aria-disabled');
        return;
    }

    audio.removeAttribute('src');
    link.href = '#';
    link.setAttribute('aria-disabled', 'true');
}

async function loadPodcast() {
    const date = getDateFromUrl();
    const response = await fetch(`/api/podcast/news/${date}`);
    if (!response.ok) {
        throw new Error(`播客数据读取失败: HTTP ${response.status}`);
    }

    const metadata = await response.json();
    const pageUrl = `${window.location.origin}/podcast.html?date=${date}`;
    document.title = `${metadata.title || '小元说 AI'} - AIcoming`;
    setText('podcast-date', date);
    setText('podcast-title', metadata.title || '小元说 AI');
    setText('podcast-summary', metadata.summary || '今日 AI 资讯播客已准备。');
    setText('podcast-status', metadata.status === 'ready' ? '已生成' : metadata.status || '状态未知');
    setText('podcast-duration', formatDuration(metadata.duration_seconds));
    setText('podcast-count', metadata.article_count ? `${metadata.article_count} 条资讯` : 'AI 资讯');
    setText('podcast-transcript', pickTranscript(metadata));
    setText('podcast-message', metadata.status === 'ready' ? '可以直接收听完整音频。' : '播客还在准备中，请稍后刷新。');
    setAudio({ ...metadata, date });

    const copyButton = document.getElementById('podcast-copy-link');
    copyButton?.addEventListener('click', async () => {
        await navigator.clipboard.writeText(pageUrl);
        setText('podcast-message', '播放页链接已复制。');
    });
}

loadPodcast().catch((error) => {
    setText('podcast-status', '读取失败');
    setText('podcast-summary', '没有读取到这一天的播客数据。');
    setText('podcast-message', error.message || '播客数据读取失败。');
});
