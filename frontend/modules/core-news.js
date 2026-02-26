// AI资讯网站主JavaScript文件

// ==================== 访问追踪功能 ====================

// 页面加载时自动上报访问信息
async function trackVisit() {
    try {
        const response = await fetch('/api/visit/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('访问追踪成功:', data.province);
        }
    } catch (error) {
        console.error('访问追踪失败:', error);
    }
}

// 全局变量
let currentFilter = 'all';
let currentCategory = 'all';
let currentTab = 'today';
let dailyHistoryOffset = 0;
let weeklyHistoryOffset = 0; // legacy variable kept for compatibility with old handlers
let aiKeywords = [];
let cachedTimelineDates = null;
let isTimelineLoading = false;
const NEWS_REQUEST_TIMEOUT_MS = 3000;
const TIMELINE_REQUEST_TIMEOUT_MS = 2500;

function withTimeout(promise, timeoutMs, errorMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        })
    ]);
}

function renderNewsSkeleton() {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div class="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                <div class="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div class="h-20 w-full bg-gray-100 rounded mb-3"></div>
                <div class="h-4 w-full bg-gray-100 rounded mb-2"></div>
                <div class="h-4 w-5/6 bg-gray-100 rounded"></div>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div class="h-4 w-20 bg-gray-200 rounded mb-4"></div>
                <div class="h-8 w-2/3 bg-gray-200 rounded mb-4"></div>
                <div class="h-16 w-full bg-gray-100 rounded mb-3"></div>
                <div class="h-4 w-full bg-gray-100 rounded mb-2"></div>
                <div class="h-4 w-4/5 bg-gray-100 rounded"></div>
            </div>
        </div>
    `;
}

// 导航相关函数
function setActiveNav(element) {
    // 移除所有活动状态
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    // 添加活动状态到当前元素
    element.classList.add('active');
}

function showFullNav() {
    document.getElementById('fullNav').classList.remove('hidden');
    document.getElementById('simplifiedNav').classList.add('hidden');
}

function switchTab(tab, event) {
    currentTab = 'today';
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    switchContentTab('today');
}

function switchContentTab(tab) {
    currentTab = 'today';
    const sectionTitle = document.getElementById('sectionTitle');
    const historyToggleText = document.getElementById('historyToggleText');
    const categoryFilters = document.getElementById('categoryFilters');
    if (sectionTitle) sectionTitle.textContent = '今日快讯';
    if (historyToggleText) historyToggleText.textContent = '每日回看';
    if (categoryFilters) categoryFilters.classList.add('hidden');
    currentCategory = 'all';
    loadNewsData();
    
    // 更新历史回看控制区域
    updateHistoryControls();
}

function filterArticles(filter) {
    currentFilter = filter;
    currentCategory = 'all'; // 重置分类筛选
    
    // 更新地区筛选按钮状态
    const regionFilters = document.querySelectorAll('#allFilter, #chinaFilter, #globalFilter');
    regionFilters.forEach(f => {
        f.className = 'px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-md transition-colors';
    });
    document.getElementById(filter + 'Filter').className = 'px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md transition-colors';
    
    // 重置分类筛选按钮状态
    const categoryButtons = document.querySelectorAll('#policyFilter, #techFilter, #businessFilter, #productFilter, #peopleFilter');
    categoryButtons.forEach(f => {
        f.className = 'px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-md transition-colors';
    });
    
    // 根据当前标签页加载对应的数据
    loadNewsData();
}

// 分类筛选函数
function filterByCategory(category) {
    currentCategory = category;
    
    // 更新分类筛选按钮状态
    const categoryFilters = document.querySelectorAll('#policyFilter, #techFilter, #businessFilter, #productFilter, #peopleFilter');
    categoryFilters.forEach(f => {
        f.className = 'px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-md transition-colors';
    });
    document.getElementById(category + 'Filter').className = 'px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md transition-colors';
    
    // 根据当前标签页加载对应的数据
    loadNewsData();
}

// 历史回看相关函数
function toggleHistoryView() {
    const dailyControls = document.getElementById('dailyHistoryControls');
    const historyToggleBtn = document.getElementById('historyToggleBtn');
    if (!dailyControls || !historyToggleBtn) {
        return;
    }

    if (dailyControls.classList.contains('hidden')) {
        dailyControls.classList.remove('hidden');
        historyToggleBtn.className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-green-200 text-green-800 hover:bg-green-300 border border-green-400';
        loadDailyHistoryData();
    } else {
        dailyControls.classList.add('hidden');
        historyToggleBtn.className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200 border border-green-300';
    }
}

function updateHistoryControls() {
    const dailyControls = document.getElementById('dailyHistoryControls');
    if (!dailyControls) {
        return;
    }
    dailyControls.classList.add('hidden');
}

// 历史回看导航函数
function navigateDailyHistory(offset) {
    const newOffset = dailyHistoryOffset + offset;
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + newOffset);
    
    if (targetDate > today) {
        return;
    }
    
    dailyHistoryOffset = newOffset;
    updateDailyDateLinks();
    loadDailyHistoryData();
}

function navigateWeeklyHistory(offset) {
    const newOffset = weeklyHistoryOffset + offset;
    const today = new Date();
    const targetWeekStart = getWeekStart(new Date(today.getTime() + newOffset * 7 * 24 * 60 * 60 * 1000));
    const currentWeekStart = getWeekStart(today);
    
    if (targetWeekStart > currentWeekStart) {
        return;
    }
    
    weeklyHistoryOffset = newOffset;
    updateWeeklyDateLinks();
    loadWeeklyHistoryData();
}

function updateDailyDateLinks() {
    const container = document.getElementById('dailyDateLinks');
    container.innerHTML = '';
    const today = new Date();
    
    for (let i = -2; i <= 2; i++) {
        const date = new Date();
        date.setDate(date.getDate() + dailyHistoryOffset + i);
        const dateStr = formatAbsoluteDate(date);
        const hasContent = hasContentForDate(date);
        const isFuture = date > today;
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = `date-link ${i === 0 ? 'active' : ''} ${!hasContent ? 'opacity-50' : ''} ${isFuture ? 'disabled' : ''}`;
        link.textContent = dateStr;
        link.onclick = (e) => {
            e.preventDefault();
            if (!isFuture) {
                selectDailyDate(date);
            }
        };
        
        container.appendChild(link);
    }
    
    updateDailyNavigationButtons();
}

function updateWeeklyDateLinks() {
    const container = document.getElementById('weeklyDateLinks');
    container.innerHTML = '';
    const today = new Date();
    
    for (let i = -2; i <= 2; i++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + (weeklyHistoryOffset + i) * 7);
        const weekStart = getWeekStart(targetDate);
        const weekStr = formatAbsoluteWeek(weekStart);
        const hasContent = hasContentForWeek(weekStart);
        const isFuture = weekStart > getWeekStart(today);
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = `date-link ${i === 0 ? 'active' : ''} ${!hasContent ? 'opacity-50' : ''} ${isFuture ? 'disabled' : ''}`;
        link.textContent = weekStr;
        link.onclick = (e) => {
            e.preventDefault();
            if (!isFuture) {
                selectWeeklyDate(weekStart);
            }
        };
        
        container.appendChild(link);
    }
    
    updateWeeklyNavigationButtons();
}

function selectDailyDate(date) {
    dailyHistoryOffset = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
    updateDailyDateLinks();
    loadDailyHistoryData();
}

function selectWeeklyDate(weekStart) {
    weeklyHistoryOffset = Math.floor((weekStart - new Date()) / (1000 * 60 * 60 * 24 * 7));
    updateWeeklyDateLinks();
    loadWeeklyHistoryData();
}

function formatAbsoluteDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

function formatAbsoluteWeek(weekStart) {
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

function getWeekStart(date) {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

function updateDailyNavigationButtons() {
    const today = new Date();
    const nextDay = new Date();
    nextDay.setDate(today.getDate() + dailyHistoryOffset + 1);
    const next5Days = new Date();
    next5Days.setDate(today.getDate() + dailyHistoryOffset + 5);
    
    const nextDayBtn = document.getElementById('nextDayBtn');
    const next5DaysBtn = document.getElementById('next5DaysBtn');
    
    if (nextDayBtn) {
        nextDayBtn.disabled = nextDay > today;
    }
    if (next5DaysBtn) {
        next5DaysBtn.disabled = next5Days > today;
    }
}

function updateWeeklyNavigationButtons() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + (weeklyHistoryOffset + 1) * 7);
    const next5Weeks = new Date();
    next5Weeks.setDate(today.getDate() + (weeklyHistoryOffset + 5) * 7);
    
    const nextWeekStart = getWeekStart(nextWeek);
    const next5WeeksStart = getWeekStart(next5Weeks);
    const currentWeekStart = getWeekStart(today);
    
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const next5WeeksBtn = document.getElementById('next5WeeksBtn');
    
    if (nextWeekBtn) {
        nextWeekBtn.disabled = nextWeekStart > currentWeekStart;
    }
    if (next5WeeksBtn) {
        next5WeeksBtn.disabled = next5WeeksStart > currentWeekStart;
    }
}

function hasContentForDate(date) {
    return true;
}

function hasContentForWeek(weekStart) {
    return true;
}

async function loadDailyHistoryData() {
    try {
        const dates = await window.apiService.getArchiveDates('daily');
        const dateLinksContainer = document.getElementById('dailyDateLinks');
        if (dateLinksContainer) {
            dateLinksContainer.innerHTML = '';
            
            if (dates && dates.length > 0) {
                dates.forEach(date => {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.className = 'px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors date-link';
                    link.textContent = date;
                    link.onclick = (e) => {
                        e.preventDefault();
                        viewDailyArchive(date);
                    };
                    
                    const linkDate = new Date(date);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    
                    if (linkDate > today) {
                        link.classList.add('disabled');
                        link.style.opacity = '0.5';
                        link.style.cursor = 'not-allowed';
                        link.onclick = (e) => e.preventDefault();
                    }
                    
                    dateLinksContainer.appendChild(link);
                });
            } else {
                dateLinksContainer.innerHTML = '<p class="text-gray-500 text-center">暂无历史数据</p>';
            }
        }
    } catch (error) {
        console.error('加载每日历史数据失败:', error);
    }
}

async function loadWeeklyHistoryData() {
    try {
        const weeks = await window.apiService.getArchiveDates('weekly');
        const weekLinksContainer = document.getElementById('weeklyDateLinks');
        if (weekLinksContainer) {
            weekLinksContainer.innerHTML = '';
            
            if (weeks && weeks.length > 0) {
                weeks.forEach(week => {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.className = 'px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors date-link';
                    link.textContent = week;
                    link.onclick = (e) => {
                        e.preventDefault();
                        viewWeeklyArchive(week);
                    };
                    
                    const linkDate = new Date(week);
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    
                    if (linkDate > today) {
                        link.classList.add('disabled');
                        link.style.opacity = '0.5';
                        link.style.cursor = 'not-allowed';
                        link.onclick = (e) => e.preventDefault();
                    }
                    
                    weekLinksContainer.appendChild(link);
                });
            } else {
                weekLinksContainer.innerHTML = '<p class="text-gray-500 text-center">暂无历史数据</p>';
            }
        }
    } catch (error) {
        console.error('加载每周历史数据失败:', error);
    }
}

async function viewDailyArchive(date) {
    try {
        const articles = await window.apiService.getArchiveNews(date, 'daily');
        renderNewsArticles(articles);
    } catch (error) {
        console.error('加载每日归档数据失败:', error);
    }
}

async function viewWeeklyArchive(week) {
    try {
        const articles = await window.apiService.getArchiveNews(week, 'weekly');
        renderWeeklyArticles(articles);
    } catch (error) {
        console.error('加载每周归档数据失败:', error);
    }
}

async function loadWeeklyNewsData() {
    // 每周资讯功能已禁用
    console.warn('每周资讯功能已禁用');
    return;

    try {
        const params = {};
        if (currentFilter !== 'all') {
            params.country = currentFilter;
        }
        if (currentCategory !== 'all') {
            params.category = currentCategory;
        }
        
        const articles = await window.loadWeeklyNewsFromAPI(params);
        renderWeeklyArticles(articles);
    } catch (error) {
        console.error('加载每周资讯数据失败:', error);
        renderWeeklyArticles([]);
    }
}

function renderWeeklyArticles(articles) {
    const container = document.getElementById('articlesGrid');
    
    if (!container) {
        console.error('找不到articlesGrid容器元素！');
        return;
    }
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center py-12">
                <div class="text-gray-500">
                    <i class="fas fa-calendar-week text-4xl mb-4"></i>
                    <p class="text-lg">暂无每周资讯</p>
                    <p class="text-sm mt-2">请先在管理后台导入每周资讯数据</p>
                </div>
            </div>
        `;
        return;
    }
    
    window.newsData = articles;
    
    container.innerHTML = '';
    articles.forEach((article, index) => {
        const articleElement = createWeeklyArticleElement(article);
        container.appendChild(articleElement);
    });
    
    generateStructuredData();
}

