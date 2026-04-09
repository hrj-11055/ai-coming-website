import { FEATURED_SKILL_CONTENT, FEATURED_SKILL_GROUPS } from './featured-skills-content.js';

const REFERENCE_SOURCE_URL = 'https://ai.codefather.cn/skills';
const REFERENCE_SOURCE_LABEL = '参考来源';
const ANTHROPIC_SKILLS_BASE_URL = 'https://github.com/anthropics/skills/tree/main/skills';
const ECC_SKILLS_BASE_URL = 'https://github.com/affaan-m/everything-claude-code/tree/main/skills';
const SUPERPOWERS_SKILLS_BASE_URL = 'https://github.com/obra/superpowers/tree/main/skills';
const BAOYU_SKILLS_BASE_URL = 'https://github.com/JimLiu/baoyu-skills/tree/main/skills';
const BAOYU_RELEASE_SKILL_URL = 'https://github.com/JimLiu/baoyu-skills/tree/main/.claude/skills/release-skills';
const OPENAI_SKILLS_REPO_URL = 'https://github.com/openai/skills';
const NOTEBOOKLM_REPO_URL = 'https://github.com/teng-lin/notebooklm-py';
const NUTRIENT_MCP_REPO_URL = 'https://github.com/PSPDFKit/nutrient-dws-mcp-server';
const HERMES_AGENT_REPO_URL = 'https://github.com/NousResearch/hermes-agent';
const HERMES_AGENT_POWERPOINT_URL = 'https://skillsmp.com/zh/skills/nousresearch-hermes-agent-skills-productivity-powerpoint-skill-md';

const addSkillCommand = (url) => `npx add-skill ${url}`;
const addSkillsRepoCommand = (repo) => `npx skills add ${repo}`;
const multiLineCommand = (...lines) => lines.join('\n');

