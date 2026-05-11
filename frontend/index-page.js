import { bindPrimaryNavTracking } from './modules/interaction-tracker.js';

        // 配置 - 使用本地API代理
        const CONFIG = {
            API_PROXY_URL: '/api/ai/chat', // 本地API代理地址
        };
        const STREAM_LOADING_MESSAGE = 'AI 正在思考中，预计 1 分钟内生成，请稍候...';

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
            resultsContainer.innerHTML = `
                <div class="loading loading-compact">
                    <div class="spinner" aria-hidden="true"></div>
                    <div class="loading-text loading-text-compact">${STREAM_LOADING_MESSAGE}</div>
                </div>
            `;
        }

        // 显示加载状态（保留兼容旧版本，不在当前流程使用）
        function showLoadingCompactLegacy() {
            resultsContainer.innerHTML = `
                <div class="loading loading-compact">
                    <div class="spinner" aria-hidden="true"></div>
                    <div class="loading-text loading-text-compact">${STREAM_LOADING_MESSAGE}</div>
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
                    <div class="spinner" aria-hidden="true"></div>
                    <div class="loading-text">${STREAM_LOADING_MESSAGE}</div>
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
            bindPrimaryNavTracking();
            searchInput.focus();

            // 添加输入框聚焦动画
            searchInput.addEventListener('focus', () => {
                document.querySelector('.search-box').style.boxShadow = '0 12px 48px rgba(102, 126, 234, 0.2)';
            });

            searchInput.addEventListener('blur', () => {
                document.querySelector('.search-box').style.boxShadow = '';
            });
        });

        // 兼容 index.html 内联 onclick
        window.performSearch = performSearch;
        window.copyContent = copyContent;