function createWeeklyArticleElement(article) {
    const articleDiv = document.createElement('article');
    articleDiv.className = 'bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden card-hover';
    articleDiv.setAttribute('data-country', article.country);
    articleDiv.setAttribute('data-weekly-category', article.weekly_category);

    articleDiv.setAttribute('itemscope', '');
    articleDiv.setAttribute('itemtype', 'https://schema.org/NewsArticle');

    const categoryIcon = getCategoryIcon(article.category);
    const categoryColor = getCategoryColor(article.category);
    const keyInfo = article.key_point || '暂无关键信息';
    const publishedDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
    const articleUrl = article.source_url || '#';
    const weeklyCategoryText = getWeeklyCategoryText(article.weekly_category);
    const isFeatured = article.is_weekly_featured ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">精选</span>' : '';

    articleDiv.innerHTML = `
        <div class="p-6">
            <!-- 顶部：图标 + 分类标签 -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                        <i class="${categoryIcon}"></i>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="${categoryColor} text-xs font-semibold px-2.5 py-1 rounded-full">${article.category || '其他'}</span>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${weeklyCategoryText}
                        </span>
                        ${isFeatured}
                    </div>
                </div>
                <span class="text-xs text-gray-400">${article.sub_category || '未分类'}</span>
            </div>

            <!-- 标题 -->
            <h3 class="text-lg font-bold text-gray-900 mb-3 leading-snug line-clamp-2" itemprop="headline">
                <a href="${articleUrl}" target="_blank" class="hover:text-blue-600 transition-colors" itemprop="url">${article.title}</a>
            </h3>

            <!-- 关键信息（高亮显示） -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
                <p class="text-sm font-medium text-gray-700" itemprop="description">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>${keyInfo}
                </p>
            </div>

            <!-- 摘要 -->
            <p class="text-sm text-gray-600 mb-4 leading-relaxed" itemprop="description">
                ${article.summary ? article.summary.substring(0, 150) + (article.summary.length > 150 ? '...' : '') : '暂无摘要'}
            </p>

            <!-- 底部元信息 -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <!-- 隐藏发布时间和重要性分数，但保留在数据中用于排序 -->
                    <!-- <span itemprop="datePublished" content="${publishedDate}">
                        <i class="far fa-clock mr-1"></i>${article.published_at ? formatDate(article.published_at) : '刚刚'}
                    </span>
                    <span>
                        <i class="fas fa-star text-yellow-400 mr-1"></i>${article.importance_score || 5}
                    </span> -->
                </div>
                <a href="${articleUrl}" target="_blank" class="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    阅读原文 <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>

            <!-- 结构化数据 -->
            <div class="hidden" itemprop="author" itemscope itemtype="https://schema.org/Organization">
                <span itemprop="name">${article.source_name || '其他'}</span>
            </div>
            <div class="hidden" itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
                <span itemprop="name">AIcoming</span>
                <div itemprop="logo" itemscope itemtype="https://schema.org/ImageObject">
                    <span itemprop="url">https://aicoming.com/pic/AIcoming_logo.png</span>
                </div>
            </div>
        </div>
    `;

    return articleDiv;
}