const BASE_SKILL_MODULES = [
    {
        id: 'claude-official',
        title: 'Claude官方',
        icon: 'fa-solid fa-robot',
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
                installCommand: 'npx skills add anthropics/skills --skill "claude-api" --yes',
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
                installCommand: 'npx skills add anthropics/skills --skill "frontend-design" --yes',
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
                installCommand: 'npx skills add anthropics/skills --skill "mcp-builder" --yes',
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
                installCommand: 'npx skills add anthropics/skills --skill "skill-creator" --yes',
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
                installCommand: 'npx skills add anthropics/skills --skill "webapp-testing" --yes',
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
                installCommand: 'npx skills add anthropics/skills --skill "web-artifacts-builder" --yes',
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
                installCommand: 'npx skills add anthropics/skills --skill "docx" --yes',
                installHint: '复制到终端安装后，Agent 在遇到 `.docx` 相关任务时，就能走对 Word 专项工作流。',
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
                installCommand: 'npx skills add anthropics/skills --skill "pdf" --yes',
                installHint: '复制到终端安装后，Agent 在遇到 PDF 相关任务时，就能走对 PDF 专项工作流。',
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
                installCommand: 'npx skills add anthropics/skills --skill "pptx" --yes',
                installHint: '复制到终端安装后，Agent 在遇到 `.pptx`、slides、presentation、deck 等任务时，就更容易走对 PowerPoint 专项工作流。',
                skillDocPurpose: 'Skills.md（有些仓库里也会写成 SKILL.md）主要是给 AI Agent 看的技能说明文件。它的作用是告诉 Agent：什么时候应该调用这个 pptx Skill、先读哪些辅助文档、优先走哪套 PowerPoint 工作流，以及在读写 `.pptx` 时要遵守哪些边界。对 pptx 这种强流程型 Skill 来说，Skills.md 的价值就在于让 Agent 不只是“会生成内容”，而是知道该怎么正确读取、编辑、生成并校验演示文稿。',
                relatedSlugs: ['baoyu-slide-deck', 'investor-materials']
            },
            {
                name: 'powerpoint',
                slug: 'powerpoint',
                headline: '偏重读取、分析和批量改稿的 PowerPoint 工作流，适合直接处理现有 `.pptx`，并保留讲者备注与整套幻灯结构。',
                scenario: '适合复盘现有 deck、抽取讲稿、批量替换文案、整理 speaker notes，或把已有 PowerPoint 重新组织成可继续编辑的版本。',
                overview: '这个 Skill 更像一个“PowerPoint 深加工入口”，重点不是从零做一套新 PPT，而是围绕现有 `.pptx` 做提取、分析、批量修改和结构整理。结合上游文档里对 `python-pptx` 与 speaker notes 的强调，它特别适合你已经拿到演示稿文件，需要快速读出每页内容、备注和结构，再继续重写或重排的场景。',
                useCases: ['读取现有 `.pptx` 的标题、正文和讲者备注', '批量改写演示稿中的文案与页序', '把现有 deck 提炼成结构提纲或会议讲稿', '从演示文稿中抽取表格、图片占位和页面信息', '为已有 PPT 做信息重组，而不是从零生成'],
                gettingStarted: ['先明确你是要“读内容”、还是要“改稿”，这会直接影响处理路径', '如果手里已经有 `.pptx` 文件，先抽取每页标题、正文和备注，快速确认结构', '开始批量改动前，先定义哪些内容必须保留，例如页序、品牌页、备注或固定结论页'],
                installCommand: addSkillsRepoCommand('NousResearch/hermes-agent'),
                installHint: 'SkillsMP 页面给出的安装入口是整仓安装 `NousResearch/hermes-agent`。装完之后，再按 `powerpoint` 相关指令进入 PowerPoint 专项流程。',
                skillDocPurpose: '这个 Skill 的说明文件更像一张 PowerPoint 处理路线图：它会把任务识别成“读取现有 deck / 提取 speaker notes / 批量编辑演示稿”的文档型工作，而不是泛泛地生成几页新 PPT。它的价值在于让 Agent 优先用对 `.pptx` 和备注结构的处理方式，再去做内容改写。',
                relatedSlugs: ['pptx', 'docx', 'investor-materials'],
                sourceUrl: HERMES_AGENT_POWERPOINT_URL,
                sourceLabel: 'SkillsMP'
            },
            {
                name: 'xlsx',
                slug: 'xlsx',
                headline: '围绕 `.xlsx` 的创建、清洗、公式写入、格式整理与多表协作输出，让表格保持可继续编辑而不是一次性结果。',
                scenario: '适合财务表、运营表、清单整理、数据补列、格式清洗，以及需要输出正式 Excel 文件的任务。',
                overview: '这个 Skill 的核心价值是：它不会把 Excel 当成“算完就写死”的静态结果，而是优先保留表格的可编辑性和可继续协作性。它适合创建新的 Excel、修改已有工作簿、补公式、清洗脏数据、调整格式和多 sheet 结构，也适合处理 `.csv/.tsv` 到 `.xlsx` 的整理链路。',
                useCases: ['创建新的 Excel 工作簿', '编辑现有 `.xlsx` 的数据和格式', '用公式而不是硬编码值生成结果', '清洗脏数据并输出可继续协作的表格', '整理多 sheet 的财务或运营文件'],
                gettingStarted: ['先确定主表头、主键列和最终交付格式', '如果有计算逻辑，优先写 Excel 公式而不是把结果硬编码进去', '输出后记得做一次公式重算与错误检查，避免把 `#REF!` 一类错误带出去'],
                installCommand: 'npx skills add anthropics/skills --skill "xlsx" --yes',
                installHint: '复制到终端安装后，Agent 在遇到 Excel 相关任务时，就能走对 xlsx 专项工作流。',
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
        icon: 'fa-solid fa-plug',
        tone: 'sky',
        description: '把常用 MCP Server 集中收纳，适合从仓库、文档、浏览器到自动化流程的一站式扩展。',
        itemLabel: 'MCP',
        skills: [
            {
                name: 'GitHub MCP Server',
                slug: 'github-mcp',
                detailType: 'mcp',
                headline: '让 AI 直接读取仓库、Issue、PR 和 Actions，把 GitHub 从网页变成可调用工作台。',
                cardHeadline: '直接读仓库、PR、Issue 和 Actions。',
                scenario: '适合代码检索、PR 评审、Issue 跟进、发布排查和日常研发协作。',
                cardScenario: '适合研发协作、代码检索和发布排查。',
                overview: 'GitHub 官方 MCP Server 是最值得优先接入的一类开发型 MCP。它让 AI 不必在聊天窗口和 GitHub 网页之间来回切，而是能直接查仓库结构、读文件、看提交、追 PR 线程、汇总 CI 状态。对开发者来说，它通常是最容易立刻提升效率的一类接入。',
                useCases: ['快速汇总某个仓库最近的 PR 和提交', '让 AI 直接回答仓库结构、文件位置和代码上下文问题', '查看 GitHub Actions 失败原因并定位关联改动', '整理 Issue 状态、待办优先级和版本发布情况'],
                gettingStarted: ['先准备 GitHub Token，并确认权限只覆盖你要访问的仓库范围', '把远程 MCP 地址和鉴权 Header 写进客户端配置文件', '第一轮先用只读场景试跑，比如查 PR、搜代码、看 CI，再决定是否开放更强权限'],
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
                installHint: 'GitHub 官方仓库同时支持远程服务和 Docker 部署。这里保留的是最适合大多数 MCP 客户端的远程接入模板。',
                mcpConfigPurpose: '这段配置会把 GitHub 官方远程 MCP Server 注册到你的客户端里，并通过 Bearer Token 完成鉴权。生效后，AI 才能读取仓库、PR、Issue、提交记录和工作流状态。',
                relatedSlugs: ['git-mcp', 'semgrep-mcp', 'playwright-mcp'],
                sourceUrl: 'https://github.com/github/github-mcp-server'
            },
            {
                name: 'Git MCP',
                slug: 'git-mcp',
                detailType: 'mcp',
                headline: '让 AI 直接读取本地 Git 仓库历史、差异和结构，适合不联网也要做代码分析的场景。',
                cardHeadline: '直接读本地 Git 历史、diff 和分支。',
                scenario: '适合本地仓库分析、提交历史梳理、diff 解释、改动回溯和离线协作。',
                cardScenario: '适合本地仓库分析、改动回溯和离线协作。',
                overview: '如果 GitHub MCP 更像“云端协作入口”，Git MCP 则是面向本地仓库的基础能力层。它适合你不想把工作流建立在托管平台之上，而是希望 AI 直接在当前机器上读提交历史、比较 diff、理解分支和仓库结构时使用。',
                useCases: ['解释某段 diff 到底改了什么', '回看某个文件最近几次提交的演变过程', '让 AI 比较两个分支或提交的差别', '离线状态下继续做仓库分析和代码问答'],
                gettingStarted: ['先确认客户端所在机器能够访问目标仓库路径', '把仓库绝对路径写进 `--repository` 参数', '首次建议从只读问题开始，比如读日志、看 diff、查文件历史，避免一上来就做高风险操作'],
                installCommand: `{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/ABSOLUTE/PATH/TO/REPO"]
    }
  }
}`,
                installHint: '官方参考实现还支持 Docker 和 pip。这里给的是最轻量的 `uvx` 方式，适合快速把本地仓库接进客户端。',
                mcpConfigPurpose: '这段配置会通过 `uvx` 启动官方 Git MCP，并把它绑定到指定仓库路径。之后 AI 就能在本地直接读取 Git 历史、差异和仓库上下文。',
                relatedSlugs: ['github-mcp', 'desktop-commander-mcp', 'semgrep-mcp'],
                sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git'
            },
            {
                name: 'Filesystem MCP',
                slug: 'filesystem-mcp',
                detailType: 'mcp',
                headline: '把本地工作目录直接接进 AI，适合文件读取、资料整理、批量改文档和项目目录级处理。',
                cardHeadline: '先把工作目录接进 AI，再让它真正处理文件。',
                scenario: '适合本地文件整理、周报汇总、批量改文档、目录检索和项目资料收纳。',
                cardScenario: '适合本地文件整理和目录级批量处理。',
                overview: 'Filesystem MCP 的核心价值很直接：它让 AI 不再只是告诉你“下一步该打开哪个文件”，而是能在受控目录内直接读取和处理文件。对于需要整理文档、汇总资料、生成草稿或批量改文本的人来说，这是最容易感受到“AI 真在干活”的 MCP 之一。',
                useCases: ['读取工作目录里的多份文档并汇总', '批量整理 Markdown、TXT 或配置文件', '围绕一个项目目录做资料检索和归类', '把分散文件内容汇总成新的说明稿或报告'],
                gettingStarted: ['先只开放一个工作目录，不要第一次就给整块磁盘权限', '把目标路径写进 MCP 配置后，用几份真实文档先试读和汇总', '第一次尽量让 AI 先生成新文件或草稿，不直接覆盖原文件'],
                installCommand: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/ABSOLUTE/PATH/TO/WORKSPACE"]
    }
  }
}`,
                installHint: '官方 filesystem server 最关键的是把允许访问的目录路径写清楚。第一次建议只放一个工作目录，安全边界会更明确。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动官方 Filesystem MCP，并把允许访问的工作目录传给服务。生效后，AI 才能在这个范围内读取和处理本地文件。',
                relatedSlugs: ['pdf-reader-mcp', 'mermaid-mcp', 'free-web-search-mcp'],
                sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem'
            },
            {
                name: 'PDF Reader MCP',
                slug: 'pdf-reader-mcp',
                detailType: 'mcp',
                headline: '专门把 PDF 变成可提取、可总结、可继续处理的内容输入，适合长文档、报告和扫描件场景。',
                cardHeadline: '先把 PDF 读懂，再交给 AI 继续整理。',
                scenario: '适合合同、报告、方案、扫描件、研究材料和任何“难复制但必须快速读懂”的 PDF 文档。',
                cardScenario: '适合长 PDF、扫描件和重点提取任务。',
                overview: 'PDF Reader MCP 的价值在于把“人工翻 PDF”这件事变成结构化处理流程。你不需要自己一页页找重点，而是可以直接让 AI 先读内容、做摘要、抽结构，再接到后续整理或汇报流程里。',
                useCases: ['提取 PDF 核心内容并生成摘要', '把长文档整理成结构化提纲', '快速抓取合同、报告或方案里的重点段落', '把 PDF 内容转成后续流程图或汇报材料的输入'],
                gettingStarted: ['先挑 1 到 2 份真实 PDF 做样本测试，确认提取质量', '第一次建议先做“摘要 + 提纲”这类最稳的任务', '如果结果符合预期，再继续扩到表格抽取、流程整理或批量处理'],
                installCommand: `{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@sylphx/pdf-reader-mcp"]
    }
  }
}`,
                installHint: '这个项目主打“先把 PDF 读快、读对、读结构化”。如果你想先最低成本体验 PDF MCP，这个 `npx` 配置是最直接的起点。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动 PDF Reader MCP，让客户端获得 PDF 读取、解析和结构化提取能力，适合把 PDF 变成 AI 可继续处理的输入。',
                relatedSlugs: ['filesystem-mcp', 'mermaid-mcp', 'free-web-search-mcp'],
                sourceUrl: 'https://github.com/SylphxAI/pdf-reader-mcp'
            },
            {
                name: 'Playwright MCP Server',
                slug: 'playwright-mcp',
                detailType: 'mcp',
                headline: '让 AI 真正控制浏览器完成点击、输入、跳转、等待和截图，适合网页自动化与回归验证。',
                cardHeadline: '控制浏览器跑点击、输入和截图流程。',
                scenario: '适合前端测试、页面巡检、登录流程复现、表单自动化和动态页面抓取。',
                cardScenario: '适合前端测试、登录复现和页面巡检。',
                overview: 'Playwright MCP 是浏览器自动化里最稳的一类选择，尤其适合你希望 AI 不只是“看页面”，而是亲自执行一段真实交互流程。它对调试交互 bug、自动跑回归、抓动态页面状态都很有帮助。',
                useCases: ['执行完整网页交互流程并检查结果', '自动化登录、表单填写和页面跳转', '抓取动态渲染内容和页面截图', '复现线上问题并记录操作步骤'],
                gettingStarted: ['本地先准备 Node 环境，如果第一次跑 Playwright 记得补装浏览器依赖', '把 MCP Server 注册到客户端配置中并重启客户端', '先从最短流程试跑，例如打开页面、点击按钮、检查文本，再逐步增加复杂度'],
                installCommand: `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}`,
                installHint: '这是微软官方仓库给出的标准接入方式之一，适合 Claude Desktop、Cursor、Codex 等常见 MCP 客户端。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动 Playwright MCP Server。生效后，AI 就能调用浏览器自动化能力，执行点击、输入、等待、截图和状态检查。',
                relatedSlugs: ['filesystem-mcp', 'free-web-search-mcp', 'mermaid-mcp'],
                sourceUrl: 'https://github.com/microsoft/playwright-mcp'
            },
            {
                name: 'Mermaid MCP Server',
                slug: 'mermaid-mcp',
                detailType: 'mcp',
                headline: '把流程、结构和步骤说明直接转成图，适合 SOP、业务流程、系统结构和汇报表达。',
                cardHeadline: '把文字流程直接变成可复用的流程图。',
                scenario: '适合业务流程图、工作 SOP、系统结构、任务拆解和需要可视化表达的说明场景。',
                cardScenario: '适合流程表达、SOP 和结构图说明。',
                overview: 'Mermaid MCP 的实用点不在“它会画图”，而在于它把图形生成变成了可迭代的工作流。你只要给出步骤、结构或节点关系，AI 就能快速生成流程图，并且很容易继续修改、重画和复用。',
                useCases: ['把流程描述转成流程图', '将 SOP 或项目步骤可视化', '把系统结构和依赖关系画成图', '把文档中的步骤整理成更直观的表达'],
                gettingStarted: ['先拿一个结构简单的流程试跑，确认节点和箭头方向都正确', '如果是从文档里提流程，先让 AI 提炼步骤，再交给 Mermaid 生成图', '第一次先追求结构清晰，再逐步加入主题风格和细节优化'],
                installCommand: `{
  "mcpServers": {
    "mermaid": {
      "command": "npx",
      "args": ["-y", "@peng-shawn/mermaid-mcp-server"]
    }
  }
}`,
                installHint: '这是 README 里给出的 Claude Desktop 标准接法之一。装好以后，AI 就能把 Mermaid 代码直接生成成 PNG 或 SVG 图形。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动 Mermaid MCP Server，让 AI 具备流程图和结构图生成能力，适合把抽象步骤变成可视化产物。',
                relatedSlugs: ['pdf-reader-mcp', 'filesystem-mcp', 'playwright-mcp'],
                sourceUrl: 'https://github.com/peng-shawn/mermaid-mcp-server'
            },
            {
                name: 'Browserbase MCP',
                slug: 'browserbase-mcp',
                detailType: 'mcp',
                headline: '把云端浏览器接进 MCP，减少本机环境依赖，适合长流程网页操作和更稳定的远程自动化。',
                cardHeadline: '用云端浏览器做更稳的网页自动化。',
                scenario: '适合网页抓取、云端自动化、反复跑流程、无本地浏览器环境的团队或个人。',
                cardScenario: '适合长流程网页操作和团队共享环境。',
                overview: 'Browserbase MCP 的优势在于把浏览器执行环境搬到云端，减少你对本机浏览器、驱动和环境差异的依赖。对于需要长期稳定跑网页操作、或者想把浏览器能力接入团队型工作流的人，它比完全本地方案更容易标准化。',
                useCases: ['在云端执行网页自动化而不是依赖本机浏览器', '跑需要稳定环境的长流程网页操作', '让多人共享同一套浏览器自动化能力', '降低本机环境不一致导致的失败概率'],
                gettingStarted: ['如果客户端支持 HTTP 型 MCP，优先走官方 hosted URL，接入最轻', '如果客户端不支持 HTTP，可以使用 `mcp-remote` 做桥接', '后续需要自托管或自定义模型时，再切换到 Browserbase 的本地/自托管方案'],
                installCommand: `{
  "mcpServers": {
    "browserbase": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.browserbase.com/mcp"]
    }
  }
}`,
                installHint: 'Browserbase 官方同时提供 hosted MCP 和自托管模式。这里给的是兼容面更广的 hosted 远程桥接方式。',
                mcpConfigPurpose: '这段配置会用 `mcp-remote` 把 Browserbase 官方 hosted MCP 服务接进客户端，让 AI 能通过云端浏览器执行网页交互和抓取任务。',
                relatedSlugs: ['playwright-mcp', 'firecrawl-mcp', 'apify-actors-mcp'],
                sourceUrl: 'https://github.com/browserbase/mcp-server-browserbase'
            },
            {
                name: 'Firecrawl MCP',
                slug: 'firecrawl-mcp',
                detailType: 'mcp',
                headline: '专注网页抓取与内容提取，适合把复杂网页、动态内容和批量 URL 变成可用文本数据。',
                cardHeadline: '把网页和 URL 直接提成可用文本数据。',
                scenario: '适合网页采集、搜索结果落地、文档转 Markdown、内容整理和 RAG 前置抓取。',
                cardScenario: '适合网页采集、文档转 Markdown 和 RAG 前置抓取。',
                overview: 'Firecrawl MCP 适合那些“需要网页内容，但不一定需要完整浏览器操作”的场景。它在抓内容、转 Markdown、处理动态渲染页面方面更直接，也更适合做资料整理、知识入库和批量抓取链路。',
                useCases: ['把网页转成 Markdown 或结构化内容', '抓取动态页面并交给 AI 继续总结', '批量采集文章、产品页和文档站内容', '给知识库、RAG 或研究流程补充网页材料'],
                gettingStarted: ['先申请 Firecrawl API Key 并确认额度', '把环境变量和命令写进 MCP 客户端配置', '第一轮建议先用一两个 URL 试跑，确认提取质量和输出格式符合你的使用场景'],
                installCommand: `{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-YOUR_API_KEY"
      }
    }
  }
}`,
                installHint: 'Firecrawl 官方同时支持 `npx`、全局安装和不同客户端的一键接入。这里保留的是最容易直接复制的本地模板。',
                mcpConfigPurpose: '这段配置会在本地通过 `npx` 启动 Firecrawl MCP，并把 API Key 注入环境变量。这样 AI 才能调用抓取、提取和网页转文本的能力。',
                relatedSlugs: ['fetch-mcp', 'playwright-mcp', 'free-web-search-mcp'],
                sourceUrl: 'https://github.com/mendableai/firecrawl-mcp-server'
            },
            {
                name: 'Fetch MCP Server',
                slug: 'fetch-mcp',
                detailType: 'mcp',
                headline: '官方参考实现里的轻量网页读取工具，适合先把 URL 内容稳定拿下来，再决定要不要上更重的抓取链路。',
                cardHeadline: '轻量读取 URL、网页和 JSON 内容。',
                scenario: '适合读单个网页、抓 API JSON、读取文档页面和做轻量内容采集。',
                cardScenario: '适合单页抓取、接口读取和轻量采集。',
                overview: 'Fetch MCP 不是最花哨的抓取工具，但它胜在简单、轻量、通用。很多时候你只是想把一个 URL 的 HTML、文本或 JSON 拿回来给 AI 用，并不需要完整浏览器自动化，这时它会比 Playwright 一类工具更省事。',
                useCases: ['读取单个网页内容并交给 AI 总结', '直接抓取 API 返回的 JSON', '快速试验某个文档页是否能被稳定获取', '把 URL 内容作为后续整理或分类的输入'],
                gettingStarted: ['先安装 `uv`，这样可以直接用 `uvx` 运行官方 fetch server', '把基础配置写进客户端后先试一个普通网页和一个 JSON 接口', '如果遇到复杂动态页面，再切换到 Firecrawl 或 Playwright 处理'],
                installCommand: `{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}`,
                installHint: '官方 fetch server 同时支持 `uvx`、pip 和 Docker。这里优先保留最轻量的 `uvx` 方式。',
                mcpConfigPurpose: '这段配置会通过 `uvx` 启动官方 fetch MCP，让客户端具备基础 URL 读取能力，适合获取网页内容、JSON 响应和轻量文本上下文。',
                relatedSlugs: ['firecrawl-mcp', 'free-web-search-mcp', 'notion-mcp'],
                sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch'
            },
            {
                name: 'Tavily 网络搜索',
                slug: 'free-web-search-mcp',
                detailType: 'mcp',
                headline: '用 Tavily 给 Claude Code 补上实时联网搜索能力，适合最新资料查询、事实核验和研究前的资料初筛。',
                cardHeadline: '给 Claude Code 补实时联网搜索能力。',
                scenario: '适合新闻检索、时效性问题查询、资料初筛和研究前的信息收集。',
                cardScenario: '适合实时搜索、资料初筛和事实核验。',
                overview: '这条 MCP 走的是 Tavily 官方 HTTP transport 接入方式。你只需要准备好 Tavily API Key，把命令执行一次，再重启 Claude Code，就能给客户端补上实时联网搜索能力。它的价值在于让 AI 先搜索、再整理，而不是继续只靠模型记忆回答带时间性的问题。',
                useCases: ['给 Claude Code 增加实时联网搜索能力', '搜索最近一周的新闻和行业动态', '回答事实型问题前先做来源初筛', '做轻量研究或竞品调研前先拉资料'],
                gettingStarted: ['先打开 <a href="https://app.tavily.com/home" target="_blank" rel="noreferrer">Tavily 官网控制台</a> 注册账号并获取 API Key', '执行添加命令时，把 `<your-api-key>` 替换成真实 Key', '重启 Claude Code 后，用 `/mcp` 确认 `tavily` 服务已经出现'],
                installCommand: 'claude mcp add --transport http tavily https://mcp.tavily.com/mcp/?tavilyApiKey=<your-api-key>',
                installHint: '这是用户文档里给出的直接可用命令。最重要的是把 `<your-api-key>` 换成你自己的 Tavily Key，然后重启 Claude Code。',
                mcpConfigPurpose: '这条命令会把 Tavily MCP 通过 HTTP transport 注册到 Claude Code，让客户端具备实时联网搜索能力，适合搜索最新资料、做来源初筛和回答带时间性的事实问题。',
                relatedSlugs: ['filesystem-mcp', 'pdf-reader-mcp', 'playwright-mcp'],
                sourceUrl: 'https://github.com/tavily-ai/tavily-mcp',
                sourceLabel: 'GitHub'
            },
            {
                name: 'Notion MCP',
                slug: 'notion-mcp',
                detailType: 'mcp',
                headline: '把 Notion 页面和数据库接进 AI 工作流，适合知识库检索、文档管理和任务状态更新。',
                cardHeadline: '把 Notion 页面和数据库接进 AI。',
                scenario: '适合团队文档、项目 wiki、数据库记录整理和知识协作场景。',
                cardScenario: '适合知识库检索、文档管理和任务协作。',
                overview: 'Notion MCP 的实用价值非常直观: 你不需要再把页面内容复制到聊天窗口，也不需要先手动点开数据库再描述给 AI。配置完成后，AI 可以直接读页面、查数据库、组织信息，让 Notion 真正变成工作流的一部分。',
                useCases: ['搜索和读取 Notion 页面内容', '查询、整理和更新数据库记录', '围绕项目 wiki、会议纪要和任务状态做问答', '把团队知识库接进写作、总结和执行流程'],
                gettingStarted: ['先在 Notion 后台创建集成，并把目标页面或数据库授权给它', '推荐优先使用官方 `NOTION_TOKEN` 方案接入客户端', '第一轮先用只读问题试跑，确认权限边界和返回结构都正常'],
                installCommand: `{
  "mcpServers": {
    "notionApi": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "ntn_****"
      }
    }
  }
}`,
                installHint: 'Notion 官方仓库支持 OAuth、Docker 和 npm。这里保留的是最适合 Claude Desktop、Cursor 一类客户端的 npm 模板。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动 Notion 官方 MCP Server，并用 `NOTION_TOKEN` 完成鉴权。之后 AI 就能直接读取和处理授权范围内的页面与数据库。',
                relatedSlugs: ['mem0-mcp', 'fetch-mcp', 'github-mcp'],
                sourceUrl: 'https://github.com/makenotion/notion-mcp-server'
            },
            {
                name: 'Mem0 MCP',
                slug: 'mem0-mcp',
                detailType: 'mcp',
                headline: '给 AI 增加长期记忆层，适合保存偏好、上下文和跨会话知识，而不是每次都重新解释。',
                cardHeadline: '给 AI 加一层长期记忆和偏好存储。',
                scenario: '适合长期协作、个性化助手、偏好记忆、知识复用和连续任务工作流。',
                cardScenario: '适合长期协作、偏好记忆和连续任务。',
                overview: 'Mem0 MCP 的关键不是“多一个数据库”，而是让 AI 能在多次会话中记住真正重要的事实，例如你的写作偏好、项目规则、常用流程和个体习惯。对于想把 AI 从单次问答升级成长期搭档的人来说，它很有价值。',
                useCases: ['记住用户偏好、工作习惯和项目约束', '跨会话复用长期上下文', '为助手建立可搜索的记忆层', '减少重复解释背景和规则的成本'],
                gettingStarted: ['先申请 Mem0 API Key，并决定默认 user id 怎么组织', '把最小配置加进客户端后先试几条低风险记忆', '建立记忆策略，避免把一次性噪音内容也长期存进去'],
                installCommand: `{
  "mcpServers": {
    "mem0": {
      "command": "uvx",
      "args": ["mem0-mcp-server"],
      "env": {
        "MEM0_API_KEY": "m0-...",
        "MEM0_DEFAULT_USER_ID": "your-handle"
      }
    }
  }
}`,
                installHint: 'Mem0 官方 README 推荐本地客户端用 `uvx` 直接拉起服务，这样接入最轻、维护成本也低。',
                mcpConfigPurpose: '这段配置会通过 `uvx` 启动 Mem0 MCP，并注入 API Key 和默认用户标识。这样 AI 就能把长期记忆安全地写入和取回，而不是每轮都从零开始。',
                relatedSlugs: ['notion-mcp', 'sequential-thinking-mcp', 'desktop-commander-mcp'],
                sourceUrl: 'https://github.com/mem0ai/mem0-mcp'
            },
            {
                name: 'Desktop Commander MCP',
                slug: 'desktop-commander-mcp',
                detailType: 'mcp',
                headline: '把文件、搜索、文本编辑和程序控制接进 MCP，是非常适合本地生产力场景的万能入口。',
                cardHeadline: '文件、搜索、编辑和程序控制一把抓。',
                scenario: '适合本地文件处理、目录搜索、文本修改、程序控制和桌面级协作任务。',
                cardScenario: '适合本地文件处理和桌面级协作。',
                overview: 'Desktop Commander MCP 的优势在于“覆盖面大且很接地气”。很多人第一次真正感受到 MCP 的威力，往往就是从它这类文件与桌面工具开始，因为它能把读写文件、查找文本、管理程序这些真实动作直接交给 AI。',
                useCases: ['让 AI 直接查找和编辑本地文本文件', '跨目录搜索资料、日志和代码片段', '配合本地桌面环境做半自动执行流程', '减少来回复制内容和手动找文件的时间'],
                gettingStarted: ['如果你只是想快速接入，优先用 README 里的 `npx setup` 自动配置方式', '如果你更想自己控制配置，可直接手动把 MCP JSON 写入 Claude Desktop 或 Cursor', '第一轮先限制在常用工作目录内使用，避免 AI 获得过大的文件访问范围'],
                installCommand: `{
  "mcpServers": {
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander@latest"]
    }
  }
}`,
                installHint: '这个项目本身还提供自动安装脚本、Docker 隔离和专门的桌面应用。这里保留的是最适合先快速试起来的手动配置模板。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动 Desktop Commander MCP，让 AI 获得文件读取、搜索、文本编辑和部分桌面级控制能力，适合本地生产力场景。',
                relatedSlugs: ['git-mcp', 'notion-mcp', 'anyquery-mcp'],
                sourceUrl: 'https://github.com/wonderwhy-er/DesktopCommanderMCP'
            },
            {
                name: 'Jupyter Notebook MCP',
                slug: 'jupyter-notebook-mcp',
                detailType: 'mcp',
                headline: '把 Jupyter Notebook 接进 Claude 或其它客户端，适合数据分析、实验和可视化任务。',
                cardHeadline: '让 AI 直接进入 Jupyter Notebook 工作流。',
                scenario: '适合数据探索、Python 实验、图表绘制、Notebook 协作和分析报告原型。',
                cardScenario: '适合数据分析、实验和图表可视化。',
                overview: '如果你的工作经常落到 Notebook 里，Jupyter Notebook MCP 会非常实用。它让 AI 不只是解释代码，而是直接进入 Notebook 工作流里执行、分析和可视化，特别适合数据分析、研究实验和原型验证。',
                useCases: ['让 AI 直接驱动 Notebook 做分析', '在数据探索时快速执行代码和画图', '围绕实验过程生成解释和结论', '把 Notebook 变成交互式分析工作台'],
                gettingStarted: ['先按仓库说明用 `uv` 建好环境，并安装 `jupyter-mcp` 内核', '把配置里的目录替换成你本机真实的 `src` 路径', '首次建议从一个简单 Notebook 开始，例如读取 CSV、做统计和画图，先确认链路跑通'],
                installCommand: `{
  "mcpServers": {
    "jupyter": {
      "command": "uv",
      "args": [
        "--directory",
        "/ABSOLUTE/PATH/TO/PARENT/REPO/FOLDER/src",
        "run",
        "jupyter_mcp_server.py"
      ]
    }
  }
}`,
                installHint: '这个仓库的接入方式和一般 `npx` 型 MCP 不同，核心是先把 `uv` 环境和 Notebook 内核准备好，再把本地脚本接进客户端。',
                mcpConfigPurpose: '这段配置会让客户端通过 `uv` 在指定目录下运行 Jupyter MCP 服务脚本。配置生效后，AI 就能与本地 Notebook 环境交互并执行分析流程。',
                relatedSlugs: ['anyquery-mcp', 'fetch-mcp', 'semgrep-mcp'],
                sourceUrl: 'https://github.com/jjsantos01/jupyter-notebook-mcp'
            },
            {
                name: 'Anyquery MCP',
                slug: 'anyquery-mcp',
                detailType: 'mcp',
                headline: '用 SQL 统一查询数据库和多种应用数据源，适合把分散业务信息集中到一个分析入口里。',
                cardHeadline: '用 SQL 统一查数据库和多种业务数据。',
                scenario: '适合数据库查询、跨应用检索、轻量 BI、数据联查和本地优先的数据分析工作流。',
                cardScenario: '适合跨源查询、轻量 BI 和本地数据分析。',
                overview: 'Anyquery 的亮点是把很多原本分散在不同工具里的数据查询动作统一成 SQL 体验。对于喜欢结构化分析、又不想每次都切不同后台的人来说，它比只做单点 API 集成更高效。',
                useCases: ['通过 SQL 查询数据库和第三方应用数据', '把多来源数据统一到一个分析入口', '给 AI 提供结构化业务查询能力', '快速试验某些轻量 BI 或运营分析需求'],
                gettingStarted: ['先用 Homebrew、APT 或直接下载二进制方式装好 `anyquery`', '在终端先执行一次 `anyquery mcp --stdio` 确认可正常启动', '再把命令写进 MCP 客户端配置，并根据实际需要安装对应插件或连接数据库'],
                installCommand: `{
  "mcpServers": {
    "anyquery": {
      "command": "anyquery",
      "args": ["mcp", "--stdio"]
    }
  }
}`,
                installHint: '这个项目本体是一个独立命令行工具，所以要先把 `anyquery` 安装到系统里，再让客户端去拉起它的 MCP 子命令。',
                mcpConfigPurpose: '这段配置会调用 `anyquery mcp --stdio` 启动 MCP 服务，让 AI 能通过 Anyquery 的数据连接层访问数据库和插件生态中的结构化数据。',
                relatedSlugs: ['jupyter-notebook-mcp', 'desktop-commander-mcp', 'fetch-mcp'],
                sourceUrl: 'https://github.com/julien040/anyquery'
            },
            {
                name: 'Semgrep MCP',
                slug: 'semgrep-mcp',
                detailType: 'mcp',
                headline: '把代码安全扫描和规则匹配能力接进 AI，适合在开发流程中更早发现安全问题。',
                cardHeadline: '把代码安全扫描直接接进 AI 评审流。',
                scenario: '适合安全审查、代码扫描、规则匹配、PR 风险排查和工程治理。',
                cardScenario: '适合安全审查、PR 风险排查和工程治理。',
                overview: 'Semgrep MCP 的价值在于把“安全扫描”这件事从独立平台变成可直接调用的能力。这样 AI 在评审代码、检查改动或解释风险时，不只是给经验判断，还能借助规则扫描结果做更实在的判断。',
                useCases: ['在改动前后做安全规则扫描', '让 AI 结合扫描结果解释潜在漏洞', '在 PR 评审中提前发现高风险模式', '把代码治理和安全检查纳入日常工作流'],
                gettingStarted: ['本地优先可以先用 `uvx semgrep-mcp` 跑起来', '第一次建议先对一个小仓库或单目录试扫，避免输出量过大', '把扫描结果和 GitHub / Git MCP 联动，会更适合做代码评审和修复闭环'],
                installCommand: `{
  "mcpServers": {
    "semgrep": {
      "command": "uvx",
      "args": ["semgrep-mcp"]
    }
  }
}`,
                installHint: 'Semgrep 官方同时提供本地 `uvx`、Docker 和远程 `semgrep.ai` 方式。这里保留的是本地最容易直接接入的写法。',
                mcpConfigPurpose: '这段配置会通过 `uvx` 启动 Semgrep MCP，让 AI 在对话里直接调用规则扫描和安全检查能力，而不只是根据经验猜测风险。',
                relatedSlugs: ['github-mcp', 'git-mcp', 'desktop-commander-mcp'],
                sourceUrl: 'https://github.com/semgrep/mcp'
            },
            {
                name: 'Sequential Thinking MCP',
                slug: 'sequential-thinking-mcp',
                detailType: 'mcp',
                headline: '为复杂问题提供可分步、可回看、可修正的思考链路，适合高复杂度任务。',
                cardHeadline: '给复杂问题一条可回看的分步思考链。',
                scenario: '适合复杂推理、方案拆解、调试分析、多阶段规划和需要反思修正的任务。',
                cardScenario: '适合复杂推理、调试分析和多阶段规划。',
                overview: 'Sequential Thinking 虽然不是连接外部数据源的 MCP，但它非常实用，因为它强化的是“如何思考复杂问题”。在模型容易跳结论、丢步骤的场景下，它能帮助代理按步骤展开、修正和反思，特别适合复杂工程任务和疑难排查。',
                useCases: ['拆解复杂问题并形成更稳定的推理过程', '让 AI 按阶段推进调试或分析任务', '为多步骤规划提供可回看的思考轨迹', '减少复杂任务里一步跳太快导致的误判'],
                gettingStarted: ['先把它当作“高复杂度任务专用工具”，不要所有问题都默认走它', '第一次可以拿一个复杂 bug 或多阶段方案设计来试', '把它和 GitHub、Semgrep、Mem0 等工具搭配，效果通常比单独用更明显'],
                installCommand: `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}`,
                installHint: '这是官方参考实现 README 里的标准 `npx` 接入方式，适合先快速试起来。',
                mcpConfigPurpose: '这段配置会启动官方 Sequential Thinking MCP，让客户端在需要时调用分步推理与反思式问题解决能力，适合复杂任务而不是日常简单问答。',
                relatedSlugs: ['mem0-mcp', 'github-mcp', 'semgrep-mcp'],
                sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking'
            },
            {
                name: 'Apify Actors MCP Server',
                slug: 'apify-actors-mcp',
                detailType: 'mcp',
                headline: '把 Apify 平台上的抓取与自动化 Actor 接进 AI，适合电商、社媒和大规模网页数据采集。',
                cardHeadline: '直接复用 Apify Actor 做云端采集。',
                scenario: '适合批量抓取、云端采集、电商监测、社媒数据收集和现成 Actor 复用。',
                cardScenario: '适合批量抓取、电商监测和社媒采集。',
                overview: 'Apify Actors MCP 的优势不是某一个具体工具，而是它背后现成的 Actor 生态。很多抓取、电商、社媒、目录页采集需求，本来就已经有成熟 Actor 可以直接跑，所以你不一定要自己从零写抓取流程。',
                useCases: ['直接调用 Apify 现成 Actor 跑采集任务', '做电商页面、社媒内容或目录站批量抓取', '把云端抓取结果回流到研究或分析流程里', '减少自己维护爬虫和自动化脚本的成本'],
                gettingStarted: ['先申请 Apify Token，并在平台上挑一个最小可用的 Actor 试跑', '如果客户端支持远程服务，也可以考虑官方 hosted 端点；本页先保留 stdio 模板', '先从小规模抓取开始，确认返回数据结构适合你的后续流程'],
                installCommand: `{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["@apify/actors-mcp-server"],
      "env": {
        "APIFY_TOKEN": "YOUR_APIFY_TOKEN"
      }
    }
  }
}`,
                installHint: 'Apify 官方 README 同时推荐 hosted 端点和 stdio 两种方式。这里保留的是最通用的本地 `npx` 启动模板。',
                mcpConfigPurpose: '这段配置会通过 `npx` 启动 Apify Actors MCP，并注入 `APIFY_TOKEN`。配置完成后，AI 就能调用 Apify 平台上的 Actor 去执行云端抓取和自动化任务。',
                relatedSlugs: ['firecrawl-mcp', 'browserbase-mcp', 'free-web-search-mcp'],
                sourceUrl: 'https://github.com/apify/actors-mcp-server'
            }
        ]
    }
];

const ECC_SKILL_SLUGS = [
    'search-first',
    'continuous-learning-v2',
    'strategic-compact',
    'verification-loop',
    'frontend-patterns',
    'backend-patterns',
    'coding-standards',
    'market-research',
    'clickhouse-io',
    'postgres-patterns',
    'regex-vs-llm-structured-text',
    'content-hash-cache-pattern',
    'cost-aware-llm-pipeline',
    'content-engine',
    'article-writing',
    'investor-outreach',
    'investor-materials',
    'deployment-patterns',
    'docker-patterns',
    'security-scan',
    'security-review'
];

const SUPERPOWERS_SKILL_SLUGS = [
    'brainstorming',
    'dispatching-parallel-agents',
    'systematic-debugging',
    'subagent-driven-development',
    'requesting-code-review',
    'verification-before-completion'
];

const BAOYU_SKILL_SLUGS = [
    'baoyu-cover-image',
    'baoyu-image-gen',
    'baoyu-infographic',
    'baoyu-slide-deck',
    'baoyu-post-to-wechat',
    'baoyu-post-to-x'
];

const ECC_INSTALL_HINT = '这里给的是按单个 skill 目录安装的 GitHub 命令；如果你已经整仓安装 Everything Claude Code，也可以直接复用同名 skill。';
const SUPERPOWERS_INSTALL_HINT = '这里给的是只安装当前 superpowers skill 的 GitHub 目录命令；上游 README 同时支持整套 superpowers 工作流安装。';
const BAOYU_INSTALL_HINT = 'Baoyu 官方 README 推荐先整仓安装 `jimliu/baoyu-skills`，装完后直接调用对应的 `/skill-name` 命令即可。';

const SKILL_DETAIL_OVERRIDES = {
    ...Object.fromEntries(
        ECC_SKILL_SLUGS.map((slug) => [
            slug,
            {
                installCommand: addSkillCommand(`${ECC_SKILLS_BASE_URL}/${slug}`),
                installHint: ECC_INSTALL_HINT,
                sourceUrl: `${ECC_SKILLS_BASE_URL}/${slug}`
            }
        ])
    ),
    ...Object.fromEntries(
        SUPERPOWERS_SKILL_SLUGS.map((slug) => [
            slug,
            {
                installCommand: addSkillCommand(`${SUPERPOWERS_SKILLS_BASE_URL}/${slug}`),
                installHint: SUPERPOWERS_INSTALL_HINT,
                sourceUrl: `${SUPERPOWERS_SKILLS_BASE_URL}/${slug}`
            }
        ])
    ),
    ...Object.fromEntries(
        BAOYU_SKILL_SLUGS.map((slug) => [
            slug,
            {
                installCommand: addSkillsRepoCommand('jimliu/baoyu-skills'),
                installHint: BAOYU_INSTALL_HINT,
                sourceUrl: `${BAOYU_SKILLS_BASE_URL}/${slug}`
            }
        ])
    ),
    docx: {
        installCommand: 'npx skills add anthropics/skills --skill "docx" --yes',
        installHint: 'Anthropic 官方仓库已经把 docx 放进 document-skills。这里保留的是按单个 skill 安装的快捷命令。',
        sourceUrl: `${ANTHROPIC_SKILLS_BASE_URL}/docx`,
        screenshots: [
            { src: '/pic/skills/docx-install.png', caption: '安装 docx skill 及依赖' },
            { src: '/pic/skills/docx-output-1.png', caption: '生成带标题和表格的 Word 文档' },
            { src: '/pic/skills/docx-output-2.png', caption: '复杂排版效果：目录、页眉页脚和图片' }
        ],
        examplePrompt: '写一份《2026 全球 AI 演进报告》，使用的副标题是"小元所 3.0 生成"，输出成 word 文档。'
    },
    pdf: {
        installCommand: 'npx skills add anthropics/skills --skill "pdf" --yes',
        installHint: 'Anthropic 官方 document-skills 里已经包含这个 PDF skill；如果你只想取 PDF 能力，这条单 skill 命令最直接。',
        sourceUrl: `${ANTHROPIC_SKILLS_BASE_URL}/pdf`,
        screenshots: [
            { src: '/pic/skills/pdf-install.png', caption: '安装 PDF skill 及 pypdf、pdfplumber、reportlab 依赖' }
        ],
        examplePrompt: '帮我把 report1.pdf 和 report2.pdf 合并成一个文件，然后提取里面的表格数据导出到 Excel。'
    },
    pptx: {
        sourceUrl: `${ANTHROPIC_SKILLS_BASE_URL}/pptx`,
        screenshots: [
            { src: '/pic/skills/pptx-output.png', caption: '从零生成的演示文稿效果' }
        ],
        examplePrompt: '帮我基于这份市场调研材料，创建一个 5 页的幻灯片，配色用深蓝色主题，每页包含一个核心观点和配图。'
    },
    powerpoint: {
        installCommand: addSkillsRepoCommand('NousResearch/hermes-agent'),
        installHint: '上游 SkillsMP 页面展示的是整仓安装 `NousResearch/hermes-agent`；这个 PowerPoint skill 属于其中的 productivity 目录能力。',
        sourceUrl: HERMES_AGENT_POWERPOINT_URL,
        sourceLabel: 'SkillsMP',
        screenshots: [
            { src: '/pic/skills/powerpoint-01.webp', caption: 'PowerPoint Skill 实操截图 01' },
            { src: '/pic/skills/powerpoint-02.webp', caption: 'PowerPoint Skill 实操截图 02' },
            { src: '/pic/skills/powerpoint-03.webp', caption: 'PowerPoint Skill 实操截图 03' },
            { src: '/pic/skills/powerpoint-04.webp', caption: 'PowerPoint Skill 实操截图 04' },
            { src: '/pic/skills/powerpoint-05.webp', caption: 'PowerPoint Skill 实操截图 05' },
            { src: '/pic/skills/powerpoint-06.webp', caption: 'PowerPoint Skill 实操截图 06' },
            { src: '/pic/skills/powerpoint-07.webp', caption: 'PowerPoint Skill 实操截图 07' },
            { src: '/pic/skills/powerpoint-08.webp', caption: 'PowerPoint Skill 实操截图 08' },
            { src: '/pic/skills/powerpoint-09.webp', caption: 'PowerPoint Skill 实操截图 09' },
            { src: '/pic/skills/powerpoint-10.webp', caption: 'PowerPoint Skill 实操截图 10' }
        ],
        examplePrompt: '帮我读取这份 quarterly-review.pptx，按“页码 / 标题 / 关键结论 / speaker notes”输出结构化摘要，然后把语气改得更适合董事会汇报。'
    },
    xlsx: {
        installCommand: 'npx skills add anthropics/skills --skill "xlsx" --yes',
        installHint: 'Anthropic 官方仓库已经提供完整的 xlsx skill；这里保留的是按单 skill 安装的复制命令。',
        sourceUrl: `${ANTHROPIC_SKILLS_BASE_URL}/xlsx`,
        screenshots: [
            { src: '/pic/skills/xlsx-output.png', caption: '读取 Excel 数据并用公式计算统计分析结果' }
        ],
        examplePrompt: '读取 sales.xlsx 里的销售数据，做一个数据统计分析，用 Excel 公式计算各产品的销售总额和同比增长率，保存到新文件。'
    },
    'notebooklm-py': {
        overview: '这个页面对应的是 NotebookLM 的官方社区 skill + Python CLI 组合：先把 GitHub 上的 root skill 安装进 Agent，再补上 `notebooklm-py` 和 Chromium 依赖，之后就能把资料库、问答、播客、脑图、信息图和幻灯片生成串成一条本地工作流。',
        gettingStarted: ['先安装 root skill，再安装 `notebooklm-py` 浏览器依赖和 Chromium', '第一次运行前执行 `notebooklm login` 完成 Google 登录', '先创建 notebook 并导入资料，再决定要生成 audio、mind-map、infographic 还是 slide-deck'],
        installCommand: multiLineCommand(
            addSkillsRepoCommand('teng-lin/notebooklm-py'),
            'python3 -m pip install "notebooklm-py[browser]"',
            'npx playwright install chromium'
        ),
        installHint: '上游 README 推荐先通过 `npx skills add teng-lin/notebooklm-py` 安装 skill，再补齐 Python 包和 Chromium，CLI 与 Agent 工作流才会完整可用。',
        skillDocPurpose: '这个 Skill 的 SKILL.md 负责把 NotebookLM 的建库、问答和多媒体产物生成流程规范下来，让 Agent 知道什么时候该先登录、什么时候该先建 notebook、什么时候该下载播客、脑图、信息图或 PPTX。',
        sourceUrl: NOTEBOOKLM_REPO_URL
    },
    'release-skills': {
        installCommand: addSkillsRepoCommand('jimliu/baoyu-skills'),
        installHint: '这个 skill 在 `JimLiu/baoyu-skills` 的 `.claude/skills` 目录里。上游 README 推荐先安装整个仓库，然后直接运行 `/release-skills`。',
        sourceUrl: BAOYU_RELEASE_SKILL_URL
    },
    'nutrient-document-processing': {
        sourceUrl: NUTRIENT_MCP_REPO_URL
    },
    doc: {
        overview: '这个页面对应的是偏“版式验收”的文档 skill：重点不是继续写内容，而是在 Word 交付前把分页、表格、图片和整体观感真正渲染出来检查一遍，避免只看文本结果就误判文档已经可交付。',
        installCommand: multiLineCommand(
            'npm install -g @openai/codex@latest',
            'python3 -m pip install python-docx pdf2image'
        ),
        installHint: '`doc` 更接近 Codex 自带的文档工作流。安装最新版 Codex 后，再补 `python-docx` 和 `pdf2image`，就能做本地 `.docx` 视觉校验。',
        skillDocPurpose: '这个 skill 的 SKILL.md 重点是把“先渲染再验收”的流程固定下来，让 Agent 在正式交付前优先检查标题层级、分页、表格宽度和图片位置，而不是只根据文本判断 Word 是否合格。',
        sourceUrl: OPENAI_SKILLS_REPO_URL
    },
    speech: {
        overview: '这个 skill 聚焦 OpenAI Audio API 的可复用朗读流程：先把文本定稿，再用内置 CLI 统一处理 voice、style、输出格式和批量任务，而不是每次都临时拼一段 TTS 命令。',
        gettingStarted: ['先安装或升级 Codex，再补上 OpenAI Python SDK', '准备最终定稿文本，避免边生成边改内容', '先用一个短片段试听 voice 和 style，再决定是否批量生成整套音频'],
        installCommand: multiLineCommand(
            'npm install -g @openai/codex@latest',
            'python3 -m pip install openai'
        ),
        installHint: '`speech` 属于 Codex 的系统级语音工作流；升级到最新版 Codex 后，再补 OpenAI Python SDK，就能直接调用 bundled CLI 来批量生成音频。',
        skillDocPurpose: '这个 skill 的 SKILL.md 主要在规范 TTS 的输入收集、单条/批量模式选择、CLI 调用方式和试听校验步骤，避免 Agent 每次都重新组织一遍语音生成流程。',
        sourceUrl: OPENAI_SKILLS_REPO_URL
    },
    'search-first': {
        installCommand: addSkillCommand(`${ECC_SKILLS_BASE_URL}/search-first`),
        installHint: ECC_INSTALL_HINT,
        sourceUrl: `${ECC_SKILLS_BASE_URL}/search-first`,
        screenshots: [
            { src: '/pic/skills/search-first-output.png', caption: 'Search First 搜索结果输出' }
        ],
        examplePrompt: '我想下载 YouTube 视频，帮我先搜索一下现有的开源库和方案，再决定是自己写还是直接用现成的。'
    },
    'market-research': {
        installCommand: addSkillCommand(`${ECC_SKILLS_BASE_URL}/market-research`),
        installHint: ECC_INSTALL_HINT,
        sourceUrl: `${ECC_SKILLS_BASE_URL}/market-research`,
        screenshots: [
            { src: '/pic/skills/market-research-output.webp', caption: '市场调研 Skill 实操截图：新能源汽车市场研究报告' }
        ],
        examplePrompt: '帮我做一份 2026 年中国 AI 编程助手市场的竞品调研，重点对比主流产品的功能、定价和用户评价。'
    }
};

const STANDALONE_SKILLS = [
    {
        name: 'Superpowers 星级推荐',
        slug: 'superpowers-guide',
        headline: '更适合日常高频协作的一组 Skill 组合，强项在于把模糊任务快速收敛成可执行、可验证、可交付的结果。',
        scenario: '适合你已经开始高频使用 Claude Code，希望优先装一组“每天都真会用到”的 Skill，而不是一次装很多却想不起来怎么触发。',
        overview: 'Superpowers 不是单个 Skill，而是一组非常适合高频协作的工作流集合。它的价值不在“收录很多”，而在于每个 Skill 都很贴近真实做事节奏，尤其适合需求还模糊、问题还没定位清楚、任务又比较长的场景。如果你只想先挑一套最不容易吃灰的仓库来装，Superpowers 很值得优先试。',
        statusLabel: '仓库专题',
        featuredBadge: '高频优先',
        useCases: [
            '想先装一组最常用、最容易立刻产生价值的 Skill',
            '做复杂任务时，需要先收敛思路、定位问题、拆分步骤',
            '希望把“做到差不多”升级成“有验证、有评审、有交付闭环”'
        ],
        gettingStarted: [
            '第一批优先试：深度头脑风暴、系统化调试、代码评审、完成前验证、多 Agent 并行拆分',
            '先挑 2 到 3 个最贴近日常任务的 Skill 跑通，不要一上来追求整套都记住',
            '把这些 Skill 和你现在常做的页面改版、问题排查、发版前自查串起来，复用率会很高'
        ],
        installCommand: addSkillsRepoCommand('obra/superpowers'),
        installHint: '推荐先整仓安装 `obra/superpowers`，再优先从最常用的几个 Skill 开始体验。',
        resultSummary: '这类推荐页的作用不是替代单个 Skill，而是帮你先选出真正高频、最不容易闲置的那几个入口。',
        resultBullets: [
            '比较值得优先装的有：深度头脑风暴、系统化调试、代码评审、完成前验证、多 Agent 并行拆分。',
            '如果你经常做需求澄清、调试、重构和交付收口，这组 Skill 的复用率通常很高。',
            '它更像“工作节奏增强包”，而不是只解决某一种文件格式或单点能力。'
        ],
        guideHighlights: [
            {
                title: '更适合什么人',
                body: '适合已经开始频繁和 Agent 协作，希望优先补齐“需求澄清、问题定位、交付收口”这几类高频动作的人。'
            },
            {
                title: '为什么值得先装',
                body: '这些 Skill 不依赖特别复杂的外部环境，日常任务复用率高，上手后很快就能形成自己的固定工作节奏。'
            },
            {
                title: '不要怎么装',
                body: '不要一上来想着把整个仓库每个 Skill 都记住。先挑 2 到 3 个与你当前任务最贴近的，连续用一周，价值会更明显。'
            }
        ],
        featuredSkills: [
            {
                slug: 'brainstorming',
                name: '深度头脑风暴',
                fit: '适合需求还模糊、方向还没收敛的时候先开路。',
                reason: '先把模糊想法沉淀成明确方案，后面的写代码、做设计、拆任务都会更顺。'
            },
            {
                slug: 'systematic-debugging',
                name: '系统化调试',
                fit: '适合线上问题、复杂报错和反复试错的排查过程。',
                reason: '它能逼着排查过程更成体系，避免“试一个猜一个”的低效调试方式。'
            },
            {
                slug: 'requesting-code-review',
                name: '代码评审',
                fit: '适合提交前自查、重要改动复核和回归风险识别。',
                reason: '比起简单问“这段代码行不行”，它更像帮你建立一套更靠谱的审查节奏。'
            },
            {
                slug: 'verification-before-completion',
                name: '完成前验证',
                fit: '适合发版前、交付前和任务收尾前的最后一道保险。',
                reason: '它能把“差不多做完了”变成“我知道它为什么可以交付”。'
            }
        ],
        notes: [
            'Superpowers 的优势在于日常协作密度高，尤其适合你已经开始频繁和 Agent 配合做事的时候。',
            '建议先把最常用的 2 到 3 个 Skill 真正用顺，再继续扩展。'
        ],
        skillDocPurpose: '这个独立页的重点是告诉你：Superpowers 仓库里哪些 Skill 最值得优先装、分别适合什么工作阶段，以及为什么它们比“看起来很多但不常用”的仓库更适合日常高频使用。',
        relatedSlugs: ['brainstorming', 'systematic-debugging', 'requesting-code-review'],
        sourceUrl: 'https://github.com/obra/superpowers/tree/main/skills',
        sourceLabel: 'GitHub',
        moduleId: 'star-recommendation',
        moduleTitle: '星级推荐',
        moduleTone: 'amber',
        moduleIcon: 'fa-solid fa-star',
        moduleDescription: '优先挑出更适合高频实际使用的 Skill 仓库。'
    },
    {
        name: 'Everything Claude Code 星级推荐',
        slug: 'everything-claude-code-guide',
        headline: '更适合工程型与研究型任务的一组 Skill 组合，强项在于覆盖开发、分析、调研、内容与部署等更长链路工作。',
        scenario: '适合你做的是偏工程、偏研究、偏业务分析的中长链路任务，希望优先装一组覆盖面更完整的 Skill 仓库。',
        overview: 'Everything Claude Code 的长处不是单点爆发，而是面向工程、研究和业务场景的覆盖面很完整。它里面很多 Skill 非常适合中长链路任务，比如从前后端开发、编码规范，到市场调研、内容引擎、部署模式和安全审查，比较像一个更全的工作仓库。如果你更常做的是“连续多步”的任务，而不只是某一个局部动作，它会比纯效率型仓库更合适。',
        statusLabel: '仓库专题',
        featuredBadge: '长链路优先',
        useCases: [
            '需要一套能覆盖开发、调研、分析和交付的综合型 Skill 仓库',
            '更常做前后端实现、技术方案分析、市场研究或部署上线',
            '希望同一套仓库同时覆盖工程型与业务型工作'
        ],
        gettingStarted: [
            '第一批优先试：前端模式、后端模式、编码规范、市场调研、内容引擎、部署模式、安全审查',
            '先按你当前任务类型选 2 到 3 个，例如开发类先试前端模式 / 后端模式 / 编码规范',
            '如果你做的是研究或业务链路，再把市场调研、内容引擎、部署模式串起来用'
        ],
        installCommand: addSkillsRepoCommand('affaan-m/everything-claude-code'),
        installHint: '推荐先整仓安装 `affaan-m/everything-claude-code`，再按当前工作类型挑出最常用的几个 Skill。',
        resultSummary: '这类推荐页更像“仓库导览”，帮助你从一个覆盖面很大的仓库里，优先挑出真正高频的 Skill。',
        resultBullets: [
            '比较值得优先装的有：前端模式、后端模式、编码规范、市场调研、内容引擎、部署模式、安全审查。',
            '如果你的任务往往横跨实现、分析、调研和交付，这个仓库会更适合长期留着。',
            '它比纯效率向仓库更适合中长链路、多角色、多阶段的工作。'
        ],
        guideHighlights: [
            {
                title: '更适合什么人',
                body: '适合任务链比较长、经常横跨开发、分析、研究和交付的人，而不是只做某一个单点动作的人。'
            },
            {
                title: '为什么值得先装',
                body: '它最大的优势是覆盖完整。你不需要每遇到一种新任务就重新找仓库，而是能在同一套体系里逐步扩展。'
            },
            {
                title: '怎么开始更稳',
                body: '先按当前任务类型选 2 到 3 个最相关的 Skill，例如开发期先试前端模式、后端模式、编码规范，研究期再补市场调研和内容引擎。'
            }
        ],
        featuredSkills: [
            {
                slug: 'frontend-patterns',
                name: '前端模式',
                fit: '适合页面改版、交互打磨、组件梳理和体验优化。',
                reason: '如果你经常碰 Web 页面和前端结构，这类 Skill 很容易直接进入日常工作流。'
            },
            {
                slug: 'backend-patterns',
                name: '后端模式',
                fit: '适合接口设计、服务拆分、数据流梳理和系统实现。',
                reason: '它更适合把工程型任务做深，而不是停留在表层建议。'
            },
            {
                slug: 'market-research',
                name: '市场调研',
                fit: '适合做竞品分析、用户需求研究和行业信息整理。',
                reason: '当你的任务不只是写代码，还要看市场和业务决策时，这类 Skill 很有价值。'
            },
            {
                slug: 'content-engine',
                name: '内容引擎',
                fit: '适合把研究结果、产品内容和长文稿转成多平台输出。',
                reason: '它能把工程和业务输出真正连接起来，适合做完整交付的人。'
            }
        ],
        notes: [
            'Everything Claude Code 更适合“任务链比较长”的人，不一定每个 Skill 都要马上装上手。',
            '建议先从与你当前最相关的 2 到 3 个 Skill 开始，避免一次把范围开太大。'
        ],
        skillDocPurpose: '这个独立页的重点是帮你先看清：Everything Claude Code 仓库里哪些 Skill 最值得优先装、它们分别对应什么任务类型，以及为什么这套仓库更适合工程型和研究型的长链路工作。',
        relatedSlugs: ['frontend-patterns', 'backend-patterns', 'market-research'],
        sourceUrl: 'https://github.com/affaan-m/everything-claude-code/tree/main/skills',
        sourceLabel: 'GitHub',
        moduleId: 'star-recommendation',
        moduleTitle: '星级推荐',
        moduleTone: 'amber',
        moduleIcon: 'fa-solid fa-star',
        moduleDescription: '优先挑出更适合高频实际使用的 Skill 仓库。'
    }
];

const BASE_SKILL_BY_SLUG = new Map(
    BASE_SKILL_MODULES.flatMap((module) => module.skills.map((skill) => [skill.slug, skill]))
);

function normalizeSkill(module, skill) {
    const overrides = SKILL_DETAIL_OVERRIDES[skill.slug] || {};

    return {
        ...skill,
        ...overrides,
        moduleId: module.id,
        moduleTitle: module.title,
        moduleTone: module.tone,
        moduleIcon: module.icon,
        moduleDescription: module.description,
        detailUrl: skill.detailType === 'mcp'
            ? `mcp-detail.html?slug=${skill.slug}`
            : `skill-detail.html?slug=${skill.slug}`,
        sourceUrl: overrides.sourceUrl || skill.sourceUrl || REFERENCE_SOURCE_URL,
        sourceLabel: overrides.sourceLabel || skill.sourceLabel || REFERENCE_SOURCE_LABEL
    };
}

function buildFeaturedSkill(slug) {
    const baseSkill = BASE_SKILL_BY_SLUG.get(slug) || null;
    const featuredSkill = FEATURED_SKILL_CONTENT[slug] || null;

    if (!baseSkill && !featuredSkill) {
        return null;
    }

    return {
        ...(baseSkill || {}),
        ...(featuredSkill || {}),
        slug
    };
}

export const SKILL_MODULES = FEATURED_SKILL_GROUPS.map((module) => ({
    ...module,
    skills: module.skillSlugs
        .map((slug) => buildFeaturedSkill(slug))
        .filter(Boolean)
        .map((skill) => normalizeSkill(module, skill))
}));

export const ALL_SKILLS = [
    ...SKILL_MODULES.flatMap((module) => module.skills),
    ...STANDALONE_SKILLS.map((skill) => ({
        ...skill,
        detailUrl: `skill-detail.html?slug=${skill.slug}`
    }))
];

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
