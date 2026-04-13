const authToken = localStorage.getItem('admin_token');
const state = {
    currency: 'USD',
    model: '',
    daily: []
};

const elements = {
    modelMeta: document.getElementById('modelMeta'),
    updatedAt: document.getElementById('updatedAt'),
    fromDate: document.getElementById('fromDate'),
    toDate: document.getElementById('toDate'),
    applyFilterButton: document.getElementById('applyFilterButton'),
    last7Button: document.getElementById('last7Button'),
    last30Button: document.getElementById('last30Button'),
    logoutButton: document.getElementById('logoutButton'),
    todayRequests: document.getElementById('todayRequests'),
    todaySuccess: document.getElementById('todaySuccess'),
    todayTokens: document.getElementById('todayTokens'),
    todayTokenSplit: document.getElementById('todayTokenSplit'),
    todayCost: document.getElementById('todayCost'),
    last7Cost: document.getElementById('last7Cost'),
    last7Requests: document.getElementById('last7Requests'),
    last30Cost: document.getElementById('last30Cost'),
    last30Requests: document.getElementById('last30Requests'),
    rangeMeta: document.getElementById('rangeMeta'),
    rangeRequests: document.getElementById('rangeRequests'),
    rangeSuccess: document.getElementById('rangeSuccess'),
    rangeErrors: document.getElementById('rangeErrors'),
    rangePromptTokens: document.getElementById('rangePromptTokens'),
    rangeCompletionTokens: document.getElementById('rangeCompletionTokens'),
    rangeTotalTokens: document.getElementById('rangeTotalTokens'),
    rangeCost: document.getElementById('rangeCost'),
    rangeLatency: document.getElementById('rangeLatency'),
    rangeCurrency: document.getElementById('rangeCurrency'),
    dailyChart: document.getElementById('dailyChart'),
    dailyTable: document.getElementById('dailyTable'),
    recentTable: document.getElementById('recentTable')
};

if (!authToken) {
    window.location.href = `admin-login.html?return=${encodeURIComponent(window.location.href)}`;
}

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setPreset(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    elements.fromDate.value = dateKey(start);
    elements.toDate.value = dateKey(end);
}

function formatNumber(value) {
    return new Intl.NumberFormat('zh-CN').format(Number(value || 0));
}

function formatCost(value) {
    const formatter = new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: state.currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
    return formatter.format(Number(value || 0));
}

function formatLatency(value) {
    const latency = Number(value || 0);
    if (latency >= 1000) {
        return `${(latency / 1000).toFixed(2)} 秒`;
    }
    return `${Math.round(latency)} ms`;
}

function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function buildQuery() {
    const params = new URLSearchParams();
    if (elements.fromDate.value) params.set('from', elements.fromDate.value);
    if (elements.toDate.value) params.set('to', elements.toDate.value);
    const query = params.toString();
    return query ? `?${query}` : '';
}

async function apiJson(url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = `admin-login.html?return=${encodeURIComponent(window.location.href)}`;
        throw new Error('登录已过期');
    }

    if (!response.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
    }

    return data;
}

function setText(id, value) {
    elements[id].textContent = value;
}

function renderSummary(summary) {
    state.currency = summary.currency || state.currency;
    state.model = summary.model || state.model;

    const today = summary.today || {};
    const last7 = summary.last7Days || {};
    const last30 = summary.last30Days || {};
    const range = summary.range || {};

    elements.modelMeta.textContent = `首页固定模型：${state.model || '-'} · 输入 ${summary.pricing?.inputPricePerMillionTokens || 0}/百万 tokens · 输出 ${summary.pricing?.outputPricePerMillionTokens || 0}/百万 tokens`;
    elements.updatedAt.textContent = `更新时间：${formatDateTime(summary.generatedAt)}`;

    setText('todayRequests', formatNumber(today.requestCount));
    setText('todaySuccess', `成功 ${formatNumber(today.successCount)} / 失败 ${formatNumber(today.errorCount)}`);
    setText('todayTokens', formatNumber(today.totalTokens));
    setText('todayTokenSplit', `输入 ${formatNumber(today.promptTokens)} / 输出 ${formatNumber(today.completionTokens)}`);
    setText('todayCost', formatCost(today.totalCost));
    setText('last7Cost', formatCost(last7.totalCost));
    setText('last7Requests', `${formatNumber(last7.requestCount)} 次请求`);
    setText('last30Cost', formatCost(last30.totalCost));
    setText('last30Requests', `${formatNumber(last30.requestCount)} 次请求`);

    setText('rangeMeta', `${elements.fromDate.value || '最早'} 至 ${elements.toDate.value || '今天'}`);
    setText('rangeRequests', formatNumber(range.requestCount));
    setText('rangeSuccess', formatNumber(range.successCount));
    setText('rangeErrors', formatNumber(range.errorCount));
    setText('rangePromptTokens', formatNumber(range.promptTokens));
    setText('rangeCompletionTokens', formatNumber(range.completionTokens));
    setText('rangeTotalTokens', formatNumber(range.totalTokens));
    setText('rangeCost', formatCost(range.totalCost));
    setText('rangeLatency', formatLatency(range.averageLatencyMs));
    setText('rangeCurrency', state.currency);
}