function getWeeklyCategoryText(weeklyCategory) {
    const categoryMap = {
        'policy': '政策',
        'tech': '技术', 
        'business': '商业',
        'product': '产品',
        'people': '人物',
        'health': '医疗',
        'finance': '金融',
        'industry': '产业',
        'auto': '汽车',
        'cloud': '云计算',
        'hardware': '硬件',
        'security': '安全',
        'education': '教育',
        'research': '研究',
        'tools': '工具',
        'international': '国际',
        'culture': '文化'
    };
    return categoryMap[weeklyCategory] || weeklyCategory;
}

// 关键词相关函数
async function initKeywords() {
    try {
        console.log('开始加载关键词数据...');
        aiKeywords = await window.loadKeywordsFromAPI();
        console.log('API返回的关键词数量:', aiKeywords.length);
        console.log('API返回的前3个关键词:', aiKeywords.slice(0, 3));
        
        if (!aiKeywords || aiKeywords.length === 0) {
            console.log('API返回空数据，使用默认关键词');
            aiKeywords = getHotKeywords();
        }
    } catch (error) {
        console.error('初始化关键词失败:', error);
        console.log('使用默认关键词');
        aiKeywords = getHotKeywords();
    }
    
    console.log('最终关键词数量:', aiKeywords.length);
}

