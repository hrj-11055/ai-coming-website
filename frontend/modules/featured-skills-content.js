const CLAUDE_CODE_MINIMAX_IMAGES = [
    ['minimax-coding-plan.jpeg', 'MiniMax Coding Plan 订阅页面'],
    ['minimax-api-key.png', 'MiniMax API Key 创建与复制页面'],
    ['cc-switch-install.jpeg', 'CC-Switch 安装包下载页面'],
    ['cc-switch-provider.jpeg', 'CC-Switch 添加服务商入口'],
    ['cc-switch-minimax.jpeg', 'CC-Switch 填写 MiniMax 模型配置'],
    ['claude-json-onboarding.png', '创建 Claude Code 首次引导配置文件'],
    ['claude-trust-folder.jpeg', 'Claude Code 信任当前项目目录'],
    ['minimax-claude-error.png', '未接入 MiniMax 前 Claude Code 的连接报错']
].map(([file, caption]) => ({
    src: `/pic/skills-guides/claude-code/${file}`,
    caption
}));

export const FEATURED_SKILL_GROUPS = [
    {
        id: 'document-processing',
        title: '文档处理',
        icon: 'fa-solid fa-file-lines',
        tone: 'orange',
        description: '5 个最容易立刻产生交付结果的文档类 Skill，适合第一次体验 Skill 能力时直接上手。',
        skillSlugs: ['docx', 'pptx', 'powerpoint', 'pdf', 'xlsx']
    },
    {
        id: 'efficiency-tools',
        title: '效率工具',
        icon: 'fa-solid fa-bolt',
        tone: 'amber',
        description: '先把需求想清楚、把资料查清楚，再把高频经验沉淀成可复用 Skill，会比直接硬做更稳。',
        skillSlugs: ['brainstorming', 'search-first', 'creator-skill']
    },
    {
        id: 'research-content',
        title: '研究与内容',
        icon: 'fa-solid fa-compass-drafting',
        tone: 'rose',
        description: '从调研、内容拆分到素材获取，围绕真实业务场景挑出最常用的 3 个 Skill。',
        skillSlugs: ['market-research', 'content-engine', 'douyin-video-downloader']
    },
    {
        id: 'mcp-starter',
        title: 'MCP 入门',
        icon: 'fa-solid fa-plug',
        tone: 'sky',
        description: '先把文件、文档、网页、流程图和搜索这 5 类最常用的外部能力接进来，AI 才会真正开始帮你干活。',
        skillSlugs: ['filesystem-mcp', 'pdf-reader-mcp', 'playwright-mcp', 'mermaid-mcp', 'free-web-search-mcp']
    },
    {
        id: 'ai-coding-assistant',
        title: 'AI 编程助手',
        icon: 'fa-solid fa-terminal',
        tone: 'indigo',
        description: '把终端编程助手真正接进本地开发环境，覆盖安装、环境变量、模型选择和首次验证。',
        skillSlugs: ['claude-code-config']
    }
];

