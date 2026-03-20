const REFERENCE_SOURCE_URL = 'https://ai.codefather.cn/skills';
const REFERENCE_SOURCE_LABEL = '参考来源';

const BASE_SKILL_MODULES = [
    {
        id: 'claude-official',
        title: 'Claude官方',
        icon: 'fa-solid fa-sparkles',
        tone: 'violet',
        description: '直接参考 Anthropic 官方 skills 仓库，优先收录最常用、最适合日常生产的官方 Skill。',
        skills: [
            {
                name: 'claude-api',
                slug: 'claude-api',
                headline: '用官方 Claude API 和 Anthropic SDK 构建应用、工作流与智能体入口。',
                scenario: '适合你要接入 Claude API、Anthropic SDK、Agent SDK，或者准备把 Claude 真正嵌进产品时使用。',
                overview: '这是 Anthropic 官方仓库里最偏“正式开发入口”的 Skill。它不是泛泛讲模型能力，而是围绕 Claude API、Anthropic SDK 和 Agent SDK 的接入方式，帮助你先选对使用层级，再进入对应语言和实现路径。对于正在做 LLM 应用、工具调用、多轮工作流或 Agent 产品的人来说，这是最值得优先看的官方 Skill 之一。',
                useCases: ['接入 Claude API 或 Anthropic SDK', '判断该用单次调用、工作流还是 Agent SDK', '为不同语言项目选择正确的接入方式', '实现流式输出、工具调用和长上下文对话'],
                gettingStarted: ['先判断自己是在做单次调用、工具工作流，还是需要文件/网页/终端能力的 Agent', '确认项目主语言，再按官方 Skill 指引进入对应语言目录', '默认先用最简单的调用层级跑通，再扩展到工具调用或 Agent SDK'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/claude-api',
                installHint: '如果你希望把官方 Claude API Skill 装进本地工作流，可以直接用这条命令作为起点。',
                skillDocPurpose: '这个 Skill 的 SKILL.md 主要在做两件事：第一，告诉 Agent 什么时候应该把任务识别成 Claude API / Anthropic SDK / Agent SDK 问题；第二，把“先选哪一层接入方式、再读哪份语言文档”的路径明确下来，避免一上来就用错 SDK 或把简单调用做成过度复杂的 Agent。',
                relatedSlugs: ['mcp-builder', 'webapp-testing'],
                sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/claude-api'
            },
            {
                name: 'frontend-design',
                slug: 'frontend-design',
                headline: '用官方高设计质量工作流，做出更像正式产品而不是模板拼接的前端页面。',
                scenario: '适合落地网站、落地页、控制台、组件、海报或任何需要明显设计感的前端界面。',
                overview: '这是 Anthropic 官方示例里非常高频的一个 Skill。它强调的不是“把页面搭出来”，而是选一个清晰且有辨识度的设计方向，再把字体、颜色、排版、动效和视觉细节执行完整。对想做出不那么 AI 味、也不那么模板化前端的人来说，它非常实用。',
                useCases: ['设计和实现品牌感更强的网页', '优化已有页面的视觉层级和审美方向', '生成更有完成度的落地页和产品界面', '避免千篇一律的 AI 默认设计风格'],
                gettingStarted: ['先明确页面的用途、目标用户和你想走的风格方向', '不要一上来就写通用卡片堆叠，先定整体审美语言', '实现时把字体、色彩、空间和动效一起考虑，而不是只改配色'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/frontend-design',
                installHint: '这个官方 Skill 很适合放进网页类项目里长期复用，尤其适合你现在这种持续补页面的站点。',
                skillDocPurpose: '这个 Skill 的 SKILL.md 重点不是列一堆组件，而是强制 Agent 先选一个鲜明的审美方向，再围绕字体、色彩、动效、布局和背景细节做完整实现。它的价值在于让 Agent 少走“安全但平庸”的路线。',
                relatedSlugs: ['web-artifacts-builder', 'webapp-testing'],
                sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design'
            },
            {
                name: 'mcp-builder',
                slug: 'mcp-builder',
                headline: '按官方最佳实践设计和实现高质量 MCP Server，而不是只把 API 粗暴包一层。',
                scenario: '适合你要把外部 API、数据库或服务做成 MCP Server，给 Claude、Cursor 或其它客户端调用时使用。',
                overview: '这个 Skill 直接面向 MCP Server 开发。它会把重点放在工具设计质量上，比如命名是否可发现、输出是否可结构化、错误信息是否足够可执行、分页和上下文是否友好。对任何准备做 MCP Server 的人来说，它比“随手写个 server”要系统得多。',
                useCases: ['从零搭建新的 MCP Server', '为现有 API 设计更适合 LLM 调用的工具层', '改进工具命名、输入输出和错误处理', '给 MCP Server 补测试和评估问题集'],
                gettingStarted: ['先研究目标服务真正高频的操作，而不是盲目把全部接口一口气暴露出来', '优先设计清晰、可发现的工具命名和结构化输出', '先做可读、可测、可分页的基础工具，再考虑更高层工作流工具'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/mcp-builder',
                installHint: '如果你经常做 MCP 接入，这个官方 Skill 值得长期保留。',
                skillDocPurpose: '这个 Skill 的 SKILL.md 本质上是一套 MCP Server 研发方法。它会先引导 Agent 调研协议和 SDK，再设计工具命名、上下文、错误信息和评估题，而不是直接开始写 server 代码。',
                relatedSlugs: ['claude-api', 'skill-creator'],
                sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/mcp-builder'
            },
            {
                name: 'skill-creator',
                slug: 'skill-creator',
                headline: '把零散好用的做法沉淀成真正可触发、可测试、可迭代的 Skill。',
                scenario: '适合创建新 Skill、改现有 Skill、补评测用例，或者优化 Skill 的触发描述时使用。',
                overview: '这是 Anthropic 官方仓库里最适合“把经验产品化”的一个 Skill。它不只是帮你写一份 SKILL.md，而是强调从目标、触发时机、测试样例、评估反馈到迭代优化的整套流程。对于你这种已经在整理 Skill 导航页、也会继续扩展 Skill 内容的项目，它很有参考价值。',
                useCases: ['从零创建新的 Skill', '改写已有 Skill 的说明和触发逻辑', '给 Skill 补测试提示词和评估方式', '优化 Skill 的描述，让它更容易被正确触发'],
                gettingStarted: ['先定义这个 Skill 到底要解决什么问题、什么时候触发', '先写一版能工作的草稿，再补 2 到 3 个真实测试场景', '根据测试结果改说明和结构，而不是只看文档写得顺不顺'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/skill-creator',
                installHint: '如果你后面还会继续做更多自定义 Skill，这个官方 Skill 很适合作为通用母版。',
                skillDocPurpose: '这个 Skill 的 SKILL.md 重点在于把“写 Skill”这件事流程化。它会让 Agent 先确认意图和触发时机，再写草稿、设计测试、跑评估、看反馈，然后继续迭代，而不是一上来只产出一份孤立文档。',
                relatedSlugs: ['mcp-builder', 'claude-api'],
                sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator'
            },
            {
                name: 'webapp-testing',
                slug: 'webapp-testing',
                headline: '用官方 Playwright 测试工作流验证本地 Web 应用，而不是靠肉眼手点一遍。',
                scenario: '适合本地网页测试、UI 回归、交互验证、截图检查和浏览器日志排查。',
                overview: '这个 Skill 非常适合你当前这种静态站和页面型项目。它的核心不是再教一遍 Playwright 基础，而是把“先侦察页面、再定位选择器、再执行动作”的流程固定下来，并优先复用官方附带的脚本和黑盒工具，减少上下文污染和重复造轮子。',
                useCases: ['验证本地页面是否正常渲染和交互', '为网页补一条最小回归测试脚本', '抓页面截图、Console 和浏览器行为', '对动态页面先侦察再执行自动化操作'],
                gettingStarted: ['先判断是静态 HTML 还是需要真实启动服务的动态页面', '动态页面先等 `networkidle`，再去看 DOM 和选择器', '优先把官方附带脚本当黑盒工具调用，不要一上来就读大脚本源码'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/webapp-testing',
                installHint: '你这个项目后面如果还要继续改页面，这个官方测试 Skill 会非常常用。',
                skillDocPurpose: '这个 Skill 的 SKILL.md 主要在规范本地 Web 测试流程：什么时候先截图侦察、什么时候先等网络稳定、什么时候该复用 `with_server.py` 这类脚本，而不是直接盲写 Playwright 自动化。',
                relatedSlugs: ['frontend-design', 'web-artifacts-builder'],
                sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/webapp-testing'
            },
            {
                name: 'web-artifacts-builder',
                slug: 'web-artifacts-builder',
                headline: '当单文件 HTML 不够用时，用更现代的前端技术做复杂 Web Artifact。',
                scenario: '适合多组件、带状态管理、需要路由或复杂前端结构的交互式 Web Artifact。',
                overview: '这个 Skill 更适合复杂度已经明显上来的 Web 产物。官方定义里它面向的是使用 React、Tailwind 和 shadcn/ui 之类现代前端技术来构建更复杂的 HTML Artifact，而不是简单的单文件页面。对需要多模块协同、状态切换和完整前端结构的页面来说，它会比普通静态页面工作流更稳。',
                useCases: ['构建复杂交互式 HTML Artifact', '处理多组件、多状态和更重的前端结构', '在单文件方案不够用时升级到更完整的前端实现', '为展示型页面补更强的组件化和交互能力'],
                gettingStarted: ['先确认这个页面是不是已经超过了“单文件静态页”的复杂度', '如果需要明显的状态管理、组件拆分或复杂交互，再切到这个 Skill', '先定清楚组件边界和页面结构，再上 React、Tailwind 或 shadcn/ui 方案'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder',
                installHint: '这个官方 Skill 更适合做复杂页面，不建议拿去处理非常轻量的静态小页。',
                skillDocPurpose: '这个 Skill 的 SKILL.md 主要在做复杂度分流：告诉 Agent 什么时候简单 HTML 已经不够，应该升级到更现代的前端 Artifact 技术栈，以及如何围绕组件、状态和路由来组织实现。',
                relatedSlugs: ['frontend-design', 'webapp-testing'],
                sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder'
            }
        ]
    },
    {
        id: 'efficiency-tools',
        title: '效率工具',
        icon: 'fa-solid fa-bolt',
        tone: 'amber',
        description: '帮助你更快收敛需求、复盘经验、并行推进任务的通用效率 Skill。',
        skills: [
            {
                name: 'brainstorming',
                slug: 'brainstorming',
                headline: '把模糊想法打磨成可执行设计，而不是直接开写。',
                scenario: '适合做新页面、新功能、新流程时先把方向和边界聊清楚。',
                overview: '它会先帮你厘清目的、约束和成功标准，再逐步把模糊需求整理成稳定的设计方案，减少返工。',
                useCases: ['新功能设计', '需求澄清', '页面结构规划'],
                gettingStarted: ['先说清楚想解决什么问题', '把高风险决策单独拎出来', '先定结构再做实现细节'],
                relatedSlugs: ['strategic-compact', 'search-first']
            },
            {
                name: 'search-first',
                slug: 'search-first',
                headline: '先查现成方案，再决定要不要自己造。',
                scenario: '适合准备写新能力、新脚本或新组件之前做快速研究。',
                overview: '这个 Skill 会优先帮你找已有工具、现成模式和成熟库，避免把时间花在重复造轮子上。',
                useCases: ['选库选型', '调研现成方案', '减少重复开发'],
                gettingStarted: ['先写出任务边界', '明确是否接受第三方依赖', '优先比较成熟方案的维护成本'],
                relatedSlugs: ['market-research', 'coding-standards']
            },
            {
                name: 'continuous-learning-v2',
                slug: 'continuous-learning-v2',
                headline: '把一次次对话里的好做法沉淀成可复用的工作习惯。',
                scenario: '适合长期使用 Agent，希望越用越顺手的个人或团队。',
                overview: '它会关注会话里反复出现的高价值动作和判断方式，把这些模式沉淀下来，形成更稳定的交付节奏。',
                useCases: ['沉淀团队经验', '减少重复解释', '把成功做法固化成流程'],
                gettingStarted: ['先识别哪些动作在任务里反复出现', '区分通用经验和项目特定习惯', '定期清理低价值规则'],
                relatedSlugs: ['ai-first-engineering', 'verification-loop']
            },
            {
                name: 'strategic-compact',
                slug: 'strategic-compact',
                headline: '在长任务里控制上下文体积，不让对话越做越乱。',
                scenario: '适合多阶段实现、长时间协作、上下文容易膨胀的任务。',
                overview: '它帮助你在合适时机主动压缩上下文，把必要事实保留下来，让后续回合仍然清晰高效。',
                useCases: ['长对话整理', '多阶段实现', '控制任务上下文大小'],
                gettingStarted: ['只保留后续必须依赖的事实', '压缩前先明确当前阶段结果', '把中间过程总结成可继续执行的状态'],
                relatedSlugs: ['brainstorming', 'dispatching-parallel-agents']
            },
            {
                name: 'dispatching-parallel-agents',
                slug: 'dispatching-parallel-agents',
                headline: '识别哪些任务适合并行拆给多个 Agent 一起推进。',
                scenario: '适合有多个独立子任务、需要压缩交付时间的大工作项。',
                overview: '这个 Skill 帮你判断哪些任务能并行、怎么拆边界、如何减少相互踩改，让整体推进更快。',
                useCases: ['并行开发', '拆分独立调研任务', '减少串行等待'],
                gettingStarted: ['先找出互不依赖的子问题', '确保写入文件范围不重叠', '把主线程放在关键路径上'],
                relatedSlugs: ['subagent-driven-development', 'agentic-engineering']
            },
            {
                name: 'verification-loop',
                slug: 'verification-loop',
                headline: '把“看起来差不多”替换成有证据的验证闭环。',
                scenario: '适合任何需要输出可靠结果的实现、调试、改版和发布任务。',
                overview: '它强调验证不是最后想起来才做，而是每一阶段都要有最小证据，尤其适合多人协作和 Agent 参与的任务。',
                useCases: ['功能验收', '改动回归', '减少误判完成'],
                gettingStarted: ['先定义最小验证命令', '每完成一段就跑一次', '只根据实际结果汇报状态'],
                relatedSlugs: ['verification-before-completion', 'requesting-code-review']
            }
        ]
    },
    {
        id: 'software-development',
        title: '软件开发',
        icon: 'fa-solid fa-code',
        tone: 'emerald',
        description: '聚焦前后端实现、代码质量、调试与评审的开发型 Skill。',
        skills: [
            {
                name: 'frontend-patterns',
                slug: 'frontend-patterns',
                headline: '用成熟的 React / Next.js 前端模式减少试错。',
                scenario: '适合做界面、组件拆分、状态设计和前端性能优化。',
                overview: '它帮助你在前端实现时优先采用更稳妥的结构、状态管理方式和可维护写法，尤其适合中大型页面。',
                useCases: ['新页面开发', '组件拆分', '前端性能优化'],
                gettingStarted: ['先明确页面的状态边界', '把交互和数据流拆开', '优先复用现有设计语言和布局模式'],
                relatedSlugs: ['coding-standards', 'requesting-code-review']
            },
            {
                name: 'backend-patterns',
                slug: 'backend-patterns',
                headline: '把接口、服务层和数据处理组织得更清楚。',
                scenario: '适合做 Node.js、Express、服务端流程和 API 设计时使用。',
                overview: '这个 Skill 帮你以更清晰的边界组织后端逻辑，减少“全都堆在一个文件里”的实现方式。',
                useCases: ['REST API 设计', '服务端重构', '业务逻辑拆层'],
                gettingStarted: ['先分清路由、服务和数据访问职责', '把输入校验前置', '对外行为优先保持可预测'],
                relatedSlugs: ['coding-standards', 'deployment-patterns']
            },
            {
                name: 'coding-standards',
                slug: 'coding-standards',
                headline: '统一代码风格、命名和结构，让协作成本更低。',
                scenario: '适合新功能开发、多人协作或准备整理旧代码时使用。',
                overview: '它不是只管格式，而是帮助你在命名、边界、注释和复杂度上做更一致的取舍，让代码更容易接手。',
                useCases: ['团队风格统一', '重构前定规范', '新增模块保持一致性'],
                gettingStarted: ['先遵守项目现有写法', '把复杂逻辑切成可命名单元', '少写装饰性注释，多写真正解释意图的注释'],
                relatedSlugs: ['frontend-patterns', 'systematic-debugging']
            },
            {
                name: 'systematic-debugging',
                slug: 'systematic-debugging',
                headline: '先定位问题成因，再动修复代码。',
                scenario: '适合测试失败、线上异常、交互 bug 和回归问题。',
                overview: '它强调证据驱动调试，先收集事实、缩小范围、验证假设，再决定怎么改，避免“拍脑袋修 bug”。',
                useCases: ['定位回归问题', '分析复杂报错', '减少误修'],
                gettingStarted: ['先记录可复现步骤', '确认问题发生在哪一层', '每次只验证一个假设'],
                relatedSlugs: ['verification-loop', 'requesting-code-review']
            },
            {
                name: 'subagent-driven-development',
                slug: 'subagent-driven-development',
                headline: '把可独立推进的实现任务拆给多个子 Agent 并行完成。',
                scenario: '适合明确有多个独立模块、子页面、数据层任务的工程需求。',
                overview: '它聚焦在实现阶段的并行拆分，强调明确责任边界和非重叠写入范围，让多 Agent 协作更像一个小团队。',
                useCases: ['并行实现多个模块', '拆分前后端任务', '压缩交付周期'],
                gettingStarted: ['先定义清晰的文件 ownership', '不要把关键路径全丢给子 Agent', '主线程负责集成和收口'],
                relatedSlugs: ['dispatching-parallel-agents', 'agentic-engineering']
            },
            {
                name: 'requesting-code-review',
                slug: 'requesting-code-review',
                headline: '在提交前主动做一次有重点的代码审查。',
                scenario: '适合完成较大改动、准备发布、或担心存在边界问题时使用。',
                overview: '这个 Skill 会把代码评审从“随手看看”变成有重点的检查过程，优先找行为回归、缺失测试和潜在风险。',
                useCases: ['大改动收口', '提交前自查', '把问题拦在上线前'],
                gettingStarted: ['先列出本次最可能出问题的地方', '优先看接口变化和边界分支', '把发现的问题按严重度排序'],
                relatedSlugs: ['verification-before-completion', 'coding-standards']
            }
        ]
    },
    {
        id: 'content-media',
        title: '内容与媒体',
        icon: 'fa-solid fa-photo-film',
        tone: 'fuchsia',
        description: '适合做封面、配图、播客、信息图与视觉化内容生产的媒体 Skill。',
        skills: [
            {
                name: 'baoyu-cover-image',
                slug: 'baoyu-cover-image',
                headline: '快速生成更像正式发布封面的文章头图。',
                scenario: '适合公众号、博客、专栏、活动页和专题内容。',
                overview: '这个 Skill 聚焦封面图，不追求泛用，而是帮助你从版式、配色和情绪上更快拿到可发布结果。',
                useCases: ['文章头图', '专题封面', '品牌内容视觉'],
                gettingStarted: ['先明确内容主题和主情绪', '选择合适比例', '让封面服务于标题而不是喧宾夺主'],
                relatedSlugs: ['baoyu-image-gen', 'baoyu-post-to-wechat']
            },
            {
                name: 'baoyu-image-gen',
                slug: 'baoyu-image-gen',
                headline: '用多家图像模型快速生成配图和视觉素材。',
                scenario: '适合文章插图、海报素材、概念图和社媒视觉。',
                overview: '它更像一个多模型图像生产入口，适合在速度、风格和参考图之间做灵活取舍。',
                useCases: ['配图生成', '概念视觉', '社媒素材制作'],
                gettingStarted: ['先写清楚你要的视觉结果', '决定是否需要参考图', '一次只比较少量方向避免风格跑散'],
                relatedSlugs: ['baoyu-cover-image', 'baoyu-infographic']
            },
            {
                name: 'baoyu-infographic',
                slug: 'baoyu-infographic',
                headline: '把复杂信息整理成更适合传播的高密度信息图。',
                scenario: '适合行业总结、教程精华、报告摘要和社媒科普图。',
                overview: '这个 Skill 擅长把多段文字压缩进更清晰的视觉层级中，适合信息很多但用户阅读时间有限的场景。',
                useCases: ['信息图制作', '长文摘要视觉化', '知识图谱型海报'],
                gettingStarted: ['先筛掉不关键的信息', '确定主结论和次级信息层次', '让读者一眼先看到核心答案'],
                relatedSlugs: ['baoyu-image-gen', 'baoyu-slide-deck']
            },
            {
                name: 'baoyu-slide-deck',
                slug: 'baoyu-slide-deck',
                headline: '把材料快速整理成适合演示的整套视觉化幻灯片。',
                scenario: '适合分享会、路演、内部汇报和课程内容。',
                overview: '它更偏演示内容生成，帮助你从故事线、页序到页面内容密度一次成型。',
                useCases: ['演示稿生成', '课程幻灯片', '路演视觉材料'],
                gettingStarted: ['先写一版目录型提纲', '每页只保留一个主信息点', '给封面和结尾页留足识别度'],
                relatedSlugs: ['pptx', 'baoyu-infographic']
            },
            {
                name: 'speech',
                slug: 'speech',
                headline: '把文字快速转换成可直接试听的语音内容。',
                scenario: '适合播客、旁白、可访问性语音、短音频提示和批量朗读。',
                overview: '这个 Skill 适合把文本变成语音输出，尤其在需要快速生成可试听版本时非常高效。',
                useCases: ['播客口播', '旁白生成', '可访问性朗读'],
                gettingStarted: ['先清理过长句子', '为语音文本去掉不必要格式噪音', '输出后试听节奏和断句是否自然'],
                relatedSlugs: ['notebooklm-py', 'baoyu-post-to-wechat']
            },
            {
                name: 'notebooklm-py',
                slug: 'notebooklm-py',
                headline: '把资料进一步转成播客、脑图、信息图等多媒体输出。',
                scenario: '适合长文资料学习、课程整理、知识传播和内容再加工。',
                overview: '它特别适合把一堆文档变成更容易消费的内容形态，让资料从“存着”变成“可被吸收”。',
                useCases: ['资料转播客', '知识内容再加工', '学习型内容生产'],
                gettingStarted: ['先筛选高质量输入资料', '明确输出给谁看或听', '让生成结果回扣核心问题而不是泛泛总结'],
                relatedSlugs: ['speech', 'baoyu-slide-deck']
            }
        ]
    },
    {
        id: 'data-analysis',
        title: '数据与分析',
        icon: 'fa-solid fa-chart-line',
        tone: 'cyan',
        description: '适合做调研、结构化提取、数据架构与成本分析的 Skill。',
        skills: [
            {
                name: 'market-research',
                slug: 'market-research',
                headline: '把市场信息、竞品和趋势整理成有判断价值的结论。',
                scenario: '适合做新业务调研、竞品分析、投资准备和行业扫描。',
                overview: '它不是简单搜资料，而是把市场事实和决策问题对应起来，产出更适合业务判断的结论。',
                useCases: ['竞品调研', '行业扫描', '市场进入判断'],
                gettingStarted: ['先明确你要做什么决策', '把调研维度限定在关键信号上', '输出时给出结论而不仅是资料堆砌'],
                relatedSlugs: ['content-engine', 'investor-materials']
            },
            {
                name: 'clickhouse-io',
                slug: 'clickhouse-io',
                headline: '为分析型数据场景设计更高效的 ClickHouse 用法。',
                scenario: '适合日志分析、指标系统、运营看板和海量事件查询。',
                overview: '这个 Skill 帮你理解 ClickHouse 在建模、查询和性能优化上的关键取舍，适合分析型系统而不是事务型系统。',
                useCases: ['分析库建模', '大规模事件查询', '指标系统优化'],
                gettingStarted: ['先确认查询模式是分析型还是事务型', '建表时围绕查询路径设计', '优先关注排序键和聚合成本'],
                relatedSlugs: ['postgres-patterns', 'content-hash-cache-pattern']
            },
            {
                name: 'postgres-patterns',
                slug: 'postgres-patterns',
                headline: '围绕查询、索引与数据边界做更稳妥的 PostgreSQL 设计。',
                scenario: '适合业务数据库、接口数据层、后台系统和权限场景。',
                overview: '它帮助你在 PostgreSQL 上做更稳妥的 schema、索引和查询设计，兼顾正确性和性能。',
                useCases: ['业务库建模', '索引优化', '接口数据层设计'],
                gettingStarted: ['先画清核心实体关系', '只为真实查询路径建索引', '把约束和默认值放回数据库层'],
                relatedSlugs: ['clickhouse-io', 'backend-patterns']
            },
            {
                name: 'regex-vs-llm-structured-text',
                slug: 'regex-vs-llm-structured-text',
                headline: '判断结构化文本问题该用规则还是该用模型。',
                scenario: '适合日志解析、表单清洗、票据抽取和文本结构化。',
                overview: '这个 Skill 的价值在于帮你先做技术路线判断，优先用便宜稳定的规则方案，只在规则难以覆盖时引入 LLM。',
                useCases: ['文本结构化解析', '规则与模型选型', '控制解析成本'],
                gettingStarted: ['先评估输入格式是否稳定', '规则可解的部分不要过度上模型', '只把低置信度边缘情况交给 LLM'],
                relatedSlugs: ['cost-aware-llm-pipeline', 'market-research']
            },
            {
                name: 'content-hash-cache-pattern',
                slug: 'content-hash-cache-pattern',
                headline: '用内容哈希缓存昂贵处理过程，减少重复计算。',
                scenario: '适合文件处理、OCR、向量化、摘要生成和多媒体流水线。',
                overview: '它强调用内容本身而不是文件路径做缓存键，让缓存更稳定，也更适合批处理和重复输入场景。',
                useCases: ['文件处理缓存', '重复任务去重', '多媒体流水线优化'],
                gettingStarted: ['先找出最昂贵的重复步骤', '用内容哈希作为主键', '把缓存读写封装在单独服务层'],
                relatedSlugs: ['notebooklm-py', 'cost-aware-llm-pipeline']
            },
            {
                name: 'cost-aware-llm-pipeline',
                slug: 'cost-aware-llm-pipeline',
                headline: '在模型效果、延迟和成本之间做可持续的平衡。',
                scenario: '适合多模型工作流、批量生成、预算敏感型产品。',
                overview: '这个 Skill 帮你把模型调用从“哪个最强就用哪个”切换成按任务复杂度路由，更适合真实业务。',
                useCases: ['多模型路由', '控制推理成本', '批量内容处理'],
                gettingStarted: ['先拆分高低复杂度任务', '为每类任务指定默认模型', '记录成本与成功率做回看'],
                relatedSlugs: ['regex-vs-llm-structured-text', 'agentic-engineering']
            }
        ]
    },
    {
        id: 'devops',
        title: '开发运维',
        icon: 'fa-solid fa-server',
        tone: 'indigo',
        description: '覆盖部署、发布、容器化、安全扫描与交付收口的运维型 Skill。',
        skills: [
            {
                name: 'deployment-patterns',
                slug: 'deployment-patterns',
                headline: '把部署流程从“能发上去”升级到“可回滚、可观测、可恢复”。',
                scenario: '适合上线新页面、新服务、容器化系统和生产环境治理。',
                overview: '这个 Skill 强调部署不仅是发版命令，还包括健康检查、回滚路径和环境一致性，适合真实线上场景。',
                useCases: ['生产发版', '回滚设计', '服务健康检查'],
                gettingStarted: ['先定义上线成功的健康标准', '给每次发版准备回滚路径', '把环境差异显式记录下来'],
                relatedSlugs: ['docker-patterns', 'release-skills']
            },
            {
                name: 'docker-patterns',
                slug: 'docker-patterns',
                headline: '用更稳妥的 Docker 与 Compose 组织本地开发和部署环境。',
                scenario: '适合多服务项目、本地环境搭建和容器化交付。',
                overview: '它帮助你处理容器镜像、依赖服务、网络和卷挂载的常见问题，让环境切换更顺手。',
                useCases: ['本地多服务开发', '容器化交付', '环境一致性治理'],
                gettingStarted: ['先分清哪些服务需要长期持久化', '区分开发镜像和生产镜像', '把启动顺序和健康检查写清楚'],
                relatedSlugs: ['deployment-patterns', 'enterprise-agent-ops']
            },
            {
                name: 'release-skills',
                slug: 'release-skills',
                headline: '把版本发布动作收束成可重复执行的流程。',
                scenario: '适合要做版本号升级、changelog 整理和多语言项目发布时使用。',
                overview: '这个 Skill 帮你识别版本文件、发布步骤和更新文档，让发版动作更像固定流程而不是临场操作。',
                useCases: ['版本发布', 'changelog 整理', '多项目统一发版'],
                gettingStarted: ['先确认当前版本来源', '梳理发版前必须通过的检查', '把发布后的验证动作也写进流程'],
                relatedSlugs: ['verification-before-completion', 'deployment-patterns']
            },
            {
                name: 'security-scan',
                slug: 'security-scan',
                headline: '快速扫描 Agent 配置、提示、MCP 与本地规则中的安全风险。',
                scenario: '适合准备共享配置、开放团队使用、或引入新 Agent 工具时使用。',
                overview: '它专注于 Agent 环境本身的安全面，帮助你找出提示注入、配置暴露和不安全工具定义等风险。',
                useCases: ['扫描 Agent 配置', '检查本地规则安全性', '评估外部集成风险'],
                gettingStarted: ['先确认要暴露给谁使用', '重点看高权限工具和外部连接', '在共享前做一次完整扫描'],
                relatedSlugs: ['security-review', 'enterprise-agent-ops']
            },
            {
                name: 'security-review',
                slug: 'security-review',
                headline: '在处理输入、认证、支付和敏感数据时做安全审视。',
                scenario: '适合接口开发、表单输入、用户权限和敏感操作链路。',
                overview: '这个 Skill 像一份实战安全清单，帮助你在编码阶段就想到权限、验证、速率限制和秘密管理等问题。',
                useCases: ['接口安全审查', '权限模型检查', '敏感数据处理'],
                gettingStarted: ['先找出用户输入会流向哪里', '把认证和授权分开看', '明确哪些信息绝不能进日志或前端'],
                relatedSlugs: ['backend-patterns', 'verification-before-completion']
            },
            {
                name: 'verification-before-completion',
                slug: 'verification-before-completion',
                headline: '在说“完成了”之前，先拿到真实验证证据。',
                scenario: '适合上线前、提测前、提交前，以及任何你想快速宣布收工的时候。',
                overview: '它是一道强约束，要求你在每次宣告成功前运行真正能证明结果的命令，避免凭感觉汇报状态。',
                useCases: ['发布前核验', '提交前自证', '避免伪完成'],
                gettingStarted: ['先想清楚哪条命令最能证明结果', '只看最新一次验证输出', '输出状态时带上具体验证证据'],
                relatedSlugs: ['verification-loop', 'release-skills']
            }
        ]
    },
    {
        id: 'business-marketing',
        title: '商业与营销',
        icon: 'fa-solid fa-briefcase',
        tone: 'rose',
        description: '适合内容分发、增长表达、对外沟通和融资材料准备的业务 Skill。',
        skills: [
            {
                name: 'content-engine',
                slug: 'content-engine',
                headline: '把一份核心内容拆成适合不同平台发布的版本。',
                scenario: '适合做多平台分发、账号矩阵、品牌内容生产。',
                overview: '这个 Skill 帮你根据平台语境重写内容，不只是机械复制，而是让同一份素材变成更适合各平台的表达。',
                useCases: ['多平台内容分发', '账号矩阵运营', '一次素材多次复用'],
                gettingStarted: ['先确定核心内容母稿', '按平台重写而不是简单裁剪', '为每个平台单独定义成功指标'],
                relatedSlugs: ['article-writing', 'baoyu-post-to-x']
            },
            {
                name: 'article-writing',
                slug: 'article-writing',
                headline: '把素材整理成更像正式发布物的长文。',
                scenario: '适合教程、专题文章、专栏、品牌内容和深度说明文。',
                overview: '它强调结构、语气和可信度，适合把零散观点整理成完整文章，而不是输出一篇松散长文。',
                useCases: ['专题写作', '教程文章', '品牌深度内容'],
                gettingStarted: ['先定目标读者和文章结论', '把材料按结构重排', '让每一节都服务于主线'],
                relatedSlugs: ['content-engine', 'investor-materials']
            },
            {
                name: 'investor-outreach',
                slug: 'investor-outreach',
                headline: '把融资沟通写得更像真实投资人会回复的版本。',
                scenario: '适合冷启动外联、暖介绍话术、跟进邮件和融资更新。',
                overview: '这个 Skill 专注于对外沟通，帮助你在有限篇幅里讲清楚项目价值、阶段和下一步动作。',
                useCases: ['融资外联邮件', '跟进消息', '更新简报'],
                gettingStarted: ['先明确要对方做什么动作', '把项目进展写成具体事实', '每封沟通只保留一个主目标'],
                relatedSlugs: ['investor-materials', 'market-research']
            },
            {
                name: 'investor-materials',
                slug: 'investor-materials',
                headline: '把融资所需的 deck、memo 和数据讲成同一套故事。',
                scenario: '适合种子轮、路演、募资准备和内部融资梳理。',
                overview: '它帮助你保持 deck、数据表和 narrative 一致，避免“PPT 一个说法、邮件另一个说法”。',
                useCases: ['融资 deck', '募资 memo', '商业故事梳理'],
                gettingStarted: ['先统一一句话故事线', '把关键数字固定为同一口径', '确保材料之间前后不打架'],
                relatedSlugs: ['investor-outreach', 'pptx']
            },
            {
                name: 'baoyu-post-to-wechat',
                slug: 'baoyu-post-to-wechat',
                headline: '把内容整理成适合微信公众号发布的形式。',
                scenario: '适合公众号文章、品牌通知、活动内容和图文运营。',
                overview: '这个 Skill 聚焦微信生态发布动作，帮助你把 markdown、HTML 或素材整理成更接近最终发布状态的内容。',
                useCases: ['公众号文章发布', '品牌内容分发', '活动内容运营'],
                gettingStarted: ['先准备适合微信阅读的结构', '把封面和段落层次提前整理好', '发布前检查移动端阅读节奏'],
                relatedSlugs: ['article-writing', 'baoyu-cover-image']
            },
            {
                name: 'baoyu-post-to-x',
                slug: 'baoyu-post-to-x',
                headline: '把内容改写成更适合 X 平台传播的版本并完成发布。',
                scenario: '适合短帖、线程、产品更新和海外社媒触达。',
                overview: '这个 Skill 兼顾内容组织与发布动作，适合想把同一份内容延伸到 X 的团队。',
                useCases: ['X 帖子发布', '线程创作', '海外传播'],
                gettingStarted: ['先压缩核心信息密度', '把首句改成更强钩子', '图文或线程结构保持一条主线'],
                relatedSlugs: ['content-engine', 'baoyu-xhs-images']
            }
        ]
    },
    {
        id: 'document-processing',
        title: '文档处理',
        icon: 'fa-solid fa-file-lines',
        tone: 'orange',
        description: '围绕 Word、PDF、表格、幻灯片与通用文档流程的实用 Skill。',
        skills: [
            {
                name: 'docx',
                slug: 'docx',
                headline: '面向 `.docx` 的高保真创建、编辑与结构化排版，覆盖目录、页码、表格、图片和修订痕迹处理。',
                scenario: '适合正式报告、合同、制度文件、模板、公函，以及任何需要认真维护版式的 Word 文档场景。',
                overview: '这个 Skill 不是简单“写一份 Word”，而是把 `.docx` 当成可读、可改、可校验的正式文档格式来处理。它既能创建新的 Word 文件，也适合编辑现有 `.docx`，包括目录、页眉页脚、分页、表格、图片、批注和修订痕迹等内容。对于需要交付给客户、领导或外部机构的正式文档，它会比通用写作式输出稳定得多。',
                useCases: ['从零创建正式 `.docx` 文档', '编辑现有 Word 文件的结构与内容', '处理目录、页码、页眉页脚、表格和图片', '提取带修订痕迹的内容', '将旧 `.doc` 文档转为 `.docx` 后再继续加工'],
                gettingStarted: ['如果是旧 `.doc` 文件，先转换成 `.docx` 再编辑', '如果只想快速看内容，可先提取文本；如果版式很重要，优先解包或渲染检查', '完成主要修改后一定做一次可视化校验，重点看分页、表格和图片位置'],
                installCommand: 'python3 -m pip install python-docx pdf2image',
                installHint: '这个 Skill 常见的本地依赖是 `python-docx` 和 `pdf2image`。如果你要真正创建、修改或渲染 `.docx`，先把这两个依赖装好更稳。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）主要是告诉 Agent：什么时候应该把任务识别成 `.docx` 工作、优先走文本提取还是版式渲染、何时需要解包 XML、以及修改后必须做哪些校验。对 docx 这种高度依赖版式的 Skill 来说，Skills.md 的作用就是让 Agent 不只是“能生成文字”，而是知道怎么交付一份真正可用的 Word 文档。',
                relatedSlugs: ['doc', 'pdf']
            },
            {
                name: 'pdf',
                slug: 'pdf',
                headline: '围绕 PDF 的读取、生成、合并、拆分、抽取、OCR 与版式校验，覆盖最常见的文档处理链路。',
                scenario: '适合扫描件处理、PDF 报告生成、表格与文本抽取、文档合并拆分，以及任何版式重要的 PDF 任务。',
                overview: '这个 Skill 更像一套完整的 PDF 工作流，而不是单一工具推荐。它既适合读取和提取 PDF 内容，也适合生成新 PDF、合并拆分文件、抽取表格、OCR 扫描件，并在输出后做视觉层面的复检。只要任务里出现 `.pdf`，尤其是“既要正确又要看起来像样”的场景，这个 Skill 就很值得优先调用。',
                useCases: ['提取 PDF 文本和表格', '合并、拆分、旋转或加水印', 'OCR 扫描 PDF 变成可搜索文档', '用代码生成新的 PDF 报告', '对输出结果做渲染级视觉检查'],
                gettingStarted: ['先判断 PDF 是文本型还是扫描型，这会直接决定提取方式', '如果输出要交付给别人阅读，不要只看文本提取结果，必须做渲染检查', '涉及批量处理时，先抽样几份确认表格、分页和图片都正常'],
                installCommand: 'python3 -m pip install reportlab pdfplumber pypdf',
                installHint: '这个 Skill 常见的 Python 依赖是 `reportlab`、`pdfplumber` 和 `pypdf`，它们分别覆盖生成、抽取和基础编辑。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）会告诉 Agent 什么时候该把 PDF 当成“文本抽取问题”，什么时候该把它当成“渲染与版式问题”，以及优先使用哪套工具链。对 pdf 这种既涉及内容又涉及视觉结果的 Skill 来说，Skills.md 的作用就是让 Agent 少走弯路，先选对处理路径再动手。',
                relatedSlugs: ['docx', 'nutrient-document-processing']
            },
            {
                name: 'pptx',
                slug: 'pptx',
                headline: '支持从零创建、基于模板生成或深度编辑现有 PowerPoint，并覆盖版式、备注、批注与结构分析。',
                scenario: '适合提案、路演、课件、模板化汇报，以及任何需要读写 `.pptx` 文件的场景。',
                overview: '这个 Skill 的重点不是“帮你随便做几页 PPT”，而是把 `.pptx` 当成一个可以分析和编辑的正式文档格式来处理。它既能从零生成演示稿，也能基于模板快速改稿，还能直接处理现有演示文稿里的文本、布局、主题配色、讲者备注和批注等内容。如果任务已经涉及 `.pptx` 文件，这个 Skill 会明显比通用写作式提示更靠谱。',
                useCases: ['从零创建新的 PowerPoint 演示稿', '基于现有模板批量替换内容', '编辑已有 `.pptx` 的文案、布局、备注或批注', '提取演示文稿中的文本、讲稿和结构信息', '分析主题配色、字体和母版结构'],
                gettingStarted: ['如果只是读取内容，先把 `.pptx` 转成 markdown，快速看清文本层结构', '如果要处理备注、批注、布局、母版或复杂格式，优先解包 OOXML 再编辑', '如果要生成新的 PPT，先定设计方向，再走 HTML 转 PPT 和最终缩略图校验流程'],
                installCommand: 'npx add-skill https://github.com/anthropics/skills/tree/main/skills/pptx',
                installHint: '复制到终端安装后，Agent 在遇到 `.pptx`、slides、presentation、deck 等任务时，就更容易走对 PowerPoint 专项工作流。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）主要是给 AI Agent 看的技能说明文件。它的作用是告诉 Agent：什么时候应该调用这个 pptx Skill、先读哪些辅助文档、优先走哪套 PowerPoint 工作流，以及在读写 `.pptx` 时要遵守哪些边界。对 pptx 这种强流程型 Skill 来说，Skills.md 的价值就在于让 Agent 不只是“会生成内容”，而是知道该怎么正确读取、编辑、生成并校验演示文稿。',
                relatedSlugs: ['baoyu-slide-deck', 'investor-materials']
            },
            {
                name: 'xlsx',
                slug: 'xlsx',
                headline: '围绕 `.xlsx` 的创建、清洗、公式写入、格式整理与多表协作输出，让表格保持可继续编辑而不是一次性结果。',
                scenario: '适合财务表、运营表、清单整理、数据补列、格式清洗，以及需要输出正式 Excel 文件的任务。',
                overview: '这个 Skill 的核心价值是：它不会把 Excel 当成“算完就写死”的静态结果，而是优先保留表格的可编辑性和可继续协作性。它适合创建新的 Excel、修改已有工作簿、补公式、清洗脏数据、调整格式和多 sheet 结构，也适合处理 `.csv/.tsv` 到 `.xlsx` 的整理链路。',
                useCases: ['创建新的 Excel 工作簿', '编辑现有 `.xlsx` 的数据和格式', '用公式而不是硬编码值生成结果', '清洗脏数据并输出可继续协作的表格', '整理多 sheet 的财务或运营文件'],
                gettingStarted: ['先确定主表头、主键列和最终交付格式', '如果有计算逻辑，优先写 Excel 公式而不是把结果硬编码进去', '输出后记得做一次公式重算与错误检查，避免把 `#REF!` 一类错误带出去'],
                installCommand: 'python3 -m pip install pandas openpyxl',
                installHint: '如果你要真正读写和整理 Excel，先装好 `pandas` 和 `openpyxl`；前者适合分析清洗，后者适合保留公式和格式。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）会告诉 Agent 什么时候必须输出真正的 Excel 文件、什么时候该优先保留公式而不是硬编码、以及修改表格后要做哪些重算与错误检查。对 xlsx 这种很容易“表面看起来对、实际公式全坏掉”的 Skill 来说，Skills.md 的价值就在于把这些风险前置掉。',
                relatedSlugs: ['regex-vs-llm-structured-text', 'market-research']
            },
            {
                name: 'nutrient-document-processing',
                slug: 'nutrient-document-processing',
                headline: '通过 Nutrient DWS API 处理 OCR、提取、转换、签署、填表、脱敏和多格式文档流转。',
                scenario: '适合企业级文档流程、审批链路、批量转换、OCR 识别、数据提取和 API 驱动的自动处理任务。',
                overview: '这个 Skill 的重点不在单一文件格式，而在“把文档处理做成一条 API 化流水线”。它可以统一处理 PDF、DOCX、XLSX、PPTX、HTML 和图片等输入，完成格式转换、文字与表格提取、OCR、打水印、脱敏、签名和填表等动作。只要你的任务已经不是“改一个文件”，而是“组织一条文档处理链路”，它就会特别有价值。',
                useCases: ['文档格式转换', 'OCR 扫描件识别', '提取文本或表格数据', '自动脱敏和加水印', '数字签名与 PDF 表单填充'],
                gettingStarted: ['先明确输入输出格式和每一步动作顺序', '如果要走 API，先准备好 `NUTRIENT_API_KEY`', '批量处理前先拿一两个样本跑通，确认输出格式和可读性符合预期'],
                installCommand: 'npx -y @nutrient-sdk/dws-mcp-server',
                installHint: '如果你想把 Nutrient 作为 MCP 服务接入，这条命令是最直接的起点；正式使用前还需要配置 `NUTRIENT_DWS_API_KEY`。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）会告诉 Agent 什么时候该把任务交给 Nutrient 的 API 流程，而不是在本地硬拼脚本；也会说明哪些输入格式、动作类型和环境变量是必须先准备好的。对 nutrient-document-processing 这种外部服务型 Skill 来说，Skills.md 的作用就是帮 Agent 在调用前把链路前提想清楚。',
                relatedSlugs: ['pdf', 'docx']
            },
            {
                name: 'doc',
                slug: 'doc',
                headline: '聚焦 `.docx` 的视觉校验与排版复检，确保文档不仅内容对，而且版式真的能交付。',
                scenario: '适合对布局、分页、表格、图片和整体观感敏感的报告、公函、正式说明和交付文档。',
                overview: '这个 Skill 的价值不在“再写一份 Word”，而在于帮你做最后一公里的版式把关。它强调把 `.docx` 渲染出来看，而不是只读文本结果，所以特别适合那些内容已经差不多完成，但你还需要确认排版、分页、对齐、表格和图片位置是否真的没问题的场景。',
                useCases: ['`.docx` 排版复检', '正式文档渲染检查', '发现分页或表格错位问题', '在交付前做最后一轮视觉确认'],
                gettingStarted: ['先完成主要内容修改，再进入视觉校验阶段', '优先看标题层级、表格宽度、分页断点和图片位置', '如果能渲染成 PDF 或 PNG，就不要只凭文本内容判断文档是否可交付'],
                installCommand: 'python3 -m pip install python-docx pdf2image',
                installHint: '这个 Skill 常见的本地依赖是 `python-docx` 和 `pdf2image`；如果要做渲染检查，通常还要配合 LibreOffice 或 Poppler。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）会告诉 Agent 什么时候任务重点已经从“改内容”切换成“查版式”，以及此时应该优先走渲染检查而不是继续文本层编辑。对 doc 这种偏交付验收型 Skill 来说，Skills.md 的价值就在于提醒 Agent 把视觉结果当成一等公民。',
                relatedSlugs: ['docx', 'pdf']
            }
        ]
    },
    {
        id: 'mcp',
        title: 'MCP',
        icon: 'fa-solid fa-plug-circle-bolt',
        tone: 'sky',
        description: '把常用 MCP Server 集中收纳，适合从仓库、文档、浏览器到自动化流程的一站式扩展。',
        itemLabel: 'MCP',
        skills: [
            {
                name: 'GitHub MCP Server',
                slug: 'github-mcp',
                detailType: 'mcp',
                headline: '让 AI 直接读仓库、查 Issue、跟 Pull Request，而不是在网页和聊天窗口之间来回切。',
                scenario: '适合开源维护、团队协作、代码检索、PR 巡检和仓库问答。',
                overview: 'GitHub MCP Server 的价值在于把 GitHub 从“需要手动打开的网站”变成 AI 工作流里的一个原生数据源。配置好之后，AI 可以读取仓库结构、查找文件、汇总提交记录、浏览 Issue 和 Pull Request，很多原本要切去网页做的动作都能直接在一条对话里完成。',
                useCases: ['快速查看某个仓库最近一周的改动', '汇总 Issue 和 Pull Request 当前状态', '让 AI 辅助做代码检索和仓库问答', '在研发协作里减少反复切网页的上下文切换'],
                gettingStarted: ['先准备好 GitHub Token 或兼容的 Copilot 凭证', '把 GitHub MCP 的远程地址和认证头写进客户端配置文件', '第一次建议先用只读场景试跑，比如查 PR、搜代码、汇总提交，再决定是否开放更多写入能力'],
                installCommand: `{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_TOKEN"
      }
    }
  }
}`,
                installHint: '这是最常见的 GitHub MCP 接入模板。把它加入 Claude Desktop、Cursor 或其它 MCP 客户端配置后重启即可。',
                mcpConfigPurpose: '这段配置的作用，是把 GitHub 的远程 MCP Server 注册到你的 AI 客户端里，并通过 Bearer Token 完成认证。配置生效后，AI 才能安全访问仓库、Issue、Pull Request 和代码上下文。',
                relatedSlugs: ['context7', 'cdm', 'playwright-mcp'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664903822991380'
            },
            {
                name: 'Context7',
                slug: 'context7',
                detailType: 'mcp',
                headline: '把最新版本的官方文档和代码示例直接补进提示词，减少“AI 讲的是旧写法”。',
                scenario: '适合查框架新版本 API、补齐库文档上下文和让代码示例更贴近当前版本。',
                overview: 'Context7 最有价值的地方，是把“模型训练截止导致文档过时”这个问题单独解决掉。它会把最新、尽量接近当前版本的库文档和示例拉进 AI 的上下文，所以你在写代码、迁移版本或查 API 时，不必总担心答案还是旧版本写法。',
                useCases: ['查 React、Next.js、Vue 等框架最新文档', '在生成代码前先给 AI 补齐当前库版本的背景', '减少因为过时 API 带来的试错成本', '把官方示例直接带进对话里辅助实现'],
                gettingStarted: ['先申请 Context7 的 API Key', '把远程 MCP 地址和 Header 配置进客户端', '实际使用时可以在需求里明确带上“use context7”，让 AI 优先调用最新文档'],
                installCommand: `{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_CONTEXT7_API_KEY"
      }
    }
  }
}`,
                installHint: 'Context7 更像“最新文档补丁层”。配置完成后，和技术文档相关的问题就能更稳定地走最新资料。',
                mcpConfigPurpose: '这段配置把 Context7 的远程文档服务接入客户端，并通过 API Key 完成鉴权。它的核心作用不是新增动作，而是给 AI 补充最新、版本更准确的文档上下文。',
                relatedSlugs: ['github-mcp', 'notion-mcp', 'cdm'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664905790119939'
            },
            {
                name: 'cdm（Chrome DevTools MCP）',
                slug: 'cdm',
                detailType: 'mcp',
                headline: '把浏览器运行态直接暴露给 AI，看性能、网络、Console 和 DOM 都更顺手。',
                scenario: '适合前端调试、性能分析、接口排错、页面诊断和运行态问题复现。',
                overview: 'cdm 这里对应的是 Chrome DevTools MCP Server。它的优势不是“帮你再开一个浏览器”，而是让 AI 真正读到浏览器开发者工具里的运行数据。这样遇到卡顿、报错、资源阻塞、接口失败时，AI 不再只能猜，而是能基于 Network、Console、Performance 和 DOM 的真实状态来分析问题。',
                useCases: ['分析页面为什么变慢或卡顿', '检查网络请求、状态码和资源加载情况', '抓取控制台报错并定位前端问题', '让 AI 基于真实页面运行态给出调试建议'],
                gettingStarted: ['本地先准备好 Chrome 浏览器和 Node 环境', '把 stdio 形式的 MCP 配置写入客户端', '首次上手建议先从只读诊断场景开始，比如读 Console、查 Network、看 DOM，再逐步增加自动化操作'],
                installCommand: `{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}`,
                installHint: '这是最常见的本地接入方式。重启 MCP 客户端后，AI 就能尝试读取 Chrome DevTools 暴露出的运行态信息。',
                mcpConfigPurpose: '这段配置会让客户端在本地通过 `npx` 启动 Chrome DevTools MCP Server。它的意义在于把浏览器调试能力接进 AI 工作流里，让 AI 能读 Console、Network、DOM 和性能数据，而不是只根据描述猜问题。',
                relatedSlugs: ['playwright-mcp', 'github-mcp', 'context7'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664901155414018'
            },
            {
                name: 'Playwright MCP Server',
                slug: 'playwright-mcp',
                detailType: 'mcp',
                headline: '让 AI 直接控制浏览器、跑交互流程、抓页面状态，适合自动化和回归验证。',
                scenario: '适合网页自动化、交互测试、表单操作、页面巡检和浏览器级回归验证。',
                overview: 'Playwright MCP Server 更偏“能动手的浏览器自动化入口”。它让 AI 不只是看页面，而是可以点、填、跳转、等待、截图和执行整段页面流程。对于需要真实浏览器交互的场景，比如登录、表单提交、页面回归检查，它会比纯静态分析更直接。',
                useCases: ['自动跑一段网页交互流程', '做登录、提交、跳转等前端回归验证', '抓取动态页面内容或截图', '让 AI 协助复现和定位浏览器交互问题'],
                gettingStarted: ['先准备 Node 环境和 Playwright 运行条件', '把 Playwright MCP Server 注册到客户端配置中', '第一次建议先让 AI 做一段短流程，比如打开页面、点击按钮、检查结果，再逐步增加复杂度'],
                installCommand: `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}`,
                installHint: '如果本机还没装过 Playwright 浏览器，首次运行后通常还需要按提示补装浏览器依赖。',
                mcpConfigPurpose: '这段配置的作用，是让你的 MCP 客户端在本地启动 Playwright MCP Server。生效后，AI 就可以通过标准 MCP 调用浏览器自动化能力，完成点击、输入、等待、截图和页面状态检查。',
                relatedSlugs: ['cdm', 'github-mcp', 'n8n-mcp'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664902979936260'
            },
            {
                name: 'Notion MCP',
                slug: 'notion-mcp',
                detailType: 'mcp',
                headline: '把 Notion 页面和数据库接进 AI 工作流，查资料、整理内容和更新记录都更顺手。',
                scenario: '适合知识库查询、项目文档管理、数据库记录整理和团队协作文档流转。',
                overview: 'Notion MCP 的重点，是把原本只能在 Notion 页面里点来点去的内容，变成 AI 可以直接读取和处理的上下文。这样你在查文档、整理数据库、更新任务记录时，不必一边问 AI 一边手动复制页面内容，整个知识流会更连贯。',
                useCases: ['读取和搜索 Notion 页面内容', '查询或整理 Notion 数据库记录', '把会议纪要、任务状态和项目文档串进 AI 工作流', '减少文档复制粘贴带来的断点'],
                gettingStarted: ['先准备 Notion API Key 并把目标页面或数据库共享给集成', '把 Notion MCP Server 配置进客户端', '建议先从只读场景开始，比如搜索页面、读取数据库记录，确认权限没问题后再扩展到写入流程'],
                installCommand: `{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "notion-mcp-server"],
      "env": {
        "NOTION_API_KEY": "YOUR_NOTION_API_KEY"
      }
    }
  }
}`,
                installHint: '不同 Notion MCP 实现的包名可能略有区别，这里给你的是最常见的本地接入模板；如果你跟着具体仓库安装，优先以仓库 README 为准。',
                mcpConfigPurpose: '这段配置会在本地启动 Notion MCP Server，并通过环境变量把 API Key 传进去。它的作用是让 AI 获得读取和管理 Notion 页面、数据库的能力，而不需要你反复手动复制内容。',
                relatedSlugs: ['claudesidian', 'github-mcp', 'context7'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664901205745667'
            },
            {
                name: 'Claudesidian',
                slug: 'claudesidian',
                detailType: 'mcp',
                headline: '把 Claude 和你的 Obsidian 知识库打通，让本地笔记真正成为可调用上下文。',
                scenario: '适合个人知识管理、笔记检索、知识复用、写作素材整理和本地私有笔记协作。',
                overview: 'Claudesidian 这里对应的是 Obsidian 类 MCP 工作流。它的核心价值，不只是“让 AI 读取 Markdown”，而是让 AI 在不上传整库的前提下，安全地访问你本地 Obsidian 笔记。这样做知识查询、关联旧笔记、整理素材时会比手动复制粘贴顺很多，也更适合有隐私顾虑的个人知识库。',
                useCases: ['让 Claude 读取和搜索本地 Obsidian 笔记', '围绕旧笔记生成文章、总结和知识关联', '自动化创建、修改和整理 Markdown 笔记', '减少个人知识库重复记录和找不到旧内容的问题'],
                gettingStarted: ['先在 Obsidian 里准备好本地 Vault，并按所用方案启用需要的本地 API 或插件', '安装对应的 Obsidian MCP Server，并把服务脚本接入客户端配置', '首次建议先用“读笔记、搜关键词、汇总某个主题”这些低风险场景试跑'],
                installCommand: `{
  "mcpServers": {
    "claudesidian": {
      "command": "npx",
      "args": ["-y", "obsidian-mcp-server"],
      "env": {
        "OBSIDIAN_API_KEY": "YOUR_OBSIDIAN_API_KEY",
        "OBSIDIAN_HOST": "127.0.0.1",
        "OBSIDIAN_PORT": "27124"
      }
    }
  }
}`,
                installHint: '这类 Obsidian MCP 通常依赖本地 Vault 和插件能力，第一次接入前先确认 Obsidian 侧的 API 或插件已经开启。',
                mcpConfigPurpose: '这段配置的作用，是让客户端在本地启动 Obsidian MCP Server，并告诉它该连哪个 Obsidian 接口与端口。这样 AI 才能在你自己的设备上读取、搜索和维护笔记，而不是把知识库手动搬到外部聊天窗口。',
                relatedSlugs: ['notion-mcp', 'context7', 'n8n-mcp'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664904791875615'
            },
            {
                name: 'n8n MCP',
                slug: 'n8n-mcp',
                detailType: 'mcp',
                headline: '把自动化工作流平台和 MCP 接起来，让 AI 能真正进入你的流程编排链路。',
                scenario: '适合自动化流程、定时任务、Webhook 编排、搜索抓取链路和多工具联动。',
                overview: 'n8n MCP 更像一层“把 AI 接进自动化编排平台”的桥。它的价值不在单个工具调用，而在于把搜索、抓取、通知、数据库和外部 API 这些步骤串成自动化流程后，再让 AI 在关键节点参与判断、补全和执行。对需要长期跑的业务流程来说，这比单点调用更有扩展性。',
                useCases: ['把 MCP 工具接进 n8n 工作流节点', '做搜索、抓取、通知和数据库更新的多步自动化', '让 AI 在自动化流程中读取上下文并决定下一步动作', '把浏览器、地图、内容生成等能力串成一条流水线'],
                gettingStarted: ['先明确你要编排的是“单点调用”还是“多步流程”', '在 n8n 里先跑通一个最小工作流，再把 MCP Server 接进其中一个节点', '建议先做只读或低风险流程，比如搜索汇总、文档整理、地图查询，再逐步增加写入或外部调用'],
                installCommand: `{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"]
    }
  }
}`,
                installHint: '这里给的是通用启动模板。实际接入时，你通常还要结合具体工作流节点、Webhook 或外部凭证一起配置。',
                mcpConfigPurpose: '这段配置会把 n8n 相关的 MCP 能力注册到客户端里，方便你先在本地或工作流节点里试跑。它的意义，在于把 AI 从“单次问答”推进到“可编排、可触发、可串联”的自动化流程中。',
                relatedSlugs: ['playwright-mcp', 'amap-maps', 'minimax-mcp'],
                sourceUrl: 'https://ai.codefather.cn/search/mcp?pageSize=40&q=n8n'
            },
            {
                name: '高德地图 MCP',
                slug: 'amap-maps',
                detailType: 'mcp',
                headline: '让 AI 直接调用高德地图能力，做地点检索、路径规划和位置类服务。',
                scenario: '适合路线规划、地点查询、本地生活服务、位置推荐和地理信息辅助流程。',
                overview: '高德地图 MCP 的亮点，是把位置能力从“单独查地图”变成 AI 可以直接调用的服务。无论你是想做附近推荐、出行规划，还是在自动化流程里补一个地理位置节点，它都能让地点、路线和 POI 查询进入统一工作流。',
                useCases: ['查询地点、POI 和地理坐标', '为出行、到店、配送类流程生成路线建议', '在本地生活服务里做周边推荐', '把位置能力接进自动化或客服工作流'],
                gettingStarted: ['先准备好高德开放平台的 Key', '把地图 MCP Server 配置进客户端或工作流环境', '第一次建议先从地点搜索和路线规划这种低风险调用开始，确认返回结果结构符合你的使用场景'],
                installCommand: `{
  "mcpServers": {
    "amap-maps": {
      "command": "npx",
      "args": ["-y", "@amap/amap-maps-mcp-server"],
      "env": {
        "AMAP_MAPS_API_KEY": "YOUR_AMAP_API_KEY"
      }
    }
  }
}`,
                installHint: '地图类 MCP 最关键的是 API Key 和调用额度。接入前先确认高德开放平台凭证已经准备好。',
                mcpConfigPurpose: '这段配置会在本地启动高德地图 MCP Server，并通过环境变量注入高德 Key。配置完成后，AI 才能把地点查询、路线规划和位置服务当成可调用工具，而不是只能给你文字建议。',
                relatedSlugs: ['n8n-mcp', 'minimax-mcp', 'notion-mcp'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664904821235717'
            },
            {
                name: 'MiniMax MCP',
                slug: 'minimax-mcp',
                detailType: 'mcp',
                headline: '把图像、视频、TTS 和语音克隆能力接进 AI 工作流，适合多模态内容生产。',
                scenario: '适合语音合成、图文视频生成、配音、内容自动化和多模态创作链路。',
                overview: 'MiniMax MCP 适合那些不满足于“只生成文字”的工作流。它把语音、图像、视频等多模态能力统一接进 MCP，所以你可以把一段文案继续往下做成配音、短视频或图文内容。对于内容生产型团队，它比单独切多个工具更顺。',
                useCases: ['把文案直接转成语音或配音素材', '生成图像、视频和多模态内容资产', '做带克隆音色的内容自动化流程', '把媒体生成环节接进业务型工作流'],
                gettingStarted: ['先准备 MiniMax 的 API Key 或对应账号凭证', '把 MiniMax MCP Server 安装或接入到客户端', '建议先从单一输出能力开始试跑，比如先做 TTS，再逐步扩展到图像或视频生成'],
                installCommand: `{
  "mcpServers": {
    "minimax": {
      "command": "npx",
      "args": ["-y", "minimax-mcp-js"],
      "env": {
        "MINIMAX_API_KEY": "YOUR_MINIMAX_API_KEY"
      }
    }
  }
}`,
                installHint: 'MiniMax MCP 更适合接到内容流水线里使用。先跑通单个能力，再决定是否扩展到图像、视频或语音克隆。',
                mcpConfigPurpose: '这段配置的作用，是在本地启动 MiniMax MCP Server 并注入所需的 API Key。这样 AI 就能把文字、语音、图像和视频能力统一当作可调用工具，适合做多模态内容链路。',
                relatedSlugs: ['n8n-mcp', 'amap-maps', 'playwright-mcp'],
                sourceUrl: 'https://ai.codefather.cn/mcp/2010664902216572932'
            }
        ]
    }
];

function normalizeSkill(module, skill) {
    return {
        ...skill,
        moduleId: module.id,
        moduleTitle: module.title,
        detailUrl: skill.detailType === 'mcp'
            ? `mcp-detail.html?slug=${skill.slug}`
            : `skill-detail.html?slug=${skill.slug}`,
        sourceUrl: skill.sourceUrl || REFERENCE_SOURCE_URL,
        sourceLabel: skill.sourceLabel || REFERENCE_SOURCE_LABEL
    };
}

const SKILL_MODULE_ORDER = [
    'claude-official',
    'document-processing',
    'efficiency-tools',
    'content-media',
    'data-analysis',
    'business-marketing',
    'software-development',
    'devops',
    'mcp'
];

export const SKILL_MODULES = SKILL_MODULE_ORDER
    .map((moduleId) => BASE_SKILL_MODULES.find((module) => module.id === moduleId))
    .filter(Boolean)
    .map((module) => ({
    ...module,
    skills: module.skills.map((skill) => normalizeSkill(module, skill))
    }));

export const ALL_SKILLS = SKILL_MODULES.flatMap((module) => module.skills);

export function getSkillBySlug(slug) {
    return ALL_SKILLS.find((skill) => skill.slug === slug) || null;
}

export function getMcpBySlug(slug) {
    const skill = getSkillBySlug(slug);
    return skill?.detailType === 'mcp' ? skill : null;
}

export function getModuleById(moduleId) {
    return SKILL_MODULES.find((module) => module.id === moduleId) || null;
}