function getHotKeywords() {
    try {
        if (typeof window.getCurrentKeywords === 'function') {
            return window.getCurrentKeywords();
        } else if (typeof getCurrentKeywords === 'function') {
            return getCurrentKeywords();
        } else {
            const keywords = [
                'SaaS末日', '代理人经济', 'OpenClaw', 'Claude 4.6', 'Moltbook',
                'DeepSeek V4', 'Seedance', 'GPT-5.3', 'AI春晚', 'RynnBrain',
                'Engram架构', 'Kimi K2.5', '氛围编程', '死互联网', '结构性失业',
                '数字隔离', '具身智能', '18%关税梗', '来华过年', '怀旧2016',
                'HBM4量产', 'Siri接入Gemini', '万亿参数', 'Genie 3', 'NVIDIA Rubin',
                'OCR-2', 'M100芯片', 'Qwen3.5', '主权AI', '声音克隆平民化'
            ];
            return keywords.map((text, index) => ({
                text: text,
                size: index < 5 ? 'large' : index < 15 ? 'large' : index < 25 ? 'medium' : 'small',
                weight: index < 5 ? 10 - index : index < 15 ? 8 - Math.floor((index - 5) / 2) : index < 25 ? 5 - Math.floor((index - 15) / 3) : 2 - Math.floor((index - 25) / 2)
            }));
        }
    } catch (error) {
        console.error('获取关键词失败:', error);
        return ['AI技术', '机器学习', '深度学习', '人工智能', '大模型'];
    }
}

function getBaseFontSize(size) {
    const sizeMap = {
        'large': 26,
        'medium': 22,
        'small': 18,
        'tiny': 14
    };
    return sizeMap[size] || 18;
}

// 词云生成函数
function generateWordCloud() {
    const container = document.getElementById('keywordWall');
    
    if (!container) {
        console.error('词云容器未找到！');
        return;
    }
    
    console.log('开始生成词云，关键词数量:', aiKeywords.length);
    console.log('关键词数据:', aiKeywords.slice(0, 3));
    
    container.innerHTML = '';
    
    const hotTitle = document.createElement('div');
    hotTitle.className = 'hot-title';
    hotTitle.textContent = '近期热点';
    container.appendChild(hotTitle);
    
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    const placedElements = [];

    const titleHeight = 30;
    const titleWidth = 100;
    const titleLeft = 20;
    const titleTop = 35;
    
    placedElements.push({
        left: titleLeft,
        top: titleTop,
        right: titleLeft + titleWidth,
        bottom: titleTop + titleHeight
    });
    
    function checkOverlap(newElement, newLeft, newTop) {
        const newRect = {
            left: newLeft,
            top: newTop,
            right: newLeft + newElement.offsetWidth,
            bottom: newTop + newElement.offsetHeight
        };
        
        for (let placed of placedElements) {
            const placedRect = {
                left: placed.left,
                top: placed.top,
                right: placed.right,
                bottom: placed.bottom
            };
            
            if (!(newRect.right + 10 < placedRect.left || 
                  newRect.left - 10 > placedRect.right || 
                  newRect.bottom + 10 < placedRect.top || 
                  newRect.top - 10 > placedRect.bottom)) {
                return true;
            }
        }
        return false;
    }
    
    function tryPlaceElement(keyword, index) {
        const element = document.createElement('div');
        element.className = `keyword-tag ${keyword.size}`;
        element.textContent = keyword.text;
        element.style.position = 'absolute';
        element.style.animationDelay = `${index * 0.1}s`;
        element.style.zIndex = '10';
        
        element.setAttribute('itemscope', '');
        element.setAttribute('itemtype', 'https://schema.org/ListItem');
        element.setAttribute('itemprop', 'item');
        element.setAttribute('data-position', index + 1);
        
        const currentWeight = keyword.weight || 1;
        let fontSize;
        
        // 优先使用数据库中保存的fontSize，如果没有则根据权重计算
        if (keyword.fontSize && keyword.fontSize > 0) {
            fontSize = keyword.fontSize;
        } else {
            // 使用精确的px值，基于权重计算
            if (currentWeight === 10) {
                fontSize = 32;
            } else if (currentWeight >= 8) {
                fontSize = 28;
            } else if (currentWeight >= 6) {
                fontSize = 24;
            } else if (currentWeight >= 4) {
                fontSize = 20;
            } else if (currentWeight >= 2) {
                fontSize = 18;
            } else {
                fontSize = 16;
            }
            // 保存计算出的字体大小到关键词数据中
            keyword.fontSize = fontSize;
        }
        
        element.style.fontSize = `${fontSize}px`;
        
        
        if (currentWeight === 10) {
            element.style.color = '#FF4757';
        } else {
            const randomColors = [
                '#FFD93D',
                '#FF6B9D',
                '#4ECDC4',
                '#A8E6CF',
                '#B39DDB'
            ];
            const randomColorIndex = Math.floor(Math.random() * randomColors.length);
            element.style.color = randomColors[randomColorIndex];
        }
        
        container.appendChild(element);
        
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;
        
        let left, top;
        let attempts = 0;
        let placed = false;
        
        if (currentWeight === 10) {
            const centerLeft = (width - elementWidth) / 2;
            const centerTop = (height - elementHeight) / 2;
            
            if (!checkOverlap(element, centerLeft, centerTop)) {
                left = centerLeft;
                top = centerTop;
                placed = true;
            } else {
                const offsets = [
                    {x: 0, y: 0}, {x: -50, y: -30}, {x: 50, y: -30}, 
                    {x: -50, y: 30}, {x: 50, y: 30}, {x: 0, y: -60}, 
                    {x: 0, y: 60}, {x: -100, y: 0}, {x: 100, y: 0}
                ];
                
                for (let offset of offsets) {
                    const testLeft = centerLeft + offset.x;
                    const testTop = centerTop + offset.y;
                    
                    if (testLeft >= 10 && testLeft <= width - elementWidth - 10 &&
                        testTop >= 10 && testTop <= height - elementHeight - 10 &&
                        !checkOverlap(element, testLeft, testTop)) {
                        left = testLeft;
                        top = testTop;
                        placed = true;
                        break;
                    }
                }
            }
        } else if (currentWeight >= 8) {
            const centerLeft = (width - elementWidth) / 2;
            const centerTop = (height - elementHeight) / 2;
            const centerOffsets = [
                {x: -30, y: -20}, {x: 30, y: -20}, {x: -30, y: 20}, 
                {x: 30, y: 20}, {x: 0, y: -40}, {x: 0, y: 40}
            ];
            
            for (let offset of centerOffsets) {
                const testLeft = centerLeft + offset.x;
                const testTop = centerTop + offset.y;
                
                if (testLeft >= 10 && testLeft <= width - elementWidth - 10 &&
                    testTop >= 10 && testTop <= height - elementHeight - 10 &&
                    !checkOverlap(element, testLeft, testTop)) {
                    left = testLeft;
                    top = testTop;
                    placed = true;
                    break;
                }
            }
        }
        
        if (!placed) {
            while (attempts < 50 && !placed) {
                const maxLeft = Math.max(0, width - elementWidth - 20);
                const maxTop = Math.max(0, height - elementHeight - 70); // 底部保持70px空间

                left = Math.random() * maxLeft + 10;
                top = Math.random() * maxTop + 70; // 顶部保持70px空间
                
                if (!checkOverlap(element, left, top)) {
                    placed = true;
                }
                attempts++;
            }
            
            if (!placed) {
                left = Math.random() * (width - elementWidth - 20) + 10;
                top = Math.random() * (height - elementHeight - 70) + 70;
            }
        }
        
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        
        placedElements.push({
            left: left,
            top: top,
            right: left + elementWidth,
            bottom: top + elementHeight
        });
        
        const originalColor = element.style.color;
        element.addEventListener('mouseenter', function() {
            this.style.color = '#fbbf24';
            this.style.transform = 'scale(1.1)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.color = originalColor;
            this.style.transform = 'scale(1)';
        });
    }
    
    const sortedKeywords = [...aiKeywords].sort((a, b) => (b.weight || 0) - (a.weight || 0));
    
    sortedKeywords.forEach((keyword, index) => {
        tryPlaceElement(keyword, index);
    });
}