export const FEATURED_SKILL_CONTENT = {
    docx: {
        name: 'Word 文档生成',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '第一次用时，先做一份页数不多的小文档，把标题、表格和导出链路跑通，再上复杂版式。',
        preparation: [
            '先确定文档主题、目标读者和最终文件名。',
            '如果要插入表格、封面或图片，先把素材和结构说明整理好。',
            '如果文档要正式交付，生成后再用 Word 或兼容工具做一次分页检查。'
        ],
        promptExample: `请调用 docx 技能，帮我生成一份名为 \`AI_Strategy_2026.docx\` 的文档，要求如下：
1. 封面页标题为“2026 全球 AI 战略演进报告”，一号字、加粗、居中。
2. 正文包含三级标题结构，并写一段关于“提示词工程学”的说明，关键词加粗。
3. 插入一个 4x4 表格，列名为“模型名称 / 参数量 / 逻辑得分 / 部署成本”，补 3 行示例数据，表头加粗并用浅灰底色。
4. 文末插入当前日期，并告诉我文件保存路径。`,
        resultSummary: 'Skill 会在当前目录直接生成一份真正可打开的 `.docx` 文件，而不是只给你一段可复制文字。',
        resultBullets: [
            '通常会返回保存路径，方便你立刻打开检查。',
            '标题层级、表格样式和基础格式会跟着一起写入 Word。',
            '如果需求写得足够细，生成结果会更接近正式交付稿。'
        ],
        notes: [
            '如果输入是旧 `.doc` 文件，建议先转成 `.docx` 再继续编辑。',
            '涉及复杂排版时，最后一定要做一次可视化复检。'
        ]
    },
    pptx: {
        name: 'PPT 演示文稿生成',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '先用 5 页左右的小型演示稿试一次，确认标题页、正文页和数据页都能按预期生成。',
        preparation: [
            '先确定 PPT 的用途，是路演、汇报、培训还是提案。',
            '提前想好页数范围和每页核心信息，不要让一次 prompt 想表达太多。',
            '如果你有品牌色、模板或固定结构，直接写进提示词里。'
        ],
        promptExample: `使用 pptx 技能创建一份“2025 年度市场复盘”PPT：
1. 首页：2025 市场表现年度总结。
2. 核心指标页：展示用户增长、留存率、获客成本（CAC）。
3. 渠道分析页：对比社媒、搜索和线下活动的转化率。
4. 竞品对比页：突出我们的市场占有率优势。
5. 2026 战略方向页：总结品牌升级与全球化布局。`,
        resultSummary: 'Skill 会产出可继续编辑的 `.pptx` 演示文稿，适合后续再细调文案、顺序和样式。',
        resultBullets: [
            '适合先快速搭出结构完整的演示稿骨架。',
            '如果每页要求写得清楚，生成效果会明显更稳。',
            '生成后建议快速过一遍标题长度、图表占位和每页信息密度。'
        ],
        notes: [
            '如果后续还要套品牌模板，先让 Skill 出内容版，再做模板迁移会更省力。'
        ]
    },
    powerpoint: {
        name: 'PowerPoint 读取与改稿',
        statusLabel: '已收录',
        featuredBadge: '精选 16',
        beginnerNote: '它更适合“先读懂现有 PPT，再继续改”，如果你手里已经有一份 deck，这个入口通常比从零生成更顺手。',
        preparation: [
            '先准备一份真实的 `.pptx` 文件，最好带标题页、正文页和讲者备注。',
            '先想清楚你这次是要抽取结构、提炼讲稿，还是批量改写文案。',
            '如果有不能动的页面、品牌页或备注内容，提前在提示词里明确写出来。'
        ],
        promptExample: `请用 powerpoint skill 读取这份 \`board-review-q2.pptx\`：
1. 按页输出：页码、标题、3 条以内关键内容、speaker notes。
2. 找出信息过载的页面，并标注哪些页更适合拆成两页。
3. 保留原始结论不变，把整套语气改得更适合董事会汇报。
4. 最后给我一版“建议保留 / 建议重写 / 建议删除”的改稿清单。`,
        resultSummary: '这个 Skill 更偏向先把现有演示稿“读透”，再输出一份适合继续改稿和重组的结构化结果。',
        resultBullets: [
            '适合处理现成 `.pptx`，尤其是带讲者备注和固定页序的 deck。',
            '相比纯生成型 PPT Skill，它更适合复盘、抽取和批量改稿。',
            '如果提示词里写清“哪些页不能动”，输出会更接近真实审稿流程。'
        ],
        notes: [
            '来源页被 Cloudflare 拦截，这里的文案是根据你给的 SkillsMP 链接、上游仓库信息，以及站内对该 skill 的交叉引用整理的。',
            '如果你后面拿到这条 Skill 的完整 SKILL.md，我们可以再把细节补得更贴近原文。'
        ]
    },
    pdf: {
        name: 'PDF 文档生成',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: 'PDF 更适合做“最终交付件”，第一次上手时尽量把版式要求写具体一些。',
        preparation: [
            '先确定 PDF 是偏报告、表单、海报还是多页说明书。',
            '如果包含图形、表格或多页布局，最好把每页任务单独写清楚。',
            '如果要对外发送，生成后记得检查分页和元数据。'
        ],
        promptExample: `创建一个名为 \`Skill_Validation_Report.pdf\` 的 PDF：
1. 第 1 页顶部居中放标题“Claude Skill Integration Test”，字号 24。
2. 页面中间绘制一个浅蓝色矩形，内部写入“Encapsulated Artifact”。
3. 第 2 页插入一个 3 行数据表，字段为 Model / Parameter / Score，表头灰底。
4. 设置文档 Author 为“ClaudeClaw_User”，Subject 为“Skill Testing”。`,
        resultSummary: 'Skill 会直接输出 PDF 文件，适合做固定版式文档、报告或需要一次性交付的材料。',
        resultBullets: [
            '图形、表格和多页结构可以一起完成。',
            '文档元数据也能一并写入，不只是页面内容。',
            '生成后最好再打开看一眼分页和元素位置。'
        ],
        notes: [
            '如果你后面还要继续编辑内容，先做 docx/pptx 版本，再导出 PDF 会更灵活。'
        ]
    },
    xlsx: {
        name: 'Excel 表格生成',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '第一次建议从“单个 sheet + 一段筛选逻辑”开始，确认它会输出真正可编辑的 Excel 文件。',
        preparation: [
            '先想清楚表头字段、主键列和最终交付格式。',
            '如果有筛选或计算逻辑，直接写成明确条件。',
            '如果后面还要人工继续维护，尽量要求保留公式和可编辑结构。'
        ],
        promptExample: `使用 xlsx skill，创建一个销售数据表：
1. 在 \`data_comparison_test.xlsx\` 的 Sheet1 中，从 A1 开始写入 20 行模拟销售数据，字段为 ID、日期、地区、产品、金额、状态。
2. 确保至少有 5 条数据属于“欧洲”且“金额大于 3000”。
3. 将筛选出的记录写到同一工作表的 I1 开始区域，并标注标题“PROCESSED_DATA_FILTERED”。
4. 保持 G 列和 H 列为空白，用作左右区域分隔。
5. 完成后告诉我文件保存路径，并说明左右两个区域分别有多少行数据。`,
        resultSummary: 'Skill 会输出真正的 `.xlsx` 文件，适合继续筛选、补列、改公式，而不是只返回一次性表格结果。',
        resultBullets: [
            '可以同时生成原始区和处理结果区。',
            '适合把数据写入、筛选、格式整理放在同一次执行里完成。',
            '生成后建议打开 Excel 检查公式、列宽和筛选区域。'
        ],
        notes: [
            '如果数据本来是 CSV/TSV，也可以直接让 Skill 帮你整理成正式的 `.xlsx`。'
        ]
    },
    brainstorming: {
        name: '深度头脑风暴',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '这个 Skill 的重点不是快，而是把模糊想法打磨成能执行的设计，所以要预留多轮确认时间。',
        preparation: [
            '把主题、目标、受众、预算和成功标准尽量写清楚。',
            '如果你希望它更有风格感，把语气、氛围和限制条件一起给到。',
            '准备好和它多轮来回确认，它不会一上来就直接产出最终成品。'
        ],
        promptExample: `使用 brainstorming skill，帮我策划一家“只在深夜 12 点到凌晨 4 点营业”的冥想书店开业活动。
补充信息：
- 地点：上海静安区
- 受众：高压力的金融从业者和深夜失眠的创意工作者
- 目标：在小红书获得 10k+ 收藏
- 必须包含：一个令人意外的线下装置、一个能够引起共鸣的话题标签
- 整体风格：治愈、深邃、略带一点赛博朋克感`,
        resultSummary: '你会先得到方向拆解、方案比较和结构化设计文档，而不是直接跳到执行层。',
        resultBullets: [
            '适合在需求还模糊、方向还不稳的时候先把框架想透。',
            '复杂题目可能要跑较长时间，结果通常是一份比较完整的设计文档。',
            '如果你持续给出确认，它会不断把方案往可执行方向收口。'
        ],
        gallery: [
            {
                src: '/pic/skills-guides/brainstorming-example.png',
                alt: 'brainstorming Skill 生成设计文档的实测截图',
                caption: '实测中，brainstorming 会把模糊创意沉淀成一份结构化设计文档，适合先定方向再执行。'
            }
        ],
        notes: [
            '如果你已经很确定要做什么，再用它就不一定划算；它最适合前期定方向。'
        ]
    },
    'search-first': {
        name: '先搜索再动手',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '当你不确定“要不要自己造轮子”时，先用这个 Skill 去查现成方案，通常能省下很多试错时间。',
        preparation: [
            '先把你真正要解决的问题写清楚，而不是只写一个抽象主题。',
            '如果你有技术栈偏好、预算限制或部署限制，也一起写出来。',
            '把“我要最后得到什么决策”写清楚，结果会更聚焦。'
        ],
        promptExample: `先不要直接写代码。请用 search-first skill 帮我调研“把 Markdown 批量转成微信公众号可发布 HTML”有哪些现成方案。
我想知道：
1. 最值得看的 3 到 5 个工具或仓库
2. 各自适合什么场景
3. 上手成本、维护状态和明显局限
4. 最后推荐一个最适合我当前项目的方案`,
        resultSummary: 'Skill 会先帮你搜现成工具、脚本和成熟模式，再把结果整理成可直接决策的建议。',
        resultBullets: [
            '适合在开工前做快速选型，避免重复造轮子。',
            '如果你把限制条件说得越清楚，推荐结果越实用。',
            '它最有价值的地方不是“搜到了”，而是帮你筛掉不适合你的方案。'
        ],
        notes: [
            '如果你已经有候选库名，直接写进去，会比泛泛搜索更高效。'
        ]
    },
    'creator-skill': {
        name: 'Skill 创建助手',
        slug: 'creator-skill',
        headline: '把你反复使用的工作方法整理成可安装、可触发、可测试的 AI Skill。',
        scenario: '适合想创建个人 Skill、团队工作流 Skill、项目专用 Skill，或把已有提示词升级成长期可复用能力的人。',
        overview: 'creator-skill 面向的是“创建 Skill”这件事本身。它会帮你先判断一个经验是否值得沉淀成 Skill，再梳理触发时机、输入要求、执行步骤、边界限制和测试样例。相比只写一段提示词，它更适合把稳定流程做成能长期复用、能交给团队共享、也方便后续迭代的能力说明。',
        useCases: ['从零创建一个新的 Skill', '把常用提示词整理成标准 SKILL.md', '为团队流程补触发规则和使用说明', '给已有 Skill 增加测试样例和边界约束'],
        gettingStarted: [
            '先写清楚这个 Skill 要解决的具体任务，不要只写成一个宽泛主题。',
            '列出它应该在什么场景触发，以及哪些场景不应该触发。',
            '把执行步骤拆成 Agent 能照着做的流程，并补上输入、输出和验收标准。',
            '准备 2 到 3 个真实测试提示词，确认 Skill 会在正确场景生效。',
            '首次写完后先小范围试用，根据失败案例调整描述和步骤。'
        ],
        installCommand: 'npx skills add anthropics/skills --skill "skill-creator" --yes',
        installHint: '这个入口对应 Anthropic 官方 `skill-creator`。安装后，你可以让 Agent 按它的工作流帮你设计、编写和评估新的 Skill。',
        sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator',
        skillDocPurpose: '这个 Skill 的说明文件主要是在规范“如何创建 Skill”：先确认目标和触发条件，再编写 SKILL.md、补测试样例、用真实任务验证效果，最后根据失败点继续迭代。它的价值在于让 Skill 不只是写得像文档，而是真的能被 Agent 正确识别和调用。',
        relatedSlugs: ['brainstorming', 'search-first', 'mcp-builder'],
        statusLabel: '已收录',
        featuredBadge: '精选 16',
        beginnerNote: '第一次使用时，不要试图做一个“万能 Skill”。先选一个你最近重复做过 3 次以上的具体流程，成功率会高很多。',
        preparation: [
            '准备一个你想沉淀的具体工作流，例如“公众号排版检查”“每周数据复盘”或“PR 发布前自查”。',
            '整理 1 到 2 个真实输入样例，让 Skill 创建过程不只停留在抽象描述。',
            '提前想好输出形式，是一份 SKILL.md、一组测试提示词，还是同时包含安装说明。'
        ],
        promptExample: `请使用 creator-skill 帮我创建一个新的 Skill，主题是“公众号文章发布前检查”。
我希望这个 Skill 能做到：
1. 在我准备发布公众号长文前触发。
2. 检查标题、摘要、段落长度、图片占位、CTA 和错别字风险。
3. 输出一份可执行的发布前检查清单。
4. 不要改写整篇文章，除非我明确要求。
5. 帮我写好 SKILL.md，并补 3 个测试提示词。`,
        resultSummary: '你会得到一份更接近可安装 Skill 的结构化说明，而不是零散提示词。',
        resultBullets: [
            '通常会产出 Skill 的触发描述、执行步骤、边界限制和示例提示词。',
            '适合把个人经验、团队流程和项目规范沉淀成可复用能力。',
            '如果提供真实样例，生成的 Skill 会更容易在正确场景触发。'
        ],
        notes: [
            'Skill 的范围越具体，越容易写清楚触发条件，也越容易测试。',
            '不要把临时一次性任务都做成 Skill；只有反复出现的流程才值得沉淀。',
            '写完后最好用正例和反例各测一次，确认它不会在无关任务里误触发。'
        ]
    },
    'market-research': {
        name: '市场调研与竞品分析',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '最关键的是先说清楚你要做什么决策，Skill 才会把资料整理成有判断价值的输出。',
        preparation: [
            '先明确你要判断的是市场机会、竞品差异、出海可行性还是价格策略。',
            '尽量把时间范围写出来，例如最近一个月、最近一个季度。',
            '如果你需要表格对比或来源引用，也请提前说明。'
        ],
        promptExample: `用 market-research skill 帮我查一下 2026 年初中国新能源汽车市场的现状，重点看：
1. 比亚迪、小米和华为（鸿蒙智行）最近一个月的销量与单车利润对比
2. 20 万到 30 万价位最近降价最狠的车型和具体降价金额
3. 智己或蔚来最近有没有新的固态电池实测续航数据
4. 这些品牌出海欧洲和中东的最新进展，以及被加关税的风险

最后请给我一张核心参数对比表，并给出你认为最关键的结论。`,
        resultSummary: 'Skill 会把资料搜集、对比和判断串起来，最后给你的是可用于决策的研究结论，而不是一堆零散链接。',
        resultBullets: [
            '适合竞品分析、行业扫描、进入新市场前的快速判断。',
            '如果要求来源和表格，它会更像一份可读的研究小结。',
            '你给的时间范围越具体，结果越容易落到“现在可用”的层面。'
        ],
        notes: [
            '最好明确“最终要决定什么”，否则结果容易泛成一份资料综述。'
        ]
    },
    'content-engine': {
        name: '多平台内容改写',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '这个 Skill 不适合“把同一段话复制到所有平台”，它的价值就在于把同一份母稿拆成平台原生表达。',
        preparation: [
            '先准备一份已经写好的母稿、长文、播客提纲或产品说明。',
            '先列清楚你要发的平台，例如公众号、朋友圈、社群、X 或短视频。',
            '把每个平台想达成的目标写清楚，比如引流、转化、收藏或讨论。'
        ],
        promptExample: `用 content-engine skill，基于我这篇长文《AI 出海产品怎么做冷启动》，帮我拆成 4 个版本：
1. 微信公众号摘要版（600 到 800 字）
2. 朋友圈短文版（150 字以内）
3. 社群预告版（突出一个钩子和一个 CTA）
4. X / 短帖版（更有节奏感，适合连续发布）

要求：四个平台都保留同一个核心观点，但不要直接复制同一句话。`,
        resultSummary: 'Skill 会把一份核心内容拆成多平台版本，每个平台的语气、开头和 CTA 都会更贴近发布场景。',
        resultBullets: [
            '适合把长文、课程、播客或产品发布说明做二次分发。',
            '它不是简单缩写，而是会按平台语境重写内容。',
            '你越明确每个平台的目标，输出就越像能直接发的版本。'
        ],
        notes: [
            '如果母稿本身还不成熟，先用 article-writing 一类 Skill 把母稿写顺，再来拆平台版本会更稳。',
            '如果后续还要做封面图或视觉素材，可以再串上封面图相关 Skill。'
        ]
    },
    'douyin-video-downloader': {
        name: '抖音无水印视频下载',
        slug: 'douyin-video-downloader',
        headline: '把抖音分享口令或短链接解析成可直接保存的无水印视频文件，适合快速存档和素材整理。',
        scenario: '适合案例收集、短视频素材整理、竞品拆解和二次剪辑前的下载动作。',
        overview: '这个 Skill 聚焦一件事：把你手里的抖音分享文案或短链接，解析成真正可下载的无水印视频文件。对不想折腾 Cookie、登录和手动找直链的人来说，它非常省事。',
        useCases: ['下载单个抖音视频', '保存案例素材到本地', '竞品拆解前先拉取原视频'],
        gettingStarted: ['先复制完整分享口令或短链接', '让 Skill 先解析真实视频地址', '确认输出文件名和保存路径'],
        installCommand: 'npx skills add openclaw/skills',
        installHint: '如果你已经装过 `openclaw/skills` 整仓，后续直接调用 `douyin-video-downloader` 就可以；这里保留的是最容易复制的整仓安装方式。',
        sourceUrl: 'https://skillsmp.com/zh/skills/openclaw-skills-skills-ansonlianson-douyin-video-downloader-skill-md',
        skillDocPurpose: '这个 Skill 的说明重点在于把“分享口令解析 -> 获取直链 -> 保存 MP4”这条链路固定下来，让 Agent 不用依赖登录态也能完成无水印下载。',
        relatedSlugs: ['content-engine', 'mcp-server-fetch'],
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '第一次使用时，直接贴完整分享文案最省心，因为里面通常已经带了可解析的短链接。',
        preparation: [
            '先拿到抖音分享文案或短链接，越完整越好。',
            '确认你希望视频保存到当前目录，还是另一个指定目录。',
            '如果只是测试流程，先用 1 个短视频样本跑通即可。'
        ],
        promptExample: `用 douyin-video-downloader skill 帮我下载这个抖音视频：
https://v.douyin.com/C7-Eq5Paw6A/

如果你拿到的是整段分享文案，也可以直接整段贴进去，让 Skill 自己抽取链接。`,
        resultSummary: 'Skill 会把视频下载成 `.mp4` 文件保存到本地，适合你继续做剪辑、归档或内容拆解。',
        resultBullets: [
            '通常会直接返回保存路径和文件名。',
            '对普通分享口令和短链接都比较友好。',
            '下载成功后，你就不需要再手动找无水印地址。'
        ],
        gallery: [
            {
                src: '/pic/skills-guides/douyin-video-downloader-example.png',
                alt: 'douyin-video-downloader Skill 成功下载抖音视频的实测截图',
                caption: '实测中，贴入抖音分享链接后会直接生成本地 MP4 文件，并返回保存位置。'
            }
        ],
        notes: [
            '如果解析失败，优先检查分享链接是否已失效，或者换成更完整的分享文案再试一次。'
        ]
    },
    'filesystem-mcp': {
        name: '文件系统操作（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它最适合拿来做“AI 直接读你的工作目录”这件事。第一次不要一上来就开放整个硬盘，先只给一个项目文件夹。',
        preparation: [
            '先想清楚你要让 AI 访问哪一个工作目录，尽量只开放最小范围。',
            '准备一个真实测试场景，例如“整理会议纪要”“汇总本周日报”或“批量改几个 markdown 文件”。',
            '如果目录里有敏感文件，先单独挪走，或者先在测试目录里试跑。'
        ],
        promptExample: `安装完成后，可以先这样测试 Filesystem MCP：
1. 读取我这个项目目录里的所有 Markdown 文件，按主题分组整理。
2. 帮我找出上周新增的周报文件，并汇总成一份待办清单。
3. 不要修改原文件，先把整理结果输出成一个新的 \`weekly-summary.md\` 草稿。`,
        resultSummary: 'MCP 生效后，AI 不再只是“告诉你应该怎么整理文件”，而是能直接读取目录、抓取内容，并把整理结果写成新的交付文件。',
        resultBullets: [
            '特别适合资料归档、日报周报汇总、批量改文档和项目目录梳理。',
            '第一次就能明显感受到 AI 从“聊天”变成“处理文件”。',
            '如果你只开放了一个工作目录，安全边界也会更清楚。'
        ],
        notes: [
            '先把权限范围缩小，再逐步扩大，比一开始就开放整个电脑更稳。',
            '涉及批量写文件时，第一次建议先要求 AI 只生成草稿，不直接覆盖原文。'
        ]
    },
    'pdf-reader-mcp': {
        name: 'PDF 文档解析（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '如果你经常看合同、方案、研究报告或扫描件，这个 MCP 会是最容易立刻产生价值的一项。',
        preparation: [
            '先准备 1 到 2 份真实 PDF 样本，最好包含一份普通 PDF 和一份较复杂或较长的 PDF。',
            '先明确你最想让 AI 帮你做什么，是提取重点、转结构化内容，还是整理成提纲。',
            '如果是扫描件，第一次测试时先观察抽取质量，再决定要不要继续做表格或流程图转换。'
        ],
        promptExample: `安装完成后，请帮我测试这个 PDF Reader MCP：
1. 读取这份 PDF 并提取核心结论。
2. 把全文整理成“背景 / 关键数据 / 风险点 / 下一步动作”四段结构。
3. 如果文档里有流程或步骤，再补一版适合转成流程图的结构化摘要。`,
        resultSummary: '你会先拿到一份更适合继续处理的结构化内容，而不是自己一页页硬读 PDF。',
        resultBullets: [
            '适合长文档快速抓重点，也适合把 PDF 变成后续汇报和知识整理的输入。',
            '如果文档原本难复制或页数很长，节省时间会非常明显。',
            '和 Mermaid MCP 连起来用时，可以把文档里的流程再转成图。'
        ],
        notes: [
            '第一次先用“摘要 + 提纲”类任务最稳，确认质量后再做更复杂的抽取。',
            '如果 PDF 质量很差，先把预期放在“提取关键信息”，不要一开始就要求完美还原版式。'
        ]
    },
    'playwright-mcp': {
        name: '网页自动化（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它适合替你做重复网页动作。第一次先选一个登录要求低、步骤不长的页面流程，最容易跑通。',
        preparation: [
            '先明确一段最短网页流程，例如打开页面、搜索、点击、读取结果。',
            '如果目标页面需要登录，先确认测试环境和账号权限是否合适。',
            '第一次尽量避免过长的多系统流程，先从 3 到 5 步的简单操作开始。'
        ],
        promptExample: `安装 Playwright MCP 后，请先做一个最小测试：
1. 打开指定网页。
2. 点击页面上的主要按钮或导航项。
3. 截图并告诉我页面上出现了哪些关键内容。

如果这个最小流程没问题，再继续帮我把整套网页操作步骤串起来。`,
        resultSummary: '配置完成后，AI 能真实执行点击、输入、等待和截图，不只是“描述应该怎么操作网页”。',
        resultBullets: [
            '很适合重复后台操作、表单检查、页面巡检和数据收集。',
            '如果网页是动态加载的，效果会明显比普通抓取类 MCP 更稳。',
            '一旦最小流程跑通，后续就可以把多个步骤串成自动化任务。'
        ],
        notes: [
            '先验证最小流程成功，再加登录、跳转和复杂条件判断。',
            '遇到需要验证码或严格风控的网站时，先确认是否适合自动化。'
        ]
    },
    'mermaid-mcp': {
        name: '流程图生成（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它最适合把“说不清的一段流程描述”直接变成一张能看、能改、能继续复用的图。',
        preparation: [
            '先准备一段流程说明，哪怕只是几步自然语言也可以。',
            '提前想好你要的是业务流程、SOP、系统结构，还是任务拆解图。',
            '第一次先做结构简单的图，确认风格和节点层级都对，再扩成复杂版本。'
        ],
        promptExample: `请用 Mermaid MCP 帮我把下面这段说明画成流程图：
1. 用户提交需求
2. 系统自动分类
3. 运营人工复核
4. 通过后进入执行
5. 执行结果回传并归档

要求：先输出一版清晰的主流程图，再补一个适合放进汇报文档的简洁版本。`,
        resultSummary: '你会得到可视化流程图产物，而不是只有一段“建议你自己去画图”的文字说明。',
        resultBullets: [
            '适合把 SOP、项目流程、业务步骤和系统结构说清楚。',
            '修改成本很低，后续只要改文字描述就能继续生成新图。',
            '和 PDF Reader 一起用时，能把文档中的流程直接转成图。'
        ],
        notes: [
            '第一次先追求结构正确，不要一开始就追求很复杂的视觉美化。',
            '如果输入描述本身不清楚，先让 AI 帮你整理成步骤，再生成流程图会更稳。'
        ]
    },
    'free-web-search-mcp': {
        name: 'Tavily 实时网络搜索（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '这条 MCP 最适合当“联网搜索入口”来装。先把 Tavily API Key 配好，再用一个最新问题做测试，通常最容易确认有没有生效。',
        preparation: [
            '先到 Tavily 控制台注册账号并复制 API Key。',
            '执行安装命令前，把命令里的 `<your-api-key>` 替换成你自己的真实 Key。',
            '添加完成后，重启 Claude Code，再用 `/mcp` 确认 `tavily` 服务已经出现。'
        ],
        promptExample: `安装完成后，请先这样测试 Tavily MCP：
1. 搜索最近一周关于“AI Agent”最值得关注的 5 条消息。
2. 给出每条消息的来源和一句话摘要。
3. 再帮我判断哪些信息更值得继续深挖，哪些只是热闹。

如果 Tavily MCP 没有生效，请先提醒我检查 API Key 和 \`/mcp\` 列表。`,
        resultSummary: '配置成功后，它会先联网搜索，再把结果整理成带来源的资料列表，适合继续做判断、对比和汇总。',
        resultBullets: [
            '特别适合最新资料查询、事实核验和轻量研究。',
            '相比只靠模型记忆，它更适合回答带时间性的搜索问题。',
            '如果 `/mcp` 里已经能看到 `tavily`，通常就说明安装链路已经通了。'
        ],
        notes: [
            '如果你已经拿到目标链接，直接用 Fetch 或 Playwright 读取正文通常会更高效。',
            '这条配置是 HTTP transport 方式，不是本地命令行拉起型 MCP。'
        ]
    },
    'claude-code-config': {
        name: 'Claude Code 配置安装',
        slug: 'claude-code-config',
        detailLayout: 'markdown',
        headline: 'Windows 用户从安装 Claude Code CLI 到接入 MiniMax 模型的一篇式配置教程。',
        scenario: '适合第一次在 Windows 上安装 Claude Code，并希望把模型请求接入 MiniMax Coding Plan 的用户。',
        overview: '这份教程根据 Claude Code Windows 版实操文档和 MiniMax 官方 Anthropic 兼容接入说明整理，按“安装 CLI、开通 Coding Plan、生成 API Key、写入配置、启动验证”的顺序一步步完成。',
        useCases: [
            'Windows 电脑首次安装 Claude Code',
            '将 Claude Code 接入 MiniMax 模型',
            '生成并保存 MiniMax API Key',
            '排查 Claude Code 启动、PATH 和模型连接问题'
        ],
        gettingStarted: [
            '先安装 Node.js、npm 和 Git，并在 PowerShell 中验证 `node --version`、`npm --version`、`git --version`。',
            '用 npm 安装 Claude Code CLI，安装完成后运行 `claude --version`。',
            '登录 MiniMax，开通 Coding Plan，进入 API Key 页面创建并复制 Key。',
            '把 MiniMax Anthropic 兼容端点和 API Key 写入 `~/.claude/settings.json`，模型名称使用 `MiniMax-M2.7`。',
            '进入项目目录运行 `claude`，选择信任当前文件夹后做一次真实提问验证。'
        ],
        installCommand: `# Windows
npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
claude --version

# 在项目目录启动
cd D:\\你的项目
claude
`,
        installHint: '本教程只保留 Windows 路径。先用 npm 安装 Claude Code，再通过 MiniMax 的 Anthropic 兼容端点接入模型。',
        promptExample: `我已经按教程安装 Claude Code。请帮我做一次配置验收：
1. 检查 \`claude --version\` 是否可用。
2. 检查 \`~/.claude/settings.json\` 是否已经配置 MiniMax 端点和 API Key。
3. 确认模型名称是否为 \`MiniMax-M2.7\`。
4. 如果有任何一步失败，请先给我最小排查顺序。`,
        resultSummary: '完成后，你应该能在项目目录直接运行 `claude`，Claude Code 的模型请求会通过 MiniMax 的 Anthropic 兼容端点发送。',
        resultBullets: [
            'Windows 用户能在 PowerShell 中完成安装、版本验证和 MiniMax 配置。',
            'MiniMax API Key 写入后，无需每次启动 Claude Code 都重新配置。',
            '最小验收路径是 `claude --version`、`claude` 和一次项目内真实提问。'
        ],
        screenshots: CLAUDE_CODE_MINIMAX_IMAGES,
        markdownSections: [
            {
                title: '二、Claude Code + MiniMax 安装配置指南',
                body: '本文以 Windows 10/11 为例，带你从零安装 Claude Code，并把 Claude Code 接入 MiniMax 的模型服务。教程中的截图来自 Windows 版实操文档，模型接入参数参考 MiniMax 官方 Anthropic 兼容接口说明。'
            },
            {
                title: '（一）安装 Claude Code',
                body: '先安装 Node.js、npm 和 Git。打开 PowerShell，分别运行 `node --version`、`npm --version`、`git --version`，能看到版本号就说明环境准备好了。然后执行下面的命令安装 Claude Code。',
                code: `npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
claude --version`,
                image: CLAUDE_CODE_MINIMAX_IMAGES[7]
            },
            {
                title: '（二）申请 MiniMax 账号并开通 Coding Plan',
                body: '进入 MiniMax 官网注册或登录账号，然后打开用户中心里的 Coding Plan 页面。按文档示例，可以选择 Starter 套餐开通，开通后才能获得 Claude Code 接入所需的模型调用额度。',
                links: [
                    { label: 'MiniMax 官网', href: 'https://www.minimaxi.com/' },
                    { label: 'Coding Plan 页面', href: 'https://platform.minimaxi.com/user-center/payment/coding-plan' }
                ],
                image: CLAUDE_CODE_MINIMAX_IMAGES[0]
            },
            {
                title: '（三）生成并复制 MiniMax API Key',
                body: '在 MiniMax 平台进入 API Key 管理页面，点击创建 Key。创建后立即复制并保存，这个 Key 后面会写入 Claude Code 配置。不要把 Key 发给别人，也不要提交到代码仓库。',
                image: CLAUDE_CODE_MINIMAX_IMAGES[1]
            },
            {
                title: '（四）推荐方式：写入 Claude Code settings.json',
                body: '在用户目录下创建或编辑 `~/.claude/settings.json`。国内账号使用 `https://api.minimaxi.com/anthropic`，国际站账号使用 `https://api.minimax.io/anthropic`。把下面的 `YOUR_MINIMAX_API_KEY` 替换成你刚复制的 MiniMax API Key。',
                code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_MINIMAX_API_KEY",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M2.7"
  }
}`
            },
            {
                title: '（五）可选方式：用 CC-Switch 管理模型配置',
                body: '如果你经常切换不同模型服务商，可以安装 CC-Switch。下载 Windows 安装包后按提示安装，再在软件里新增一个 MiniMax 服务商配置。',
                image: CLAUDE_CODE_MINIMAX_IMAGES[2]
            },
            {
                title: '（六）在 CC-Switch 中添加 MiniMax',
                body: '打开 CC-Switch，进入服务商配置页面，选择添加新配置。名称可以写 `MiniMax`，API 地址填写 MiniMax 的 Anthropic 兼容端点，认证 Key 填写刚创建的 MiniMax API Key。',
                image: CLAUDE_CODE_MINIMAX_IMAGES[3]
            },
            {
                title: '（七）确认模型名称并启用配置',
                body: '模型名称填写 `MiniMax-M2.7`，保存后启用这个配置。启用后再打开 Claude Code，会读取你当前启用的模型服务商配置。',
                image: CLAUDE_CODE_MINIMAX_IMAGES[4]
            },
            {
                title: '（八）创建 Claude Code 首次引导配置',
                body: '如果首次启动时一直卡在 onboarding，可以在用户目录创建 `.claude.json`，写入下面的内容，表示已经完成首次引导。',
                code: `{
  "hasCompletedOnboarding": true
}`,
                image: CLAUDE_CODE_MINIMAX_IMAGES[5]
            },
            {
                title: '（九）启动 Claude Code',
                body: '进入你的项目目录后运行 `claude`。第一次进入项目时，Claude Code 会询问是否信任当前文件夹，确认目录无误后选择信任。',
                code: `cd D:\\你的项目
claude`,
                image: CLAUDE_CODE_MINIMAX_IMAGES[6]
            },
            {
                title: '（十）验证是否接入成功',
                body: '在 Claude Code 里输入一个简单任务，例如让它解释当前项目结构或读取一个文件。如果没有再出现连接 Anthropic 的报错，并且能正常返回内容，就说明 Claude Code 已经接入 MiniMax。'
            },
            {
                title: '（十一）常见问题',
                list: [
                    '`npm` 不是内部或外部命令：重新安装 Node.js，并确认安装时勾选加入 PATH。',
                    '`claude` 不是内部或外部命令：重新打开 PowerShell，再运行 `npm config get prefix` 检查全局安装路径是否在 PATH 中。',
                    'API Key 报错：重新复制 MiniMax API Key，确认没有多余空格，也确认 Coding Plan 已开通。',
                    '模型不可用：确认模型名写的是 `MiniMax-M2.7`，并确认 API 地址和账号区域匹配。',
                    '不需要每次重新配置：`settings.json` 或 CC-Switch 配置保存后，后续直接在项目目录运行 `claude` 即可。'
                ]
            }
        ],
        notes: [
            '本教程只写 Windows 版安装与 MiniMax 接入流程。',
            'MiniMax API Key 属于敏感信息，只放在本机配置里，不要写进项目文件。',
            '如果使用国际站账号，把端点切换为 `https://api.minimax.io/anthropic`。'
        ],
        sourceUrl: 'https://platform.minimax.io/docs/token-plan/claude-code',
        sourceLabel: 'MiniMax Claude Code 文档',
        skillDocPurpose: '这个条目不是一个可安装 Skill，而是能力库中的配置教程。它把 Windows 版 Claude Code 实操文档整理成一篇 Markdown 风格教程，帮助读者完成 MiniMax 模型接入。'
    },
    'mcp-server-fetch': {
        name: '网页内容抓取（MCP）',
        slug: 'mcp-server-fetch',
        headline: '给 Claude Code 补上最基础的网页抓取能力，装好之后就能直接读取 URL 内容和 JSON 返回。',
        scenario: '适合读单页网页、文档页、API JSON，以及给其它 Skill 补联网输入。',
        overview: '它本质上是最轻量的联网入口。先把 fetch server 接进 Claude Code，后面不管是网页摘要、资料整理还是研究流程，AI 都能先把网页内容拿下来，而不是只靠记忆回答。',
        useCases: ['读取单个网页内容', '抓取 JSON API 返回', '给研究类 Skill 补网页输入'],
        gettingStarted: ['先把 MCP 服务注册到 Claude Code', '用一个普通网页和一个 JSON 接口各试一次', '如果是强动态页面，再升级到更重的浏览器类工具'],
        installCommand: 'claude mcp add search -- npx -y @modelcontextprotocol/server-fetch',
        installHint: '这条命令会把 fetch server 注册成 `search` MCP。执行后重新打开会话或刷新客户端，通常更稳。',
        sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
        skillDocPurpose: '这个 Skill 的说明重点在于把“先给客户端加联网抓取能力”这件事说清楚，让 AI 能真的去读网页，而不是继续只凭模型记忆作答。',
        relatedSlugs: ['search-first', 'market-research'],
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它更像一个“能力开关”而不是普通内容 Skill。装好之后，后续很多联网任务都会直接受益。',
        preparation: [
            '先在 Claude Code 环境里执行安装命令。',
            '准备一个普通网页 URL 和一个 JSON 接口作为测试样例。',
            '执行完命令后，重新开始一次会话，确认 MCP 已生效。'
        ],
        promptExample: `安装完成后，可以直接这样测试：
1. 帮我抓一下这个网页的正文并用中文总结重点：https://modelcontextprotocol.io/introduction
2. 读取这个 JSON 接口，并告诉我里面有哪些主要字段：https://example.com/data.json`,
        resultSummary: '配置生效后，Claude Code 就能直接读取网页或 JSON 内容，再继续做总结、抽取或整理。',
        resultBullets: [
            '很适合当作第一个联网 MCP 来上手。',
            '适合轻量读取，不适合需要登录、点击和复杂交互的页面。',
            '如果读取失败，先检查客户端是否已重载 MCP，再检查目标站点限制。'
        ],
        notes: [
            '后续如果你要处理复杂动态网页，可以再升级到 Playwright 一类浏览器型 MCP。'
        ]
    }
};
