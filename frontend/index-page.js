        // 配置 - 使用本地API代理
        const CONFIG = {
            API_PROXY_URL: '/api/ai/chat', // 本地API代理地址
        };

        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const resultsContainer = document.getElementById('resultsContainer');

        // 自动调整textarea高度
        function autoResizeTextarea() {
            searchInput.style.height = 'auto';
            searchInput.style.height = Math.min(searchInput.scrollHeight, 200) + 'px';
        }

        // 监听输入，自动调整高度
        searchInput.addEventListener('input', autoResizeTextarea);

        // 回车发送，Shift+Enter换行
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                performSearch();
            }
        });

        // 搜索函数
        async function performSearch() {
            const query = searchInput.value.trim();

            if (!query) {
                showError('请输入搜索内容');
                return;
            }

            // 显示流式加载状态
            showStreamLoading(query);
            resultsContainer.classList.remove('hidden');

            try {
                // 调用流式API
                await callStreamAPI(query);
            } catch (error) {
                showError('搜索失败：' + error.message);
                console.error('Search error:', error);
            }
        }

        // 调用流式API
        async function callStreamAPI(query) {
            const response = await fetch(CONFIG.API_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    temperature: 0.7,
                    max_tokens: 4000,
                    stream: true  // 启用流式输出
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API请求失败: ${response.status}`);
            }

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let resultElement = null;

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);

                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);

                            // 处理错误
                            if (parsed.error) {
                                throw new Error(parsed.error);
                            }

                            // 处理完成信号
                            if (parsed.done) {
                                finalizeResult(resultElement, fullContent, query);
                                continue;
                            }

                            // 提取内容
                            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                                const delta = parsed.choices[0].delta;

                                // 如果有内容，添加到结果中
                                if (delta.content) {
                                    fullContent += delta.content;

                                    // 首次收到内容，创建结果容器
                                    if (!resultElement) {
                                        resultElement = createStreamResultContainer(query);
                                    }

                                    // 更新显示
                                    updateStreamContent(resultElement, fullContent);
                                }
                            }
                        } catch (e) {
                            // 忽略JSON解析错误
                        }
                    }
                }
            }
        }

        // 创建流式结果容器
        function createStreamResultContainer(query) {
            // 添加生成状态，输入框移动到顶部
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.classList.add('generating');
            }

            // 清空loading状态（移除转圈圈）
            resultsContainer.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'search-result streaming';
            container.innerHTML = `
                <div class="result-header">
                    <div class="result-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="result-title">让一部分人先用起来</div>
                    <div class="streaming-indicator">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                        AI正在生成中...
                    </div>
                </div>
                <div class="result-content"></div>
                <div class="result-meta" style="display: none;">
                    <div class="result-time">
                        <i class="far fa-clock"></i>
                        <span class="time-text"></span>
                    </div>
                    <div class="action-buttons">
                        <button class="copy-btn-header" onclick="copyContent(this)" title="复制内容">
                            <i class="far fa-copy"></i>
                            <span>复制</span>
                        </button>
                        <a href="https://www.doubao.com/chat" target="_blank" class="external-link" title="在豆包中继续">
                            <i class="fas fa-external-link-alt"></i> 豆包
                        </a>
                        <a href="https://metaso.cn/" target="_blank" class="external-link" title="在秘塔中继续">
                            <i class="fas fa-external-link-alt"></i> 秘塔
                        </a>
                    </div>
                </div>
            `;

            resultsContainer.appendChild(container);
            return container;
        }

        // 更新流式内容
        function updateStreamContent(container, content) {
            const contentDiv = container.querySelector('.result-content');
            contentDiv.textContent = content;

            // 自动滚动到底部
            contentDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

        // 完成流式输出
        function finalizeResult(container, content, query) {
            if (!container) return;

            // 移除流式指示器
            const indicator = container.querySelector('.streaming-indicator');
            if (indicator) {
                indicator.remove();
            }

            // 显示操作按钮并设置内容
            const meta = container.querySelector('.result-meta');
            const timeText = container.querySelector('.time-text');
            const copyBtn = container.querySelector('.copy-btn-header');

            meta.style.display = 'flex';
            timeText.textContent = new Date().toLocaleString('zh-CN');
            copyBtn.setAttribute('data-content', content);

            // 添加完成动画
            container.classList.add('streaming-complete');

            // 滚动到按钮区域，确保操作按钮可见
            setTimeout(() => {
                container.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }, 100);
        }

        // 显示流式加载状态
        function showStreamLoading(query) {
            // 隐藏加载提示，直接显示空状态
            resultsContainer.innerHTML = `
                <div class="loading loading-compact">
                    <div class="spinner"></div>
                </div>
            `;
        }

        // 显示加载状态（保留兼容旧版本，不在当前流程使用）
        function showLoadingCompactLegacy() {
            resultsContainer.innerHTML = `
                <div class="loading loading-compact">
                    <div class="spinner"></div>
                </div>
            `;
        }

        // 显示搜索结果（保留兼容旧版本，不在当前流程使用）
        function displayResultLegacy(data, query) {
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                showError('API返回数据格式错误');
                return;
            }

            const content = data.choices[0].message.content;

            resultsContainer.innerHTML = `
                <div class="search-result">
                    <div class="result-header">
                        <div class="result-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="result-title">让一部分人先用起来</div>
                    </div>
                    <div class="result-content">${escapeHtml(content)}</div>
                    <div class="result-meta">
                        <div class="result-time">
                            <i class="far fa-clock"></i>
                            ${new Date().toLocaleString('zh-CN')}
                        </div>
                        <div class="action-buttons">
                            <button class="copy-btn-header" onclick="copyContent(this)" data-content="${escapeHtml(content)}" title="复制内容">
                                <i class="far fa-copy"></i>
                            </button>
                            <a href="https://www.doubao.com/chat" target="_blank" class="external-link" title="在豆包中继续">
                                <i class="fas fa-external-link-alt"></i> 豆包
                            </a>
                            <a href="https://metaso.cn/" target="_blank" class="external-link" title="在秘塔中继续">
                                <i class="fas fa-external-link-alt"></i> 秘塔
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        // 显示加载状态
        function showLoading() {
            resultsContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <div class="loading-text">AI正在思考中...</div>
                </div>
            `;
        }

        // 显示搜索结果
        function displayResult(data, query) {
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                showError('API返回数据格式错误');
                return;
            }

            const content = data.choices[0].message.content;

            resultsContainer.innerHTML = `
                <div class="search-result">
                    <div class="result-header">
                        <div class="result-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="result-title">让一部分人先用起来</div>
                        <button class="copy-btn-header" onclick="copyContent(this)" data-content="${escapeHtml(content)}" title="复制内容">
                            <i class="far fa-copy"></i>
                            <span>复制</span>
                        </button>
                    </div>
                    <div class="result-content">${escapeHtml(content)}</div>
                    <div class="result-meta">
                        <div class="result-time">
                            <i class="far fa-clock"></i>
                            ${new Date().toLocaleString('zh-CN')}
                        </div>
                    </div>
                </div>
            `;
        }

        // 显示错误
        function showError(message) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>
                    ${message}
                </div>
            `;
            resultsContainer.classList.remove('hidden');
        }

        // 复制功能
        function copyContent(button) {
            const content = button.getAttribute('data-content');

            // 使用现代 Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(content).then(() => {
                    showCopiedState(button);
                }).catch(() => {
                    // 降级方案
                    fallbackCopy(content, button);
                });
            } else {
                // 降级方案
                fallbackCopy(content, button);
            }
        }

        function fallbackCopy(content, button) {
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                showCopiedState(button);
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制');
            }

            document.body.removeChild(textarea);
        }

        function showCopiedState(button) {
            button.classList.add('copied');
            const icon = button.querySelector('i');
            const text = button.querySelector('span');

            // 更改图标为对勾
            icon.className = 'fas fa-check';

            // 如果有文字元素，更新文字
            if (text) {
                text.textContent = '已复制';
            }

            // 3秒后恢复
            setTimeout(() => {
                button.classList.remove('copied');
                icon.className = 'far fa-copy';
                if (text) {
                    text.textContent = '复制';
                }
            }, 3000);
        }

        // HTML转义
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 页面加载完成后聚焦搜索框
        window.addEventListener('load', () => {
            searchInput.focus();

            // 添加输入框聚焦动画
            searchInput.addEventListener('focus', () => {
                document.querySelector('.search-box').style.boxShadow = '0 12px 48px rgba(102, 126, 234, 0.2)';
            });

            searchInput.addEventListener('blur', () => {
                document.querySelector('.search-box').style.boxShadow = '';
            });
        });

        // ==================== 演示系统模块 ====================

        const DemoSystem = (function() {
            // 配置
            const CONFIG = {
                STORAGE_KEY: 'aicoming_demo_completed',
                IDLE_TIMEOUT: 3000, // 3秒静止触发
                TYPING_SPEED: 80,   // 打字速度
                DEMO_QUERY: '我想写一份关于AI行业发展的周报，语气要专业。',
                // 演示预设响应内容（模拟真实API响应）
                DEMO_RESPONSE: `# AI行业发展周报

## 一、本周核心动态

### 1. 技术突破
- **大模型竞争升级**：OpenAI、Google、Anthropic等头部厂商持续推出更强大的模型
- **多模态能力增强**：文本、图像、音频、视频的融合处理能力显著提升
- **推理能力突破**：复杂逻辑推理和数学问题解决能力大幅改善

### 2. 商业应用
- **企业级应用落地**：更多传统企业开始部署AI解决方案
- **成本优化**：模型推理成本持续下降，使得大规模应用成为可能
- **垂直领域深耕**：医疗、法律、金融等专业领域应用加速

### 3. 政策监管
- **全球监管趋严**：欧盟AI法案正式生效，美国也在推进相关立法
- **安全与平衡**：各国在促进创新和管控风险之间寻求平衡点

---
*本周报由AI自动生成，仅供参考*`
            };

            // 状态管理
            let state = {
                isDemoRunning: false,
                isPaused: false,
                currentStep: 0,
                idleTimer: null,
                lastMouseMove: Date.now()
            };

            // DOM元素引用
            let elements = {};

            // 初始化
            function init() {
                cacheElements();
                bindEvents();
                checkDemoStatus();
            }

            // 缓存DOM元素
            function cacheElements() {
                elements = {
                    searchInput: document.getElementById('searchInput'),
                    searchBtn: document.getElementById('searchBtn'),
                    resultsContainer: document.getElementById('resultsContainer'),
                    demoTriggerBtn: document.getElementById('demoTriggerBtn'),
                    demoTooltip: document.getElementById('demoTooltip'),
                    demoOverlay: document.getElementById('demoOverlay'),
                    demoCompleteToast: document.getElementById('demoCompleteToast'),
                    searchBox: document.querySelector('.search-box')
                };
            }

            // 绑定事件
            function bindEvents() {
                // 鼠标移动监听
                document.addEventListener('mousemove', resetIdleTimer);

                // 触发按钮点击
                if (elements.demoTriggerBtn) {
                    elements.demoTriggerBtn.addEventListener('click', startDemo);
                }

                // 用户输入时中断演示
                if (elements.searchInput) {
                    elements.searchInput.addEventListener('input', interruptDemo);
                }

                // 点击遮罩层中断演示
                if (elements.demoOverlay) {
                    elements.demoOverlay.addEventListener('click', interruptDemo);
                }
            }

            // 检查演示状态
            function checkDemoStatus() {
                const hasCompletedDemo = localStorage.getItem(CONFIG.STORAGE_KEY);

                if (hasCompletedDemo) {
                    // 已完成过演示，显示触发按钮
                    showDemoButton();
                } else {
                    // 未完成，启动空闲检测
                    startIdleDetection();
                }
            }

            // 空闲检测
            function startIdleDetection() {
                resetIdleTimer();

                state.idleTimer = setInterval(() => {
                    const idleTime = Date.now() - state.lastMouseMove;

                    if (idleTime >= CONFIG.IDLE_TIMEOUT && !state.isDemoRunning) {
                        clearInterval(state.idleTimer);
                        startDemo();
                    }
                }, 1000);
            }

            // 重置空闲计时器
            function resetIdleTimer() {
                state.lastMouseMove = Date.now();
            }

            // 显示演示按钮
            function showDemoButton() {
                if (elements.demoTriggerBtn) {
                    elements.demoTriggerBtn.style.display = 'flex';
                }
            }

            // ==================== 核心演示流程 ====================

            // 开始演示
            async function startDemo() {
                if (state.isDemoRunning) return;

                state.isDemoRunning = true;
                state.currentStep = 0;

                // 隐藏演示按钮
                if (elements.demoTriggerBtn) {
                    elements.demoTriggerBtn.style.display = 'none';
                }

                // 显示遮罩层
                if (elements.demoOverlay) {
                    elements.demoOverlay.style.display = 'block';
                }

                // 执行演示步骤
                try {
                    await runDemoSteps();
                } catch (error) {
                    console.error('演示执行出错:', error);
                    interruptDemo();
                }
            }

            // 演示步骤序列
            async function runDemoSteps() {
                // 步骤1: 聚焦输入框并提示
                await step1_FocusInput();

                // 步骤2: 打字机效果输入
                await step2_TypeQuery();

                // 步骤3: 模拟点击发送
                await step3_ClickSend();

                // 步骤4: 显示加载动画
                await step4_ShowLoading();

                // 步骤5: 展示结果
                await step5_ShowResult();

                // 步骤6: 高亮复制按钮
                await step6_HighlightCopy();

                // 步骤7: 完成演示
                await step7_CompleteDemo();
            }

            // 步骤1: 聚焦输入框
            async function step1_FocusInput() {
                highlightElement(elements.searchBox);
                showTooltip(elements.searchBox, '请输入您的需求', 'top');

                await sleep(500);
                elements.searchInput.focus();
                await sleep(1500);

                hideTooltip();
                removeHighlight(elements.searchBox);
            }

            // 步骤2: 打字机效果输入
            async function step2_TypeQuery() {
                const query = CONFIG.DEMO_QUERY;
                elements.searchInput.value = '';

                showTooltip(elements.searchInput, '演示：自动输入示例查询', 'top');

                // 打字机效果
                for (let i = 0; i < query.length; i++) {
                    elements.searchInput.value = query.substring(0, i + 1);
                    autoResizeTextarea();
                    await sleep(CONFIG.TYPING_SPEED);
                }

                await sleep(500);
                hideTooltip();
            }

            // 步骤3: 点击发送按钮
            async function step3_ClickSend() {
                highlightElement(elements.searchBtn);
                showTooltip(elements.searchBtn, '点击发送', 'left');

                await sleep(800);

                // 模拟按钮点击效果
                elements.searchBtn.style.transform = 'scale(0.95)';
                await sleep(100);
                elements.searchBtn.style.transform = 'scale(1)';

                await sleep(500);
                hideTooltip();
                removeHighlight(elements.searchBtn);
            }

            // 步骤4: 显示加载
            async function step4_ShowLoading() {
                elements.resultsContainer.classList.remove('hidden');
                showStreamLoading(CONFIG.DEMO_QUERY);

                showTooltip(elements.resultsContainer, 'AI正在思考...', 'top');
                await sleep(2000);
                hideTooltip();
            }

            // 步骤5: 展示结果
            async function step5_ShowResult() {
                // 清除loading
                elements.resultsContainer.innerHTML = '';

                // 创建结果容器
                const resultElement = createStreamResultContainer(CONFIG.DEMO_QUERY);
                elements.resultsContainer.appendChild(resultElement);

                // 模拟流式输出
                const content = CONFIG.DEMO_RESPONSE;
                const contentDiv = resultElement.querySelector('.result-content');
                let currentContent = '';

                const lines = content.split('\n');
                for (let line of lines) {
                    currentContent += line + '\n';
                    contentDiv.textContent = currentContent;
                    await sleep(30);
                }

                // 完成结果
                finalizeResult(resultElement, content, CONFIG.DEMO_QUERY);

                await sleep(1000);
            }

            // 步骤6: 高亮复制按钮
            async function step6_HighlightCopy() {
                const copyBtn = elements.resultsContainer.querySelector('.copy-btn-header');
                if (copyBtn) {
                    copyBtn.classList.add('copy-btn-highlight');
                    showTooltip(copyBtn, '点击一键复制内容', 'top');

                    await sleep(3000);

                    hideTooltip();
                    copyBtn.classList.remove('copy-btn-highlight');
                }
            }

            // 步骤7: 完成演示
            async function step7_CompleteDemo() {
                // 隐藏遮罩层
                if (elements.demoOverlay) {
                    elements.demoOverlay.style.display = 'none';
                }

                // 显示完成提示
                if (elements.demoCompleteToast) {
                    elements.demoCompleteToast.style.display = 'flex';
                    await sleep(3000);
                    elements.demoCompleteToast.style.display = 'none';
                }

                // 记录已完成演示
                localStorage.setItem(CONFIG.STORAGE_KEY, 'true');

                // 显示演示按钮
                showDemoButton();

                // 清空输入框
                elements.searchInput.value = '';
                autoResizeTextarea();

                // 聚焦输入框
                elements.searchInput.focus();

                state.isDemoRunning = false;
            }

            // ==================== 工具函数 ====================

            // 中断演示
            function interruptDemo() {
                if (!state.isDemoRunning) return;

                console.log('演示被中断');

                // 清理状态
                state.isDemoRunning = false;
                if (state.idleTimer) {
                    clearInterval(state.idleTimer);
                }

                // 移除所有效果
                hideTooltip();
                if (elements.demoOverlay) {
                    elements.demoOverlay.style.display = 'none';
                }
                removeHighlight(elements.searchBox);
                removeHighlight(elements.searchBtn);

                // 显示演示按钮
                showDemoButton();
            }

            // 高亮元素
            function highlightElement(element) {
                if (element) {
                    element.classList.add('demo-highlight');
                }
            }

            // 移除高亮
            function removeHighlight(element) {
                if (element) {
                    element.classList.remove('demo-highlight');
                }
            }

            // 显示tooltip
            function showTooltip(targetElement, text, position = 'top') {
                if (!elements.demoTooltip || !targetElement) return;

                const tooltip = elements.demoTooltip;
                const content = tooltip.querySelector('.tooltip-content');
                const arrow = tooltip.querySelector('.tooltip-arrow');

                content.textContent = text;
                tooltip.style.display = 'block';

                // 计算位置
                const targetRect = targetElement.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();

                let top, left;

                switch (position) {
                    case 'top':
                        top = targetRect.top - tooltipRect.height - 12;
                        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                        arrow.style.bottom = '-8px';
                        arrow.style.top = 'auto';
                        arrow.style.left = '50%';
                        arrow.style.transform = 'translateX(-50%)';
                        arrow.style.borderTop = '8px solid #1a1a1a';
                        arrow.style.borderBottom = 'none';
                        arrow.style.borderLeft = '8px solid transparent';
                        arrow.style.borderRight = '8px solid transparent';
                        break;
                    case 'left':
                        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                        left = targetRect.left - tooltipRect.width - 12;
                        arrow.style.right = '-8px';
                        arrow.style.left = 'auto';
                        arrow.style.top = '50%';
                        arrow.style.transform = 'translateY(-50%) rotate(-90deg)';
                        arrow.style.borderTop = '8px solid #1a1a1a';
                        arrow.style.borderRight = 'none';
                        arrow.style.borderBottom = '8px solid transparent';
                        arrow.style.borderLeft = '8px solid transparent';
                        break;
                    default:
                        top = targetRect.bottom + 12;
                        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                        arrow.style.top = '-8px';
                        arrow.style.bottom = 'auto';
                        arrow.style.left = '50%';
                        arrow.style.transform = 'translateX(-50%)';
                        arrow.style.borderBottom = '8px solid #1a1a1a';
                        arrow.style.borderTop = 'none';
                        arrow.style.borderLeft = '8px solid transparent';
                        arrow.style.borderRight = '8px solid transparent';
                }

                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
            }

            // 隐藏tooltip
            function hideTooltip() {
                if (elements.demoTooltip) {
                    elements.demoTooltip.style.display = 'none';
                }
            }

            // 延时函数
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            // 自动调整输入框高度（复用现有函数）
            function autoResizeTextarea() {
                const textarea = elements.searchInput;
                if (textarea) {
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                }
            }

            // 公开API
            return {
                init: init,
                start: startDemo,
                interrupt: interruptDemo,
                isRunning: () => state.isDemoRunning
            };
        })();

        // 页面加载完成后初始化演示系统
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => DemoSystem.init());
        } else {
            DemoSystem.init();
        }

        // 兼容 index.html 内联 onclick
        window.performSearch = performSearch;
        window.copyContent = copyContent;