function createKeywordElement(keyword) {
    const element = document.createElement('div');
    element.className = `keyword-tag ${keyword.size}`;
    element.textContent = keyword.text;
    element.style.position = 'absolute';
    element.style.cursor = 'pointer';
    element.style.userSelect = 'none';
    element.style.whiteSpace = 'nowrap';
    
    const rotation = (Math.random() - 0.5) * 30;
    element.style.transform = `rotate(${rotation}deg) scale(0.8)`;
    
    element.addEventListener('click', () => {
        // 可以在这里添加搜索功能
    });
    
    return element;
}

function getKeywordSize(weight) {
    if (weight >= 25) return 'large';
    if (weight >= 15) return 'medium';
    if (weight >= 5) return 'small';
    return 'tiny';
}

function findBestPosition(element, placedElements, containerWidth, containerHeight) {
    const maxAttempts = 50;
    const padding = 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = Math.random() * (containerWidth - 100);
        const y = Math.random() * (containerHeight - 50);
        
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        element.style.visibility = 'hidden';
        document.body.appendChild(element);
        
        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        document.body.removeChild(element);
        
        let hasOverlap = false;
        for (const placed of placedElements) {
            if (x < placed.x + placed.width + padding &&
                x + width + padding > placed.x &&
                y < placed.y + placed.height + padding &&
                y + height + padding > placed.y) {
                hasOverlap = true;
                break;
            }
        }
        
        if (!hasOverlap && x + width <= containerWidth && y + height <= containerHeight) {
            return { x, y, width, height };
        }
    }
    
    return null;
}

async function loadNewsData() {
    try {
        const params = {};
        if (currentFilter !== 'all') {
            params.country = currentFilter;
        }
        if (currentCategory !== 'all') {
            params.category = currentCategory;
        }

        renderNewsSkeleton();
        const articles = await withTimeout(
            window.loadNewsFromAPI(params),
            NEWS_REQUEST_TIMEOUT_MS,
            '加载今日快讯超时，请稍后重试'
        );
        renderNewsArticles(articles);
    } catch (error) {
        console.error('加载新闻数据失败:', error);
        renderNewsArticles([]);
    }
}