function renderDailyChart(daily) {
    if (!daily.length) {
        elements.dailyChart.className = 'chart empty';
        elements.dailyChart.textContent = '暂无每日用量数据';
        return;
    }

    const maxCost = Math.max(...daily.map((item) => Number(item.totalCost || 0)), 0);
    elements.dailyChart.className = 'chart';
    elements.dailyChart.innerHTML = daily.map((item) => {
        const width = maxCost > 0 ? Math.max(Number(item.totalCost || 0) / maxCost * 100, 2) : 0;
        return `
            <div class="bar-row">
                <strong>${escapeHtml(item.date)}</strong>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${width}%"></div>
                </div>
                <span class="bar-value">${escapeHtml(formatCost(item.totalCost))}</span>
            </div>
        `;
    }).join('');
}

function renderDailyTable(daily) {
    if (!daily.length) {
        elements.dailyTable.className = 'table-wrap empty';
        elements.dailyTable.textContent = '暂无每日明细';
        return;
    }

    elements.dailyTable.className = 'table-wrap';
    elements.dailyTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>日期</th>
                    <th>请求数</th>
                    <th>成功</th>
                    <th>失败</th>
                    <th>输入 tokens</th>
                    <th>输出 tokens</th>
                    <th>总 tokens</th>
                    <th>费用</th>
                    <th>平均耗时</th>
                </tr>
            </thead>
            <tbody>
                ${daily.slice().reverse().map((item) => `
                    <tr>
                        <td>${escapeHtml(item.date)}</td>
                        <td>${formatNumber(item.requestCount)}</td>
                        <td>${formatNumber(item.successCount)}</td>
                        <td>${formatNumber(item.errorCount)}</td>
                        <td>${formatNumber(item.promptTokens)}</td>
                        <td>${formatNumber(item.completionTokens)}</td>
                        <td>${formatNumber(item.totalTokens)}</td>
                        <td>${escapeHtml(formatCost(item.totalCost))}</td>
                        <td>${escapeHtml(formatLatency(item.averageLatencyMs))}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderRecentTable(records) {
    if (!records.length) {
        elements.recentTable.className = 'table-wrap empty';
        elements.recentTable.textContent = '暂无最近请求';
        return;
    }

    elements.recentTable.className = 'table-wrap';
    elements.recentTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>时间</th>
                    <th>状态</th>
                    <th>输入 tokens</th>
                    <th>输出 tokens</th>
                    <th>总 tokens</th>
                    <th>费用</th>
                    <th>耗时</th>
                    <th>说明</th>
                </tr>
            </thead>
            <tbody>
                ${records.map((record) => `
                    <tr>
                        <td>${escapeHtml(formatDateTime(record.timestamp))}</td>
                        <td><span class="status ${record.status === 'success' ? 'success' : 'error'}">${record.status === 'success' ? '成功' : '失败'}</span></td>
                        <td>${formatNumber(record.promptTokens)}</td>
                        <td>${formatNumber(record.completionTokens)}</td>
                        <td>${formatNumber(record.totalTokens)}</td>
                        <td>${escapeHtml(formatCost(record.totalCost))}</td>
                        <td>${escapeHtml(formatLatency(record.latencyMs))}</td>
                        <td>${escapeHtml(record.error || (record.usageMissing ? '未返回 token usage' : '-'))}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function setLoading() {
    elements.dailyChart.className = 'chart loading';
    elements.dailyChart.textContent = '加载中...';
    elements.dailyTable.className = 'table-wrap loading';
    elements.dailyTable.textContent = '加载中...';
    elements.recentTable.className = 'table-wrap loading';
    elements.recentTable.textContent = '加载中...';
}

function setError(message) {
    elements.dailyChart.className = 'chart error';
    elements.dailyChart.textContent = message;
    elements.dailyTable.className = 'table-wrap error';
    elements.dailyTable.textContent = message;
    elements.recentTable.className = 'table-wrap error';
    elements.recentTable.textContent = message;
}

async function loadReport() {
    setLoading();

    try {
        const query = buildQuery();
        const [summary, dailyResponse, recentResponse] = await Promise.all([
            apiJson(`/api/ai-usage/summary${query}`),
            apiJson(`/api/ai-usage/daily${query}`),
            apiJson('/api/ai-usage/recent?limit=100')
        ]);

        state.daily = dailyResponse.daily || [];
        renderSummary(summary);
        renderDailyChart(state.daily);
        renderDailyTable(state.daily);
        renderRecentTable(recentResponse.records || []);
    } catch (error) {
        console.error('加载AI用量报表失败:', error);
        setError(error.message || '加载失败');
    }
}

elements.applyFilterButton.addEventListener('click', loadReport);
elements.last7Button.addEventListener('click', () => {
    setPreset(7);
    loadReport();
});
elements.last30Button.addEventListener('click', () => {
    setPreset(30);
    loadReport();
});
elements.logoutButton.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'admin-login.html';
});

setPreset(30);
loadReport();