function renderNewsArticles(articles) {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-gray-500">
                    <i class="fas fa-newspaper text-4xl mb-4"></i>
                    <p class="text-lg">暂无今日快讯</p>
                    <p class="text-sm mt-2">请先通过API导入新闻数据</p>
                </div>
            </div>
        `;
        return;
    }

    window.newsData = articles;

    // 首屏先渲染“最新一天”信息，历史时间轴后加载，避免阻塞感知速度
    renderQuickTodayTimeline(articles);
    scheduleDeferredTimelineLoad(articles);

    // 渲染三段式布局（主内容优先）
    renderArticlesList(articles);
    // 右侧内容延后异步，避免影响首屏可见内容
    setTimeout(() => {
        renderOutline(articles);
        renderStats(articles);
    }, 0);

    // 回到顶部按钮
    initBackToTop();

    generateStructuredData();
}

function renderQuickTodayTimeline(articles) {
    const timelineContainer = document.getElementById('timelineContainer');
    if (!timelineContainer) return;

    const today = new Date().toISOString().split('T')[0];
    const date = new Date(today);
    const displayDate = `${date.getMonth() + 1}月${date.getDate()}日`;
    const count = Array.isArray(articles) ? articles.length : 0;

    timelineContainer.innerHTML = `
        <div class="timeline-item active" data-date="${today}">
            <div class="timeline-date">${displayDate} <span class="text-xs text-blue-600">(今天)</span></div>
            <div class="timeline-count">${count} 篇文章</div>
        </div>
        <div class="text-xs text-gray-400 mt-3 px-2">历史日期加载中...</div>
    `;
}

function scheduleDeferredTimelineLoad(articles) {
    if (cachedTimelineDates || isTimelineLoading) {
        return;
    }
    isTimelineLoading = true;

    const task = () => {
        renderTimeline(articles).finally(() => {
            isTimelineLoading = false;
        });
    };

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(task, { timeout: 1200 });
    } else {
        setTimeout(task, 400);
    }
}

// 渲染左侧历史时间轴
async function renderTimeline(articles) {
    const timelineContainer = document.getElementById('timelineContainer');
    if (!timelineContainer) return;

    try {
        let datesData = cachedTimelineDates;
        if (!datesData) {
            // 首次加载历史日期，后续筛选/切换复用缓存，减少重复请求
            const response = await withTimeout(
                fetch('/api/news/dates'),
                TIMELINE_REQUEST_TIMEOUT_MS,
                '历史日期加载超时'
            );
            if (!response.ok) {
                throw new Error('获取历史日期失败');
            }
            datesData = await response.json();
            cachedTimelineDates = datesData;
        }

        // 填充月份选择器
        populateMonthSelector(datesData);

        // 渲染时间轴
        renderTimelineItems(datesData);
    } catch (error) {
        console.error('加载历史日期失败:', error);
        timelineContainer.innerHTML = `
            <div class="text-center py-8 text-red-500 text-sm">
                <i class="fas fa-exclamation-circle mb-2"></i>
                <p>加载失败</p>
            </div>
        `;
    }
}

// 填充月份选择器
function populateMonthSelector(datesData) {
    const monthSelector = document.getElementById('monthSelector');
    if (!monthSelector) return;

    // 清空现有选项（除了第一个"全部月份"）
    while (monthSelector.options.length > 1) {
        monthSelector.remove(1);
    }

    // 找到最早的数据日期
    if (datesData.length === 0) return;

    const earliestDate = new Date(datesData[datesData.length - 1].date);
    const currentDate = new Date();

    // 生成从最早日期到当前日期的所有月份
    const months = [];
    let current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const earliest = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

    while (current >= earliest) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        months.push(monthKey);

        // 移动到上个月
        current.setMonth(current.getMonth() - 1);
    }

    // 生成选项（已经是从新到旧的顺序）
    months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${year}年${monthNum}月`;
        monthSelector.appendChild(option);
    });

    // 避免重复绑定事件导致重复渲染
    monthSelector.onchange = (e) => {
        const selectedMonth = e.target.value;
        const filteredDates = selectedMonth === 'all'
            ? datesData
            : datesData.filter(item => item.date.startsWith(selectedMonth));
        renderTimelineItems(filteredDates);
    };
}

// 渲染时间轴项目
function renderTimelineItems(datesData) {
    const timelineContainer = document.getElementById('timelineContainer');
    if (!timelineContainer) return;

    if (!datesData || datesData.length === 0) {
        timelineContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500 text-sm">
                <p>暂无历史文章</p>
            </div>
        `;
        return;
    }

    let html = '';
    datesData.forEach(item => {
        const date = new Date(item.date);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        const displayDate = `${month}月${day}日`;
        const isToday = isDateToday(item.date);

        html += `
            <div class="timeline-item ${isToday ? 'active' : ''}" data-date="${item.date}">
                <div class="timeline-date">${displayDate}${isToday ? ' <span class="text-xs text-blue-600">(今天)</span>' : ''}</div>
                <div class="timeline-count">${item.count} 篇文章</div>
            </div>
        `;
    });

    timelineContainer.innerHTML = html;

    // 添加点击事件
    timelineContainer.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', () => {
            const date = item.getAttribute('data-date');
            loadNewsByDate(date);

            // 更新激活状态
            timelineContainer.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// 检查是否是今天
function isDateToday(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
}

// 根据日期加载新闻
async function loadNewsByDate(date) {
    try {
        const params = new URLSearchParams();
        if (currentFilter !== 'all') {
            params.append('country', currentFilter);
        }
        if (currentCategory !== 'all') {
            params.append('category', currentCategory);
        }

        const response = await withTimeout(
            fetch(`/api/news/date/${date}?${params}`),
            NEWS_REQUEST_TIMEOUT_MS,
            '加载该日期新闻超时'
        );
        if (!response.ok) {
            throw new Error('加载新闻失败');
        }

        const articles = await response.json();

        // 更新页面标题
        const dateObj = new Date(date);
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();
        const title = isDateToday(date) ? '今日快讯' : `${month}月${day}日快讯`;
        document.getElementById('sectionTitle').textContent = title;

        // 渲染文章列表
        renderArticlesList(articles);
        renderOutline(articles);

        // 更新统计信息
        renderStats(articles);
    } catch (error) {
        console.error('加载历史新闻失败:', error);
        const container = document.getElementById('articlesContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-red-500">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <p class="text-lg">加载失败</p>
                        <p class="text-sm mt-2">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }
}

// 解析日期字符串键
function parseDateKey(dateStr) {
    // 解析 "1月16日" 格式
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (match) {
        const month = parseInt(match[1]);
        const day = parseInt(match[2]);
        // 使用当前年份
        const year = new Date().getFullYear();
        return new Date(year, month - 1, day);
    }
    return new Date();
}

// 渲染中间文章列表
function renderArticlesList(articles) {
    const container = document.getElementById('articlesContainer');
    if (!container) return;

    // 按重要性评分排序（高分在前）
    const sortedArticles = [...articles].sort((a, b) => {
        return (b.importance_score || 0) - (a.importance_score || 0);
    });

    let html = '';
    sortedArticles.forEach((article, index) => {
        const categoryClass = article.category === '技术' ? 'tech' :
                              article.category === '政策' ? 'policy' :
                              article.category === '商业' ? 'business' : 'product';

        const timeIcon = getTimeIcon(article.published_at);
        const publishedDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
        const articleUrl = article.source_url || '#';

        html += `
            <article class="article-item ${categoryClass}" id="article-${index}" data-date="${getDateKey(article.published_at)}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                            <i class="${getCategoryIcon(article.category)}"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${getCategoryColor(article.category).replace('text-', 'bg-').replace('-700', '-100').replace('-600', '-100')}">${article.category || '其他'}</span>
                                <span class="text-xs text-gray-400">${article.sub_category || '未分类'}</span>
                            </div>
                            <!-- 隐藏时间显示（AI生成的时间不准确） -->
                            <!-- <div class="flex items-center space-x-2 text-xs text-gray-500">
                                <i class="far fa-clock"></i>
                                <span>${formatDate(article.published_at)}</span>
                            </div> -->
                        </div>
                    </div>
                    <div class="text-right"></div>
                </div>

                <h3 class="text-xl font-bold text-gray-900 mb-3 leading-snug" itemprop="headline">
                    <a href="${articleUrl}" target="_blank" class="hover:text-blue-600 transition-colors" itemprop="url">${article.title}</a>
                </h3>

                <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-3">
                    <p class="text-sm font-medium text-gray-700 flex items-start" itemprop="description">
                        <i class="fas fa-lightbulb text-yellow-500 mr-2 mt-0.5 flex-shrink-0"></i>
                        <span>${article.key_point || '暂无关键信息'}</span>
                    </p>
                </div>

                <p class="text-gray-600 mb-4 leading-relaxed" itemprop="description">
                    ${article.summary || '暂无摘要'}
                </p>

                <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                    <!-- 隐藏时间显示（AI生成的时间不准确） -->
                    <!-- <div class="text-xs text-gray-500" itemprop="datePublished" content="${publishedDate}">
                        <i class="far fa-calendar mr-1"></i>
                        ${article.published_at ? new Date(article.published_at).toLocaleDateString('zh-CN') : '刚刚'}
                    </div> -->
                    <a href="${articleUrl}" target="_blank" class="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                        阅读原文 <i class="fas fa-external-link-alt ml-1"></i>
                    </a>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

// 渲染右侧大纲
function renderOutline(articles) {
    const outlineContainer = document.getElementById('outlineContainer');
    if (!outlineContainer) return;

    let html = '<div class="space-y-1">';

    articles.forEach((article, index) => {
        html += `
            <a href="#article-${index}" class="outline-link" onclick="scrollToArticleByIndex(${index}); return false;">
                <div class="truncate">${article.title}</div>
            </a>
        `;
    });

    html += '</div>';
    outlineContainer.innerHTML = html;
}

// 渲染统计信息
function renderStats(articles) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    // 统计各分类数量
    const categoryCount = {};
    articles.forEach(article => {
        const category = article.category || '其他';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    let html = '';
    Object.keys(categoryCount).forEach(category => {
        const icon = getCategoryIcon(category);
        html += `
            <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div class="flex items-center">
                    <i class="${icon} text-blue-600 mr-2"></i>
                    <span>${category}</span>
                </div>
                <span class="font-semibold text-gray-900">${categoryCount[category]}</span>
            </div>
        `;
    });

    statsContainer.innerHTML = html;
}

// 辅助函数：获取时间段
function getTimeKey(dateString) {
    const date = new Date(dateString);
    const hour = date.getHours();
    return hour < 12 ? '上午' : '下午';
}

// 辅助函数：获取日期键
function getDateKey(dateString) {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 月份从0开始，需要+1
    const day = date.getDate();
    return `${month}月${day}日`;
}

// 辅助函数：获取时间图标
function getTimeIcon(dateString) {
    const hour = new Date(dateString).getHours();
    if (hour < 6) return 'fas fa-moon';
    if (hour < 12) return 'fas fa-sun';
    if (hour < 18) return 'fas fa-cloud-sun';
    return 'fas fa-moon';
}

// 滚动到指定时间段的文章
function scrollToArticleByDate(dateKey) {
    const firstArticle = document.querySelector(`[data-date="${dateKey}"]`);
    if (firstArticle) {
        firstArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        highlightArticle(firstArticle.id.split('-')[1]);
    }
}

function scrollToArticleByTime(timeKey) {
    // 保留旧函数以兼容性
    scrollToArticleByDate(timeKey);
}

function scrollToArticleByIndex(index) {
    const article = document.getElementById(`article-${index}`);
    if (!article) return;

    article.scrollIntoView({ behavior: 'smooth', block: 'start' });
    highlightArticle(index);
}

// 高亮文章
function highlightArticle(index) {
    // 移除所有高亮
    document.querySelectorAll('.article-item').forEach(item => {
        item.style.background = 'white';
    });

    // 添加高亮
    const article = document.getElementById(`article-${index}`);
    if (article) {
        article.style.background = '#eff6ff';
        setTimeout(() => {
            article.style.background = 'white';
        }, 2000);
    }
}

// 回到顶部按钮
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createArticleElement(article) {
    const articleDiv = document.createElement('article');
    articleDiv.className = 'bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden card-hover';
    articleDiv.setAttribute('data-country', article.country);

    articleDiv.setAttribute('itemscope', '');
    articleDiv.setAttribute('itemtype', 'https://schema.org/NewsArticle');

    const categoryIcon = getCategoryIcon(article.category);
    const categoryColor = getCategoryColor(article.category);
    const keyInfo = article.key_point || '暂无关键信息';
    const publishedDate = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
    const articleUrl = article.source_url || '#';

    articleDiv.innerHTML = `
        <div class="p-6">
            <!-- 顶部：图标 + 分类标签 -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                        <i class="${categoryIcon}"></i>
                    </div>
                    <div>
                        <span class="${categoryColor} text-xs font-semibold px-2.5 py-1 rounded-full">${article.category || '其他'}</span>
                    </div>
                </div>
                <span class="text-xs text-gray-400">${article.sub_category || '未分类'}</span>
            </div>

            <!-- 标题 -->
            <h3 class="text-lg font-bold text-gray-900 mb-3 leading-snug line-clamp-2" itemprop="headline">
                <a href="${articleUrl}" target="_blank" class="hover:text-blue-600 transition-colors" itemprop="url">${article.title}</a>
            </h3>

            <!-- 关键信息（高亮显示） -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
                <p class="text-sm font-medium text-gray-700" itemprop="description">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>${keyInfo}
                </p>
            </div>

            <!-- 摘要 -->
            <p class="text-sm text-gray-600 mb-4 leading-relaxed" itemprop="description">
                ${article.summary ? article.summary.substring(0, 150) + (article.summary.length > 150 ? '...' : '') : '暂无摘要'}
            </p>

            <!-- 底部元信息 -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <!-- 隐藏发布时间和重要性分数，但保留在数据中用于排序 -->
                    <!-- <span itemprop="datePublished" content="${publishedDate}">
                        <i class="far fa-clock mr-1"></i>${article.published_at ? formatDate(article.published_at) : '刚刚'}
                    </span>
                    <span>
                        <i class="far fa-eye mr-1"></i>${article.importance_score || 5}
                    </span> -->
                </div>
                <a href="${articleUrl}" target="_blank" class="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    阅读原文 <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>

            <!-- 结构化数据 -->
            <div class="hidden" itemprop="author" itemscope itemtype="https://schema.org/Organization">
                <span itemprop="name">${article.source_name || '其他'}</span>
            </div>
            <div class="hidden" itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
                <span itemprop="name">AIcoming</span>
                <div itemprop="logo" itemscope itemtype="https://schema.org/ImageObject">
                    <span itemprop="url">https://aicoming.com/pic/AIcoming_logo.png</span>
                </div>
            </div>
        </div>
    `;

    return articleDiv;
}

// 新增：根据分类返回图标
function getCategoryIcon(category) {
    const icons = {
        '技术': 'fas fa-microchip',
        '产品': 'fas fa-box',
        '政策': 'fas fa-gavel',
        '商业': 'fas fa-chart-line',
        '应用': 'fas fa-robot',
        '其他': 'fas fa-newspaper'
    };
    return icons[category] || 'fas fa-newspaper';
}

// 新增：格式化日期（保留旧实现以兼容历史逻辑）
function formatRelativeDateLegacy(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
        return '刚刚';
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else {
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
}

function getCategoryColor(category) {
    const colors = {
        '技术': 'category-tech',
        '商业': 'category-business',
        '研究': 'category-research',
        'AI': 'category-ai',
        '其他': 'category-other'
    };
    return colors[category] || 'category-other';
}

function formatDate(dateString) {
    if (!dateString) return '未知时间';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('日期格式化错误:', error);
        return '未知时间';
    }
}

function getSubCategory(category) {
    const subCategories = {
        '技术': '技术动态',
        '商业': '商业资讯',
        '研究': '学术研究',
        'AI': 'AI前沿',
        '其他': '综合资讯'
    };
    return subCategories[category] || '综合资讯';
}

function generateStructuredData() {
    if (window.newsData && window.newsData.length > 0) {
        const articlesSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "AI资讯文章列表",
            "description": "最新的AI技术资讯和行业动态",
            "itemListElement": window.newsData.slice(0, 10).map((article, index) => ({
                "@type": "NewsArticle",
                "position": index + 1,
                "headline": article.title,
                "description": article.summary ? article.summary.substring(0, 200) : '暂无摘要',
                "url": article.source_url || '#',
                "datePublished": article.published_at || new Date().toISOString(),
                "author": {
                    "@type": "Organization",
                    "name": article.source_name || 'AI资讯中心'
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "AIcoming",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://aicoming.com/pic/AIcoming_logo.png"
                    }
                },
                "articleSection": article.category || '其他',
                "keywords": article.category
            }))
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(articlesSchema);
        document.head.appendChild(script);
    }

    if (window.aiKeywords && window.aiKeywords.length > 0) {
        const keywordsSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "AI热点关键词",
            "description": "当前AI领域的热点关键词和趋势",
            "itemListElement": window.aiKeywords.slice(0, 20).map((keyword, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": keyword.text,
                "description": `AI领域热点关键词，权重: ${keyword.weight}`
            }))
        };

        const script2 = document.createElement('script');
        script2.type = 'application/ld+json';
        script2.textContent = JSON.stringify(keywordsSchema);
        document.head.appendChild(script2);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedGenerateWordCloud = debounce(generateWordCloud, 300);

window.addEventListener('resize', debouncedGenerateWordCloud);

export {
    trackVisit,
    setActiveNav,
    showFullNav,
    switchTab,
    switchContentTab,
    filterArticles,
    filterByCategory,
    toggleHistoryView,
    updateHistoryControls,
    navigateDailyHistory,
    navigateWeeklyHistory,
    updateDailyDateLinks,
    updateWeeklyDateLinks,
    selectDailyDate,
    selectWeeklyDate,
    formatAbsoluteDate,
    formatAbsoluteWeek,
    getWeekStart,
    loadDailyHistoryData,
    loadWeeklyHistoryData,
    viewDailyArchive,
    viewWeeklyArchive,
    loadWeeklyNewsData,
    renderWeeklyArticles,
    createWeeklyArticleElement,
    getWeeklyCategoryText,
    initKeywords,
    getHotKeywords,
    generateWordCloud,
    loadNewsData,
    renderNewsArticles,
    renderTimeline,
    populateMonthSelector,
    renderTimelineItems,
    isDateToday,
    loadNewsByDate,
    parseDateKey,
    renderArticlesList,
    renderOutline,
    renderStats,
    scrollToArticleByDate,
    scrollToArticleByTime,
    scrollToArticleByIndex,
    highlightArticle,
    initBackToTop,
    scrollToTop,
    createArticleElement,
    getCategoryIcon,
    getCategoryColor,
    formatDate,
    getSubCategory
};
